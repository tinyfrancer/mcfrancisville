import type { ShelfId } from '../types/ids';

/** The collections that mark what's new on them until she has looked (phase M). */
export const SHELF_IDS: readonly ShelfId[] = ['bag', 'closet', 'storage', 'cabinet', 'recipes'];

/** Nothing new anywhere: a new game's. */
export function noneFresh(): Record<ShelfId, string[]> {
  return { bag: [], closet: [], storage: [], cabinet: [], recipes: [] };
}
