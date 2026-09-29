import { describe, expect, it } from 'vitest';
import { bedAction, inReach, lookAt, rowToSow, type BedState } from '../../src/systems/beds';
import type { Planting } from '../../src/systems/farming';
import type { Tile } from '../../src/systems/pathfinding';

const at = (month: number, day: number, hour = 12) => new Date(2026, month, day, hour).getTime();
const NOON = at(8, 26);

const WILD: BedState = { tilled: false, planting: null, sprinkler: false, sprinkled: null };
const TILLED: BedState = { ...WILD, tilled: true };
const ROSE: Planting = { crop: 'rose', plantedAt: NOON, waterings: 0, lastWatered: null };
const GROWING: BedState = { ...TILLED, planting: ROSE };

describe('what a visit to a bed will do', () => {
  it('digs over a wild bed, and asks for a seed at an empty one', () => {
    expect(bedAction(WILD, 'hands', NOON)).toEqual({ kind: 'till' });
    expect(bedAction(TILLED, 'can', NOON)).toEqual({ kind: 'choose' });
  });

  it('plants the seed in her hand in any empty bed, wild or not', () => {
    expect(bedAction(WILD, 'roseSeed', NOON)).toEqual({ kind: 'sow', seed: 'roseSeed' });
    expect(bedAction(TILLED, 'roseSeed', NOON)).toEqual({ kind: 'sow', seed: 'roseSeed' });
  });

  it('waters what grows, once a day, whatever is in her hand, and then waits', () => {
    expect(bedAction(GROWING, 'roseSeed', NOON)).toEqual({ kind: 'water' });
    const watered = { ...GROWING, planting: { ...ROSE, waterings: 1, lastWatered: '2026-09-26' } };
    expect(bedAction(watered, 'hands', NOON)).toEqual({ kind: 'wait' });
    expect(bedAction({ ...GROWING, sprinkled: '2026-09-26' }, 'hands', NOON)).toEqual({
      kind: 'wait',
    });
  });

  it('picks what is ripe', () => {
    expect(bedAction(GROWING, 'can', at(9, 20))).toEqual({ kind: 'pick' });
  });

  it('fits the sprinkler in her hand in a bed that has none, whatever is growing', () => {
    expect(bedAction(GROWING, 'sprinkler', NOON)).toEqual({ kind: 'fit' });
    expect(bedAction(WILD, 'sprinkler', NOON)).toEqual({ kind: 'fit' });
    expect(bedAction({ ...GROWING, sprinkler: true }, 'sprinkler', NOON)).toEqual({
      kind: 'water',
    });
  });
});

describe("a bed's pop-up", () => {
  it('says what grows, how long it has, what watered it, and what a tap will do', () => {
    const look = lookAt(
      { tx: 2, ty: 3 },
      { ...GROWING, sprinkled: '2026-09-26' },
      'hands',
      NOON,
      0,
    );
    expect(look).toEqual({
      tx: 2,
      ty: 3,
      tilled: true,
      crop: 'rose',
      stage: 'seed',
      days: 3,
      watered: 'sprinkler',
      sprinkler: false,
      sprinkled: true,
      action: { kind: 'wait' },
      row: 0,
    });
  });

  it('offers the row only when the seed in her hand would go in', () => {
    expect(lookAt({ tx: 2, ty: 3 }, TILLED, 'roseSeed', NOON, 5).row).toBe(5);
    expect(lookAt({ tx: 2, ty: 3 }, GROWING, 'roseSeed', NOON, 5).row).toBe(0);
  });

  it('shows no watering for a wild bed, even in the rain', () => {
    expect(lookAt({ tx: 2, ty: 3 }, WILD, 'hands', at(8, 28), 0).watered).toBeNull();
  });
});

describe('a sprinkler', () => {
  it('reaches its own bed and every bed touching it, corners too', () => {
    const s = { tx: 5, ty: 5 };
    expect(inReach(s, s)).toBe(true);
    expect(inReach(s, { tx: 6, ty: 6 })).toBe(true);
    expect(inReach(s, { tx: 4, ty: 5 })).toBe(true);
    expect(inReach(s, { tx: 7, ty: 5 })).toBe(false);
  });
});

describe('planting a row', () => {
  // A row of eight beds, 2 to 9, with something growing at 5.
  const isBed = (t: Tile) => t.ty === 1 && t.tx >= 2 && t.tx <= 9;
  const empty = (t: Tile) => t.tx !== 5;
  const xs = (tiles: Tile[]) => tiles.map((t) => t.tx);

  it('fills the empty beds either side, the nearest first, left before right', () => {
    expect(xs(rowToSow({ tx: 4, ty: 1 }, isBed, empty, 20))).toEqual([4, 3, 2, 6, 7, 8, 9]);
    expect(xs(rowToSow({ tx: 7, ty: 1 }, isBed, empty, 20))).toEqual([7, 6, 8, 9, 4, 3, 2]);
  });

  it('goes only as far as her seeds', () => {
    expect(xs(rowToSow({ tx: 4, ty: 1 }, isBed, empty, 2))).toEqual([4, 3]);
    expect(rowToSow({ tx: 4, ty: 1 }, isBed, empty, 0)).toEqual([]);
  });
});
