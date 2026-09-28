import { describe, expect, it } from 'vitest';
import { tileHash, variantOf } from '../../src/sprites/terrain';
import { isPlainDay, skyColour } from '../../src/render/lighting';
import { daylight } from '../../src/systems/clock';

describe('the sky', () => {
  it('leaves midday exactly as drawn', () => {
    expect(skyColour(daylight(12))).toEqual([255, 255, 255]);
    expect(isPlainDay(daylight(12))).toBe(true);
  });

  it('darkens the night without turning it black', () => {
    const [r, g, b] = skyColour(daylight(23));
    expect(Math.min(r, g, b)).toBeGreaterThan(100);
    expect(b).toBeGreaterThan(r);
    expect(isPlainDay(daylight(23))).toBe(false);
  });

  it('is warm through the golden hour', () => {
    const [r, , b] = skyColour(daylight(18));
    expect(r).toBeGreaterThan(b);
  });
});

describe('scattering the grass', () => {
  it('gives a tile the same look every time', () => {
    expect(variantOf(7, 11, 4)).toBe(variantOf(7, 11, 4));
    expect(tileHash(7, 11)).not.toBe(tileHash(11, 7));
  });

  it('keeps about half the ground plain, and uses every look', () => {
    const seen = [0, 0, 0, 0];
    for (let ty = 0; ty < 40; ty++) {
      for (let tx = 0; tx < 40; tx++) seen[variantOf(tx, ty, 4)]! += 1;
    }
    expect(seen[0]! / 1600).toBeGreaterThan(0.45);
    expect(seen[0]! / 1600).toBeLessThan(0.75);
    expect(seen.every((n) => n > 0)).toBe(true);
  });

  it('has one look when there is only one', () => {
    expect(variantOf(3, 4, 1)).toBe(0);
  });
});
