import {
  FONDNESS,
  GROWN_PATS,
  LEVEL_AT,
  NO_FONDNESS,
  type FondKind,
  type Fondness,
  type PetLevel,
} from '../data/affection';
import { PETS } from '../data/pets';
import type { PetId } from '../types/ids';

/**
 * How a pet grows fonder of her (V1's R6c, decision 317): points from pats, walks and treats,
 * each kind counting only so far in a day, and the level its points have reached.
 */

/** The level a pet's points have reached. */
export function levelOf(points: number): PetLevel {
  if (points >= LEVEL_AT[2]) return 2;
  if (points >= LEVEL_AT[1]) return 1;
  return 0;
}

/** How far it is through to the next level, for the sheet's bar; null once it's at the top. */
export function progressOf(points: number): { into: number; span: number } | null {
  const level = levelOf(points);
  if (level === 2) return null;
  const from = LEVEL_AT[level];
  const to = LEVEL_AT[level + 1]!;
  return { into: points - from, span: to - from };
}

/**
 * A pat, a walk's worth of steps or a treat on `day`: the pet's fondness after it, and how many
 * points it gave. Past the day's count for that kind it gives none, and nothing is ever taken off.
 */
export function fonder(
  was: Fondness | undefined,
  kind: FondKind,
  day: string,
): { fondness: Fondness; gained: number } {
  const base = was ?? NO_FONDNESS;
  const today: Fondness =
    base.day === day ? { ...base } : { ...base, day, pat: 0, walk: 0, treat: 0 };
  const { points, perDay } = FONDNESS[kind];
  const gained = Math.max(0, Math.min(points, perDay - today[kind]));
  today[kind] += gained;
  today.points += gained;
  return { fondness: today, gained };
}

/** Whether a kind still counts today: a pat, a walk or a treat that would make it fonder. */
export function countsToday(was: Fondness | undefined, kind: FondKind, day: string): boolean {
  return fonder(was, kind, day).gained > 0;
}

/**
 * What it does as she pets it, the `count`th time: its three of old, then three more for each
 * level it has reached, round and round. `{name}` is filled with its name.
 */
export function patLineAt(id: PetId, name: string, count: number, level: PetLevel): string {
  const bands = [PETS[id].pats, ...GROWN_PATS[id]].slice(0, level + 1);
  // The newest come first, so a level just reached is heard straight away.
  const pats = [bands[level]!, ...bands.slice(0, level)].flat();
  return pats[count % pats.length]!.replaceAll('{name}', name);
}
