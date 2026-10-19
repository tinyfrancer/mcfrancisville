import { describe, expect, it } from 'vitest';
import { TILE_SIZE } from '../../src/config/world';
import { REEL_BAR, reelBarAt, type Box } from '../../src/render/fishing';

/** Whether two boxes share a pixel. */
const overlaps = (a: Box, b: Box) =>
  a.x < b.x + b.w && b.x < a.x + a.w && a.y < b.y + b.h && b.y < a.y + a.h;

/** The bar's whole box, needle and all, where `reelBarAt` puts it. */
function barBox(her: Box, float: { x: number; y: number }, width?: number): Box {
  const { x, y } = reelBarAt(her, float, width);
  return { x, y: y - REEL_BAR.needle, w: REEL_BAR.w, h: REEL_BAR.h + REEL_BAR.needle * 2 };
}

describe('the tension bar (1.0.1)', () => {
  // Her sprite where she stands on a tile, its feet 14 below the tile's middle.
  const tile = { tx: 10, ty: 10 };
  const feet = tile.ty * TILE_SIZE + TILE_SIZE / 2 + 14;
  const her: Box = { x: tile.tx * TILE_SIZE, y: feet - 48, w: 32, h: 48 };
  const water = (dx: number, dy: number) => ({
    x: (tile.tx + dx) * TILE_SIZE + TILE_SIZE / 2,
    y: (tile.ty + dy) * TILE_SIZE + TILE_SIZE / 2,
  });

  it('is two tiles wide, so it reads at Close', () => {
    expect(REEL_BAR.w).toBeGreaterThanOrEqual(2 * TILE_SIZE);
    expect(REEL_BAR.h).toBeGreaterThanOrEqual(10);
  });

  it.each([
    ['right', 1, 0],
    ['left', -1, 0],
    ['down', 0, 1],
    ['up', 0, -1],
    ['up, a long cast', 0, -3],
    ['up and over', 1, -1],
  ] as const)('covers neither her nor her float when she fishes %s', (_way, dx, dy) => {
    const float = water(dx, dy);
    const bar = barBox(her, float);
    expect(overlaps(bar, her)).toBe(false);
    expect(overlaps(bar, { x: float.x - 5, y: float.y - 5, w: 10, h: 10 })).toBe(false);
  });

  it('sits over her head unless her float is up there', () => {
    expect(barBox(her, water(1, 0)).y + barBox(her, water(1, 0)).h).toBeLessThanOrEqual(her.y);
    expect(barBox(her, water(0, -1)).y).toBeGreaterThanOrEqual(her.y + her.h);
  });

  it('stays inside the view when she stands at its edge', () => {
    const edge: Box = { ...her, x: 2 };
    const left = barBox(edge, { x: 60, y: edge.y + 20 }, 384);
    expect(left.x).toBeGreaterThanOrEqual(0);
    const right = barBox({ ...her, x: 384 - 34 }, { x: 330, y: her.y + 20 }, 384);
    expect(right.x + right.w).toBeLessThanOrEqual(384);
  });
});
