import { describe, expect, it } from 'vitest';
import {
  fitPixelScale,
  placeBetweenBars,
  TILE_SIZE,
  TILES_ACROSS,
} from '../../src/render/pixelScale';

describe('fitPixelScale', () => {
  it('fits an iPhone 13 portrait at a whole device-pixel scale', () => {
    const fit = fitPixelScale(390, 844, 3);
    expect(Number.isInteger(fit.scale)).toBe(true);
    expect(fit.scale).toBe(2);
    expect(fit.width * fit.scale).toBeGreaterThanOrEqual(390 * 3);
    expect(fit.height * fit.scale).toBeGreaterThanOrEqual(844 * 3);
  });

  it('shows within a step of the promised tiles across the short side', () => {
    for (const [w, h, dpr] of [
      [390, 844, 3],
      [375, 667, 2],
      [430, 932, 3],
      [360, 800, 2.625],
      [1280, 800, 1],
      [844, 390, 3],
    ] as const) {
      const fit = fitPixelScale(w, h, dpr);
      const tiles = Math.min(fit.width, fit.height) / TILE_SIZE;
      expect(tiles).toBeGreaterThanOrEqual(TILES_ACROSS / Math.SQRT2);
      expect(tiles).toBeLessThanOrEqual(TILES_ACROSS * Math.SQRT2);
    }
  });

  it('crops less than one game pixel off the screen', () => {
    const fit = fitPixelScale(390, 844, 3);
    expect(fit.cssWidth - 390).toBeLessThan(fit.scale / 3);
    expect(fit.cssHeight - 844).toBeLessThan(fit.scale / 3);
  });

  it('never scales below 1, even on a tiny or zero-sized box', () => {
    expect(fitPixelScale(100, 100, 1).scale).toBe(1);
    expect(fitPixelScale(0, 0, 0).width).toBeGreaterThan(0);
  });
});

describe('placeBetweenBars', () => {
  it('snaps the room between the bars to whole device pixels, from the root', () => {
    const room = placeBetweenBars(
      { left: 0, top: 0 },
      { left: 0, top: 58.4, right: 390, bottom: 724.2 },
      3,
    );
    expect(room.top * 3).toBe(Math.round(room.top * 3));
    expect((room.top + room.height) * 3).toBeCloseTo(Math.round((room.top + room.height) * 3));
    expect(room).toMatchObject({ left: 0, width: 390 });
    expect(room.top).toBeCloseTo(58.333, 2);
    expect(room.height).toBeCloseTo(724.333 - 58.333, 2);
  });

  it('is measured from the root, and never negative', () => {
    const room = placeBetweenBars(
      { left: 10, top: 20 },
      { left: 10, top: 20, right: 5, bottom: 5 },
      2,
    );
    expect(room).toEqual({ left: 0, top: 0, width: 0, height: 0 });
  });
});
