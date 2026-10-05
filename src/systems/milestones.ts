import { CRITTER_IDS, CRITTERS } from '../data/critters';
import { FOSSIL_IDS } from '../data/fossils';
import { ITEMS } from '../data/items';
import { MILESTONES, SEASON_MONTHS, type SeasonId, type Shelf } from '../data/milestones';
import type { CritterId, FossilId, ItemId, MilestoneId } from '../types/ids';

/** What a shelf is filled from: what she has caught, what's on show, what she has ever had. */
export interface ShelfFacts {
  caught: (id: CritterId) => boolean;
  donated: (id: CritterId | FossilId) => boolean;
  had: (id: ItemId) => boolean;
}

/** The season a critter is a season's own in, by the month it first comes out; none if all year. */
export function seasonOf(id: CritterId): SeasonId | null {
  const season = CRITTERS[id].season;
  if (!season) return null;
  const [first] = season;
  return (Object.keys(SEASON_MONTHS) as SeasonId[]).find((s) => SEASON_MONTHS[s].includes(first))!;
}

/** The things that fill a shelf, in the order the Cabinet keeps them. */
export function shelfOf(shelf: Shelf): readonly (CritterId | ItemId)[] {
  if ('caught' in shelf) return CRITTER_IDS.filter((id) => CRITTERS[id].family === shelf.caught);
  if ('wing' in shelf) {
    if (shelf.wing === 'fossil') return FOSSIL_IDS;
    return CRITTER_IDS.filter((id) => CRITTERS[id].family === shelf.wing);
  }
  if ('season' in shelf) return CRITTER_IDS.filter((id) => seasonOf(id) === shelf.season);
  return (Object.keys(ITEMS) as ItemId[]).filter((id) => ITEMS[id].kind === shelf.had);
}

/** Whether one thing on a shelf is there yet. */
function filled(shelf: Shelf, id: CritterId | ItemId, facts: ShelfFacts): boolean {
  if ('had' in shelf) return facts.had(id as ItemId);
  if ('wing' in shelf) return facts.donated(id as CritterId | FossilId);
  return facts.caught(id as CritterId);
}

/** How far along a shelf is. */
export function progressOf(
  id: MilestoneId,
  facts: ShelfFacts,
): { have: number; total: number; done: boolean } {
  const shelf = MILESTONES[id].shelf;
  const all = shelfOf(shelf);
  const have = all.filter((thing) => filled(shelf, thing, facts)).length;
  return { have, total: all.length, done: all.length > 0 && have === all.length };
}

/** The letter a finished shelf sends. */
export function milestoneLetterId(id: MilestoneId): string {
  return `shelf:${id}`;
}
