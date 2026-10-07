import type { Closeness } from './types/view';

/**
 * How close the camera is (decision 290). Like the sound switches, a preference of the phone's
 * rather than part of her town, so it lives beside the save rather than in it, and a backup code
 * doesn't carry it. Close until she picks Far.
 */
export const VIEW_KEY = 'mcfrancisville:view';

export function readCloseness(storage: Storage | undefined = globalThis.localStorage): Closeness {
  try {
    return storage?.getItem(VIEW_KEY) === 'far' ? 'far' : 'close';
  } catch {
    return 'close';
  }
}

export function writeCloseness(
  closeness: Closeness,
  storage: Storage | undefined = globalThis.localStorage,
): void {
  try {
    storage?.setItem(VIEW_KEY, closeness);
  } catch {
    // A phone that won't keep it opens Close next time.
  }
}
