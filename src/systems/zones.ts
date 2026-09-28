import { ZONES, type Unlock } from '../data/zones';
import type { Facing, ItemId, MapZoneId, VillagerId, ZoneId } from '../types/ids';
import type { MapExit } from './grid';
import type { Tile } from './pathfinding';

/** What an unlock rule reads of her world. */
export interface UnlockFacts {
  has(item: ItemId): boolean;
  hearts(villager: VillagerId): number;
  found(zone: ZoneId): boolean;
  /** How many kinds of critter she has ever caught. */
  caughtKinds(): number;
}

/** Whether a rule holds now. */
export function holds(rule: Unlock, facts: UnlockFacts): boolean {
  if ('open' in rule) return true;
  if ('has' in rule) return facts.has(rule.has);
  if ('hearts' in rule) return facts.hearts(rule.with) >= rule.hearts;
  if ('found' in rule) return facts.found(rule.found);
  if ('caught' in rule) return facts.caughtKinds() >= rule.caught;
  return rule.all.every((r) => holds(r, facts));
}

/** Whether a place is open from the first day, with nothing to wait for. */
export function openFromStart(zone: ZoneId): boolean {
  return 'open' in ZONES[zone].unlock;
}

/** The exit whose tiles include `t`, if any. */
export function exitAt(exits: readonly MapExit[], t: Tile): MapExit | undefined {
  return exits.find((e) => t.tx >= e.tx && t.tx < e.tx + e.w && t.ty >= e.ty && t.ty < e.ty + e.h);
}

/**
 * Where she steps in through an exit: the tile just inside the edge, level with where she left the
 * other side (`along`, how far along its run she was), facing into the map.
 */
export function landingOf(
  exit: MapExit,
  size: { width: number; height: number },
  along: number,
): { tile: Tile; facing: Facing } {
  const across = exit.w >= exit.h;
  const run = across ? exit.w : exit.h;
  const step = Math.min(Math.max(0, Math.round(along)), run - 1);
  const tx = across ? exit.tx + step : exit.tx;
  const ty = across ? exit.ty : exit.ty + step;
  if (tx === 0) return { tile: { tx: 1, ty }, facing: 'right' };
  if (tx === size.width - 1) return { tile: { tx: tx - 1, ty }, facing: 'left' };
  if (ty === 0) return { tile: { tx, ty: 1 }, facing: 'down' };
  return { tile: { tx, ty: ty - 1 }, facing: 'up' };
}

/**
 * Where a way out's gate hangs: across the tiles just inside it, where she steps in, so it stands
 * in the map rather than on its very edge.
 */
export function gateOf(
  exit: MapExit,
  size: { width: number; height: number },
): { tx: number; ty: number; w: number; h: number } {
  const across = exit.w >= exit.h;
  const first = landingOf(exit, size, 0).tile;
  return across
    ? { tx: first.tx, ty: first.ty, w: exit.w, h: 1 }
    : { tx: first.tx, ty: first.ty, w: 1, h: exit.h };
}

/** How far along its run a tile is on an exit. */
export function alongExit(exit: MapExit, t: Tile): number {
  return exit.w >= exit.h ? t.tx - exit.tx : t.ty - exit.ty;
}

/**
 * The place outdoors a zone is in: itself for a place outdoors, and for her home or a building's
 * inside, the place whose door leads to it.
 */
export function outsideOf(zone: ZoneId): MapZoneId {
  if (ZONES[zone].map) return zone as MapZoneId;
  for (const id of Object.keys(ZONES) as ZoneId[]) {
    if (ZONES[id].map?.doors?.some((d) => d.to === zone)) return id as MapZoneId;
  }
  return 'town';
}

/** Each place's neighbours: the zones its exits and doors lead to. */
function linksOf(zone: ZoneId): ZoneId[] {
  const map = ZONES[zone].map;
  if (!map) return [outsideOf(zone)];
  return [...(map.exits ?? []).map((e) => e.to), ...(map.doors ?? []).map((d) => d.to)];
}

/** The places joined to each place, for the world map to draw its paths. */
export function linksBetween(): [ZoneId, ZoneId][] {
  const pairs: [ZoneId, ZoneId][] = [];
  for (const zone of Object.keys(ZONES) as ZoneId[]) {
    for (const to of linksOf(zone)) {
      if (zone < to && linksOf(to).includes(zone)) pairs.push([zone, to]);
    }
  }
  return pairs;
}

/**
 * The next zone on the way from one place to another, going through as few as can be. Null if
 * they're the same place, or there's no way there.
 */
export function nextZoneToward(from: ZoneId, to: ZoneId): ZoneId | null {
  if (from === to) return null;
  const cameFrom = new Map<ZoneId, ZoneId>([[from, from]]);
  const queue: ZoneId[] = [from];
  while (queue.length > 0) {
    const here = queue.shift()!;
    for (const next of linksOf(here)) {
      if (cameFrom.has(next)) continue;
      cameFrom.set(next, here);
      if (next === to) {
        let step: ZoneId = next;
        while (cameFrom.get(step) !== from) step = cameFrom.get(step)!;
        return step;
      }
      queue.push(next);
    }
  }
  return null;
}
