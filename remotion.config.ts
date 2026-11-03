import {Config} from '@remotion/cli/config';

// Entry point and local asset directory
Config.setEntryPoint('src/remotion/index.ts');
Config.setPublicDir('public');

// Output defaults (MP4 / H.264). Per-render overrides are passed on the CLI.
Config.setCodec('h264');
Config.setVideoImageFormat('jpeg');
Config.setPixelFormat('yuv420p');
Config.setOverwriteOutput(true);

// 16 GB machine: each render thread is a Chrome tab, so parallelism trades
// memory for speed. Override for a quick test with --concurrency=1..10.
Config.setConcurrency(4);

// Chromium/GPU settings are intentionally left at their Apple Silicon
// defaults; see SETUP_AUDIT.md before changing them.
