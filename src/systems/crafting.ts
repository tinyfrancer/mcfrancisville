import { DISHES, isDish, PANTRY } from '../data/dishes';
import { ITEMS } from '../data/items';
import { RECIPES, type Need } from '../data/recipes';
import { ITEM_VALUE } from '../data/shop';
import type { ItemId, RecipeId } from '../types/ids';

/**
 * Why she can't make something yet: she hasn't learned it, she's short of something, it's an
 * extension her house has already had, or can't have before the one before it, or it's a
 * late-night snackie and it isn't night.
 */
export type CantMake = 'unknown' | 'short' | 'built' | 'notYet' | 'night';

/** What she has, as far as making things goes. */
export interface Maker {
  knows(id: RecipeId): boolean;
  count(item: ItemId): number;
  /** How many extensions her house has had. */
  roomSize: number;
  /** Whether it's after dark, when a late-night snackie can be cooked. */
  night?: boolean;
}

/** So many of one thing, taken from her bag. */
export interface Taken {
  item: ItemId;
  count: number;
}

/** A recipe's needs against her bag: what each has to draw on, what it would take, what's short. */
export interface Reckoning {
  /**
   * Each need in the recipe's order, with how many she has for it, and for a need of any of a
   * kind, the plainest she has, which is what it would take first.
   */
  needs: { need: Need; have: number; plainest?: ItemId }[];
  take: Taken[];
  /** What she's short of, and by how many of each. Empty when she has it all. */
  short: Need[];
}

const ITEM_IDS = Object.keys(ITEMS) as ItemId[];

/**
 * What a recipe would take from her bag. A named thing is set aside first; then a need for any of
 * a kind (at the stove) takes the plainest she has, the cheapest first and then what she has most
 * of, so a rare fish goes in the pot only when it's all she has.
 */
export function reckon(id: RecipeId, count: (item: ItemId) => number): Reckoning {
  const left = new Map<ItemId, number>();
  const leftOf = (item: ItemId) => left.get(item) ?? count(item);
  const needs: Reckoning['needs'] = [];
  const take: Taken[] = [];
  const short: Need[] = [];
  const use = (item: ItemId, n: number) => {
    left.set(item, leftOf(item) - n);
    const already = take.find((t) => t.item === item);
    if (already) already.count += n;
    else take.push({ item, count: n });
  };
  const all = RECIPES[id].needs;
  const named = all.filter((n) => 'item' in n);
  const anys = all.filter((n) => 'any' in n);
  const had = new Map<Need, number>();
  const plainest = new Map<Need, ItemId>();
  for (const need of named) {
    const have = leftOf(need.item);
    had.set(need, have);
    const n = Math.min(have, need.count);
    if (n > 0) use(need.item, n);
    if (n < need.count) short.push({ item: need.item, count: need.count - n });
  }
  for (const need of anys) {
    const holds = PANTRY[need.any].holds;
    const kinds = ITEM_IDS.filter((item) => holds(item) && leftOf(item) > 0).sort(
      (a, b) => ITEM_VALUE[a] - ITEM_VALUE[b] || leftOf(b) - leftOf(a),
    );
    had.set(
      need,
      kinds.reduce((sum, item) => sum + leftOf(item), 0),
    );
    if (kinds[0]) plainest.set(need, kinds[0]);
    let wanted = need.count;
    for (const item of kinds) {
      if (wanted === 0) break;
      const n = Math.min(leftOf(item), wanted);
      use(item, n);
      wanted -= n;
    }
    if (wanted > 0) short.push({ any: need.any, count: wanted });
  }
  for (const need of all) {
    const first = plainest.get(need);
    needs.push({ need, have: had.get(need) ?? 0, ...(first ? { plainest: first } : {}) });
  }
  return { needs, take, short };
}

/** What she's short of for a recipe, and by how many of each. Empty when she has it all. */
export function shortOf(id: RecipeId, count: (item: ItemId) => number): Need[] {
  return reckon(id, count).short;
}

/** Whether a recipe is a late-night snackie, cooked only after dark. */
export function onlyAtNight(id: RecipeId): boolean {
  const made = RECIPES[id].makes;
  return 'item' in made && isDish(made.item) && DISHES[made.item].night === true;
}

/** Why she can't make `id` now, or null if she can. */
export function cantMake(id: RecipeId, maker: Maker): CantMake | null {
  if (!maker.knows(id)) return 'unknown';
  const makes = RECIPES[id].makes;
  if ('room' in makes) {
    if (maker.roomSize >= makes.room) return 'built';
    if (maker.roomSize < makes.room - 1) return 'notYet';
  }
  if (onlyAtNight(id) && !maker.night) return 'night';
  return shortOf(id, maker.count).length > 0 ? 'short' : null;
}
