export const FPS = 30;
export const WIDTH = 1920;
export const HEIGHT = 1080;
export const DEFAULT_DURATION_IN_SECONDS = 60;
export const DEFAULT_DURATION_IN_FRAMES = FPS * DEFAULT_DURATION_IN_SECONDS;

export const videoSpec = {
  width: WIDTH,
  height: HEIGHT,
  fps: FPS,
  durationInFrames: DEFAULT_DURATION_IN_FRAMES,
} as const;
