import { describe, expect, it } from 'vitest';
import { SPECIAL_DAYS } from '../../src/data/specialDays';
import { dayKey } from '../../src/systems/clock';
import { weatherOn } from '../../src/systems/weather';

/** A year of day keys, from the first of September 2026. */
const YEAR = Array.from({ length: 365 }, (_, i) => dayKey(new Date(2026, 8, 1 + i, 12).getTime()));

describe('the weather', () => {
  it('is mostly clear, with a rainy or foggy day now and then', () => {
    const count = (w: string) => YEAR.filter((d) => weatherOn(d) === w).length;
    expect(count('clear')).toBeGreaterThan(365 * 0.6);
    expect(count('rain')).toBeGreaterThan(365 * 0.08);
    expect(count('rain')).toBeLessThan(365 * 0.25);
    expect(count('fog')).toBeGreaterThan(365 * 0.08);
    expect(count('fog')).toBeLessThan(365 * 0.25);
  });

  it('never goes long without a rainy or a foggy day', () => {
    let clear = 0;
    let longest = 0;
    for (const d of YEAR) {
      clear = weatherOn(d) === 'clear' ? clear + 1 : 0;
      longest = Math.max(longest, clear);
    }
    expect(longest).toBeLessThan(30);
  });

  it('is the same all day, whenever she asks', () => {
    expect(weatherOn('2026-09-28')).toBe('rain');
    expect(weatherOn(dayKey(new Date(2026, 8, 28, 6).getTime()))).toBe('rain');
    expect(weatherOn(dayKey(new Date(2026, 8, 29, 4).getTime()))).toBe('rain');
    expect(weatherOn('2026-09-29')).toBe('fog');
  });

  it('is always clear on her special days', () => {
    for (const year of [2026, 2027, 2028, 2029, 2030]) {
      for (const monthDay of Object.values(SPECIAL_DAYS)) {
        expect(weatherOn(`${year}-${monthDay}`)).toBe('clear');
      }
    }
  });
});
