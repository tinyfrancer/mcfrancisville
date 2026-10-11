import { PALETTE as C } from './palette';
import { CLEAR, Sketch } from './sketch';
import type { Palette, SpriteSource } from './sprite';

/**
 * The little things that move outdoors (phase L), drawn at 32: a tuft of long grass in three
 * frames, leaning left, standing and leaning right, that the wind takes in turn across the ground.
 */
export const TUFT_W = 11;
export const TUFT_H = 12;

/**
 * Each blade: where it stands, how tall, and whether it's one of the darker ones behind. Five
 * since 0.2's K1, taller and in two greens, so a tuft reads on the grass (it was too subtle).
 */
const BLADES: readonly (readonly [x: number, height: number, back: boolean])[] = [
  [2, 7, true],
  [8, 8, true],
  [1, 5, false],
  [4, 11, false],
  [6, 9, false],
  [9, 6, false],
];

function tuft(lean: -1 | 0 | 1): SpriteSource {
  const s = new Sketch(TUFT_W, TUFT_H);
  for (const [x, height, back] of BLADES) {
    for (let j = 0; j < height; j++) {
      const y = TUFT_H - 1 - j;
      // The top of a blade bends with the wind, its root stays put; the tall ones bend further.
      const bend = j >= height - 3 ? lean * (height > 9 && j === height - 1 ? 2 : 1) : 0;
      const tone = back ? (j < 2 ? 'k' : 'd') : j === height - 1 ? 'L' : j < 2 ? 'd' : 'G';
      s.set(x + bend, y, tone);
    }
  }
  // A shaded root along the ground under the blades (V1's L2), so the tuft stands on the lawn.
  for (let x = 1; x < TUFT_W - 1; x++)
    if (s.get(x, TUFT_H - 1) === CLEAR) s.set(x, TUFT_H - 1, 'k');
  return s.toSource();
}

export const TUFT_FRAMES: readonly SpriteSource[] = [tuft(-1), tuft(0), tuft(1)];

export const TUFT_PALETTE: Palette = {
  [CLEAR]: null,
  G: C.leaf,
  L: C.leafLight,
  d: C.grassCool,
  k: C.grassShade,
};
