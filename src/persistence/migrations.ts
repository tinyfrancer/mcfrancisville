import { isSaveState, SAVE_VERSION, type SaveState } from './SaveState';

/** Upgrades a save from exactly version N (its key) to N + 1. */
export type MigrationStep = (state: Record<string, unknown>) => Record<string, unknown>;

// Each step says why the default it fills in is honest for a save made before the field existed.
// A step's data is written out in full rather than imported, so a later change to the starters
// can't change what an old save upgrades to.
export const MIGRATIONS: Record<number, MigrationStep> = {
  // v2 (phase 3) adds her look and her clothes. A v1 save was made before there was a creator, so
  // she never chose a look or typed a name: `look: null` has the game open the creator for her
  // rather than invent them. The closet is the phase 3 starters, which every new save gets too.
  1: (state) => ({
    ...state,
    look: null,
    wardrobe: [
      'teeGhoulyParton',
      'teeLadyGhoulga',
      'teeFleetwoodMacabre',
      'teeScreamDion',
      'cozyTee',
      'jerseyTigers',
      'sundressFloral',
      'sundressGingham',
      'wednesdayDress',
      'jeans',
      'cutoffs',
      'pleatedSkirt',
      'sneakers',
      'stompyBoots',
      'maryJanes',
      'pumpkinBeanie',
      'batPendant',
      'moonLocket',
      'pearlStrand',
      'roundGlasses',
      'catEyeGlasses',
    ],
  }),
  // v3 (phase 4) adds her bag and what she has taken today. There was no gathering before, so
  // nothing has been taken, and the bag is the one every new game starts with: a few purse butters.
  2: (state) => ({
    ...state,
    bag: [{ id: 'purseButter', count: 5 }],
    taken: {},
  }),
};

/**
 * Walks a parsed save up to `current`, one step at a time. Null for anything that isn't a save, a
 * version with a gap in the chain, a save from a newer build than this one, or a result that isn't
 * the current shape.
 */
export function migrateSave(
  raw: unknown,
  current: number = SAVE_VERSION,
  steps: Record<number, MigrationStep> = MIGRATIONS,
): SaveState | null {
  if (typeof raw !== 'object' || raw === null || Array.isArray(raw)) return null;
  let state = raw as Record<string, unknown>;
  let version = state.version;
  if (typeof version !== 'number' || !Number.isInteger(version) || version > current) return null;
  while (version < current) {
    const step = steps[version];
    if (!step) return null;
    state = step(state);
    version += 1;
    state.version = version;
  }
  return isSaveState(state) ? state : null;
}
