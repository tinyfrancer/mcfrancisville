import { describe, expect, it } from 'vitest';
import { setOf, SETS, SHOWS } from '../../src/data/display';
import { FURNITURE } from '../../src/data/furniture';
import { ITEMS } from '../../src/data/items';
import { fitted, halved, SHOWCASE_ART, showcaseLayers } from '../../src/sprites/display';
import { FURNITURE_ART } from '../../src/sprites/furniture';
import { rasterizeLayers, spriteSize } from '../../src/sprites/sprite';
import { takes } from '../../src/systems/display';
import type { DisplayPiece, ItemId, SetPiece } from '../../src/types/ids';

const SET_PIECES = Object.keys(SETS) as SetPiece[];
const DISPLAY_PIECES = Object.keys(SHOWS) as DisplayPiece[];
const ITEM_IDS = Object.keys(ITEMS) as ItemId[];

describe('what shows off what she has (0.3’s H2)', () => {
  it('has a place on each set piece for every thing in its set', () => {
    for (const id of SET_PIECES) {
      expect(setOf(id).length, id).toBeGreaterThan(0);
      // A thing added to a set needs a place on its piece: add a slot in `sprites/display.ts`.
      expect(SHOWCASE_ART[id].slots.length, id).toBeGreaterThanOrEqual(setOf(id).length);
    }
  });

  it('draws each piece the size of its footprint, and its back and front alike', () => {
    for (const id of [...SET_PIECES, ...DISPLAY_PIECES]) {
      const { back, front } = SHOWCASE_ART[id];
      const size = spriteSize(back);
      if (front) expect(spriteSize(front), id).toEqual(size);
      expect(spriteSize(FURNITURE_ART[id].source), id).toEqual(size);
      const row = FURNITURE[id];
      expect(size.width, id).toBe(row.size.w * 32);
      if (row.layer === 'wall') expect(size.height, id).toBe(row.size.h * 32);
    }
  });

  it('keeps everything it shows inside its place, whatever its size', () => {
    for (const id of [...SET_PIECES, ...DISPLAY_PIECES]) {
      const art = SHOWCASE_ART[id];
      const things = ITEM_IDS.filter((item) =>
        id in SETS ? setOf(id as SetPiece).includes(item) : takes(id as DisplayPiece, item),
      );
      for (const item of things) {
        for (const slot of art.slots) {
          const rows = fitted(item, slot, art.mini === true);
          expect(rows.length, `${id} ${item}`).toBeLessThanOrEqual(slot.h);
          expect(rows[0]?.length ?? 0, `${id} ${item}`).toBeLessThanOrEqual(slot.w);
          expect(rows.length, `${id} ${item}`).toBeGreaterThan(0);
        }
      }
    }
  });

  it('draws every set whole, and every thing a display piece takes, without a stray key', () => {
    for (const id of SET_PIECES) {
      const raster = rasterizeLayers(showcaseLayers(id, setOf(id)));
      const empty = rasterizeLayers(showcaseLayers(id, []));
      expect(raster.data, id).not.toEqual(empty.data);
    }
    for (const id of DISPLAY_PIECES) {
      for (const item of ITEM_IDS.filter((i) => takes(id, i))) {
        expect(() => rasterizeLayers(showcaseLayers(id, [item])), `${id} ${item}`).not.toThrow();
      }
    }
  });

  it('halves a grid by the key most of each block is, clear where it is mostly clear', () => {
    const clear = (k: string) => k === '.';
    expect(halved(['aabb', 'aabb', '..b.', '....'], clear)).toEqual(['ab', '..']);
    expect(halved(['ab', 'bb'], clear)).toEqual(['b']);
  });
});
