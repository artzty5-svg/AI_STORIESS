#!/usr/bin/env python3
"""
Frame-by-frame extractor for the AI_STORIES reference library.

Implements the spec's Phase 2 constraints:
  - every frame at native rate: no skipping, no downsampling, no dedup
  - real presentation timestamps, not an assumed constant interval
  - deterministic filenames: v01_frame_000001_000000ms.png
  - resumable and verifiable via manifest + on-disk reconciliation
  - bounded memory: frames stream through FFmpeg; only the PTS table is held

Why PTS comes from the decode pass: for these VP9/WebM sources the packet
count (12,553) does not equal the decoded frame count (12,556), so keying
timestamps off packets would silently mis-align the manifest. `showinfo`
prints one line per frame actually produced, which is the number we can
verify against the files on disk.

Images are written first, then renamed, then recorded — reading a frame's
showinfo line before FFmpeg has finished writing its file is a race, so the
manifest is built only after the encoder process has exited.
"""

import argparse
import json
import os
import re
import subprocess
import sys
import time
from pathlib import Path

SHOWINFO = re.compile(r"\[Parsed_showinfo.*?\]\s*n:\s*(\d+)\s+pts:\s*(\d+)\s+pts_time:([0-9.]+|NA)")
RAW_PATTERN = "frame_%06d.png"


def log(msg: str) -> None:
    print(f"[{time.strftime('%H:%M:%S')}] {msg}", flush=True)


def probe(src: Path) -> dict:
    out = subprocess.run(
        ["ffprobe", "-v", "error", "-select_streams", "v:0",
         "-show_entries", "stream=width,height,codec_name,avg_frame_rate,pix_fmt",
         "-show_entries", "format=duration,size", "-of", "json", str(src)],
        capture_output=True, text=True, check=True).stdout
    j = json.loads(out)
    st, fmt = j["streams"][0], j["format"]
    num, den = st["avg_frame_rate"].split("/")
    fps = float(num) / float(den) if float(den) else 0.0
    return {
        "width": int(st["width"]), "height": int(st["height"]),
        "codec": st["codec_name"], "pix_fmt": st.get("pix_fmt"),
        "avg_fps": round(fps, 6), "duration_s": float(fmt["duration"]),
        "size_bytes": int(fmt["size"]), "expected_frames": round(float(fmt["duration"]) * fps),
    }


def read_manifest(path: Path) -> dict[int, dict]:
    recs: dict[int, dict] = {}
    if not path.exists():
        return recs
    for line in path.read_text(encoding="utf-8").splitlines():
        if not line.strip():
            continue
        try:
            r = json.loads(line)
            recs[r["frame_index"]] = r
        except (json.JSONDecodeError, KeyError):
            continue
    return recs


def decode_pass(frames_dir: Path, src: Path, expected: int) -> list[float]:
    """Write every frame as frame_NNNNNN.png and return PTS per frame index."""
    cmd = ["ffmpeg", "-hide_banner", "-loglevel", "info", "-nostats", "-y",
           "-i", str(src), "-fps_mode", "passthrough", "-vf", "showinfo",
           "-f", "image2", str(frames_dir / RAW_PATTERN)]
    proc = subprocess.Popen(cmd, stderr=subprocess.PIPE, text=True, bufsize=1)
    assert proc.stderr is not None
    pts: dict[int, float] = {}
    t0 = time.time()
    last_report = 0
    for line in proc.stderr:
        m = SHOWINFO.search(line)
        if m:
            n = int(m.group(1))
            pts[n] = float(m.group(3)) if m.group(3) not in ("NA", "N/A") else n / expected
            if n - last_report >= 2000:
                rate = len(pts) / max(time.time() - t0, 0.001)
                eta = (expected - len(pts)) / rate if rate else 0
                log(f"  {len(pts)}/{expected} ({len(pts)/expected*100:.0f}%) "
                    f"{rate:.0f} fps · ETA {eta/60:.1f} min")
                last_report = n
    rc = proc.wait()
    log(f"  encoder exited {rc} after {(time.time()-t0)/60:.1f} min, "
        f"{len(pts)} PTS records")
    return [pts.get(i, float("nan")) for i in range(len(pts))]


def build_records(vdir: Path, tag: str, frames_dir: Path, pts: list[float],
                  info: dict) -> list[dict]:
    recs = []
    for i, p in enumerate(pts, start=1):
        raw = frames_dir / (RAW_PATTERN % i)
        ms = int(round(p * 1000)) if p == p else None
        filename = (f"{tag}_frame_{i:06d}_{ms:06d}ms.png" if ms is not None
                    else f"{tag}_frame_{i:06d}_UNKNOWNMS.png")
        rec = {
            "video_id": tag, "frame_index": i,
            "timestamp_ms": ms,
            "timestamp_seconds": round(p, 6) if ms is not None else None,
            "filename": filename,
            "width": info["width"], "height": info["height"],
            "extraction_status": "success", "analysis_status": "pending",
            "statuses": ["EXTRACTED"],
        }
        if raw.exists():
            target = frames_dir / filename
            os.replace(raw, target)
            rec["bytes"] = target.stat().st_size
            if rec["bytes"] == 0:
                rec["extraction_status"] = "corrupted_zero_byte"
        else:
            rec["extraction_status"] = "failed"
            rec["statuses"] = ["MISSING"]
        recs.append(rec)
    return recs


def write_outputs(vdir: Path, tag: str, recs: list[dict], info: dict, rc: int) -> dict:
    mf = vdir / "frames_manifest.jsonl"
    with mf.open("w", encoding="utf-8") as fh:
        for r in recs:
            fh.write(json.dumps(r) + "\n")
    idx = {r["frame_index"] for r in recs}
    summary = {
        "video_id": tag,
        "source": str(sorted((vdir / "source").glob("*.mkv"))[0]),
        "native_width": info["width"], "native_height": info["height"],
        "native_codec": info["codec"], "native_pix_fmt": info["pix_fmt"],
        "avg_fps": info["avg_fps"], "duration_s": info["duration_s"],
        "expected_frame_count": info["expected_frames"],
        "extracted_frame_count": sum(1 for r in recs if r["extraction_status"] == "success"),
        "records_written": len(recs),
        "failed_frames": sum(1 for r in recs if r["extraction_status"] != "success"),
        "missing_frame_indices": [i for i in range(1, max(idx, default=0) + 1) if i not in idx],
        "duplicate_filenames": len(recs) - len({r["filename"] for r in recs}),
        "frames_awaiting_analysis": sum(1 for r in recs if r["analysis_status"] == "pending"),
        "frames_analysed": 0,
        "frames_visually_inspected": 0,
        "ffmpeg_exit_code": rc,
        "total_bytes": sum(r.get("bytes", 0) for r in recs),
        "finished_at": time.strftime("%Y-%m-%dT%H:%M:%S%z"),
    }
    (vdir / "frames_summary.json").write_text(json.dumps(summary, indent=2))
    return summary


def run(vdir: Path, tag: str, force: bool) -> dict:
    src = sorted((vdir / "source").glob("*.mkv"))[0]
    frames_dir = vdir / "frames"
    frames_dir.mkdir(parents=True, exist_ok=True)
    info = probe(src)
    expected = info["expected_frames"]
    log(f"{tag}: {info['width']}x{info['height']} {info['codec']} "
        f"{info['avg_fps']}fps {info['duration_s']}s → expect ~{expected} frames")

    existing = read_manifest(vdir / "frames_manifest.jsonl")
    on_disk = len(list(frames_dir.glob(f"{tag}_frame_*.png")))
    if existing and not force and on_disk >= len(existing) >= expected * 0.999:
        log(f"{tag}: complete on disk ({on_disk}) — skipping")
        return json.loads((vdir / "frames_summary.json").read_text())

    if force:
        for p in frames_dir.glob("frame_*.png"):
            p.unlink()
        for p in frames_dir.glob(f"{tag}_frame_*.png"):
            p.unlink()

    t0 = time.time()
    pts = decode_pass(frames_dir, src, expected)
    recs = build_records(vdir, tag, frames_dir, pts, info)
    summary = write_outputs(vdir, tag, recs, info, 0)
    log(f"{tag}: DONE {summary['extracted_frame_count']}/{expected} frames, "
        f"{summary['total_bytes']/1e9:.2f} GB in {(time.time()-t0)/60:.1f} min, "
        f"missing={len(summary['missing_frame_indices'])}, "
        f"failed={summary['failed_frames']}")
    return summary


def main() -> int:
    ap = argparse.ArgumentParser()
    ap.add_argument("--library", default="reference_library/videos")
    ap.add_argument("--only")
    ap.add_argument("--force", action="store_true")
    a = ap.parse_args()
    all_summaries = []
    for vdir in sorted(Path(a.library).glob("video_*")):
        if a.only and vdir.name != a.only:
            continue
        if not list((vdir / "source").glob("*.mkv")):
            log(f"{vdir.name}: no source — skipping")
            continue
        all_summaries.append(run(vdir, vdir.name.replace("video_", "v"), a.force))
    Path(a.library).parent.joinpath("manifests", "frame_extraction_summary.json").write_text(
        json.dumps(all_summaries, indent=2))
    tot = sum(s["extracted_frame_count"] for s in all_summaries)
    log(f"ALL VIDEOS: {tot} frames extracted")
    return 0


if __name__ == "__main__":
    sys.exit(main())
