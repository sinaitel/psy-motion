export function secToFrames(sec: number, fps: number): number {
  return Math.round(sec * fps);
}

export function framesToSec(frames: number, fps: number): number {
  return frames / fps;
}

/**
 * Retourne les frame-offsets (depuis frame 0 de la section WordReveal)
 * pour chaque mot. Si wordTimingsSec est fourni, convertit en frames.
 * Sinon, répartit uniformément sur totalFrames.
 */
export function computeWordTimings(
  words: string[],
  fps: number,
  totalFrames: number,
  wordTimingsSec?: number[]
): number[] {
  if (wordTimingsSec && wordTimingsSec.length === words.length) {
    return wordTimingsSec.map((s) => secToFrames(s, fps));
  }
  const step = Math.floor(totalFrames / words.length);
  return words.map((_, i) => i * step);
}
