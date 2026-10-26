import { describe, expect, it } from 'vitest';
import { HEN_IDS, HENS, LAYERS, RUN_FLOOR } from '../../src/data/hens';
import { ITEMS } from '../../src/data/items';
import {
  canFeed,
  collectedOn,
  crowHour,
  eggsWaiting,
  feedChoices,
  fedOn,
  henAt,
  henOut,
  isFeed,
  NO_HENHOUSE,
} from '../../src/systems/hens';
import type { ItemId } from '../../src/types/ids';

const at = (h: number, m = 0) => new Date(2026, 9, 26, h, m).getTime();

describe("the hens' rules (1.6's X3)", () => {
  it('lay an egg each by the next morning once fed, and nothing unfed', () => {
    expect(LAYERS).toEqual(['henrietta', 'peck', 'omelette']);
    expect(eggsWaiting(NO_HENHOUSE, '2026-10-26')).toBe(0);
    const fed = fedOn(NO_HENHOUSE, '2026-10-26');
    expect(eggsWaiting(fed, '2026-10-26')).toBe(0);
    expect(eggsWaiting(fed, '2026-10-27')).toBe(3);
    // Left uncollected, they wait; nothing is lost, and unfed days lay nothing more.
    expect(eggsWaiting(fed, '2026-11-02')).toBe(3);
  });

  it('feed once a day, keeping what an earlier feed laid', () => {
    const first = fedOn(NO_HENHOUSE, '2026-10-26');
    expect(canFeed(first, '2026-10-26')).toBe(false);
    expect(canFeed(first, '2026-10-27')).toBe(true);
    const again = fedOn(first, '2026-10-27');
    expect(again).toEqual({ fed: '2026-10-27', waiting: 3 });
    expect(eggsWaiting(again, '2026-10-28')).toBe(6);
  });

  it('collect all that are waiting, today’s feed still to lay', () => {
    const fed = fedOn(fedOn(NO_HENHOUSE, '2026-10-26'), '2026-10-27');
    const collected = collectedOn(fed, '2026-10-27');
    expect(collected).toEqual({ fed: '2026-10-27', waiting: 0 });
    expect(eggsWaiting(collected, '2026-10-28')).toBe(3);
    expect(collectedOn(fedOn(NO_HENHOUSE, '2026-10-26'), '2026-10-27')).toEqual(NO_HENHOUSE);
  });

  it('eat any crop or seed, never an egg, the plainest offered first', () => {
    expect(isFeed('pumpkinSeed')).toBe(true);
    expect(isFeed('apple')).toBe(true);
    expect(isFeed('egg')).toBe(false);
    expect(isFeed('wood')).toBe(false);
    const has: Partial<Record<ItemId, number>> = { pumpkin: 1, apple: 2, egg: 5, pumpkinSeed: 3 };
    const choices = feedChoices((id) => has[id] ?? 0);
    expect(choices).toEqual(['apple', 'pumpkinSeed', 'pumpkin']);
    for (const id of choices) expect(['crop', 'seed']).toContain(ITEMS[id].kind);
  });

  it('are out from six until seven in the evening, and Reginald crows at six', () => {
    expect(henOut(at(5, 59))).toBe(false);
    expect(henOut(at(6))).toBe(true);
    expect(henOut(at(18, 59))).toBe(true);
    expect(henOut(at(19))).toBe(false);
    expect(crowHour(at(6, 30))).toBe(true);
    expect(crowHour(at(7))).toBe(false);
    expect(HEN_IDS.filter((id) => HENS[id].rooster)).toEqual(['reginald']);
  });

  it('stay inside the run, pottering about it all day', () => {
    const run = { x: 100, y: 200, ...{ w: RUN_FLOOR.w, h: RUN_FLOOR.h } };
    for (const id of HEN_IDS) {
      const doings = new Set<string>();
      const spots = new Set<string>();
      for (let t = at(6); t < at(19); t += 7919) {
        const spot = henAt(id, t, run, null);
        expect(spot.x, id).toBeGreaterThanOrEqual(run.x);
        expect(spot.x, id).toBeLessThanOrEqual(run.x + run.w);
        expect(spot.y, id).toBeGreaterThanOrEqual(run.y);
        expect(spot.y, id).toBeLessThanOrEqual(run.y + run.h);
        doings.add(spot.doing);
        spots.add(`${Math.round(spot.x)},${Math.round(spot.y)}`);
      }
      expect(doings.has('walk'), id).toBe(true);
      expect(doings.has('peck') || doings.has('stand'), id).toBe(true);
      expect(spots.size, id).toBeGreaterThan(20);
      if (HENS[id].rooster) expect(doings.has('sit'), id).toBe(false);
    }
  });

  it('show Reginald crowing just after he crows, and the hens never', () => {
    const run = { x: 0, y: 0, w: RUN_FLOOR.w, h: RUN_FLOOR.h };
    const crowed = at(6, 1);
    expect(henAt('reginald', crowed + 500, run, crowed).doing).toBe('crow');
    expect(henAt('reginald', crowed + 60_000, run, crowed).doing).not.toBe('crow');
    expect(henAt('henrietta', crowed + 500, run, crowed).doing).not.toBe('crow');
  });
});
