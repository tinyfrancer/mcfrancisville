import { PALETTE as C, ramp } from './palette';
import { CLEAR, Sketch } from './sketch';
import type { Palette, SpriteSource } from './sprite';

/**
 * The little things that move outdoors (phase L), drawn at 32: a tuft of long grass in three
 * frames, leaning left, standing and leaning right, that the wind takes in turn across the ground.
 */
export const TUFT_W = 7;
export const TUFT_H = 9;

/** Each blade: where it stands, and how tall. */
const BLADES: readonly (readonly [x: number, height: number])[] = [
  [1, 5],
  [3, 8],
  [5, 6],
];

function tuft(lean: -1 | 0 | 1): SpriteSource {
  const s = new Sketch(TUFT_W, TUFT_H);
  for (const [x, height] of BLADES) {
    for (let j = 0; j < height; j++) {
      const y = TUFT_H - 1 - j;
      // The top of a blade bends with the wind, its root stays put.
      const bend = j >= height - 2 ? lean : 0;
      s.set(x + bend, y, j === height - 1 ? 'L' : j < 2 ? 'd' : 'G');
    }
  }
  return s.toSource();
}

export const TUFT_FRAMES: readonly SpriteSource[] = [tuft(-1), tuft(0), tuft(1)];

export const TUFT_PALETTE: Palette = {
  [CLEAR]: null,
  G: C.mossLight,
  L: ramp(C.mossLight)[3],
  d: C.moss,
};
