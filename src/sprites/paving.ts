import { mix, PALETTE as C, ramp } from './palette';
import { seeded } from '../systems/random';
import { CLEAR, Sketch } from './sketch';
import { grainOf, type Phase, type TrackEdge } from './tracks';
import type { Palette, SpriteSource } from './sprite';

/*
 * The square's paving (1.1's A1): flagstones, and a ring of setts round the well. Both are laid on
 * the world's grid rather than the tile's, so a slab runs on over the seam between two tiles and
 * the square is one floor, not a grid of tiles: a piece is drawn for where its tile sits in an
 * eight-tile repeat (`Phase`) as well as for its shape. Where the paving meets the lawn it stops
 * at a kerb, the town's one built edge; where it meets the cobbles, at a kerb too, and the cobbles
 * run up to it.
 */

const TILE = 32;

/** How many pixels the slabs take to come round again: eight tiles, wider than the square. */
const REPEAT = TILE * 8;

/** The slabs are laid on a grid of this many pixels: each is two to four of them a side. */
const UNIT = 8;
const UNITS = REPEAT / UNIT;

/** The slabs' shapes, in units, the first that fits taken from a shuffle of these. */
const SHAPES: readonly (readonly [number, number])[] = [
  [3, 2],
  [2, 2],
  [4, 2],
  [3, 3],
  [2, 3],
  [4, 3],
  [3, 2],
  [2, 2],
];

/**
 * The slabs over the whole repeat, a key a pixel: random flagstones fitted together on a grid of
 * `UNIT`s (the first shape from a shuffle that fits each gap, scanning across and down, wrapping
 * round), a joint along each slab's foot and right side, a lit row along its top and left, and
 * its face in one of three stones (most the middle one), with a pit here and there and the odd
 * hairline crack.
 */
const FLAGS: readonly string[] = (() => {
  const grid: string[] = Array.from({ length: REPEAT * REPEAT }, () => 'f');
  const taken = new Uint8Array(UNITS * UNITS);
  const at = (u: number, v: number) => (((v % UNITS) + UNITS) % UNITS) * UNITS + (u % UNITS);
  const rand = seeded(1031);
  for (let v = 0; v < UNITS; v++) {
    for (let u = 0; u < UNITS; u++) {
      if (taken[at(u, v)]) continue;
      const order = [...SHAPES].sort(() => rand() - 0.5);
      const fits = ([w, h]: readonly [number, number]) => {
        for (let j = 0; j < h; j++)
          for (let i = 0; i < w; i++) if (taken[at(u + i, v + j)]) return false;
        return true;
      };
      // A gap too small for any shape is a small stone filling it, as wide as it goes.
      let [w, h] = order.find(fits) ?? [1, 1];
      if (!order.some(fits)) {
        while (w < 2 && !taken[at(u + w, v)]) w++;
        h = 1;
      }
      for (let j = 0; j < h; j++) for (let i = 0; i < w; i++) taken[at(u + i, v + j)] = 1;
      const roll = rand();
      const face = roll < 0.56 ? 'f' : roll < 0.8 ? 'F' : 'g';
      const lit = face === 'g' ? 'f' : 'h';
      const width = w * UNIT;
      const height = h * UNIT;
      const cracked = width >= 24 && rand() < 0.2;
      const crackAt = 4 + Math.floor(rand() * (width - 12));
      for (let j = 0; j < height; j++) {
        for (let i = 0; i < width; i++) {
          const x = (u * UNIT + i) % REPEAT;
          const y = (v * UNIT + j) % REPEAT;
          let key = face;
          if (j === height - 1 || i === width - 1) key = 'j';
          else if (j === 0 || i === 0) key = lit;
          else if (cracked && j >= 3 && j < height - 3 && i === crackAt + Math.floor(j / 3)) {
            key = 'g';
          } else if (grainOf(x, y, 23) < 0.025) key = 'g';
          grid[y * REPEAT + x] = key;
        }
      }
    }
  }
  return grid;
})();

/** The slab's pixel at (x, y) of a tile that sits at `at` in the repeat. */
function flagAt(at: Phase, x: number, y: number): string {
  const wx = (at.px * TILE + x) % REPEAT;
  const wy = (at.py * TILE + y) % REPEAT;
  return FLAGS[wy * REPEAT + wx]!;
}

/** How far along an edge a pixel is, in the world: along a row for a top or bottom edge. */
function alongOf(e: TrackEdge, at: Phase, x: number, y: number): number {
  const wx = at.px * TILE + x;
  const wy = at.py * TILE + y;
  if (Math.abs(e.ny) > 0.5) return wx;
  if (Math.abs(e.nx) > 0.5) return wy;
  return wx + wy;
}

/** How wide the kerb is, in from where the paving ends, and how long each of its stones. */
const KERB = 5;
const KERB_STONE = 16;

/**
 * A kerb stone's pixel, `d` in from the paving's end: a dark lip where it drops to the ground
 * beyond, the stone lit along its top, a joint every `KERB_STONE`, and a joint between it and the
 * paving inside.
 */
function kerb(e: TrackEdge, d: number, along: number): string {
  if (d < 1) return 'k';
  if (d >= KERB - 1) return 'j';
  if (((along % KERB_STONE) + KERB_STONE) % KERB_STONE === 0) return 'j';
  return d < 2 && e.ny < 0.5 ? 'h' : 'K';
}

/** How deep a course of setts is, and how long each sett along it. */
const COURSE = 6;
const SETT = 8;

/** How far the ring of setts reaches out from the well's footprint onto the square. */
const RING = 30;

/** A neighbour of a tile as a bit, and which way it lies. */
const AROUND: readonly (readonly [number, number, number])[] = [
  [0, -1, 1],
  [1, -1, 2],
  [1, 0, 4],
  [1, 1, 8],
  [0, 1, 16],
  [-1, 1, 32],
  [-1, 0, 64],
  [-1, -1, 128],
];

/**
 * How far a pixel of a tile is from the nearest of its neighbours that are setts (`near`, a bit
 * each as `neighbourMask`'s), and which way it lies from them: a straight edge beside one, and
 * round its corner beside a diagonal one, so the ring rounds off.
 */
function fromSetts(near: number, x: number, y: number): TrackEdge {
  const px = x + 0.5;
  const py = y + 0.5;
  let best: TrackEdge = { d: Infinity, nx: 0, ny: 0, along: 0 };
  for (const [dx, dy, bit] of AROUND) {
    if (!(near & bit)) continue;
    const ox = Math.max(dx * TILE - px, 0, px - (dx * TILE + TILE));
    const oy = Math.max(dy * TILE - py, 0, py - (dy * TILE + TILE));
    const d = Math.hypot(ox, oy);
    if (d < best.d) {
      const sx = px < dx * TILE ? -1 : px > dx * TILE + TILE ? 1 : 0;
      const sy = py < dy * TILE ? -1 : py > dy * TILE + TILE ? 1 : 0;
      best = { d, nx: sx * (ox / (d || 1)), ny: sy * (oy / (d || 1)), along: 0 };
    }
  }
  return best;
}

/**
 * A sett's pixel `u` out from the edge of the well's footprint (less than zero under it), `along`
 * the edge: courses that run round the footprint, each set half a sett on from the last.
 */
function sett(u: number, along: number): string {
  const course = Math.floor(u / COURSE);
  const inCourse = u - course * COURSE;
  const run = along + (((course % 2) + 2) % 2) * (SETT / 2);
  if (inCourse >= COURSE - 1 || ((run % SETT) + SETT) % SETT === SETT - 1) return 'q';
  const tone = grainOf(Math.floor(run / SETT) & 63, course & 63, 41);
  const face = tone < 0.3 ? 't' : tone > 0.8 ? 'S' : 's';
  return inCourse < 1 && face !== 'S' ? 'u' : face;
}

/**
 * Flagstones: big slabs in courses, laid on the world's grid, inside a kerb wherever the square
 * ends, at the lawn or the cobbles, and round the well a ring of setts reaching a tile out from
 * its footprint (`near` says which neighbours are under it). `lawn` is the field to where the
 * paving ends at the grass (nothing is drawn past it), `own` the field to where it ends at
 * anything else.
 */
export function drawFlagstones(
  lawn: readonly TrackEdge[],
  own: readonly TrackEdge[],
  near: number,
  at: Phase,
): SpriteSource {
  const s = new Sketch(TILE, TILE, 'f');
  for (let y = 0; y < TILE; y++) {
    for (let x = 0; x < TILE; x++) {
      const i = y * TILE + x;
      const e = own[i]!;
      const ring = near ? fromSetts(near, x, y) : null;
      if (lawn[i]!.d <= 0) s.set(x, y, CLEAR);
      else if (ring && ring.d < RING) {
        const along = alongOf(ring, at, x, y);
        const k = RING - ring.d;
        s.set(x, y, k < KERB ? kerb(ring, k, along) : sett(ring.d, along));
      } else if (e.d < KERB) s.set(x, y, kerb(e, e.d, alongOf(e, at, x, y)));
      else s.set(x, y, flagAt(at, x, y));
    }
  }
  return s.toSource();
}

/**
 * The setts under the well, in courses running round its footprint as the ring outside does, so
 * whatever of them shows round the well's foot carries the ring on in. `own` is the field to the
 * footprint's edge, `lawn` to where any paving ends at the grass.
 */
export function drawSetts(
  lawn: readonly TrackEdge[],
  own: readonly TrackEdge[],
  at: Phase,
): SpriteSource {
  const s = new Sketch(TILE, TILE, 's');
  for (let y = 0; y < TILE; y++) {
    for (let x = 0; x < TILE; x++) {
      const i = y * TILE + x;
      const e = own[i]!;
      if (lawn[i]!.d <= 0) s.set(x, y, CLEAR);
      else if (!Number.isFinite(e.d)) s.set(x, y, sett(-(at.py * TILE + y), at.px * TILE + x));
      else s.set(x, y, sett(-e.d, alongOf(e, at, x, y)));
    }
  }
  return s.toSource();
}

/** The square's stone: a warm sandstone grey, apart from the cobbles' lavender. */
const SLAB = mix(C.stone, C.creamShade, 0.3);
/** The setts round the well, a darker plum stone, so the well sits in a ring. */
const SETTS = mix(C.stoneDark, C.stone, 0.35);

export const PAVING_PALETTE: Palette = {
  [CLEAR]: null,
  f: SLAB,
  F: mix(SLAB, ramp(SLAB)[3], 0.45),
  g: mix(SLAB, ramp(SLAB)[1], 0.45),
  h: mix(SLAB, ramp(SLAB)[3], 0.8),
  j: mix(ramp(SLAB)[1], C.stoneDark, 0.3),
  K: mix(SLAB, C.stoneDark, 0.35),
  k: ramp(C.stoneDark)[1],
  s: SETTS,
  S: mix(SETTS, ramp(SETTS)[3], 0.5),
  t: mix(SETTS, ramp(SETTS)[1], 0.4),
  u: mix(SETTS, ramp(SETTS)[3], 0.25),
  q: ramp(SETTS)[1],
};
