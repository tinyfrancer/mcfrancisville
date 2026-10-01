import {
  ACCENT_TWO,
  darkOf,
  fillOf,
  finish,
  INK,
  lightOf,
  shadeOf,
  TRIM,
  WALL,
  WHITE,
} from './buildings';
import type { FurnitureArt } from './furniture';
import { candle, FIRE_LIT, frame, palette, slab, WOOD } from './furnish';
import type { FixtureArt } from './interiors';
import { PALETTE as C } from './palette';
import { Sketch } from './sketch';

/*
 * Her piano and the castle hall's grand (0.2's G2), at 32 in the kit's materials: dark wood,
 * ivory keys, black ones in twos and threes, and brass at the pedals.
 */

/** A keyboard from the front, `w` wide at `x`, its black keys in their twos and threes. */
function keys(s: Sketch, x: number, y: number, w: number): void {
  s.rect(x, y, w, 4, fillOf(WALL)).rect(x, y + 3, w, 1, shadeOf(WALL));
  for (let i = x + 3; i < x + w; i += 3) s.rect(i, y + 1, 1, 3, shadeOf(WALL));
  for (let i = 0; x + 2 + i * 3 < x + w - 1; i++) {
    // Seven white keys to an octave; no black key after the third and the seventh.
    if (i % 7 === 2 || i % 7 === 6) continue;
    s.rect(x + 2 + i * 3, y, 2, 2, INK);
  }
}

/** An upright piano, two tiles wide, with a candle on each end of its lid and a page of music up. */
const UPRIGHT = (() => {
  const s = new Sketch(64, 58);
  // The case, its lid, and the panel the music stands against.
  slab(s, 3, 9, 58, 26, TRIM);
  slab(s, 0, 6, 64, 4, TRIM);
  frame(s, 12, 12, 40, 13, TRIM, 2);
  s.rect(24, 13, 16, 11, fillOf(WALL)).rect(24, 13, 16, 1, lightOf(WALL));
  for (const y of [16, 19, 22]) s.rect(26, y, 12, 1, darkOf(WALL));
  s.set(29, 15, INK).set(33, 18, INK).set(30, 21, INK).set(35, 20, INK);
  // The keyboard on its ledge.
  slab(s, 0, 30, 64, 4, TRIM);
  keys(s, 3, 34, 58);
  slab(s, 0, 38, 64, 3, TRIM);
  // The lower case, two panels, legs on scrolls, and the pedals.
  slab(s, 4, 41, 56, 13, TRIM);
  frame(s, 8, 43, 22, 9, TRIM, 2);
  frame(s, 34, 43, 22, 9, TRIM, 2);
  slab(s, 2, 41, 5, 17, TRIM);
  slab(s, 57, 41, 5, 17, TRIM);
  for (const x of [26, 31, 36])
    s.rect(x, 54, 3, 2, fillOf(ACCENT_TWO)).set(x, 54, lightOf(ACCENT_TWO));
  // A candle at each end of the lid.
  candle(s, 4, 0, 3);
  candle(s, 57, 0, 3);
  return finish(s);
})();

/** The hall's grand piano, three tiles wide: its lid propped open on a brass stick. */
const GRAND = (() => {
  const s = new Sketch(96, 72);
  // The lid, rising from the keys to its curved far end.
  for (let x = 10; x < 90; x++) {
    const top = Math.round(34 - (x - 10) * 0.32);
    const curve = x > 78 ? Math.round(((x - 78) / 12) ** 2 * 10) : 0;
    s.rect(x, top + curve, 1, 34 - top - curve, fillOf(TRIM));
  }
  s.line(10, 33, 77, 12, lightOf(TRIM));
  // The case under it, and the stick holding the lid up.
  s.ellipse(70, 42, 24, 8, fillOf(TRIM)).rect(4, 34, 68, 16, fillOf(TRIM));
  s.rect(60, 18, 2, 16, fillOf(ACCENT_TWO)).set(60, 18, lightOf(ACCENT_TWO));
  slab(s, 4, 44, 88, 8, TRIM);
  s.rect(5, 44, 86, 1, lightOf(TRIM));
  // The keys at the front left, and a page of music on its stand.
  slab(s, 2, 36, 38, 3, TRIM);
  keys(s, 4, 39, 34);
  s.rect(12, 26, 18, 9, fillOf(WALL)).rect(12, 26, 18, 1, lightOf(WALL));
  for (const y of [29, 32]) s.rect(14, y, 14, 1, darkOf(WALL));
  s.set(17, 28, INK).set(22, 31, INK).set(25, 28, INK);
  // Three legs, and a lyre of brass pedals.
  for (const x of [6, 82]) slab(s, x, 52, 6, 18, TRIM);
  slab(s, 46, 52, 5, 14, TRIM);
  s.rect(19, 52, 1, 12, fillOf(ACCENT_TWO)).rect(24, 52, 1, 12, fillOf(ACCENT_TWO));
  for (const x of [18, 21, 24]) s.rect(x, 64, 2, 2, fillOf(ACCENT_TWO));
  s.set(18, 64, WHITE);
  return finish(s);
})();

const PIANO_WOOD = { ...WOOD, trim: C.barkDark, wall: C.cream } as const;

export const PIANO_ART: FurnitureArt = {
  source: UPRIGHT,
  palette: palette({ ...PIANO_WOOD, accentTwo: C.gold }),
  glow: FIRE_LIT,
  lights: [
    { x: 5, y: 2, radius: 28 },
    { x: 58, y: 2, radius: 28 },
  ],
};

export const HALL_PIANO_ART: FixtureArt = {
  source: GRAND,
  palette: palette({ ...PIANO_WOOD, trim: C.ink, accentTwo: C.gold }),
};
