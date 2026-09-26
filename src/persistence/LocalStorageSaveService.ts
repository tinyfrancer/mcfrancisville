import { migrateSave } from './migrations';
import type { SaveService } from './SaveService';
import type { SaveState } from './SaveState';

export const SAVE_KEY = 'mcfrancisville:save';
export const UNREADABLE_PREFIX = 'mcfrancisville:save:unreadable:';

export class LocalStorageSaveService implements SaveService {
  load(): SaveState | null {
    let raw: string | null;
    try {
      raw = localStorage.getItem(SAVE_KEY);
    } catch {
      return null;
    }
    if (!raw) return null;

    let migrated: SaveState | null = null;
    try {
      migrated = migrateSave(JSON.parse(raw));
    } catch {
      migrated = null;
    }
    if (!migrated) {
      this.setAside(raw);
      return null;
    }
    // Written straight back so a migration runs once, not on every launch.
    this.save(migrated);
    return migrated;
  }

  save(state: SaveState): void {
    try {
      localStorage.setItem(SAVE_KEY, JSON.stringify(state));
    } catch {
      // Full or blocked storage: the game carries on, and the next save tries again.
    }
  }

  /**
   * A save this build can't read is moved out of the way rather than deleted (decisions.md 25): the
   * game starts fresh, and a later fix can still bring her town back.
   */
  private setAside(raw: string): void {
    try {
      localStorage.setItem(`${UNREADABLE_PREFIX}${Date.now()}`, raw);
      localStorage.removeItem(SAVE_KEY);
    } catch {
      // If it can't be copied, leave it where it is: never delete what couldn't be kept.
    }
  }
}
