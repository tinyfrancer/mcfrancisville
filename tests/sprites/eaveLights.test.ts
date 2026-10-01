import { describe, expect, it } from 'vitest';
import { eaveLights } from '../../src/sprites/holidays';
import { PROP_ART } from '../../src/sprites/props';

describe('the lights along the eaves', () => {
  it('strings bulbs under every building with a roof, and only above its door', () => {
    for (const [id, art] of Object.entries(PROP_ART)) {
      if (!art.door || art.noEaves) continue;
      const lights = eaveLights(art.source, 2, art.door.y);
      expect(lights.rows.length, id).toBe(art.source.rows.length);
      // A false front and a pop-up's sign have no eaves to hang anything from.
      if (id === 'shopHouse' || id === 'popUpShop') continue;
      const bulbs = lights.rows.flatMap((row, y) =>
        [...row].flatMap((ch) => (/\d/.test(ch) ? [y] : [])),
      );
      expect(bulbs.length, id).toBeGreaterThan(0);
      expect(Math.max(...bulbs), id).toBeLessThan(art.door.y);
    }
  });
});
