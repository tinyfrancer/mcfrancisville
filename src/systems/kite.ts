import { KITE_FIELDS, WINDY_CHANCE, type KitePlace } from '../data/kites';
import { spotIn } from '../data/maps';
import type { MapZoneId, ZoneId } from '../types/ids';
import { shiftDay } from './calendar';
import type { Tile } from './pathfinding';
import { hashMixed } from './random';
import { weatherOn } from './weather';

/*
 * The wind for a kite (1.6's X6, decision 385): dealt from the day key for each windy place, so
 * it's the same all day and the same on every phone; only ever on a clear day. Where a kite goes
 * up is the tiles round each place's named spot.
 */

export const KITE_PLACES = Object.keys(KITE_FIELDS) as KitePlace[];

export function isKitePlace(zone: ZoneId): zone is KitePlace {
  return zone in KITE_FIELDS;
}

/** Whether the wind is up for a kite in a place today. */
export function windyOn(day: string, zone: ZoneId): boolean {
  if (!isKitePlace(zone) || weatherOn(day) !== 'clear') return false;
  return hashMixed(`kite:${day}:${zone}`) % 100 < WINDY_CHANCE[zone];
}

/** The places the wind is up in today, the pier first. */
export function windyPlaces(day: string): KitePlace[] {
  return KITE_PLACES.filter((zone) => windyOn(day, zone));
}

/** The next day from `day` (itself included) the wind is up in a place, within a few weeks. */
export function nextWindy(day: string, zone: KitePlace, within = 60): string | null {
  for (let k = 0; k < within; k++) {
    const d = shiftDay(day, k);
    if (windyOn(d, zone)) return d;
  }
  return null;
}

/** The spot a kite goes up from in a place, or null where there's none. */
export function kiteSpotOf(zone: MapZoneId): Tile | null {
  return isKitePlace(zone) ? spotIn(zone, KITE_FIELDS[zone]) : null;
}

/** Whether a tile is where a kite goes up: the spot, or a tile beside it. */
export function atKiteSpot(zone: MapZoneId, tile: Tile): boolean {
  const spot = kiteSpotOf(zone);
  return spot !== null && Math.abs(tile.tx - spot.tx) <= 1 && Math.abs(tile.ty - spot.ty) <= 1;
}
