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
import { TILE_SIZE } from '../../src/config/world';
import type { ItemId, PropId } from '../../src/types/ids';
import { ITEMS } from '../../src/data/items';
import { PROP_ART } from '../../src/sprites/props';
import { PROP_FOOTPRINT } from '../../src/data/maps';
import { rasterize, spriteSize, type SpriteSource } from '../../src/sprites/sprite';
import { ICON_SIZE } from '../../src/config/world';

/** Every building, each drawn at 32 with its own exterior (phase G). */
const BUILDINGS: readonly PropId[] = [
  'homeHouse',
  'shopHouse',
  'salonHouse',
  'bakery',
  'popUpShop',
  'castle',
];

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
  it('rasterizes every prop, in every colouring and shape', () => {
    for (const [id, art] of Object.entries(PROP_ART) as [PropId, (typeof PROP_ART)[PropId]][]) {
      expect(() => rasterize(art.source, art.palette), id).not.toThrow();
      for (const form of art.forms ?? []) {
        expect(() => rasterize(form, art.palette), id).not.toThrow();
      }
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

  it('draws every item on an icon square, and a critter or fossil as it looks in its case', () => {
    for (const [id, art] of Object.entries(ITEM_ART)) {
      const kind = ITEMS[id as ItemId].kind;
      const side = kind === 'critter' || kind === 'fossil' ? 24 : ICON_SIZE;
      expect(spriteSize(art.source), id).toEqual({ width: side, height: side });
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
        expect(width, id).toBe(TILE_SIZE);
        expect([TILE_SIZE, 56], id).toContain(height);
        expect(() => rasterize(source, palette), id).not.toThrow();
      }
      for (const key of Object.keys(art.glow ?? {}))
        expect(art.ripePalette, id).toHaveProperty(key);
      if (id !== 'hosta') expect(art.ripe.rows, id).not.toEqual(art.growing.rows);
    }
    for (const palette of [TILLED_PALETTE, WATERED_PALETTE]) {
      expect(() => rasterize(SOIL, palette)).not.toThrow();
    }
  });

  it('keeps every mound on its bed, and a seed or sprout mound in its middle', () => {
    /** The box round the pixels of any of `keys`, in the bed's own tile, bottoms together. */
    const box = (source: SpriteSource, keys: string) => {
      const lift = source.rows.length - TILE_SIZE;
      const xs: number[] = [];
      const ys: number[] = [];
      source.rows.forEach((row, y) =>
        [...row].forEach((k, x) => {
          if (!keys.includes(k)) return;
          xs.push(x);
          ys.push(y - lift);
        }),
      );
      const [x0, x1, y0, y1] = [Math.min(...xs), Math.max(...xs), Math.min(...ys), Math.max(...ys)];
      return { x0, x1, y0, y1, mx: (x0 + x1) / 2, my: (y0 + y1) / 2 };
    };
    const bed = box(SOIL, 'Lsdcw');
    const middle = (s: SpriteSource) => box(s, 'MmD');
    for (const [id, art] of Object.entries(CROP_ART)) {
      for (const source of [SEEDED, SPROUT, art.growing]) {
        const m = middle(source);
        expect(m.y1, id).toBeLessThanOrEqual(bed.y1);
        expect(m.mx, id).toBe(bed.mx);
      }
    }
    for (const source of [SEEDED, SPROUT]) {
      expect(Math.abs(middle(source).my - bed.my)).toBeLessThanOrEqual(1);
    }
  });

  it('stamps a part over a picture, leaving the rest as it was', () => {
    const stamped = overlay({ rows: ['aaa', 'aaa'] }, [{ x: 2, y: 1, rows: ['b.', 'bb'] }]);
    expect(stamped.rows).toEqual(['aaa', 'aab']);
  });

  it('draws every building its own exterior, lit after dark, with a door she fits through', () => {
    const sources = new Set<unknown>();
    for (const id of BUILDINGS) {
      const art = PROP_ART[id];
      expect(sources.has(art.source), id).toBe(false);
      sources.add(art.source);
      expect(art.glow, id).toBeDefined();
      expect(art.lights?.length, id).toBeGreaterThan(0);
      // Her size says a door is at least 28 by 52, and it's centred over a tile at the front.
      const door = art.door!;
      expect(door.w, id).toBeGreaterThanOrEqual(28);
      expect(door.h, id).toBeGreaterThanOrEqual(52);
      const { width } = spriteSize(art.source);
      const { w } = PROP_FOOTPRINT[id];
      const fromLeft = door.x + door.w / 2 - (width - w * TILE_SIZE) / 2;
      expect((fromLeft - TILE_SIZE / 2) % TILE_SIZE, id).toBe(0);
      // And the map knows which tile it's over, to bring her back out in front of it.
      expect((fromLeft - TILE_SIZE / 2) / TILE_SIZE, id).toBe(PROP_FOOTPRINT[id].door);
    }
  });
});
