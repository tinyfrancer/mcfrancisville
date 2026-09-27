import { describe, expect, it } from 'vitest';
import { catalogue } from '../../src/sprites/catalogue';

describe('the catalogue', () => {
  const entries = catalogue();

  it('names every sprite once', () => {
    const names = entries.map((e) => e.name);
    expect(new Set(names).size).toBe(names.length);
  });

  it('draws every sprite, with something to see in it', () => {
    for (const entry of entries) {
      const raster = entry.draw();
      expect(raster.width * raster.height, entry.name).toBeGreaterThan(0);
      const seen = raster.data.some((v, i) => i % 4 === 3 && v > 0);
      expect(seen, entry.name).toBe(true);
    }
  });
});
