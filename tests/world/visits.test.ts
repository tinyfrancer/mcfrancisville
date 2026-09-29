import { describe, expect, it } from 'vitest';
import { VISIT_MILESTONES, VISIT_ROUND } from '../../src/data/visits';
import { FURNITURE } from '../../src/data/furniture';
import { ITEMS } from '../../src/data/items';
import { giftFor } from '../../src/systems/visits';
import { harness } from './harness';

const HOUR = 3_600_000;

describe('the visit gifts', () => {
  it('bring something every visit, from the round or the table', () => {
    for (let visit = 1; visit <= 500; visit++) {
      const gift = giftFor(visit);
      if ('candy' in gift) expect(gift.candy).toBeGreaterThan(0);
      else if ('furniture' in gift) expect(FURNITURE[gift.furniture], String(visit)).toBeDefined();
      else {
        expect(ITEMS[gift.item], String(visit)).toBeDefined();
        expect(gift.count).toBeGreaterThan(0);
      }
    }
    for (const [visit, gift] of Object.entries(VISIT_MILESTONES)) {
      expect(giftFor(Number(visit))).toEqual(gift);
    }
  });

  it('never give the same seeds twice in a round, and move on round to round', () => {
    const seedSlots = VISIT_ROUND.flatMap((g, i) => ('oneOf' in g && g.count === 3 ? [i] : []));
    for (let round = 1; round < 10; round++) {
      const given = seedSlots.map((slot) => giftFor(round * VISIT_ROUND.length + slot + 1));
      expect(new Set(given.map((g) => JSON.stringify(g))).size).toBe(seedSlots.length);
    }
  });
});

describe('her visits', () => {
  it('count the first day she opens the game, with its gift and Cody hello', () => {
    const h = harness();
    const welcome = h.world.visits.welcome(null);
    expect(welcome.greeting.kind).toBe('first');
    expect(welcome.visit).toEqual({ count: 1, gift: giftFor(1) });
    expect(h.world.bag.count('ghostMallow')).toBeGreaterThanOrEqual(2);
  });

  it('count once a day however often she comes back', () => {
    const h = harness(undefined, { visits: { count: 4, last: '2026-09-26' } });
    const welcome = h.world.visits.welcome(h.clock.now() - HOUR);
    expect(welcome.visit).toBeNull();
    expect(h.world.visits.count).toBe(4);
  });

  it('count up, never down, however long she was away', () => {
    const h = harness(undefined, { visits: { count: 4, last: '2026-08-01' } });
    const before = h.world.wallet.candy;
    const welcome = h.world.visits.welcome(h.clock.now() - 50 * 24 * HOUR);
    expect(welcome.visit).toEqual({ count: 5, gift: giftFor(5) });
    expect(h.world.save().visits).toEqual({ count: 5, last: '2026-09-26' });
    expect(h.world.wallet.candy).toBeGreaterThanOrEqual(before);
  });

  it('count a day that turns while she plays, with a moment', () => {
    const h = harness(undefined, { visits: { count: 1, last: '2026-09-26' } });
    h.world.visits.welcome(h.clock.now() - HOUR);
    expect(h.tick(2).some((e) => e.kind === 'visit')).toBe(false);
    h.clock.advance(18 * HOUR);
    expect(h.tick(2)).toContainEqual({ kind: 'visit', count: 2, gift: giftFor(2) });
    expect(h.tick(2).some((e) => e.kind === 'visit')).toBe(false);
  });

  it('wait for her welcome before counting at all', () => {
    const h = harness();
    h.clock.advance(24 * HOUR);
    expect(h.tick(2).some((e) => e.kind === 'visit')).toBe(false);
    expect(h.world.visits.count).toBe(0);
  });

  it('put a piece of furniture in her storage chest', () => {
    const h = harness(undefined, { visits: { count: 6, last: '2026-09-01' } });
    h.world.visits.welcome(h.clock.now() - 30 * 24 * HOUR);
    expect(h.world.home.stored.some((s) => s.id === 'floatingCandles')).toBe(true);
  });
});
