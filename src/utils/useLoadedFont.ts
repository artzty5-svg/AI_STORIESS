import {useEffect, useState} from 'react';
import {continueRender, delayRender, staticFile} from 'remotion';

/**
 * Loads a font file from ./public and blocks the render until it is ready,
 * so a frame never renders with a fallback glyph. Returns the result of
 * document.fonts.check() — the renderer's own verdict, which scenes can draw.
 */
export const useLoadedFont = (family: string, file: string): boolean => {
  const [handle] = useState(() => delayRender(`loading font ${family}`));
  const [available, setAvailable] = useState(false);

  useEffect(() => {
    const face = new FontFace(family, `url(${staticFile(file)})`);
    face
      .load()
      .then((loaded) => {
        document.fonts.add(loaded);
        const ok = document.fonts.check(`64px "${family}"`);
        setAvailable(ok);
        // Surfaces in the render log as [Tab N, ...] — independent of the pixels.
        console.log(`FONT_CHECK ${family} -> ${ok}`);
        continueRender(handle);
      })
      .catch((err: unknown) => {
        console.log(`FONT_CHECK ${family} -> FAILED ${String(err)}`);
        setAvailable(false);
        continueRender(handle);
      });
  }, [family, file, handle]);

  return available;
};
