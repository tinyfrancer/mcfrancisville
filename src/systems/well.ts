import { WELL_FINDS, WELL_ODDS, WISHES, type Wish, type WishWhen } from '../data/wishes';
import type { ItemId } from '../types/ids';
import { daysBetween } from './calendar';
import { decorOn } from './holidays';
import { hashMixed } from './random';
import { seasonOf } from './seasons';
import { weatherOn } from './weather';

/** The day's toss at the wishing well, kept with her takings once a day (`onceADay`). */
export const WISH_KEY = 'well:wish';

/** How far a day is from a fixed one, for its parity. */
const EPOCH = '2026-01-01';

function holds(when: WishWhen, day: string): boolean {
  if ('season' in when) return seasonOf(day) === when.season;
  if ('decor' in when) return decorOn(day) === when.decor;
  return weatherOn(day) === when.weather;
}

/**
 * The wish that comes back up on a day (1.7's Y2), dealt from its key. A day draws only from the
 * lines at its own parity, so yesterday's line and today's are never the same; of those, a third of
 * days with a line for their season, holiday or weather say that one.
 */
export function wishOn(day: string): Wish {
  const parity = ((daysBetween(EPOCH, day) % 2) + 2) % 2;
  const mine = WISHES.filter((_, i) => i % 2 === parity);
  const special = mine.filter((w) => w.when && holds(w.when, day));
  const plain = mine.filter((w) => !w.when);
  const h = hashMixed(`wish:${day}`);
  const pool = special.length > 0 && h % 3 === 0 ? special : plain;
  return pool[(h >>> 3) % pool.length]!;
}

/**
 * What comes back up with the day's wish, about one toss in seven: mostly a pebble, now and then
 * a lost bead. Null on most days.
 */
export function comesUpOn(day: string): ItemId | null {
  if (hashMixed(`well:up:${day}`) % WELL_ODDS !== 0) return null;
  const total = WELL_FINDS.reduce((sum, f) => sum + f.weight, 0);
  let pick = hashMixed(`well:find:${day}`) % total;
  for (const find of WELL_FINDS) {
    if (pick < find.weight) return find.item;
    pick -= find.weight;
  }
  return WELL_FINDS[0]!.item;
}
