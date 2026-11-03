import type {CSSProperties} from 'react';
import {
  AbsoluteFill,
  Audio,
  interpolate,
  Sequence,
  useCurrentFrame,
  useVideoConfig,
} from 'remotion';
import {asset} from '../utils/assets';

const box: CSSProperties = {
  borderRadius: 16,
  padding: '18px 26px',
  fontFamily: 'Helvetica, Arial, sans-serif',
  fontSize: 34,
  color: 'white',
};

/**
 * Smoke test for the audio pipeline.
 *
 * Timeline (3.0 s / 90 frames @ 30 fps):
 *   440 Hz tone  0.00s ──────────────2.00s
 *   660 Hz tone           1.00s ───────────2.50s
 *             └ overlap 1.00–2.00s proves mixing
 *                                 └ 2.50–3.00s must be silent
 * The silence window is the sync proof: if the exported audio's measured
 * silence starts at ~2.5s, frame→sample timing survived the render.
 */
export const SmokeAudioScene = () => {
  const frame = useCurrentFrame();
  const {fps} = useVideoConfig();
  const seconds = frame / fps;

  const active = seconds < 2.5;

  return (
    <AbsoluteFill
      style={{
        background: '#0d1b2a',
        justifyContent: 'center',
        alignItems: 'center',
        gap: 34,
      }}
    >
      <AbsoluteFill
        style={{
          background: active ? '#1b4332' : '#3a0ca3',
          opacity: interpolate(frame, [73, 77], [1, 0.35], {
            extrapolateLeft: 'clamp',
            extrapolateRight: 'clamp',
          }),
        }}
      />
      <div style={{position: 'relative'}}>
        <p style={{...box, background: '#4361ee'}}>440 Hz · 0.00s → 2.00s</p>
        <p style={{...box, background: '#f72585'}}>660 Hz · 1.00s → 2.50s</p>
        <p style={{...box, background: '#495057'}}>2.50s → 3.00s · SILENT</p>
        <h1
          style={{
            fontFamily: 'Helvetica, Arial, sans-serif',
            fontSize: 120,
            color: 'white',
            textAlign: 'center',
            margin: 0,
          }}
        >
          {seconds.toFixed(2)}s
        </h1>
        <p style={{...box, background: active ? '#2b9348' : '#6c757d'}}>
          {active ? 'AUDIO EXPECTED' : 'SILENCE EXPECTED'} · frame {frame}
        </p>
      </div>

      <Audio src={asset('audio/beep-440-2s.wav')} />
      <Sequence from={30}>
        <Audio src={asset('audio/beep-660-1s5.wav')} />
      </Sequence>
    </AbsoluteFill>
  );
};
