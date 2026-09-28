import { describe, expect, it } from 'vitest';
import {
  CROP_ART,
  overlay,
  SEEDED,
  SOIL,
  SPROUT,
  TILLED_PALETTE,
  WATERED_PALETTE,
} from '../../src/sprites/garden';
import { ITEM_ART } from '../../src/sprites/items';
import { PATCH_ART, PEBBLES, SHOOTS, SHOOTS_PALETTE } from '../../src/sprites/nature';
import { propScale } from '../../src/render/legacy';
import { TILE_SIZE } from '../../src/config/world';
import type { PropId } from '../../src/types/ids';
import { PROP_ART } from '../../src/sprites/props';
import { rasterize, spriteSize, type SpriteSource } from '../../src/sprites/sprite';
import { OLD_TILE } from '../../src/config/world';

describe('rasterize', () => {
  const source: SpriteSource = { rows: ['ab.', 'b..'] };
  const palette = { a: '#ff0000', b: '#00ff00', '.': null };

  it('writes each key as its colour and leaves null keys transparent', () => {
    const { width, height, data } = rasterize(source, palette);
    expect([width, height]).toEqual([3, 2]);
    expect([...data.slice(0, 4)]).toEqual([255, 0, 0, 255]);
    expect([...data.slice(4, 8)]).toEqual([0, 255, 0, 255]);
    expect(data[11]).toBe(0);
  });

  it('mirrors under flipX', () => {
    const { data } = rasterize(source, palette, { flipX: true });
    expect([...data.slice(8, 12)]).toEqual([255, 0, 0, 255]);
    expect(data[3]).toBe(0);
  });

  it('refuses ragged rows and keys missing from the palette', () => {
    expect(() => rasterize({ rows: ['aa', 'a'] }, palette)).toThrow(/row 1/);
    expect(() => rasterize({ rows: ['z'] }, palette)).toThrow(/'z'/);
  });
});

describe('the art', () => {
  it('every old prop is whole old tiles, and every prop rasterizes', () => {
    for (const [id, art] of Object.entries(PROP_ART) as [PropId, (typeof PROP_ART)[PropId]][]) {
      const { width, height } = spriteSize(art.source);
      if (propScale(id) > 1) {
        expect(width % OLD_TILE, id).toBe(0);
        expect(height % OLD_TILE, id).toBe(0);
      }
      expect(() => rasterize(art.source, art.palette), id).not.toThrow();
      for (const palette of art.variants ?? []) {
        expect(() => rasterize(art.source, palette), id).not.toThrow();
      }
    }
  });

  it('lights only keys a prop has, from inside it', () => {
    for (const [id, art] of Object.entries(PROP_ART)) {
      const { width, height } = spriteSize(art.source);
      for (const key of Object.keys(art.glow ?? {})) expect(art.palette, id).toHaveProperty(key);
      for (const light of art.lights ?? []) {
        expect(light.x, id).toBeLessThan(width);
        expect(light.y, id).toBeLessThan(height);
      }
    }
  });

  it('draws every item on an old tile', () => {
    for (const [id, art] of Object.entries(ITEM_ART)) {
      expect(spriteSize(art.source), id).toEqual({ width: OLD_TILE, height: OLD_TILE });
      expect(() => rasterize(art.source, art.palette), id).not.toThrow();
    }
  });

  it('draws every patch, its shoots and the pebbles on a tile', () => {
    const arts = [
      ...Object.entries(PATCH_ART),
      ['shoots', { source: SHOOTS, palette: SHOOTS_PALETTE }] as const,
      ['pebbles', { source: PEBBLES, palette: PROP_ART.rock.palette }] as const,
    ];
    for (const [id, art] of arts) {
      expect(spriteSize(art.source), id).toEqual({ width: TILE_SIZE, height: TILE_SIZE });
      expect(() => rasterize(art.source, art.palette), id).not.toThrow();
    }
  });

  it('draws every crop at every stage, a tile wide and standing on its bed', () => {
    for (const [id, art] of Object.entries(CROP_ART)) {
      const stages = [
        [SEEDED, art.greens],
        [SPROUT, art.greens],
        [art.growing, art.greens],
        [art.ripe, art.ripePalette],
        [art.ripe, art.rarePalette ?? art.ripePalette],
      ] as const;
      for (const [source, palette] of stages) {
        const { width, height } = spriteSize(source);
        expect(width, id).toBe(OLD_TILE);
        expect([OLD_TILE, OLD_TILE * 2], id).toContain(height);
        expect(() => rasterize(source, palette), id).not.toThrow();
      }
      for (const key of Object.keys(art.glow ?? {}))
        expect(art.ripePalette, id).toHaveProperty(key);
    }
    for (const palette of [TILLED_PALETTE, WATERED_PALETTE]) {
      expect(() => rasterize(SOIL, palette)).not.toThrow();
    }
  });

  it('stamps a part over a picture, leaving the rest as it was', () => {
    const stamped = overlay({ rows: ['aaa', 'aaa'] }, [{ x: 2, y: 1, rows: ['b.', 'bb'] }]);
    expect(stamped.rows).toEqual(['aaa', 'aab']);
  });

  it('draws the three houses from one grid, with a bat on her own door', () => {
    const home = PROP_ART.homeHouse.source.rows;
    const shop = PROP_ART.shopHouse.source.rows;
    expect(PROP_ART.salonHouse.source).toBe(PROP_ART.shopHouse.source);
    expect(PROP_ART.homeHouse.palette.R).not.toBe(PROP_ART.salonHouse.palette.R);
    const differ = home.flatMap((row, y) => [...row].filter((key, x) => key !== shop[y]![x]));
    expect(differ.length).toBeGreaterThan(0);
    expect(new Set(differ)).toEqual(new Set(['o', 'k']));
  });
});
