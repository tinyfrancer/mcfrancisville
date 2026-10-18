import { describe, expect, it } from 'vitest';
import { isFish } from '../../src/data/critters';
import type { Critter, WorldEvent } from '../../src/world/World';
import { harness, type Harness } from './harness';

/** A fish in the town's water this hour that no neighbour is standing beside. */
function aFish(h: Harness): Critter {
  const fish = h.world.collecting
    .critters()
    .find(
      (c) =>
        isFish(c.critter) &&
        !h.world.neighbourhood.villagerAt(c.tx, c.ty) &&
        !h.world.neighbourhood.villagerAt(c.tx, c.ty + 1),
    );
  if (!fish) throw new Error('no fish in the water');
  return fish;
}

/** Taps a fish's shadow, and walks her up to the bank beside it, where she casts. */
function castTo(h: Harness, fish: Critter): WorldEvent[] {
  expect(h.world.tapTile(fish.tx, fish.ty)).toBe(true);
  return h.until(() => h.world.fishing.line !== null, `casting to the ${fish.critter}`);
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

describe('fishing', () => {
  it('has a few fish in the water every hour, apart from the critters for her net', () => {
    const h = harness();
    for (let hour = 0; hour < 24; hour++) {
      h.clock.set(new Date(2026, 8, 26, hour, 10));
      const fish = h.world.collecting.critters().filter((c) => isFish(c.critter));
      expect(fish.length, `${hour}:00`).toBeGreaterThanOrEqual(2);
    }
  });

  it('casts from the bank to a shadow, and lands the fish with a tap on the bite', () => {
    const h = harness();
    const fish = aFish(h);
    const cast = castTo(h, fish);
    expect(cast).toContainEqual({ kind: 'cast', hint: true });
    expect(h.world.hands.held).toBe('rod');
    expect(h.world.collecting.netSwing()).toBeNull();
    const waiting = wait(h, () => h.world.fishing.line?.state === 'bite', 'a bite');
    expect(waiting).toContainEqual({ kind: 'bite' });
    // A tap anywhere reels in.
    expect(h.world.tapTile(1, 1)).toBe(true);
    const caught = h.tick(1);
    expect(caught).toContainEqual(
      expect.objectContaining({ kind: 'caught', critter: fish.critter, first: true }),
    );
    expect(h.world.fishing.line).toBeNull();
    expect(h.world.bag.count(fish.critter)).toBe(1);
    expect(h.world.cabinet.caughtOn(fish.critter)).toBe('2026-09-26');
    expect(h.world.collecting.critters().some((c) => c.key === fish.key)).toBe(false);
    expect(h.world.player.moving).toBe(false);
  });

  it('reels in empty on a tap too soon, and the fish is still there to cast to again', () => {
    const h = harness();
    const fish = aFish(h);
    castTo(h, fish);
    h.tick(1);
    h.world.tapTile(1, 1);
    expect(h.tick(1)).toContainEqual({ kind: 'reeled' });
    expect(h.world.bag.count(fish.critter)).toBe(0);
    expect(h.world.collecting.find(fish.key)).toBeDefined();
    castTo(h, fish);
    wait(h, () => h.world.fishing.line?.state === 'bite', 'a bite');
    h.world.tapTile(1, 1);
    expect(h.tick(1)).toContainEqual(
      expect.objectContaining({ kind: 'caught', critter: fish.critter, first: true }),
    );
  });

  it('comes round to another bite after one let go, said only the first time', () => {
    const h = harness();
    castTo(h, aFish(h));
    const events = wait(
      h,
      () => h.world.fishing.line?.round === 2 && h.world.fishing.line.state === 'bite',
      'a third bite',
      40_000,
    );
    const letGo = events.filter((e) => e.kind === 'letGo');
    expect(letGo).toEqual([{ kind: 'letGo', first: true }, { kind: 'letGo' }]);
    expect(events.filter((e) => e.kind === 'bite')).toHaveLength(3);
  });

  it('needs no hint once she has caught a fish', () => {
    const h = harness(undefined, { cabinet: { caught: { ghostMinnow: '2026-09-20' } } });
    expect(castTo(h, aFish(h))).toContainEqual({ kind: 'cast' });
  });

  it('brings her line in when she walks off', () => {
    const h = harness();
    castTo(h, aFish(h));
    h.world.tendBed(...firstBed(h));
    h.tick(1);
    expect(h.world.fishing.line).toBeNull();
  });
});

describe('a session at the pond (V1 R6a)', () => {
  /** Casts to a fish and lands it with taps in time, through a reel if it's hooked. */
  function land(h: Harness, fish: Critter): WorldEvent & { kind: 'caught' } {
    castTo(h, fish);
    for (let taps = 0; taps < 4; taps++) {
      h.clock.set(h.world.fishing.bestTapAt()!);
      h.tick(1);
      expect(h.world.tapTile(1, 1)).toBe(true);
      const caught = h.tick(1).find((e) => e.kind === 'caught');
      if (caught) return caught;
    }
    return expect.fail(`never landed the ${fish.critter}`);
  }

  it('lands fish of different sizes, and keeps the biggest of each kind in the Cabinet', () => {
    const h = harness();
    const sizes = new Map<string, number[]>();
    const bests: WorldEvent[] = [];
    for (let day = 0; day < 3; day++) {
      for (const hour of [8, 11, 14, 17]) {
        h.clock.set(new Date(2026, 8, 26 + day, hour, 5));
        for (let n = 0; n < 2; n++) {
          const caught = land(h, aFish(h));
          expect(caught.size, caught.critter).toBeGreaterThan(0);
          sizes.set(caught.critter, [...(sizes.get(caught.critter) ?? []), caught.size!]);
          if (caught.best === 'best') bests.push(caught);
        }
      }
    }
    const all = [...sizes.values()].flat();
    expect(all.length).toBe(24);
    expect(new Set(all).size).toBeGreaterThan(3);
    for (const [id, got] of sizes) {
      expect(h.world.cabinet.bestOf(id as Critter['critter'])).toBe(Math.max(...got));
    }
    // Some kind was caught again bigger than before, and said so.
    expect(bests.length).toBeGreaterThan(0);
    // Kept with the town.
    const best = h.world.save().cabinet.best ?? {};
    expect(Object.keys(best).sort()).toEqual([...sizes.keys()].sort());
  });
});

/** Her first garden bed, somewhere to be walked off to. */
function firstBed(h: Harness): [{ tx: number; ty: number }, 'tend'] {
  return [h.world.map.beds[0]!, 'tend'];
}
