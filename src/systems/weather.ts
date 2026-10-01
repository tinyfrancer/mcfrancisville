import { WEATHER_ODDS, type Weather } from '../data/weather';
import { specialDayOf } from './friendship';
import { hashString, seeded } from './random';

/**
 * The weather on a day, from its key alone (decisions.md 4), so every place and every reload
 * agrees, and nothing needs saving. Her special days are always clear: a party round the well
 * shouldn't be rained on.
 */
export function weatherOn(day: string): Weather {
  if (specialDayOf(day) !== null) return 'clear';
  const roll = Math.floor(seeded(hashString(`weather:${day}`))() * 20);
  if (roll < WEATHER_ODDS.rain) return 'rain';
  if (roll < WEATHER_ODDS.rain + WEATHER_ODDS.fog) return 'fog';
  return 'clear';
}

/**
 * Whether a rainy day is a thunderstorm (0.2's K1, personal_touches.md "Weather (1)": she loves
 * them): about one rainy day in three, from the day key as the rain is.
 */
export function stormOn(day: string): boolean {
  if (weatherOn(day) !== 'rain') return false;
  return seeded(hashString(`storm:${day}`))() < STORM_SHARE;
}

const STORM_SHARE = 0.35;

/** A storm's flashes come one to a stretch of this long at most, somewhere in its first part. */
export const FLASH_EVERY_MS = 40_000;
const FLASH_WITHIN_MS = 30_000;
/** How long after a flash its far-off rumble comes. */
export const RUMBLE_AFTER_MS = 2_200;

/** When the flash in the stretch starting at `slot` comes, if one does. */
function flashIn(day: string, slot: number): number | null {
  const random = seeded(hashString(`flash:${day}:${slot}`));
  if (random() > 0.7) return null;
  return slot * FLASH_EVERY_MS + Math.floor(random() * FLASH_WITHIN_MS);
}

/**
 * The time of the last flash of lightning at or before `now` on a stormy day, or null: none today,
 * or none in this stretch or the one before. Worked out from the clock, so it needs no keeping.
 */
export function lastFlash(day: string, now: number): number | null {
  if (!stormOn(day)) return null;
  const slot = Math.floor(now / FLASH_EVERY_MS);
  for (const s of [slot, slot - 1]) {
    const at = flashIn(day, s);
    if (at !== null && at <= now) return at;
  }
  return null;
}
