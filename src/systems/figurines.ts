import {
  CARVABLE,
  CARVE_COUNT,
  carvedKindOf,
  FIGURINE_IDS,
  figurineOf,
  type CarvedKind,
} from '../data/figurines';
import type { Carvable, FigurineId, FurnitureId, ItemId } from '../types/ids';

/**
 * Gourdon's figurines (0.3's C3): what she could have carved from what's in her bag, and which
 * thing a figurine was carved from. Three of a kind make one, and nothing else is asked.
 */

/** Something she has that he could carve a figurine of, and how many of it she has. */
export interface Carving {
  thing: Carvable;
  figurine: FigurineId;
  kind: CarvedKind;
  have: number;
}

/** Every carvable thing she has one of or more, in the order they're kept. */
export function carvingsFrom(count: (id: ItemId) => number): Carving[] {
  return CARVABLE.flatMap((thing) => {
    const have = count(thing);
    return have > 0
      ? [{ thing, figurine: figurineOf(thing), kind: carvedKindOf(thing), have }]
      : [];
  });
}

/** Whether there are enough of a thing to carve one. */
export function canCarve(have: number): boolean {
  return have >= CARVE_COUNT;
}

const FIGURINES: ReadonlyMap<FurnitureId, Carvable> = new Map(
  CARVABLE.map((thing) => [figurineOf(thing), thing]),
);

/** Whether a piece is one of his figurines. */
export function isFigurine(piece: FurnitureId): piece is FigurineId {
  return FIGURINES.has(piece);
}

/** What a figurine was carved from; null for any other piece. */
export function carvedFrom(piece: FurnitureId): Carvable | null {
  return FIGURINES.get(piece) ?? null;
}

/** How many figurines there are to have. */
export const FIGURINE_COUNT = FIGURINE_IDS.length;
