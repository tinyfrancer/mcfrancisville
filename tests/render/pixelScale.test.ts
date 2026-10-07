import { describe, expect, it } from 'vitest';
import {
  fitPixelScale,
  fitRoom,
  placeBetweenBars,
  TILE_SIZE,
  TILES_ACROSS,
} from '../../src/render/pixelScale';

/** An iPhone 15's 393 by 852 points at 3 device pixels each, less the bars. */
const IPHONE = { width: 393, height: 650, dpr: 3 };
const SIDEWAYS = { width: 852, height: 330, dpr: 3 };

describe('fitPixelScale', () => {
  it('fits an iPhone portrait at a whole device-pixel scale, Close by default (decision 290)', () => {
    const fit = fitPixelScale(390, 844, 3);
    expect(Number.isInteger(fit.scale)).toBe(true);
    expect(fit.scale).toBe(3);
    expect(fit.width * fit.scale).toBeGreaterThanOrEqual(390 * 3);
    expect(fit.height * fit.scale).toBeGreaterThanOrEqual(844 * 3);
    expect(fitPixelScale(390, 844, 3, TILES_ACROSS.far).scale).toBe(2);
  });

  it('shows her about 8 mm tall at Close on an iPhone 15, at 460 pixels an inch', () => {
    const { scale } = fitPixelScale(IPHONE.width, IPHONE.height, IPHONE.dpr, TILES_ACROSS.close);
    const millimetres = ((48 * scale) / 460) * 25.4;
    expect(millimetres).toBeGreaterThan(7.5);
    expect(millimetres).toBeLessThan(8.5);
  });

  it('keeps her chosen closeness on its side', () => {
    for (const closeness of ['close', 'far'] as const) {
      const tiles = TILES_ACROSS[closeness];
      const upright = fitPixelScale(IPHONE.width, IPHONE.height, IPHONE.dpr, tiles);
      const side = fitPixelScale(SIDEWAYS.width, SIDEWAYS.height, SIDEWAYS.dpr, tiles);
      expect(side.scale, closeness).toBe(upright.scale);
    }
  });

  it('shows within a step of the promised tiles across the short side, Close and Far', () => {
    for (const tilesAcross of Object.values(TILES_ACROSS)) {
      for (const [w, h, dpr] of [
        [390, 844, 3],
        [375, 667, 2],
        [430, 932, 3],
        [360, 800, 2.625],
        [1280, 800, 1],
        [844, 390, 3],
      ] as const) {
        const fit = fitPixelScale(w, h, dpr, tilesAcross);
        const tiles = Math.min(fit.width, fit.height) / TILE_SIZE;
        expect(tiles).toBeGreaterThanOrEqual(tilesAcross / Math.SQRT2);
        expect(tiles).toBeLessThanOrEqual(tilesAcross * Math.SQRT2);
      }
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

describe('fitRoom (decision 290)', () => {
  const fits = (room: { width: number; height: number }, tiles: number, screen = IPHONE) =>
    fitRoom(screen.width, screen.height, screen.dpr, room, tiles);
  const town = (tiles: number, screen = IPHONE) =>
    fitPixelScale(screen.width, screen.height, screen.dpr, tiles).scale;

  it('comes a step closer for a small room, so it fills the width', () => {
    const shop = { width: 9, height: 11 };
    const close = fits(shop, TILES_ACROSS.close);
    expect(close.scale).toBe(town(TILES_ACROSS.close) + 1);
    expect(close.width).toBeGreaterThanOrEqual(shop.width * TILE_SIZE);
    expect(close.width).toBeLessThan((shop.width + 1) * TILE_SIZE);
    expect(fits(shop, TILES_ACROSS.far).scale).toBe(town(TILES_ACROSS.far) + 1);
  });

  it('fits her first room at Far as at Close, scrolling by the little it is over', () => {
    const first = { width: 13, height: 14 };
    for (const tiles of Object.values(TILES_ACROSS)) {
      const fit = fits(first, tiles);
      expect(fit.scale, String(tiles)).toBe(fitPixelScale(393, 650, 3).scale);
      expect(first.width * TILE_SIZE - fit.width).toBeLessThan(TILE_SIZE);
    }
  });

  it('never comes more than a step closer than the town, however small the room', () => {
    for (const tiles of Object.values(TILES_ACROSS)) {
      expect(fits({ width: 3, height: 4 }, tiles).scale).toBe(town(tiles) + 1);
    }
  });

  it('never goes farther out than the town: a big room scrolls as it did', () => {
    const home = { width: 21, height: 18 };
    for (const tiles of Object.values(TILES_ACROSS)) {
      expect(fits(home, tiles).scale).toBe(town(tiles));
    }
  });

  it('on its side, fits a room by its height, within a step of the town', () => {
    const shop = { width: 9, height: 11 };
    for (const tiles of Object.values(TILES_ACROSS)) {
      const fit = fits(shop, tiles, SIDEWAYS);
      expect(fit.scale).toBeGreaterThanOrEqual(town(tiles, SIDEWAYS));
      expect(fit.scale).toBeLessThanOrEqual(town(tiles, SIDEWAYS) + 1);
      expect(shop.height * TILE_SIZE - fit.height).toBeLessThan(2 * TILE_SIZE);
    }
  });

  it('is whole device pixels, as the town is', () => {
    const fit = fits({ width: 11, height: 11 }, TILES_ACROSS.close);
    expect(Number.isInteger(fit.scale)).toBe(true);
    expect(fit.cssWidth - IPHONE.width).toBeLessThan(fit.scale / 3);
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
