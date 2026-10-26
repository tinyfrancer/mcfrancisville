import {
  CROW_HOUR,
  CROW_MS,
  FEED_CHOICES,
  HENS,
  IN_HOUR,
  isEgg,
  LAYERS,
  OUT_HOUR,
  type HenId,
} from '../data/hens';
import { ITEMS } from '../data/items';
import { ITEM_VALUE } from '../data/shop';
import type { ItemId } from '../types/ids';
import { hourOf } from './clock';
import { hashString } from './random';

/*
 * The hens' rules (1.6's X3, decision 382), worked out from what's kept and the clock, never
 * ticked: the day she last fed them and the eggs waiting, and where each of them is in the run.
 */

/** What the coop keeps (save v59): the day key she last fed them, and the eggs not yet collected. */
export interface HenhouseState {
  fed: string | null;
  waiting: number;
}

export const NO_HENHOUSE: HenhouseState = { fed: null, waiting: 0 };

/**
 * The eggs in the coop on a day: those she hasn't collected, and an egg from each hen if she fed
 * them on an earlier day, laid by five that morning. Unfed, they simply lay nothing.
 */
export function eggsWaiting(state: HenhouseState, today: string): number {
  return state.waiting + (state.fed !== null && state.fed < today ? LAYERS.length : 0);
}

/** Whether she can feed them today: once a day. */
export function canFeed(state: HenhouseState, today: string): boolean {
  return state.fed !== today;
}

/** Fed today: what an earlier feed laid stays waiting, and today's lays by tomorrow morning. */
export function fedOn(state: HenhouseState, today: string): HenhouseState {
  return { fed: today, waiting: eggsWaiting(state, today) };
}

/** Collected: none waiting, and today's feed, if she fed them today, still to lay. */
export function collectedOn(state: HenhouseState, today: string): HenhouseState {
  return { fed: state.fed === today ? today : null, waiting: 0 };
}

/** What the hens eat: any crop or seed from her bag, but never one of their own eggs. */
export function isFeed(id: ItemId): boolean {
  const kind = ITEMS[id].kind;
  return (kind === 'crop' || kind === 'seed') && !isEgg(id);
}

/** What she could feed them from her bag, the plainest first, as many as the card offers. */
export function feedChoices(count: (id: ItemId) => number): ItemId[] {
  return (Object.keys(ITEMS) as ItemId[])
    .filter((id) => isFeed(id) && count(id) > 0)
    .sort((a, b) => ITEM_VALUE[a] - ITEM_VALUE[b] || a.localeCompare(b))
    .slice(0, FEED_CHOICES);
}

/** Whether they're out in the run: from Reginald's crow until seven in the evening. */
export function henOut(now: number): boolean {
  const hour = hourOf(now);
  return hour >= OUT_HOUR && hour < IN_HOUR;
}

/** Whether it's the hour Reginald crows. */
export function crowHour(now: number): boolean {
  return Math.floor(hourOf(now)) === CROW_HOUR;
}

/** A box in the world's pixels: where a hen's feet may be. */
export interface Box {
  x: number;
  y: number;
  w: number;
  h: number;
}

export type HenDoing = 'walk' | 'peck' | 'stand' | 'sit' | 'crow';

/** Where one of them is and what they're about, by their feet. */
export interface HenSpot {
  id: HenId;
  x: number;
  y: number;
  facing: 'left' | 'right';
  doing: HenDoing;
}

/** How fast a hen trots between spots, pixels a second. */
const TROT = 14;

/** How long each of a hen's stretches is, ms: each a little different, so they don't move as one. */
function stretchOf(id: HenId): number {
  return 6000 + (hashString(`hen:${id}`) % 6) * 600;
}

/** Where a hen heads in a stretch: somewhere in the run, picked by her name and the stretch. */
function goalOf(id: HenId, slot: number, floor: Box): { x: number; y: number } {
  return {
    x: floor.x + (hashString(`${id}:${slot}:x`) % (floor.w + 1)),
    y: floor.y + (hashString(`${id}:${slot}:y`) % (floor.h + 1)),
  };
}

/**
 * Where a hen is now, the pets' wander (`roamGoal`) worked out from the clock alone: each stretch
 * she trots from the last spot to a new one in the run, then pecks, stands or sits a while there
 * (the rooster stands about more, and never sits). She's always inside `floor`. Reginald holds his
 * crow for `CROW_MS` after `crowedAt`.
 */
export function henAt(id: HenId, now: number, floor: Box, crowedAt: number | null): HenSpot {
  const period = stretchOf(id);
  const t = now + (hashString(`hen:${id}:offset`) % period);
  const slot = Math.floor(t / period);
  const into = t - slot * period;
  const from = goalOf(id, slot - 1, floor);
  const to = goalOf(id, slot, floor);
  const dx = to.x - from.x;
  const dy = to.y - from.y;
  const walkMs = Math.min((Math.hypot(dx, dy) / TROT) * 1000, period * 0.6);
  const facing = dx > 0 || (dx === 0 && hashString(`${id}:${slot}:f`) % 2 === 0) ? 'right' : 'left';
  const rooster = HENS[id].rooster === true;
  if (rooster && crowedAt !== null && now >= crowedAt && now - crowedAt < CROW_MS) {
    const k = Math.min(1, into / Math.max(1, walkMs));
    return { id, x: from.x + dx * k, y: from.y + dy * k, facing, doing: 'crow' };
  }
  if (into < walkMs) {
    const k = into / walkMs;
    return { id, x: from.x + dx * k, y: from.y + dy * k, facing, doing: 'walk' };
  }
  const roll = hashString(`${id}:${slot}:do`) % 6;
  const doing: HenDoing = rooster
    ? roll < 4
      ? 'stand'
      : 'peck'
    : roll < 3
      ? 'peck'
      : roll === 3
        ? 'stand'
        : roll === 4
          ? 'sit'
          : 'peck';
  return { id, x: to.x, y: to.y, facing, doing };
}
