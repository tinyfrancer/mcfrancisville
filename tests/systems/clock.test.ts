import { describe, expect, it } from 'vitest';
import {
  clockFromHour,
  dayKey,
  daylight,
  FakeClock,
  hourOf,
  isNight,
  nextWindow,
  windowKey,
  windowOf,
} from '../../src/systems/clock';

/** A local time, so the tests mean the same thing in any time zone. */
const at = (month: number, day: number, hour: number, minute = 0) =>
  new Date(2026, month - 1, day, hour, minute).getTime();

describe('the day key', () => {
  it('turns over at 5am, not midnight', () => {
    expect(dayKey(at(9, 26, 5))).toBe('2026-09-26');
    expect(dayKey(at(9, 26, 23, 59))).toBe('2026-09-26');
    expect(dayKey(at(9, 27, 0, 30))).toBe('2026-09-26');
    expect(dayKey(at(9, 27, 4, 59))).toBe('2026-09-26');
    expect(dayKey(at(9, 27, 5))).toBe('2026-09-27');
  });

  it('turns over across a month and a year', () => {
    expect(dayKey(at(10, 1, 2))).toBe('2026-09-30');
    expect(dayKey(new Date(2027, 0, 1, 3).getTime())).toBe('2026-12-31');
  });
});

describe('the windows', () => {
  it('are morning from 5, afternoon from noon and evening from 6 until the day turns over', () => {
    expect(windowOf(at(9, 26, 5))).toBe('morning');
    expect(windowOf(at(9, 26, 11, 59))).toBe('morning');
    expect(windowOf(at(9, 26, 12))).toBe('afternoon');
    expect(windowOf(at(9, 26, 17, 59))).toBe('afternoon');
    expect(windowOf(at(9, 26, 18))).toBe('evening');
    expect(windowOf(at(9, 27, 4, 59))).toBe('evening');
  });

  it('are keyed by the day they belong to', () => {
    expect(windowKey(at(9, 26, 9))).toBe('2026-09-26@morning');
    expect(windowKey(at(9, 27, 2))).toBe('2026-09-26@evening');
    expect(windowKey(at(9, 27, 5))).toBe('2026-09-27@morning');
  });

  it('come round in order', () => {
    expect(nextWindow('morning')).toBe('afternoon');
    expect(nextWindow('afternoon')).toBe('evening');
    expect(nextWindow('evening')).toBe('morning');
  });
});

describe('the hour', () => {
  it('is local and fractional', () => {
    expect(hourOf(at(9, 26, 21, 30))).toBe(21.5);
  });

  it('is night from 8pm until the day turns over', () => {
    expect(isNight(19.99)).toBe(false);
    expect(isNight(20)).toBe(true);
    expect(isNight(2)).toBe(true);
    expect(isNight(5)).toBe(false);
    expect(isNight(12)).toBe(false);
  });
});

describe('daylight', () => {
  it('is plain day at noon, with the lamps out', () => {
    expect(daylight(12)).toEqual({ from: 'day', to: 'day', t: 0, lamps: 0 });
  });

  it('is night after nine and before five, with the lamps lit', () => {
    for (const hour of [21, 23.5, 0, 3, 4.99]) {
      expect(daylight(hour), String(hour)).toMatchObject({ from: 'night', to: 'night', lamps: 1 });
    }
  });

  it('blends through the golden hour into dusk', () => {
    expect(daylight(17.25)).toMatchObject({ from: 'day', to: 'golden', t: 0.5 });
    expect(daylight(18.75)).toMatchObject({ from: 'golden', to: 'dusk', t: 0.5 });
  });

  it('lights the lamps through the golden hour and puts them out after dawn', () => {
    expect(daylight(17.5).lamps).toBe(0);
    expect(daylight(18.25).lamps).toBe(0.5);
    expect(daylight(19).lamps).toBe(1);
    expect(daylight(6).lamps).toBe(1);
    expect(daylight(6.75).lamps).toBe(0.5);
    expect(daylight(7.5).lamps).toBe(0);
  });
});

describe('the fake clock', () => {
  it('holds still until moved', () => {
    const clock = new FakeClock(at(9, 26, 12));
    expect(clock.now()).toBe(at(9, 26, 12));
    clock.advance(60_000);
    expect(hourOf(clock.now())).toBeCloseTo(12 + 1 / 60);
    clock.set(new Date(2026, 8, 26, 22));
    expect(hourOf(clock.now())).toBe(22);
  });
});

describe('a clock from an hour', () => {
  it('starts at that hour today and keeps time', () => {
    const base = new FakeClock(at(9, 26, 12));
    const clock = clockFromHour(22.5, base);
    expect(hourOf(clock.now())).toBe(22.5);
    base.advance(60 * 60 * 1000);
    expect(hourOf(clock.now())).toBe(23.5);
  });
});
