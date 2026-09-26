import { isSaveState, SAVE_VERSION, type SaveState } from './SaveState';

/** Upgrades a save from exactly version N (its key) to N + 1. */
export type MigrationStep = (state: Record<string, unknown>) => Record<string, unknown>;

// Empty until the first change of shape. Each step says why the default it fills in is honest for
// a save made before the field existed.
export const MIGRATIONS: Record<number, MigrationStep> = {};

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
