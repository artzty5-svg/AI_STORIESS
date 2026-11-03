# AUDIT_CONTINUE.md — YouTube Style Reverse-Engineering Audit

**Handover file. Single source of truth for resuming work.**
Written: 2026-11-03, end of session.
Resume trigger: user says **"CONTINUE THE AUDIT"** → read this file first, then verify actual project state before doing anything.

---

## 0. HOW TO RESUME — READ THIS FIRST

1. Read this file completely.
2. Run the **state verification block** in §8 to confirm nothing changed overnight.
3. Do **not** re-run anything listed in §3 as completed. The expensive parts are done and their outputs are on disk.
4. Do **not** ask the user to re-explain the project. Everything needed is here or in `reference_library/EXECUTION_PLAN_GAP_AUDIT.md`.
5. Start at **§7 step 1**.
6. **Standing gate:** the user has *not* yet approved the revised plan. §7 step 1 is "present for approval", not "execute extraction". Do not run Phase 2 frame extraction across all 14,820 frames before that approval.

---

## 1. PROJECT STATUS

### 1.1 Location and configuration

| Item | Value |
|---|---|
| Project root | `/Users/oswaldo/Desktop/AI_STORIES` |
| Analysis library | `/Users/oswaldo/Desktop/AI_STORIES/reference_library/` |
| Git repository | **No** (not a git repo — no commits, no branches, no undo safety net) |
| Platform | macOS 27.2 (build 26B123), arm64 |
| Machine | Apple M5, 10-core, 16 GB RAM (17,179,869,184 bytes) |
| Disk free at handover | **741 GB** (`df -H`, /System/Volumes/Data) |
| Node | v24.18.0 |
| FFmpeg | 9.x — **`-vsync` is REMOVED; use `-fps_mode passthrough`** |
| Python | 3.15.2 — **PIL ✓, numpy ✓, scipy ✗ (NOT installed)** |

### 1.2 Installed dependencies (from `package.json`, verified)

```
@react-three/drei ^10.7.9      @react-three/fiber ^9.8.2
@remotion/cli ^4.0.540         @remotion/player ^4.0.540
@remotion/three ^4.0.540       remotion ^4.0.540
react ^19.3.1                  react-dom ^19.3.1
three ^0.187.0                 @types/three ^0.187.0
typescript ^5.9.3              @types/react ^19.3.0   @types/react-dom ^19.3.0
```

Nothing was installed, upgraded or removed during this session.

### 1.3 Production target (locked by user)

`src/utils/videoSpec.ts` (verified current content):

```ts
export const FPS = 30;
export const WIDTH = 1920;
export const HEIGHT = 1080;
export const DEFAULT_DURATION_IN_SECONDS = 60;
export const DEFAULT_DURATION_IN_FRAMES = FPS * DEFAULT_DURATION_IN_SECONDS;
export const videoSpec = { width: WIDTH, height: HEIGHT, fps: FPS,
                           durationInFrames: DEFAULT_DURATION_IN_FRAMES } as const;
```

**1920×1080 landscape, 16:9, 30 fps, 60 s = 1,800 frames, MP4/H.264.** The user said "1920×1080 landscape MY TARGET IS THIS ONLY". This overrides the `cartoon-3d-short` skill's 1440×2560 rule and any earlier 1080×1920 portrait note.

### 1.4 Selected reference video — PRIMARY AND ONLY

| Field | Value | Source of truth |
|---|---|---|
| Slot | `video_03` | directory |
| Title | **What if You're The Last Guy on Earth?** | `info.json` |
| YouTube ID | `XbXiFizyGko` | `info.json` |
| URL | https://youtu.be/XbXiFizyGko | user-supplied |
| Channel | Awaken (uploader `@Afterimath`, channel_id `UCAGRnC0u-hiBa7eUvrFtFow`) | `info.json` |
| Upload date | 20261027 | `info.json` |
| Views / likes | 515,715 / 8,018 | `info.json` |
| Container duration | **494.021 s** (8:14.021) | ffprobe `format.duration` |
| **Decoded frame count** | **14,820** | ffprobe `-count_frames` → `nb_read_frames` (full decode, exit 0) |
| Resolution | 1920×1080 | ffprobe |
| Frame rate | 30 fps constant (`avg_frame_rate=15931/531` = 30.0019 — ms-quantization artefact, see §3.1) | ffprobe + prior PTS analysis |
| Video codec | **vp9 Profile 0**, `yuv420p(tv, bt709)`, 8-bit | ffprobe |
| Audio codec | **opus**, 48,000 Hz, stereo | ffprobe |
| File size | 174,166,559 bytes | `ls -la` |
| Format bitrate | 2,820,391 bit/s | ffprobe |
| Chapters | 0 | `info.json` |
| Subtitles (manual) | none | `info.json` |
| **Auto-captions** | **`en` and `en-orig` available, `.json3`** | `info.json` (157 language codes total) |
| Source path | `reference_library/videos/video_03/source/XbXiFizyGko.mkv` | verified present |
| Metadata path | `reference_library/videos/video_03/metadata/XbXiFizyGko.info.json` (702,176 bytes) | verified present |

Meets the "at least 6 minutes" requirement (494 s = 8 min 14 s).

### 1.5 The other two videos — EXCLUDED, PRESERVED

Both remain on disk, byte-intact, **not deleted**. Marked excluded from this sprint only.

| Slot | ID | Title | Duration | Decoded frames | Size | Status |
|---|---|---|---|---|---|---|
| `video_01` | `6oZ9fdM0n50` | Can 2 People Really Restart Humanity? | 418.461 s | 12,553 | 112,968,978 B | **EXCLUDED — file preserved** |
| `video_02` | `fFziW8Hgf84` | What if You Were The Last Girl On Earth? | 488.261 s | 14,647 | 177,518,236 B | **EXCLUDED — file preserved** |

All three are the same channel, same 1920×1080 VP9/Opus WebM/MKV profile, so the excluded files stay directly comparable for a later sprint. Their `.mkv` + `.info.json` are untouched.

---

## 2. IMPORTANT PROJECT REQUIREMENTS (BINDING)

Repeat these to yourself before acting. All still in force:

1. **Preserve the existing working environment. Do not reinstall or recreate the project.** The Remotion/Three/FFmpeg stack is installed and verified working; `npm install` from scratch is not needed and is forbidden.
2. **Do not delete source videos or completed work.** No `rm` on `videos/*/source/`, `manifests/`, or any `.md` deliverable.
3. **3–5 hour target** for the initial research sprint, *where technically achievable*. Do not manipulate estimates to hit it. It is now genuinely achievable (§5).
4. **Keep skills / subagents / MCP investigation in scope** (Phase 13). Do not prematurely reduce it. Its content must be informed by what the style analysis actually discovers.
5. **Keep Phases 17–21 unchanged** — full scope, deliverables and validation work. Not optional follow-ups.
6. **Do not begin story or video production.** Analysis and documentation only.
7. **Never claim every frame was visually inspected** when only machine analysis was performed. **14,820 frames were machine-analysed; exactly 28 distinct frames have been visually inspected by a model** (12 scattered + frame n=362 + 15 calibration). These are different statuses and must be recorded separately in every manifest.
8. **Do not invent style-match percentages.** Any score needs a defined, validated method first.
9. **Do not install large models or paid services without approval.** Nothing has been installed this session.
10. **Do not silently skip or substitute frames.** Extraction must be verified count-for-count.
11. **Do not modify original reference-video dimensions.** Sources stay 1920×1080.
12. **Never present numerical analysis as visual understanding.** Keep the four categories distinct: genuine visual understanding / image metadata extraction / numerical image analysis / motion-signal analysis.
13. **Do not invent Qoder capabilities, MCP interfaces, skill formats or agent APIs.** Inspect what is actually installed.
14. **Stop and report if disk space is insufficient** before consuming all storage.

---

## 3. COMPLETED WORK

### 3.1 Verified frame counts (closes two earlier errors)

- **42,026 → 42,020** across three videos (the original figure was derived from `duration × fps` on rounded container metadata). Per-video decode-validated counts: 12,553 + 14,647 + 14,820 = 42,020.
- **Root cause:** container duration includes the audio tail (418.461 s) beyond the video stream (418.433 s). Never derive frame count from `duration × fps`.
- **"packets ≠ decoded frames" was wrong** — `nb_read_packets == nb_read_frames` for all three. `showinfo`/`metadata=print` is still the correct PTS source.
- **VFR question CLOSED:** exactly 2 distinct PTS intervals per video (33/34 ms). 8368×33 + 4184×34 = 418,400 ms = full span; mean 33.3333 ms. This is millisecond quantization of **constant 30 fps in a `time_base 1/1000` WebM**, not variable frame rate.
- **Sources are VP9, not H.264** — changes the decode-cost model and forces explicit colour management.

### 3.2 Full-timeline machine analysis of video_03 — COMPLETE

Command used (single shared-decode pass via `split`, so both filters run on one decode):

```bash
ffmpeg -i videos/video_03/source/XbXiFizyGko.mkv -filter_complex \
 "[0:v]split=2[sa][sb];\
  [sa]signalstats,metadata=print:file=manifests/v03_perframe_signalstats.txt[va];\
  [sb]select='gt(scene,0.30)',metadata=print:file=manifests/v03_scene_cuts.txt" \
 -map "[va]" -f null /dev/null
```

**Outputs on disk (verified):**

| File | Size | Content |
|---|---|---|
| `reference_library/manifests/v03_perframe_signalstats.txt` | 12,532,185 B / 429,780 lines | **14,820 frame records** — complete, zero skipped. Fields: `frame`, `pts`, `pts_time`, `YMIN/YLOW/YAVG/YHIGH/YMAX`, `UMIN/ULOW/…`, `VMIN/VLOW/…` |
| `reference_library/manifests/v03_scene_cuts.txt` | 3,611 B / 110 lines | **55 scene cuts** ≥0.30, each with `frame`, `pts`, `pts_time`, `lavfi.scene_score` |
| `reference_library/manifests/v03_timeline_pass.log` | 22,145 B | `/usr/bin/time -l` output + ffmpeg progress |

**Measured performance (this is the number that changed the whole estimate):**

| Metric | Measured value |
|---|---|
| Wall clock for entire 494 s video | **70.41 s** |
| Speed | **7.02× realtime** |
| Peak memory footprint | **193,102,448 B (184 MiB)** |
| Frame records emitted | 14,820 / 14,820 (100%) |

> **Correction to the earlier audit:** `EXECUTION_PLAN_GAP_AUDIT.md` §3 quoted 3.04× realtime / ~7.7 min for this pass. That was two separate full decodes. The `split` filter shares one decode and is **~6.6× faster**. Use 70 s, not 7.7 min.

**Scene-cut timestamps (all 55, seconds):**
`1.333 2.033 4.767 5.766 6.8 8.3 9.3 10.533 12.834 13.467 19.867 20.733 33.1 53.966 59.2 74.3 79.2 86.2 97.633 121.133 122.333 123.2 123.967 130.4 149.267 182.866 184.433 185.666 186.667 191.6 192.567 193.6 195.633 218.466 244.833 244.933 245.0 245.1 250.1 252.667 254.534 257.0 260.167 261.5 263.4 264.533 265.9 268.367 269.767 314.566 320.933 352.733 376.2 400.4 403.7`

**Observations for tomorrow (not yet acted on):**
- Average shot length ≈ 8.8 s. Long takes exist: 149.3→182.9 (33 s), 269.8→314.6 (**45 s**), 320.9→352.7 (32 s).
- Rapid-cut clusters: 244.833 / 244.933 / 245.0 / 245.1 (4 cuts in 0.3 s) and 182.9–195.6 (8 cuts in 13 s).
- **No cut above 0.30 after 403.7 s** — the final 90 s is one long take or uses soft transitions. A **threshold sweep (0.10/0.15/0.20/0.30) is required** before trusting 55 as the shot count; dissolves and whip-pans score below 0.30. The calibration frame `eef405d6.png` is a motion-blurred whip-pan that the 0.30 threshold likely missed.
- The `signalstats` pass emitted a harmless `non monotonically increasing dts to muxer in stream 1` warning from the null muxer. Ignore; it does not affect records.

### 3.3 VISION CAPABILITY — TESTED AND PROVEN (document not yet written)

**This is the most consequential finding of the session.**

#### What was tested and how

**14 image reads across 7 tests** (12 distinct frames plus sub-region crops and downscales), followed by a separate **15-frame throughput calibration** — **28 distinct frames inspected in total**. Ground truth was computed **numerically before** visual claims, and filenames were randomized hex tokens so timeline order could not leak.

| # | Test | Result |
|---|---|---|
| V1 | Blind full-res read of frame n=360 (1920×1080 PNG) | Correct. Reported news studio, "NEWS 9 BREAKING DESK", LIVE badge, 9:43 clock, world map with pink dots + one cyan dot, "MEN ON EARTH 1", "WOMEN ON EARTH 4,100,000,000 STEADY", anchor "MARIA", empty "DAN" seat, "#1 DAD" mug, lower third "EVERY MAN ON EARTH HAS VANISHED" |
| V2 | **Numerical falsification of V1** | Pure-numpy connected-component labelling of the map region: **exactly 1 cyan blob ≥4 px** at (1005, 230) vs **287 pink blobs**. The "one man" claim is grounded, not confabulated |
| V3 | Fine-detail / small-text OCR via crops | `#1 DAD` and `9:43` confirmed at native resolution (4× nearest-neighbour crops) |
| V4 | Adjacent-frame sensitivity (n=360 vs n=362) | 264,142 px changed (>8 threshold). Block change-density grid put max motion at block (row 7, col 1) = x[120-240] y[630-720] = **the anchor character**. Visual inspection independently identified the arm/hand as the moving element — match. Measured arm/torso mask centroid moved only (2.5, −3.6) px → **subtle looping animation, not big movement** |
| V5 | **Subagent vision, contact sheet** | A fresh `general-purpose` subagent read `sheet_4x3.png` (12 tiles at 480×270) and described all 12 slots, grouped scenes, picked busiest/darkest, and **transcribed text from thumbnails** |
| V6 | **Subagent vision, individual frames** | A second fresh subagent read 3 full frames independently. **Cross-validation: both agents independently read the same text on the same frames** from different views — "HAPPY FATHER'S DAY" + "JUNE" calendar (frame 13500) and "LAST MAN ON EARTH FOUND" / "HE'S REAL" / "CITY P.D. LAST MAN #000001" (frame 6900) |
| V7 | **Resolution floor** | Third subagent, blinded to sizes, read 4 downscales of one frame. **320 px wide and 480 px = fully readable. 240 px = main text readable, small caption lost. 160 px = only the largest text survives.** → floor ≈ **320 px tile width** for text-bearing frames |

#### Canary / hallucination results

- Dog / car / rain / live-action footage / real photograph → all correctly answered **ABSENT**. **Zero hallucinated objects across all agents.**
- The orange animal was correctly identified as a **cat, not a dog**.
- On the cut-off "NEW YO…" text, the agent **refused to complete the word** and quoted only what was visible — this is the behaviour we need.
- One agent flagged a motion-blurred whip-pan as **CONFIDENCE: LOW** rather than inventing content.
- Every unverified text claim was later confirmed at full resolution by the main agent (frames `9ed36306.png` and `1aeacf11.png`).

#### Capability verdict

| Question | Answer | Evidence |
|---|---|---|
| Can Qoder inspect images? | **YES — natively, no install** | `Read` tool renders PNG into multimodal context |
| Full-resolution individual frames? | **YES** | V1, V3 |
| Contact sheets with many frames? | **YES, down to ~320 px per tile** | V5, V7 |
| Characters / objects / environments / VFX / composition / pose / lighting / camera? | **YES** | V5, V6, calibration run — all 8 fields populated with plausible, cross-validated detail |
| Distinguish similar frames? | **YES, and correctly reports when they are near-identical** | V4 |
| Native or extra MCP/plugin? | **Native.** No vision MCP needed | — |
| Local or cloud? | **Cloud.** The session model is a hosted model; images leave the machine. No local VLM is installed. `local_image_provider` MCP is **generation-only**, it has no vision/analysis tool | MCP tool list: only `generate_image` + `local_image_status` |
| Batch limits | **No degradation observed** at 6 images in one main-agent turn; 5 images per subagent turn worked reliably | this session |
| Model identity | **Not exposed.** `manage_app_setting` surfaces only `chatSession.recapModelKey` and `workbench.taskMonitor.recap`; the runtime does not disclose the session model identifier and product policy prevents asserting an underlying model name. **Capability is proven empirically instead — which is what actually matters for the plan.** | settings list call |

**Consequence for the architecture:** no model installation, no paid service, no external vision MCP is required. The inspection pipeline is `ffmpeg → PNG → Read tool / parallel subagents`. This removes decision **D-01** (transcription model) as a blocker too, because YouTube already provides `en` auto-captions as `.json3` — a network fetch, not an install.

### 3.4 Throughput calibration — MEASURED

15 frames (timestamps 20/60/95/130/165/205/245/290/330/370/415/440/465/480/492 s) inspected by **3 parallel `general-purpose` subagents, 5 frames each**, using a fixed 11-field observation schema.

| Metric | Measured |
|---|---|
| Wall clock, 15 frames, 3 workers | **70 s** |
| Per frame, effective at 3-way parallelism | **4.7 s** |
| Per 5-frame agent batch | **23 s** |
| Structured output quality | All 15 blocks complete, 11 fields each, with exact text quotes and confidence ratings |

The 11-field schema that worked (reuse verbatim):
`SUBJECT / CHARACTERS / ENVIRONMENT / COMPOSITION / LIGHTING / CAMERA / VFX / TEXT_READABLE / PALETTE / CONFIDENCE`

### 3.5 Landscape re-target — MOSTLY DONE, 2 ITEMS OPEN

Verified with two full 1,800-frame renders plus clean full decodes plus real visual inspection.

**Open defects:**
- **`src/scenes/TestScene2D.tsx` HUD/subtitle collision.** HUD bar at lines 35-37 sits at `bottom: 140, left/right: 90, height: 10` → occupies y 930-940; subtitle baseline ≈915. The white bar draws **through** "Remotion · Three.js · FFmpeg". Visually confirmed at frame 900.
- **Root cause is `src/components/TitleCard.tsx`:** absolute-pixel vertical stack ≈800 px = 74% of 1080 px (`gap: 28`, `image: 620×620`, `title: fontSize 92`, `subtitle: fontSize 40`).
- **No safe-area / title-safe system exists anywhere in the project.**
- **`scripts/verify-env.sh` has zero resolution assertions** (13 `check` calls, none about dimensions) → a portrait regression would pass silently.
- **`scripts/render.sh` asserts nothing** — it probes and runs `ffmpeg -v error -i OUT -f null -` but a wrong-resolution render still exits 0.
- **`src/remotion/RemotionRoot.tsx:8` comment still says "1080x1920 @ 30fps by default"** — stale, must be corrected.

### 3.6 Files and folders actually created this session

```
reference_library/EXECUTION_PLAN_GAP_AUDIT.md              63,511 B   (v1 — NEEDS REVISION, see §4)
reference_library/manifests/v03_perframe_signalstats.txt 12,532,185 B  14,820 records
reference_library/manifests/v03_scene_cuts.txt              3,611 B   55 cuts
reference_library/manifests/v03_timeline_pass.log          22,145 B   timing evidence
reference_library/vision_test/                              ~31 MB    43 PNG (28 top-level + 15 calib) + 3 JSON
reference_library/vision_test/calib/                        16 files  15 PNG + TRUTH.json
```

`vision_test/` contents: 12 scattered frames (`GROUND_TRUTH_frames.json` maps token→t→frame), 3 consecutive-frame pairs (`seq_*`, `seqb_*`), 4 crops, 1 diff heatmap, 4 downscales, 1 contact sheet (`sheet_4x3_ORDER.json` holds the hidden slot order), 15 calibration frames.

**Total new disk: ~43 MB. Nothing deleted.**

### 3.7 Pre-existing completed work (from earlier sessions — DO NOT REDO)

- Full environment install and 10-step verification, including a real rendered MP4 probe.
- `SETUP_AUDIT.md` written with real evidence.
- Remotion root with **4 compositions** (`TestComposition` 1800f, `ThreeTestComposition` 1800f, `SmokeAudioComposition` 90f, `SmokeFontComposition` 30f), all `width={WIDTH} height={HEIGHT}`.
- Three.js ↔ Remotion integration via `@remotion/three` `ThreeCanvas`, deterministic per-frame WebGL stepping.
- `reference_library/` skeleton: 24 directories, all empty except `scripts/`, `manifests/`, `vision_test/`, `videos/`.
- `reference_library/scripts/extract_frames.py` (8,849 B) — written, tested, **has one known bug (§4.1)**.
- Three source `.mkv` files + three `.info.json` acquired and byte-intact.

### 3.8 Hard-won technical constraints (do not re-derive these)

- `Config` must be imported from `@remotion/cli/config`; the core export is a Proxy that warns and `process.exit(1)`s.
- FFmpeg 9: `-vsync` removed → `-fps_mode passthrough`. **No `drawtext`, no `subtitles`, no `ass`** (built without libfreetype) — cannot burn labels with ffmpeg here.
- Colour management is mandatory: sources are `yuv420p(tv, bt709)`; PNG output is `rgb24(pc, gbr/bt709)`. A tv↔pc reinterpretation silently corrupts **every** palette conclusion. Always state the range.
- `showinfo` / `metadata=print` emits authoritative per-frame `pts_time` in the same pass that writes images.
- zsh: an unmatched glob **aborts the whole `&&` chain** and prints a misleading exit code (this faked an ffmpeg failure once). `--include=*.ts` needs quoting or the Grep tool.
- chrome-headless-shell cannot serve `chrome://`, so `remotion gpu` needs `--browser-executable` pointing at system Chrome.
- Never pipe verification output to `tail` — it hides failures.

---

## 4. PENDING WORK

### 4.1 Unresolved technical issues

| ID | Issue | Severity |
|---|---|---|
| **BUG-1** | `reference_library/scripts/extract_frames.py:205` — `Path(a.library).parent.joinpath("manifests", "frame_extraction_summary.json")` steps **OUT** of the library. In production it writes `~/Desktop/AI_STORIES/manifests/…` instead of `reference_library/manifests/…`. **Verified failure:** 300/300 frames extracted correctly, then `FileNotFoundError` + exit 1. Fix: `Path(a.library) / "manifests" / …`, create the dir, and make the summary write non-fatal | **HIGH — blocks Phase 2** |
| **BUG-2** | Resume/verification threshold is 99.9% → would **silently accept 12 missing frames** in video_01. Must be exact-count | HIGH |
| **BUG-3** | No per-file PNG verification, no checkpointing, no monotonic-PTS assertion in the extractor | MEDIUM |
| **GAP-1** | `reference_library/index/` directory does not exist — no searchable index layer | MEDIUM |
| **GAP-2** | No frame-selection script yet (the 300–400 selector) | HIGH — this is tomorrow's step 2 |
| **GAP-3** | Scene threshold 0.30 unvalidated; sweep 0.10–0.30 needed | MEDIUM |
| **GAP-4** | `verify-env.sh` / `render.sh` assert nothing about resolution | MEDIUM |
| **OPEN-1** | `TestScene2D` HUD/subtitle collision + no safe-area system | MEDIUM (blocks production, not analysis) |
| **OPEN-2** | `RemotionRoot.tsx:8` stale portrait comment | LOW |

### 4.2 Documentation still to write

| Document | Status |
|---|---|
| `reference_library/VISION_CAPABILITY_AUDIT.md` | **NOT WRITTEN.** All evidence exists (§3.3). Required deliverable — §7 step 1 |
| `reference_library/EXECUTION_PLAN_GAP_AUDIT.md` | v1 exists (63,511 B) but is **superseded**: still assumes three videos, 42,020 frames, ~800 inspections, and the wrong 3.04×/7.7 min machine rate. Needs revision per §6 of the user's revision request |
| `reference_library/PROJECT_BASELINE_AUDIT.md` | Phase 0 — data gathered, **not written** |
| `reference_library/videos/video_03/metadata/ACQUISITION_RECORDS.md` | Phase 1 — data gathered (§1.4), **not written** |
| Frame-selection manifest | **not created** |
| All Phase 3–21 deliverables | **not started** |

### 4.3 Remaining phases and dependencies

| Phase | Deliverable | Blocked by |
|---|---|---|
| 2 | Extract 14,820 PNG frames + manifest | BUG-1, BUG-2, user approval |
| 3 | Scene/shot segmentation, temporal continuity | §3.2 data ✓, GAP-3 |
| 4 | Channel intelligence | Phase 3 |
| 5 | Master visual style | Phases 2–3 + inspection |
| 6 | VFX library | inspection (cost driven by how many effects the cut list reveals) |
| 7 | Animation dynamics | inspection + motion analysis |
| 8 | Lighting + cinematography | inspection |
| 9 | Storyboard / story analysis | inspection |
| 10 | Audio style guide | audio pass (ebur128/silencedetect) — **not yet run on video_03** |
| 11 | Production technique mapping | Phases 5–10 |
| 12 | Reference boards | Phases 5–9 |
| 13 | Skills / agents / MCP architecture | **must stay in scope**; informed by Phases 5–11 |
| 14 | Permanent reference library | all above |
| 15 | Master style bible | Phase 14 |
| 16 | QA consistency engine | Phase 15 |
| 17–21 | Validation, deliverable checks, final audit | **UNCHANGED — do not downgrade** |

### 4.4 Open decisions for the user

| ID | Question | Current recommendation |
|---|---|---|
| **D-01** | Transcription model | **RESOLVED-ISH — no install needed.** Use YouTube `en` auto-captions (`.json3`) via a network fetch. Needs approval for the fetch only |
| **D-02** | Fix `TestScene2D`/`TitleCard` layout + add safe-area? | Yes, but it blocks production not analysis — schedule after the sprint |
| **D-03** | Install OpenCV (~60 MB, no model weights)? | **Optional.** Unlocks dense optical flow + object tracking. ffmpeg-only already covers scene/motion/colour/brightness |
| **D-04** | Inspection budget | **Now 300–400 (user set).** At 4.7 s/frame this is 24–32 min — cheap. Recommend **400** |
| **D-05** | Re-download sources as H.264? | **No.** VP9 decodes fine at 7× realtime |
| **D-06** | PNG vs JPEG archive | **PNG** (lossless, colour fidelity is the whole point). 13.84 GB is affordable against 741 GB free |
| **D-07** | Approve Phase 2 extraction of 14,820 frames | **Still needs explicit approval.** ~13.84 GB, ~3.4 min machine time |

---

## 5. PERFORMANCE AND TIME ESTIMATES

### 5.1 MEASURED (evidence on disk)

| Operation | Measured rate | Cost for video_03 (14,820 frames) | Peak RSS |
|---|---|---|---|
| **Full-timeline signalstats + scene detect** (one shared decode) | **7.02× realtime** | **70 s** | 184 MiB |
| **AI visual inspection, 3 parallel subagents** | **4.7 s/frame** | **350 frames = 27 min** | n/a |
| PNG frame extraction | 73.4 f/s (2.42× realtime) | **3.4 min** | 247 MB |
| Contact-sheet tiling (96 tiles) | 89.7 tiles/s | ~2.6 min | 204 MB |
| Single PNG frame size | 933,919 B mean (n=26) | **13.84 GB** total | — |

> PNG extraction and contact-sheet rates were measured on the **three-video set** in an earlier session and are being reused here; they are per-frame rates so they transfer, but they have not been re-measured on video_03 alone.

### 5.2 ESTIMATED (flagged as estimates)

| Item | Estimate | Basis |
|---|---|---|
| Audio analysis pass (ebur128 + silencedetect) on video_03 | ~2–4 min | decode-bound, similar to signalstats |
| 300–400 frame selection script | ~20 min agent time | one script, inputs already on disk |
| Per-phase agent documentation writing | 15–40 min/phase | calibrated against this session's audit doc |
| Whole Phase 3–21 documentation | **~4–6 h agent time** | weakest number; ±30% |

### 5.3 Revised total for the initial research sprint

**The 3–5 hour target is achievable.** Breakdown:

| Stage | Machine | Agent | Elapsed |
|---|---|---|---|
| Phase 2 extraction (14,820 PNG) | 3.4 min | 5 min | ~8 min |
| Full-timeline analysis | 1.2 min | 5 min | ~6 min |
| Contact sheets | 2.6 min | 3 min | ~6 min |
| **400-frame AI inspection** | — | **31 min** (parallel) | **~31 min** |
| Phases 3–5 documentation | — | ~50 min | ~50 min |
| Phases 6–11 documentation | — | ~90 min | ~90 min |
| Phases 12–16 | — | ~70 min | ~70 min |
| Phases 17–21 validation | — | ~60 min | ~60 min |
| **TOTAL** | **~8 min** | **~5.4 h** | **≈ 5.5–6.5 h** |

**Honest read:** the *analysis* portion (extraction + inspection + Phases 3–11) fits inside 3–5 h comfortably — roughly **2.5 h**. The **documentation of Phases 12–21** is what pushes the total past 5 h, and it is agent-writing-bound, not machine-bound. If the user wants the whole Phase 0–21 chain inside 5 h, the only honest lever is to split it into **Sprint A (Phases 0–11, ~2.5 h)** and **Sprint B (Phases 12–21, ~3 h)**.

**Previous estimate was ~40 h across three videos.** The drop is real, not optimism: (a) one video not three = 35% of the frames; (b) the timeline pass is 6.6× faster than assumed; (c) AI inspection turned out to be **4.7 s/frame at 3-way parallelism**, not the ~30 s/frame I had assumed; (d) 400 inspections instead of 800.

**Uncertainty:** the 4.7 s/frame figure comes from **one** calibration of 15 frames. Subagent startup latency is amortised over only 5 frames per batch, so larger batches (10–15 frames) should be more efficient, and higher worker counts (6–8) should scale — but neither is measured. Expect ±30%.

### 5.4 Storage projection

| Item | Size |
|---|---|
| video_03 PNG archive (14,820 frames) | **~13.84 GB** |
| Contact sheets | ~2.6 GB (scaled for one video) |
| Manifests + analysis text | <50 MB |
| Documentation | <10 MB |
| **Sprint total** | **~16.5 GB** |
| Free at handover | **741 GB** |
| Headroom | **97.8%** |

Excluding videos 01/02 saved ~25.4 GB of PNG archive.

---

## 6. EXACT EXECUTION POSITION

**Stopped at: the user's revision request, item 7 — "Update `EXECUTION_PLAN_GAP_AUDIT.md` and present for review."**

Items 1–6 of that request are evidence-complete; item 2's deliverable document and item 7's revision are the two writing tasks that were **not** started. The user then asked for this handover instead, and explicitly said **stop and wait**.

| Work item | Status |
|---|---|
| Revision item 1 — select longest video | **COMPLETE** (§1.4) |
| Revision item 1 — coverage assessment | **PARTIAL** — 28 distinct frames inspected across the full timeline; the 8-category coverage write-up is **not written** |
| Revision item 2 — vision tests | **COMPLETE** (§3.3) |
| Revision item 2 — `VISION_CAPABILITY_AUDIT.md` | **NOT STARTED** ← deliverable |
| Revision item 3 — full-timeline automated analysis | **COMPLETE** (§3.2) |
| Revision item 3 — 300–400 selector script | **NOT STARTED** |
| Revision item 4 — skills/agents/MCP unchanged | **COMPLETE** (no change made) |
| Revision item 5 — Phases 17–21 unchanged | **COMPLETE** (no change made) |
| Revision item 6 — recompute time estimate | **COMPLETE** (§5) |
| Revision item 7 — revise gap audit | **NOT STARTED** |
| Phase 0 `PROJECT_BASELINE_AUDIT.md` | **NOT STARTED** (data ready) |
| Phase 1 `ACQUISITION_RECORDS.md` | **NOT STARTED** (data ready) |
| Phase 2 extraction | **0 / 14,820 frames** — not started, needs approval |
| Phases 3–21 | **NOT STARTED** |

**Project-wide completion: ~8%.** This session's revision request: **~55%** (evidence done, two documents unwritten).

### Running processes

**None.** Verified at handover: `ps aux | grep -E "ffmpeg|ffprobe|remotion"` returned nothing. All background tasks completed and were consumed:

- `b7m4k804j` — timeline pass — **completed, outputs on disk, DO NOT RE-RUN**
- Calibration agents A/B/C — **completed, results recorded in §3.4, DO NOT RE-RUN**

Nothing needs resuming. Tomorrow starts fresh from §7 step 1.

---

## 7. TOMORROW'S CONTINUATION CHECKLIST

Ordered. Do not reorder. Step 1 is the first task.

### STEP 1 — Write `reference_library/VISION_CAPABILITY_AUDIT.md`
Copy §3.3 into a standalone document. Must include: the tests, the numerical falsification, the canary results, the 320 px resolution floor, the cloud-not-local statement, the "model identity not exposed" caveat, and the four-way distinction (genuine visual understanding / metadata extraction / numerical analysis / motion-signal analysis).
**Completion criterion:** every capability claim has a named test ID and a file path behind it. No claim of "complete individual visual inspection".

### STEP 2 — Revise `reference_library/EXECUTION_PLAN_GAP_AUDIT.md`
Apply: single-video scope, video_03 identity, 14,820 frames, 300–400 inspections, the **7.02× realtime / 70 s** rate (replacing 3.04× / 7.7 min), the 4.7 s/frame inspection rate, revised Phase 0–21 table, and the four-way labelling (READY / REQUIRES CORRECTION / REQUIRES USER APPROVAL / TECHNICALLY BLOCKED).
**Completion criterion:** no surviving reference to three videos, 42,020 frames, or 800 inspections.

### STEP 3 — Fix BUG-1 and BUG-2
`reference_library/scripts/extract_frames.py:205` → `Path(a.library) / "manifests" / …` + `mkdir` + non-fatal write. Change the 99.9% resume threshold to exact count.
**Validation:** run with `--only video_03` on a **small `--limit`** (e.g. 50 frames) into a scratch dir, confirm exit 0 and that `frame_extraction_summary.json` lands inside `reference_library/manifests/`.
**Completion criterion:** exit 0 and correct manifest path.

### STEP 4 — Write the frame-selection script
`reference_library/scripts/select_inspection_frames.py`. Inputs: `manifests/v03_perframe_signalstats.txt`, `manifests/v03_scene_cuts.txt`, plus a frame-difference pass and a brightness/saturation profile. Select **400** frames by: every scene cut, local maxima of frame difference, character appearance/disappearance, palette outliers, lighting-change points, transition frames, storytelling beats, plus **±1–2 frame neighbours around animation events** where one frame cannot explain movement.
**Must record:** frame number, `pts_time`, selection reason, and the three separate statuses (extracted / machine-analysed / visually-inspected).
**Validation:** assert 400 unique frames, all within 0–14,819, all with a non-empty reason, no silent gaps.
**Completion criterion:** `manifests/v03_inspection_selection.json` written and validated.

### STEP 5 — Present to the user for approval
**STOP HERE AND WAIT.** Phase 2 extraction of 14,820 frames (~13.84 GB) is **D-07 and needs explicit approval.** Do not run it on your own initiative.
Also surface: D-03 (OpenCV), D-04 (confirm 400), D-01 (caption fetch approval), and the Sprint A / Sprint B split from §5.3.

### STEP 6 — After approval: Phase 2 extraction
14,820 PNG at native 1920×1080, `rgb24`, preserving tv/bt709 range. Verify exact count. Do not delete sources.

### STEP 7 — Phase 0 + Phase 1 documents
`PROJECT_BASELINE_AUDIT.md`, `ACQUISITION_RECORDS.md`. All data is in §1 and §3.8 of this file.

### STEP 8 — Coverage assessment (revision item 1, closing)
Against the 8 categories, using the 30 inspected frames + the 400-frame set once available. **Document limitations rather than inventing observations.** Known limitation to state: the last 90 s contains no hard cut ≥0.30, so transition variety there is unproven.

### STEP 9 — Phases 3–11 in order
Run the audio pass (ebur128 + silencedetect) — **not yet done on video_03**. Then inspect in parallel batches of 10–15 frames × 6 workers.

### STEP 10 — Phases 12–21
Keep Phase 13 (skills/agents/MCP) in scope and **informed by** what Phases 5–11 actually found. Keep Phases 17–21 at full scope.

---

## 8. STATE VERIFICATION BLOCK — RUN THIS FIRST TOMORROW

```bash
cd /Users/oswaldo/Desktop/AI_STORIES
echo "=== sources intact (expect 112968978 / 177518236 / 174166559) ==="
stat -f "%z %N" reference_library/videos/*/source/*.mkv
echo "=== timeline analysis outputs (expect 12532185 / 3611 / 22145) ==="
stat -f "%z %N" reference_library/manifests/v03_*
echo "=== frame records: expect 14820 ==="
grep -c "^frame:" reference_library/manifests/v03_perframe_signalstats.txt
echo "=== scene cuts: expect 55 ==="
grep -c "scene_score" reference_library/manifests/v03_scene_cuts.txt
echo "=== archive frames: expect 0 until Phase 2 approved ==="
find reference_library/videos -name "*.png" -path "*frames*" | wc -l
echo "=== disk: expect ~741 GB ==="
df -H . | tail -1
echo "=== no stray processes ==="
ps aux | grep -E "ffmpeg|ffprobe|remotion" | grep -v grep | wc -l
echo "=== deliverables still missing ==="
ls reference_library/VISION_CAPABILITY_AUDIT.md 2>&1
ls reference_library/PROJECT_BASELINE_AUDIT.md 2>&1
```

If the source sizes, the 14,820 record count, and the 55 cut count all match, this handover is trustworthy and §3.2 must **not** be re-run.

---

## 9. KEY FILE PATHS

| Purpose | Path |
|---|---|
| This handover | `/Users/oswaldo/Desktop/AI_STORIES/AUDIT_CONTINUE.md` |
| Gap audit (needs revision) | `/Users/oswaldo/Desktop/AI_STORIES/reference_library/EXECUTION_PLAN_GAP_AUDIT.md` |
| Vision audit (to write) | `/Users/oswaldo/Desktop/AI_STORIES/reference_library/VISION_CAPABILITY_AUDIT.md` |
| Per-frame stats | `/Users/oswaldo/Desktop/AI_STORIES/reference_library/manifests/v03_perframe_signalstats.txt` |
| Scene cuts | `/Users/oswaldo/Desktop/AI_STORIES/reference_library/manifests/v03_scene_cuts.txt` |
| Timing evidence | `/Users/oswaldo/Desktop/AI_STORIES/reference_library/manifests/v03_timeline_pass.log` |
| Extractor (has BUG-1 at :205) | `/Users/oswaldo/Desktop/AI_STORIES/reference_library/scripts/extract_frames.py` |
| Primary source video | `/Users/oswaldo/Desktop/AI_STORIES/reference_library/videos/video_03/source/XbXiFizyGko.mkv` |
| Primary source metadata | `/Users/oswaldo/Desktop/AI_STORIES/reference_library/videos/video_03/metadata/XbXiFizyGko.info.json` |
| Vision test assets | `/Users/oswaldo/Desktop/AI_STORIES/reference_library/vision_test/` |
| Frame ground truth | `/Users/oswaldo/Desktop/AI_STORIES/reference_library/vision_test/GROUND_TRUTH_frames.json` |
| Contact sheet order (hidden) | `/Users/oswaldo/Desktop/AI_STORIES/reference_library/vision_test/sheet_4x3_ORDER.json` |
| Calibration frames | `/Users/oswaldo/Desktop/AI_STORIES/reference_library/vision_test/calib/` |
| Resolution spec (single source of truth) | `/Users/oswaldo/Desktop/AI_STORIES/src/utils/videoSpec.ts` |
| Layout defect | `/Users/oswaldo/Desktop/AI_STORIES/src/scenes/TestScene2D.tsx` (lines 35-37) |
| Layout root cause | `/Users/oswaldo/Desktop/AI_STORIES/src/components/TitleCard.tsx` |
| Stale portrait comment | `/Users/oswaldo/Desktop/AI_STORIES/src/remotion/RemotionRoot.tsx` (line 8) |
| Environment audit (earlier session) | `/Users/oswaldo/Desktop/AI_STORIES/SETUP_AUDIT.md` |

---

## 10. WHAT NOT TO DO

- Do not run `npm install` or rebuild the environment.
- Do not delete or re-download any `.mkv`.
- Do not re-run the timeline pass — its outputs are on disk and correct.
- Do not re-run the vision tests or the throughput calibration.
- Do not extract all 14,820 frames before the user approves D-07.
- Do not install a vision model, Whisper, OpenCV, or any paid service without approval.
- Do not describe machine-analysed frames as visually inspected.
- Do not invent style-match percentages or a 95% figure without a defined, validated scoring method.
- Do not treat one frame's palette as the video's colour identity.
- Do not begin story or animation production.
- Do not downgrade Phases 17–21 to optional.
- Do not drop Phase 13 (skills / agents / MCP).
- Do not use a blanket "100% complete" claim.
