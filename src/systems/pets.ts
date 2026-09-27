import { PETS } from '../data/pets';
import type { PetId } from '../types/ids';
import { hashString } from './gathering';
import type { Tile } from './pathfinding';

/** Fibi loses a bone on about this many days in seven (personal_touches.md, "now and then"). */
export const BONE_DAYS_IN_SEVEN = 5;

/** What a found bone is remembered by in `taken`, so it's found once a day. */
export const BONE_KEY = 'bone';

/** Where Fibi's bone has turned up today: out in town, or at home beside a piece of furniture. */
export interface LostBone {
  scene: 'town' | 'home';
  tx: number;
  ty: number;
}

/**
 * Where Fibi has left a bone today, or null on a day she hasn't. Like the snack and the pop-up,
 * it's read from the day key, so it's the same all day and nothing is saved (decisions.md 70).
 * About one day in three it's at home, "under the furniture": beside whichever piece the day
 * picks, so if she moves the piece, the bone was under it all along.
 */
export function lostBone(
  day: string,
  town: readonly Tile[],
  home: readonly Tile[],
): LostBone | null {
  const h = hashString(`bone:${day}`);
  if (h % 7 >= BONE_DAYS_IN_SEVEN) return null;
  const indoors = home.length > 0 && (h >>> 4) % 3 === 0;
  const spots = indoors ? home : town;
  if (spots.length === 0) return null;
  const spot = spots[(h >>> 8) % spots.length]!;
  return { scene: indoors ? 'home' : 'town', tx: spot.tx, ty: spot.ty };
}

/** A little something a pet does now and then: a whine, a "…", a heart, or the Zs of a nap. */
export type Bubble = 'woof' | 'whine' | 'dots' | 'heart' | 'zzz';

/** Whether something happens in this stretch of `periodMs`, one time in `oneIn`, for its first `forMs`. */
function nowAndThen(what: string, now: number, periodMs: number, oneIn: number, forMs: number) {
  const slot = Math.floor(now / periodMs);
  return hashString(`${what}:${slot}`) % oneIn === 0 && now - slot * periodMs < forMs;
}

/**
 * What a pet says of its own accord, now and then, read off the clock so it needs no timer: Fibi
 * whines (or, on a day she has had a bone back, beams hearts), and Gary manages a "…".
 */
export function habitBubble(id: PetId, now: number, happy: boolean): Bubble | null {
  if (id === 'fibi') {
    if (happy) return nowAndThen('fibi:happy', now, 4000, 2, 1400) ? 'heart' : null;
    return nowAndThen('fibi:whine', now, 7000, 2, 1600) ? 'whine' : null;
  }
  if (id === 'gary') return nowAndThen('gary:dots', now, 9000, 2, 2200) ? 'dots' : null;
  return null;
}

/** Whether a smelly pet has a little stink cloud about it just now: Fibi and Gary do. */
export function stinky(id: PetId, now: number): boolean {
  if (id !== 'fibi' && id !== 'gary') return false;
  return nowAndThen(`${id}:stink`, now, 6000, 3, 2000);
}

/**
 * Whether Wybie has the zoomies in this stretch of time. He gets them about every other stretch,
 * and runs a few laps round her (or round the room).
 */
export function zoomies(now: number): boolean {
  return nowAndThen('wybie:zoom', now, 8000, 2, 3000);
}

/** Florence is awake for one stretch in four at home; the rest of the time she's asleep. */
export function florenceAwake(now: number): boolean {
  return nowAndThen('florence:awake', now, 30_000, 4, 30_000);
}

/**
 * Where a pet wandering about at home heads in this stretch of time: one of the open tiles,
 * picked by its name and the stretch, so they don't all go the same way.
 */
export function roamGoal(id: PetId, now: number, periodMs: number, tiles: readonly Tile[]): Tile {
  const slot = Math.floor(now / periodMs);
  return tiles[hashString(`${id}:roam:${slot}`) % tiles.length]!;
}

/** What happens as she pets one, the `count`th time; `{name}` is filled with its name. */
export function patLine(id: PetId, name: string, count: number): string {
  const pats = PETS[id].pats;
  return pats[count % pats.length]!.replaceAll('{name}', name);
}

/** What Fibi does as she gets a bone back. */
export function boneLine(name: string, bones: number): string {
  const line =
    bones === 1
      ? "{name}'s bone! She whines, wags her whole back end, and carries it off to lose it again. You made her day."
      : "{name}'s bone! She wags so hard she nearly falls over. That's {bones} bones you've brought back.";
  return line.replaceAll('{name}', name).replaceAll('{bones}', String(bones));
}
