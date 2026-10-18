/**
 * When this phone last saved a backup code, and when Cody last mentioned it (V1's S3). Like the
 * sound switches, these belong to the phone rather than her town (a code restored on a new phone
 * hasn't been backed up from it), so they live beside the save rather than in it.
 */
export const BACKED_UP_KEY = 'mcfrancisville:backedUpAt';
export const NUDGED_KEY = 'mcfrancisville:nudgedAt';

function read(key: string, storage: Storage | undefined): number | null {
  try {
    const raw = storage?.getItem(key) ?? null;
    const at = raw === null ? NaN : Number(raw);
    return Number.isFinite(at) ? at : null;
  } catch {
    return null;
  }
}

function write(key: string, at: number, storage: Storage | undefined): void {
  try {
    storage?.setItem(key, String(at));
  } catch {
    // A phone that won't keep it is nudged again sooner, which is no harm.
  }
}

export const readBackedUpAt = (storage: Storage | undefined = globalThis.localStorage) =>
  read(BACKED_UP_KEY, storage);

export const markBackedUp = (at: number, storage: Storage | undefined = globalThis.localStorage) =>
  write(BACKED_UP_KEY, at, storage);

export const readNudgedAt = (storage: Storage | undefined = globalThis.localStorage) =>
  read(NUDGED_KEY, storage);

export const markNudged = (at: number, storage: Storage | undefined = globalThis.localStorage) =>
  write(NUDGED_KEY, at, storage);
