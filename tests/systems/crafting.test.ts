import { describe, expect, it } from 'vitest';
import { FURNITURE } from '../../src/data/furniture';
import { ITEMS } from '../../src/data/items';
import {
  RECIPE_IDS,
  RECIPES,
  recipeAbout,
  recipeName,
  STARTER_RECIPES,
} from '../../src/data/recipes';
import { cantMake, shortOf, type Maker } from '../../src/systems/crafting';
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
      if ('item' in made) {
        expect(ITEMS[made.item].kind).toBe('bracelet');
        for (const { item } of RECIPES[id].needs) expect(ITEMS[item].kind, id).toBe('bead');
      }
      if ('furniture' in made) expect(FURNITURE[made.furniture].price, id).toBeUndefined();
    }
  });

  it('knows bracelets and a few pieces from the start, and sells the rest as cards', () => {
    expect(STARTER_RECIPES).toContain('loveBracelet');
    expect(STARTER_RECIPES).toContain('tigersBracelet');
    expect(STARTER_RECIPES).toContain('roomyExtension');
    expect(RECIPE_IDS.filter((id) => RECIPES[id].card !== undefined).length).toBeGreaterThan(5);
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
