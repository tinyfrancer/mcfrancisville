import { MAYOR_VIEW, RIDE, RIDE_LINES, RIDE_MS } from '../data/fairRide';
import { VILLAGER_IDS } from '../data/villagers';
import type { VillagerId } from '../types/ids';
import { festivalsOn, partsOf } from './calendar';
import { isHusband } from './cody';
import { hashString } from './random';

/*
 * A ride on the big wheel (1.6's X2, decision 381): how far round she is, who rides with her and
 * what they say at the top. Nothing about a ride is kept; it's read off when it began.
 */

/** Where a ride is: going up, stopped at the top, coming down, or back on the ground. */
export type RidePart = 'up' | 'top' | 'down' | 'done';

/** How far round a ride is, `ms` after it began. */
export interface RideAt {
  part: RidePart;
  /** How far round the wheel her car is, 0 at the bottom to 1 all the way round. */
  turn: number;
  /** How high her car is, 0 on the ground to 1 at the very top. */
  lift: number;
}

/** Easing in and out, so the wheel starts and stops gently. */
const ease = (t: number) => (1 - Math.cos(Math.PI * Math.min(1, Math.max(0, t)))) / 2;

/** How far round a ride is, `ms` in: half a turn up, a stop, and half a turn down. */
export function rideAt(ms: number): RideAt {
  const t = Math.max(0, ms);
  let part: RidePart;
  let turn: number;
  if (t < RIDE.up) {
    part = 'up';
    turn = ease(t / RIDE.up) / 2;
  } else if (t < RIDE.up + RIDE.top) {
    part = 'top';
    turn = 0.5;
  } else if (t < RIDE_MS) {
    part = 'down';
    turn = 0.5 + ease((t - RIDE.up - RIDE.top) / RIDE.down) / 2;
  } else {
    part = 'done';
    turn = 1;
  }
  return { part, turn, lift: (1 - Math.cos(turn * Math.PI * 2)) / 2 };
}

/**
 * Who rides with her, of those at the fair now: her husband if he's there, else whoever she's
 * closest to (the first in the town's order of the closest), or nobody.
 */
export function companionOf(
  atFair: readonly VillagerId[],
  hearts: (id: VillagerId) => number,
): VillagerId | null {
  const here = VILLAGER_IDS.filter((id) => atFair.includes(id));
  const husband = here.find(isHusband);
  if (husband) return husband;
  let best: VillagerId | null = null;
  for (const id of here) if (best === null || hearts(id) > hearts(best)) best = id;
  return best;
}

/** What's said at the top: one of the companion's lines, or the mayor's plaque, dealt a ride. */
export function topLine(who: VillagerId | null, day: string, ride: number): string {
  const lines = who ? RIDE_LINES[who] : MAYOR_VIEW;
  return lines[hashString(`ride:${day}:${who ?? 'plaque'}:${ride}`) % lines.length]!;
}

/** A fair day, when Today says the wheel is turning: a weekend, or a festival's. */
export function isFairDay(day: string): boolean {
  return [0, 6].includes(partsOf(day).weekday) || festivalsOn(day).length > 0;
}
