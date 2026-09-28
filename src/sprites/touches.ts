import type { FurnitureId } from '../types/ids';
import {
  ACCENT,
  ACCENT_TWO,
  darkOf,
  DOOR,
  fillOf,
  finish,
  GLASS,
  GLINT,
  INK,
  LEAVES,
  lightOf,
  ROOF,
  shadeOf,
  STONE,
  TRIM,
  WALL,
  WHITE,
} from './buildings';
import type { FurnitureArt } from './furniture';
import { ball, frame, palette, slab, WOOD } from './furnish';
import { PALETTE as C } from './palette';
import { Sketch } from './sketch';

// The finishing touches (phase 12): an inside joke, two nods to Dolly, and the anniversary orb,
// at 32 (phase J).

/**
 * A soft green plush dinosaur whose neck goes up, and up (personal_touches.md, "Inside jokes").
 * Its own creature, with lavender tufts down its neck, rather than anyone else's dinosaur.
 */
const LONG_NECK = (() => {
  const s = new Sketch(32, 58);
  // A round sitting body with a cream tummy, stubby feet in orange booties, a curl of tail.
  ball(s, 14, 46, 10, 9, LEAVES);
  s.ellipse(12, 48, 5, 6, fillOf(WALL)).ellipse(11, 46, 2, 3, lightOf(WALL));
  s.ellipse(26, 52, 5, 3, fillOf(LEAVES)).set(30, 50, fillOf(LEAVES)).set(30, 49, fillOf(LEAVES));
  s.ellipse(8, 55, 4, 2.5, fillOf(ACCENT)).ellipse(19, 55, 4, 2.5, fillOf(ACCENT));
  s.ellipse(7, 54, 1.5, 1, lightOf(ACCENT)).ellipse(18, 54, 1.5, 1, lightOf(ACCENT));
  s.ellipse(5, 42, 2.5, 3, fillOf(LEAVES));
  // The neck, up and up, with lavender tufts down its back.
  for (let j = 0; j < 30; j++) {
    const x = 17 + Math.round(Math.sin(j / 9) * 2);
    s.rect(x - 3, 8 + j, 7, 1, fillOf(LEAVES));
    s.set(x - 3, 8 + j, lightOf(LEAVES)).set(x + 3, 8 + j, shadeOf(LEAVES));
    if (j % 5 === 2) s.rect(x + 4, 8 + j, 2, 2, fillOf(ROOF));
  }
  // The head, looking down at her, with a big eye, a blush and a smile.
  ball(s, 13, 6, 8, 6, LEAVES);
  s.ellipse(6, 8, 4, 3, fillOf(LEAVES));
  s.ellipse(12, 4, 2.5, 3, WHITE).rect(12, 4, 2, 3, INK).set(12, 4, WHITE);
  s.ellipse(8, 9, 1.5, 1, fillOf(DOOR)).line(4, 10, 7, 11, darkOf(LEAVES));
  s.set(3, 7, darkOf(LEAVES));
  s.rect(19, 1, 2, 2, fillOf(ROOF)).rect(21, 3, 2, 2, fillOf(ROOF));
  return finish(s);
})();

/** A blue butterfly pinned in a gilt frame, with a little brass plate. */
const BUTTERFLY_FRAME = (() => {
  const s = new Sketch(32, 32);
  frame(s, 1, 1, 30, 30, ACCENT_TWO, 3);
  s.rect(4, 4, 24, 24, fillOf(WALL));
  for (const side of [-1, 1]) {
    s.ellipse(16 + side * 6, 11, 6, 6, fillOf(ACCENT));
    s.ellipse(16 + side * 5, 20, 4, 4, fillOf(ACCENT));
    s.ellipse(16 + side * 7, 10, 3, 3, lightOf(ACCENT));
    s.set(16 + side * 8, 8, WHITE).set(16 + side * 5, 21, fillOf(ROOF));
    s.rect(side < 0 ? 5 : 26, 8, 1, 6, darkOf(ACCENT));
  }
  s.rect(15, 8, 2, 16, INK).line(15, 8, 13, 5, INK).line(16, 8, 18, 5, INK);
  s.rect(12, 25, 8, 2, fillOf(ACCENT_TWO));
  return finish(s);
})();

/** A sky-blue guitar studded with rhinestones, standing up on its end. */
const RHINESTONE_GUITAR = (() => {
  const s = new Sketch(32, 50);
  slab(s, 13, 0, 6, 6, TRIM);
  for (const y of [1, 3]) s.set(12, y, fillOf(STONE)).set(19, y, fillOf(STONE));
  s.rect(14, 6, 4, 20, fillOf(TRIM)).rect(14, 6, 1, 20, lightOf(TRIM));
  for (let y = 8; y < 26; y += 4) s.rect(14, y, 4, 1, fillOf(STONE));
  ball(s, 16, 29, 8, 7, ACCENT);
  ball(s, 16, 41, 11, 8, ACCENT);
  s.ellipse(16, 33, 3, 3, INK);
  slab(s, 11, 42, 10, 3, TRIM);
  s.ellipse(16, 33, 3, 3, INK)
    .rect(15, 30, 2, 13, fillOf(STONE))
    .rect(15, 30, 1, 13, lightOf(STONE));
  for (const [x, y] of [
    [10, 26],
    [22, 27],
    [8, 38],
    [24, 39],
    [12, 46],
    [20, 46],
    [7, 43],
    [25, 44],
    [11, 31],
    [21, 31],
  ] as const)
    s.set(x, y, WHITE).set(x + 1, y, GLINT);
  return finish(s);
})();

/** A glass globe on a gold stand, with a green orb and a blue one inside: forever orbs. */
const FOREVER_ORBS = (() => {
  const s = new Sketch(32, 34);
  s.ellipse(16, 31, 10, 2.5, fillOf(ACCENT_TWO));
  slab(s, 8, 25, 16, 6, ACCENT_TWO);
  s.ellipse(16, 13, 13, 13, GLASS);
  ball(s, 11, 15, 5, 5, LEAVES);
  ball(s, 21, 11, 5, 5, ROOF);
  s.set(9, 13, WHITE).set(19, 9, WHITE);
  for (let k = 0; k < 14; k++) {
    const a = (k / 14) * Math.PI * 2;
    s.set(Math.round(16 + Math.cos(a) * 9), Math.round(13 + Math.sin(a) * 6), GLINT);
  }
  for (let j = 0; j < 6; j++) s.set(7 + Math.floor(j / 2), 5 + j, WHITE);
  return finish(s);
})();

export const TOUCHES_ART: Record<
  Extract<FurnitureId, 'longNeckYoshi' | 'butterflyFrame' | 'rhinestoneGuitar' | 'foreverOrbs'>,
  FurnitureArt
> = {
  longNeckYoshi: {
    source: LONG_NECK,
    palette: palette({
      ...WOOD,
      leaves: C.leafLight,
      wall: C.cream,
      accent: C.pumpkin,
      roof: C.lavender,
      door: C.cheek,
    }),
  },
  butterflyFrame: {
    source: BUTTERFLY_FRAME,
    palette: palette({ ...WOOD, wall: C.cream, accent: C.sky, accentTwo: C.gold, roof: C.rose }),
  },
  rhinestoneGuitar: {
    source: RHINESTONE_GUITAR,
    palette: palette({ ...WOOD, trim: C.wood, accent: C.sky, stone: C.silver, glass: C.sky }),
  },
  foreverOrbs: {
    source: FOREVER_ORBS,
    palette: palette({
      ...WOOD,
      accentTwo: C.gold,
      leaves: C.orbGreen,
      roof: C.orbBlue,
      glass: C.plumLight,
    }),
    glow: {
      [fillOf(LEAVES)]: C.orbGreenLight,
      [shadeOf(LEAVES)]: C.orbGreen,
      [fillOf(ROOF)]: C.orbBlueLight,
      [shadeOf(ROOF)]: C.orbBlue,
    },
    lights: [{ x: 16, y: 13, radius: 40 }],
  },
};
