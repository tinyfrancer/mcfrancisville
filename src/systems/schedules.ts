import { HAPPENINGS } from '../data/happenings';
import { INTERIORS } from '../data/interiors';
import { spotIn, spotOf } from '../data/maps';
import { PARTY_SPOTS } from '../data/specialDays';
import { VILLAGER_IDS, VILLAGERS, type Stop } from '../data/villagers';
import { DAY_WINDOWS, type DayWindow } from '../data/windows';
import type { VillagerId, ZoneId } from '../types/ids';
import { partsOf } from './calendar';
import { specialDayOf } from './friendship';
import { happeningOf, placeAt } from './happenings';
import type { Tile } from './pathfinding';
import { hashString } from './random';

/**
 * Where her neighbours are (phase S), worked out from the hour and the day key alone: the day's
 * schedule, weekday or weekend, with visits to each other and to her dealt over it, and everyone
 * at her party on her birthday. Nothing about it is saved.
 */

/** A tile in a place, outdoors or in, where a villager is to be found. */
export interface Place extends Tile {
  zone: ZoneId;
}

/** Saturday and Sunday, by the day key, so a Friday night up past midnight is still Friday's. */
export function isWeekend(day: string): boolean {
  const { weekday } = partsOf(day);
  return weekday === 0 || weekday === 6;
}

/** A villager's stops on a day. */
export function scheduleOn(villager: VillagerId, day: string): readonly Stop[] {
  const { schedule } = VILLAGERS[villager];
  return isWeekend(day) ? schedule.weekend : schedule.weekday;
}

/** Where a stop in a schedule is, as a place and a tile. */
export function stopAt(stop: Stop): Place {
  if ('inside' in stop)
    return { zone: stop.inside, ...INTERIORS[stop.inside].stands[stop.stand ?? 0]! };
  const zone = stop.zone ?? 'town';
  return { zone, ...spotIn(zone, stop.at) };
}

/**
 * Where a villager's schedule has them on the hour `hour` of `day`: at the stop whose block it
 * falls in, the last one running on past midnight. On her birthday everyone is at the party around
 * the well instead.
 */
export function stopOf(villager: VillagerId, hour: number, day: string): Place {
  if (specialDayOf(day) === 'birthday') {
    return { zone: 'town', ...spotOf('town', PARTY_SPOTS[villager]) };
  }
  const schedule = scheduleOn(villager, day);
  let stop = schedule[schedule.length - 1]!;
  for (const s of schedule) if (s.from <= hour) stop = s;
  return stopAt(stop);
}

/** Who calls on whom, and for which hours: a neighbour, or her at home. */
export interface Visit {
  guest: VillagerId;
  host: VillagerId | 'her';
  from: number;
  until: number;
}

/** The hours in each window when a visit is paid: never at noon, nor across midnight. */
export const VISIT_HOURS: Record<DayWindow, readonly [from: number, until: number]> = {
  morning: [9, 11],
  afternoon: [14, 17],
  evening: [19, 22],
};

let dealt: { key: string; visits: readonly Visit[] } | null = null;

/**
 * The visits paid on a day among those settled in town (`callers`, phase T: not a newcomer still
 * to come or on their moving day). In about two windows in three one neighbour calls on another,
 * and every day, in one window, someone pops round to hers. Nobody is a guest and a host at once.
 * None on her birthday, when everyone is at the party.
 */
export function visitsOn(day: string, callers: readonly VillagerId[]): readonly Visit[] {
  const key = `${day}|${callers.join()}`;
  if (dealt?.key === key) return dealt.visits;
  const visits: Visit[] = [];
  if (specialDayOf(day) !== 'birthday') {
    const hers = DAY_WINDOWS[hashString(`callsOn:${day}`) % DAY_WINDOWS.length];
    for (const window of DAY_WINDOWS) {
      const [from, until] = VISIT_HOURS[window];
      const h = hashString(`visits:${day}:${window}`);
      const busy: VillagerId[] = [];
      if (h % 3 !== 0 && callers.length > 1) {
        const guest = callers[(h >>> 4) % callers.length]!;
        const others = callers.filter((v) => v !== guest);
        const host = others[(h >>> 12) % others.length]!;
        visits.push({ guest, host, from, until });
        busy.push(guest, host);
      }
      if (window === hers) {
        const free = callers.filter((v) => !busy.includes(v));
        const guest = free[hashString(`callsOn:${day}:guest`) % free.length];
        if (guest) visits.push({ guest, host: 'her', from, until });
      }
    }
  }
  dealt = { key, visits };
  return visits;
}

/** The visit a villager is paying at an hour of a day, if they're out visiting. */
export function visitOf(
  villager: VillagerId,
  hour: number,
  day: string,
  callers: readonly VillagerId[],
): Visit | null {
  const visits = visitsOn(day, callers);
  return visits.find((v) => v.guest === villager && v.from <= hour && hour < v.until) ?? null;
}

/**
 * Where a villager is: at their stop or a happening, or a guest beside whoever they're with (`beside`
 * is where the host stands), or at her home just inside the door (`beside` null, since her room
 * changes shape). Her birthday party comes first, then her neighbours' own happenings, then
 * visits, then the day's schedule.
 */
export type Whereabouts =
  { zone: ZoneId; tile: Tile } | { zone: ZoneId; beside: Tile | null; host: VillagerId | 'her' };

export function whereabouts(
  villager: VillagerId,
  hour: number,
  day: string,
  callers: readonly VillagerId[],
): Whereabouts {
  const happening = partying(day) ? null : happeningOf(villager, hour, day);
  if (happening) {
    const { place, beside } = placeAt(happening, villager);
    const { zone, ...tile } = place;
    return beside ? { zone, beside: tile, host: HAPPENINGS[happening].who[0]! } : { zone, tile };
  }
  const visit = visitOf(villager, hour, day, callers);
  if (visit?.host === 'her') return { zone: 'home', beside: null, host: 'her' };
  if (visit) {
    const { zone, ...tile } = standingOf(visit.host, hour, day);
    return { zone, beside: tile, host: visit.host };
  }
  const { zone, ...tile } = stopOf(villager, hour, day);
  return { zone, tile };
}

function partying(day: string): boolean {
  return specialDayOf(day) === 'birthday';
}

/** Where a host is to be found: at a happening's place, or their stop. */
function standingOf(villager: VillagerId, hour: number, day: string): Place {
  const happening = partying(day) ? null : happeningOf(villager, hour, day);
  return happening ? placeAt(happening, villager).place : stopOf(villager, hour, day);
}

/** Every stop any villager keeps, weekday or weekend, in the place given. */
export function stopsIn(zone: ZoneId): Tile[] {
  return VILLAGER_IDS.flatMap((id) => [
    ...VILLAGERS[id].schedule.weekday,
    ...VILLAGERS[id].schedule.weekend,
  ])
    .map(stopAt)
    .filter((s) => s.zone === zone);
}
