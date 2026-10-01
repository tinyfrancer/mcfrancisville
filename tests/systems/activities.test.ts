import { describe, expect, it } from 'vitest';
import { ACTIVITIES, ACTIVITY_IDS, FORTUNES, type Game } from '../../src/data/activities';
import { ITEMS } from '../../src/data/items';
import {
  activityAt,
  closedLine,
  fortuneOn,
  glintOf,
  isOpen,
  lands,
  luckyCritter,
  prizeOf,
  whenOut,
} from '../../src/systems/activities';
import { isAbout } from '../../src/systems/critters';

const RING_TOSS = (ACTIVITIES.ringToss.does as Game).game;

describe("the fairground's activities (0.2's M2)", () => {
  it('finds each one at its stall or its fixture', () => {
    for (const id of ACTIVITY_IDS) expect(activityAt(ACTIVITIES[id].at)).toBe(id);
    expect(activityAt({ prop: 'fairStage' })).toBeNull();
    expect(activityAt({ fixture: 'starCharts' })).toBeNull();
  });

  it('opens by the window, at weekends for some, and all day through the festival', () => {
    // A Monday and a Saturday in September, and a Monday in October's festival.
    const monday = '2026-09-14';
    const saturday = '2026-09-19';
    const october = '2026-10-05';
    const { ringToss, hookAGhost, cornDogs, fortune } = ACTIVITIES;
    expect(isOpen(ringToss.hours, monday, 'morning')).toBe(false);
    expect(isOpen(ringToss.hours, monday, 'afternoon')).toBe(true);
    expect(isOpen(hookAGhost.hours, monday, 'afternoon')).toBe(false);
    expect(isOpen(hookAGhost.hours, saturday, 'afternoon')).toBe(true);
    expect(isOpen(hookAGhost.hours, saturday, 'morning')).toBe(false);
    expect(isOpen(ringToss.hours, october, 'morning')).toBe(true);
    expect(isOpen(hookAGhost.hours, october, 'morning')).toBe(true);
    for (const w of ['morning', 'afternoon', 'evening'] as const) {
      expect(isOpen(cornDogs.hours, monday, w)).toBe(true);
      expect(isOpen(fortune.hours, monday, w)).toBe(true);
    }
  });

  it('says when a shut one opens', () => {
    expect(closedLine('ringToss', '2026-09-14', 'morning')).toMatch(/opens this afternoon/);
    expect(closedLine('hookAGhost', '2026-09-14', 'afternoon')).toMatch(/at weekends/);
    expect(closedLine('toffeeApples', '2026-09-14', 'morning')).toMatch(/this afternoon/);
  });

  it('always lands a throw at the glinting target, and now and then another', () => {
    let others = 0;
    let landed = 0;
    for (let seed = 0; seed < 400; seed++) {
      const glint = glintOf(RING_TOSS, String(seed), 0);
      expect(glint).toBeGreaterThanOrEqual(0);
      expect(glint).toBeLessThan(RING_TOSS.targets);
      expect(lands(RING_TOSS, String(seed), 0, glint)).toBe(true);
      const other = (glint + 1) % RING_TOSS.targets;
      others++;
      if (lands(RING_TOSS, String(seed), 0, other)) landed++;
    }
    expect(landed / others).toBeGreaterThan(0.25);
    expect(landed / others).toBeLessThan(0.55);
  });

  it('gives a prize however many land, the last one for every throw', () => {
    for (let n = 0; n <= RING_TOSS.throws; n++) expect(prizeOf(RING_TOSS, n)).toBeDefined();
    expect(prizeOf(RING_TOSS, 0)).toBe(RING_TOSS.prizes[0]);
    expect(prizeOf(RING_TOSS, RING_TOSS.throws)).toBe('ringTossRosette');
    for (const id of ACTIVITY_IDS) {
      const does = ACTIVITIES[id].does;
      if (!('game' in does)) continue;
      expect(does.game.prizes).toHaveLength(does.game.throws + 1);
      expect(ITEMS[does.game.prizes[does.game.throws]!].kind).toBe('keepsake');
    }
  });

  it('deals every fortune, the same all day', () => {
    const seen = new Set<string>();
    for (let d = 1; d <= 90; d++) {
      const day = `2026-${String(9 + Math.floor((d - 1) / 30)).padStart(2, '0')}-${String(((d - 1) % 30) + 1).padStart(2, '0')}`;
      expect(fortuneOn(day)).toBe(fortuneOn(day));
      seen.add(fortuneOn(day));
    }
    expect(seen.size).toBe(FORTUNES.length);
  });

  it('points her to a critter about later today, one she has not caught if it can', () => {
    const day = '2026-09-14';
    const lucky = luckyCritter(day, 10, 'clear', () => false)!;
    expect(lucky).not.toBeNull();
    expect(lucky.hour).toBeGreaterThanOrEqual(10);
    expect(isAbout(lucky.critter, day, lucky.hour, 'clear')).toBe(true);
    // Everything caught but one that's about: that one.
    expect(luckyCritter(day, 10, 'clear', (id) => id !== lucky.critter)!.critter).toBe(
      lucky.critter,
    );
    // Everything caught: it still points somewhere.
    expect(luckyCritter(day, 10, 'clear', () => true)).not.toBeNull();
    expect(whenOut({ ...lucky, hour: 22 }, 10)).toBe('tonight');
    expect(whenOut({ ...lucky, hour: 14 }, 10)).toBe('this afternoon');
    expect(whenOut({ ...lucky, hour: 10 }, 10.5)).toBe('right now');
  });
});
