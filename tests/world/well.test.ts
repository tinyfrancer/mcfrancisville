import { describe, expect, it } from 'vitest';
import { WELL_FINDS, WISH_CANDY, WISHES } from '../../src/data/wishes';
import { dayKey } from '../../src/systems/clock';
import { WISH_KEY } from '../../src/systems/well';
import type { WorldEvent } from '../../src/world/World';
import { harness, type Harness } from './harness';

/** Noon on a day, a day at a time from her first. */
function onDay(h: Harness, k: number): void {
  h.clock.set(new Date(2026, 8, 26 + k, 12));
  h.tick(1);
}

const wished = (events: WorldEvent[]) =>
  events.filter((e): e is Extract<WorldEvent, { kind: 'wished' }> => e.kind === 'wished');

describe('the wishing well (1.7 Y2)', () => {
  it('takes a Candy for a wish once a day, and the first time sends up a lucky penny', () => {
    const h = harness(undefined, { candy: 10 });
    expect(h.world.well.view()).toEqual({ wished: false, candy: 10, costs: WISH_CANDY });
    const moment = h.world.well.toss();
    expect(moment).toMatchObject({ kind: 'wished', found: 'wellPenny', first: true });
    expect(h.world.wallet.candy).toBe(10 - WISH_CANDY);
    expect(h.world.bag.count('wellPenny')).toBe(1);
    expect(wished(h.tick(1))).toHaveLength(1);
    // Once a day: a second toss today takes nothing.
    expect(h.world.well.view().wished).toBe(true);
    expect(h.world.well.toss()).toBeNull();
    expect(h.world.wallet.candy).toBe(10 - WISH_CANDY);
  });

  it('answers with a wish of the day, her name in it, and never the same as yesterday', () => {
    const h = harness(undefined, { candy: 100 });
    const named = WISHES.filter((w) => w.line.includes('{name}')).length;
    expect(named).toBeGreaterThan(0);
    let yesterday = '';
    for (let k = 0; k < 30; k++) {
      onDay(h, k);
      const moment = h.world.well.toss();
      expect(moment?.kind).toBe('wished');
      if (moment?.kind !== 'wished') return;
      expect(moment.line).not.toMatch(/[{}]/);
      expect(moment.line).not.toBe(yesterday);
      yesterday = moment.line;
    }
    // The penny came up once, the first time, and never again.
    expect(h.world.bag.count('wellPenny')).toBe(1);
  });

  it('sends something back up now and then, never more than a pebble or a bead', () => {
    const h = harness(undefined, { candy: 400 });
    const found: string[] = [];
    for (let k = 0; k < 140; k++) {
      onDay(h, k);
      const moment = h.world.well.toss();
      if (moment?.kind === 'wished' && moment.found && !moment.first) found.push(moment.found);
    }
    expect(found.length).toBeGreaterThan(8);
    expect(found.length).toBeLessThan(35);
    for (const item of found) expect(WELL_FINDS.map((f) => f.item)).toContain(item);
    // Nothing is ever lost but the Candy: the penny is still hers.
    expect(h.world.bag.count('wellPenny')).toBe(1);
  });

  it('with no Candy, takes nothing and says so kindly on its card', () => {
    const h = harness(undefined, { candy: 0 });
    expect(h.world.well.view()).toMatchObject({ wished: false, candy: 0 });
    expect(h.world.well.toss()).toBeNull();
    expect(h.world.takings.isReady(WISH_KEY)).toBe(true);
    expect(h.world.bag.count('wellPenny')).toBe(0);
  });

  it('keeps the day the wish was made with her takings, so a reload today still remembers it', () => {
    const h = harness(undefined, { candy: 5 });
    h.world.well.toss();
    const taken = h.world.takings.snapshot().taken;
    expect(taken[WISH_KEY]?.startsWith(dayKey(h.clock.now()))).toBe(true);
  });
});
