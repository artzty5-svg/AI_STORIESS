#!/usr/bin/env bash
# Render wrapper: ./scripts/render.sh <CompositionId> [output.mp4] [frame-range]
#   ./scripts/render.sh TestComposition
#   ./scripts/render.sh ThreeTestComposition output/three.mp4 0-299
set -euo pipefail
cd "$(dirname "$0")/.."

COMPOSITION="${1:?usage: scripts/render.sh <CompositionId> [output.mp4] [frame-range]}"
OUTPUT="${2:-output/${COMPOSITION}.mp4}"
FRAMES="${3:-}"

ARGS=(render src/remotion/index.ts "$COMPOSITION" "$OUTPUT" --codec=h264 --pixel-format=yuv420p)
[ -n "$FRAMES" ] && ARGS+=(--frames="$FRAMES")

mkdir -p "$(dirname "$OUTPUT")"
npx remotion "${ARGS[@]}"

echo
echo "== verifying $OUTPUT =="
ffprobe -v error \
  -show_entries stream=codec_name,width,height,r_frame_rate,nb_frames,pix_fmt \
  -show_entries format=duration,size \
  -of default=noprint_wrappers=1 "$OUTPUT"
ffmpeg -v error -i "$OUTPUT" -f null -
echo "decode: OK (no errors)"
