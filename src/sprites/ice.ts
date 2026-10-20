import type { TileId } from '../types/ids';
import { wobble, type BankEdge } from './banks';
import { mix, PALETTE as C, ramp } from './palette';
import { CLEAR, Sketch } from './sketch';
import type { Palette, SpriteSource } from './sprite';

/*
 * The frozen creeks (1.1's A3). The ice was a flat pale ribbon inside a hard dark line with a white
 * rim; now everything on it is worked out on the world's pixels, so it runs on over the seams
 * between tiles and never repeats in a pattern: soft patches of white and clear blue ice, darker
 * down the middle where it's thick over deep water, a frost along the bank that comes and goes,
 * stones set in the lip of the bank, a few hairline cracks and skate marks, and where the creek
 * meets open water a melt, the ice breaking into plates with water between them and floes drifting
 * off. The bank's shape is still L6's (`bankField`); its sheen is drawn by `render/life.ts` from
 * `sheenOf`, and the snow that lies on it in winter is `iceSnow`.
 */

const TILE = 32;

/** Where a tile sits in the world, in tiles. */
export interface At {
  tx: number;
  ty: number;
}

/**
 * How far a world pixel is from open water, in pixels: positive out on the ice, negative in the
 * water. Infinite (or anything past `MELT`) where no open water is near.
 */
export type Melt = (wx: number, wy: number) => number;

/** How far back from open water the ice starts to thin, in pixels. */
export const MELT = 26;

/** How far out from the bank stones sit in its lip, over the grass. */
export const LIP = 4;

function hash(x: number, y: number, salt: number): number {
  let h = Math.imul(x + salt * 7919, 0x27d4eb2d) ^ Math.imul(y - salt * 104729, 0x165667b1);
  h = Math.imul(h ^ (h >>> 15), 0x85ebca6b);
  h = Math.imul(h ^ (h >>> 13), 0xc2b2ae35);
  return (h ^ (h >>> 16)) >>> 0;
}

/** A 4×4 ordered dither on the world's pixels, so tones step into each other across a seam. */
const BAYER = [0, 8, 2, 10, 12, 4, 14, 6, 3, 11, 1, 9, 15, 7, 13, 5].map((n) => (n + 0.5) / 16);
const bayer = (wx: number, wy: number) => BAYER[(wy & 3) * 4 + (wx & 3)]!;

const clamp = (v: number, lo: number, hi: number) => Math.min(hi, Math.max(lo, v));

/**
 * A slow noise over the world from -1 to 1, at `scale` times the bank's wobble: two of it turned
 * across each other, so its shapes are blobs and streaks rather than the boxes of the grid one
 * wobble is laid on. `stretch` draws it out along the diagonal, for streaks blown by the wind.
 */
function noise(wx: number, wy: number, scale: number, salt: number, stretch = 1): number {
  const u = (wx * 0.8 + wy * 0.6) * scale;
  const v = ((wy * 0.8 - wx * 0.6) * scale) / stretch;
  const a = wobble(u + salt * 131, v + salt * 71);
  const b = wobble(u * 1.9 - v * 0.7 + salt * 37, v * 1.9 + u * 0.7 - salt * 53);
  return clamp((a * 0.7 + b * 0.45) * 1.15, -1, 1);
}

// ---- The bank ---------------------------------------------------------------------------------

/** How much further a creek's banks wander than a pond's, either way, in pixels. */
const MEANDER = 6;

/**
 * The bank across a tile of ice wandering further in and out than L6's four pixels, in long slow
 * bends, so a creek laid as a straight run of tiles reads as a creek and not a channel. Where she
 * can skate is still the tiles.
 */
export function meander(field: readonly BankEdge[], at: At): BankEdge[] {
  return field.map((e, i) =>
    Number.isFinite(e.d)
      ? {
          ...e,
          d: e.d - noise(at.tx * TILE + (i % TILE), at.ty * TILE + (i >> 5), 0.7, 37) * MEANDER,
        }
      : e,
  );
}

/** How much a pixel's bank faces the viewer's far side, from none to all (a face of earth). */
const upOf = (e: BankEdge) => clamp((-e.ny - 0.3) / 0.45, 0, 1);

/**
 * How tall the bank is above the ice where a pixel is: a face of earth on the far side, rising
 * smoothly as the bank turns to face the viewer, a sliver at the sides, and nothing on the near
 * side but its lip.
 */
function bankHeight(e: BankEdge): number {
  const up = upOf(e);
  return up > 0 ? 2 + Math.round(up * 4) : 1;
}

/** How wide the frost along the bank is here: from none to four pixels, coming and going. */
function frostWidth(wx: number, wy: number): number {
  return Math.max(0, 1.2 + noise(wx, wy, 1.7, 5) * 2.8);
}

/** Stones set in the lip of the bank: a stone's key for a pixel, or null. */
function stoneAt(wx: number, wy: number, d: number): string | null {
  if (d > 2.5 || d <= -LIP) return null;
  const size = 9;
  const ox = wx + 3 * Math.floor(wy / size);
  const cx = Math.floor(ox / size);
  const cy = Math.floor(wy / size);
  const h = hash(cx, cy, 3);
  if (h % 5 >= 2) return null;
  // A pebble four to six wide and three to five tall in its cell, lit from the top left.
  const rx = 2.6 + ((h >>> 4) % 3) * 0.5;
  const ry = 1.8 + ((h >>> 6) % 2) * 0.7;
  const mx = 1 + rx + ((h >>> 8) % 2);
  const my = 1 + ry + ((h >>> 10) % 2);
  const lx = ox - cx * size + 0.5 - mx;
  const ly = wy - cy * size + 0.5 - my;
  const r = (lx / rx) ** 2 + (ly / ry) ** 2;
  if (r > 1) return null;
  if (lx + ly < -rx * 0.7) return 't';
  if (ly > ry * 0.45 || r > 0.75) return 'S';
  return 's';
}

// ---- The ice's face ---------------------------------------------------------------------------

/** The ice's tones, frosted white to clear blue over deep water. */
const TONES = ['R', 'w', 'd', 'D'] as const;

/**
 * The ice's tone at a pixel `d` in from the bank: soft patches of white and clear ice from a slow
 * noise over the world, darker toward the middle where it's thick over deep water, and darker
 * again as it thins toward open water (`thin`, from none to all). Each step into the next is a
 * narrow band of dither, so the patches have soft edges and flat middles.
 */
function toneAt(wx: number, wy: number, d: number, thin: number): string {
  const deep = Number.isFinite(d) ? clamp((d - 6) / 22, 0, 1) : 1;
  const patch = noise(wx, wy, 0.7, 13);
  const level = clamp(0.7 + deep * 1.5 + patch * 1.05 + thin * 1.4, 0, TONES.length - 1);
  const base = Math.floor(level);
  const frac = clamp((level - base - 0.5) / 0.14 + 0.5, 0, 1);
  return TONES[Math.min(TONES.length - 1, frac > bayer(wx, wy) ? base + 1 : base)]!;
}

// ---- Cracks and skate marks -------------------------------------------------------------------

/** Every pixel of a line from one point to another, one pixel wide and joined on the diagonal. */
function lineOf(
  x0: number,
  y0: number,
  x1: number,
  y1: number,
  out: (x: number, y: number) => void,
) {
  const dx = Math.abs(x1 - x0);
  const dy = -Math.abs(y1 - y0);
  const sx = x0 < x1 ? 1 : -1;
  const sy = y0 < y1 ? 1 : -1;
  let err = dx + dy;
  for (let x = x0, y = y0; ;) {
    out(x, y);
    if (x === x1 && y === y1) return;
    const e2 = 2 * err;
    if (e2 >= dy) {
      err += dy;
      x += sx;
    }
    if (e2 <= dx) {
      err += dx;
      y += sy;
    }
  }
}

/** A wandering hairline from a point: a knot every few pixels, each turning it a little. */
function crackFrom(
  x: number,
  y: number,
  angle: number,
  length: number,
  seed: number,
  out: (x: number, y: number) => void,
): { x: number; y: number; angle: number }[] {
  const knots = [{ x, y, angle }];
  let a = angle;
  let px = x;
  let py = y;
  for (let k = 0, gone = 0; gone < length; k++) {
    const step = 5 + (hash(seed, k, 11) % 4);
    a += (((hash(seed, k, 13) % 61) - 30) * Math.PI) / 180;
    const nx = Math.round(px + Math.cos(a) * step);
    const ny = Math.round(py + Math.sin(a) * step);
    lineOf(px, py, nx, ny, out);
    px = nx;
    py = ny;
    gone += step;
    knots.push({ x: px, y: py, angle: a });
  }
  return knots;
}

/** The world pixels of the cracks that cross the tile at `at`, from seeds two tiles round it. */
function cracksOver(at: At): { cracks: Set<number>; scratches: Set<number> } {
  const cracks = new Set<number>();
  const scratches = new Set<number>();
  const x0 = at.tx * TILE;
  const y0 = at.ty * TILE;
  const into = (set: Set<number>) => (x: number, y: number) => {
    const lx = x - x0;
    const ly = y - y0;
    if (lx >= 0 && ly >= 0 && lx < TILE && ly < TILE) set.add(ly * TILE + lx);
  };
  for (let sy = at.ty - 2; sy <= at.ty + 2; sy++) {
    for (let sx = at.tx - 2; sx <= at.tx + 2; sx++) {
      const h = hash(sx, sy, 5);
      const x = sx * TILE + 4 + ((h >>> 4) % 24);
      const y = sy * TILE + 4 + ((h >>> 9) % 24);
      const seed = hash(sx, sy, 6);
      if (h % 5 < 2) {
        // A crack, wandering off in any direction, sometimes with a branch.
        const angle = (((h >>> 14) % 360) * Math.PI) / 180;
        const knots = crackFrom(x, y, angle, 16 + ((h >>> 23) % 26), seed, into(cracks));
        const fork = knots[2];
        if (fork && (h >>> 30) & 1) {
          const turn = ((seed >>> 3) & 1 ? 1 : -1) * (0.7 + ((seed >>> 5) % 5) * 0.1);
          crackFrom(
            fork.x,
            fork.y,
            fork.angle + turn,
            8 + ((seed >>> 9) % 8),
            seed + 1,
            into(cracks),
          );
        }
      } else if (h % 5 === 2) {
        // Where skates have been: a long gentle curve down to the right, or up.
        const length = 12 + ((h >>> 14) % 14);
        const fall = (h >>> 20) & 1 ? 1 : -1;
        const bend = ((h >>> 22) % 5) - 2;
        for (let i = 0; i < length; i++) {
          const t = i / length;
          into(scratches)(x + i, y + Math.round(fall * (i / 3) + bend * t * t * 3));
        }
      }
    }
  }
  return { cracks, scratches };
}

// ---- The melt ---------------------------------------------------------------------------------

/** How wide a plate of ice is as it breaks up, in pixels. */
const PLATE = 9;

/** A plate's middle, jittered in its cell on the world's grid. */
function plateMiddle(cx: number, cy: number): [number, number] {
  const h = hash(cx, cy, 21);
  return [cx * PLATE + 1 + (h % (PLATE - 2)), cy * PLATE + 1 + ((h >>> 8) % (PLATE - 2))];
}

/**
 * The plate a world pixel is in, the plate next to it, and how far the pixel is from the seam
 * between them.
 */
function plateOf(wx: number, wy: number) {
  const gx = Math.floor(wx / PLATE);
  const gy = Math.floor(wy / PLATE);
  let best = Infinity;
  let next = Infinity;
  let cx = gx;
  let cy = gy;
  let nx = gx;
  let ny = gy;
  for (let j = gy - 1; j <= gy + 1; j++) {
    for (let i = gx - 1; i <= gx + 1; i++) {
      const [mx, my] = plateMiddle(i, j);
      const d = Math.hypot(wx + 0.5 - mx, wy + 0.5 - my);
      if (d < best) {
        next = best;
        nx = cx;
        ny = cy;
        best = d;
        cx = i;
        cy = j;
      } else if (d < next) {
        next = d;
        nx = i;
        ny = j;
      }
    }
  }
  return { cx, cy, nx, ny, gap: next - best };
}

/** What a world pixel is as the ice melts into open water. */
type Melted = 'water' | 'plate' | 'seam';

/**
 * Near open water the ice breaks into plates: each plate lets go at its own distance from the
 * water (from a little out in the water, where a floe drifts, to well back on the ice), so the
 * edge is ragged and the last stretch is plates with water between them. Further back the plates
 * are still one sheet, cracked along their seams.
 */
function meltedAt(wx: number, wy: number, melt: Melt): Melted | null {
  const m = melt(wx, wy);
  if (!(m < MELT)) return null;
  if (m < -PLATE * 1.5) return 'water';
  const { cx, cy, nx, ny, gap } = plateOf(wx, wy);
  const [mx, my] = plateMiddle(cx, cy);
  const centre = melt(mx, my);
  const lets = -8 + (hash(cx, cy, 23) % 1000) * 0.024;
  if (centre < lets) return 'water';
  if (gap < 1.1) {
    if (centre < lets + 9) return 'water';
    // Back on the sheet only some seams have cracked, more of them nearer the water.
    const a = cx * 7919 + cy;
    const b = nx * 7919 + ny;
    const cracked = hash(Math.min(a, b), Math.max(a, b), 27) % 100;
    if (centre < MELT - 4 && cracked < 25 + (MELT - centre) * 3) return 'seam';
  }
  return 'plate';
}

/**
 * A world pixel of open water near the ice: a floe's key on it where a plate has drifted off, its
 * shadow on the water below one, or null for water.
 */
export function floeAt(wx: number, wy: number, melt: Melt): 'floe' | 'rim' | 'shadow' | null {
  if (melt(wx, wy) < -PLATE * 1.5) return null;
  const here = meltedAt(wx, wy, melt);
  if (here === 'plate') {
    if (meltedAt(wx, wy + 1, melt) === 'water' || meltedAt(wx + 1, wy, melt) === 'water') {
      return 'rim';
    }
    return 'floe';
  }
  const above = meltedAt(wx, wy - 1, melt);
  return above === 'plate' ? 'shadow' : null;
}

/**
 * The melt from the open water round a tile: how far each world pixel is from it, on a ragged
 * line, or null where no open water is within two tiles. Every tile asks the same of a pixel, so
 * plates meet across a seam.
 */
export function meltNear(
  tileAt: (tx: number, ty: number) => TileId | undefined,
  tx: number,
  ty: number,
): Melt | null {
  const open: [number, number][] = [];
  const dry: [number, number][] = [];
  for (let y = ty - 3; y <= ty + 3; y++) {
    for (let x = tx - 3; x <= tx + 3; x++) {
      const id = tileAt(x, y);
      if (id === 'water') open.push([x, y]);
      else if (id !== undefined && id !== 'boards') dry.push([x, y]);
    }
  }
  // Water three tiles off is two whole tiles from any pixel here, past where the ice thins.
  if (!open.some(([x, y]) => Math.abs(x - tx) <= 2 && Math.abs(y - ty) <= 2)) return null;
  const away = (wx: number, wy: number, tiles: readonly [number, number][]) => {
    let best = Infinity;
    for (const [x, y] of tiles) {
      const dx = Math.max(x * TILE - wx, 0, wx - (x + 1) * TILE);
      const dy = Math.max(y * TILE - wy, 0, wy - (y + 1) * TILE);
      best = Math.min(best, Math.hypot(dx, dy));
    }
    return best;
  };
  return (wx, wy) => {
    const px = wx + 0.5;
    const py = wy + 0.5;
    const out = away(px, py, open);
    const signed = out > 0 ? out : -away(px, py, dry);
    return signed - noise(wx, wy, 1.4, 17) * 4;
  };
}

// ---- Putting it together ----------------------------------------------------------------------

/**
 * A tile of ice at `at`, from its bank (`field`, L6's) and the open water near it (`melt`): the
 * bank's face and lip with stones in it, the frost along the bank, the ice's patches, its cracks
 * and skate marks, and its melt. Pixels on the grass side of the bank are left clear, but for the
 * stones in its lip.
 */
export function drawIce(field: readonly BankEdge[], at: At, melt: Melt | null): SpriteSource {
  const s = new Sketch(TILE, TILE);
  const { cracks, scratches } = cracksOver(at);
  const x0 = at.tx * TILE;
  const y0 = at.ty * TILE;
  for (let y = 0; y < TILE; y++) {
    for (let x = 0; x < TILE; x++) {
      const e = field[y * TILE + x]!;
      const wx = x0 + x;
      const wy = y0 + y;
      const k = iceKey(e, wx, wy, y * TILE + x, melt, cracks, scratches);
      if (k !== CLEAR) s.set(x, y, k);
    }
  }
  return s.toSource();
}

function iceKey(
  e: BankEdge,
  wx: number,
  wy: number,
  i: number,
  melt: Melt | null,
  cracks: Set<number>,
  scratches: Set<number>,
): string {
  const stone = stoneAt(wx, wy, e.d);
  if (e.d <= 0) return stone ?? CLEAR;
  const h = bankHeight(e);
  const up = upOf(e);
  if (e.d < 1) return stone ?? (up > 0.5 ? 'G' : 'b');
  if (e.d < h) {
    if (stone) return stone;
    if (up > 0.5 && e.d < 2) return 'B';
    return e.d >= h - 1 ? 'o' : 'b';
  }
  const into = e.d - h;
  // A shade on the ice at the foot of a face of earth, and here and there a dark wet line at a
  // low bank, so the bank's edge isn't drawn round in one line.
  if (into < 1) {
    if (up > 0.5) return 'k';
    if (noise(wx, wy, 2.4, 29) > -0.15) return 'K';
  }
  const m = melt ? melt(wx, wy) : Infinity;
  const melted = melt ? meltedAt(wx, wy, melt) : null;
  if (melted === 'water') {
    if (meltedAt(wx, wy - 1, melt!) === 'plate') return 'V';
    // As the water beside it is: deeper away from the bank, in the same dither.
    return (e.d - 9) / 8 > bayer(wx, wy) ? 'v' : 'u';
  }
  if (melted === 'plate' && m < MELT) {
    const below = meltedAt(wx, wy + 1, melt!);
    const right = meltedAt(wx + 1, wy, melt!);
    if (below === 'water' || right === 'water') return 'K';
    const left = meltedAt(wx - 1, wy, melt!);
    const top = meltedAt(wx, wy - 1, melt!);
    if (left === 'water' || top === 'water') return 'r';
  }
  if (melted === 'seam') return 'c';
  const frost = frostWidth(wx, wy);
  if (into < frost) return into < frost - 1 || bayer(wx, wy) < 0.5 ? 'r' : 'R';
  const thin = m < MELT ? clamp((MELT - m) / MELT, 0, 1) : 0;
  if (cracks.has(i)) return 'c';
  if (cracks.has(i - TILE - 1) && into > frost + 1) return 'r';
  const tone = toneAt(wx, wy, e.d, thin);
  if (scratches.has(i) && tone !== 'R') return 'r';
  return tone;
}

export const ICE_PALETTE: Palette = {
  [CLEAR]: null,
  // The bank: its grassy lip, a face of earth, and stones set in it.
  G: C.mossLight,
  B: ramp(C.earth)[3],
  b: C.earth,
  o: ramp(C.earth)[0],
  s: C.stone,
  S: ramp(C.stone)[1],
  t: C.stoneLight,
  // The ice: frost, frosted, plain, clear and clear over deep water.
  r: C.iceLight,
  R: mix(C.ice, C.iceLight, 0.5),
  w: C.ice,
  d: mix(C.ice, C.water, 0.2),
  D: mix(C.ice, C.water, 0.38),
  // Shade at the foot of the bank, the dark wet edge, a crack.
  k: mix(C.ice, ramp(C.ice)[1], 0.55),
  K: mix(ramp(C.ice)[1], C.water, 0.35),
  c: mix(ramp(C.ice)[1], C.water, 0.55),
  // Open water where it has melted, deeper away from the bank, and in the shadow of a plate.
  u: C.water,
  v: ramp(C.water)[1],
  V: mix(ramp(C.water)[1], ramp(C.water)[0], 0.5),
};

/** The keys of the ice's open face, where the light can catch it. */
const FACE = new Set(['w', 'd', 'D']);

/**
 * The pixels of a tile of ice where a sheen can pass (`render/life.ts`): dashes along every fourth
 * row of the ice's open face, never on its frost, its cracks, its melt or where snow drifts in
 * winter. As local (x, y) pairs.
 */
export function sheenOf(source: SpriteSource, field: readonly BankEdge[], at: At): Int8Array {
  const out: number[] = [];
  for (let y = 0; y < TILE; y++) {
    const wy = at.ty * TILE + y;
    if ((wy & 3) !== 1) continue;
    for (let x = 0; x < TILE; x++) {
      const wx = at.tx * TILE + x;
      if (hash(wx >> 2, wy, 31) % 3 !== 0) continue;
      if (!FACE.has(source.rows[y]![x]!)) continue;
      if (snowAt(field[y * TILE + x]!, wx, wy)) continue;
      out.push(x, y);
    }
  }
  return Int8Array.from(out);
}

// ---- Winter -----------------------------------------------------------------------------------

/**
 * Whether snow lies on a pixel of the ice in winter: drifted in over the bank's lip and a few
 * pixels out onto the ice, deeper in places, and in wind-blown patches out on the ice.
 */
function snowAt(e: BankEdge, wx: number, wy: number): 'drift' | 'patch' | null {
  // The lawn beyond the bank is under its own snow already.
  if (e.d <= 0) return null;
  const h = bankHeight(e);
  const up = upOf(e);
  const drift = 2.5 + (noise(wx, wy, 1.3, 19) + 1) * 2.5;
  // On a face of earth the snow lies along its top and at its foot, and not down it.
  if (up > 0.5 && e.d >= 1 && e.d < h) return null;
  const into = e.d - (up > 0.5 ? h : 0);
  if (into < drift) return into < drift - 1.5 || bayer(wx, wy) < 0.5 ? 'drift' : null;
  const patch = noise(wx, wy, 1.1, 23, 3);
  if (patch > 0.72 || (patch > 0.66 && bayer(wx, wy) < (patch - 0.66) * 16)) return 'patch';
  return null;
}

/**
 * The snow lying on a tile of ice in winter, over the ice's piece: drifts along the banks and
 * over the lip (but for its stones), wind-blown patches out on the ice, a few flecks, and the
 * near side of each drift in shade. Never on open water at a melt.
 */
export function iceSnow(field: readonly BankEdge[], at: At, melt: Melt | null): SpriteSource {
  const s = new Sketch(TILE, TILE);
  const x0 = at.tx * TILE;
  const y0 = at.ty * TILE;
  const lies = (x: number, y: number) => {
    const e = field[y * TILE + x]!;
    const wx = x0 + x;
    const wy = y0 + y;
    if (stoneAt(wx, wy, e.d)) return false;
    if (melt && (melt(wx, wy) < MELT / 2 || meltedAt(wx, wy, melt) !== null)) return false;
    return snowAt(e, wx, wy) !== null;
  };
  for (let y = 0; y < TILE; y++) {
    for (let x = 0; x < TILE; x++) {
      const e = field[y * TILE + x]!;
      const wx = x0 + x;
      const wy = y0 + y;
      if (lies(x, y)) {
        s.set(x, y, e.d < 1 ? 'w' : 'W');
      } else if (e.d > 0 && hash(wx, wy, 41) % 97 === 0 && !(melt && melt(wx, wy) < MELT)) {
        s.set(x, y, 'W');
      }
    }
  }
  // The near side of each drift in a touch of shade, so it lies on the ice rather than over it.
  for (let y = TILE - 1; y > 0; y--) {
    for (let x = 0; x < TILE; x++) {
      if (s.get(x, y) === CLEAR && s.get(x, y - 1) === 'W' && field[y * TILE + x]!.d > 0) {
        s.set(x, y, 's');
      }
    }
  }
  return s.toSource();
}

export const ICE_SNOW_PALETTE: Palette = {
  [CLEAR]: null,
  w: C.snowLight,
  W: C.snow,
  s: C.snowShade,
};
