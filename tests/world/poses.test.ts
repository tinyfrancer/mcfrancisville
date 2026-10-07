import { describe, expect, it } from 'vitest';
import type { MapSource } from '../../src/data/maps';
import {
  actionMs,
  BREATH_MS,
  CROUCH_MS,
  IDLE_AFTER_MS,
  POUR_MS,
  ROCK_MS,
} from '../../src/systems/poses';
import { verbOf } from '../../src/world/services/Poses';
import { NET_MS } from '../../src/world/World';
import { harness, tinyMap } from './harness';

const ROOM = tinyMap(['######', '#....#', '#....#', '######']);

/** A bed to pick a pumpkin from, for a first harvest. */
const PLOT: MapSource = {
  rows: ['#####', '#...#', '#.x.#', '#####'],
  spawn: { tx: 1, ty: 1 },
  legend: {
    '#': { tile: 'hedge', solid: true },
    '.': { tile: 'grass' },
    x: { tile: 'bed', solid: true },
  },
};

/** A rock at the end of a lane, reached only from its left. */
const ROCKY: MapSource = {
  rows: ['#####', '#..R#', '#####'],
  spawn: { tx: 1, ty: 1 },
  legend: {
    '#': { tile: 'hedge', solid: true },
    '.': { tile: 'grass' },
    R: { tile: 'grass', prop: 'rock' },
  },
};

function tender(h: ReturnType<typeof harness>) {
  return () => {
    h.world.tendBed({ tx: 2, ty: 2 }, 'tend');
    return h.until(() => !h.world.player.moving, 'tending').concat(h.tick(1));
  };
}

describe('how she stands', () => {
  it('gets her phone out after standing still a while, and puts it away when asked to walk', () => {
    const h = harness(ROOM);
    h.tick(Math.ceil(IDLE_AFTER_MS / 16) - 2);
    expect(h.world.poses.pose()).toBeNull();
    h.tick(4);
    expect(h.world.poses.pose()).toBe('phone');
    h.world.tapTile(3, 2);
    expect(h.world.poses.pose()).toBeNull();
    h.tick(10);
    expect(h.world.player.moving).toBe(true);
    expect(h.world.poses.pose()).toBeNull();
  });

  it('crouches for the first of a crop, holds it up, then rocks out; the next, just a crouch', () => {
    const h = harness(PLOT);
    const tend = tender(h);
    tend();
    h.world.garden.plant({ tx: 2, ty: 2 }, 'pumpkinSeed');
    tend();
    h.clock.set(new Date(2026, 8, 27, 8));
    tend();
    expect(h.world.poses.pose()).toBe('crouch');
    h.clock.advance(CROUCH_MS);
    expect(h.world.poses.pose()).toBe('holdUp');
    h.clock.advance(actionMs('find') - CROUCH_MS);
    expect(['horns', 'bang']).toContain(h.world.poses.pose());
    h.clock.advance(ROCK_MS);
    expect(h.world.poses.pose()).toBeNull();

    h.world.garden.plant({ tx: 2, ty: 2 }, 'pumpkinSeed');
    tend();
    h.clock.set(new Date(2026, 8, 28, 8));
    tend();
    expect(h.world.poses.pose()).toBe('crouch');
    h.clock.advance(CROUCH_MS);
    expect(h.world.poses.pose()).toBeNull();
  });

  it('faces the bed she tends, however she stood, and tips her can over it', () => {
    const h = harness(PLOT);
    const tend = tender(h);
    tend();
    const { tx, ty } = h.world.movement.tile;
    // The bed is at 2,2: she came up beside it, or at its corner, where she faces up or down.
    const toward = Math.abs(2 - tx) > Math.abs(2 - ty) ? 'right' : ty < 2 ? 'down' : 'up';
    expect([tx, ty]).not.toEqual([2, 2]);
    expect(h.world.player.facing).toBe(toward);
    expect(h.world.poses.pose()).toBe('crouch');
    h.world.garden.plant({ tx: 2, ty: 2 }, 'pumpkinSeed');
    h.world.hands.hold('can');
    h.clock.advance(1_000);
    h.world.player.facing = toward === 'up' ? 'down' : 'up';
    tend();
    expect(h.world.player.facing).toBe(toward);
    expect(h.world.poses.pose()).toBe('pour');
    h.clock.advance(POUR_MS);
    expect(h.world.poses.pose()).toBeNull();
  });

  it('turns to a rock she walks up to and crouches for its stone, until she is asked to walk', () => {
    const h = harness(ROCKY);
    h.world.tapTile(3, 1);
    const events = h.until(() => !h.world.player.moving, 'walking to the rock').concat(h.tick(1));
    expect(events.some((e) => e.kind === 'gathered')).toBe(true);
    expect(h.world.player.facing).toBe('right');
    expect(h.world.poses.pose()).toBe('crouch');
    h.world.tapTile(1, 1);
    expect(h.world.poses.pose()).toBeNull();
  });

  it('breathes and blinks standing still, but not walking or in a pose', () => {
    const h = harness(ROOM);
    h.tick(1);
    const first = h.world.poses.rest();
    expect(first).not.toBeNull();
    h.clock.advance(BREATH_MS / 2);
    expect(h.world.poses.rest()!.out).toBe(!first!.out);
    h.world.tapTile(3, 2);
    h.tick(2);
    expect(h.world.poses.rest()).toBeNull();
  });
});

describe('what she does as a moment happens', () => {
  it('crouches to pick, tips her can, holds up finds and catches, and waves hello', () => {
    expect(verbOf({ kind: 'gathered', from: 'rock', item: 'stone', count: 1 })?.verb).toBe('pick');
    expect(verbOf({ kind: 'watered', crop: 'pumpkin', days: 2 })?.verb).toBe('water');
    expect(verbOf({ kind: 'dug', buried: 'castleKey', item: 'castleKey' } as never)?.verb).toBe(
      'find',
    );
    expect(verbOf({ kind: 'arrived', tx: 1, ty: 1, villager: 'cody' })?.verb).toBe('greet');
    expect(verbOf({ kind: 'arrived', tx: 1, ty: 1 })).toBeNull();
    // A catch in her net is held up once the net has come down; a fish as soon as it's reeled.
    expect(verbOf({ kind: 'caught', critter: 'lunaMoth', first: false } as never)).toEqual({
      verb: 'show',
      afterMs: NET_MS,
    });
    expect(verbOf({ kind: 'shook', candy: 0 })).toBeNull();
  });
});
