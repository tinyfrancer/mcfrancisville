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
  // v4 (phase 5) adds her garden. There was no farm before, so no bed has been tilled. Her bag
  // gains the seeds every new game now starts with, since there was nowhere to get them before.
  3: (state) => ({
    ...state,
    // A bag that isn't a list is left for the shape check to refuse, rather than thrown over here.
    bag: Array.isArray(state.bag)
      ? [
          ...(state.bag as unknown[]),
          { id: 'pumpkinSeed', count: 4 },
          { id: 'roseSeed', count: 2 },
          { id: 'moonflowerSeed', count: 2 },
          { id: 'ghostPepperSeed', count: 2 },
          { id: 'candyCornSeed', count: 2 },
          { id: 'batWingBeanSeed', count: 2 },
          { id: 'snapdragonSeed', count: 2 },
          { id: 'spiderLilyBulb', count: 2 },
          { id: 'hostaDivision', count: 2 },
          { id: 'batFlowerSeed', count: 2 },
        ]
      : state.bag,
    beds: [],
  }),
  // v5 (phase 6) adds Candy. There was nothing to buy or sell before, so she has earned and spent
  // none: she starts with the little every new game gets.
  4: (state) => ({ ...state, candy: 100 }),
  // v6 (phase 7) adds her home. There was no way in before, so she was out in town, and the house
  // was never touched: it is furnished as every new game's is, since it was always meant to be
  // (personal_touches.md, "Her home"), with nothing she earned lost or duplicated.
  5: (state) => ({
    ...state,
    // A player that isn't an object is left for the shape check to refuse.
    player:
      typeof state.player === 'object' && state.player !== null
        ? { ...state.player, indoors: false }
        : state.player,
    home: {
      placed: [
        { id: 'batBed', tx: 10, ty: 3, turn: 0 },
        { id: 'twoHeadedDuck', tx: 8, ty: 3, turn: 0 },
        { id: 'moonRug', tx: 3, ty: 6, turn: 0 },
        { id: 'pumpkinChair', tx: 3, ty: 6, turn: 0 },
        { id: 'ghostPortrait', tx: 2, ty: 1, turn: 0 },
        { id: 'wallShelf', tx: 4, ty: 1, turn: 0 },
        { id: 'moonPainting', tx: 6, ty: 1, turn: 0 },
        { id: 'batClock', tx: 8, ty: 0, turn: 0 },
        { id: 'mysteryCorkboard', tx: 10, ty: 1, turn: 0 },
      ],
      stored: [{ id: 'succulents', count: 1 }],
      wallpaper: 'plumStripes',
      flooring: 'oakBoards',
      wallpapers: ['plumStripes'],
      floorings: ['oakBoards'],
    },
  }),
  // v7 (phase 8) adds crafting. She had learned no recipes, since there was nothing to learn them
  // from; the ones everyone knows need no saving. Her house had never been extended, so it is the
  // size it always was. Her workbench goes where a new game's stands; if she has put something
  // there, the home finds that it doesn't fit and keeps it in her storage chest instead.
  6: (state) => ({
    ...state,
    recipes: [],
    // A home that isn't an object, or has no list of pieces, is left for the shape check.
    home:
      typeof state.home === 'object' &&
      state.home !== null &&
      Array.isArray((state.home as Record<string, unknown>).placed)
        ? {
            ...state.home,
            size: 0,
            placed: [
              ...((state.home as Record<string, unknown>).placed as unknown[]),
              { id: 'workbench', tx: 4, ty: 3, turn: 0 },
            ],
          }
        : state.home,
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
