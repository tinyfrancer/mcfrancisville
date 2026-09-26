import { describe, expect, it } from 'vitest';
import { CROPS, cropFromSeed } from '../../src/data/crops';
import { ITEMS, STARTER_BAG } from '../../src/data/items';
import type { CropId } from '../../src/types/ids';

const crops = Object.keys(CROPS) as CropId[];

describe('the crops', () => {
  it('each grow from a seed, and give back something that is not a seed', () => {
    for (const id of crops) {
      const row = CROPS[id];
      expect(ITEMS[row.seed].kind, id).toBe('seed');
      expect(cropFromSeed(row.seed), id).toBe(id);
      expect(ITEMS[row.harvest.item].kind, id).not.toBe('seed');
      expect(row.days, id).toBeGreaterThanOrEqual(2);
    }
  });

  it('say on the packet how long they take', () => {
    for (const id of crops) {
      expect(ITEMS[CROPS[id].seed].description, id).toContain(`${CROPS[id].days} days`);
    }
  });

  it('are at least half flowers, the heart of her garden', () => {
    const flowers = crops.filter((id) => ITEMS[CROPS[id].harvest.item].kind === 'flower');
    expect(flowers.length * 2).toBeGreaterThanOrEqual(crops.length);
  });

  it('keep pumpkins the quickest', () => {
    expect(Math.min(...crops.map((id) => CROPS[id].days))).toBe(CROPS.pumpkin.days);
  });

  it('are all in a new bag, a seed or more of each', () => {
    for (const id of crops) {
      expect(
        STARTER_BAG.some((s) => s.id === CROPS[id].seed && s.count > 0),
        id,
      ).toBe(true);
    }
  });
});
