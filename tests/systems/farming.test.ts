import { describe, expect, it } from 'vitest';
import {
  canWater,
  daysBetween,
  daysToRipe,
  growth,
  isRare,
  stageOf,
  water,
  yieldOf,
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
    const now = at(8, 27);
    expect(canWater(ROSE, now)).toBe(true);
    const watered = water(ROSE, now);
    expect(canWater(watered, now)).toBe(false);
    expect(canWater(watered, at(8, 28))).toBe(true);
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
