import { CRITTER_IDS, CRITTERS, type Family, type Habitat } from '../data/critters';
import type { CritterId, MapZoneId } from '../types/ids';
import { dayKey, hourOf, windowKey } from './clock';
import { isOut, likesWeather } from './critters';
import { hashString } from './random';
import { weatherOn } from './weather';

/*
 * What eating does (phase R, decision 122). Each effect lasts from the moment she eats until the
 * window turns, worked out from when she ate and never ticked: a meal in the evening is a spring
 * in her step until 5am.
 */

/** How much quicker she walks with a spring in her step. */
export const PEP = 1.35;

/** When she last ate for each effect: the time, in ms, or null if she never has. */
export interface Meals {
  pep: number | null;
  bites: number | null;
  lure: { family: Family; at: number } | null;
}

export const NO_MEALS: Meals = { pep: null, bites: null, lure: null };

/** Whether something eaten at `at` is still doing its thing: until the window it was in turns. */
export function lasts(at: number | null, now: number): boolean {
  return at !== null && at <= now && windowKey(at) === windowKey(now);
}

/** What a lured critter is caught under, once. */
export function lureKey(at: number): string {
  return `lure:${at}`;
}

/**
 * Which critter a lure brings out to her in a place: one of its family that lives there, likes
 * today's weather, and has somewhere to be (`canLive`). One that would be out anyway at this hour
 * comes first, then one she hasn't caught yet, so a lure is a good way to fill the Cabinet. The
 * same for the same meal in the same place. Null if nothing of the family lives there.
 */
export function luredCritter(
  family: Family,
  place: MapZoneId,
  at: number,
  now: number,
  caught: (id: CritterId) => boolean,
  canLive: (habitat: Habitat) => boolean,
): CritterId | null {
  const weather = weatherOn(dayKey(now));
  const hour = Math.floor(hourOf(now));
  let pool = CRITTER_IDS.filter((id) => {
    const row = CRITTERS[id];
    return (
      row.family === family &&
      row.where.includes(place) &&
      likesWeather(id, weather) &&
      canLive(row.habitat)
    );
  });
  const narrow = (keep: (id: CritterId) => boolean) => {
    const kept = pool.filter(keep);
    if (kept.length > 0) pool = kept;
  };
  narrow((id) => isOut(id, hour));
  narrow((id) => !caught(id));
  if (pool.length === 0) return null;
  return pool[hashString(`${at}@${place}`) % pool.length]!;
}
