import { describe, expect, it } from 'vitest';
import { CROPS, cropFromSeed, inSeason } from '../../src/data/crops';
import { ITEMS, STARTER_BAG } from '../../src/data/items';
import { RECIPES } from '../../src/data/recipes';
import { SHOPS } from '../../src/data/shop';
import { SEASON_MONTHS } from '../../src/data/milestones';
import { SNACKS } from '../../src/data/gathering';
import { VILLAGERS } from '../../src/data/villagers';
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

  it("start four kinds in a new bag (V1's R1), the rest on Scarah's cart every day", () => {
    const seeds = STARTER_BAG.filter((s) => ITEMS[s.id].kind === 'seed');
    expect(seeds).toHaveLength(4);
    expect(seeds.every((s) => s.count > 0 && crops.some((c) => CROPS[c].seed === s.id))).toBe(true);
    const cart = SHOPS.seeds.shelves[0]!.picks[0]!.from;
    for (const id of crops) expect(cart, id).toContainEqual({ item: CROPS[id].seed });
  });

  it("are each loved by someone, or go into a dish someone loves (0.2's N2)", () => {
    const loved = (id: string) =>
      Object.values(VILLAGERS).some((v) => v.loves.some((l) => l === id));
    for (const id of crops) {
      const item = CROPS[id].harvest.item;
      const dishes = Object.values(RECIPES).flatMap((r) =>
        'item' in r.makes && r.needs.some((n) => 'item' in n && n.item === item)
          ? [r.makes.item]
          : [],
      );
      expect(loved(item) || dishes.some(loved), id).toBe(true);
    }
  });

  it('have at least eight more since 0.2, each food one feeding a new dish someone loves', () => {
    expect(crops.length).toBeGreaterThanOrEqual(18);
    for (const item of [
      'tomato',
      'garlic',
      'basil',
      'avocado',
      'sweetcorn',
      'glowGourd',
    ] as const) {
      const into = Object.values(RECIPES).filter((r) =>
        r.needs.some((n) => 'item' in n && n.item === item),
      );
      expect(into.length, item).toBeGreaterThan(0);
    }
  });

  it('say on the packet which season makes them sooner, and are sooner only then', () => {
    for (const id of crops) {
      const season = CROPS[id].season;
      if (!season) {
        for (let m = 1; m <= 12; m++) expect(inSeason(id, m)).toBe(false);
        continue;
      }
      expect(ITEMS[CROPS[id].seed].description, id).toContain(season);
      for (let m = 1; m <= 12; m++) expect(inSeason(id, m)).toBe(SEASON_MONTHS[season].includes(m));
    }
  });

  it("put her chips and guacamole out as the night's snack now and then", () => {
    expect(SNACKS).toContain('chipsAndGuac');
  });
});
