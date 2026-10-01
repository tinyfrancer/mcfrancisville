import { describe, expect, it } from 'vitest';
import type { MapSource } from '../../src/data/maps';
import { plantingIsRare } from '../../src/systems/farming';
import { bedKey } from '../../src/world/Farm';
import { fromSave, tileOf, World, type WorldEvent } from '../../src/world/World';
import { harness } from './harness';

/** Two beds side by side with a path round them, and a rose bush. */
const PLOT: MapSource = {
  rows: ['#######', '#.....#', '#.xx..#', '#....B#', '#######'],
  spawn: { tx: 1, ty: 1 },
  legend: {
    '#': { tile: 'hedge', solid: true },
    '.': { tile: 'grass' },
    x: { tile: 'bed', solid: true },
    B: { tile: 'grass', prop: 'roseBush' },
  },
};

const BED = { tx: 2, ty: 2 };

/** Taps a bed twice, the first to look and the second to walk up and do what it said. */
function tend(h: ReturnType<typeof harness>, tx = BED.tx, ty = BED.ty): WorldEvent[] {
  h.world.tapTile(tx, ty);
  h.world.tapTile(tx, ty);
  return h.until(() => !h.world.player.moving, `tending ${tx},${ty}`).concat(h.tick(1));
}

/** Tills the bed and plants `seed` in it, as the seed sheet would. */
function plant(h: ReturnType<typeof harness>, seed: Parameters<World['garden']['plant']>[1]) {
  tend(h);
  return h.world.garden.plant(BED, seed);
}

describe('the garden', () => {
  it('tends a bed from beside it, never standing on it', () => {
    const h = harness(PLOT);
    const events = tend(h);
    expect(events).toContainEqual({ kind: 'tilled', tx: 2, ty: 2 });
    const { x, y } = h.world.player;
    expect(tileOf(x, y)).not.toEqual({ tx: 2, ty: 2 });
    expect(h.world.canWalk(2, 2)).toBe(false);
  });

  it('asks for a seed at a tilled, empty bed', () => {
    const h = harness(PLOT);
    tend(h);
    expect(tend(h)).toContainEqual({ kind: 'bare', tx: 2, ty: 2 });
  });

  it('plants a seed from her bag, only in a tilled, empty bed', () => {
    const h = harness(PLOT);
    const before = h.world.bag.count('pumpkinSeed');
    expect(h.world.garden.plant({ tx: 2, ty: 2 }, 'pumpkinSeed')).toBeNull();
    expect(plant(h, 'pumpkinSeed')).toEqual({ kind: 'planted', crop: 'pumpkin', tx: 2, ty: 2 });
    expect(h.world.bag.count('pumpkinSeed')).toBe(before - 1);
    expect(h.world.garden.plant({ tx: 2, ty: 2 }, 'roseSeed')).toBeNull();
    expect(h.world.garden.plant({ tx: 1, ty: 1 }, 'roseSeed')).toBeNull();
  });

  it("won't plant a seed she doesn't have, or something that isn't a seed", () => {
    const h = harness(PLOT, { finds: { bag: [{ id: 'purseButter', count: 1 }] } });
    expect(plant(h, 'pumpkinSeed')).toBeNull();
    expect(h.world.garden.plant({ tx: 2, ty: 2 }, 'purseButter')).toBeNull();
    expect(h.world.farm.planting(BED)).toBeNull();
  });

  it('waters a growing crop once a day, and says how long it has left', () => {
    const h = harness(PLOT);
    plant(h, 'roseSeed');
    expect(tend(h)).toContainEqual({ kind: 'watered', crop: 'rose', days: 3 });
    expect(tend(h)).toContainEqual({ kind: 'growing', crop: 'rose', days: 3 });
  });

  it('lets the rain water her beds on a rainy day, and says so', () => {
    const h = harness(PLOT);
    h.clock.set(new Date(2026, 8, 28, 9));
    plant(h, 'roseSeed');
    expect(tend(h)).toContainEqual({ kind: 'growing', crop: 'rose', days: 3, rained: true });
  });

  it('ripens a watered crop planted yesterday today, and picks it with a seed back', () => {
    const h = harness(PLOT);
    plant(h, 'pumpkinSeed');
    tend(h);
    const seeds = h.world.bag.count('pumpkinSeed');
    h.clock.set(new Date(2026, 8, 27, 8));
    expect(tend(h)).toContainEqual({
      kind: 'harvested',
      crop: 'pumpkin',
      item: 'pumpkin',
      count: 1,
      seed: 'pumpkinSeed',
      first: true,
    });
    expect(h.world.bag.count('pumpkin')).toBe(1);
    expect(h.world.bag.count('pumpkinSeed')).toBe(seeds + 1);
    expect(h.world.farm.isTilled(BED)).toBe(true);
    expect(h.world.farm.planting(BED)).toBeNull();
  });

  it('counts only the first of each crop she ever picks as a first, even after a save', () => {
    const h = harness(PLOT);
    plant(h, 'pumpkinSeed');
    tend(h);
    h.clock.set(new Date(2026, 8, 27, 8));
    expect(tend(h)).toContainEqual(expect.objectContaining({ kind: 'harvested', first: true }));
    const again = harness(PLOT, fromSave(h.world.save()));
    plant(again, 'pumpkinSeed');
    tend(again);
    again.clock.set(new Date(2026, 8, 27, 8));
    expect(tend(again)).toContainEqual(
      expect.objectContaining({ kind: 'harvested', first: false }),
    );
    expect(again.world.save().harvested).toEqual(['pumpkin']);
  });

  it('never needs watering: a crop left alone ripens too, and waits for her', () => {
    const h = harness(PLOT);
    plant(h, 'candyCornSeed');
    h.clock.set(new Date(2027, 2, 1, 12));
    expect(tend(h)).toContainEqual(expect.objectContaining({ kind: 'harvested', count: 2 }));
  });

  it('keeps the garden through a save, and drops what this build no longer knows', () => {
    const h = harness(PLOT);
    plant(h, 'hostaDivision');
    tend(h);
    const { beds } = h.world.garden.snapshot();
    expect(beds).toEqual([
      {
        zone: 'town',
        tx: 2,
        ty: 2,
        planting: {
          crop: 'hosta',
          plantedAt: h.clock.now(),
          waterings: 1,
          lastWatered: '2026-09-26',
        },
      },
    ]);
    const restored = new World({ map: PLOT, beds, clock: h.clock });
    expect(restored.farm.planting(BED)?.crop).toBe('hosta');

    const odd = new World({
      map: PLOT,
      clock: h.clock,
      beds: [
        {
          zone: 'town',
          tx: 3,
          ty: 2,
          planting: { ...beds[0]!.planting!, crop: 'turnip' as never },
        },
        { zone: 'town', tx: 5, ty: 1, planting: null },
      ],
    });
    expect(odd.farm.isTilled({ tx: 3, ty: 2 })).toBe(true);
    expect(odd.farm.planting({ tx: 3, ty: 2 })).toBeNull();
    expect(odd.farm.isTilled({ tx: 5, ty: 1 })).toBe(false);
  });

  it('shows a rose that will pick blue, and gives it', () => {
    // Plant roses at different moments until one is bound to come up blue.
    const h = harness(PLOT);
    tend(h);
    for (let i = 0; i < 200; i++) {
      h.world.farm.set(BED, null);
      h.clock.advance(1);
      h.world.garden.plant(BED, 'roseSeed');
      if (plantingIsRare(bedKey(BED), h.world.farm.planting(BED)!)) break;
      h.world.bag.add('roseSeed', 1);
    }
    h.clock.set(new Date(2026, 9, 10, 12));
    expect(tend(h)).toContainEqual(expect.objectContaining({ item: 'blueRose', count: 1 }));
  });
});

describe('the rose bush', () => {
  it('gives roses once a day, and now and then a blue one', () => {
    const h = harness(PLOT);
    const found = new Set<string>();
    for (let day = 1; day <= 60; day++) {
      h.clock.set(new Date(2026, 9, day, 12));
      for (const e of tend(h, 5, 3)) if (e.kind === 'gathered') found.add(e.item);
      expect(tend(h, 5, 3)).toContainEqual(expect.objectContaining({ kind: 'resting' }));
    }
    expect(found).toEqual(new Set(['rose', 'blueRose']));
  });
});
