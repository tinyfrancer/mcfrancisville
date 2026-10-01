import { INTERIOR_IDS, INTERIORS } from '../data/interiors';
import { doorStep, PROP_FOOTPRINT, type Tile } from '../data/maps';
import { VILLAGER_IDS, VILLAGERS } from '../data/villagers';
import { ZONE_IDS, ZONES } from '../data/zones';
import type { InteriorId, MapZoneId, PropId, VillagerId } from '../types/ids';
import { daysBetween, nextDay, partsOf } from './calendar';
import type { PlacedProp } from './grid';
import { holds, type UnlockFacts } from './zones';

/*
 * Newcomers (phase T, decisions.md 125): who has moved to town, worked out from the day each wrote
 * to say they were coming. They move in the day after their letter, and the next can write a month
 * after that. Everything else about them is a neighbour like any other.
 */

/** The fewest days from her first day, or one newcomer's letter, to the next newcomer's. */
export const NEWCOMER_DAYS = 30;

/** Everyone who lives in town from her first day. */
export const FIRST_NEIGHBOURS: readonly VillagerId[] = VILLAGER_IDS.filter(
  (id) => !VILLAGERS[id].newcomer,
);

/** Those who move in later, in the order they come. */
export const NEWCOMER_IDS: readonly VillagerId[] = VILLAGER_IDS.filter(
  (id) => VILLAGERS[id].newcomer,
);

/**
 * What's saved of the newcomers: the day key the month till the next one runs from, the day
 * each newcomer wrote to say they were coming, and the day the game first knew of each who
 * writes `soon` (0.2's L1).
 */
export interface Arrivals {
  since: string;
  wrote: Partial<Record<VillagerId, string>>;
  heard: Partial<Record<VillagerId, string>>;
}

/**
 * Where a neighbour is with moving in, on a day: not coming yet (`away`), their letter came today
 * (`coming`), moving in today among their boxes (`moving`), or living here (`settled`), as her
 * first neighbours always have.
 */
export type Moving = 'away' | 'coming' | 'moving' | 'settled';

export function movingOf(villager: VillagerId, day: string, wrote: Arrivals['wrote']): Moving {
  if (!VILLAGERS[villager].newcomer) return 'settled';
  const letter = wrote[villager];
  if (letter === undefined || day < letter) return 'away';
  if (day === letter) return 'coming';
  return day === nextDay(letter) ? 'moving' : 'settled';
}

/** Whether they live in town on a day, moving in or settled. */
export function livesHere(moving: Moving): boolean {
  return moving === 'moving' || moving === 'settled';
}

/** Whether a newcomer writes soon after the game first knows of them, rather than in turn. */
export function writesSoon(villager: VillagerId): boolean {
  return VILLAGERS[villager].newcomer?.soon !== undefined;
}

/**
 * The newcomer who writes on a day, if one is due: first, one who writes `soon` once that many
 * days have gone by since the game first knew of them (0.2's L1); otherwise, a month since the
 * last letter (or her first day), the first in order who is happy to come this month and isn't
 * waiting on anything.
 */
export function dueOn(day: string, arrivals: Arrivals, facts: UnlockFacts): VillagerId | null {
  const soon = NEWCOMER_IDS.find((id) => {
    const heard = arrivals.heard[id];
    if (!writesSoon(id) || heard === undefined || arrivals.wrote[id] !== undefined) return false;
    return daysBetween(heard, day) >= VILLAGERS[id].newcomer!.soon!;
  });
  if (soon) return soon;
  if (!arrivals.since || daysBetween(arrivals.since, day) < NEWCOMER_DAYS) return null;
  const { month } = partsOf(day);
  const due = NEWCOMER_IDS.find((id) => {
    const row = VILLAGERS[id].newcomer!;
    if (writesSoon(id) || arrivals.wrote[id] !== undefined) return false;
    if (row.months && !row.months.includes(month)) return false;
    return !row.after || holds(row.after, facts);
  });
  return due ?? null;
}

/** The letter a newcomer writes to say they're coming, by its id in her mailbox. */
export function newcomerLetterId(villager: VillagerId): string {
  return `${villager}:0`;
}

/** Where a newcomer's house stands: the place, and its footprint on its lot. */
export interface Lot {
  zone: MapZoneId;
  house: PlacedProp;
  /** The inside of it, through its door. */
  inside: InteriorId;
  owner: VillagerId;
}

/** Every newcomer's lot, in every place, whether or not anyone has moved in. */
export const LOTS: readonly Lot[] = ZONE_IDS.flatMap((zone) =>
  (ZONES[zone].map?.lots ?? []).map((lot) => {
    const inside = INTERIOR_IDS.find((id) => INTERIORS[id].building === lot.prop);
    const owner = inside && INTERIORS[inside].owner;
    if (!inside || !owner) throw new Error(`nobody lives in the ${lot.prop} on ${zone}'s lot`);
    const house = { id: lot.prop, tx: lot.tx, ty: lot.ty, ...PROP_FOOTPRINT[lot.prop] };
    return { zone: zone as MapZoneId, house, inside, owner };
  }),
);

/** A newcomer's lot. */
export function lotOf(villager: VillagerId): Lot | undefined {
  return LOTS.find((l) => l.owner === villager);
}

/** The lot a house stands on, by its prop. */
export function lotFor(prop: PropId): Lot | undefined {
  return LOTS.find((l) => l.house.id === prop);
}

/** Where a newcomer stands on moving day: beside their new front door. */
export function unpackingAt(lot: Lot): Tile {
  const step = doorStep(lot.house);
  return { tx: step.tx - 1, ty: step.ty };
}

/** Where their boxes are stacked on moving day: the other side of the door. */
export function boxesAt(lot: Lot): Tile {
  const step = doorStep(lot.house);
  return { tx: step.tx + 1, ty: step.ty };
}
