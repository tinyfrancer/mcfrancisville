import { CALENDAR } from '../data/calendar';
import {
  PASSER_IDS,
  PASSERS,
  RARE_EVENT_IDS,
  RARE_EVENTS,
  RARE_ONE_IN,
  STALL_WEEKS_IN,
  STRAYS,
  WANDERING_STALL_AT,
  type PasserId,
  type RareEventId,
  type StrayRow,
} from '../data/rareEvents';
import { ZONES } from '../data/zones';
import type { ItemId, MapZoneId } from '../types/ids';
import { fallsOn, festivalsOn, happeningOn, partsOf, shiftDay, weekOf } from './calendar';
import { moundSpot } from './fossils';
import { hourOfNight } from './happenings';
import type { Tile } from './pathfinding';
import { hashMixed } from './random';
import { weatherOn } from './weather';

/*
 * Rare events (V1's R3): which one a day has, if any, from the day key alone, so every phone
 * agrees and nothing is saved; who passes through; and where a stray critter has wandered to.
 */

/** A day that's a holiday or one of her own: those are special enough, and keep their own. */
function isSpoken(day: string): boolean {
  return happeningOn(day).some((id) => {
    const { kind } = CALENDAR[id];
    return kind === 'holiday' || kind === 'special';
  });
}

/** The days of the week a day key is in, Monday first. */
function weekDays(day: string): string[] {
  const monday = weekOf(day);
  return Array.from({ length: 7 }, (_, k) => shiftDay(monday, k));
}

/**
 * Whether the wandering stall is in town the week a day is in: one week in `STALL_WEEKS_IN`,
 * never one a festival falls in (its shelf and the festival's would crowd each other).
 */
export function isStallWeek(day: string): boolean {
  if (!stallDealt(weekOf(day))) return false;
  // It never comes two weeks running: the road takes it somewhere else first.
  if (stallDealt(shiftDay(weekOf(day), -7))) return false;
  return weekDays(day).every((d) => festivalsOn(d).length === 0);
}

const stallDealt = (monday: string) => hashMixed(`wanderingStall:${monday}`) % STALL_WEEKS_IN === 0;

/** Whether a day's event can come on a day: its months, and a clear sky if it wants one. */
function fits(id: RareEventId, day: string): boolean {
  const row = RARE_EVENTS[id];
  if (row.week) return false;
  if (row.months && !row.months.includes(partsOf(day).month)) return false;
  return !row.clear || weatherOn(day) === 'clear';
}

/**
 * The rare event on a day, if there is one: the wandering stall all its week, or about one other
 * day in `RARE_ONE_IN` one of the rest that fits it, never on a holiday, her days or a festival's,
 * and never two at once. On a winter day's roll, a snow day comes first half the time.
 */
export function rareEventOn(day: string): RareEventId | null {
  // Asked every frame by the view and every step by the world, so the last few days are kept.
  const known = dealt.get(day);
  if (known !== undefined) return known;
  const id = deal(day);
  if (dealt.size > 64) dealt.clear();
  dealt.set(day, id);
  return id;
}

const dealt = new Map<string, RareEventId | null>();

function deal(day: string): RareEventId | null {
  if (isStallWeek(day)) return 'wanderingStall';
  if (isSpoken(day) || festivalsOn(day).length > 0) return null;
  const roll = hashMixed(`rare:${day}`);
  if (roll % RARE_ONE_IN !== 0) return null;
  const fitting = RARE_EVENT_IDS.filter((id) => fits(id, day));
  if (fitting.includes('snowDay') && (roll >>> 8) % 2 === 0) return 'snowDay';
  return fitting[(roll >>> 12) % fitting.length] ?? null;
}

/** The first day of the rare event on a day: the stall's Monday, or the day itself. */
export function rareEventBegan(day: string): string {
  return rareEventOn(day) === 'wanderingStall' ? weekOf(day) : day;
}

/** Whether a rare event's sky is over the world at an hour: shooting stars, or snow all day. */
export function rareSkyAt(day: string, hour: number): 'meteors' | 'snow' | null {
  const rare = rareEventOn(day);
  if (rare === 'snowDay') return 'snow';
  if (rare !== 'meteorShower') return null;
  const h = hourOfNight(hour);
  return h >= METEORS_FROM && h < METEORS_UNTIL ? 'meteors' : null;
}

/** The hours of a meteor shower's night: from eight until four in the morning. */
export const METEORS_FROM = 20;
export const METEORS_UNTIL = 28;

// ---- Who passes through ----

/** Whether a visitor is staying on a day, by their span of the year. */
export function isStaying(id: PasserId, day: string): boolean {
  const { when } = PASSERS[id];
  return when !== undefined && fallsOn(when, day);
}

/** Whether a day is the first of a visitor's stay. */
export function arrivesOn(id: PasserId, day: string): boolean {
  return isStaying(id, day) && !isStaying(id, shiftDay(day, -1));
}

/** Who is passing through on a day: the wayfarer on the stranger's day, and any visitor staying. */
export function passersOn(day: string): PasserId[] {
  return PASSER_IDS.filter((id) =>
    PASSERS[id].when ? isStaying(id, day) : id === 'wayfarer' && rareEventOn(day) === 'stranger',
  );
}

/** Someone passing through, where they stand today. */
export interface Passing extends Tile {
  id: PasserId;
  zone: MapZoneId;
}

/** Who is about at an hour of a day, and where each stands. */
export function passersAt(day: string, hour: number): Passing[] {
  return passersOn(day).flatMap((id) => {
    const row = PASSERS[id];
    const h = hourOfNight(hour);
    if (h < row.from || h >= row.until) return [];
    const at = row.at[hashMixed(`passer:${id}:${day}`) % row.at.length]!;
    return [{ id, zone: row.zone, tx: at.tx, ty: at.ty }];
  });
}

/** What a passer-by says the first time she talks to them on a day, and what they hand her. */
export function helloOf(id: PasserId, day: string): { line: string; gift: ItemId } {
  const row = PASSERS[id];
  const h = hashMixed(`hello:${id}:${day}`);
  return { line: row.hello[h % row.hello.length]!, gift: row.gifts[(h >>> 8) % row.gifts.length]! };
}

// ---- A critter gone astray ----

/** The critter gone astray on a day, and where it waits: on a dig spot clear of today's mound. */
export function strayOn(day: string): (StrayRow & Tile) | null {
  if (rareEventOn(day) !== 'lostCritter') return null;
  const h = hashMixed(`stray:${day}`);
  const stray = STRAYS[h % STRAYS.length]!;
  const spots = ZONES[stray.zone].map?.digSpots ?? [];
  const mound = moundSpot(stray.zone, spots, day);
  const open = spots.filter((t) => t.tx !== mound?.tx || t.ty !== mound.ty);
  const at = open[(h >>> 8) % open.length];
  return at ? { ...stray, tx: at.tx, ty: at.ty } : null;
}

/** Where the wandering stall stands, while it's in town. */
export function wanderingStallOn(day: string): Tile | null {
  return rareEventOn(day) === 'wanderingStall' ? WANDERING_STALL_AT : null;
}
