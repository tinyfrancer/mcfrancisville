import { SNACKS } from '../data/gathering';
import type { ItemId, ZoneId } from '../types/ids';
import { dayKey, hourOf, isNight } from './clock';
import type { Tile } from './pathfinding';

/**
 * What she has taken today: a thing in town (by its key) to the day key it was taken on. Nothing
 * ticks: a tree is ready again simply because today's key is not the one it remembers (decisions.md
 * 4), however long the game was closed.
 */
export type Taken = Readonly<Record<string, string>>;

/** Outside the town a key names its place too, so each map's trees and flowers are their own. */
const inZone = (zone: ZoneId, key: string) => (zone === 'town' ? key : `${zone}:${key}`);
export const propKey = (t: Tile, zone: ZoneId = 'town') => inZone(zone, `prop:${t.tx},${t.ty}`);
export const patchKey = (t: Tile, zone: ZoneId = 'town') => inZone(zone, `patch:${t.tx},${t.ty}`);
export const SNACK_KEY = 'snack';

export function isReady(taken: Taken, key: string, now: number): boolean {
  return taken[key] !== dayKey(now);
}

/** Only today's takings mean anything; older ones are dropped rather than saved forever. */
export function pruneTaken(taken: Taken, now: number): Record<string, string> {
  const today = dayKey(now);
  return Object.fromEntries(Object.entries(taken).filter(([, day]) => day === today));
}

/** A small, steady hash of a string (FNV-1a), so a day always picks the same snack and spot. */
export function hashString(text: string): number {
  let h = 0x811c9dc5;
  for (let i = 0; i < text.length; i++) {
    h ^= text.charCodeAt(i);
    h = Math.imul(h, 0x01000193);
  }
  return h >>> 0;
}

export interface Snack {
  item: ItemId;
  tx: number;
  ty: number;
}

/**
 * Tonight's snack and where it is, the same all night. Null by day, once she has found it, or on a
 * map with nowhere to leave one.
 */
export function snackTonight(spots: readonly Tile[], taken: Taken, now: number): Snack | null {
  if (spots.length === 0 || !isNight(hourOf(now)) || !isReady(taken, SNACK_KEY, now)) return null;
  const h = hashString(dayKey(now));
  const spot = spots[h % spots.length]!;
  const item = SNACKS[(h >>> 8) % SNACKS.length]!;
  return { item, tx: spot.tx, ty: spot.ty };
}
