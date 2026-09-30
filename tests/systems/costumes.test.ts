import { describe, expect, it } from 'vitest';
import { NEIGHBOUR_COSTUMES } from '../../src/data/costumes';
import { VILLAGER_IDS } from '../../src/data/villagers';
import { dressingUp, festivalWeek, inCostume } from '../../src/systems/costumes';

describe('the neighbours in costume', () => {
  it('counts the festival in weeks, the last few days in the fourth', () => {
    expect(festivalWeek('2026-09-30')).toBe(0);
    expect(festivalWeek('2026-10-01')).toBe(1);
    expect(festivalWeek('2026-10-07')).toBe(1);
    expect(festivalWeek('2026-10-08')).toBe(2);
    expect(festivalWeek('2026-10-22')).toBe(4);
    expect(festivalWeek('2026-10-31')).toBe(4);
    expect(festivalWeek('2026-11-01')).toBe(0);
  });

  it('dresses more of them up each week, and everyone by the last', () => {
    const dressed = (day: string) => VILLAGER_IDS.filter((id) => inCostume(id, day)).length;
    expect(dressed('2026-09-30')).toBe(0);
    let before = 0;
    for (const day of ['2026-10-01', '2026-10-08', '2026-10-15', '2026-10-22']) {
      expect(dressed(day), day).toBeGreaterThan(before);
      before = dressed(day);
    }
    expect(dressed('2026-10-31')).toBe(VILLAGER_IDS.length);
    expect(dressed('2026-11-01')).toBe(0);
  });

  it('says who puts theirs on, the morning they do', () => {
    const week = (w: number) => VILLAGER_IDS.filter((id) => NEIGHBOUR_COSTUMES[id].week === w);
    expect(dressingUp('2026-10-01')).toEqual(week(1));
    expect(dressingUp('2026-10-02')).toEqual([]);
    expect(dressingUp('2026-10-15')).toEqual(week(3));
  });
});
