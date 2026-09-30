import { FINALE_FESTIVAL, OTHER_HALF, PARTNER, type CodyHalf } from '../data/finale';
import type { Look } from '../types/look';
import { festivalsOn, shiftDay } from './calendar';

/**
 * The Halloween Festival's finale (0.2's J4, decision 157), from her look and the day key alone:
 * which half Cody wears, what she went as, and the letter the morning after.
 */

/** The half of a couple's costume she's wearing, as Cody's other half: null if none. */
function codysOf(look: Look): CodyHalf | null {
  for (const worn of Object.values(look.outfit)) {
    const half = worn && OTHER_HALF[worn.id];
    if (half) return half;
  }
  return null;
}

/** What Cody goes as at the finale: the other half of hers, or his own lion. */
export function codyHalf(look: Look): CodyHalf {
  return codysOf(look) ?? 'lion';
}

/** What she went as, if it's half of a couple's costume. */
export function herHalf(look: Look): CodyHalf | null {
  const his = codysOf(look);
  return his ? PARTNER[his] : null;
}

/** Cody's letter the morning after the festival, as its id: `halloweenFestival:2026`. */
export function finaleLetterId(day: string): string | null {
  const yesterday = shiftDay(day, -1);
  if (!festivalsOn(yesterday).includes(FINALE_FESTIVAL)) return null;
  if (festivalsOn(day).includes(FINALE_FESTIVAL)) return null;
  return `${FINALE_FESTIVAL}:${yesterday.slice(0, 4)}`;
}

/** Whoever she crowned is kept by this in `Takings`, for the night. */
export const crownKey = (villager: string) => `crown:${villager}`;
