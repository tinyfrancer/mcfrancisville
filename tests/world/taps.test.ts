import { describe, expect, it } from 'vitest';
import type { MapSource } from '../../src/data/maps';
import { SHRUG_MS } from '../../src/systems/poses';
import { harness } from './harness';

/** A lane with a rock at its end, and a hedge two deep below it that nothing open touches. */
const LANE: MapSource = {
  rows: ['######', '#...R#', '######', '######'],
  spawn: { tx: 1, ty: 1 },
  legend: {
    '#': { tile: 'hedge', solid: true },
    '.': { tile: 'grass' },
    R: { tile: 'grass', prop: 'rock' },
  },
};

describe('a tap where she can go, and where she cannot (V1, decision 283)', () => {
  it('shrugs at a tap on a hedge she cannot get round, for a beat, and stays put', () => {
    const h = harness(LANE);
    expect(h.world.tapTile(2, 3)).toBe(false);
    expect(h.world.poses.pose()).toBe('shrug');
    expect(h.world.player.moving).toBe(false);
    expect(h.world.aim).toBeNull();
    h.clock.advance(SHRUG_MS / 2);
    expect(h.world.poses.pose()).toBe('shrug');
    h.clock.advance(SHRUG_MS / 2);
    expect(h.world.poses.pose()).toBeNull();
  });

  it('a tap anywhere she can go stops a shrug and sets her off, with nothing to aim at', () => {
    const h = harness(LANE);
    h.world.tapTile(2, 3);
    expect(h.world.tapTile(3, 1)).toBe(true);
    expect(h.world.poses.pose()).toBeNull();
    expect(h.world.aim).toBeNull();
  });

  it('aims at what she set off toward: a prop by its tiles, until she gets there', () => {
    const h = harness(LANE);
    expect(h.world.tapTile(4, 1)).toBe(true);
    expect(h.world.aim).toEqual({ box: { tx: 4, ty: 1, w: 1, h: 1 } });
    h.until(() => !h.world.player.moving, 'she reaches the rock');
    h.tick(1);
    expect(h.world.aim).toBeNull();
  });

  it('a hedge beside open ground is walked up to, not shrugged at', () => {
    const h = harness(LANE);
    expect(h.world.tapTile(2, 0)).toBe(true);
    expect(h.world.poses.pose()).toBeNull();
  });
});
