import { describe, expect, it } from 'vitest';
import { PROP_FOOTPRINT, doorStep, spotOf } from '../../src/data/maps';
import { PARTY_SPOTS } from '../../src/data/specialDays';
import { VILLAGER_IDS, VILLAGERS } from '../../src/data/villagers';
import { ZONES } from '../../src/data/zones';
import { letterOf } from '../../src/systems/friendship';
import { parseMap, walkable, type PlacedProp, type TileMap } from '../../src/systems/grid';
import {
  boxesAt,
  dueOn,
  FIRST_NEIGHBOURS,
  LOTS,
  lotOf,
  movingOf,
  NEWCOMER_DAYS,
  NEWCOMER_IDS,
  newcomerLetterId,
  unpackingAt,
  type Arrivals,
} from '../../src/systems/newcomers';
import { findPath, type Tile } from '../../src/systems/pathfinding';
import { stopAt } from '../../src/systems/schedules';
import { exitAt, type UnlockFacts } from '../../src/systems/zones';
import type { MapZoneId, VillagerId } from '../../src/types/ids';
import { covers } from '../../src/world/zones/Zone';

/** Facts where nothing has happened yet: no places found, no friends made. */
const nothing: UnlockFacts = {
  has: () => false,
  hearts: () => 0,
  found: () => false,
  caughtKinds: () => 0,
};
const everything: UnlockFacts = {
  has: () => true,
  hearts: () => 10,
  found: () => true,
  caughtKinds: () => 99,
};
const since = (day: string, wrote: Arrivals['wrote'] = {}): Arrivals => ({ since: day, wrote });

describe('newcomers', () => {
  it('are four, each moving in after her first neighbours, with a letter to say so', () => {
    expect(NEWCOMER_IDS).toEqual(['ollie', 'nessa', 'gourdon', 'hazel']);
    expect(FIRST_NEIGHBOURS).toEqual(['maude', 'rufus', 'wrapunzel', 'agatha', 'barty', 'cody']);
    for (const id of NEWCOMER_IDS) {
      const letter = letterOf(newcomerLetterId(id));
      expect(letter?.from, id).toBe(id);
      expect(letter?.text, id).toBe(VILLAGERS[id].newcomer!.letter);
    }
    expect(letterOf('maude:0')).toBeNull();
  });

  it('are away till their letter, coming that day, moving in the next, and settled after', () => {
    const wrote = { ollie: '2026-10-30' };
    expect(movingOf('ollie', '2026-10-29', wrote)).toBe('away');
    expect(movingOf('ollie', '2026-10-30', wrote)).toBe('coming');
    expect(movingOf('ollie', '2026-10-31', wrote)).toBe('moving');
    expect(movingOf('ollie', '2026-11-01', wrote)).toBe('settled');
    expect(movingOf('nessa', '2027-01-01', wrote)).toBe('away');
    expect(movingOf('maude', '2026-01-01', {})).toBe('settled');
  });

  it('write a month apart at most, the first a month after her first day', () => {
    expect(dueOn('2026-10-25', since('2026-09-26'), everything)).toBeNull();
    expect(dueOn('2026-10-26', since('2026-09-26'), everything)).toBe('ollie');
    const one = since('2026-10-26', { ollie: '2026-10-26' });
    expect(dueOn('2026-11-24', one, everything)).toBeNull();
    expect(dueOn(`2026-11-25`, one, everything)).toBe('nessa');
    expect(NEWCOMER_DAYS).toBe(30);
  });

  it('wait on what they wait for, and let the next in line come first', () => {
    const one = since('2026-10-01', { ollie: '2026-10-01' });
    // Nessa waits for Lantern Shore to be found, and Hazel for Maude's friendship; in November
    // Gourdon doesn't mind coming first.
    expect(dueOn('2026-11-15', one, nothing)).toBe('gourdon');
    expect(dueOn('2026-11-15', one, { ...nothing, found: (z) => z === 'lanternShore' })).toBe(
      'nessa',
    );
    // In December nobody who's waiting will come, and Gourdon waits for the autumn.
    expect(dueOn('2026-12-15', one, nothing)).toBeNull();
    expect(dueOn('2026-12-15', one, { ...nothing, hearts: (v) => (v === 'maude' ? 3 : 0) })).toBe(
      'hazel',
    );
    const all = since('2027-01-01', {
      ollie: '2026-10-01',
      nessa: '2026-11-01',
      gourdon: '2026-12-01',
      hazel: '2027-01-01',
    });
    expect(dueOn('2028-01-01', all, everything)).toBeNull();
  });
});

describe('their lots', () => {
  const maps = new Map<MapZoneId, TileMap>();
  const mapOf = (zone: MapZoneId) => {
    if (!maps.has(zone)) maps.set(zone, parseMap(ZONES[zone].map!));
    return maps.get(zone)!;
  };
  /** Everything a lot can have on it once its owner moves in. */
  const standing = (zone: MapZoneId): PlacedProp[] =>
    LOTS.filter((l) => l.zone === zone).flatMap((l) => [
      l.house,
      { id: 'movingBoxes', ...boxesAt(l), w: 1, h: 1 },
    ]);
  const open = (zone: MapZoneId) => (x: number, y: number) =>
    walkable(mapOf(zone), x, y) && !standing(zone).some((p) => covers(p, x, y));

  it('give every newcomer one, and nobody else', () => {
    expect(LOTS.map((l) => l.owner).sort()).toEqual([...NEWCOMER_IDS].sort());
    for (const id of NEWCOMER_IDS) expect(lotOf(id)?.inside, id).toBeDefined();
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

  it('keep a way to the door, a place to unpack, and everywhere else in reach, with the houses up', () => {
    for (const lot of LOTS) {
      const map = mapOf(lot.zone);
      const canWalk = open(lot.zone);
      for (const t of [doorStep(lot.house), unpackingAt(lot)]) {
        expect(canWalk(t.tx, t.ty), `${lot.owner} ${t.tx},${t.ty}`).toBe(true);
        expect(findPath(map.spawn, t, canWalk, map.width, map.height), lot.owner).not.toBeNull();
      }
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
      const taken = [
        ...standing(lot.zone),
        { id: 'lotSign' as const, ...doorStep(lot.house), w: 1, h: 1 },
      ];
      for (const s of [...stops, ...party]) {
        if (s.zone !== lot.zone) continue;
        for (const p of taken)
          expect(covers(p, s.tx, s.ty), `${lot.owner} ${s.tx},${s.ty}`).toBe(false);
        const u = unpackingAt(lot);
        expect(s.tx === u.tx && s.ty === u.ty, `${lot.owner} unpacks at a stop`).toBe(false);
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
