import { CONSTELLATION_IDS } from '../data/constellations';
import { CRITTER_IDS, CRITTERS, FAMILIES, type Family } from '../data/critters';
import { FIGURINE_IDS } from '../data/figurines';
import { FOSSIL_IDS } from '../data/fossils';
import { ITEMS } from '../data/items';
import { MILESTONES, SEASON_MONTHS, type SeasonId, type Shelf } from '../data/milestones';
import type {
  ConstellationId,
  CritterId,
  FigurineId,
  FossilId,
  ItemId,
  MilestoneId,
} from '../types/ids';

/** What a `had` shelf is filled from: a thing for her bag, or one of Gourdon's figurines (0.3's C3). */
export type Had = ItemId | FigurineId;

/** What a shelf is filled from: what she has caught, what's on show, what she has ever had. */
export interface ShelfFacts {
  caught: (id: CritterId) => boolean;
  donated: (id: CritterId | FossilId) => boolean;
  had: (id: Had) => boolean;
  /** Whether she has ever caught one in its shiny colours (1.4's G1). */
  shiny: (id: CritterId) => boolean;
  /** Whether a constellation is on her star chart (1.5's G4). */
  star: (id: ConstellationId) => boolean;
}

/** The season a critter is a season's own in, by the month it first comes out; none if all year. */
export function seasonOf(id: CritterId): SeasonId | null {
  const season = CRITTERS[id].season;
  if (!season) return null;
  const [first] = season;
  return (Object.keys(SEASON_MONTHS) as SeasonId[]).find((s) => SEASON_MONTHS[s].includes(first))!;
}

/** The things that fill a shelf, in the order the Cabinet keeps them; a family for the shinies'. */
export function shelfOf(shelf: Shelf): readonly (CritterId | Had | Family | ConstellationId)[] {
  if ('stars' in shelf) return CONSTELLATION_IDS;
  if ('shiny' in shelf) return shelf.shiny === 'family' ? FAMILIES : CRITTER_IDS;
  if ('caught' in shelf) return CRITTER_IDS.filter((id) => CRITTERS[id].family === shelf.caught);
  if ('wing' in shelf) {
    if (shelf.wing === 'fossil') return FOSSIL_IDS;
    return CRITTER_IDS.filter((id) => CRITTERS[id].family === shelf.wing);
  }
  if ('season' in shelf) return CRITTER_IDS.filter((id) => seasonOf(id) === shelf.season);
  if (shelf.had === 'figurine') return FIGURINE_IDS;
  return (Object.keys(ITEMS) as ItemId[]).filter((id) => ITEMS[id].kind === shelf.had);
}

/** Whether one thing on a shelf is there yet. */
function filled(
  shelf: Shelf,
  id: CritterId | Had | Family | ConstellationId,
  facts: ShelfFacts,
): boolean {
  if ('stars' in shelf) return facts.star(id as ConstellationId);
  if ('shiny' in shelf) {
    if (shelf.shiny === 'all') return facts.shiny(id as CritterId);
    return CRITTER_IDS.some((c) => CRITTERS[c].family === id && facts.shiny(c));
  }
  if ('had' in shelf) return facts.had(id as Had);
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
  const had = all.filter((thing) => filled(shelf, thing, facts)).length;
  // Half the sky is any half of it, rounded up (1.5's G4).
  const total = 'stars' in shelf && shelf.stars === 'half' ? Math.ceil(all.length / 2) : all.length;
  const have = Math.min(had, total);
  return { have, total, done: total > 0 && have === total };
}

/** The letter a finished shelf sends. */
export function milestoneLetterId(id: MilestoneId): string {
  return `shelf:${id}`;
}
