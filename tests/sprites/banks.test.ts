import { describe, expect, it } from 'vitest';
import { bankField, wetAround, wobble } from '../../src/sprites/banks';
import { groundPieces, TILE } from '../../src/sprites/terrain';
import { rasterize } from '../../src/sprites/sprite';
import type { TileId } from '../../src/types/ids';

function lookup(rows: readonly string[]) {
  const key: Record<string, TileId> = { '.': 'grass', '~': 'water', '-': 'ice', '#': 'hedge' };
  return (tx: number, ty: number) => {
    const ch = rows[ty]?.[tx];
    return ch === undefined ? undefined : key[ch];
  };
}

const isWater = (id: TileId | undefined) => id === 'water';

/** How far in from the tile's edge, at each pixel, as the bank across the tile at (tx, ty). */
function depths(rows: readonly string[], tx: number, ty: number) {
  return bankField(tx, ty, wetAround(lookup(rows), tx, ty, isWater)).map((e) => e.d);
}

/** Whether the tile at (tx, ty) is drawn wet at a pixel, as the ground lays it. */
function wetAt(rows: readonly string[], tx: number, ty: number, x: number, y: number): boolean {
  const pieces = groundPieces(lookup(rows), tx, ty);
  const top = pieces[pieces.length - 1]!;
  if (pieces.length < 2) return false;
  const r = rasterize(top.source, top.palette);
  return r.data[(y * TILE + x) * 4 + 3]! > 0;
}

const POND = [
  '..........',
  '..........',
  '..~~~~~~..',
  '..~~~~~~..',
  '..~~~~~~..',
  '..~~~~~~..',
  '..........',
  '..........',
];

describe('organic banks (V1 L6)', () => {
  it('wobbles smoothly, the same every time, between −1 and 1', () => {
    for (let i = 0; i < 400; i++) {
      const x = (i * 37) % 900;
      const y = (i * 53) % 700;
      const w = wobble(x, y);
      expect(Math.abs(w)).toBeLessThanOrEqual(1);
      expect(wobble(x, y)).toBe(w);
      expect(Math.abs(wobble(x + 1, y) - w)).toBeLessThan(0.1);
    }
  });

  it('keeps a straight bank within a few pixels of the tiles', () => {
    // The pond's top edge, halfway along: the bank is near the tile's top, never far into it.
    const d = depths(POND, 4, 2);
    for (let x = 0; x < TILE; x++) {
      const wetFrom = Array.from({ length: TILE }, (_, y) => d[y * TILE + x]!).findIndex(
        (v) => v > 0,
      );
      expect(wetFrom, `column ${x}`).toBeGreaterThanOrEqual(0);
      expect(wetFrom, `column ${x}`).toBeLessThanOrEqual(6);
    }
  });

  it('rounds a corner of the pond, and is deep in its middle', () => {
    expect(wetAt(POND, 2, 2, 0, 0)).toBe(false);
    expect(wetAt(POND, 2, 2, TILE - 1, TILE - 1)).toBe(true);
    // Deep in the middle the plain piece is drawn, with no bank of its own.
    const middle = groundPieces(lookup(['~~~~~', '~~~~~', '~~~~~', '~~~~~', '~~~~~']), 2, 2);
    expect(middle[1]!.key).not.toMatch(/bank/);
  });

  it('smooths a staircase into a slope that reaches over the grass', () => {
    const stairs = ['......', '......', '....~~', '...~~~', '..~~~~', '.~~~~~'];
    // The grass in the step's inner corner gets a little of the water, as a curve would.
    const corner = groundPieces(lookup(stairs), 3, 2);
    expect(corner.length).toBe(2);
    expect(corner[1]!.key).toMatch(/spill/);
    expect(wetAt(stairs, 3, 2, TILE - 1, TILE - 1)).toBe(true);
    expect(wetAt(stairs, 3, 2, 0, 0)).toBe(false);
  });

  it('lets a creek a tile wide run, and runs it on under the hedge at the edge', () => {
    const creek = ['#####', '#.~.#', '#.~.#', '#.~.#', '#####'];
    expect(wetAt(creek, 2, 2, TILE / 2, TILE / 2)).toBe(true);
    const out = ['##~##', '#.~.#', '#.~.#'];
    expect(wetAround(lookup(out), 2, 0, isWater).length).toBe(25);
    // Above the top of the map, the creek carries on, so its last tile has no bank across it.
    expect(wetAt(out, 2, 0, TILE / 2, 0)).toBe(true);
  });

  it('meets itself across a seam between two tiles', () => {
    const left = depths(POND, 3, 3);
    const right = depths(POND, 4, 3);
    const top = depths(POND, 3, 2);
    for (let i = 0; i < TILE; i++) {
      const a = left[i * TILE + TILE - 1]!;
      const b = right[i * TILE]!;
      if (Number.isFinite(a) && Number.isFinite(b)) expect(Math.abs(a - b)).toBeLessThan(2);
      const c = top[(TILE - 1) * TILE + i]!;
      const e = left[i]!;
      if (Number.isFinite(c) && Number.isFinite(e)) expect(Math.abs(c - e)).toBeLessThan(2);
    }
  });
});
