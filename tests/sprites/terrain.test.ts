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
  TERRAIN_ART,
  terrainPiece,
  TERRAINS,
  TILE,
  W,
} from '../../src/sprites/terrain';
import type { TileId } from '../../src/types/ids';

function lookup(rows: readonly string[], key: Record<string, TileId>) {
  return (tx: number, ty: number) => {
    const ch = rows[ty]?.[tx];
    return ch === undefined ? undefined : key[ch];
  };
}

describe('the ground at 32', () => {
  it('draws every kind of ground in every shape and look, a tile each', () => {
    for (let v = 0; v < GRASS_VARIANTS; v++) {
      const { source, palette } = grassPiece(v);
      expect(spriteSize(source)).toEqual({ width: TILE, height: TILE });
      expect(() => rasterize(source, palette)).not.toThrow();
    }
    for (const terrain of TERRAINS) {
      for (let mask = 0; mask < 256; mask++) {
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

  it('lays grass under everything, and one piece over it for anything else', () => {
    const at = lookup(['.=', '~#'], { '.': 'grass', '=': 'path', '~': 'water', '#': 'hedge' });
    expect(groundPieces(at, 0, 0)).toHaveLength(1);
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
