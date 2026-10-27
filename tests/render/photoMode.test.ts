import { describe, expect, it } from 'vitest';
import { FILTER_IDS } from '../../src/data/photo';
import {
  filterPixel,
  filterPixels,
  STAR,
  starsOf,
  tint,
  vignetteAt,
} from '../../src/render/filters';
import { fitPixelScale, TILE_SIZE, TILES_ACROSS } from '../../src/render/pixelScale';
import { drawForPhoto, forPhoto } from '../../src/render/photo';
import { frameOf, POLAROID } from '../../src/render/viewfinder';

describe("the photo mode's filters (1.5's G5)", () => {
  it('leaves a pixel as it is through the plain filter, anywhere', () => {
    expect(filterPixel('plain', [10, 120, 230], 0, 0, 100, 100)).toEqual([10, 120, 230]);
  });

  it('turns a pixel an old photo’s brown through sepia, blacks lifted a touch', () => {
    expect(tint('sepia', [100, 150, 200])).toEqual([204, 179, 138]);
    const [r, g, b] = tint('sepia', [0, 0, 0]);
    expect(r).toBeGreaterThan(g);
    expect(g).toBeGreaterThan(b);
    expect(r).toBeGreaterThan(0);
  });

  it('makes spooky green: the light in green, darker at the edges than in the middle', () => {
    const [r, g, b] = tint('spooky', [200, 60, 60]);
    expect(g).toBeGreaterThan(r);
    expect(g).toBeGreaterThan(b);
    const middle = filterPixel('spooky', [200, 200, 200], 50, 50, 100, 100);
    const corner = filterPixel('spooky', [200, 200, 200], 0, 0, 100, 100);
    expect(middle).toEqual(tint('spooky', [200, 200, 200]));
    expect(corner[1]).toBeLessThan(middle[1]);
    expect(vignetteAt('spooky', 0, 0, 100, 100)).toBeCloseTo(0.42, 1);
    expect(vignetteAt('plain', 0, 0, 100, 100)).toBe(1);
  });

  it('makes moonlit blue, and sprinkles stars only where it is dark', () => {
    const [r, g, b] = tint('moonlit', [200, 120, 40]);
    expect(b).toBeGreaterThan(g);
    expect(g).toBeGreaterThan(r);
    const w = 60;
    const h = 60;
    const night = { data: new Uint8ClampedArray(w * h * 4).fill(20), width: w, height: h };
    filterPixels(night, 'moonlit');
    const stars = starsOf(w, h);
    expect(stars.length).toBeGreaterThanOrEqual(3);
    for (const s of stars) {
      expect(s.y).toBeLessThan(h * 0.4);
      const i = (s.y * w + s.x) * 4;
      expect([night.data[i], night.data[i + 1], night.data[i + 2]]).toEqual([...STAR]);
    }
    const day = { data: new Uint8ClampedArray(w * h * 4).fill(250), width: w, height: h };
    filterPixels(day, 'moonlit');
    const s = stars[0]!;
    const i = (s.y * w + s.x) * 4;
    expect([day.data[i], day.data[i + 1], day.data[i + 2]]).not.toEqual([...STAR]);
  });

  it('puts the same stars on a picture of the same size, so the live one and the photo agree', () => {
    expect(starsOf(300, 300)).toEqual(starsOf(300, 300));
  });

  it('keeps every channel of every filter between 0 and 255', () => {
    for (const id of FILTER_IDS) {
      for (const rgb of [
        [0, 0, 0],
        [255, 255, 255],
        [255, 0, 128],
      ] as const) {
        for (const c of filterPixel(id, rgb, 0, 0, 10, 10)) {
          expect(c).toBeGreaterThanOrEqual(0);
          expect(c).toBeLessThanOrEqual(255);
        }
      }
    }
  });
});

describe("the viewfinder's frame", () => {
  /** An iPhone 15's room between the bars once the camera's strip is all that's left. */
  const UPRIGHT = { width: 393, height: 760, dpr: 3 };
  const SIDEWAYS = { width: 852, height: 330, dpr: 3 };

  const inside = (w: number, h: number) => {
    const box = frameOf(w, h)!;
    expect(box.x - POLAROID.edge).toBeGreaterThanOrEqual(0);
    expect(box.y - POLAROID.edge).toBeGreaterThanOrEqual(0);
    expect(box.x + box.width + POLAROID.edge).toBeLessThanOrEqual(w);
    expect(box.y + box.height + POLAROID.foot).toBeLessThanOrEqual(h);
    for (const n of [box.x, box.y, box.width, box.height]) expect(Number.isInteger(n)).toBe(true);
    return box;
  };

  it('is a square on a phone held upright, a little under the width, at Close and Far', () => {
    const close = fitPixelScale(UPRIGHT.width, UPRIGHT.height, UPRIGHT.dpr, TILES_ACROSS.close);
    const far = fitPixelScale(UPRIGHT.width, UPRIGHT.height, UPRIGHT.dpr, TILES_ACROSS.far);
    const near = inside(close.width, close.height);
    const wide = inside(far.width, far.height);
    expect(near.width).toBe(near.height);
    expect(wide.width).toBe(wide.height);
    // Close takes in about ten tiles across, Far a third more: each a little under the canvas.
    expect(near.width / TILE_SIZE).toBeGreaterThan(9);
    expect(near.width).toBeLessThan(close.width);
    expect(wide.width / near.width).toBeGreaterThan(1.3);
    expect(wide.width).toBeLessThan(far.width);
  });

  it('is wider than tall on a phone on its side, never more than half again', () => {
    for (const tiles of [TILES_ACROSS.close, TILES_ACROSS.far]) {
      const fit = fitPixelScale(SIDEWAYS.width, SIDEWAYS.height, SIDEWAYS.dpr, tiles);
      const box = inside(fit.width, fit.height);
      expect(box.width).toBeGreaterThan(box.height);
      expect(box.width).toBeLessThanOrEqual(Math.floor(box.height * 1.5));
    }
  });

  it('is sat in the middle of the canvas', () => {
    const box = frameOf(400, 700)!;
    expect(Math.abs(box.x - (400 - box.x - box.width))).toBeLessThanOrEqual(1);
  });

  it('is none on a canvas too small to hold a polaroid', () => {
    expect(frameOf(40, 40)).toBeNull();
  });
});

describe('a frame drawn for a photo (1.7’s Y1)', () => {
  it('is drawn with the bubbles over heads left out, and the next frame has them again', () => {
    expect(forPhoto()).toBe(false);
    let during: boolean | null = null;
    drawForPhoto(() => {
      during = forPhoto();
    });
    expect(during).toBe(true);
    expect(forPhoto()).toBe(false);
  });

  it('puts them back even if the drawing goes wrong', () => {
    expect(() =>
      drawForPhoto(() => {
        throw new Error('a frame that fails');
      }),
    ).toThrow();
    expect(forPhoto()).toBe(false);
  });
});
