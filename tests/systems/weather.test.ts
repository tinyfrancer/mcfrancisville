import { describe, expect, it } from 'vitest';
import { SPECIAL_DAYS } from '../../src/data/specialDays';
import { dayKey } from '../../src/systems/clock';
import { FLASH_EVERY_MS, lastFlash, stormOn, weatherOn } from '../../src/systems/weather';

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

  it('makes about a third of the rainy days thunderstorms, and only rainy days', () => {
    const rainy = YEAR.filter((d) => weatherOn(d) === 'rain');
    const storms = YEAR.filter(stormOn);
    expect(storms.every((d) => weatherOn(d) === 'rain')).toBe(true);
    expect(storms.length).toBeGreaterThan(rainy.length * 0.2);
    expect(storms.length).toBeLessThan(rainy.length * 0.5);
  });

  it('flashes now and then through a storm, the same whenever she asks', () => {
    const storm = YEAR.find(stormOn)!;
    const start = new Date(`${storm}T12:00:00`).getTime();
    const flashes = new Set<number>();
    for (let t = start; t < start + 10 * 60_000; t += 1000) {
      const at = lastFlash(storm, t);
      if (at !== null) {
        expect(at).toBeLessThanOrEqual(t);
        expect(t - at).toBeLessThan(2 * FLASH_EVERY_MS);
        flashes.add(at);
      }
    }
    // Ten minutes of storm: a flash every minute or so, not a strobe.
    expect(flashes.size).toBeGreaterThan(5);
    expect(flashes.size).toBeLessThan(16);
    expect(
      lastFlash(
        YEAR.find((d) => weatherOn(d) === 'fog')!,
        start,
      ),
    ).toBeNull();
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
