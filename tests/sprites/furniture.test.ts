import { describe, expect, it } from 'vitest';
import { FURNITURE } from '../../src/data/furniture';
import {
  FLOORING_ART,
  FURNITURE_ART,
  furnitureSprite,
  WALLPAPER_ART,
} from '../../src/sprites/furniture';
import { rasterize, spriteSize, type SpriteSource } from '../../src/sprites/sprite';
import type { FurnitureId } from '../../src/types/ids';

const ids = Object.keys(FURNITURE) as FurnitureId[];

describe('furniture art', () => {
  it.each(ids)('draws %s at the size of its footprint', (id) => {
    const art = FURNITURE_ART[id];
    const { layer, size } = FURNITURE[id];
    const sources: SpriteSource[] = [art.source];
    if (art.side) sources.push(art.side);
    if (art.back) sources.push(art.back);
    for (const source of sources) {
      const { width, height } = spriteSize(source);
      expect(() => rasterize(source, art.palette)).not.toThrow();
      expect(width).toBe(size.w * 16);
      if (layer === 'floor') expect(height).toBeGreaterThanOrEqual(size.h * 8);
      else expect(height).toBe(size.h * 16);
    }
  });

  it('has a side and a back for every piece that turns all four ways, and nothing else', () => {
    for (const id of ids) {
      const four = FURNITURE[id].turns === 'four';
      expect(Boolean(FURNITURE_ART[id].side && FURNITURE_ART[id].back), id).toBe(four);
    }
  });

  it('turns a four-way piece to its side, its back, and its other side', () => {
    expect(furnitureSprite('pumpkinChair', 1)).toEqual({
      source: FURNITURE_ART.pumpkinChair.side,
      flip: false,
    });
    expect(furnitureSprite('pumpkinChair', 2).source).toBe(FURNITURE_ART.pumpkinChair.back);
    expect(furnitureSprite('pumpkinChair', 3).flip).toBe(true);
    expect(furnitureSprite('twoHeadedDuck', 1)).toEqual({
      source: FURNITURE_ART.twoHeadedDuck.source,
      flip: true,
    });
  });

  it('lights up only keys the piece has', () => {
    for (const id of ids) {
      const glow = FURNITURE_ART[id].glow;
      if (!glow) continue;
      const keys = new Set(FURNITURE_ART[id].source.rows.join(''));
      for (const key of Object.keys(glow)) expect(keys.has(key), `${id} ${key}`).toBe(true);
    }
  });
});

describe('walls and floors', () => {
  it.each([...Object.entries(WALLPAPER_ART), ...Object.entries(FLOORING_ART)])(
    'draws %s as one tile',
    (_, art) => {
      expect(spriteSize(art.source)).toEqual({ width: 16, height: 16 });
      expect(() => rasterize(art.source, art.palette)).not.toThrow();
    },
  );
});
