import { describe, expect, it } from 'vitest';
import { GROUND_LOOKS, MONTH_LOOKS } from '../../src/data/seasons';
import { leavesFall } from '../../src/render/leaves';
import { dayKey } from '../../src/systems/clock';
import { groundLookIdOf, seasonOf, snowLies } from '../../src/systems/seasons';

describe('seasonOf', () => {
  it.each([
    ['2027-01-15', 'winter'],
    ['2027-02-28', 'winter'],
    ['2027-03-01', 'spring'],
    ['2027-04-15', 'spring'],
    ['2027-05-31', 'spring'],
    ['2027-06-01', 'summer'],
    ['2027-07-15', 'summer'],
    ['2027-08-31', 'summer'],
    ['2026-09-01', 'autumn'],
    ['2026-10-15', 'autumn'],
    ['2026-11-30', 'autumn'],
    ['2026-12-01', 'winter'],
  ])('puts %s in %s', (day, season) => {
    expect(seasonOf(day)).toBe(season);
  });

  it('goes by the day key, so a night past midnight is still the day it started on', () => {
    // 1am on 1 March is still the last day of February's.
    const night = new Date(2027, 2, 1, 1, 0).getTime();
    expect(dayKey(night)).toBe('2027-02-28');
    expect(seasonOf(dayKey(night))).toBe('winter');
  });
});

describe('the ground through the year', () => {
  it('has a look for every month, each in the season of its month', () => {
    expect(MONTH_LOOKS).toHaveLength(12);
    MONTH_LOOKS.forEach((look, i) => {
      const day = `2027-${String(i + 1).padStart(2, '0')}-10`;
      expect(GROUND_LOOKS[look].season, day).toBe(seasonOf(day));
      expect(groundLookIdOf(day)).toBe(look);
    });
  });

  it('keeps October as the town always was: nothing hidden, nothing added, no snow', () => {
    const october = GROUND_LOOKS[groundLookIdOf('2026-10-15')];
    expect(october.hides).toEqual([]);
    expect(october.adds).toEqual([]);
    expect(october.snow).toBeUndefined();
  });

  it('builds the leaf drifts through autumn', () => {
    const drifts = (day: string) => {
      const look = GROUND_LOOKS[groundLookIdOf(day)];
      if (look.hides.includes('leafDrift')) return 0;
      return 1 + look.adds.filter((r) => r.decal === 'leafDrift').length;
    };
    expect(drifts('2026-09-15')).toBeLessThan(drifts('2026-10-15'));
    expect(drifts('2026-10-15')).toBeLessThan(drifts('2026-11-15'));
  });

  it('lays snow all winter and never otherwise', () => {
    for (let m = 1; m <= 12; m++) {
      const day = `2027-${String(m).padStart(2, '0')}-20`;
      expect(snowLies(day), day).toBe(seasonOf(day) === 'winter');
    }
  });

  it('lets the leaves fall in autumn alone, by the season rule', () => {
    for (let m = 1; m <= 12; m++) {
      const day = `2027-${String(m).padStart(2, '0')}-20`;
      expect(leavesFall(day), day).toBe(seasonOf(day) === 'autumn');
    }
  });
});
