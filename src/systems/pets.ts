import { PETS } from '../data/pets';
import type { PetId } from '../types/ids';
import { hashString } from './random';
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

/**
 * A little something a pet does now and then: a whine, a "…", a heart, or the Zs of a nap; and on
 * a walk (V1's R6c), a sniff on the trail and a "!" at what it found.
 */
export type Bubble = 'woof' | 'whine' | 'dots' | 'heart' | 'zzz' | 'sniff' | 'found';

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

/** What a walk turns up round her, for a pet's job (V1's R6c): read off the world's own services. */
export interface PetFinds {
  /** Today's mound in this place, while it's still to dig. */
  mound: Tile | null;
  /** The critters out where she is: the shy ones Dolly barks out, the orbs Elvira draws. */
  critters: readonly FoundCritter[];
  /** Something a neighbour lost, lying in this place. */
  lost: Tile | null;
}

export interface FoundCritter extends Tile {
  key: string;
  /** Wary, or rare enough to drift off as she nears. */
  shy: boolean;
  orb: boolean;
}

export const NO_FINDS: PetFinds = { mound: null, critters: [], lost: null };

/** Within this many tiles of her, Fibi goes and sits by the mound; within the far, she leads. */
export const SNIFF_NEAR = 5;
export const SNIFF_FAR = 14;
/** How near her a shy critter has to be for Dolly to bark it out. */
export const BARK_REACH = 4;
/** How near her an orb has to be for Elvira to draw it nearer. */
export const DRAW_REACH = 6;
/** How far off Wybie will fetch a dropped thing from. */
export const FETCH_REACH = 10;

function reachOf(a: Tile, b: Tile): number {
  return Math.max(Math.abs(a.tx - b.tx), Math.abs(a.ty - b.ty));
}

/** One step from `from` towards `to`, on open ground: straight, or along either axis. */
function stepTowards(
  from: Tile,
  to: Tile,
  canWalk: (tx: number, ty: number) => boolean,
): Tile | null {
  const dx = Math.sign(to.tx - from.tx);
  const dy = Math.sign(to.ty - from.ty);
  const options = [
    { tx: from.tx + dx, ty: from.ty + dy },
    { tx: from.tx + dx, ty: from.ty },
    { tx: from.tx, ty: from.ty + dy },
  ];
  const moved = (t: Tile) => t.tx !== from.tx || t.ty !== from.ty;
  return options.find((t) => moved(t) && canWalk(t.tx, t.ty)) ?? null;
}

/**
 * Where Fibi goes about today's mound: near enough, to the open tile beside it nearest her, to
 * sit (`by`); further off, a couple of steps ahead of her on its trail, nose down.
 */
export function sniffGoal(
  her: Tile,
  mound: Tile,
  canWalk: (tx: number, ty: number) => boolean,
): { goal: Tile; by: boolean } | null {
  const far = reachOf(her, mound);
  if (far > SNIFF_FAR) return null;
  if (far <= SNIFF_NEAR) {
    let best: Tile | null = null;
    for (let y = mound.ty - 1; y <= mound.ty + 1; y++) {
      for (let x = mound.tx - 1; x <= mound.tx + 1; x++) {
        const t = { tx: x, ty: y };
        if ((x === mound.tx && y === mound.ty) || (x === her.tx && y === her.ty)) continue;
        if (!canWalk(x, y)) continue;
        if (!best || reachOf(t, her) < reachOf(best, her)) best = t;
      }
    }
    return best && { goal: best, by: true };
  }
  const one = stepTowards(her, mound, canWalk);
  const two = one && stepTowards(one, mound, canWalk);
  const goal = two ?? one;
  return goal && { goal, by: false };
}

/** The shy critter Dolly barks out: the nearest within reach of her she hasn't barked at yet. */
export function barkTarget(
  her: Tile,
  critters: readonly FoundCritter[],
  barked: (key: string) => boolean,
): FoundCritter | null {
  const near = critters.filter((c) => c.shy && !barked(c.key) && reachOf(c, her) <= BARK_REACH);
  return near.sort((a, b) => reachOf(a, her) - reachOf(b, her))[0] ?? null;
}

/**
 * The orb Elvira draws a tile nearer, and where to: the nearest in reach not drawn yet, that isn't
 * already beside her.
 */
export function drawTarget(
  her: Tile,
  critters: readonly FoundCritter[],
  drawn: (key: string) => boolean,
  canWalk: (tx: number, ty: number) => boolean,
): { key: string; to: Tile } | null {
  const orbs = critters
    .filter((c) => c.orb && !drawn(c.key) && reachOf(c, her) > 1 && reachOf(c, her) <= DRAW_REACH)
    .sort((a, b) => reachOf(a, her) - reachOf(b, her));
  const open = (tx: number, ty: number) => canWalk(tx, ty) && (tx !== her.tx || ty !== her.ty);
  for (const orb of orbs) {
    const to = stepTowards(orb, her, open);
    if (to) return { key: orb.key, to };
  }
  return null;
}

/** Whether Wybie can fetch a dropped thing: lying near enough to her. */
export function fetchable(her: Tile, lost: Tile | null): lost is Tile {
  return lost !== null && reachOf(her, lost) <= FETCH_REACH;
}

/**
 * Whether a pet at home goes to its resting spot in this stretch, rather than pottering about:
 * about half the time, and for Gary a third.
 */
export function restsNow(id: PetId, now: number): boolean {
  return nowAndThen(`${id}:rest`, now, 20_000, id === 'gary' ? 3 : 2, 20_000);
}

/** Whether a pet that knows its trick shows it off on its own in this stretch of time. */
export function trickNow(id: PetId, now: number, ms: number): boolean {
  return nowAndThen(`${id}:trick`, now, 40_000, 3, ms);
}

/** Whether Florence, asleep and fond of her, purrs a heart through her Zs just now. */
export function dreamsOfHer(now: number): boolean {
  return nowAndThen('florence:dream', now, 5000, 3, 1400);
}
