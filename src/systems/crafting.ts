import { RECIPES, type Need } from '../data/recipes';
import type { ItemId, RecipeId } from '../types/ids';

/**
 * Why she can't make something yet: she hasn't learned it, she's short of something, or it's an
 * extension her house has already had, or can't have before the one before it.
 */
export type CantMake = 'unknown' | 'short' | 'built' | 'notYet';

/** What she has, as far as making things goes. */
export interface Maker {
  knows(id: RecipeId): boolean;
  count(item: ItemId): number;
  /** How many extensions her house has had. */
  roomSize: number;
}

/** What she's short of for a recipe, and by how many of each. Empty when she has it all. */
export function shortOf(id: RecipeId, count: (item: ItemId) => number): Need[] {
  return RECIPES[id].needs.flatMap(({ item, count: needed }) => {
    const missing = needed - count(item);
    return missing > 0 ? [{ item, count: missing }] : [];
  });
}

/** Why she can't make `id` now, or null if she can. */
export function cantMake(id: RecipeId, maker: Maker): CantMake | null {
  if (!maker.knows(id)) return 'unknown';
  const makes = RECIPES[id].makes;
  if ('room' in makes) {
    if (maker.roomSize >= makes.room) return 'built';
    if (maker.roomSize < makes.room - 1) return 'notYet';
  }
  return shortOf(id, maker.count).length > 0 ? 'short' : null;
}
