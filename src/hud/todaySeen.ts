/**
 * What of Today she last saw (V1's R2, decision 312): the keys of its lines when she last opened
 * the calendar, so the date chip can wear a dot while something new is up. Kept per phone, beside
 * the hints, never in the save: a second phone just shows the dot once more.
 */
export const TODAY_SEEN_KEY = 'mcfrancisville:todaySeen';

export function todaySeen(storage: Storage | undefined = globalThis.localStorage): string[] {
  try {
    const raw = storage?.getItem(TODAY_SEEN_KEY);
    const parsed: unknown = raw ? JSON.parse(raw) : [];
    return Array.isArray(parsed) ? parsed.filter((k): k is string => typeof k === 'string') : [];
  } catch {
    return [];
  }
}

/** She has looked: these are the lines she has seen. */
export function markTodaySeen(
  keys: readonly string[],
  storage: Storage | undefined = globalThis.localStorage,
): void {
  try {
    storage?.setItem(TODAY_SEEN_KEY, JSON.stringify(keys));
  } catch {
    // A phone that won't keep it shows the dot again, which is no hardship.
  }
}
