import type { FixtureId } from '../types/ids';
import {
  ACCENT,
  ACCENT_TWO,
  darkOf,
  DOOR,
  fillOf,
  finish,
  INK,
  LAMP,
  LEAVES,
  lightOf,
  ROOF,
  shadeOf,
  STONE,
  TRIM,
  wall,
  WALL,
  WHITE,
} from './buildings';
import { palette, slab, WOOD } from './furnish';
import type { FixtureArt } from './interiors';
import { PALETTE as C } from './palette';
import { Sketch } from './sketch';

/*
 * Ollie's post counter (0.3's S1), where the catalogue is kept: a panelled counter with a letter
 * slot, the catalogue open on it, a parcel tied up with string, and his bell. At 32, from the
 * building kit's materials, as the town's other fixtures are.
 */

const POST_COUNTER = (() => {
  const s = new Sketch(64, 52);
  // The top, seen from a little above, and the panelled front with its letter slot.
  slab(s, 0, 22, 64, 6, TRIM);
  wall(s, 2, 28, 60, 24, 'boards', WALL, 3);
  for (const x of [4, 33]) {
    s.rect(x, 32, 27, 16, shadeOf(WALL)).rect(x + 1, 33, 25, 14, fillOf(WALL));
  }
  s.rect(2, 28, 60, 1, darkOf(TRIM));
  s.rect(9, 38, 16, 3, INK).rect(9, 38, 16, 1, darkOf(TRIM));
  // A heart on the right panel: Ollie is very romantic about post.
  for (const [x, y, w] of [
    [42, 37, 3],
    [47, 37, 3],
    [41, 38, 10],
    [42, 40, 8],
    [44, 42, 4],
    [45, 43, 2],
  ] as const) {
    s.rect(x, y, w, w === 10 ? 2 : 1, fillOf(ACCENT));
  }
  s.set(42, 38, lightOf(ACCENT));
  // The catalogue, open: its cover under two pages of little pictures, and a ribbon to keep the place.
  slab(s, 3, 15, 32, 8, ROOF);
  s.rect(5, 12, 14, 9, WHITE).rect(20, 12, 13, 9, WHITE);
  s.rect(19, 12, 1, 10, shadeOf(WALL));
  for (const [x, y, m] of [
    [7, 14, ACCENT],
    [12, 14, LEAVES],
    [7, 17, DOOR],
    [12, 17, ACCENT_TWO],
    [22, 14, ACCENT_TWO],
    [27, 14, ACCENT],
    [22, 17, LEAVES],
    [27, 17, DOOR],
  ] as const) {
    s.rect(x, y, 4, 2, fillOf(m)).set(x, y, lightOf(m));
  }
  s.rect(25, 21, 2, 5, fillOf(ACCENT)).set(25, 25, darkOf(ACCENT));
  // A parcel tied up with string, its label on top.
  slab(s, 38, 8, 15, 15, DOOR);
  s.rect(45, 8, 1, 15, lightOf(STONE)).rect(38, 15, 15, 1, lightOf(STONE));
  s.set(44, 6, lightOf(STONE)).set(46, 6, lightOf(STONE)).set(45, 7, lightOf(STONE));
  s.rect(40, 10, 4, 3, WHITE).set(41, 11, INK);
  // His bell, brass, on a little wooden foot.
  s.ellipse(58.5, 18, 3.5, 3, LAMP).rect(55, 20, 8, 2, fillOf(TRIM)).set(58, 14, fillOf(STONE));
  s.set(57, 16, WHITE);
  return finish(s);
})();

export const CATALOGUE_FIXTURE_ART: Pick<Record<FixtureId, FixtureArt>, 'postCounter'> = {
  postCounter: {
    source: POST_COUNTER,
    palette: palette({
      ...WOOD,
      wall: C.sky,
      trim: C.wood,
      roof: C.plum,
      accent: C.rose,
      accentTwo: C.gold,
      leaves: C.moss,
      door: C.rope,
      stone: C.cream,
    }),
  },
};
