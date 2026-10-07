import { describe, expect, it } from 'vitest';
import { TILE_SIZE } from '../../src/config/world';
import { doorStep, TOWN } from '../../src/data/maps';
import { PROP_SEATS } from '../../src/data/seats';
import { VILLAGER_IDS, VILLAGERS, type Stop } from '../../src/data/villagers';
import { WORKS } from '../../src/data/work';
import { dayKey, hourOf } from '../../src/systems/clock';
import { GONE_TILES, NEAR_TILES, stopNow } from '../../src/systems/neighbourLife';
import { stopAt, visitsOn, type Place } from '../../src/systems/schedules';
import { happeningsAt } from '../../src/systems/happenings';
import { specialDayOf } from '../../src/systems/friendship';
import type { VillagerId } from '../../src/types/ids';
import { tileOf } from '../../src/world/World';
import { harness, type Harness } from './harness';

const reach = (a: { tx: number; ty: number }, b: { tx: number; ty: number }) =>
  Math.max(Math.abs(a.tx - b.tx), Math.abs(a.ty - b.ty));

/** The first hour of a day in October when a neighbour keeps a stop that `wanted` likes. */
function whenAt(id: VillagerId, wanted: (stop: Stop) => boolean): Date {
  for (let d = 1; d <= 31; d++) {
    for (let hour = 6; hour < 23; hour++) {
      const at = new Date(2026, 9, d, hour, 30);
      const day = dayKey(at.getTime());
      if (specialDayOf(day)) continue;
      const stop = stopNow(id, hourOf(at.getTime()), day);
      if (stop && wanted(stop)) return at;
    }
  }
  throw new Error(`no such stop for ${id}`);
}

/** The middle of a tile, in world pixels: where she stands on it. */
const middle = (t: { tx: number; ty: number }) => ({
  x: t.tx * TILE_SIZE + TILE_SIZE / 2,
  y: t.ty * TILE_SIZE + TILE_SIZE / 2,
});

/** Somewhere in town well away from a tile. */
const farFrom = (t: { tx: number; ty: number }) => middle({ tx: t.tx > 20 ? 3 : 36, ty: 3 });

describe('a stroll round the stop', () => {
  it('from every stop, stays within two tiles and never stands where she needs to', () => {
    const { world } = harness();
    let some = 0;
    let stops = 0;
    for (const id of VILLAGER_IDS) {
      const { weekday, weekend } = VILLAGERS[id].schedule;
      for (const stop of [...weekday, ...weekend]) {
        const at = stopAt(stop);
        const zone = world.zones.get(at.zone);
        const tiles = world.neighbourhood.strollsAround(at);
        stops += 1;
        if (tiles.length > 0) some += 1;
        for (const t of tiles) {
          const where = `${id} ${at.zone} ${t.tx},${t.ty}`;
          expect(reach(t, at), where).toBeLessThanOrEqual(2);
          expect(zone.canWalk(t.tx, t.ty), where).toBe(true);
          expect(zone.doorAt(t, undefined), where).toBeNull();
          for (const [dx, dy] of [
            [0, -1],
            [-1, 0],
            [1, 0],
            [0, 1],
          ] as const) {
            const prop = zone.propAt(t.tx + dx, t.ty + dy);
            if (!prop) continue;
            expect(PROP_SEATS[prop.id], where).toBeUndefined();
            if (zone.doorAt(t, prop)) expect(doorStep(prop), where).not.toEqual(t);
          }
        }
      }
    }
    expect(some / stops).toBeGreaterThan(0.8);
  });

  it('never steps onto a door step in town', () => {
    const { world } = harness();
    const steps = (TOWN.doors ?? []).flatMap((d) => {
      const prop = world.zones.map('town').map.props.find((p) => p.id === d.prop);
      return prop ? [doorStep(prop)] : [];
    });
    expect(steps.length).toBeGreaterThan(5);
    for (const id of VILLAGER_IDS) {
      for (const stop of [...VILLAGERS[id].schedule.weekday, ...VILLAGERS[id].schedule.weekend]) {
        const at = stopAt(stop);
        if (at.zone !== 'town') continue;
        for (const t of world.neighbourhood.strollsAround(at)) expect(steps).not.toContainEqual(t);
      }
    }
  });

  it('takes them off their stop and back, within reach of it, every half minute or so', () => {
    const h = harness();
    const { world } = h;
    const day = dayKey(h.clock.now());
    const hour = hourOf(h.clock.now());
    const keeping = world.neighbourhood
      .neighboursIn('town')
      .filter((n) => stopNow(n.id, hour, day) !== null);
    expect(keeping.length).toBeGreaterThan(2);
    const stops = new Map(keeping.map((n) => [n.id, stopAt(stopNow(n.id, hour, day)!)]));
    const left = new Set<VillagerId>();
    for (let i = 0; i < 1800; i++) {
      h.tick(1, 50);
      for (const n of keeping) {
        const stop = stops.get(n.id)!;
        expect(reach(n.tile, stop), n.id).toBeLessThanOrEqual(2);
        if (n.tile.tx !== stop.tx || n.tile.ty !== stop.ty) left.add(n.id);
      }
    }
    // Ninety seconds: everyone with somewhere to go has been at least once.
    const roamers = keeping.filter(
      (n) => world.neighbourhood.strollsAround(stops.get(n.id)!).length,
    );
    for (const n of roamers) expect(left.has(n.id), n.id).toBe(true);
  });

  it("isn't started while she stands near them", () => {
    const h = harness();
    const day = dayKey(h.clock.now());
    const hour = hourOf(h.clock.now());
    const n = h.world.neighbourhood
      .neighboursIn('town')
      .find(
        (o) =>
          stopNow(o.id, hour, day) &&
          h.world.neighbourhood.strollsAround(stopAt(stopNow(o.id, hour, day)!)).length,
      )!;
    const stop = stopAt(stopNow(n.id, hour, day)!);
    const beside = middle({ tx: stop.tx + 1, ty: stop.ty });
    for (let i = 0; i < 1600; i++) {
      h.world.neighbourhood.step(50, beside, null);
      expect(n.tile).toEqual({ tx: stop.tx, ty: stop.ty });
    }
  });
});

describe('a wave as she comes near', () => {
  it('comes once as she comes within two tiles, and again only after she has gone', () => {
    const h = harness();
    const day = dayKey(h.clock.now());
    const hour = hourOf(h.clock.now());
    const n = h.world.neighbourhood.neighboursIn('town').find((o) => stopNow(o.id, hour, day))!;
    const stop = stopAt(stopNow(n.id, hour, day)!);
    const nh = h.world.neighbourhood;
    nh.step(16, farFrom(stop), null);
    expect(n.waveMs).toBe(0);
    const near = middle({ tx: stop.tx + NEAR_TILES, ty: stop.ty });
    nh.step(16, near, null);
    expect(n.waveMs).toBeGreaterThan(0);
    for (let i = 0; i < 200; i++) nh.step(16, near, null);
    expect(n.waveMs).toBe(0);
    // Stepping out to three tiles and back isn't going: no second wave.
    nh.step(16, middle({ tx: stop.tx + GONE_TILES, ty: stop.ty }), null);
    nh.step(16, near, null);
    expect(n.waveMs).toBe(0);
    nh.step(16, farFrom(stop), null);
    nh.step(16, near, null);
    expect(n.waveMs).toBeGreaterThan(0);
  });
});

describe('sitting and working at a stop', () => {
  it('sits Nessa on the bench by the lake, and a tap on her there is a tap on her', () => {
    const h = harness();
    h.clock.set(whenAt('nessa', (s) => 'at' in s && s.at === 'lakeSouth'));
    h.world.atlas.find('lanternShore');
    expect(h.world.travel.go('lanternShore')).toBe(true);
    const nessa = h.world.neighbourhood.neighbour('nessa');
    // She comes in from wherever she was and makes for the bench.
    h.until(() => nessa.seat !== null, 'Nessa sitting down');
    expect(nessa.zone).toBe('lanternShore');
    expect(nessa.facing).toBe('down');
    const seat = tileOf(nessa.seat!.x, nessa.seat!.floor - 1);
    expect(h.world.neighbourhood.villagerAt(seat.tx, seat.ty)).toBe(nessa);
  });

  it('puts Rufus to work with his flowers, and stops him to look at her', () => {
    const h = harness();
    h.clock.set(whenAt('rufus', (s) => s.doing === 'flowers' && 'at' in s && s.zone === undefined));
    h.tick(1, 16);
    const rufus = h.world.neighbourhood.neighbour('rufus');
    const nh = h.world.neighbourhood;
    nh.step(16, farFrom(rufus.tile), null);
    expect(rufus.working).toBe('flowers');
    expect(rufus.facing).toBe(WORKS.flowers.faces);
    nh.step(16, middle({ tx: rufus.tile.tx + 1, ty: rufus.tile.ty }), null);
    expect(rufus.working).toBeNull();
    expect(rufus.facing).toBe('right');
  });

  it('keeps everyone at a happening in their place, sitting and working at none', () => {
    for (let d = 1; d <= 31; d++) {
      for (let hour = 6; hour < 23; hour++) {
        const at = new Date(2026, 9, d, hour, 30);
        const day = dayKey(at.getTime());
        const on = happeningsAt(hour, day);
        if (on.length === 0 || specialDayOf(day)) continue;
        const h = harness();
        h.clock.set(at);
        h.tick(1, 16);
        for (const n of h.world.neighbourhood.neighbours) {
          if (stopNow(n.id, hour, day) !== null) continue;
          expect(n.seat).toBeNull();
          expect(n.working).toBeNull();
        }
        return;
      }
    }
    expect.fail('no happening found in October');
  });
});

/** A visit in town between two neighbours, an hour into it. */
function townVisit(h: Harness): Place & { guest: VillagerId; host: VillagerId } {
  for (let d = 1; d <= 60; d++) {
    const date = new Date(2026, 9, d, 12);
    const day = dayKey(date.getTime());
    if (specialDayOf(day)) continue;
    for (const v of visitsOn(day)) {
      if (v.host === 'her') continue;
      if (happeningsAt(v.from, day).length > 0) continue;
      const stop = stopNow(v.host, v.from, day);
      if (!stop) continue;
      const place = stopAt(stop);
      if (place.zone !== 'town') continue;
      h.clock.set(new Date(2026, 9, d, v.from, 30));
      return { ...place, guest: v.guest, host: v.host };
    }
  }
  throw new Error('no visit in town');
}

describe('chatter', () => {
  it('goes back and forth between a guest and whoever they are visiting', () => {
    const h = harness();
    const visit = townVisit(h);
    const nh = h.world.neighbourhood;
    const her = farFrom(visit);
    for (let i = 0; i < 400; i++) nh.step(50, her, null);
    const seen = new Map<string, VillagerId>();
    for (let i = 0; i < 1200; i++) {
      nh.step(50, her, null);
      for (const said of nh.chatter('town')) {
        if ([visit.guest, visit.host].includes(said.by)) seen.set(said.beat, said.by);
      }
    }
    const speakers = new Set(seen.values());
    expect(speakers).toEqual(new Set([visit.guest, visit.host]));
    expect(seen.size).toBeGreaterThan(5);
  });
});
