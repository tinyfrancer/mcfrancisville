import { describe, expect, it } from 'vitest';
import { rasterize, spriteSize } from '../../src/sprites/sprite';
import {
  continues,
  CUT_NW,
  E,
  GRASS_VARIANTS,
  grassPiece,
  groundPieces,
  N,
  NE,
  neighbourMask,
  NOTCH_NW_X,
  NOTCH_NW_Y,
  NW,
  S,
  SE,
  SW,
  TERRAIN_ART,
  terrainPiece,
  TERRAINS,
  THAW_E,
  THAW_S,
  THAW_W,
  TILE,
  W,
} from '../../src/sprites/terrain';
import { wavy } from '../../src/sprites/tracks';
import type { TileId } from '../../src/types/ids';

function lookup(rows: readonly string[], key: Record<string, TileId>) {
  return (tx: number, ty: number) => {
    const ch = rows[ty]?.[tx];
    return ch === undefined ? undefined : key[ch];
  };
}

/**
 * The 47 shapes a tile of ground can take: every mask `neighbourMask` gives, where a corner only
 * counts with both sides beside it. Drawing all 256 would draw each of these several times over.
 */
const SHAPES = Array.from({ length: 256 }, (_, m) => m).filter((m) =>
  (
    [
      [NE, N, E],
      [SE, S, E],
      [SW, S, W],
      [NW, N, W],
    ] as const
  ).every(([corner, a, b]) => !(m & corner) || (m & a && m & b)),
);

describe('the ground at 32', () => {
  it('draws every kind of ground in every shape and look, a tile each', () => {
    for (let v = 0; v < GRASS_VARIANTS; v++) {
      const { source, palette } = grassPiece(v);
      expect(spriteSize(source)).toEqual({ width: TILE, height: TILE });
      expect(() => rasterize(source, palette)).not.toThrow();
    }
    for (const terrain of TERRAINS) {
      for (const mask of SHAPES) {
        for (let v = 0; v < TERRAIN_ART[terrain].variants; v++) {
          const { source, palette } = terrainPiece(terrain, mask, v);
          expect(spriteSize(source), `${terrain} ${mask}`).toEqual({ width: TILE, height: TILE });
          expect(() => rasterize(source, palette), `${terrain} ${mask}`).not.toThrow();
        }
      }
    }
  });

  it('fills a tile with its ground on every side, and rounds one on its own', () => {
    for (const terrain of TERRAINS) {
      const whole = rasterize(terrainPiece(terrain, 255, 0).source, TERRAIN_ART[terrain].palette);
      const alone = rasterize(terrainPiece(terrain, 0, 0).source, TERRAIN_ART[terrain].palette);
      const opaque = (r: typeof whole, x: number, y: number) => r.data[(y * TILE + x) * 4 + 3]! > 0;
      for (let at = 0; at < TILE * TILE; at++) {
        expect(opaque(whole, at % TILE, Math.floor(at / TILE)), terrain).toBe(true);
      }
      // Steps and a pier are cut square, and a cliff's top corners are grass hanging over it.
      if (terrain === 'steps' || terrain === 'boards') continue;
      if (terrain !== 'cliff') expect(opaque(alone, 0, 0), terrain).toBe(false);
      expect(opaque(alone, TILE - 1, TILE - 1), terrain).toBe(false);
      expect(opaque(alone, TILE / 2, TILE / 2), terrain).toBe(true);
    }
  });

  it('comes in 47 shapes', () => {
    expect(SHAPES).toHaveLength(47);
  });

  it('reads which neighbours carry the ground on, counting a corner only between two sides', () => {
    const at = lookup(['.~~', '~~~', '.~.'], { '.': 'grass', '~': 'water' });
    expect(neighbourMask(at, 1, 1)).toBe(N | NE | E | S | W);
    // Off the map the ground carries on.
    expect(neighbourMask(at, 2, 0) & (N | NE | E)).toBe(N | NE | E);
    expect(neighbourMask(at, 1, 2) & (SE | S)).toBe(S);
    expect(neighbourMask(at, 1, 1) & NW).toBe(0);
  });

  it('cuts a diagonal staircase of water into a slope, with no point where the cuts meet', () => {
    const rows = ['.....', '...~~', '..~~~', '.~~~~', '~~~~~'];
    const at = lookup(rows, { '.': 'grass', '~': 'water' });
    // Ground that doesn't ask for slopes reads just its eight neighbours.
    expect(neighbourMask(at, 2, 2)).toBeLessThan(256);
    const cut = neighbourMask(at, 2, 2, { slopes: true });
    expect(cut & CUT_NW).toBe(CUT_NW);
    const notch = neighbourMask(at, 3, 2, { slopes: true });
    expect(notch & (NOTCH_NW_X | NOTCH_NW_Y)).toBe(NOTCH_NW_X | NOTCH_NW_Y);
    // The cut runs from the tile's bottom-left corner to its top-right: clear above it, water below.
    const { source, palette } = terrainPiece('water', cut, 0);
    const r = rasterize(source, palette);
    const opaque = (x: number, y: number) => r.data[(y * r.width + x) * 4 + 3]! > 0;
    for (const [x, y] of [
      [5, 25],
      [15, 15],
      [25, 5],
    ] as const) {
      expect(opaque(x, y), `${x},${y}`).toBe(false);
      expect(opaque(x + 1, y + 1), `${x + 1},${y + 1}`).toBe(true);
    }
  });

  it('joins steps to the path and the cliff, but gives the steps their own walls', () => {
    expect(continues('path', 'steps')).toBe(true);
    expect(continues('steps', 'path')).toBe(true);
    expect(continues('cliff', 'steps')).toBe(true);
    expect(continues('steps', 'cliff')).toBe(false);
    expect(continues('water', 'path')).toBe(false);
    const at = lookup(['%+%'], { '%': 'cliff', '+': 'steps' });
    expect(neighbourMask(at, 1, 0) & (E | W)).toBe(0);
    expect(neighbourMask(at, 0, 0) & E).toBe(E);
  });

  it('runs the steps up from a dirt track or gravel as from the cobbles (V1 L2)', () => {
    for (const track of ['path', 'dirt', 'gravel'] as const) {
      expect(continues(track, 'steps')).toBe(true);
      expect(continues('steps', track)).toBe(true);
    }
    expect(continues('dirt', 'path')).toBe(false);
    expect(continues('meadow', 'longGrass')).toBe(false);
  });

  it('waves a track’s edges along the world, meeting at the seam between two tiles', () => {
    // A straight far edge along the top of a tile: d is how far down from it.
    const field = Array.from({ length: TILE * TILE }, (_, i) => ({
      d: Math.floor(i / TILE) + 0.5,
      nx: 0,
      ny: -1,
      along: i % TILE,
    }));
    for (let px = 0; px < 4; px++) {
      const left = wavy(field, { px, py: 0 }, 2.5);
      const right = wavy(field, { px: (px + 1) & 3, py: 0 }, 2.5);
      const seam = Math.abs(left[TILE - 1]!.d - right[0]!.d);
      expect(seam, `phase ${px}`).toBeLessThan(0.35);
    }
    // Over the four tiles of a wave the edge moves a few pixels in and out.
    const moved = [0, 1, 2, 3].flatMap((px) =>
      wavy(field, { px, py: 0 }, 2.5).map((e, i) => e.d - field[i]!.d),
    );
    expect(Math.max(...moved) - Math.min(...moved)).toBeGreaterThan(3);
  });

  it('meets the grass softly: no kerb, the ground thinning out over its last pixels', () => {
    for (const terrain of ['path', 'dirt', 'gravel', 'meadow', 'longGrass'] as const) {
      // A run along the tile from east to west, open above and below.
      const r = rasterize(terrainPiece(terrain, E | W, 0).source, TERRAIN_ART[terrain].palette);
      const alpha = (x: number, y: number) => r.data[(y * TILE + x) * 4 + 3]!;
      const rowCover = (y: number) =>
        Array.from({ length: TILE }, (_, x) => (alpha(x, y) > 0 ? 1 : 0)).reduce<number>(
          (a, b) => a + b,
          0,
        ) / TILE;
      expect(rowCover(TILE / 2), terrain).toBe(1);
      // Somewhere near the top edge a row is part ground and part grass.
      const partial = [0, 1, 2, 3, 4, 5, 6].some((y) => rowCover(y) > 0.1 && rowCover(y) < 0.9);
      expect(partial, terrain).toBe(true);
    }
  });

  it('ends a frozen creek at open water in a lip, on the sides that meet it', () => {
    const at = lookup(['.-.', '~-~', '~~~'], { '.': 'grass', '-': 'ice', '~': 'water' });
    const tongue = neighbourMask(at, 1, 1);
    expect(tongue & (THAW_S | THAW_E | THAW_W)).toBe(THAW_S | THAW_E | THAW_W);
    expect(neighbourMask(at, 1, 0) & (THAW_S | THAW_E | THAW_W)).toBe(0);
    const lip = rasterize(terrainPiece('ice', tongue, 0).source, TERRAIN_ART.ice.palette);
    const plain = rasterize(terrainPiece('ice', tongue & 0xff, 0).source, TERRAIN_ART.ice.palette);
    expect(lip.data).not.toEqual(plain.data);
  });

  it('lays grass under everything, and one piece over it for anything else', () => {
    const at = lookup(['.=', '~#'], { '.': 'grass', '=': 'path', '~': 'water', '#': 'hedge' });
    // Grass beside water may carry the bank rounding out over it too (V1's L6); away from it, not.
    expect(groundPieces(at, 0, 0)[0]!.key).toMatch(/^ground:grass:/);
    const dry = lookup(['..', '.='], { '.': 'grass', '=': 'path' });
    expect(groundPieces(dry, 0, 0)).toHaveLength(1);
    for (const [tx, ty] of [
      [1, 0],
      [0, 1],
      [1, 1],
    ] as const) {
      const pieces = groundPieces(at, tx, ty);
      expect(pieces).toHaveLength(2);
      expect(pieces[0]!.key).toMatch(/^ground:grass:/);
    }
    expect(groundPieces(at, 1, 0)[1]!.key).toBe(groundPieces(at, 1, 0)[1]!.key);
  });
});
