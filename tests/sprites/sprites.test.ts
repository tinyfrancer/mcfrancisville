import { describe, expect, it } from 'vitest';
import { PLAYER_FRAMES, PLAYER_PALETTE } from '../../src/sprites/player';
import { PROP_ART } from '../../src/sprites/props';
import { rasterize, spriteSize, type SpriteSource } from '../../src/sprites/sprite';
import { TILE_ART } from '../../src/sprites/tiles';
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
      expect(spriteSize(art.source), id).toEqual({ width: TILE_SIZE, height: TILE_SIZE });
      expect(() => rasterize(art.source, art.palette), id).not.toThrow();
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

  it('every player frame is 16x24 and rasterizes', () => {
    for (const [facing, frames] of Object.entries(PLAYER_FRAMES)) {
      expect(frames).toHaveLength(3);
      for (const frame of frames) {
        expect(spriteSize(frame), facing).toEqual({ width: 16, height: 24 });
        expect(() => rasterize(frame, PLAYER_PALETTE), facing).not.toThrow();
      }
    }
  });

  it('draws the three houses from one grid', () => {
    expect(PROP_ART.homeHouse.source).toBe(PROP_ART.shopHouse.source);
    expect(PROP_ART.homeHouse.source).toBe(PROP_ART.salonHouse.source);
    expect(PROP_ART.homeHouse.palette.R).not.toBe(PROP_ART.salonHouse.palette.R);
  });
});
