import { VILLAGERS } from '../../src/data/villagers';
import { describe, expect, it } from 'vitest';
import { FURNITURE } from '../../src/data/furniture';
import { ITEMS } from '../../src/data/items';
import {
  RECIPE_IDS,
  RECIPES,
  recipeAbout,
  recipeName,
  STARTER_RECIPES,
  stationOf,
} from '../../src/data/recipes';
import { cantMake, reckon, shortOf, type Maker } from '../../src/systems/crafting';
import type { ItemId, RecipeId } from '../../src/types/ids';

const maker = (bag: Partial<Record<ItemId, number>>, roomSize = 0): Maker => ({
  knows: (id: RecipeId) => STARTER_RECIPES.includes(id),
  count: (item) => bag[item] ?? 0,
  roomSize,
});

describe('recipes', () => {
  it('each has a name, something to say, and something it needs', () => {
    for (const id of RECIPE_IDS) {
      expect(recipeName(id), id).not.toBe(id);
      expect(recipeAbout(id), id).not.toBe('');
      expect(RECIPES[id].needs.length, id).toBeGreaterThan(0);
      for (const need of RECIPES[id].needs) expect(need.count, id).toBeGreaterThan(0);
    }
  });

  it('strings bracelets from beads, and makes furniture found nowhere else', () => {
    for (const id of RECIPE_IDS) {
      const made = RECIPES[id].makes;
      if (stationOf(id) === 'stove') {
        expect('item' in made && ITEMS[made.item].kind, id).toBe('dish');
      } else if ('item' in made && ITEMS[made.item].kind !== 'gear') {
        expect(ITEMS[made.item].kind).toBe('bracelet');
        for (const need of RECIPES[id].needs) {
          expect('item' in need && ITEMS[need.item].kind, id).toBe('bead');
        }
      }
      if ('furniture' in made) expect(FURNITURE[made.furniture].price, id).toBeUndefined();
    }
  });

  it('knows bracelets and a few pieces from the start, and sells the rest as cards', () => {
    expect(STARTER_RECIPES).toContain('loveBracelet');
    expect(STARTER_RECIPES).toContain('tigersBracelet');
    expect(STARTER_RECIPES).toContain('roomyExtension');
    expect(RECIPE_IDS.filter((id) => RECIPES[id].card !== undefined).length).toBeGreaterThan(3);
  });

  it('has every recipe a neighbour teaches taught in their letter, and no card for it', () => {
    for (const id of RECIPE_IDS) {
      const teacher = RECIPES[id].teacher;
      if (!teacher) continue;
      expect(RECIPES[id].card, id).toBeUndefined();
      const taught = VILLAGERS[teacher].rewards.some(
        (r) => 'recipe' in r.gift && r.gift.recipe === id,
      );
      expect(taught, id).toBe(true);
    }
    for (const [villager, row] of Object.entries(VILLAGERS)) {
      for (const { gift } of row.rewards) {
        if ('recipe' in gift) expect(RECIPES[gift.recipe].teacher, gift.recipe).toBe(villager);
      }
    }
  });

  it('builds each size of house once, in order', () => {
    const rooms = RECIPE_IDS.flatMap((id) => {
      const made = RECIPES[id].makes;
      return 'room' in made ? [made.room] : [];
    });
    expect(rooms).toEqual([1, 2]);
  });
});

describe('cantMake', () => {
  it('makes what she knows and has everything for', () => {
    expect(cantMake('smileyBracelet', maker({ smileyBead: 3 }))).toBeNull();
    expect(cantMake('stumpStool', maker({ wood: 10 }))).toBeNull();
  });

  it('says what she is short of', () => {
    expect(cantMake('loveBracelet', maker({ loveBeads: 1, heartBead: 1 }))).toBe('short');
    expect(shortOf('loveBracelet', (item) => (item === 'heartBead' ? 1 : 0))).toEqual([
      { item: 'loveBeads', count: 1 },
      { item: 'heartBead', count: 1 },
    ]);
  });

  it('waits for a recipe she has not learned', () => {
    expect(cantMake('stoneHearth', maker({ stone: 99, wood: 99 }))).toBe('unknown');
  });

  it('builds each extension once, and the grand one only after the roomy one', () => {
    const plenty = { wood: 999, stone: 999 };
    const knowsAll: Maker = { ...maker(plenty), knows: () => true };
    expect(cantMake('roomyExtension', knowsAll)).toBeNull();
    expect(cantMake('grandExtension', knowsAll)).toBe('notYet');
    expect(cantMake('roomyExtension', { ...knowsAll, roomSize: 1 })).toBe('built');
    expect(cantMake('grandExtension', { ...knowsAll, roomSize: 1 })).toBeNull();
    expect(cantMake('grandExtension', { ...knowsAll, roomSize: 2 })).toBe('built');
  });
});

describe('cooking', () => {
  const bag = (items: Partial<Record<ItemId, number>>) => (item: ItemId) => items[item] ?? 0;

  it('makes every dish at the stove, and knows four from the start', () => {
    const stove = RECIPE_IDS.filter((id) => stationOf(id) === 'stove');
    expect(stove.length).toBeGreaterThanOrEqual(8);
    expect(STARTER_RECIPES.filter((id) => stationOf(id) === 'stove')).toEqual([
      'pumpkinSoup',
      'fishChowder',
      'moonpetalCake',
      'midnightPlate',
    ]);
    for (const id of RECIPE_IDS) {
      if (stationOf(id) === 'bench') {
        for (const need of RECIPES[id].needs) expect('item' in need, id).toBe(true);
      }
    }
  });

  it('takes any fish from the plainest she has, and a rare one only when it is all she has', () => {
    const plenty = reckon('fishChowder', bag({ ghostMinnow: 1, blueMoonfish: 3, pumpkin: 2 }));
    expect(plenty.short).toEqual([]);
    expect(plenty.take).toEqual([
      { item: 'ghostMinnow', count: 1 },
      { item: 'pumpkin', count: 1 },
    ]);
    const rare = reckon('fishChowder', bag({ blueMoonfish: 1, ghostPepper: 1 }));
    expect(rare.take).toEqual([
      { item: 'blueMoonfish', count: 1 },
      { item: 'ghostPepper', count: 1 },
    ]);
  });

  it('never counts one thing twice, for its name and for any of its kind', () => {
    const stew = reckon('toadstoolStew', bag({ toadstool: 3 }));
    expect(stew.short).toEqual([{ any: 'crop', count: 1 }]);
    expect(stew.needs.map((n) => n.have)).toEqual([3, 0]);
    const pie = reckon('pumpkinPie', bag({ pumpkin: 1, candyCorn: 2 }));
    expect(pie.short).toEqual([]);
  });

  it('cooks a late-night snackie only after dark', () => {
    const snacks = { ...maker({ midnightPizza: 1, batWingCookie: 1 }), knows: () => true };
    expect(cantMake('midnightPlate', snacks)).toBe('night');
    expect(cantMake('midnightPlate', { ...snacks, night: true })).toBeNull();
    expect(cantMake('midnightPlate', { ...maker({ midnightPizza: 1 }), night: true })).toBe(
      'short',
    );
  });
});
