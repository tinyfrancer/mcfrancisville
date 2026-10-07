import { describe, expect, it } from 'vitest';
import { glintAlpha, haloPixels, BLOOM_REACH } from '../../src/render/bloom';
import { cloudMask } from '../../src/render/clouds';
import { bayer, dithered } from '../../src/render/dither';
import { poolAlpha, poolFalloff, vignetteMask } from '../../src/render/lighting';
import { moonlitness, rimLit, rimPixels } from '../../src/render/moonlight';
import { puddlesOf } from '../../src/render/puddles';
import { TILE_SIZE } from '../../src/config/world';
import { TOWN } from '../../src/data/maps';
import { PUDDLE_ART } from '../../src/sprites/puddles';
import { spriteSize } from '../../src/sprites/sprite';
import { daylight, underFullMoon } from '../../src/systems/clock';
import { parseMap, tileAt } from '../../src/systems/grid';

describe('ordered dither', () => {
  it('sets every threshold of a 4×4 pattern once, the same in every repeat', () => {
    const seen = new Set<number>();
    for (let y = 0; y < 4; y++) for (let x = 0; x < 4; x++) seen.add(bayer(x, y));
    expect(seen.size).toBe(16);
    expect(bayer(-1, -3)).toBe(bayer(3, 1));
    expect(bayer(9, 6)).toBe(bayer(1, 2));
  });

  it('steps a value to the level below or above it, about as often as it is near each', () => {
    let sum = 0;
    for (let y = 0; y < 4; y++) {
      for (let x = 0; x < 4; x++) {
        const v = dithered(0.3, 4, x, y);
        expect([0.25, 0.5]).toContain(v);
        sum += v;
      }
    }
    expect(sum / 16).toBeCloseTo(0.3, 1);
    expect(dithered(1, 4, 0, 0)).toBe(1);
    expect(dithered(0, 4, 0, 0)).toBe(0);
  });
});

describe('a pool of lamplight', () => {
  it('is brightest in the middle and gone at its edge', () => {
    expect(poolFalloff(0)).toBe(1);
    expect(poolFalloff(1)).toBe(0);
    expect(poolAlpha(0, 0, 40)).toBeGreaterThan(0.9);
    expect(poolAlpha(40, 0, 40)).toBe(0);
    expect(poolAlpha(30, 30, 40)).toBe(0);
  });

  it('falls off in a few dithered steps, not hard rings, and keeps falling on average', () => {
    const r = 48;
    const levels = new Set<number>();
    let last = Infinity;
    for (let ring = 0; ring < r; ring += 4) {
      let sum = 0;
      for (let y = 0; y < 4; y++) {
        for (let x = 0; x < 4; x++) {
          const a = poolAlpha(ring + x, y, r);
          levels.add(a);
          sum += a;
        }
      }
      expect(sum).toBeLessThanOrEqual(last + 1e-9);
      last = sum;
    }
    expect(levels.size).toBeGreaterThan(5);
    expect(levels.size).toBeLessThanOrEqual(9);
  });
});

describe('the night vignette', () => {
  it('leaves the middle of the frame white and darkens its corners, in dithered steps', () => {
    const w = 390;
    const h = 724;
    const data = vignetteMask(w, h, 0.5);
    const at = (x: number, y: number) => data[(y * w + x) * 4]!;
    expect(at(195, 362)).toBe(255);
    expect(at(0, 0)).toBeLessThan(200);
    expect(data[3]).toBe(255);
    // The same distance from the middle darkens alike, whatever the frame's size: world pixels.
    const far = vignetteMask(585, 1086, 0.5);
    const cornerAtClose = at(0, 0);
    const sameSpotAtFar = far[((543 - 362) * 585 + (292 - 195)) * 4]!;
    expect(Math.abs(sameSpotAtFar - cornerAtClose)).toBeLessThan(30);
  });
});

/** A glow sprite of `w` × `h`, lit in a `size` square at its middle. */
function glowSquare(w: number, h: number, size: number): Uint8ClampedArray {
  const data = new Uint8ClampedArray(w * h * 4);
  const x0 = Math.floor((w - size) / 2);
  const y0 = Math.floor((h - size) / 2);
  for (let y = y0; y < y0 + size; y++) {
    for (let x = x0; x < x0 + size; x++) {
      data.set([255, 200, 90, 255], (y * w + x) * 4);
    }
  }
  return data;
}

describe('bloom', () => {
  it('puts a halo of the glow’s own colour round it, reaching a few pixels and no further', () => {
    const w = 12;
    const h = 12;
    const halo = haloPixels(glowSquare(w, h, 4), w, h);
    const W = w + BLOOM_REACH * 2;
    const H = h + BLOOM_REACH * 2;
    expect(halo.length).toBe(W * H * 4);
    const alpha = (x: number, y: number) => halo[(y * W + x) * 4 + 3]!;
    const middle = W / 2;
    expect(alpha(middle, middle)).toBeGreaterThan(0);
    expect(alpha(0, 0)).toBe(0);
    expect(halo[(middle * W + middle) * 4]).toBe(255);
    expect(halo[(middle * W + middle) * 4 + 2]).toBe(90);
    // Never stronger than its peak: a glow, not a sun.
    for (let i = 3; i < halo.length; i += 4) expect(halo[i]!).toBeLessThan(120);
  });

  it('is nothing where nothing glows', () => {
    const halo = haloPixels(new Uint8ClampedArray(8 * 8 * 4), 8, 8);
    expect(halo.every((v) => v === 0)).toBe(true);
  });
});

describe('the full moon’s rim', () => {
  it('silvers the top and left edges of a sprite and nothing else', () => {
    const w = 6;
    const h = 6;
    const data = new Uint8ClampedArray(w * h * 4);
    for (let y = 1; y < 5; y++)
      for (let x = 1; x < 5; x++) data.set([60, 40, 80, 255], (y * w + x) * 4);
    const out = rimPixels(data, w, h);
    const px = (x: number, y: number) => [...out.slice((y * w + x) * 4, (y * w + x) * 4 + 4)];
    expect(px(2, 1)[2]).toBeGreaterThan(80);
    expect(px(1, 3)[2]).toBeGreaterThan(80);
    expect(px(2, 1)[2]).toBeGreaterThan(px(1, 3)[2]!);
    expect(px(3, 3)).toEqual([60, 40, 80, 255]);
    expect(px(4, 4)).toEqual([60, 40, 80, 255]);
    expect(px(0, 0)).toEqual([0, 0, 0, 0]);
  });

  it('lights only a full moon’s night', () => {
    expect(rimLit(underFullMoon(daylight(23)))).toBe(true);
    expect(rimLit(daylight(23))).toBe(false);
    expect(rimLit(underFullMoon(daylight(12)))).toBe(false);
    expect(moonlitness(underFullMoon(daylight(2)))).toBe(1);
  });
});

describe('cloud shadows', () => {
  it('cover a fair part of the ground in soft-edged banks, and leave the rest open', () => {
    const mask = cloudMask(128, 57);
    const covered = mask.filter((v) => v > 0).length / mask.length;
    expect(covered).toBeGreaterThan(0.1);
    expect(covered).toBeLessThan(0.6);
    const levels = new Set(mask);
    expect(levels.has(255)).toBe(true);
    expect(levels.size).toBeGreaterThan(2);
  });
});

describe('puddles in the rain', () => {
  const town = parseMap(TOWN);
  const puddles = puddlesOf(town);

  it('lie on about one open path tile in six, wholly inside their tile', () => {
    const paths = town.tiles.filter((t) => t === 'path').length;
    expect(puddles.length).toBeGreaterThan(paths * 0.08);
    expect(puddles.length).toBeLessThan(paths * 0.3);
    for (const p of puddles) {
      expect(tileAt(town, p.tx, p.ty)).toBe('path');
      const { width, height } = spriteSize(PUDDLE_ART[p.look]!);
      expect(p.x).toBeGreaterThanOrEqual(p.tx * TILE_SIZE);
      expect(p.y).toBeGreaterThanOrEqual(p.ty * TILE_SIZE);
      expect(p.x + width).toBeLessThanOrEqual((p.tx + 1) * TILE_SIZE);
      expect(p.y + height).toBeLessThanOrEqual((p.ty + 1) * TILE_SIZE);
      expect(
        town.props.some(
          (q) => p.tx >= q.tx && p.tx < q.tx + q.w && p.ty >= q.ty && p.ty < q.ty + q.h,
        ),
      ).toBe(false);
    }
    expect(puddlesOf(town)).toEqual(puddles);
  });
});

describe('a sparkle’s glint after dark', () => {
  it('is strongest on the sparkle and gone a few pixels off', () => {
    expect(glintAlpha(0, 0)).toBeGreaterThan(0.4);
    expect(glintAlpha(7, 0)).toBe(0);
    expect(glintAlpha(0, 0)).toBeGreaterThanOrEqual(glintAlpha(3, 0));
  });
});
