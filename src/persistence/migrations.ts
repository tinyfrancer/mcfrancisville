import { FIRST_VERSION, isSaveState, SAVE_VERSION, type SaveState } from './SaveState';

/** Upgrades a save from exactly version N (its key) to N + 1. */
export type MigrationStep = (state: Record<string, unknown>) => Record<string, unknown>;

// Each step says why the default it fills in is honest for a save made before the field existed.
// A step's data is written out in full rather than imported, so a later change to the starters
// can't change what an old save upgrades to. Version 0's steps (1 to 11) went with its saves
// (decisions.md 80); 0.1's chain starts at `FIRST_VERSION`.
export const MIGRATIONS: Record<number, MigrationStep> = {
  // Phase D1: her face's freckles and nose stud, and the crops she has picked. A look chosen
  // before either was offered didn't have them, so she keeps the face she chose. No crop has been
  // recorded as picked, so the first of each after this still gets her rocking out once.
  12: (state) => {
    const look = state.look as Record<string, unknown> | null;
    return {
      ...state,
      look: look ? { ...look, freckles: false, nosePiercing: false } : null,
      harvested: [],
    };
  },
  // Phase E: the places beyond the town. Before them there was only the town and her home, and
  // she had been to both; nothing shut had been opened, because nothing was shut.
  13: (state) => ({ ...state, atlas: { found: ['town', 'home'], opened: [] } }),
  // Phase F: the town re-laid as the hub. Her farm is the same two rows of eight beds, moved two
  // tiles right and one down, so each bed she tilled (and what's growing in it) moves with it.
  // Anywhere she stood in the old town is somewhere else in the new one, so she's at her door.
  14: (state) => {
    const player = state.player as Record<string, unknown>;
    const beds = state.beds as { tx: number; ty: number }[];
    const oldFarm = (b: { tx: number; ty: number }) =>
      b.tx >= 9 && b.tx <= 16 && b.ty >= 5 && b.ty <= 6;
    return {
      ...state,
      player: player.zone === 'town' ? { ...player, tx: 4, ty: 9, facing: 'down' } : player,
      beds: beds.map((b) => (oldFarm(b) ? { ...b, tx: b.tx + 2, ty: b.ty + 1 } : b)),
    };
  },
  // Phase G: the pots by her door, which were first drawn with mums in them, so that's what's in
  // them. The buildings grew too, but where she stood is checked on load, and anywhere a house
  // now stands puts her at her door.
  15: (state) => ({ ...state, porch: { plant: 'mums' } }),
  // Phase H: the insides of the buildings, and the keepsakes in her neighbours' houses. Nobody had
  // been in to see one before, so she hasn't been given any.
  16: (state) => ({ ...state, keepsakes: [] }),
  // Phase I: the places beyond the town, and what's buried in them. Nothing was buried before
  // them, so she has dug nothing up.
  17: (state) => ({ ...state, dug: [] }),
};

/** Whether a parsed save is one of version 0's, which 0.1 sets aside rather than reads. */
export function isVersionZero(raw: unknown): boolean {
  if (typeof raw !== 'object' || raw === null) return false;
  const version = (raw as Record<string, unknown>).version;
  return typeof version === 'number' && version < FIRST_VERSION;
}

/**
 * Walks a parsed save up to `current`, one step at a time. Null for anything that isn't a save, a
 * save from version 0, a version with a gap in the chain, a save from a newer build than this one,
 * or a result that isn't the current shape.
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
  if (isVersionZero(state)) return null;
  while (version < current) {
    const step = steps[version];
    if (!step) return null;
    state = step(state);
    version += 1;
    state.version = version;
  }
  return isSaveState(state) ? state : null;
}
