import { describe, expect, it } from 'vitest';
import { CRITTERS, isFish } from '../../src/data/critters';
import { HOLE_QUIET } from '../../src/data/interiors';
import { HOLE, holeOf, holePixel } from '../../src/render/fishing';
import { isVisiting } from '../../src/systems/critters';
import { fishInHole, isWinterFish } from '../../src/systems/fishing';
import { weatherOn } from '../../src/systems/weather';
import type { Critter, WorldEvent } from '../../src/world/World';
import { harness, type Harness } from './harness';

/*
 * 1.4's G3 (decision 372): ice fishing. While the town's pond is frozen over, its fish swim on
 * under the ice, and a tap on one's dim shadow casts through a hole, as on open water.
 */

/** A fish under the town pond's ice at some hour of a winter day, the clock set to that hour. */
function fishUnderIce(h: Harness, day: [number, number, number]): Critter {
  const zone = h.world.zones.outdoor('town')!;
  for (let hour = 6; hour < 24; hour++) {
    h.clock.set(new Date(...day, hour, 10));
    const fish = h.world.collecting
      .critters()
      .find(
        (c) =>
          isFish(c.critter) &&
          zone.isIce(c.tx, c.ty) &&
          !h.world.neighbourhood.villagerAt(c.tx, c.ty) &&
          h.world.zones.outdoor('town')!.standBeside(c.tx, c.ty).length > 0,
      );
    if (fish) return fish;
  }
  throw new Error('no fish under the ice all day');
}

/** Steps the town with its clock running, since her line is read off the clock, until `done`. */
function wait(h: Harness, done: () => boolean, label: string, budgetMs = 15_000): WorldEvent[] {
  const events: WorldEvent[] = [];
  for (let spent = 0; !done(); spent += 16) {
    if (spent >= budgetMs) expect.fail(`gave up waiting for ${label}`);
    h.clock.advance(16);
    events.push(...h.tick(1));
  }
  return events;
}

describe('ice fishing', () => {
  it('keeps the fish in the pond while it is frozen over, under the ice', () => {
    const h = harness();
    const zone = h.world.zones.outdoor('town')!;
    let under = 0;
    for (let hour = 0; hour < 24; hour++) {
      h.clock.set(new Date(2027, 0, 5, hour, 10));
      const fish = h.world.collecting.critters().filter((c) => isFish(c.critter));
      expect(fish.length, `${hour}:00`).toBeGreaterThanOrEqual(1);
      under += fish.filter((c) => zone.isIce(c.tx, c.ty)).length;
      // Nothing but a fish is ever out on the ice.
      for (const c of h.world.collecting.critters()) {
        if (!isFish(c.critter)) expect(zone.isIce(c.tx, c.ty), c.critter).toBe(false);
      }
    }
    expect(under).toBeGreaterThan(0);
  });

  it('casts through a hole to a shadow under the ice, and lands it as on open water', () => {
    const h = harness();
    const fish = fishUnderIce(h, [2027, 0, 5]);
    expect(h.world.tapTile(fish.tx, fish.ty)).toBe(true);
    const cast = h.until(() => h.world.fishing.line !== null, 'casting through the ice');
    expect(cast).toContainEqual(expect.objectContaining({ kind: 'cast' }));
    expect(h.world.hands.held).toBe('rod');
    // She casts from beside the hole, never standing in it.
    const at = h.world.movement.tile;
    expect(Math.max(Math.abs(at.tx - fish.tx), Math.abs(at.ty - fish.ty))).toBe(1);
    expect(holeOf(h.world, 'town')).toEqual({ tx: fish.tx, ty: fish.ty });
    wait(h, () => h.world.fishing.line?.state === 'bite', 'a bite');
    h.world.tapTile(1, 1);
    let caught = h.tick(1);
    // A rare one is reeled in on the tension bar, as it is on open water.
    if (h.world.fishing.line?.reeling) {
      const best = h.world.fishing.bestTapAt()!;
      h.clock.set(best);
      h.world.tapTile(1, 1);
      caught = h.tick(1);
    }
    expect(caught).toContainEqual(
      expect.objectContaining({ kind: 'caught', critter: fish.critter }),
    );
    expect(
      h.world.bag.count(fish.critter) + h.world.bag.count(`${fish.critter}Shiny` as never),
    ).toBe(1);
    expect(holeOf(h.world, 'town')).toBeNull();
  });

  it("says so in Today while the pond's frozen, once a winter, with a tap out onto it", () => {
    const h = harness();
    h.clock.set(new Date(2027, 0, 5, 12));
    const line = h.world.upNow.lines().find((l) => l.kind === 'iceFishing');
    expect(line).toMatchObject({
      key: 'iceFishing:2026',
      go: { zone: 'town', tile: { tx: 23, ty: 43 } },
    });
    h.clock.set(new Date(2026, 11, 20, 12));
    expect(h.world.upNow.lines().find((l) => l.kind === 'iceFishing')?.key).toBe('iceFishing:2026');
    h.clock.set(new Date(2027, 1, 10, 12));
    expect(h.world.upNow.lines().some((l) => l.kind === 'iceFishing')).toBe(false);
  });

  it('draws no hole on open water', () => {
    const h = harness();
    const zone = h.world.zones.outdoor('town')!;
    const fish = h.world.collecting.critters().find((c) => isFish(c.critter))!;
    expect(zone.isIce(fish.tx, fish.ty)).toBe(false);
    h.world.tapTile(fish.tx, fish.ty);
    h.until(() => h.world.fishing.line !== null, 'casting');
    expect(holeOf(h.world, 'town')).toBeNull();
  });

  it('draws the hole as dark water ringed by a wet rim and slush', () => {
    expect(holePixel(0, 0)).toBe('water');
    expect(holePixel(0, -2)).toBe('deep');
    expect(holePixel(HOLE.rx, 0)).toBe('rim');
    expect(holePixel(HOLE.rx + 6, 0)).toBeNull();
    const lip = Array.from({ length: 40 }, (_, i) => holePixel(i - 20, 5)).filter(Boolean);
    expect(lip.length).toBeGreaterThan(0);
  });
});

/*
 * The ice hut (1.4's G3): the fifth town project, on the pond's bank, and once built a room whose
 * floor has a hole she fishes through, into the winter fish in winter and the pond's own the rest
 * of the year.
 */

/** Into the built hut from her door, by a tap on it. */
function intoTheHut(h: Harness): void {
  expect(h.world.tapTile(31, 38)).toBe(true);
  h.until(() => h.world.scene === 'iceHut', 'going into the ice hut');
  h.until(() => !h.world.movement.walking, 'settling in');
}

/** Lands whatever bites on her line, on the tension bar if it's a rare one. */
function landIt(h: Harness): WorldEvent[] {
  wait(h, () => h.world.fishing.line?.state === 'bite', 'a bite');
  h.world.tapTile(1, 6);
  let events = h.tick(1);
  if (h.world.fishing.line?.reeling) {
    h.clock.set(h.world.fishing.bestTapAt()!);
    h.world.tapTile(1, 6);
    events = h.tick(1);
  }
  return events;
}

describe('the ice hut', () => {
  it('stands on the pond bank once built, a door into a little room', () => {
    const h = harness(undefined, { projects: { current: null, given: {}, built: ['iceHut'] } });
    const town = h.world.zones.outdoor('town')!;
    expect(town.propAt(31, 38)?.id).toBe('iceHut');
    expect(town.canWalk(32, 39)).toBe(false);
    intoTheHut(h);
    expect(h.world.scene).toBe('iceHut');
    // And back out onto its step.
    h.world.tapTile(3, 6);
    h.until(() => h.world.scene === 'town', 'going back out');
    expect(h.world.movement.tile).toEqual({ tx: 32, ty: 40 });
  });

  it('is nothing on the bank till the town builds it', () => {
    const h = harness();
    expect(h.world.zones.outdoor('town')!.propAt(31, 38)).toBeUndefined();
    expect(h.world.zones.outdoor('town')!.canWalk(31, 38)).toBe(true);
  });

  it('casts through the hole in its floor into the winter fish, any winter day', () => {
    const h = harness(undefined, { projects: { current: null, given: {}, built: ['iceHut'] } });
    // February: the pond's open again, and the hut's hole still has the winter fish.
    h.clock.set(new Date(2027, 1, 10, 12, 5));
    h.tick(1);
    intoTheHut(h);
    expect(h.world.tapTile(3, 4)).toBe(true);
    const cast = h.until(() => h.world.fishing.line !== null, 'casting through the hole');
    expect(cast).toContainEqual(expect.objectContaining({ kind: 'cast' }));
    expect(h.world.hands.held).toBe('rod');
    const fish = h.world.fishing.line!.critter;
    expect(isWinterFish(fish), fish).toBe(true);
    expect(landIt(h)).toContainEqual(expect.objectContaining({ kind: 'caught', critter: fish }));
    // A second one under it this hour, and then nothing's nibbling till the hour turns.
    h.world.tapTile(3, 4);
    h.until(() => h.world.fishing.line !== null, 'casting again');
    landIt(h);
    h.world.movement.standAt({ tx: 2, ty: 5 }, 'up');
    h.world.tapTile(3, 4);
    const quiet = h.until(() => !h.world.movement.walking, 'walking up').concat(h.tick(2));
    expect(quiet).toContainEqual(expect.objectContaining({ kind: 'arrived', says: HOLE_QUIET }));
    expect(h.world.fishing.line).toBeNull();
  });

  it("has the pond's own fish under it the rest of the year", () => {
    for (const day of ['2026-09-26', '2027-05-12', '2027-07-04']) {
      for (const hour of [6, 12, 20, 2]) {
        const fish = fishInHole(day, hour, weatherOn(day));
        expect(fish.length, `${day} ${hour}`).toBeGreaterThan(0);
        for (const f of fish) {
          // A winter fish only visiting, out of its season, as it does in the water.
          const visiting = isVisiting(f.critter, day, weatherOn(day));
          expect(isWinterFish(f.critter) && !visiting, f.critter).toBe(false);
          expect(CRITTERS[f.critter].where).toContain('town');
        }
      }
    }
  });

  it('lets her line go if she leaves the hut', () => {
    const h = harness(undefined, { projects: { current: null, given: {}, built: ['iceHut'] } });
    intoTheHut(h);
    h.world.tapTile(3, 4);
    h.until(() => h.world.fishing.line !== null, 'casting through the hole');
    h.world.travel.home();
    h.tick(2);
    expect(h.world.fishing.line).toBeNull();
  });
});

describe("the ice hut in the town's overlays", () => {
  it('changes where she can walk and what she walks up to only on the tiles it stands on', () => {
    const others = ['bandstand', 'castleGarden', 'footbridge', 'greenhouse'] as const;
    const before = harness(undefined, {
      projects: { current: null, given: {}, built: [...others] },
    });
    const after = harness(undefined, {
      projects: { current: null, given: {}, built: [...others, 'iceHut'] },
    });
    const a = before.world.zones.outdoor('town')!;
    const b = after.world.zones.outdoor('town')!;
    const changed: string[] = [];
    for (let ty = -1; ty <= a.height; ty++) {
      for (let tx = -1; tx <= a.width; tx++) {
        const was = `${a.canWalk(tx, ty)}${a.propAt(tx, ty)?.id ?? ''}`;
        const now = `${b.canWalk(tx, ty)}${b.propAt(tx, ty)?.id ?? ''}`;
        if (was !== now) changed.push(`${tx},${ty}`);
      }
    }
    expect(changed.sort()).toEqual(['31,38', '31,39', '32,38', '32,39']);
  });
});
