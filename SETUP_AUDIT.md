# SETUP_AUDIT — AI_STORIES

Audit of the local animation development environment at
`/Users/oswaldo/Desktop/AI_STORIES`.

Every claim below was executed on this machine on 2026-11-03 and its real
output recorded. Nothing here is inferred from documentation.

---

## 1. Host environment

| Field | Measured value |
| --- | --- |
| Chip | Apple M5 (`sysctl machdep.cpu.brand_string`) |
| Architecture | `arm64` |
| CPU cores | 10 |
| RAM | 16 GB (`hw.memsize` = 17,179,869,184 bytes) |
| macOS | 27.2 (build 26B123) |
| Free disk at start / now | 693 GiB / 692 GiB |
| Project path | `/Users/oswaldo/Desktop/AI_STORIES` (all work inside it) |

Note: the request said "M5 Pro"; the chip string this machine reports is
**Apple M5**. That does not change any of the results below.

## 2. Installed software

| Software | Version | Location | Status |
| --- | --- | --- | --- |
| Node.js | v26.13.0 | `/opt/homebrew/bin/node` | pre-existing, reused |
| npm | 11.20.0 | `/opt/homebrew/bin/npm` | pre-existing, reused |
| FFmpeg | 9.0.2 | `/opt/homebrew/bin/ffmpeg` | pre-existing, reused |
| ffprobe | 9.0.2 | `/opt/homebrew/bin/ffprobe` | pre-existing, reused |
| Homebrew | 7.0.11 | `/opt/homebrew/bin/brew` | pre-existing, not used for installs |
| Xcode CLT | `/Library/Developer/CommandLineTools` | — | present |
| TypeScript | 5.9.3 | project `node_modules` | **installed here** |
| Remotion CLI | 4.0.540 | project `node_modules` | **installed here** |
| Chrome Headless Shell (arm64) | Chrome 144 line, 140.3 MB download | `node_modules/.remotion/chrome-headless-shell/mac-arm64/...` | **downloaded by `remotion browser ensure`** |
| Google Chrome (system) | 156.0.8078.74 | `/Applications/Google Chrome.app` | pre-existing, used only for `remotion gpu` |

No global (system-wide) software was installed or upgraded — the toolchain you
already had was sufficient, so nothing else on this Mac was touched.

FFmpeg build flags relevant to this pipeline:
`--enable-libx264 --enable-libx265 --enable-videotoolbox --enable-audiotoolbox --enable-libmp3lame --enable-neon`.
Missing: libfreetype/fontconfig — see §7.2.

## 3. Dependencies (exact, from `npm ls --depth=0`)

Runtime (`dependencies`):

| Package | Installed |
| --- | --- |
| react | 19.3.1 |
| react-dom | 19.3.1 |
| remotion | 4.0.540 |
| @remotion/three | 4.0.540 |
| three | 0.187.0 |
| @react-three/fiber | 9.8.2 |
| @react-three/drei | 10.7.9 |

Development (`devDependencies`):

| Package | Installed |
| --- | --- |
| @remotion/cli | 4.0.540 |
| @remotion/player | 4.0.540 |
| typescript | 5.9.3 |
| @types/react | 19.3.0 |
| @types/react-dom | 19.3.0 |
| @types/three | 0.187.0 |

Totals: 304 packages audited, **0 vulnerabilities**, install took 9 s + 20 s.
Peer-dependency compatibility was checked before installing:

- `@react-three/fiber@9.8.2` requires `react >=19 <19.4` → satisfied by 19.3.1
- `@react-three/drei@10.7.9` requires `react ^19`, `@react-three/fiber ^9` → satisfied
- `@remotion/three@4.0.540` requires `remotion 4.0.540` (exact), `three >=0.137`, `@react-three/fiber >=8` → satisfied
- `npx remotion versions` → "**All packages have the correct version.**"

Version choices deliberately *not* taken:

- **TypeScript 5.9.3, not the 7.0.2 `latest` tag.** TS 7 is the newly rewritten
  Go compiler; the 5.9 line is what Remotion's bundling and editor tooling are
  built against. Pinned as `^5.9.3` so `npm install` cannot drift onto 7.x.
- **Node 26.13.0 kept rather than switching to the 24 LTS line.** It is
  Homebrew-managed and global; changing it would affect other projects on this
  Mac. Everything in §6 passes on it, and `package.json` declares
  `"engines": {"node": ">=20"}`. See §7.4 if you want strict LTS.
- `esbuild@0.28.1`'s postinstall script was reported as not covered by
  `allowScripts`; verified harmless — `@esbuild/darwin-arm64` is present and
  `npx esbuild --version` → `0.28.1`.

## 4. Project structure

```text
AI_STORIES/
├── src/
│   ├── remotion/       index.ts (registerRoot), RemotionRoot.tsx (composition registration)
│   ├── three/          StoryObject.tsx — R3F/Three.js prop, frame-driven
│   ├── components/     TitleCard.tsx — 2D overlay, spring entrance + local image
│   ├── scenes/         TestScene2D.tsx, ThreeTestScene.tsx
│   ├── animations/     entrance.ts — shared useEntrance() hook
│   └── utils/          videoSpec.ts (1080×1920/30/60s), assets.ts (staticFile wrapper)
├── public/
│   ├── audio/          (empty — drop TTS/foley here)
│   ├── images/         test-card.png, placeholder-bg.png (generated with FFmpeg)
│   ├── models/         (empty — .glb/.gltf here)
│   ├── textures/       (empty)
│   ├── fonts/          (empty — @font-face files here)
│   └── assets/         (empty)
├── output/             6 rendered test files, 15 MB (git-ignored)
├── scripts/            verify-env.sh, render.sh (both executable, both tested)
├── node_modules/       1.4 GB (459 MB of it the headless browser)
├── package.json        scripts + pinned deps
├── package-lock.json
├── tsconfig.json
├── remotion.config.ts
├── README.md
├── SETUP_AUDIT.md
└── .gitignore
```

All directories from the requested layout exist; empty ones hold `.gitkeep`.
No git repository was initialised (not requested) — `.gitignore` is in place
for when you want one.

## 5. Configuration

### `remotion.config.ts`

```ts
Config.setEntryPoint('src/remotion/index.ts');
Config.setPublicDir('public');
Config.setCodec('h264');
Config.setVideoImageFormat('jpeg');
Config.setPixelFormat('yuv420p');
Config.setOverwriteOutput(true);
Config.setConcurrency(4);
```

- Imports `Config` from `@remotion/cli/config`, **not** `remotion`. The
  `remotion` core export is now a deprecation proxy that prints a warning and
  calls `process.exit(1)`; verified against the installed package.
- `setConcurrency(4)` is the 16 GB tuning: one thread = one Chrome tab.
  Measured cost in §6.
- **No GPU/Chromium flags are forced.** `setChromiumOpenGlRenderer` and
  `setHardwareAcceleration` are deliberately left at defaults because the
  default path was proven to render WebGL on this Apple M5 (§6, tests 7–9).

### `tsconfig.json`

`target ES2022` · `module ESNext` · `moduleResolution Bundler` ·
`jsx react-jsx` · `lib DOM/ES2022` · `strict` · `noEmit` · `isolatedModules` ·
`noUnusedLocals` · `noUnusedParameters` · `skipLibCheck`.
`Bundler` resolution is required for `three` and `@remotion/*` subpath exports.

### Video specification (single source of truth: `src/utils/videoSpec.ts`)

| Setting | Value |
| --- | --- |
| Resolution | 1080 × 1920 |
| Aspect ratio | 9:16 |
| Frame rate | 30 fps |
| Default duration | 60 s = 1800 frames |
| Container / codec | MP4 / H.264 (`profile High`, `pix_fmt yuv420p`) |

Both compositions read these constants, and `npx remotion compositions`
reports `1080x1920 · 30 · 1800 (60.00 sec)` for each (§6, test 5).

### Registered compositions

| ID | Scene | Type |
| --- | --- | --- |
| `TestComposition` | `src/scenes/TestScene2D.tsx` | 2D DOM/CSS + local PNG via `staticFile()` |
| `ThreeTestComposition` | `src/scenes/ThreeTestScene.tsx` | WebGL via `ThreeCanvas` + R3F + drei `RoundedBox` |

`@remotion/player` is installed and version-validated but has no page in this
project — embedding it needs a web page, which the restrictions exclude.

## 6. Test results

All commands run from the project root. "exit" is the process exit code read
directly (`$?`), not inferred from log text.

| # | Test | Command | Result |
| --- | --- | --- | --- |
| 1 | Node.js | `node -v` | exit 0 — v26.13.0 |
| 2 | npm | `npm -v` | exit 0 — 11.20.0 |
| 3 | TypeScript compile | `npx tsc --noEmit` | **exit 0**, zero diagnostics |
| 4 | Remotion install integrity | `npx remotion versions` | exit 0 — "All packages have the correct version." |
| 5 | Composition registration | `npx remotion compositions src/remotion/index.ts` | exit 0 — bundled in 640 ms, both compositions listed at 1080×1920/30/1800 |
| 6 | FFmpeg | `ffmpeg -version`, `ffprobe -version` | exit 0 — 9.0.2, arm64, x264 + VideoToolbox |
| 7 | Headless browser | `npx remotion browser ensure` | exit 0 — 140.3 MB arm64 shell installed |
| 8 | 2D test render (60 f) | `npx remotion render ... TestComposition output/test-2d.mp4 --frames=0-59` | exit 0 — 418.1 kB, **3.26 s**, peak RSS 781 MB |
| 9 | Three.js/WebGL render (60 f) | `npx remotion render ... ThreeTestComposition output/test-three.mp4 --frames=0-59` | exit 0 — 291 kB, **3.99 s**, peak RSS 800 MB |
| 10 | Still frame | `npx remotion still ... --frame=45` | exit 0 — `output/still-three.png`, 1080×1920 |
| 11 | MP4 spec check (2D) | `ffprobe` | h264 High, 1080×1920, 30/1 fps, 60 frames, yuv420p, mov/mp4 |
| 12 | MP4 spec check (3D) | `ffprobe` | h264 High, 1080×1920, 30/1 fps, 60 frames, yuv420p, mov/mp4 |
| 13 | Playback integrity | `ffmpeg -v error -i <file> -f null -` | **exit 0 with no output** on every file — full decode, zero errors |
| 14 | Not-blank proof | `ffmpeg -vf signalstats` | per-frame `YAVG≈58.8–58.98`, `YDIF>0` from frame 2 → real content + motion |
| 15 | Visual proof | frames extracted and inspected | 2D: test-card PNG with rounded corners/shadow, title, progress bar, "30 / 1799 frames · 1.0s of 60s @ 30fps". 3D: lit rounded cube + emissive sphere, gradient, "frame 45 · 1.50s · WebGL" |
| 16 | Full 60 s render (2D) | `npx remotion render ... TestComposition output/test-2d-full-60s.mp4` | exit 0 — 1800 frames, `duration=60.000000`, 5.2 MB, **22.10 s**, peak RSS 802 MB |
| 17 | Full 60 s render (3D) | `npx remotion render ... ThreeTestComposition output/test-three-full-60s.mp4` | exit 0 — 1800 frames, `duration=60.000000`, 9.3 MB, **49.11 s**, peak RSS 806 MB |
| 18 | `scripts/verify-env.sh` | `npm run verify` | exit 0 — "ALL CHECKS PASSED" (13 checks) |
| 19 | `scripts/render.sh` | `bash scripts/render.sh ThreeTestComposition output/wrapper-check.mp4 0-29` | exit 0 — 1.000000 s, 30 frames, then self-verifies + decodes OK |
| 20 | Remotion Studio | `npx remotion studio src/remotion/index.ts --no-open --port 3123` | HTTP **200**, `<title>Remotion Studio</title>`, "Built in 1660ms"; server then stopped |
| 21 | Documented npm scripts | `npm run test:all` | exit 0 — both 2 s renders regenerated, each probes 1080×1920, 30/1, 60 frames, 2.000000 s |
| 22 | Long-render coherence | `ffmpeg -ss 30` frame from the 60 s 3D MP4 | frame 900 extracted; on-screen counter reads "frame 900 · 30.00s" — matches the seek position, so the render is coherent at the midpoint, not just at the start |

### Issues found during testing and fixed

1. **3D subject clipped at frame edges.** First `ThreeTestComposition` render
   succeeded technically but the cube and sphere ran off the 9:16 frame:
   drei's `Center` re-offsets the whole group (including the orbiting sphere)
   when rotated, and a 9:16 frame gives only ~±1.5 world units of horizontal
   room at the default camera distance. Fixed by dropping `Center`, rotating
   the box in its own `<group>`, moving the sphere to an explicit offset and
   pulling the camera to `z = 9.5`. Re-rendered and re-inspected — fully
   framed. (`src/three/StoryObject.tsx`, `src/scenes/ThreeTestScene.tsx`)
2. **`React.FC` type errors.** `@types/react` 19 no longer exposes a global
   `React` namespace; components were switched to plain annotated functions
   before the first typecheck.
3. **`Config` import location.** `import {Config} from 'remotion'` is now a
   trap that exits the process; corrected to `@remotion/cli/config`.
4. **`drawtext` missing from FFmpeg** when generating the test card — see §7.2.

## 7. Known limitations / unresolved items

### 7.1 `remotion gpu` fails with the bundled headless shell
`npx remotion gpu` → `Browser failed to load chrome://gpu/ ... net::ERR_FAILED`
(exit 1). Chrome Headless Shell does not serve `chrome://` pages. **Not a
rendering problem** — WebGL demonstrably works (§6 tests 9, 15). For GPU
diagnostics use the installed system Chrome:

```bash
npx remotion gpu --browser-executable="/Applications/Google Chrome.app/Contents/MacOS/Google Chrome"
```
which returns, on this M5: `Canvas / Compositing / Rasterization / WebGL /
WebGPU / Video Decode / Video Encode: Hardware accelerated`.

### 7.2 This FFmpeg build cannot burn text or subtitles
Homebrew's ffmpeg 9.0.2 was built without libfreetype/fontconfig, so the
`drawtext`, `subtitles` and `ass` filters are absent
(`ffmpeg -vf drawtext` → `No such filter: 'drawtext'`).
Impact: no caption burn-in via the ffmpeg CLI. **Not a blocker for this
pipeline** — Remotion renders text as DOM/CSS inside Chrome, so titles and
captions belong in compositions (or `@remotion/captions`). If you later want
ffmpeg-side burn-in: `brew reinstall ffmpeg`.

### 7.3 `THREE.Clock` deprecation warning during 3D renders
Each render tab prints
`THREE.Clock: This module has been deprecated. Please use THREE.Timer instead.`
It comes from inside `@react-three/fiber@9.8.2`, not from project code
(`src/three/StoryObject.tsx` uses no clock). Cosmetic; frames are correct and
deterministic. Resolves itself when R3F adopts `THREE.Timer`.

### 7.4 Node is on the Current line, not LTS
v26.13.0 is Homebrew-managed and global. The full suite above passes on it.
If you want the 24 LTS line for strictness, that is a system-wide change to
this Mac, so it was left to you: `brew install node@24` then re-run
`npm run verify` and `npm run test:all`.

### 7.5 Audio path is untested
The test compositions have no audio track, so no render exercised
`<Audio>`/`staticFile('audio/...')` end-to-end. `public/audio/` is empty and
FFmpeg has `libmp3lame` + `audiotoolbox`, so encoding is available — but the
statement "audio works in this project" is **not** verified here. First story
work should include an audio smoke test.

### 7.6 Fonts are untested
`public/fonts/` is empty; the test scenes use system Helvetica/Arial, which
rendered fine. Loading a custom font (`@font-face` on a `staticFile()` path)
has not been tested. Drei's `Text`/`Environment` were deliberately avoided —
they fetch remote files and would stall an offline render.

### 7.7 Nothing was installed globally; `node_modules` is 1.4 GB
459 MB of that is the arm64 Chrome Headless Shell under `node_modules/.remotion/`
(Regenerating it costs one 140 MB download via `npm run browser`).

## 8. Test video locations

| File | Size | Content | Verified specs |
| --- | --- | --- | --- |
| `output/test-2d.mp4` | 418 kB | 2 s, 60 f, 2D + local PNG asset | 1080×1920, 30 fps, h264, yuv420p |
| `output/test-three.mp4` | 291 kB | 2 s, 60 f, WebGL/R3F | 1080×1920, 30 fps, h264, yuv420p |
| `output/test-2d-full-60s.mp4` | 5.2 MB | full default 60 s, 1800 f | 1080×1920, 30 fps, `duration=60.000000` |
| `output/test-three-full-60s.mp4` | 9.3 MB | full 60 s, 1800 f, WebGL | 1080×1920, 30 fps, `duration=60.000000` |
| `output/wrapper-check.mp4` | 159 kB | 1 s, 30 f, via `scripts/render.sh` | 1080×1920, 30 fps |
| `output/still-three.png` | 296 kB | single frame @45 | 1080×1920 |

Absolute paths: `/Users/oswaldo/Desktop/AI_STORIES/output/…`

## 9. Exact commands

### Launch Remotion Studio (preview / authoring)
```bash
cd ~/Desktop/AI_STORIES
npm run studio            # http://localhost:3000
```

### Render a video
```bash
cd ~/Desktop/AI_STORIES

# Full default duration (60 s) — MP4/H.264 at 1080×1920, 30 fps
npx remotion render src/remotion/index.ts TestComposition output/story.mp4
npx remotion render src/remotion/index.ts ThreeTestComposition output/story-3d.mp4

# Same, with automatic ffprobe + decode verification afterwards
./scripts/render.sh TestComposition output/story.mp4

# Quick proof render (2 s)
npm run test:2d
npm run test:three
npm run test:all

# Useful overrides
  --frames=0-299                                  # render a range only
  --concurrency=2                                 # less RAM pressure
  --crf=23                                        # smaller file
  --codec=prores --prores-profile=4444            # mezzanine export
  --props='{"title":"My story"}'                  # pass props (TestComposition)
```

### Verify the environment
```bash
npm run verify            # hardware, tools, typecheck, compositions, browser
npm run typecheck         # tsc --noEmit
npm run compositions      # list registered compositions
npm run versions          # check Remotion package versions
npm run browser           # re-download the headless shell if missing
```

### Extract a frame / inspect a render
```bash
npx remotion still src/remotion/index.ts ThreeTestComposition output/still.png --frame=45
ffprobe -v error -show_entries stream=width,height,r_frame_rate,nb_frames,codec_name,pix_fmt \
  -show_entries format=duration -of default=noprint_wrappers=1 output/story.mp4
ffmpeg -v error -i output/story.mp4 -f null -        # silent = decodes cleanly
```

## 10. Verdict

The requested stack is installed, configured, and **verified working on this
M5 / 16 GB machine**: TypeScript compiles clean, both compositions register at
1080×1920/30 fps/60 s, 2D and WebGL renders complete, and every produced MP4
probes with the right resolution, frame rate, duration and codec and decodes
without a single error. Renders are comfortably within memory — a full 60 s
render peaks at ~0.8 GB against your 16 GB, at concurrency 4 — and fast:
**60 s of 2D video in 22 s, 60 s of WebGL video in 49 s** (~37 fps and ~17 fps
sustained throughput respectively), so a 60 s story costs well under a minute.

Open items are limitations to be aware of, not failures: §7.1, §7.2, §7.5,
§7.6.
