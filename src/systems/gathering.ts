import { hashString } from './random';
import { SNACKS } from '../data/gathering';
import type { ItemId, ZoneId } from '../types/ids';
import { dayKey, hourOf, isNight, nextWindow, windowKey, windowOf, type DayWindow } from './clock';
import { BONE_KEY } from './pets';
import type { Tile } from './pathfinding';

/**
 * What she has taken: a thing (by its key) to the window it was taken in (`windowKey`). Nothing
 * ticks: a tree is ready again simply because the window it remembers isn't this one (decisions.md
 * 4), however long the game was closed. A save from before the windows kept bare day keys, which
 * are simply never this window.
 */
export type Taken = Readonly<Record<string, string>>;

/** Outside the town a key names its place too, so each map's trees and flowers are their own. */
const inZone = (zone: ZoneId, key: string) => (zone === 'town' ? key : `${zone}:${key}`);
export const propKey = (t: Tile, zone: ZoneId = 'town') => inZone(zone, `prop:${t.tx},${t.ty}`);
export const patchKey = (t: Tile, zone: ZoneId = 'town') => inZone(zone, `patch:${t.tx},${t.ty}`);
export const SNACK_KEY = 'snack';

/**
 * What comes back once a day rather than each window: the night's snack (there's one night a day),
 * Fibi's bone, which she only loses once, and a holiday's eggs and treats (phase U).
 */
export function onceADay(key: string): boolean {
  return (
    key === SNACK_KEY || key === BONE_KEY || key.startsWith('egg:') || key.startsWith('treat:')
  );
}

/** The day part of a window key, or a bare day key as it is. */
const dayOf = (taken: string) => taken.split('@')[0]!;

export function isReady(taken: Taken, key: string, now: number): boolean {
  const when = taken[key];
  if (when === undefined) return true;
  return onceADay(key) ? dayOf(when) !== dayKey(now) : when !== windowKey(now);
}

/**
 * When something taken now is back: the next window, or tomorrow morning for what comes once a
 * day. Said when she tries it again too soon.
 */
export function backIn(key: string, now: number): DayWindow {
  return onceADay(key) ? 'morning' : nextWindow(windowOf(now));
}

/** Only today's takings mean anything; older ones are dropped rather than saved forever. */
export function pruneTaken(taken: Taken, now: number): Record<string, string> {
  const today = dayKey(now);
  return Object.fromEntries(Object.entries(taken).filter(([, when]) => dayOf(when) === today));
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
