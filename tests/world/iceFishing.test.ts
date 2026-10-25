import { describe, expect, it } from 'vitest';
import { isFish } from '../../src/data/critters';
import { HOLE, holeOf, holePixel } from '../../src/render/fishing';
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
