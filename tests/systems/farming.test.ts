import { describe, expect, it } from 'vitest';
import { CROPS } from '../../src/data/crops';
import {
  canWater,
  daysBetween,
  daysToRipe,
  growth,
  isRare,
  stageOf,
  water,
  yieldOf,
  keepSprinkling,
  plantedInSeason,
  rainsOn,
  ripeDays,
  wateredBy,
  wateredToday,
  type Planting,
} from '../../src/systems/farming';

const at = (month: number, day: number, hour = 12) => new Date(2026, month, day, hour).getTime();

/** A pumpkin (2 days) planted at noon on 26 September. */
const PUMPKIN: Planting = {
  crop: 'pumpkin',
  plantedAt: at(8, 26),
  waterings: 0,
  lastWatered: null,
};

/** A rose (4 days), planted at the same time. */
const ROSE: Planting = { ...PUMPKIN, crop: 'rose' };

describe('daysBetween', () => {
  it('counts calendar days, whatever the clocks did in between', () => {
    expect(daysBetween('2026-09-26', '2026-09-27')).toBe(1);
    expect(daysBetween('2026-09-26', '2026-10-26')).toBe(30);
    // Across the end of daylight saving and a year's end.
    expect(daysBetween('2026-10-31', '2026-11-02')).toBe(2);
    expect(daysBetween('2026-12-31', '2027-01-01')).toBe(1);
    expect(daysBetween('2026-09-27', '2026-09-26')).toBe(-1);
  });
});

describe('growth', () => {
  it('counts each morning since planting, from 5am', () => {
    expect(growth(PUMPKIN, at(8, 26, 23))).toBe(0);
    expect(growth(PUMPKIN, at(8, 27, 4))).toBe(0);
    expect(growth(PUMPKIN, at(8, 27, 5))).toBe(1);
    expect(growth(PUMPKIN, at(8, 29))).toBe(3);
  });

  it('counts a watered day as one more, from the next morning', () => {
    const watered = water(PUMPKIN, at(8, 26, 13));
    expect(growth(watered, at(8, 26, 20))).toBe(0);
    expect(growth(watered, at(8, 27, 9))).toBe(2);
  });

  it('never goes backwards if the phone clock does', () => {
    expect(growth(PUMPKIN, at(8, 20))).toBe(0);
  });
});

describe('a crop through its life', () => {
  it('is ripe the day after planting when it was watered, and a day later when it was not', () => {
    const watered = water(PUMPKIN, at(8, 26, 13));
    expect(stageOf(watered, at(8, 27, 9))).toBe('ripe');
    expect(stageOf(PUMPKIN, at(8, 27, 9))).not.toBe('ripe');
    expect(stageOf(PUMPKIN, at(8, 28, 9))).toBe('ripe');
  });

  it('goes seed, sprout, growing, ripe', () => {
    expect(stageOf(ROSE, at(8, 26))).toBe('seed');
    expect(stageOf(ROSE, at(8, 27))).toBe('sprout');
    expect(stageOf(ROSE, at(8, 28))).toBe('growing');
    expect(stageOf(ROSE, at(8, 30))).toBe('ripe');
  });

  it('stays ripe forever: nothing withers', () => {
    expect(stageOf(ROSE, at(11, 25))).toBe('ripe');
    expect(stageOf(ROSE, new Date(2030, 0, 1).getTime())).toBe('ripe');
  });

  it('takes one drink a day, and none once it is ripe', () => {
    const now = at(8, 26, 13);
    expect(canWater(ROSE, now)).toBe(true);
    const watered = water(ROSE, now);
    expect(canWater(watered, now)).toBe(false);
    expect(canWater(watered, at(8, 27))).toBe(true);
    expect(canWater(ROSE, at(8, 30))).toBe(false);
  });

  it('says how many mornings are left, and watering brings the day closer', () => {
    const now = at(8, 27);
    expect(daysToRipe(ROSE, now)).toBe(3);
    expect(daysToRipe(water(ROSE, now), now)).toBe(2);
    expect(daysToRipe(ROSE, at(8, 30))).toBe(0);
  });

  it('ripens in half the time when watered every day', () => {
    let rose = ROSE;
    rose = water(rose, at(8, 26));
    rose = water(rose, at(8, 27));
    expect(stageOf(rose, at(8, 28))).toBe('ripe');
  });
});

describe('rare finds', () => {
  const rare = { item: 'blueRose' as const, oneIn: 8 };

  it('are decided by the seed, so the same one always comes up the same', () => {
    expect(isRare(rare, 'bed:3,4@123')).toBe(isRare(rare, 'bed:3,4@123'));
  });

  it('turn up now and then, but not often', () => {
    let found = 0;
    for (let i = 0; i < 800; i++) if (isRare(rare, `bed:1,1@${i}`)) found++;
    expect(found).toBeGreaterThan(50);
    expect(found).toBeLessThan(150);
  });

  it('give one of the rare thing in place of the usual', () => {
    const give = { item: 'rose' as const, count: 2, rare };
    let seed = 0;
    while (!isRare(rare, `s${seed}`)) seed++;
    expect(yieldOf(give, `s${seed}`)).toEqual({ item: 'blueRose', count: 1 });
    while (isRare(rare, `s${seed}`)) seed++;
    expect(yieldOf(give, `s${seed}`)).toEqual({ item: 'rose', count: 2 });
  });
});

describe('rain', () => {
  // By the day key, 26 and 27 September 2026 are clear, and the 28th rains.
  const RAINY = at(8, 28);
  const LATE_ROSE: Planting = { ...ROSE, plantedAt: at(8, 27) };

  it('falls on some days and not others', () => {
    expect(rainsOn('2026-09-27')).toBe(false);
    expect(rainsOn('2026-09-28')).toBe(true);
  });

  it('waters every bed, so there is nothing for her can to do', () => {
    expect(wateredToday(LATE_ROSE, RAINY)).toBe(true);
    expect(canWater(LATE_ROSE, RAINY)).toBe(false);
    expect(daysToRipe(LATE_ROSE, RAINY)).toBe(2);
  });

  it('counts as a watering from the next morning', () => {
    expect(growth(LATE_ROSE, RAINY)).toBe(1);
    expect(growth(LATE_ROSE, at(8, 29))).toBe(3);
    expect(stageOf(LATE_ROSE, at(8, 30))).toBe('ripe');
  });

  it('counts along with her own watering on the days it does not rain', () => {
    const watered = water(LATE_ROSE, at(8, 27, 13));
    expect(growth(watered, at(8, 29))).toBe(4);
  });
});

describe('sprinklers', () => {
  // A rose (4 days) planted at noon on the 26th, clear like the 27th; the 28th rains.
  const FROM = '2026-09-26';

  it('water a bed each day from the day one is fitted, counting from the next morning', () => {
    expect(wateredBy(ROSE, at(8, 26), FROM)).toBe('sprinkler');
    expect(canWater(ROSE, at(8, 26), FROM)).toBe(false);
    expect(growth(ROSE, at(8, 26), FROM)).toBe(0);
    expect(growth(ROSE, at(8, 27), FROM)).toBe(2);
    expect(daysToRipe(ROSE, at(8, 27), FROM)).toBe(1);
    expect(stageOf(ROSE, at(8, 28), FROM)).toBe('ripe');
  });

  it("don't water before the day they're fitted", () => {
    expect(wateredToday(ROSE, at(8, 26), '2026-09-27')).toBe(false);
    expect(growth(ROSE, at(8, 28), '2026-09-27')).toBe(3);
  });

  it("don't count a day twice with the rain", () => {
    const late: Planting = { ...ROSE, plantedAt: at(8, 28) };
    expect(wateredBy(late, at(8, 28), FROM)).toBe('rain');
    expect(growth(late, at(8, 29), FROM)).toBe(2);
  });

  it("don't count a day twice with her can, when she watered before fitting one", () => {
    const watered = water(ROSE, at(8, 26, 9));
    expect(wateredBy(watered, at(8, 26), FROM)).toBe('can');
    expect(growth(watered, at(8, 27), FROM)).toBe(2);
  });

  it('keep what they did once taken out: the growth stays, today included', () => {
    const noon27 = at(8, 27);
    const kept = keepSprinkling(ROSE, noon27, FROM, null);
    expect(kept).toEqual({ ...ROSE, waterings: 2, lastWatered: '2026-09-27' });
    expect(growth(kept, noon27)).toBe(growth(ROSE, noon27, FROM));
    expect(wateredToday(kept, noon27)).toBe(true);
    expect(growth(kept, at(8, 28))).toBe(growth(ROSE, at(8, 28), FROM));
  });

  it('keep only the days another sprinkler in reach does not cover', () => {
    const kept = keepSprinkling(ROSE, at(8, 27), FROM, '2026-09-27');
    expect(kept).toEqual({ ...ROSE, waterings: 1, lastWatered: null });
    expect(growth(kept, at(8, 28), '2026-09-27')).toBe(growth(ROSE, at(8, 28), FROM));
  });

  it('keep nothing from before the crop went in, or a rainy day, or one she watered herself', () => {
    const late: Planting = { ...ROSE, plantedAt: at(8, 28, 9) };
    expect(keepSprinkling(late, at(8, 28, 18), FROM, null)).toBe(late);
    const watered = water(ROSE, at(8, 26, 9));
    expect(keepSprinkling(watered, at(8, 26, 18), FROM, null)).toBe(watered);
  });
});

describe("a crop's season (0.2's N2)", () => {
  /** Garlic (3 days, autumn's), planted at noon on the first of a month (0-based). */
  const garlic = (month: number): Planting => ({
    ...PUMPKIN,
    crop: 'garlic',
    plantedAt: at(month, 1),
  });

  it('ripens a day sooner planted in its season, by the day it went in', () => {
    expect(plantedInSeason(garlic(9))).toBe(true);
    expect(ripeDays(garlic(9))).toBe(2);
    expect(plantedInSeason(garlic(5))).toBe(false);
    expect(ripeDays(garlic(5))).toBe(3);
    // Before 5am on 1 September is still 31 August's day, and summer's.
    expect(ripeDays({ ...garlic(8), plantedAt: at(8, 1, 3) })).toBe(3);
    expect(stageOf(garlic(9), at(9, 3))).toBe('ripe');
  });

  it('counts where it thrives too, but never ripens in no time', () => {
    const iris: Planting = { ...PUMPKIN, crop: 'iris', plantedAt: at(3, 1), quick: true };
    expect(ripeDays(iris)).toBe(1);
    expect(ripeDays({ ...iris, plantedAt: at(9, 1) })).toBe(2);
  });

  it('never slows a crop out of its season, in any month', () => {
    for (let month = 0; month < 12; month++) {
      for (const crop of ['pumpkin', 'garlic', 'tomato', 'christmasRose', 'basil'] as const) {
        const p: Planting = { ...PUMPKIN, crop, plantedAt: at(month, 15) };
        expect(ripeDays(p), `${crop} in ${month + 1}`).toBeLessThanOrEqual(CROPS[crop].days);
        expect(ripeDays(p)).toBeGreaterThanOrEqual(1);
      }
    }
  });
});
