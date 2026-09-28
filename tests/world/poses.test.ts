import { describe, expect, it } from 'vitest';
import type { MapSource } from '../../src/data/maps';
import { IDLE_AFTER_MS, ROCK_MS } from '../../src/systems/poses';
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

  it('rocks out at the first of a crop she picks, and not the next', () => {
    const h = harness(PLOT);
    const tend = () => {
      h.world.tapTile(2, 2);
      return h.until(() => !h.world.player.moving, 'tending').concat(h.tick(1));
    };
    tend();
    h.world.garden.plant(2, 2, 'pumpkinSeed');
    tend();
    h.clock.set(new Date(2026, 8, 27, 8));
    tend();
    expect(['horns', 'bang']).toContain(h.world.poses.pose());
    h.clock.advance(ROCK_MS);
    expect(h.world.poses.pose()).toBeNull();

    h.world.garden.plant(2, 2, 'pumpkinSeed');
    tend();
    h.clock.set(new Date(2026, 8, 28, 8));
    tend();
    expect(h.world.poses.pose()).toBeNull();
  });
});
