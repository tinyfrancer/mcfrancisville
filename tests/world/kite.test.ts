import { describe, expect, it } from 'vitest';
import { KITE_IDS } from '../../src/data/kites';
import { SHOPS } from '../../src/data/shop';
import { dayKey } from '../../src/systems/clock';
import { shiftDay } from '../../src/systems/calendar';
import {
  atKiteSpot,
  kiteSpotOf,
  KITE_PLACES,
  nextWindy,
  windyOn,
  windyPlaces,
} from '../../src/systems/kite';
import { weatherOn } from '../../src/systems/weather';
import type { MapZoneId } from '../../src/types/ids';
import type { WorldEvent } from '../../src/world/World';
import { harness, type Harness } from './harness';

/** Every day of a year from her first. */
const YEAR = Array.from({ length: 365 }, (_, k) => shiftDay('2026-09-26', k));

/** A clock set to noon on a day in a place, she there and stood on its kite spot or `at`. */
function standIn(h: Harness, day: string, zone: MapZoneId, at = kiteSpotOf(zone)!): void {
  const [y, m, d] = day.split('-').map(Number) as [number, number, number];
  h.clock.set(new Date(y, m - 1, d, 12));
  h.world.atlas.find(zone);
  if (h.world.scene !== zone) expect(h.world.travel.go(zone)).toBe(true);
  h.tick(2);
  h.world.movement.standAt(at, 'right');
  h.tick(1);
}

/** A kite in her hand. */
function holdKite(h: Harness, id = KITE_IDS[0]!): void {
  h.world.bag.add(id, 1);
  expect(h.world.hands.hold(id)).toBe(true);
}

/** A tap on herself, and the moments it made. */
function tapHerself(h: Harness): WorldEvent[] {
  const { tx, ty } = h.world.movement.tile;
  h.world.tapTile(tx, ty);
  return h.tick(1);
}

const kiteMoments = (events: WorldEvent[]) => events.filter((e) => e.kind === 'kite');

describe('the wind for a kite', () => {
  it('is dealt from the day, the same every time, and only ever on a clear day', () => {
    for (const day of YEAR) {
      for (const zone of KITE_PLACES) {
        expect(windyOn(day, zone)).toBe(windyOn(day, zone));
        if (weatherOn(day) !== 'clear') expect(windyOn(day, zone), day).toBe(false);
      }
      expect(windyOn(day, 'town')).toBe(false);
      expect(windyOn(day, 'whisperwood')).toBe(false);
    }
  });

  it('is up often enough to fly a kite most weeks, and more often up the castle hill', () => {
    const shore = YEAR.filter((d) => windyOn(d, 'lanternShore')).length;
    const castle = YEAR.filter((d) => windyOn(d, 'castleHill')).length;
    expect(shore).toBeGreaterThan(80);
    expect(castle).toBeGreaterThan(shore);
    // Never a long still spell: a breeze somewhere within a fortnight of any day.
    for (const day of YEAR) {
      expect(
        KITE_PLACES.some((z) => nextWindy(day, z, 14) !== null),
        day,
      ).toBe(true);
    }
    expect(windyPlaces(YEAR[0]!)).toEqual(KITE_PLACES.filter((z) => windyOn(YEAR[0]!, z)));
  });

  it('goes up from the end of the pier and the castle lookout, walkable tiles both', () => {
    const h = harness();
    for (const zone of KITE_PLACES) {
      const spot = kiteSpotOf(zone)!;
      expect(h.world.zones.map(zone).canWalk(spot.tx, spot.ty), zone).toBe(true);
      expect(atKiteSpot(zone, spot)).toBe(true);
      expect(atKiteSpot(zone, { tx: spot.tx + 2, ty: spot.ty })).toBe(false);
    }
    expect(kiteSpotOf('town')).toBeNull();
  });
});

describe('her kite', () => {
  const windy = nextWindy('2026-09-26', 'lanternShore')!;
  const still = YEAR.find((d) => !windyOn(d, 'lanternShore'))!;

  it('is sold at Cobweb Corner, all three every day', () => {
    const shelf = SHOPS.corner.shelves.find((s) => s.name === 'Kites')!;
    expect(shelf.picks[0]!.from).toEqual(KITE_IDS.map((item) => ({ item })));
    expect(shelf.picks[0]!.count).toBe(3);
  });

  it('goes up at the end of the pier on a windy day with a tap on herself, the keepsake once', () => {
    const h = harness();
    standIn(h, windy, 'lanternShore');
    holdKite(h);
    const up = kiteMoments(tapHerself(h));
    expect(up).toEqual([{ kind: 'kite', did: 'up', kite: 'batKite', first: true }]);
    expect(h.world.kite.flying?.kite).toBe('batKite');
    expect(h.world.poses.pose()).toBe('holdUp');
    expect(h.world.bag.count('skyOnAString')).toBe(1);
    // Any tap winds it in, and only that.
    const tile = { ...h.world.movement.tile };
    h.world.tapTile(tile.tx, tile.ty + 3);
    const down = kiteMoments(h.tick(1));
    expect(down).toEqual([{ kind: 'kite', did: 'in', kite: 'batKite' }]);
    expect(h.world.kite.flying).toBeNull();
    expect(h.world.movement.tile).toEqual(tile);
    expect(h.world.poses.pose()).not.toBe('holdUp');
    // Up again: no second keepsake.
    expect(kiteMoments(tapHerself(h))).toEqual([
      { kind: 'kite', did: 'up', kite: 'batKite', first: false },
    ]);
    expect(h.world.bag.count('skyOnAString')).toBe(1);
  });

  it('walks her to the spot to fly it with a tap there, the kite in her hand', () => {
    const h = harness();
    const spot = kiteSpotOf('lanternShore')!;
    standIn(h, windy, 'lanternShore', { tx: spot.tx, ty: spot.ty + 5 });
    holdKite(h, 'mothKite');
    h.world.tapTile(spot.tx, spot.ty);
    const events = h.until(() => !h.world.player.moving, 'walking out along the pier');
    events.push(...h.tick(2));
    expect(kiteMoments(events)).toEqual([
      { kind: 'kite', did: 'up', kite: 'mothKite', first: true },
    ]);
    // Walking off with it: never, a tap only winds it in; going elsewhere takes it down quietly.
    h.world.travel.go('town');
    h.tick(2);
    expect(h.world.kite.flying).toBeNull();
  });

  it('stays down on a still day and anywhere else, saying so, and with no kite in her hand', () => {
    const h = harness();
    standIn(h, still, 'lanternShore');
    expect(kiteMoments(tapHerself(h))).toEqual([]);
    holdKite(h, 'ghostKite');
    expect(kiteMoments(tapHerself(h))).toEqual([{ kind: 'kite', did: 'still' }]);
    expect(h.world.kite.flying).toBeNull();
    standIn(h, windy, 'lanternShore', { tx: 3, ty: 6 });
    expect(kiteMoments(tapHerself(h))).toEqual([{ kind: 'kite', did: 'nowhere' }]);
    expect(h.world.bag.count('skyOnAString')).toBe(0);
  });

  it('comes down when she puts it away', () => {
    const h = harness();
    standIn(h, windy, 'lanternShore');
    holdKite(h);
    tapHerself(h);
    expect(h.world.kite.flying).not.toBeNull();
    h.world.hands.hold('hands');
    h.tick(1);
    expect(h.world.kite.flying).toBeNull();
  });

  it('is told on Today on a windy day', () => {
    const h = harness();
    standIn(h, windy, 'lanternShore');
    expect(dayKey(h.clock.now())).toBe(windy);
    const line = h.world.upNow.lines().find((l) => l.kind === 'kite');
    expect(line && 'zone' in line ? line.zone : null).toBe('lanternShore');
    standIn(h, still, 'lanternShore');
    const calm = windyPlaces(still).length === 0;
    expect(h.world.upNow.lines().some((l) => l.kind === 'kite')).toBe(!calm);
  });
});
