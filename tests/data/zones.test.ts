import { describe, expect, it } from 'vitest';
import { INTERIOR_IDS, isInterior } from '../../src/data/interiors';
import { ITEMS } from '../../src/data/items';
import { VILLAGERS } from '../../src/data/villagers';
import { ZONE_IDS, ZONES, type Unlock } from '../../src/data/zones';
import { parseMap, walkable, type TileMap } from '../../src/systems/grid';
import { findPath } from '../../src/systems/pathfinding';
import { landingOf, linksBetween } from '../../src/systems/zones';
import { LOTS } from '../../src/systems/newcomers';
import type { MapZoneId, ZoneId } from '../../src/types/ids';

const outdoors = ZONE_IDS.filter((id): id is MapZoneId => ZONES[id].map !== undefined);
const maps = new Map<MapZoneId, TileMap>(outdoors.map((id) => [id, parseMap(ZONES[id].map!)]));
const mapOf = (id: MapZoneId) => maps.get(id)!;

/** Whether one tile can be walked to from another. */
function joined(map: TileMap, from: { tx: number; ty: number }, to: { tx: number; ty: number }) {
  const canWalk = (x: number, y: number) => walkable(map, x, y);
  return findPath(from, to, canWalk, map.width, map.height) !== null;
}

describe('the places', () => {
  it('are every one outdoors but her home and the insides of buildings, which are rooms', () => {
    expect(ZONES.home.map).toBeUndefined();
    expect(outdoors).toEqual(ZONE_IDS.filter((id) => id !== 'home' && !isInterior(id)));
    for (const id of INTERIOR_IDS) expect(ZONES[id].map, id).toBeUndefined();
  });

  it('have ways out along their edges, on open ground', () => {
    for (const id of outdoors) {
      const map = mapOf(id);
      for (const exit of map.exits) {
        const label = `${id} to ${exit.to}`;
        const onEdge =
          exit.tx === 0 ||
          exit.ty === 0 ||
          exit.tx + exit.w === map.width ||
          exit.ty + exit.h === map.height;
        expect(onEdge, label).toBe(true);
        expect(exit.w === 1 || exit.h === 1, label).toBe(true);
        for (let y = exit.ty; y < exit.ty + exit.h; y++) {
          for (let x = exit.tx; x < exit.tx + exit.w; x++) {
            expect(walkable(map, x, y), `${label} ${x},${y}`).toBe(true);
          }
        }
      }
    }
  });

  it('are joined both ways, each way out with one back from the other side', () => {
    for (const id of outdoors) {
      for (const exit of mapOf(id).exits) {
        const to = exit.to as MapZoneId;
        const back = mapOf(to).exits.filter((e) => e.to === id);
        expect(back, `${id} to ${to}`).toHaveLength(1);
        expect(Math.max(back[0]!.w, back[0]!.h), `${id} to ${to}`).toBe(Math.max(exit.w, exit.h));
      }
    }
  });

  it('let her step in on open ground from every way in, and reach all of it from there', () => {
    for (const id of outdoors) {
      const map = mapOf(id);
      expect(walkable(map, map.spawn.tx, map.spawn.ty), `${id} spawn`).toBe(true);
      for (const exit of map.exits) {
        for (let along = 0; along < Math.max(exit.w, exit.h); along++) {
          const { tile } = landingOf(exit, map, along);
          const label = `${id} from ${exit.to} (${along})`;
          expect(walkable(map, tile.tx, tile.ty), label).toBe(true);
          expect(joined(map, map.spawn, tile), label).toBe(true);
        }
      }
      for (let ty = 0; ty < map.height; ty++) {
        for (let tx = 0; tx < map.width; tx++) {
          if (!walkable(map, tx, ty)) continue;
          expect(joined(map, map.spawn, { tx, ty }), `${id} ${tx},${ty}`).toBe(true);
        }
      }
    }
  });

  it('has every door a building in its place: a prop it has, or a house on one of its lots', () => {
    for (const id of outdoors) {
      for (const door of mapOf(id).doors) {
        const standing = mapOf(id).props.some((p) => p.id === door.prop);
        const onLot = LOTS.some((l) => l.zone === id && l.house.id === door.prop);
        expect(standing || onLot, door.prop).toBe(true);
      }
    }
  });

  it('opens by rules that name things that exist, with a hint while shut', () => {
    const check = (rule: Unlock, zone: ZoneId): void => {
      if ('has' in rule) expect(ITEMS[rule.has], zone).toBeDefined();
      if ('with' in rule) expect(VILLAGERS[rule.with], zone).toBeDefined();
      if ('found' in rule) expect(ZONES[rule.found], zone).toBeDefined();
      if ('all' in rule) rule.all.forEach((r) => check(r, zone));
    };
    for (const id of ZONE_IDS) {
      const row = ZONES[id];
      check(row.unlock, id);
      if (!('open' in row.unlock)) {
        expect(row.shut, id).toBeTruthy();
        expect(row.opened, id).toBeTruthy();
      }
    }
  });

  it('puts every place outdoors on the world map, apart and inside it', () => {
    const spots = outdoors.map((id) => ZONES[id].onMap!);
    for (const [i, at] of spots.entries()) {
      expect(at, outdoors[i]).toBeDefined();
      expect(at.x).toBeGreaterThanOrEqual(10);
      expect(at.x).toBeLessThanOrEqual(90);
      expect(at.y).toBeGreaterThanOrEqual(10);
      expect(at.y).toBeLessThanOrEqual(90);
    }
    expect(new Set(spots.map((s) => `${s.x},${s.y}`)).size).toBe(spots.length);
    expect(linksBetween()).toContainEqual(['town', 'whisperwood']);
  });

  it('can all be walked to from the town', () => {
    const seen = new Set<ZoneId>(['town']);
    const queue: ZoneId[] = ['town'];
    while (queue.length > 0) {
      const here = queue.shift()!;
      for (const [a, b] of linksBetween()) {
        const next = a === here ? b : b === here ? a : null;
        if (next && !seen.has(next)) {
          seen.add(next);
          queue.push(next);
        }
      }
    }
    for (const id of outdoors) expect(seen.has(id), id).toBe(true);
  });
});
