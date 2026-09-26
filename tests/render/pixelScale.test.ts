import { describe, expect, it } from 'vitest';
import { fitPixelScale, TILE_SIZE, TILES_ACROSS } from '../../src/render/pixelScale';

describe('fitPixelScale', () => {
  it('fits an iPhone 13 portrait at a whole device-pixel scale', () => {
    const fit = fitPixelScale(390, 844, 3);
    expect(Number.isInteger(fit.scale)).toBe(true);
    expect(fit.scale).toBe(4);
    expect(fit.width * fit.scale).toBeGreaterThanOrEqual(390 * 3);
    expect(fit.height * fit.scale).toBeGreaterThanOrEqual(844 * 3);
  });

  it('shows at least the promised tiles across the short side, and less than twice that', () => {
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
      expect(tiles).toBeGreaterThanOrEqual(TILES_ACROSS);
      expect(tiles).toBeLessThan(TILES_ACROSS * 2);
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
