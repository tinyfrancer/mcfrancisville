import { describe, expect, it } from 'vitest';
import {
  ACTIVITIES,
  ACTIVITY_IDS,
  FAIR_TIPS,
  FORTUNES,
  type ActivityId,
  type Game,
} from '../../src/data/activities';
import { FAIR_PRIZES } from '../../src/data/fairPrizes';
import { ITEMS } from '../../src/data/items';
import {
  activityAt,
  bestTapAfter,
  closedLine,
  fairTipOn,
  fortuneOn,
  freeGoOn,
  isOpen,
  luckyCritter,
  patternOf,
  prizeOf,
  prizeRank,
  score,
  SLOW_SWEEP,
  WINDOWS,
  whenOut,
} from '../../src/systems/activities';
import { isAbout } from '../../src/systems/critters';

const RING_TOSS = (ACTIVITIES.ringToss.does as Game).game;
const gameOf = (id: ActivityId) => (ACTIVITIES[id].does as Game).game;
const TIMED = ['ringToss', 'hookAGhost', 'strengthBell'] as const;

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

  it('gives a prize however a go went, the last one for a near-perfect go', () => {
    for (const id of ACTIVITY_IDS) {
      const does = ACTIVITIES[id].does;
      if (!('game' in does)) continue;
      const game = does.game;
      expect(game.prizes, id).toHaveLength(game.throws === 1 ? 3 : game.throws + 1);
      // Every number of points wins something, the floor for none and the best for all.
      for (let points = 0; points <= game.throws * 2; points++) {
        expect(prizeOf(game, points), `${id} ${points}`).toBeDefined();
      }
      expect(prizeOf(game, 0)).toBe(game.prizes[0]);
      expect(prizeOf(game, game.throws * 2)).toBe(game.prizes[game.prizes.length - 1]);
      // More points never wins less.
      for (let points = 1; points <= game.throws * 2; points++) {
        expect(prizeRank(game, points)).toBeGreaterThanOrEqual(prizeRank(game, points - 1));
      }
      const top = game.prizes[game.prizes.length - 1]!;
      expect(
        ITEMS[top].kind === 'keepsake' || (FAIR_PRIZES as readonly string[]).includes(top),
        `${id}'s best is a keepsake or the fair's own`,
      ).toBe(true);
    }
    // Of three rings: a near-perfect go is five of six points; three good throws are the third.
    expect(prizeOf(RING_TOSS, 5)).toBe('ringTossRosette');
    expect(prizeOf(RING_TOSS, 4)).not.toBe('ringTossRosette');
    expect(prizeRank(RING_TOSS, 3)).toBe(2);
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

describe("the fair games in time (V1's R6b)", () => {
  const T0 = new Date(2026, 9, 18, 19).getTime();

  it('deals the same moving thing for the same go and throw, and another for the next', () => {
    for (const id of [...TIMED, 'duckPond'] as const) {
      const game = gameOf(id);
      const a = patternOf(game, '2026-10-18:x:1', 0);
      expect(patternOf(game, '2026-10-18:x:1', 0)).toEqual(a);
      const others = [1, 2, 3, 4].map((n) => patternOf(game, `2026-10-18:x:${n + 1}`, 0));
      expect(
        others.some((o) => JSON.stringify(o) !== JSON.stringify(a)),
        id,
      ).toBe(true);
      expect(a.period).toBeGreaterThan(0);
    }
  });

  it('scores a perfect tap best, a near one good, and a late one still the floor, never less', () => {
    for (const id of TIMED) {
      const game = gameOf(id);
      for (let go = 0; go < 60; go++) {
        const p = patternOf(game, `2026-10-18:${id}:${go}`, go % 3);
        const best = bestTapAfter(p, T0, T0);
        expect(score(p, best, T0).grade, `${id} go ${go} at its best`).toBe(2);
        // Well off it: where the thing is furthest from what she's aiming for.
        let worst = 2;
        for (let t = T0; t < T0 + p.period; t += 20) {
          const g = score(p, t, T0).grade;
          expect([0, 1, 2]).toContain(g);
          worst = Math.min(worst, g);
        }
        expect(worst, `${id} go ${go} can be tapped wide`).toBe(0);
      }
    }
  });

  it('gives a good tap a window of a few hundred ms, and a perfect one a fair fraction of it', () => {
    for (const id of TIMED) {
      const game = gameOf(id);
      const p = patternOf(game, `2026-10-18:${id}:1`, 0);
      const best = bestTapAfter(p, T0, T0);
      const within = (grade: number) => {
        let ms = 0;
        for (let t = best - 600; t <= best + 600; t += 2)
          if (score(p, t, T0).grade >= grade) ms += 2;
        return ms;
      };
      expect(within(2), `${id} perfect window`).toBeGreaterThanOrEqual(120);
      expect(within(1), `${id} good window`).toBeGreaterThanOrEqual(300);
    }
  });

  it('slows it all with reduced motion, never still, and keeps the same windows along the track', () => {
    for (const id of TIMED) {
      const game = gameOf(id);
      const quick = patternOf(game, 'seed', 0);
      const slow = patternOf(game, 'seed', 0, true);
      expect(Math.abs(slow.period - quick.period * SLOW_SWEEP)).toBeLessThan(2);
      expect(slow.target).toBe(quick.target);
    }
    expect(WINDOWS.swing.perfect).toBeLessThan(WINDOWS.swing.good);
  });

  it('wins at the duck pond by the duck she picks, every duck something, some a crown', () => {
    const game = gameOf('duckPond');
    const seen = new Set<number>();
    for (let go = 0; go < 200; go++) {
      const p = patternOf(game, `2026-10-18:duckPond:${go}`, 0);
      expect(p.marks).toHaveLength(game.targets);
      for (let k = 0; k < game.targets; k++) {
        // Tapping right where duck k is picks it, whatever the time.
        const x = (k / game.targets + p.phase) % 1;
        const picked = score(p, T0, T0, x);
        expect(picked.at).toBe(k);
        expect(picked.grade).toBe(p.marks[k]);
        seen.add(picked.grade);
      }
    }
    expect([...seen].sort()).toEqual([0, 1, 2]);
  });

  it('frees the first go at a game open of an evening, a different one some days', () => {
    const free = new Set<ActivityId>();
    for (let d = 1; d <= 60; d++) {
      const day = `2026-${String(11 + Math.floor((d - 1) / 30)).padStart(2, '0')}-${String(((d - 1) % 30) + 1).padStart(2, '0')}`;
      const id = freeGoOn(day);
      expect('game' in ACTIVITIES[id].does).toBe(true);
      expect(isOpen(ACTIVITIES[id].hours, day, 'evening'), `${id} on ${day}`).toBe(true);
      free.add(id);
    }
    expect(free.size).toBeGreaterThanOrEqual(3);
  });

  it('has the fortune point to the free go now and then, by name', () => {
    let tips = 0;
    for (let d = 1; d <= 90; d++) {
      const day = `2026-11-${String(((d - 1) % 30) + 1).padStart(2, '0')}`;
      const tip = fairTipOn(day);
      if (!tip) continue;
      tips++;
      expect(tip).toContain(ACTIVITIES[freeGoOn(day)].name.toLowerCase());
      expect(tip).not.toContain('{stall}');
    }
    expect(tips).toBeGreaterThan(0);
    expect(tips).toBeLessThan(90);
    expect(FAIR_TIPS.length).toBeGreaterThan(1);
  });
});
