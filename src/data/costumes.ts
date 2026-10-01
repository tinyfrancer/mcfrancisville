import type { VillagerId } from '../types/ids';

/**
 * The neighbours' own costumes for the Halloween Festival (0.2's J2, decision 144): each puts
 * theirs on in a week of October and wears it to the end of the month, so more of the town is
 * dressed up each week, and everyone by the last. Several go in pairs, like hers: the lion and the
 * ringmaster, the butterfly and the bug catcher, and the two meddling kids. The art is
 * `NEIGHBOUR_COSTUMES` in `src/sprites/villagers.ts`.
 */
export interface NeighbourCostume {
  /** The week of the festival they dress up in, from the first. */
  week: 1 | 2 | 3 | 4;
  /** What they've gone as, in a sentence: "a scarecrow". */
  as: string;
}

export const NEIGHBOUR_COSTUMES: Record<VillagerId, NeighbourCostume> = {
  cody: { week: 1, as: 'a lion' },
  barty: { week: 1, as: 'a scarecrow' },
  rufus: { week: 2, as: 'a sheep' },
  agatha: { week: 2, as: 'a black cat' },
  wrapunzel: { week: 3, as: 'a butterfly' },
  maude: { week: 3, as: 'a ghost hunter' },
  ollie: { week: 4, as: 'a ringmaster' },
  gourdon: { week: 4, as: 'a bug catcher' },
  hazel: { week: 4, as: 'a clue-finder' },
  nessa: { week: 4, as: 'a scaredy-cat' },
};
