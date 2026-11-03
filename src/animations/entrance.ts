import {interpolate, spring, useCurrentFrame, useVideoConfig} from 'remotion';

type EntranceOptions = {
  delayInFrames?: number;
  damping?: number;
  stiffness?: number;
};

/** Spring-based entrance shared by 2D and 3D scenes so motion stays consistent. */
export const useEntrance = ({
  delayInFrames = 0,
  damping = 14,
  stiffness = 120,
}: EntranceOptions = {}) => {
  const frame = useCurrentFrame() - delayInFrames;
  const {fps} = useVideoConfig();

  return {
    scale: spring({frame, fps, config: {damping, stiffness, mass: 1}}),
    opacity: interpolate(frame, [0, 12], [0, 1], {
      extrapolateLeft: 'clamp',
      extrapolateRight: 'clamp',
    }),
    offsetY: interpolate(frame, [0, 12], [40, 0], {
      extrapolateLeft: 'clamp',
      extrapolateRight: 'clamp',
    }),
  };
};
