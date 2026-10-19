import {
  ACCENT,
  ACCENT_TWO,
  darkOf,
  fillOf,
  finish,
  INK,
  LEAVES,
  lightOf,
  ROOF,
  shadeOf,
  TRIM,
  WALL,
} from './buildings';
import type { FurnitureArt } from './furniture';
import { palette, WOOD } from './furnish';
import { PALETTE as C } from './palette';
import { Sketch } from './sketch';

/*
 * Cody's keepsake for her first day (V1's R1): a cross-stitch in a wooden hoop, their house, a
 * heart and a bat, and a row of crosses where the words were meant to go. Hung on a wall tile.
 */

const HEART = ['.##.##.', '#######', '#######', '.#####.', '..###..', '...#...'];
const BAT = ['#.....#', '##.#.##', '#######', '.#.#.#.'];

const WELCOME_SAMPLER = (() => {
  const s = new Sketch(32, 32);
  // The hoop, its clasp at the top, and the cloth stretched in it with a little weave.
  s.ellipse(16, 17, 14, 14, fillOf(TRIM));
  s.ellipse(16, 17, 13, 13, lightOf(TRIM));
  s.ellipse(16, 17, 12, 12, shadeOf(TRIM));
  s.ellipse(16, 17, 11, 11, fillOf(WALL));
  s.rect(14, 1, 4, 3, fillOf(ACCENT_TWO)).set(15, 1, lightOf(ACCENT_TWO));
  for (let y = 7; y < 28; y++) {
    for (let x = 6; x < 27; x++) {
      if ((x + y) % 4 === 0 && (x * 3 + y) % 2 === 0 && (x - 16) ** 2 + (y - 17) ** 2 < 100) {
        s.set(x, y, shadeOf(WALL));
      }
    }
  }
  // Their house, in plum, with a gold door and window and a roof a shade darker.
  for (let k = 0; k < 5; k++) s.rect(12 - k, 11 + k, 3 + k * 2, 1, darkOf(ROOF));
  s.rect(8, 16, 9, 6, fillOf(ROOF));
  s.rect(11, 18, 2, 4, fillOf(ACCENT_TWO)).rect(14, 17, 2, 2, fillOf(ACCENT_TWO));
  // A heart beside it, gone over twice, and a bat over the roof, mostly a guess.
  HEART.forEach((row, y) =>
    [...row].forEach((c, x) => c === '#' && s.set(18 + x, 15 + y, fillOf(ACCENT))),
  );
  s.set(19, 16, lightOf(ACCENT));
  BAT.forEach((row, y) => [...row].forEach((c, x) => c === '#' && s.set(17 + x, 8 + y, INK)));
  // Where WELCOME HOME was meant to go: a row of little green crosses.
  for (let x = 9; x <= 23; x += 2) s.set(x, 24, fillOf(LEAVES));
  for (let x = 10; x <= 22; x += 2) s.set(x, 25, fillOf(LEAVES));
  return finish(s);
})();

export const FIRST_DAY_ART: Record<'welcomeSampler', FurnitureArt> = {
  welcomeSampler: {
    source: WELCOME_SAMPLER,
    palette: palette({
      ...WOOD,
      trim: C.wood,
      roof: C.plum,
      accent: C.scarlet,
      accentTwo: C.gold,
      leaves: C.leaf,
    }),
  },
};
