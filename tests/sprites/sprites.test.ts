import { describe, expect, it } from 'vitest';
import { ITEM_ART, PATCH_ART, PEBBLES, SPROUTS, SPROUTS_PALETTE } from '../../src/sprites/items';
import { PROP_ART } from '../../src/sprites/props';
import { rasterize, spriteSize, type SpriteSource } from '../../src/sprites/sprite';
import { TILE_ART, tileSources } from '../../src/sprites/tiles';
import { TILE_SIZE } from '../../src/render/pixelScale';

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
  it('every tile is a whole tile and rasterizes', () => {
    for (const [id, art] of Object.entries(TILE_ART)) {
      for (const source of tileSources(art)) {
        expect(spriteSize(source), id).toEqual({ width: TILE_SIZE, height: TILE_SIZE });
        expect(() => rasterize(source, art.palette), id).not.toThrow();
      }
    }
  });

  it('every prop is whole tiles wide and rasterizes', () => {
    for (const [id, art] of Object.entries(PROP_ART)) {
      const { width, height } = spriteSize(art.source);
      expect(width % TILE_SIZE, id).toBe(0);
      expect(height % TILE_SIZE, id).toBe(0);
      expect(() => rasterize(art.source, art.palette), id).not.toThrow();
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

  it('draws every item, patch and sprout on a tile', () => {
    const arts = [
      ...Object.entries(ITEM_ART),
      ...Object.entries(PATCH_ART),
      ['sprouts', { source: SPROUTS, palette: SPROUTS_PALETTE }] as const,
      ['pebbles', { source: PEBBLES, palette: PROP_ART.rock.palette }] as const,
    ];
    for (const [id, art] of arts) {
      expect(spriteSize(art.source), id).toEqual({ width: TILE_SIZE, height: TILE_SIZE });
      expect(() => rasterize(art.source, art.palette), id).not.toThrow();
    }
  });

  it('draws the three houses from one grid', () => {
    expect(PROP_ART.homeHouse.source).toBe(PROP_ART.shopHouse.source);
    expect(PROP_ART.homeHouse.source).toBe(PROP_ART.salonHouse.source);
    expect(PROP_ART.homeHouse.palette.R).not.toBe(PROP_ART.salonHouse.palette.R);
  });
});
