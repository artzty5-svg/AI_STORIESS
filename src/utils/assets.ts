import {staticFile} from 'remotion';

/**
 * Resolves a file inside ./public for the current render target.
 * Keep every asset reference in source going through this helper so paths
 * stay stable if the public directory moves.
 */
export const asset = (relativePath: string): string => staticFile(relativePath);

export const secondsToFrames = (seconds: number, fps: number): number =>
  Math.round(seconds * fps);

export const framesToSeconds = (frames: number, fps: number): number => frames / fps;
