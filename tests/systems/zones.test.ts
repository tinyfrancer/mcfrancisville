import { describe, expect, it } from 'vitest';
import type { MapExit } from '../../src/systems/grid';
import {
  alongExit,
  exitAt,
  holds,
  landingOf,
  nextZoneToward,
  type UnlockFacts,
} from '../../src/systems/zones';

const facts = (over: Partial<UnlockFacts> = {}): UnlockFacts => ({
  has: () => false,
  hearts: () => 0,
  found: () => false,
  caughtKinds: () => 0,
  ...over,
});

describe('unlock rules', () => {
  it('hold when what they ask for is so', () => {
    expect(holds({ open: true }, facts())).toBe(true);
    expect(holds({ has: 'iceSkates' }, facts())).toBe(false);
    expect(holds({ has: 'iceSkates' }, facts({ has: (i) => i === 'iceSkates' }))).toBe(true);
    expect(holds({ hearts: 3, with: 'cody' }, facts({ hearts: () => 2 }))).toBe(false);
    expect(holds({ hearts: 3, with: 'cody' }, facts({ hearts: () => 3 }))).toBe(true);
    expect(holds({ found: 'whisperwood' }, facts({ found: () => true }))).toBe(true);
    expect(holds({ caught: 5 }, facts({ caughtKinds: () => 4 }))).toBe(false);
  });

  it('hold all together only when every one does', () => {
    const rule = { all: [{ has: 'iceSkates' as const }, { caught: 1 }] };
    expect(holds(rule, facts({ has: () => true }))).toBe(false);
    expect(holds(rule, facts({ has: () => true, caughtKinds: () => 1 }))).toBe(true);
  });
});

describe('ways out', () => {
  const east: MapExit = { to: 'whisperwood', tx: 29, ty: 16, w: 1, h: 2 };
  const south: MapExit = { to: 'lanternShore', tx: 18, ty: 15, w: 2, h: 1 };

  it('are found by any of their tiles', () => {
    expect(exitAt([east], { tx: 29, ty: 17 })).toBe(east);
    expect(exitAt([east], { tx: 28, ty: 17 })).toBeUndefined();
    expect(alongExit(east, { tx: 29, ty: 17 })).toBe(1);
    expect(alongExit(south, { tx: 19, ty: 15 })).toBe(1);
  });

  it('bring her in one tile inside the edge, level with where she left, facing in', () => {
    const size = { width: 30, height: 20 };
    expect(landingOf(east, size, 1)).toEqual({ tile: { tx: 28, ty: 17 }, facing: 'left' });
    expect(landingOf(south, { width: 24, height: 16 }, 0)).toEqual({
      tile: { tx: 18, ty: 14 },
      facing: 'up',
    });
    const west: MapExit = { to: 'town', tx: 0, ty: 7, w: 1, h: 2 };
    expect(landingOf(west, size, 5)).toEqual({ tile: { tx: 1, ty: 8 }, facing: 'right' });
  });
});

describe('the way between places', () => {
  it('goes through whatever lies between', () => {
    expect(nextZoneToward('town', 'whisperwood')).toBe('whisperwood');
    expect(nextZoneToward('town', 'lanternShore')).toBe('whisperwood');
    expect(nextZoneToward('lanternShore', 'town')).toBe('whisperwood');
    expect(nextZoneToward('home', 'whisperwood')).toBe('town');
    expect(nextZoneToward('town', 'town')).toBeNull();
  });
});
