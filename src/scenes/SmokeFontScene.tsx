import type {CSSProperties} from 'react';
import {AbsoluteFill, useCurrentFrame, useVideoConfig} from 'remotion';
import {useLoadedFont} from '../utils/useLoadedFont';

const CUSTOM_FONT = 'ChalkdusterTest';

const row = (family: string): CSSProperties => ({
  fontFamily: family,
  fontSize: 84,
  color: 'white',
  margin: 0,
});

/**
 * Smoke test: does a local .ttf actually load into the render browser, and is
 * it used for glyphs? Evidence is (1) the drawn fonts.check() verdict,
 * (2) the FONT_CHECK console line in the render log, (3) the visual difference
 * between the custom-font row and the two control rows.
 */
export const SmokeFontScene = () => {
  const loaded = useLoadedFont(CUSTOM_FONT, 'fonts/Chalkduster.ttf');
  const {fps} = useVideoConfig();
  const frame = useCurrentFrame();

  return (
    <AbsoluteFill
      style={{
        background: '#10142a',
        justifyContent: 'center',
        alignItems: 'center',
        gap: 46,
        padding: 60,
      }}
    >
      <p style={{...row('Helvetica'), fontSize: 40, opacity: 0.85}}>
        document.fonts.check("{CUSTOM_FONT}") = {String(loaded)}
      </p>
      <p style={row(`"${CUSTOM_FONT}", Helvetica`)}>Chalkduster: AI_STORIES 0123</p>
      <p style={row('Helvetica')}>Helvetica: AI_STORIES 0123</p>
      <p style={row('"NoSuchFont9x", Helvetica')}>Fallback: AI_STORIES 0123</p>
      <p style={{...row('Helvetica'), fontSize: 32, opacity: 0.6}}>
        frame {frame} · {(frame / fps).toFixed(2)}s
      </p>
    </AbsoluteFill>
  );
};
