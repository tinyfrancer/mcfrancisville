import { mix, PALETTE as C, ramp } from './palette';
import { CLEAR, Sketch } from './sketch';
import type { Palette, SpriteSource } from './sprite';

/*
 * The lawn (V1's L2, decision 293). Grass was one flat moss on every tile, 42% of the town's
 * pixels; now each corner of the tiles carries a tone, and a tile of grass is drawn from its four
 * corners: the tone at each pixel is the corners blended across it, stepped into the nearest with
 * a dithered seam, so tones lie in soft blobs several tiles across and meet without a tile's
 * edge showing. Which tone a corner takes is the place's (`render/lawn.ts`): low-frequency noise
 * for the dark, mid and light greens, the shade under a tree's crown, and grass trodden thin by
 * a door, a gate or a well. A tile's look is its four corners and its tufts, so the pieces are
 * shared across the map and baked once each.
 */

const TILE = 32;

/** The lawn's tones, by the number a corner carries. */
export const LAWN_TONES = ['shade', 'dark', 'mid', 'light', 'worn'] as const;
export type LawnTone = (typeof LAWN_TONES)[number];

/** A place's lawn: the tone at each corner of its tiles, (tx, ty) being tile (tx, ty)'s top-left. */
export interface LawnField {
  corner(tx: number, ty: number): number;
}

/** The tone a field gives where nothing says otherwise: the mid green, the grass as it was. */
export const MID = 2;
export const WORN = 4;

/**
 * Each tone's colours: its fill, a tuft's lit blade and tip, the blade under it. A season's swap
 * (L4) is these rows.
 */
export const GRASS_TONES: Record<
  LawnTone,
  { fill: string; blade: string; tip: string; under: string }
> = {
  shade: { fill: C.grassShade, blade: C.grassCool, tip: C.moss, under: ramp(C.grassShade)[1] },
  dark: { fill: C.grassCool, blade: C.moss, tip: C.mossLight, under: C.grassShade },
  mid: { fill: C.moss, blade: C.mossLight, tip: ramp(C.mossLight)[3], under: C.mossDark },
  light: {
    fill: C.grassWarm,
    blade: mix(C.grassWarm, C.leafLight, 0.35),
    tip: ramp(C.grassWarm)[3],
    under: C.moss,
  },
  worn: {
    fill: C.grassWorn,
    blade: mix(C.grassWorn, C.rope, 0.3),
    tip: ramp(C.grassWorn)[3],
    under: C.grassCool,
  },
};

/** The keys each tone paints in: fill, blade, tip, under, by tone. */
const FILL = '01234';
const BLADE = 'abcde';
const TIP = 'ABCDE';
const UNDER = 'pqrst';

/** Bare earth showing through worn grass, its light grains, and a tile's little flower. */
export const LAWN_PALETTE: Palette = (() => {
  const p: Record<string, string | null> = { [CLEAR]: null };
  LAWN_TONES.forEach((tone, i) => {
    const t = GRASS_TONES[tone];
    p[FILL[i]!] = t.fill;
    p[BLADE[i]!] = t.blade;
    p[TIP[i]!] = t.tip;
    p[UNDER[i]!] = t.under;
  });
  p.u = mix(C.dirt, C.grassWorn, 0.4);
  p.U = mix(C.dirtLight, C.grassWorn, 0.3);
  p.f = C.candle;
  p.y = C.lavender;
  return p;
})();

/** A tile's tufts, as (x, y) of the left blade, a set per look. The first look is the plainest. */
const TUFTS: readonly (readonly (readonly [number, number])[])[] = [
  [
    [5, 7],
    [21, 4],
    [12, 18],
    [26, 23],
    [4, 27],
  ],
  [
    [9, 10],
    [24, 14],
    [16, 27],
  ],
  [
    [3, 3],
    [18, 9],
    [8, 21],
    [27, 28],
  ],
  [
    [13, 5],
    [25, 19],
    [6, 16],
  ],
];

export const LAWN_LOOKS = TUFTS.length;

/** A tuft's pixels from its left blade's foot: three blades over a shaded root. */
const TUFT_SHAPE: readonly (readonly [number, number, 'tip' | 'blade' | 'under'])[] = [
  [2, -3, 'tip'],
  [2, -2, 'blade'],
  [0, -2, 'tip'],
  [4, -2, 'tip'],
  [0, -1, 'blade'],
  [1, -1, 'blade'],
  [2, -1, 'blade'],
  [4, -1, 'blade'],
  [1, 0, 'under'],
  [2, 0, 'under'],
  [3, 0, 'under'],
];

/** A 4×4 ordered dither, lined up across tiles since a tile is a whole number of its repeats. */
const BAYER = [0, 8, 2, 10, 12, 4, 14, 6, 3, 11, 1, 9, 15, 7, 13, 5].map((n) => (n + 0.5) / 16);
const bayer = (x: number, y: number) => BAYER[(y % 4) * 4 + (x % 4)]!;

/** How much of the way between two tones a seam is dithered: a few pixels, not a band. */
const SEAM = 0.34;

/** A small fixed hash of a pixel in a tile, for grains of earth in worn grass. */
function grain(x: number, y: number): number {
  let h = Math.imul(x + 31, 0x27d4eb2d) ^ Math.imul(y + 7, 0x165667b1);
  h = Math.imul(h ^ (h >>> 15), 0x85ebca6b);
  return ((h ^ (h >>> 13)) >>> 0) / 0xffffffff;
}

/**
 * Soft blobs over a tile, from 0 to 1, repeating every tile so tiles meet: where the earth shows
 * through worn grass, in patches rather than speckles.
 */
function blobs(x: number, y: number): number {
  const K = 8;
  const n = TILE / K;
  const at = (i: number, j: number) => grain(i % n, (j % n) + 40);
  const gx = x / K;
  const gy = y / K;
  const x0 = Math.floor(gx);
  const y0 = Math.floor(gy);
  const ease = (t: number) => t * t * (3 - 2 * t);
  const fx = ease(gx - x0);
  const fy = ease(gy - y0);
  const top = at(x0, y0) * (1 - fx) + at(x0 + 1, y0) * fx;
  const bottom = at(x0, y0 + 1) * (1 - fx) + at(x0 + 1, y0 + 1) * fx;
  return top * (1 - fy) + bottom * fy;
}

/** The tone blended from four corners at a pixel (before stepping), from 0 to 4. */
export function blendAt(corners: readonly number[], x: number, y: number): number {
  const [nw, ne, sw, se] = corners as [number, number, number, number];
  const fx = (x + 0.5) / TILE;
  const fy = (y + 0.5) / TILE;
  const top = nw + (ne - nw) * fx;
  const bottom = sw + (se - sw) * fx;
  return top + (bottom - top) * fy;
}

/** The tone a pixel of a tile is painted in, stepped from its blend with a dithered seam. */
export function toneAt(corners: readonly number[], x: number, y: number): number {
  const v = blendAt(corners, x, y);
  return Math.max(0, Math.min(WORN, Math.round(v + (bayer(x, y) - 0.5) * SEAM * 2)));
}

/**
 * A tile of lawn from its corners' tones (north-west, north-east, south-west, south-east) and its
 * look: each pixel in its tone, a few tufts lit on their left in the tone they stand in, earth
 * grains where the grass is worn thinnest, and on one look in four a tiny flower.
 */
export function drawLawn(corners: readonly number[], look: number): SpriteSource {
  const s = new Sketch(TILE, TILE, FILL[MID]);
  for (let y = 0; y < TILE; y++) {
    for (let x = 0; x < TILE; x++) {
      const t = toneAt(corners, x, y);
      s.set(x, y, FILL[t]!);
      // Trodden thin where it's worn most: grains of earth, thicker in the softer hollows.
      const worn = blendAt(corners, x, y) - (WORN - 0.5);
      if (t === WORN && worn > 0 && grain(x, y) < worn * (0.06 + 0.22 * (1 - blobs(x, y)))) {
        s.set(x, y, grain(x + 5, y) < 0.3 ? 'U' : 'u');
      }
    }
  }
  // A tuft (V1's L2: it was three pixels and barely read): three blades from a shaded root,
  // the middle one tallest, lit on their tips, in the tone they stand in.
  for (const [x, y] of TUFTS[look]!) {
    const t = toneAt(corners, x + 2, y);
    for (const [dx, dy, part] of TUFT_SHAPE) {
      s.set(x + dx, y + dy, (part === 'tip' ? TIP : part === 'blade' ? BLADE : UNDER)[t]!);
    }
  }
  if (look === 3) s.set(20, 27, 'f').set(19, 27, 'y').set(21, 27, 'y').set(20, 26, 'y');
  if (look === 2) {
    const t = toneAt(corners, 14, 14);
    s.set(14, 14, UNDER[t]!)
      .set(15, 13, UNDER[t]!)
      .set(22, 23, UNDER[toneAt(corners, 22, 23)]!);
  }
  return s.toSource();
}
