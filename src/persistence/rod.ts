import { FIRST_ROD, isRodColour, type RodColourId } from '../data/rods';

/**
 * Her rod's colour (0.2's K2). Kept by the phone beside the save, as the sound switches are,
 * rather than in it: it's only how the rod looks, and a session that paints it doesn't change
 * the save's shape. A backup code doesn't carry it, so a new phone starts on plain wood.
 */
export const ROD_KEY = 'mcfrancisville:rod';

export function readRodColour(storage: Storage | undefined = globalThis.localStorage): RodColourId {
  try {
    const saved = storage?.getItem(ROD_KEY);
    return isRodColour(saved) ? saved : FIRST_ROD;
  } catch {
    return FIRST_ROD;
  }
}

export function writeRodColour(
  colour: RodColourId,
  storage: Storage | undefined = globalThis.localStorage,
): void {
  try {
    storage?.setItem(ROD_KEY, colour);
  } catch {
    // A phone that won't keep it paints the rod again next time.
  }
}
