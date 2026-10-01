import { describe, expect, it } from 'vitest';
import type { MapSource } from '../../src/data/maps';
import type { Tile } from '../../src/systems/pathfinding';
import { fromSave, World, type WorldEvent } from '../../src/world/World';
import { harness, type Harness } from './harness';

/** Two rows of four beds, with a path all round (phase P). */
const FARM: MapSource = {
  rows: ['########', '#......#', '#.xxxx.#', '#.xxxx.#', '#......#', '########'],
  spawn: { tx: 1, ty: 1 },
  legend: {
    '#': { tile: 'hedge', solid: true },
    '.': { tile: 'grass' },
    x: { tile: 'bed', solid: true },
  },
};

function walkUp(h: Harness): WorldEvent[] {
  return h.until(() => !h.world.player.moving, 'walking up').concat(h.tick(1));
}

function job(h: Harness, bed: Tile, what: 'tend' | 'row' | 'unfit' = 'tend'): WorldEvent[] {
  h.world.tendBed(bed, what);
  return walkUp(h);
}

describe("a bed's pop-up", () => {
  it('comes up on the first tap, without her going anywhere or doing anything', () => {
    const h = harness(FARM);
    const seen: (Tile | null)[] = [];
    h.world.events.on('bed', (bed) => seen.push(bed));
    const start = { ...h.world.player };
    expect(h.world.tapTile(3, 2)).toBe(true);
    expect(h.tick(30)).toEqual([]);
    expect(h.world.player.x).toBe(start.x);
    expect(h.world.farm.isTilled({ tx: 3, ty: 2 })).toBe(false);
    expect(h.world.garden.looking).toEqual({ zone: 'town', tx: 3, ty: 2 });
    expect(seen).toEqual([{ zone: 'town', tx: 3, ty: 2 }]);
  });

  it('says what the second tap does, and the second tap does it', () => {
    const h = harness(FARM);
    h.world.tapTile(3, 2);
    expect(h.world.garden.look({ tx: 3, ty: 2 }, h.world.hands.held).action).toEqual({
      kind: 'till',
    });
    h.world.tapTile(3, 2);
    expect(h.world.garden.looking).toBeNull();
    expect(walkUp(h)).toContainEqual({ kind: 'tilled', tx: 3, ty: 2 });
  });

  it('goes when she taps anywhere else, and another bed only looks at that one', () => {
    const h = harness(FARM);
    h.world.tapTile(3, 2);
    h.world.tapTile(4, 2);
    expect(h.world.garden.looking).toEqual({ zone: 'town', tx: 4, ty: 2 });
    h.world.tapTile(1, 4);
    expect(h.world.garden.looking).toBeNull();
    walkUp(h);
    expect(h.world.farm.isTilled({ tx: 3, ty: 2 })).toBe(false);
    expect(h.world.farm.isTilled({ tx: 4, ty: 2 })).toBe(false);
  });
});

describe('planting a row', () => {
  it('plants the seed in her hand along the row, tilling as it goes', () => {
    const h = harness(FARM);
    h.world.hands.hold('pumpkinSeed');
    const seeds = h.world.bag.count('pumpkinSeed');
    expect(h.world.garden.look({ tx: 3, ty: 2 }, 'pumpkinSeed').row).toBe(Math.min(4, seeds));
    expect(job(h, { tx: 3, ty: 2 }, 'row')).toContainEqual({
      kind: 'sowedRow',
      crop: 'pumpkin',
      count: Math.min(4, seeds),
    });
    for (let tx = 2; tx <= 5; tx++) {
      expect(h.world.farm.planting({ tx, ty: 2 })?.crop).toBe('pumpkin');
    }
    expect(h.world.farm.planting({ tx: 2, ty: 3 })).toBeNull();
  });

  it('goes as far as her seeds, and leaves what is already growing', () => {
    const h = harness(FARM, { finds: { bag: [{ id: 'roseSeed', count: 3 }] } });
    job(h, { tx: 4, ty: 2 });
    h.world.garden.plant({ tx: 4, ty: 2 }, 'roseSeed');
    h.world.hands.hold('roseSeed');
    expect(job(h, { tx: 3, ty: 2 }, 'row')).toContainEqual({
      kind: 'sowedRow',
      crop: 'rose',
      count: 2,
    });
    expect(h.world.farm.planting({ tx: 3, ty: 2 })?.crop).toBe('rose');
    expect(h.world.farm.planting({ tx: 2, ty: 2 })?.crop).toBe('rose');
    expect(h.world.farm.planting({ tx: 5, ty: 2 })).toBeNull();
    expect(h.world.hands.held).toBe('hands');
  });
});

describe('sprinklers', () => {
  const withSprinklers = (count = 2) =>
    harness(FARM, {
      finds: {
        bag: [
          { id: 'sprinkler', count },
          { id: 'roseSeed', count: 8 },
        ],
      },
    });

  it('are made at the workbench from stone and wood, from the start', () => {
    const h = harness(FARM, {
      finds: {
        bag: [
          { id: 'stone', count: 6 },
          { id: 'wood', count: 3 },
        ],
      },
    });
    expect(h.world.workbench.craft('sprinkler')).toMatchObject({ kind: 'made' });
    expect(h.world.bag.count('sprinkler')).toBe(1);
  });

  it('go in a bed from her hand and water it and every bed touching it, from today', () => {
    const h = withSprinklers();
    h.world.hands.hold('roseSeed');
    job(h, { tx: 2, ty: 2 }, 'row');
    h.world.hands.hold('sprinkler');
    expect(job(h, { tx: 3, ty: 3 })).toContainEqual({ kind: 'fitted', beds: 6 });
    expect(h.world.farm.hasSprinkler({ tx: 3, ty: 3 })).toBe(true);
    expect(h.world.bag.count('sprinkler')).toBe(1);
    for (const tx of [2, 3, 4]) expect(h.world.garden.wateredBy({ tx, ty: 2 })).toBe('sprinkler');
    expect(h.world.garden.wateredBy({ tx: 5, ty: 2 })).toBeNull();
    h.world.hands.hold('hands');
    expect(job(h, { tx: 3, ty: 2 })).toContainEqual({
      kind: 'growing',
      crop: 'rose',
      days: 3,
      sprinkled: true,
    });
    expect(job(h, { tx: 5, ty: 2 })).toContainEqual({ kind: 'watered', crop: 'rose', days: 3 });
  });

  it('ripen what they reach as fast as her can would, with nothing more from her', () => {
    const h = withSprinklers();
    h.world.hands.hold('roseSeed');
    job(h, { tx: 2, ty: 2 }, 'row');
    h.world.hands.hold('sprinkler');
    job(h, { tx: 3, ty: 3 });
    h.clock.set(new Date(2026, 8, 27, 12));
    expect(h.world.garden.look({ tx: 2, ty: 2 }, 'hands').days).toBe(1);
    expect(h.world.garden.look({ tx: 5, ty: 2 }, 'hands').days).toBe(3);
    h.clock.set(new Date(2026, 8, 28, 12));
    h.world.hands.hold('hands');
    expect(job(h, { tx: 4, ty: 2 })).toContainEqual(
      expect.objectContaining({ kind: 'harvested', crop: 'rose' }),
    );
  });

  it('come back out into her bag, and what they grew stays grown', () => {
    const h = withSprinklers();
    h.world.hands.hold('roseSeed');
    job(h, { tx: 2, ty: 2 }, 'row');
    h.world.hands.hold('sprinkler');
    job(h, { tx: 3, ty: 3 });
    h.clock.set(new Date(2026, 8, 27, 12));
    h.world.hands.hold('hands');
    const before = h.world.garden.look({ tx: 2, ty: 2 }, 'hands');
    expect(job(h, { tx: 3, ty: 3 }, 'unfit')).toContainEqual({ kind: 'unfitted' });
    expect(h.world.bag.count('sprinkler')).toBe(2);
    const after = h.world.garden.look({ tx: 2, ty: 2 }, 'hands');
    expect(after.days).toBe(before.days);
    expect(after.watered).toBe('can');
    expect(after.sprinkled).toBe(false);
  });

  it('are kept through a save, and one in a bed the map has lost goes back in her bag', () => {
    const h = withSprinklers();
    h.world.hands.hold('sprinkler');
    job(h, { tx: 3, ty: 3 });
    const save = h.world.save();
    expect(save.sprinklers).toEqual([{ zone: 'town', tx: 3, ty: 3, since: '2026-09-26' }]);
    const again = new World({ map: FARM, clock: h.clock, ...fromSave(save) });
    expect(again.farm.hasSprinkler({ tx: 3, ty: 3 })).toBe(true);
    expect(again.bag.count('sprinkler')).toBe(1);
    const lost = new World({
      map: FARM,
      clock: h.clock,
      ...fromSave({
        ...save,
        sprinklers: [...save.sprinklers, { zone: 'town', tx: 1, ty: 1, since: '' }],
      }),
    });
    expect(lost.farm.sprinklersIn).toHaveLength(1);
    expect(lost.bag.count('sprinkler')).toBe(2);
  });
});
