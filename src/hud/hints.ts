/**
 * The two things a new player can't guess are buttons (V1's R1, decision 311): the day's chip,
 * which opens the calendar, and the "more" tray, where the rest of her things wait. Each glows
 * once, until it's first pressed, and only while her first day is under way, so an old town,
 * which knows them, never sees it. Kept per phone, beside the dedication, never in the save.
 */
export const HINTS_SEEN_KEY = 'mcfrancisville:hintsSeen';

export type HintId = 'today' | 'more';

function seenAll(storage: Storage | undefined): string[] {
  try {
    const raw = storage?.getItem(HINTS_SEEN_KEY);
    const parsed: unknown = raw ? JSON.parse(raw) : [];
    return Array.isArray(parsed) ? parsed.filter((h): h is string => typeof h === 'string') : [];
  } catch {
    return [];
  }
}

export function hintSeen(id: HintId, storage: Storage | undefined = globalThis.localStorage) {
  return seenAll(storage).includes(id);
}

export function markHintSeen(id: HintId, storage: Storage | undefined = globalThis.localStorage) {
  const seen = seenAll(storage);
  if (seen.includes(id)) return;
  try {
    storage?.setItem(HINTS_SEEN_KEY, JSON.stringify([...seen, id]));
  } catch {
    // A phone that won't keep it shows the glow again next time, which is no hardship.
  }
}

/**
 * Glows `button` (its `data-hint`) while `wanted` says so and this phone hasn't pressed it yet;
 * the first press puts it out for good. `refresh` asks again, as the first day moves on.
 */
export function hintOnce(
  button: HTMLElement,
  id: HintId,
  wanted: () => boolean,
): { refresh(): void } {
  const refresh = () => button.toggleAttribute('data-hint', wanted() && !hintSeen(id));
  button.addEventListener('click', () => {
    if (!button.hasAttribute('data-hint')) return;
    markHintSeen(id);
    refresh();
  });
  refresh();
  return { refresh };
}
