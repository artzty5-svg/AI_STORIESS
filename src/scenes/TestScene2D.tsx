import {AbsoluteFill, interpolate, useCurrentFrame, useVideoConfig} from 'remotion';
import {TitleCard} from '../components/TitleCard';
import {DEFAULT_DURATION_IN_SECONDS} from '../utils/videoSpec';

export const TestScene2D = ({
  title = 'AI_STORIES',
  subtitle = 'Remotion · Three.js · FFmpeg',
}: {
  title?: string;
  subtitle?: string;
}) => {
  const frame = useCurrentFrame();
  const {fps, durationInFrames} = useVideoConfig();

  const progress = interpolate(frame, [0, durationInFrames - 1], [0, 1], {
    extrapolateRight: 'clamp',
  });

  const hue = interpolate(frame, [0, durationInFrames - 1], [222, 320], {
    extrapolateRight: 'clamp',
  });

  return (
    <AbsoluteFill
      style={{
        background: `linear-gradient(180deg, hsl(${hue}, 62%, 14%) 0%, hsl(${
          hue + 40
        }, 58%, 32%) 100%)`,
      }}
    >
      <TitleCard title={title} subtitle={subtitle} imageSrc="images/test-card.png" />
      <div
        style={{
          position: 'absolute',
          bottom: 140,
          left: 90,
          right: 90,
          height: 10,
          borderRadius: 5,
          background: 'rgba(255,255,255,0.2)',
        }}
      >
        <div
          style={{
            width: `${progress * 100}%`,
            height: '100%',
            borderRadius: 5,
            background: 'white',
          }}
        />
      </div>
      <div
        style={{
          position: 'absolute',
          bottom: 70,
          left: 0,
          right: 0,
          textAlign: 'center',
          color: 'white',
          fontFamily: 'Helvetica, Arial, sans-serif',
          fontSize: 32,
          opacity: 0.85,
        }}
      >
        {frame} / {durationInFrames - 1} frames · {(frame / fps).toFixed(1)}s of{' '}
        {DEFAULT_DURATION_IN_SECONDS}s @ {fps}fps
      </div>
    </AbsoluteFill>
  );
};
