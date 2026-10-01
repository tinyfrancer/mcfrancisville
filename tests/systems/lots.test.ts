import { describe, expect, it } from 'vitest';
import { PROP_FOOTPRINT, doorStep, spotOf } from '../../src/data/maps';
import { PARTY_SPOTS } from '../../src/data/specialDays';
import { VILLAGER_IDS, VILLAGERS } from '../../src/data/villagers';
import { ZONES } from '../../src/data/zones';
import { letterOf } from '../../src/systems/friendship';
import { parseMap, walkable, type PlacedProp, type TileMap } from '../../src/systems/grid';
import { LOTS, lotOf } from '../../src/systems/lots';
import { findPath, type Tile } from '../../src/systems/pathfinding';
import { stopAt } from '../../src/systems/schedules';
import { exitAt } from '../../src/systems/zones';
import type { MapZoneId, VillagerId } from '../../src/types/ids';
import { covers } from '../../src/world/zones/Zone';

/** Who came later (phase T), on lots of their own. */
const LATER: readonly VillagerId[] = ['ollie', 'nessa', 'gourdon', 'hazel', 'boothoven'];

describe('the neighbours who came later', () => {
  it('keep the letters they wrote before moving in, for a mailbox that has one', () => {
    for (const id of LATER) {
      const letter = letterOf(`${id}:0`);
      expect(letter?.from, id).toBe(id);
      expect(letter?.text, id).toBe(VILLAGERS[id].wrote);
    }
    expect(letterOf('maude:0')).toBeNull();
  });
});

describe('their lots', () => {
  const maps = new Map<MapZoneId, TileMap>();
  const mapOf = (zone: MapZoneId) => {
    if (!maps.has(zone)) maps.set(zone, parseMap(ZONES[zone].map!));
    return maps.get(zone)!;
  };
  /** The houses standing on a place's lots. */
  const standing = (zone: MapZoneId): PlacedProp[] =>
    LOTS.filter((l) => l.zone === zone).map((l) => l.house);
  const open = (zone: MapZoneId) => (x: number, y: number) =>
    walkable(mapOf(zone), x, y) && !standing(zone).some((p) => covers(p, x, y));

  it('are one each for those who came later, and nobody else', () => {
    expect(LOTS.map((l) => l.owner).sort()).toEqual([...LATER].sort());
    for (const id of LATER) expect(lotOf(id)?.inside, id).toBeDefined();
  });

  it('lie on open ground, clear of everything that stands, comes or goes', () => {
    for (const lot of LOTS) {
      const map = mapOf(lot.zone);
      const { house } = lot;
      const lotTiles: Tile[] = [...standing(lot.zone)].flatMap((p) =>
        Array.from({ length: p.w * p.h }, (_, i) => ({
          tx: p.tx + (i % p.w),
          ty: p.ty + Math.floor(i / p.w),
        })),
      );
      for (const t of lotTiles) {
        const at = `${lot.owner} ${t.tx},${t.ty}`;
        expect(walkable(map, t.tx, t.ty), at).toBe(true);
        expect(
          map.patches.some((p) => p.tx === t.tx && p.ty === t.ty),
          at,
        ).toBe(false);
        expect(
          map.snackSpots.some((p) => p.tx === t.tx && p.ty === t.ty),
          at,
        ).toBe(false);
        expect(exitAt(map.exits, t), at).toBeUndefined();
        for (const lotUp of map.popUpLots) {
          expect(
            covers({ id: 'popUpShop', ...lotUp, ...PROP_FOOTPRINT.popUpShop }, t.tx, t.ty),
            at,
          ).toBe(false);
        }
        for (const spot of map.peddlerSpots) {
          expect(
            covers({ id: 'moonPieCart', ...spot, ...PROP_FOOTPRINT.moonPieCart }, t.tx, t.ty),
            at,
          ).toBe(false);
        }
      }
      expect(PROP_FOOTPRINT[house.id].door, lot.owner).toBeDefined();
    }
  });

  it('keep a way to the door, and everywhere else in reach, with the houses up', () => {
    for (const lot of LOTS) {
      const map = mapOf(lot.zone);
      const canWalk = open(lot.zone);
      const t = doorStep(lot.house);
      expect(canWalk(t.tx, t.ty), `${lot.owner} ${t.tx},${t.ty}`).toBe(true);
      expect(findPath(map.spawn, t, canWalk, map.width, map.height), lot.owner).not.toBeNull();
      // Nothing that could be reached before is cut off by a house going up.
      const before = reach(map, (x, y) => walkable(map, x, y));
      const after = reach(map, canWalk);
      const cut = [...before]
        .filter((i) => canWalk(i % map.width, Math.floor(i / map.width)) && !after.has(i))
        .map((i) => `${lot.zone} ${i % map.width},${Math.floor(i / map.width)}`);
      expect(cut).toEqual([]);
    }
  });

  it('are never where anyone stands, at any stop or at the party', () => {
    const stops = VILLAGER_IDS.flatMap((id: VillagerId) => [
      ...VILLAGERS[id].schedule.weekday,
      ...VILLAGERS[id].schedule.weekend,
    ]).map(stopAt);
    const party = Object.values(PARTY_SPOTS).map((name) => ({
      zone: 'town',
      ...spotOf('town', name),
    }));
    for (const lot of LOTS) {
      for (const s of [...stops, ...party]) {
        if (s.zone !== lot.zone) continue;
        for (const p of standing(lot.zone))
          expect(covers(p, s.tx, s.ty), `${lot.owner} ${s.tx},${s.ty}`).toBe(false);
      }
    }
  });
});

/**
 * Every tile reachable from the spawn, by index. A path steps eight ways but a diagonal needs both
 * tiles beside it open (`findPath`), so what it reaches is what four ways reach: one flood fill
 * rather than a search to every tile, which ran close to the test's time limit under coverage.
 */
function reach(map: TileMap, canWalk: (tx: number, ty: number) => boolean): Set<number> {
  const seen = new Set<number>([map.spawn.ty * map.width + map.spawn.tx]);
  const queue: Tile[] = [map.spawn];
  for (let next = queue.shift(); next; next = queue.shift()) {
    for (const [dx, dy] of [
      [1, 0],
      [-1, 0],
      [0, 1],
      [0, -1],
    ] as const) {
      const tx = next.tx + dx;
      const ty = next.ty + dy;
      const i = ty * map.width + tx;
      if (tx < 0 || ty < 0 || tx >= map.width || ty >= map.height || seen.has(i)) continue;
      if (!canWalk(tx, ty)) continue;
      seen.add(i);
      queue.push({ tx, ty });
    }
  }
  return seen;
}
