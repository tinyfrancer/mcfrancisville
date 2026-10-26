import { CONSTELLATIONS, SKY_BOX } from '../data/constellations';
import type { ConstellationId } from '../types/ids';
import { ACCENT_TWO, darkOf, fillOf, finish, lightOf, ROOF } from './buildings';
import type { FurnitureArt } from './furniture';
import { frame, palette, WOOD } from './furnish';
import type { ItemArt } from './items';
import { PALETTE as C } from './palette';
import { Sketch } from './sketch';
import type { SpriteSource } from './sprite';

/*
 * The night sky's pictures (1.5's G4, decision 373): the stars as the telescope shows them, a
 * star a few whole pixels in the sky's own scale (one sky pixel is one pixel of the world's 32),
 * the month's mark for the calendar, Hazel's star map, and what the star chart's shelves send.
 */

/** A star's pixels from its middle: `c` its heart, `a` its arms, `h` the halo round it. */
export type StarPixel = readonly [dx: number, dy: number, tone: 'c' | 'a' | 'h'];

/** How a star shows: faint (a speck), small (a heart and four arms), bright and lit (longer arms). */
export const STAR_LOOKS = {
  faint: [[0, 0, 'a']],
  small: [
    [0, 0, 'c'],
    [-1, 0, 'a'],
    [1, 0, 'a'],
    [0, -1, 'a'],
    [0, 1, 'a'],
  ],
  bright: [
    [0, 0, 'c'],
    [-1, 0, 'c'],
    [1, 0, 'c'],
    [0, -1, 'c'],
    [0, 1, 'c'],
    [-2, 0, 'a'],
    [2, 0, 'a'],
    [0, -2, 'a'],
    [0, 2, 'a'],
    [-1, -1, 'h'],
    [1, -1, 'h'],
    [-1, 1, 'h'],
    [1, 1, 'h'],
  ],
  lit: [
    [0, 0, 'c'],
    [-1, 0, 'c'],
    [1, 0, 'c'],
    [0, -1, 'c'],
    [0, 1, 'c'],
    [-2, 0, 'a'],
    [2, 0, 'a'],
    [0, -2, 'a'],
    [0, 2, 'a'],
    [-3, 0, 'h'],
    [3, 0, 'h'],
    [0, -3, 'h'],
    [0, 3, 'h'],
    [-1, -1, 'a'],
    [1, -1, 'a'],
    [-1, 1, 'a'],
    [1, 1, 'a'],
  ],
} as const satisfies Record<string, readonly StarPixel[]>;

export type StarLook = keyof typeof STAR_LOOKS;

/** The night's colours for the sky and its stars, from the palette. */
export const NIGHT = {
  /** The sky from the top down, dithered between. */
  bands: [C.ink, C.night, C.dusk],
  /** Field stars: a cool white and a lavender, a warm one now and then. */
  field: [C.lavender, C.ghost, C.candle],
  /** A constellation's stars before they're lit: a clear cream with a lavender halo. */
  waiting: { c: C.white, a: C.ghost, h: C.plumLight },
  /** Once lit: gold. */
  lit: { c: C.candleBright, a: C.gold, h: C.goldShade },
  line: C.gold,
  dimLine: C.plumLight,
} as const;

/** A constellation's stars and lines scaled into a box `w` by `h`, laid on a sketch at `x`, `y`. */
function drawShape(
  s: Sketch,
  id: ConstellationId,
  box: { x: number; y: number; w: number; h: number },
  keys: { star: string; line: string },
): void {
  const row = CONSTELLATIONS[id];
  const at = (i: number) => {
    const star = row.stars[i]!;
    return {
      x: box.x + Math.round((star.x / SKY_BOX.w) * (box.w - 1)),
      y: box.y + Math.round((star.y / SKY_BOX.h) * (box.h - 1)),
    };
  };
  for (const [a, b] of row.lines) {
    const from = at(a);
    const to = at(b);
    s.line(from.x, from.y, to.x, to.y, keys.line);
  }
  row.stars.forEach((_, i) => {
    const { x, y } = at(i);
    s.set(x, y, keys.star);
  });
}

/**
 * The month's constellation as a 16-pixel mark (the calendar's Month tab): its stars in gold and
 * its lines in lavender on a round patch of night.
 */
export function constellationMark(id: ConstellationId): ItemArt {
  const s = new Sketch(16, 16);
  s.ellipse(8, 8, 7.5, 7.5, 'n');
  s.rect(1, 3, 14, 10, 'n');
  drawShape(s, id, { x: 2, y: 4, w: 12, h: 8 }, { star: 's', line: 'l' });
  s.outline({ n: 'o' });
  return {
    source: s.toSource(),
    palette: { '.': null, n: C.night, o: C.ink, s: C.candleBright, l: C.plumLight },
  };
}

/** Hazel's star map: a curl of old paper with gold stars inked on it, a ribbon round one end. */
export const STAR_MAP_ART: ItemArt = (() => {
  const s = new Sketch(16, 16);
  s.rect(3, 3, 10, 10, 'p');
  s.rect(2, 2, 2, 12, 'P').rect(12, 2, 2, 12, 'P');
  s.rect(3, 3, 1, 10, 'q').rect(13, 3, 1, 10, 'q');
  s.line(5, 5, 8, 4, 'l').line(8, 4, 10, 7, 'l').line(10, 7, 7, 9, 'l').line(7, 9, 9, 11, 'l');
  for (const [x, y] of [
    [5, 5],
    [8, 4],
    [10, 7],
    [7, 9],
    [9, 11],
  ] as const) {
    s.set(x, y, 's');
  }
  s.rect(1, 7, 3, 2, 'r');
  s.outline({ p: 'o', P: 'o', q: 'o', r: 'R' });
  return {
    source: s.toSource(),
    palette: {
      '.': null,
      o: C.bark,
      p: C.cream,
      P: C.white,
      q: C.creamShade,
      s: C.gold,
      l: C.goldShade,
      r: C.plumLight,
      R: C.plum,
    },
  };
})();

/** The Bat in gold on a midnight mount, in a gilt frame, for half the sky. */
function framedBat(): FurnitureArt {
  const s = new Sketch(32, 32);
  frame(s, 1, 1, 30, 30, ACCENT_TWO, 3);
  s.rect(4, 4, 24, 24, fillOf(ROOF));
  s.rect(4, 4, 24, 1, darkOf(ROOF)).rect(4, 4, 1, 24, darkOf(ROOF));
  s.rect(13, 27, 6, 2, lightOf(ACCENT_TWO));
  const framed = finish(s);
  const art = new Sketch(32, 32);
  art.stamp(framed, 0, 0);
  // A few field stars on the mount, then the Bat over them.
  for (const [x, y] of [
    [7, 21],
    [24, 6],
    [9, 7],
    [25, 22],
    [17, 24],
  ] as const) {
    art.set(x, y, 'φ');
  }
  drawShape(art, 'bat', { x: 6, y: 7, w: 21, h: 15 }, { star: 'χ', line: 'ψ' });
  return {
    source: art.toSource(),
    palette: {
      ...palette({ ...WOOD, accentTwo: C.gold, roof: C.navy }),
      φ: C.plumLight,
      χ: C.candleBright,
      ψ: C.goldShade,
    },
    glow: { χ: C.candleBright, ψ: C.gold },
  };
}

/** A little night sky, round, its stars in gold and a crescent moon: what the dome holds. */
function nightGlobe(): { source: SpriteSource; palette: Record<string, string | null> } {
  const s = new Sketch(24, 24);
  s.ellipse(12, 11, 9, 9, 'n');
  s.dither('n', 'N', 3, 2, 18, 8);
  // A crescent moon.
  s.ellipse(8, 8, 3, 3, 'm').ellipse(9, 7, 2.5, 2.5, 'n');
  for (const [x, y] of [
    [14, 5],
    [17, 9],
    [15, 14],
    [10, 15],
    [6, 13],
    [18, 13],
    [12, 9],
  ] as const) {
    s.set(x, y, 's');
  }
  s.set(15, 14, 'S').set(14, 14, 's').set(16, 14, 's').set(15, 13, 's').set(15, 15, 's');
  // The little brass stand it sits on.
  s.rect(10, 20, 4, 2, 'b').rect(8, 22, 8, 2, 'b').rect(8, 22, 8, 1, 'B');
  s.outline({ n: 'o', N: 'o', m: 'o', b: 'd', B: 'd' });
  return {
    source: s.toSource(),
    palette: {
      '.': null,
      o: C.ink,
      n: C.navy,
      N: C.night,
      m: C.cream,
      s: C.gold,
      S: C.candleBright,
      b: C.gold,
      B: C.candleBright,
      d: C.goldShade,
    },
  };
}

/**
 * What the star chart's two shelves send her (1.5's G4): the Bat framed, and the little sky to
 * go under the shelves' glass dome (`sprites/milestones.ts` puts it there, as it does a critter).
 */
export const FRAMED_BAT: FurnitureArt = framedBat();
export const NIGHT_GLOBE = {
  ...nightGlobe(),
  glow: { s: C.candleBright, S: C.white, m: C.white },
};
