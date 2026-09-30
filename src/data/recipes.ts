import type { FurnitureId, ItemId, RecipeId, VillagerId } from '../types/ids';
import { PANTRY, type Pantry } from './dishes';
import { FURNITURE } from './furniture';
import { ITEMS } from './items';

/** What a recipe makes: a thing for her bag, a piece for her storage chest, or her house bigger. */
export type Made = { item: ItemId } | { furniture: FurnitureId } | { room: number };

/** Something a recipe takes: so many of one thing, or (at the stove) of any of a kind. */
export type Need = { item: ItemId; count: number } | { any: Pantry; count: number };

/** Where a recipe is made: her workbench, or a stove (phase R). */
export type Station = 'bench' | 'stove';

export interface RecipeRow {
  makes: Made;
  /** What it takes from her bag, all at once, when she makes it. */
  needs: readonly Need[];
  /**
   * What its recipe card costs at Cobweb Corner. A recipe with neither a card nor a teacher is one
   * she knows from the start.
   */
  card?: number;
  /** The neighbour who teaches it to her, by letter, at three hearts (phase 9). */
  teacher?: VillagerId;
  /** What it's called, where that isn't just the name of what it makes. */
  name?: string;
  /** Said at the workbench, where that isn't just the description of what it makes. */
  description?: string;
  /** Made at a stove rather than her workbench (phase R). */
  at?: 'stove';
}

const needs = (...pairs: [ItemId, number][]): Need[] =>
  pairs.map(([item, count]) => ({ item, count }));

/** What a dish takes: so many of a thing, or `[{ any }, n]` of whatever kind she has. */
const takes = (...pairs: [ItemId | { any: Pantry }, number][]): Need[] =>
  pairs.map(([what, count]) =>
    typeof what === 'string' ? { item: what, count } : { ...what, count },
  );

/**
 * Everything she can make at her workbench, in the order the workbench shows them. Bracelets are
 * strung from beads (personal_touches.md, "Crafting": love, smiles and football), furniture is made
 * from what she gathers and grows, and extensions make her house bigger, which she'd love. A room
 * only grows one size at a time.
 */
export const RECIPES: Record<RecipeId, RecipeRow> = {
  loveBracelet: {
    makes: { item: 'loveBracelet' },
    needs: needs(['loveBeads', 1], ['heartBead', 2]),
  },
  smileyBracelet: { makes: { item: 'smileyBracelet' }, needs: needs(['smileyBead', 3]) },
  friendshipBracelet: {
    makes: { item: 'friendshipBracelet' },
    needs: needs(['heartBead', 1], ['smileyBead', 1], ['batBead', 1], ['ghostBead', 1]),
  },
  tigersBracelet: {
    makes: { item: 'tigersBracelet' },
    needs: needs(['tigerFootballBead', 2], ['heartBead', 1]),
  },
  scarletBracelet: {
    makes: { item: 'scarletBracelet' },
    needs: needs(['scarletFootballBead', 2], ['heartBead', 1]),
    card: 150,
  },
  spookyBracelet: {
    makes: { item: 'spookyBracelet' },
    needs: needs(['batBead', 2], ['ghostBead', 2]),
    card: 150,
  },
  // Phase P: three of them, well placed, water all sixteen beds.
  sprinkler: { makes: { item: 'sprinkler' }, needs: needs(['stone', 6], ['wood', 3]) },
  stumpStool: { makes: { furniture: 'stumpStool' }, needs: needs(['wood', 6]) },
  jackOLantern: { makes: { furniture: 'jackOLantern' }, needs: needs(['pumpkin', 1]) },
  // Her carving (0.2's J3): a cat, from the pick of the pumpkin patch.
  catLantern: { makes: { furniture: 'catLantern' }, needs: needs(['patchPumpkin', 1]) },
  roseVase: { makes: { furniture: 'roseVase' }, needs: needs(['rose', 3], ['stone', 2]) },
  pressedFlowers: {
    makes: { furniture: 'pressedFlowers' },
    needs: needs(['moonpetal', 1], ['forgetMeBoo', 1], ['ghostDaisy', 1], ['wood', 2]),
  },
  stoneHearth: {
    makes: { furniture: 'stoneHearth' },
    needs: needs(['stone', 15], ['wood', 6]),
    card: 300,
  },
  moonflowerLamp: {
    makes: { furniture: 'moonflowerLamp' },
    needs: needs(['moonflower', 2], ['stone', 3]),
    teacher: 'maude',
  },
  candyCornWreath: {
    makes: { furniture: 'candyCornWreath' },
    needs: needs(['candyCorn', 3], ['wood', 2]),
    teacher: 'wrapunzel',
  },
  hostaPlanter: {
    makes: { furniture: 'hostaPlanter' },
    needs: needs(['hosta', 2], ['wood', 3]),
    teacher: 'barty',
  },
  littleGargoyle: {
    makes: { furniture: 'littleGargoyle' },
    needs: needs(['stone', 12]),
    card: 250,
  },
  blueRoseDome: {
    makes: { furniture: 'blueRoseDome' },
    needs: needs(['blueRose', 1], ['stone', 4]),
    teacher: 'rufus',
  },
  pepperGarland: {
    makes: { furniture: 'pepperGarland' },
    needs: needs(['ghostPepper', 4], ['wood', 1]),
    teacher: 'agatha',
  },
  // What the newcomers teach her (phase T).
  pigeonholes: {
    makes: { furniture: 'pigeonholes' },
    needs: needs(['wood', 8]),
    teacher: 'ollie',
  },
  lilyLantern: {
    makes: { furniture: 'lilyLantern' },
    needs: needs(['moonflower', 1], ['moonpetal', 2], ['wood', 1]),
    teacher: 'nessa',
  },
  pumpkinStool: {
    makes: { furniture: 'pumpkinStool' },
    needs: needs(['pumpkin', 1], ['wood', 4]),
    teacher: 'gourdon',
  },
  starChart: {
    makes: { furniture: 'starChart' },
    needs: needs(['moonpetal', 3], ['wood', 2]),
    teacher: 'hazel',
  },
  // A few days of shaking trees and chipping rocks each: there are far more trees than rocks.
  roomyExtension: {
    makes: { room: 1 },
    needs: needs(['wood', 60], ['stone', 20]),
    name: 'Roomy extension',
    description: 'Builds your home wider and deeper, with room for so much more.',
  },
  grandExtension: {
    makes: { room: 2 },
    needs: needs(['wood', 120], ['stone', 40]),
    name: 'Grand extension',
    description: 'Builds your home as big as it gets. Room for everything, and a dance floor.',
  },
  // Phase R: cooked at her stove, or Wrapunzel's oven, from what she grows, catches and finds. Four
  // she knows from the start (one for her fish, one for her late-night snackies); the rest are cards.
  pumpkinSoup: { at: 'stove', makes: { item: 'pumpkinSoup' }, needs: takes(['pumpkin', 1]) },
  fishChowder: {
    at: 'stove',
    makes: { item: 'fishChowder' },
    needs: takes([{ any: 'fish' }, 1], [{ any: 'crop' }, 1]),
  },
  moonpetalCake: {
    at: 'stove',
    makes: { item: 'moonpetalCake' },
    needs: takes(['moonpetal', 2], ['candyCorn', 1]),
  },
  midnightPlate: {
    at: 'stove',
    makes: { item: 'midnightPlate' },
    needs: takes([{ any: 'snack' }, 2]),
  },
  ghostChili: {
    at: 'stove',
    makes: { item: 'ghostChili' },
    needs: takes(['ghostPepper', 2], ['batWingBean', 2]),
    card: 120,
  },
  pumpkinPie: {
    at: 'stove',
    makes: { item: 'pumpkinPie' },
    needs: takes(['pumpkin', 1], ['candyCorn', 2]),
    card: 150,
  },
  toadstoolStew: {
    at: 'stove',
    makes: { item: 'toadstoolStew' },
    needs: takes(['toadstool', 3], [{ any: 'crop' }, 1]),
    card: 150,
  },
  roseJam: {
    at: 'stove',
    makes: { item: 'roseJam' },
    needs: takes(['rose', 3], ['candyCorn', 1]),
    card: 120,
  },
  moonflowerTea: {
    at: 'stove',
    makes: { item: 'moonflowerTea' },
    needs: takes(['moonflower', 1], ['ghostDaisy', 1]),
    card: 100,
  },
};

export const RECIPE_IDS = Object.keys(RECIPES) as RecipeId[];

/** The recipes every game knows from the start. */
export const STARTER_RECIPES: readonly RecipeId[] = RECIPE_IDS.filter(
  (id) => !RECIPES[id].card && !RECIPES[id].teacher,
);

/** Where a recipe is made. */
export function stationOf(id: RecipeId): Station {
  return RECIPES[id].at ?? 'bench';
}

/** How a need reads: the thing's name, or "Any fish". */
export function needName(need: Need): string {
  return 'item' in need ? ITEMS[need.item].name : PANTRY[need.any].name;
}

/** What a recipe is called: what it makes, unless it has a name of its own. */
export function recipeName(id: RecipeId): string {
  const row = RECIPES[id];
  if (row.name) return row.name;
  const made = row.makes;
  if ('item' in made) return ITEMS[made.item].name;
  if ('furniture' in made) return FURNITURE[made.furniture].name;
  return id;
}

/** What the workbench says about a recipe: what it makes, unless it says something of its own. */
export function recipeAbout(id: RecipeId): string {
  const row = RECIPES[id];
  if (row.description) return row.description;
  const made = row.makes;
  if ('item' in made) return ITEMS[made.item].description;
  if ('furniture' in made) return FURNITURE[made.furniture].description;
  return '';
}
