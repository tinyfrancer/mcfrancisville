import { RAINBOW_HOURS, RAINBOW_MS, SNOWMAN_IDS } from '../data/snow';
import type { FurnitureId, SnowmanId, TileId } from '../types/ids';
import { shiftDay } from './calendar';
import { hashMixed } from './random';
import { snowLies } from './seasons';
import { weatherOn } from './weather';

/*
 * Snow days and the rainbow (1.6's X4, decision 383), worked out from the day key and the tile,
 * so nothing about them is saved: the snowman she stands in her yard is a yard piece like any.
 */

/** What lies under the snow, deep enough to roll and to leave a footprint in: the lawn and meadows. */
const SNOWY: ReadonlySet<TileId | undefined> = new Set<TileId>(['grass', 'meadow', 'longGrass']);

/** Whether a tile has snow on it to play in, on a day: the lawn in winter, never a path or ice. */
export function snowyOn(day: string, tile: TileId | undefined): boolean {
  return snowLies(day) && SNOWY.has(tile);
}

/** Which hat a snowman rolled on a tile wears: dealt by the tile, so the same spot, the same hat. */
export function hatOf(tx: number, ty: number): SnowmanId {
  return SNOWMAN_IDS[hashMixed(`snowman:${tx},${ty}`) % SNOWMAN_IDS.length]!;
}

export function isSnowman(id: FurnitureId): id is SnowmanId {
  return (SNOWMAN_IDS as readonly FurnitureId[]).includes(id);
}

/**
 * Whether her snowmen thaw today: any day snow doesn't lie, the first of which she opens the game
 * on sweeping them in (nothing of the snow is saved, so it's the first day out of winter she plays).
 */
export function thawsOn(day: string): boolean {
  return !snowLies(day);
}

/**
 * Whether a day is one for a rainbow (decision 383): a sunny day after a rainy one. Rain comes a
 * day at a time (decision 107), so it stops as the day turns; snow isn't rain, so not in winter.
 */
export function rainbowDay(day: string): boolean {
  const before = shiftDay(day, -1);
  return weatherOn(day) === 'clear' && weatherOn(before) === 'rain' && !snowLies(before);
}

/** Whether the sun is up for a rainbow at an hour. */
export function rainbowHour(hour: number): boolean {
  return hour >= RAINBOW_HOURS[0] && hour < RAINBOW_HOURS[1];
}

/**
 * How far through its ten minutes a rainbow is, `since` ms after she was first out under it: 0 to
 * 1, or null once it has gone.
 */
export function rainbowAt(since: number): number | null {
  return since >= 0 && since < RAINBOW_MS ? since / RAINBOW_MS : null;
}
