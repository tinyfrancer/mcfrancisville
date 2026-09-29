import { describe, expect, it } from 'vitest';
import type { MapSource } from '../../src/data/maps';
import { fromSave, World, type WorldEvent } from '../../src/world/World';
import { harness } from './harness';

/** Two beds side by side with a path round them. */
const PLOT: MapSource = {
  rows: ['#######', '#.....#', '#.xx..#', '#.....#', '#######'],
  spawn: { tx: 1, ty: 1 },
  legend: {
    '#': { tile: 'hedge', solid: true },
    '.': { tile: 'grass' },
    x: { tile: 'bed', solid: true },
  },
};

function tend(h: ReturnType<typeof harness>, tx = 2, ty = 2): WorldEvent[] {
  h.world.tendBed(tx, ty, 'tend');
  return h.until(() => !h.world.player.moving, `tending ${tx},${ty}`).concat(h.tick(1));
}

describe('the quick bar', () => {
  it('starts with her hands empty', () => {
    expect(harness(PLOT).world.hands.held).toBe('hands');
  });

  it('holds a tool, or a seed she has, and nothing else', () => {
    const { world } = harness(PLOT, {
      finds: {
        bag: [
          { id: 'pumpkinSeed', count: 1 },
          { id: 'wood', count: 2 },
        ],
      },
    });
    expect(world.hands.hold('net')).toBe(true);
    expect(world.hands.held).toBe('net');
    expect(world.hands.hold('pumpkinSeed')).toBe(true);
    expect(world.hands.seed).toBe('pumpkinSeed');
    expect(world.hands.hold('roseSeed')).toBe(false);
    expect(world.hands.hold('wood')).toBe(false);
    expect(world.hands.hold('spade')).toBe(false);
    expect(world.hands.held).toBe('pumpkinSeed');
  });

  it('plants the seed in her hand straight into a wild bed, tilling it first', () => {
    const h = harness(PLOT);
    h.world.hands.hold('pumpkinSeed');
    const before = h.world.bag.count('pumpkinSeed');
    const events = tend(h);
    expect(events).toContainEqual({ kind: 'planted', crop: 'pumpkin', tx: 2, ty: 2 });
    expect(events.some((e) => e.kind === 'tilled' || e.kind === 'bare')).toBe(false);
    expect(h.world.bag.count('pumpkinSeed')).toBe(before - 1);
    expect(h.world.farm.planting({ tx: 2, ty: 2 })?.crop).toBe('pumpkin');
  });

  it('waters a growing bed even with a seed in her hand, and keeps the seed', () => {
    const h = harness(PLOT);
    h.world.hands.hold('roseSeed');
    tend(h);
    expect(tend(h)).toContainEqual({ kind: 'watered', crop: 'rose', days: 3 });
    expect(h.world.hands.held).toBe('roseSeed');
  });

  it('puts the seed down when the last one is planted', () => {
    const h = harness(PLOT, { finds: { bag: [{ id: 'pumpkinSeed', count: 1 }] } });
    const changes: string[] = [];
    h.world.events.on('held', (held) => changes.push(held));
    h.world.hands.hold('pumpkinSeed');
    tend(h);
    expect(h.world.hands.held).toBe('hands');
    expect(changes).toEqual(['pumpkinSeed', 'hands']);
  });

  it('picks up the can to water, and follows what she does', () => {
    const h = harness(PLOT);
    tend(h);
    h.world.garden.plant(2, 2, 'roseSeed');
    expect(h.world.hands.held).toBe('hands');
    tend(h);
    expect(h.world.hands.held).toBe('can');
  });

  it('is saved, and a seed she has run out of is her hands again', () => {
    const { world } = harness(PLOT);
    world.hands.hold('roseSeed');
    expect(world.save().held).toBe('roseSeed');
    const again = new World({ ...fromSave(world.save()), map: PLOT });
    expect(again.hands.held).toBe('roseSeed');
    const empty = { ...world.save(), bag: [] };
    expect(new World({ ...fromSave(empty), map: PLOT }).hands.held).toBe('hands');
    expect(new World({ map: PLOT, held: 'somethingOld' }).hands.held).toBe('hands');
  });
});
