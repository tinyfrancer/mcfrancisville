import {
  FOSSIL_IDS,
  FOSSILS,
  MOUND_BEADS,
  MOUND_CANDY,
  MOUND_ODDS,
  type FossilRarity,
} from '../data/fossils';
import type { FossilId, ItemId, MapZoneId } from '../types/ids';
import type { Tile } from './pathfinding';
import { hashMixed } from './random';

/*
 * The day's mounds (0.3's C1, decision 250): where each place's is, and what's in it, both read
 * from the day key, so nothing about them is saved but that she has dug today's (`Takings`).
 */

/** What's in a mound: a fossil, most days, or a bead, or a little Candy. */
export type MoundFind = { fossil: FossilId } | { bead: ItemId } | { candy: number };

/** How often each tier of fossil is dealt, as the critters' are (0.2's F1): 12:5:2. */
export const FOSSIL_WEIGHT: Record<FossilRarity, number> = { common: 12, uncommon: 5, rare: 2 };

/** What she has dug today is kept by in `Takings`, once a day (`onceADay`). */
export function moundKey(zone: MapZoneId): string {
  return `mound:${zone}`;
}

/** Where a place's mound is today: one of its dig spots, or none if it has none. */
export function moundSpot(zone: MapZoneId, spots: readonly Tile[], day: string): Tile | null {
  if (spots.length === 0) return null;
  return spots[hashMixed(`moundAt:${zone}:${day}`) % spots.length]!;
}

/** The fossils that may be buried in a place, in the Cabinet's order. */
export function fossilsIn(zone: MapZoneId): FossilId[] {
  return FOSSIL_IDS.filter((id) => FOSSILS[id].where.includes(zone));
}

/** What's in a place's mound today. */
export function findIn(zone: MapZoneId, day: string): MoundFind {
  const h = hashMixed(`mound:${zone}:${day}`);
  const roll = h % MOUND_ODDS.of;
  const rest = h >>> 8;
  if (roll < MOUND_ODDS.bead) return { bead: MOUND_BEADS[rest % MOUND_BEADS.length]! };
  if (roll < MOUND_ODDS.bead + MOUND_ODDS.candy) return { candy: MOUND_CANDY };
  const here = fossilsIn(zone);
  const total = here.reduce((sum, id) => sum + FOSSIL_WEIGHT[FOSSILS[id].rarity], 0);
  let pick = rest % total;
  for (const id of here) {
    pick -= FOSSIL_WEIGHT[FOSSILS[id].rarity];
    if (pick < 0) return { fossil: id };
  }
  return { fossil: here[0]! };
}
