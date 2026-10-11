import { mix, PALETTE as C, ramp } from './palette';
import { CLEAR, Sketch } from './sketch';
import { seeded } from '../systems/random';
import type { Palette, SpriteSource } from './sprite';

/*
 * The ground's new kinds (V1's L2, decision 293): a dirt track through the woods and the farm,
 * gravel up the castle hill, a meadow's flowers and long grass on the open lawns. Each is drawn
 * from how far each pixel is in from its edge (`edges` in `sprites/terrain.ts`, handed in), and
 * each meets the grass softly: its last few pixels thin out into the lawn in clumps, grass showing
 * between, rather than stopping at a kerb.
 */

const TILE = 32;

/** A pixel's place against its ground's edge, as `sprites/terrain.ts` works it out. */
export interface TrackEdge {
  d: number;
  nx: number;
  ny: number;
  along: number;
}

const BAYER = [0, 8, 2, 10, 12, 4, 14, 6, 3, 11, 1, 9, 15, 7, 13, 5].map((n) => (n + 0.5) / 16);
const bayer = (x: number, y: number) => BAYER[(y % 4) * 4 + (x % 4)]!;

/** A small fixed hash of a pixel in a tile, from 0 to 1. */
export function grainOf(x: number, y: number, salt = 0): number {
  let h = Math.imul(x + 31 + salt * 977, 0x27d4eb2d) ^ Math.imul(y + 7, 0x165667b1);
  h = Math.imul(h ^ (h >>> 15), 0x85ebca6b);
  return ((h ^ (h >>> 13)) >>> 0) / 0xffffffff;
}

/**
 * Whether a pixel near its ground's edge is still that ground: everything `width` pixels in is,
 * nothing at the edge is, and between it steps out into the grass in an ordered dither, lined up
 * across tiles, so the grass comes in between rather than meeting a kerb.
 */
export function holds(e: TrackEdge, x: number, y: number, width: number): boolean {
  if (e.d >= width) return true;
  if (e.d < 1) return false;
  return bayer(x, y) < (e.d - 1) / (width - 1);
}

/** Where a tile sits in the wave along its edges: its column and row, four tiles to a wave. */
export interface Phase {
  px: number;
  py: number;
}

/** How long a wave along an edge runs before it comes round again: four tiles. */
const WAVE = TILE * 4;

/** A soft wave from about −1 to 1 along an edge, `a` pixels along it in the world. */
function wave(a: number, salt: number): number {
  const t = (a / WAVE) * Math.PI * 2;
  return (
    Math.sin(t + salt) * 0.55 + Math.sin(t * 2 + 1.3 + salt) * 0.3 + Math.sin(t * 3 + 2.1) * 0.15
  );
}

/**
 * A ground's field with its edges moved in and out by up to `amp` pixels in a slow wave along the
 * world (four tiles round), so a track's sides meander rather than running ruler-straight. The far
 * and near sides of a track wave apart. Where the tile sits in the wave (`phase`) is part of its
 * piece, so tiles beside each other meet.
 */
export function wavy(field: readonly TrackEdge[], phase: Phase, amp: number): TrackEdge[] {
  return field.map((e, i) => {
    if (!Number.isFinite(e.d)) return e;
    const x = i % TILE;
    const y = Math.floor(i / TILE);
    const across = wave(phase.px * TILE + x, e.ny > 0 ? 2.4 : 0);
    const down = wave(phase.py * TILE + y, e.nx > 0 ? 4.1 : 1.7);
    const shift = (across * e.ny * e.ny + down * e.nx * e.nx) * amp;
    return { ...e, d: e.d + shift };
  });
}

/**
 * A field with its edges drawn in by `px` pixels, so a wave as deep never carries a patch out past
 * its own tile's corner: a meadow waves inward only.
 */
export function inward(field: readonly TrackEdge[], px: number): TrackEdge[] {
  return field.map((e) => (Number.isFinite(e.d) ? { ...e, d: e.d - px } : e));
}

/** Paints a tile from its field, CLEAR where `key` says, as `paint` in `sprites/terrain.ts` does. */
function paintFrom(
  s: Sketch,
  field: readonly TrackEdge[],
  key: (e: TrackEdge, x: number, y: number) => string,
): void {
  for (let y = 0; y < TILE; y++) {
    for (let x = 0; x < TILE; x++) {
      const e = field[y * TILE + x]!;
      s.set(x, y, e.d <= 0 ? CLEAR : key(e, x, y));
    }
  }
}

// ---- A dirt track -----------------------------------------------------------------------------

/**
 * A dirt track: packed earth, a shade darker along its sides and lighter down the middle where
 * it's walked most, a scatter of grit and the odd stone, thinning into the grass at its edges.
 */
export function drawDirt(field: readonly TrackEdge[], variant: number): SpriteSource {
  const s = new Sketch(TILE, TILE, 'd');
  paintFrom(s, field, (e, x, y) => {
    if (!holds(e, x, y, 3)) return CLEAR;
    const g = grainOf(x, y, variant + 3);
    if (e.d < 6 && bayer(x, y) < (6 - e.d) / 4) return 'e';
    if (g < 0.025) return 'k';
    if (g > 0.965) return 'l';
    if (e.d > 10 && bayer(x + 2, y + 1) < 0.12) return 'l';
    return 'd';
  });
  const rand = seeded(41 + variant * 7);
  for (let i = 0; i < 3; i++) {
    const x = 4 + Math.floor(rand() * 23);
    const y = 4 + Math.floor(rand() * 23);
    if (field[y * TILE + x]!.d < 7) continue;
    s.rect(x, y, 2, 1, 's')
      .set(x, y, 'S')
      .rect(x, y + 1, 2, 1, 'k');
  }
  return s.toSource();
}

export const DIRT_PALETTE: Palette = {
  [CLEAR]: null,
  d: C.dirt,
  e: C.dirtDark,
  l: C.dirtLight,
  k: ramp(C.dirtDark)[1],
  s: C.stone,
  S: C.stoneLight,
};

// ---- Gravel -----------------------------------------------------------------------------------

/**
 * Gravel: a pale bed of grit with little stones all over it, each lit on top and shaded under,
 * and at its edges a few stones scattered out onto the grass.
 */
export function drawGravel(field: readonly TrackEdge[], variant: number): SpriteSource {
  const s = new Sketch(TILE, TILE, 'g');
  paintFrom(s, field, (e, x, y) => {
    if (!holds(e, x, y, 3)) return CLEAR;
    const g = grainOf(x, y, variant + 5);
    if (g < 0.06) return 'k';
    if (g > 0.93) return 'G';
    return 'g';
  });
  const rand = seeded(73 + variant * 13);
  for (let i = 0; i < 14; i++) {
    const x = 1 + Math.floor(rand() * 29);
    const y = 1 + Math.floor(rand() * 29);
    const w = 2 + Math.floor(rand() * 2);
    const tone = rand() < 0.5 ? 'p' : 'q';
    // A stone stands anywhere the gravel reaches, and a little way out onto the grass.
    if (field[y * TILE + x]!.d < -1 || field[y * TILE + Math.min(31, x + w)]!.d < -1) continue;
    if (field[y * TILE + x]!.d < 1 && rand() < 0.5) continue;
    s.rect(x, y, w, 2, tone)
      .set(x, y, 'G')
      .rect(x, y + 2, w, 1, 'k');
  }
  return s.toSource();
}

export const GRAVEL_PALETTE: Palette = {
  [CLEAR]: null,
  g: C.gravel,
  G: C.gravelLight,
  k: C.gravelDark,
  p: mix(C.gravel, C.stoneLight, 0.4),
  q: mix(C.gravel, C.dirtLight, 0.4),
};

/**
 * How many pixels a meadow and long grass take to thin out into the lawn: wide, so a patch's edge
 * is a soft fade and not a rug's.
 */
const MEADOW_FADE = 9;
const LONG_GRASS_FADE = 6;

// ---- A meadow ---------------------------------------------------------------------------------

/** Where a meadow's little flowers are, as (x, y, colour), a set per look. */
const MEADOW_FLOWERS: readonly (readonly (readonly [number, number, string])[])[] = [
  [
    [5, 6, 'w'],
    [17, 4, 'y'],
    [26, 11, 'w'],
    [11, 15, 'p'],
    [22, 20, 'w'],
    [6, 24, 'y'],
    [16, 28, 'w'],
    [27, 27, 'r'],
  ],
  [
    [8, 4, 'y'],
    [21, 8, 'w'],
    [4, 14, 'w'],
    [15, 13, 'y'],
    [26, 18, 'p'],
    [10, 23, 'w'],
    [20, 27, 'y'],
  ],
  [
    [3, 4, 'p'],
    [13, 7, 'w'],
    [24, 4, 'w'],
    [18, 15, 'r'],
    [7, 19, 'w'],
    [27, 23, 'y'],
    [13, 26, 'w'],
    [23, 29, 'w'],
  ],
];

/**
 * A meadow: a warmer, lighter green than the lawn, with clover leaves and a scatter of tiny
 * flowers in white, yellow, lavender and rose, each a head of a few pixels lit on its left,
 * thinning into the lawn at its edges.
 */
export function drawMeadow(field: readonly TrackEdge[], variant: number): SpriteSource {
  const s = new Sketch(TILE, TILE, 'm');
  paintFrom(s, field, (e, x, y) => {
    if (!holds(e, x, y, MEADOW_FADE)) return CLEAR;
    const g = grainOf(x, y, variant + 9);
    if (g < 0.07) return 'c';
    if (g > 0.93) return 'M';
    return 'm';
  });
  for (const [x, y, colour] of MEADOW_FLOWERS[variant]!) {
    if (field[y * TILE + x]!.d < MEADOW_FADE) continue;
    s.set(x, y + 1, 'c').set(x - 1, y + 2, 'c');
    s.set(x, y, colour)
      .set(x + 1, y, colour)
      .set(x, y - 1, colour);
    s.set(x + 1, y - 1, colour === 'w' ? 'W' : colour).set(x + 1, y + 1, 'o');
    s.set(x, y, colour === 'y' ? 'o' : 'y');
  }
  return s.toSource();
}

export const MEADOW_PALETTE: Palette = {
  [CLEAR]: null,
  m: C.meadow,
  M: C.meadowLight,
  c: mix(C.meadow, C.leafDark, 0.6),
  w: C.white,
  W: C.cream,
  y: C.candle,
  p: C.lavender,
  r: C.roseLight,
  o: C.goldShade,
};

// ---- Long grass -------------------------------------------------------------------------------

/**
 * Long grass: a deeper green thick with blades, each a stroke a few pixels tall lit at its tip,
 * darker along its front where it stands up off the lawn, thinning into the lawn at its sides.
 */
export function drawLongGrass(field: readonly TrackEdge[], variant: number): SpriteSource {
  const s = new Sketch(TILE, TILE, 'n');
  paintFrom(s, field, (e, x, y) => {
    if (!holds(e, x, y, LONG_GRASS_FADE)) return CLEAR;
    if (e.ny > 0.5 && e.d < LONG_GRASS_FADE + 1) return 'k';
    return 'n';
  });
  for (let x = 0; x < TILE; x++) {
    for (let y = 0; y < TILE; y++) {
      const g = grainOf(x, y, variant + 17);
      if (g > 0.16) continue;
      const tall = 3 + Math.floor(grainOf(y, x, 5) * 3);
      for (let j = 0; j < tall; j++) {
        const at = y - j;
        if (at < 0 || s.get(x, at) === CLEAR || s.get(x, at) === 'k') break;
        s.set(x, at, j === tall - 1 ? 'L' : g < 0.05 ? 'o' : 'N');
      }
    }
  }
  return s.toSource();
}

export const LONG_GRASS_PALETTE: Palette = {
  [CLEAR]: null,
  n: C.longGrass,
  N: C.longGrassLight,
  L: ramp(C.longGrassLight)[3],
  o: ramp(C.longGrass)[1],
  k: mix(C.longGrass, C.grassShade, 0.6),
};
