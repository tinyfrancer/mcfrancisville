import type { TileId } from '../types/ids';
import { mix, PALETTE as C, ramp } from './palette';
import { CLEAR, Sketch } from './sketch';
import { rasterize, type Palette, type Raster, type SpriteSource } from './sprite';

/*
 * The ground at 32 pixels a tile (phase F). Grass is under everything; every other kind of ground
 * is laid over it, drawn from which of its eight neighbours are the same ground, so a pond gets a
 * bank all round with rounded corners, a path a worn kerb, a hedge a scalloped edge and a cliff a
 * face where the ground drops away. Each piece is still a grid of keys and a palette (decision 2);
 * the grids are drawn once per shape and cached.
 */

export const TILE = 32;

/** A tile's neighbours that are the same ground, one bit each, clockwise from above. */
export const N = 1;
export const NE = 2;
export const E = 4;
export const SE = 8;
export const S = 16;
export const SW = 32;
export const W = 64;
export const NW = 128;

/** Every kind of ground laid over the grass. */
export type Terrain = Exclude<TileId, 'grass'>;

export const TERRAINS: readonly Terrain[] = ['path', 'water', 'bed', 'cliff', 'steps', 'hedge'];

/**
 * Whether `other` carries on the ground `self` is, so no edge is drawn between them. Off the map
 * it always does, so a hedge at the edge runs on out of sight. Steps carry a path on, and a cliff
 * runs straight into the steps cut through it, which have walls of their own.
 */
export function continues(self: TileId, other: TileId | undefined): boolean {
  if (other === undefined || other === self) return true;
  if (self === 'path') return other === 'steps';
  if (self === 'steps') return other === 'path';
  if (self === 'cliff') return other === 'steps';
  return false;
}

const AROUND: readonly (readonly [number, number, number])[] = [
  [0, -1, N],
  [1, -1, NE],
  [1, 0, E],
  [1, 1, SE],
  [0, 1, S],
  [-1, 1, SW],
  [-1, 0, W],
  [-1, -1, NW],
];

/**
 * Which neighbours of the tile at (tx, ty) continue its ground, as bits. A corner only counts when
 * both sides beside it do, since otherwise the sides decide the edge, so there are 47 shapes.
 */
export function neighbourMask(
  tileAt: (tx: number, ty: number) => TileId | undefined,
  tx: number,
  ty: number,
): number {
  const self = tileAt(tx, ty);
  if (self === undefined) return 0;
  let mask = 0;
  for (const [dx, dy, bit] of AROUND) if (continues(self, tileAt(tx + dx, ty + dy))) mask |= bit;
  return reduce(mask);
}

function reduce(mask: number): number {
  let out = mask & (N | E | S | W);
  for (const [corner, a, b] of [
    [NE, N, E],
    [SE, S, E],
    [SW, S, W],
    [NW, N, W],
  ] as const) {
    if (mask & corner && mask & a && mask & b) out |= corner;
  }
  return out;
}

/**
 * A whole number from a tile's position that is the same every time, so the ground is scattered
 * the same way on every visit without anything being saved.
 */
export function tileHash(tx: number, ty: number): number {
  let h = Math.imul(tx, 73856093) ^ Math.imul(ty, 19349663);
  h = Math.imul(h ^ (h >>> 13), 1274126177);
  return (h ^ (h >>> 16)) >>> 0;
}

/** Which of `count` looks a tile wears. The plain one is half of all tiles, so it stays calm. */
export function variantOf(tx: number, ty: number, count: number): number {
  if (count <= 1) return 0;
  const roll = tileHash(tx, ty) % (count * 2);
  return roll < count ? roll : 0;
}

// ---- The shape of an edge ---------------------------------------------------------------------

/** How far a pixel is inside its ground, and which way the nearest edge lies. */
interface Edge {
  /** Pixels in from the edge; zero or less is outside. Infinite with no edge near. */
  d: number;
  /** The way out, a unit vector (0, 0 in the middle of a pond). */
  nx: number;
  ny: number;
  /** How far along the nearest edge, for scallops and tufts that repeat along it. */
  along: number;
}

/**
 * The distance to the edge for every pixel of a tile of the given shape. Open sides are straight
 * edges; where two open sides meet the corner is rounded to `radius`; where two closed sides meet
 * an open corner, the edge wraps round the point of it.
 */
function edges(mask: number, radius: number): Edge[] {
  const open = (bit: number) => (mask & bit) === 0;
  const out: Edge[] = [];
  const r = radius;
  for (let y = 0; y < TILE; y++) {
    for (let x = 0; x < TILE; x++) {
      const px = x + 0.5;
      const py = y + 0.5;
      let best: Edge = { d: Infinity, nx: 0, ny: 0, along: x };
      const take = (d: number, nx: number, ny: number, along: number) => {
        if (d < best.d) best = { d, nx, ny, along };
      };
      if (open(N)) take(py, 0, -1, x);
      if (open(S)) take(TILE - py, 0, 1, x);
      if (open(W)) take(px, -1, 0, y);
      if (open(E)) take(TILE - px, 1, 0, y);
      // Rounded outer corners: inside the corner's square, the arc is the edge.
      for (const [a, b, cx, cy] of [
        [N, W, r, r],
        [N, E, TILE - r, r],
        [S, W, r, TILE - r],
        [S, E, TILE - r, TILE - r],
      ] as const) {
        if (!open(a) || !open(b)) continue;
        const inX = cx < TILE / 2 ? px < cx : px > cx;
        const inY = cy < TILE / 2 ? py < cy : py > cy;
        if (!inX || !inY) continue;
        const dx = px - cx;
        const dy = py - cy;
        const dist = Math.hypot(dx, dy);
        best = { d: r - dist, nx: dx / dist, ny: dy / dist, along: x + y };
      }
      // Inner corners: the ground beyond the diagonal comes to a point at the corner.
      for (const [a, b, corner, cx, cy] of [
        [N, W, NW, 0, 0],
        [N, E, NE, TILE, 0],
        [S, W, SW, 0, TILE],
        [S, E, SE, TILE, TILE],
      ] as const) {
        if (open(a) || open(b) || !open(corner)) continue;
        const dx = cx - px;
        const dy = cy - py;
        const dist = Math.hypot(dx, dy);
        take(dist, dx / dist, dy / dist, x + y);
      }
      out.push(best);
    }
  }
  return out;
}

/** A 4×4 ordered dither, so a tone steps into the next without a band, lined up across tiles. */
const BAYER = [0, 8, 2, 10, 12, 4, 14, 6, 3, 11, 1, 9, 15, 7, 13, 5].map((n) => (n + 0.5) / 16);
const dither = (x: number, y: number) => BAYER[(y % 4) * 4 + (x % 4)]!;

/** Paints each pixel from its edge, leaving it see-through where `key` gives null. */
function paint(s: Sketch, field: readonly Edge[], key: (e: Edge, x: number, y: number) => string) {
  for (let y = 0; y < TILE; y++) {
    for (let x = 0; x < TILE; x++) {
      const e = field[y * TILE + x]!;
      const k = e.d <= 0 ? CLEAR : key(e, x, y);
      if (k !== s.get(x, y)) s.set(x, y, k);
    }
  }
}

/** Facing the viewer's far side (the top), the near side (the bottom), or a side. */
const facesUp = (e: Edge) => e.ny < -0.5;
const facesDown = (e: Edge) => e.ny > 0.5;

/** A scallop along an edge, 0–`depth` pixels deep, repeating every `period` so tiles meet. */
function scallop(along: number, period: number, depth: number): number {
  const t = (((along % period) + period) % period) / period;
  return Math.round(((1 - Math.cos(t * Math.PI * 2)) / 2) * depth);
}

// ---- Grass ------------------------------------------------------------------------------------

const GRASS_TUFTS: readonly (readonly (readonly [number, number])[])[] = [
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

export const GRASS_VARIANTS = GRASS_TUFTS.length;

/**
 * A tile of grass: a few tufts lit on their left, a darker blade under each, and on one look in
 * eight a tiny flower. Calm, so what stands on it reads (`docs/art_style.md`).
 */
function grass(variant: number): SpriteSource {
  const s = new Sketch(TILE, TILE, 'g');
  for (const [x, y] of GRASS_TUFTS[variant]!) {
    s.set(x, y, 'G')
      .set(x + 2, y, 'G')
      .set(x + 1, y - 1, 'L')
      .set(x, y - 1, 'G');
    s.set(x + 1, y + 1, 'd');
  }
  if (variant === 3) s.set(20, 27, 'f').set(19, 27, 'y').set(21, 27, 'y').set(20, 26, 'y');
  if (variant === 2) s.set(14, 14, 'd').set(15, 13, 'd').set(22, 23, 'd');
  return s.toSource();
}

const GRASS_PALETTE: Palette = {
  [CLEAR]: null,
  g: C.moss,
  G: C.mossLight,
  L: ramp(C.mossLight)[3],
  d: C.mossDark,
  f: C.candle,
  y: C.lavender,
};

// ---- Paths ------------------------------------------------------------------------------------

/** Cobbles as ellipses (centre, radii), each set a look of its own. */
const COBBLES: readonly (readonly (readonly [number, number, number, number])[])[] = [
  [
    [7, 6, 6, 5],
    [21, 5, 8, 5],
    [4, 18, 5, 6],
    [15, 16, 6, 5],
    [27, 17, 5, 5],
    [9, 27, 7, 4.5],
    [24, 28, 6, 4.5],
  ],
  [
    [5, 5, 5, 4.5],
    [17, 6, 7, 5],
    [28, 7, 4, 5],
    [9, 16, 7, 5],
    [23, 17, 7, 5],
    [5, 27, 5, 4.5],
    [17, 27, 7, 4.5],
    [28, 27, 4, 4.5],
  ],
  [
    [8, 7, 7, 5.5],
    [23, 6, 7, 5],
    [5, 19, 5, 5],
    [17, 18, 7, 5.5],
    [28, 19, 4, 5],
    [11, 28, 8, 4],
    [26, 28, 6, 4],
  ],
];

/**
 * Cobbles set in mortar, with a dark kerb where the path meets the grass, and grass creeping over
 * it here and there.
 */
function path(mask: number, variant: number): SpriteSource {
  const s = new Sketch(TILE, TILE, 'm');
  for (const [cx, cy, rx, ry] of COBBLES[variant]!) s.ellipse(cx, cy, rx, ry, 's');
  s.bevel('s', 'L', 'S');
  paint(s, edges(mask, 8), (e, x, y) => {
    const tuft = (e.along * 7 + variant * 5) % 13;
    if (e.d < 2.5 && tuft < 2) return tuft === 0 ? 'G' : 'g';
    if (e.d < 1.5 && tuft === 2) return 'g';
    if (e.d < 1) return 'k';
    if (e.d < 2) return 'm';
    return s.get(x, y)!;
  });
  return s.toSource();
}

const PATH_PALETTE: Palette = {
  [CLEAR]: null,
  k: ramp(C.stone)[0],
  m: C.stoneDark,
  s: C.stone,
  S: ramp(C.stone)[1],
  L: C.stoneLight,
  g: C.moss,
  G: C.mossLight,
};

// ---- Water ------------------------------------------------------------------------------------

/** Short glints on the water, as (x, y, length), kept inside the tile so tiles meet cleanly. */
const RIPPLES: readonly (readonly (readonly [number, number, number])[])[] = [
  [
    [4, 6, 4],
    [19, 12, 5],
    [8, 22, 3],
    [22, 26, 4],
  ],
  [
    [12, 4, 3],
    [3, 15, 5],
    [22, 19, 4],
    [13, 28, 3],
  ],
];

/**
 * Water sunk below the grass: its far bank shows as a face of earth, the near one as a lip, a
 * light line where it laps at them, and deeper water dithered in away from the edge.
 */
function water(mask: number, variant: number): SpriteSource {
  const s = new Sketch(TILE, TILE, 'w');
  for (const [x, y, length] of RIPPLES[variant]!) s.rect(x, y, length, 1, 'W');
  paint(s, edges(mask, 7), (e, x, y) => {
    const bank = facesUp(e) ? 6 : facesDown(e) ? 1 : 2;
    if (e.d < 1) return facesUp(e) ? 'G' : 'o';
    if (e.d < bank) {
      if (facesUp(e) && e.d < 2) return 'B';
      return e.d >= bank - 1 ? 'o' : 'b';
    }
    if (e.d < bank + 1) return 'l';
    if (e.d < bank + 3) return 'w';
    const depth = (e.d - 9) / 8;
    if (depth > dither(x, y)) return s.get(x, y) === 'W' ? 'w' : 'd';
    return s.get(x, y)!;
  });
  return s.toSource();
}

const WATER_PALETTE: Palette = {
  [CLEAR]: null,
  G: C.mossLight,
  B: ramp(C.earth)[3],
  b: C.earth,
  o: ramp(C.earth)[0],
  l: ramp(C.water)[3],
  w: C.water,
  W: C.waterLight,
  d: ramp(C.water)[1],
};

// ---- Hedges -----------------------------------------------------------------------------------

/**
 * Leafy clumps in a 32-pixel repeat, as (x, y, radius), so every hedge tile carries the same
 * pattern on and a long hedge is one hedge.
 */
const CLUMPS: readonly (readonly [number, number, number])[] = [
  [4, 3, 8],
  [20, 6, 9],
  [11, 14, 8],
  [28, 17, 8],
  [3, 24, 9],
  [19, 26, 9],
];

/**
 * A clipped hedge of round leafy clumps, each lit from the top left and dark where they tuck
 * behind each other, with a scalloped edge and a shaded face along its front.
 */
function hedge(mask: number, variant: number): SpriteSource {
  const s = new Sketch(TILE, TILE, 'd');
  const placed = CLUMPS.flatMap(([x, y, r]) =>
    [-TILE, 0, TILE].flatMap((dy) => [-TILE, 0, TILE].map((dx) => [x + dx, y + dy, r] as const)),
  ).sort((p, q) => p[1] - q[1]);
  for (const [x, y, r] of placed) s.sphere(x, y, r, r * 0.85, 'odhHL', { dither: true });
  if (variant === 1) s.set(9, 11, 'b').set(10, 10, 'b').set(23, 22, 'b').set(24, 23, 'b');
  const field = edges(mask, 9);
  paint(s, field, (e, x, y) => {
    const d = e.d - scallop(e.along, 8, 2);
    if (d <= 0) return CLEAR;
    if (d < 1) return 'o';
    if (facesDown(e) && e.d < 10) return shade(s.get(x, y)!);
    return s.get(x, y)!;
  });
  return s.toSource();
}

/** One tone darker, for the face of a hedge in its own shade. */
function shade(key: string): string {
  return { L: 'H', H: 'h', h: 'd', d: 'o', b: 'd' }[key] ?? key;
}

const HEDGE_PALETTE: Palette = {
  [CLEAR]: null,
  o: ramp(C.hedge)[0],
  d: ramp(C.hedge)[1],
  h: C.hedge,
  H: C.hedgeLight,
  L: ramp(C.hedgeLight)[3],
  b: C.lavender,
};

// ---- Garden beds ------------------------------------------------------------------------------

/** Weeds on the bare earth, as (x, y). */
const WEEDS: readonly (readonly (readonly [number, number])[])[] = [
  [
    [7, 9],
    [21, 17],
    [12, 24],
  ],
  [
    [18, 7],
    [6, 19],
    [24, 25],
  ],
];

/**
 * A raised bed before she's tilled it: bare earth with a weed or two inside a frame of boards,
 * whose front face shows where the bed ends. Tilled soil is laid over it (`sprites/garden.ts`).
 */
function bed(mask: number, variant: number): SpriteSource {
  const s = new Sketch(TILE, TILE, 'd');
  for (const [x, y] of WEEDS[variant]!) {
    s.set(x, y, 'g')
      .set(x - 1, y - 1, 'G')
      .set(x + 1, y - 1, 'G')
      .set(x, y - 2, 'G');
  }
  for (let i = 0; i < 6; i++)
    s.set(((i * 11 + variant * 7) % 30) + 1, ((i * 13 + 5) % 30) + 1, 'e');
  paint(s, edges(mask, 3), (e, x, y) => {
    if (e.d < 1) return 'k';
    if (facesDown(e)) {
      if (e.d < 5) return 'f';
      if (e.d < 6) return 'F';
    } else if (e.d < 3) {
      return facesUp(e) || e.nx < -0.5 ? (e.d < 2 ? 'F' : 'f') : 'f';
    }
    return s.get(x, y)!;
  });
  return s.toSource();
}

const BED_PALETTE: Palette = {
  [CLEAR]: null,
  d: C.soilDark,
  e: C.soil,
  g: C.moss,
  G: C.mossLight,
  f: C.wood,
  F: ramp(C.wood)[3],
  k: C.barkDark,
};

// ---- Cliffs and steps -------------------------------------------------------------------------

/**
 * The rock face in a 32-pixel repeat: rounded stones as (x, y, rx, ry), so a cliff is rough rock
 * and a long or tall one runs on without a seam. It has one look, since two would meet in a seam.
 */
const BOULDERS: readonly (readonly (readonly [number, number, number, number])[])[] = [
  [
    [5, 4, 7, 6],
    [19, 3, 8, 5],
    [30, 9, 5, 6],
    [11, 15, 7, 6],
    [25, 19, 7, 6],
    [3, 25, 6, 6],
    [15, 28, 8, 5],
  ],
];

/**
 * A cliff: warm rock in rounded stones, each lit from the top left, with dark cracks between.
 * Where the ground above it is open, the grass of the top hangs over it; where the ground below
 * is, it meets it in shadow. Its sides round off.
 */
function cliff(mask: number, variant: number): SpriteSource {
  const s = new Sketch(TILE, TILE, 'q');
  const placed = BOULDERS[variant]!.flatMap(([x, y, rx, ry]) =>
    [-TILE, 0, TILE].flatMap((dy) =>
      [-TILE, 0, TILE].map((dx) => [x + dx, y + dy, rx, ry] as const),
    ),
  ).sort((p, q) => p[1] - q[1]);
  for (const [x, y, rx, ry] of placed) s.sphere(x, y, rx, ry, 'qQrrRL');
  const openTop = (mask & N) === 0;
  paint(s, edges(mask, 6), (e, x, y) => {
    if (openTop) {
      const lip = 5 + scallop(x, 6, 2);
      if (y < lip - 1) return y === 0 ? 'G' : 'g';
      if (y < lip) return 'o';
    }
    if (e.d < 1) return 'o';
    if (facesDown(e) && e.d < 3) return 'q';
    if (e.nx > 0.5 && e.d < 3) return 'q';
    return s.get(x, y)!;
  });
  return s.toSource();
}

/** Stone steps up through a cliff: lit treads over shaded risers, with rock walls either side. */
function steps(mask: number): SpriteSource {
  const s = new Sketch(TILE, TILE, 's');
  for (let y = 0; y < TILE; y++) {
    const at = y % 8;
    if (at === 0) s.rect(0, y, TILE, 1, 't');
    if (at >= 6) s.rect(0, y, TILE, 1, 'S');
  }
  const field = edges(mask, 1);
  for (let y = 0; y < TILE; y++) {
    for (let x = 0; x < TILE; x++) {
      const e = field[y * TILE + x]!;
      const wall = Math.abs(e.nx) > 0.5 && e.d < 5;
      if (!wall) continue;
      s.set(x, y, e.d < 1 ? 'o' : e.nx < 0 ? (e.d < 2 ? 'R' : 'r') : e.d < 3 ? 'q' : 'r');
    }
  }
  return s.toSource();
}

const ROCK_PALETTE: Palette = {
  [CLEAR]: null,
  o: ramp(C.cliff)[0],
  q: ramp(C.cliff)[1],
  Q: mix(C.cliff, ramp(C.cliff)[1], 0.5),
  r: C.cliff,
  R: ramp(C.cliff)[3],
  L: ramp(C.cliff)[4],
  g: C.moss,
  G: C.mossLight,
  s: C.stone,
  S: ramp(C.stone)[1],
  t: C.stoneLight,
};

// ---- Putting the ground together ---------------------------------------------------------------

interface TerrainArt {
  palette: Palette;
  /** How many looks it comes in. */
  variants: number;
  draw: (mask: number, variant: number) => SpriteSource;
}

export const TERRAIN_ART: Record<Terrain, TerrainArt> = {
  path: { palette: PATH_PALETTE, variants: COBBLES.length, draw: path },
  water: { palette: WATER_PALETTE, variants: RIPPLES.length, draw: water },
  hedge: { palette: HEDGE_PALETTE, variants: 2, draw: hedge },
  bed: { palette: BED_PALETTE, variants: WEEDS.length, draw: bed },
  cliff: { palette: ROCK_PALETTE, variants: BOULDERS.length, draw: cliff },
  steps: { palette: ROCK_PALETTE, variants: 1, draw: steps },
};

/** One picture laid on a tile of ground: its cache key, its grid and its palette. */
export interface GroundPiece {
  key: string;
  source: SpriteSource;
  palette: Palette;
}

const drawn = new Map<string, SpriteSource>();

function piece(key: string, palette: Palette, draw: () => SpriteSource): GroundPiece {
  let source = drawn.get(key);
  if (!source) {
    source = draw();
    drawn.set(key, source);
  }
  return { key, source, palette };
}

export function grassPiece(variant: number): GroundPiece {
  return piece(`ground:grass:${variant}`, GRASS_PALETTE, () => grass(variant));
}

export function terrainPiece(terrain: Terrain, mask: number, variant: number): GroundPiece {
  const art = TERRAIN_ART[terrain];
  return piece(`ground:${terrain}:${mask}:${variant}`, art.palette, () => art.draw(mask, variant));
}

/**
 * What the ground at (tx, ty) is drawn from, bottom first: the grass, and whatever is laid over it
 * shaped by its neighbours. Shared by the renderer and the catalogue.
 */
export function groundPieces(
  tileAt: (tx: number, ty: number) => TileId | undefined,
  tx: number,
  ty: number,
): GroundPiece[] {
  const pieces = [grassPiece(variantOf(tx, ty, GRASS_VARIANTS))];
  const id = tileAt(tx, ty);
  if (id !== undefined && id !== 'grass') {
    const variant = variantOf(tx + 101, ty + 37, TERRAIN_ART[id].variants);
    pieces.push(terrainPiece(id, neighbourMask(tileAt, tx, ty), variant));
  }
  return pieces;
}

/**
 * A patch of every kind of ground side by side, for looking at how the edges meet: a pond, a path
 * crossing the grass, a hedge, a garden bed and a cliff with steps up it. Letters as in the maps.
 */
const SAMPLE: readonly string[] = [
  '############',
  '#CCCCCCC...#',
  '#CCCCsCC.~~#',
  '#...=s...~~#',
  '#.===....~.#',
  '#.=...~~~~.#',
  '#.=.x.~~~..#',
  '#.=.xx.....#',
  '#.=....##..#',
  '############',
];

const SAMPLE_KEY: Readonly<Record<string, TileId>> = {
  '#': 'hedge',
  '.': 'grass',
  '=': 'path',
  '~': 'water',
  x: 'bed',
  C: 'cliff',
  s: 'steps',
};

/** The sample patch of ground, drawn as the renderer lays it. */
export function groundSample(): Raster {
  const rows = SAMPLE.length;
  const cols = SAMPLE[0]!.length;
  const tileAt = (tx: number, ty: number) => {
    const ch = SAMPLE[ty]?.[tx];
    return ch === undefined ? undefined : SAMPLE_KEY[ch];
  };
  const width = cols * TILE;
  const height = rows * TILE;
  const data = new Uint8ClampedArray(width * height * 4);
  for (let ty = 0; ty < rows; ty++) {
    for (let tx = 0; tx < cols; tx++) {
      for (const p of groundPieces(tileAt, tx, ty)) {
        const r = rasterize(p.source, p.palette);
        for (let j = 0; j < TILE; j++) {
          for (let i = 0; i < TILE; i++) {
            const from = (j * TILE + i) * 4;
            if (r.data[from + 3] === 0) continue;
            data.set(
              r.data.subarray(from, from + 4),
              ((ty * TILE + j) * width + tx * TILE + i) * 4,
            );
          }
        }
      }
    }
  }
  return { width, height, data };
}
