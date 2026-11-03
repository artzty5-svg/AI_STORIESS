# AI_STORIES

Local animation development environment for landscape animated stories.
Remotion (composition + render) · React Three Fiber + Three.js (3D) · FFmpeg (media I/O).
Everything runs on this Mac — no backend, no website, no cloud services.

- Machine: Apple M5, 16 GB RAM, macOS 27.2 (arm64)
- Default output: **1920×1080 (16:9), 30 fps, 60 s, MP4 / H.264**
- Large media under `reference_library/` (`.mkv` sources) is tracked with **Git LFS**.

## Requirements (already installed and verified)

| Tool | Version | Check |
| --- | --- | --- |
| Node.js | v26.13.0 | `node -v` |
| npm | 11.20.0 | `npm -v` |
| TypeScript | 5.9.3 | `npx tsc --version` |
| Remotion | 4.0.540 | `npx remotion versions` |
| FFmpeg / ffprobe | 9.0.2 | `ffmpeg -version` |

## Commands

```bash
npm run verify          # environment self-check (hardware, tools, typecheck, compositions)
npm run studio          # Remotion Studio — interactive preview at http://localhost:3000
npm run typecheck       # tsc --noEmit
npm run compositions    # list registered compositions
npm run test:2d         # render 2 s of TestComposition  -> output/test-2d.mp4
npm run test:three      # render 2 s of ThreeTestComposition -> output/test-three.mp4
npm run test:all        # both test renders

# Render any composition (full 60 s by default)
npx remotion render src/remotion/index.ts <CompositionId> output/<name>.mp4
./scripts/render.sh <CompositionId> [output.mp4] [frame-range]   # renders + ffprobe + decode check
```

## Layout

```text
src/remotion/     entry point + composition registration (registerRoot)
src/scenes/       one file per scene — what a composition draws
src/three/        React Three Fiber objects (pure Three.js props, no DOM)
src/components/   reusable 2D overlay components
src/animations/   motion helpers (spring/interpolate hooks)
src/utils/        video spec constants + asset path helpers
public/           local assets, referenced with staticFile()
output/           rendered MP4/PNG files (git-ignored)
scripts/          verify-env.sh, render.sh
```

## Working conventions

- **Assets stay local.** Put files under `public/` and reference them through
  `asset('images/foo.png')` (`src/utils/assets.ts`), which wraps Remotion's
  `staticFile()`. Never reference assets by a relative filesystem path.
- **Frame-driven motion.** Derive animation from `useCurrentFrame()` and
  `useVideoConfig().fps`, never `Math.random()`, `Date.now()`, or
  wall-clock deltas — renders must be reproducible frame-for-frame.
- **3D in Remotion goes through `ThreeCanvas`** from `@remotion/three`, which
  wraps React Three Fiber so the WebGL canvas is stepped per frame.
- **No network fetches inside scenes.** Drei's `Environment`/`Text` load remote
  HDR/font files and will stall a render; use local files in `public/`.
- **Video spec lives in one place.** Change resolution/fps/duration in
  `src/utils/videoSpec.ts`; every composition reads it.

## Memory

`remotion.config.ts` pins concurrency to 4 threads (each thread is a Chrome tab).
A full 60 s render peaks around 0.8 GB. Raise with `--concurrency=N` only if
nothing else large is running; lower it to 1–2 when rendering alongside local
model work.

## Not included (by design)

No website/dashboard, no backend or database, no ComfyUI, no cloud video
generation, no AI image models, no ElevenLabs. See `SETUP_AUDIT.md` for the
verified state of this environment and its known limitations.
