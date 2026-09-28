import { describe, expect, it } from 'vitest';
import { TILE_SIZE } from '../../src/config/world';
import { CRITTERS } from '../../src/data/critters';
import { FIXTURES } from '../../src/data/interiors';
import { FIXTURE_ART } from '../../src/sprites/interiors';
import { FURNITURE } from '../../src/data/furniture';
import { FURNITURE_ART, furnitureSprite } from '../../src/sprites/furniture';
import { DOOR_MAT_ART, FLOORING_ART, WALLPAPER_ART } from '../../src/sprites/surfaces';
import { rasterize, spriteSize, type SpriteSource } from '../../src/sprites/sprite';
import type { FixtureId, FurnitureId } from '../../src/types/ids';

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
      expect(width).toBe(size.w * TILE_SIZE);
      if (layer === 'floor') expect(height).toBeGreaterThanOrEqual(size.h * (TILE_SIZE / 2));
      else expect(height).toBe(size.h * TILE_SIZE);
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
  it.each([
    ...Object.entries(WALLPAPER_ART),
    ...Object.entries(FLOORING_ART),
    ['doorMat', DOOR_MAT_ART] as const,
  ])('draws %s as one tile', (_, art) => {
    expect(spriteSize(art.source)).toEqual({ width: TILE_SIZE, height: TILE_SIZE });
    expect(() => rasterize(art.source, art.palette)).not.toThrow();
  });
});

describe('what stands in the town buildings', () => {
  it.each(Object.keys(FIXTURES) as FixtureId[])('draws %s at 32, over its footprint', (id) => {
    const art = FIXTURE_ART[id];
    const { layer, size } = FIXTURES[id];
    const { width, height } = spriteSize(art.source);
    expect(() => rasterize(art.source, art.palette)).not.toThrow();
    expect(width).toBe(size.w * TILE_SIZE);
    if (layer === 'floor') expect(height).toBeGreaterThanOrEqual(size.h * TILE_SIZE);
    else expect(height).toBe(size.h * TILE_SIZE);
    const keys = new Set(art.source.rows.join(''));
    for (const key of Object.keys(art.glow ?? {})) expect(keys.has(key), `${id} ${key}`).toBe(true);
  });

  it('has a nook in each museum case for every critter of a family, on its glass', () => {
    const nooks = FIXTURE_ART.museumCase.nooks!;
    const biggest = Math.max(
      ...['moth', 'bat', 'frog', 'orb', 'beetle', 'fish'].map(
        (f) => Object.values(CRITTERS).filter((c) => c.family === f).length,
      ),
    );
    expect(nooks.length).toBeGreaterThanOrEqual(biggest);
    const rows = FIXTURE_ART.museumCase.source.rows;
    for (const { x, y } of nooks) {
      for (const [dx, dy] of [
        [0, 0],
        [15, 15],
      ] as const) {
        expect(rows[y + dy]![x + dx], `${x},${y}`).toBe('g');
      }
    }
  });
});
