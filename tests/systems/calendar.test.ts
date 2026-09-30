import { describe, expect, it } from 'vitest';
import { CALENDAR, CALENDAR_IDS } from '../../src/data/calendar';
import { SPECIAL_DAYS } from '../../src/data/specialDays';
import {
  comingUp,
  easterOf,
  festivalDay,
  festivalOn,
  festivalsOn,
  happeningOn,
  isFullMoon,
  keyOf,
  monthOf,
  nextDay,
  partsOf,
} from '../../src/systems/calendar';

/** Every day key of a year. */
const daysOf = (year: number) =>
  Array.from({ length: 366 }, (_, i) => keyOf(year, 1, i + 1)).filter((d) =>
    d.startsWith(`${year}`),
  );

const on = (id: string, year: number) =>
  daysOf(year).filter((d) => happeningOn(d).includes(id as never));

describe('the calendar', () => {
  it('reads a day key into its parts, and counts on across months and years', () => {
    expect(partsOf('2026-09-28')).toEqual({ year: 2026, month: 9, date: 28, weekday: 1 });
    expect(nextDay('2026-09-30')).toBe('2026-10-01');
    expect(nextDay('2026-12-31')).toBe('2027-01-01');
    expect(nextDay('2028-02-28')).toBe('2028-02-29');
  });

  it('knows when Easter is', () => {
    expect(easterOf(2026)).toEqual({ month: 4, date: 5 });
    expect(easterOf(2027)).toEqual({ month: 3, date: 28 });
    expect(easterOf(2030)).toEqual({ month: 4, date: 21 });
    expect(on('easter', 2026)).toEqual(['2026-04-05']);
  });

  it('puts Thanksgiving on the fourth Thursday of November', () => {
    expect(on('thanksgiving', 2026)).toEqual(['2026-11-26']);
    expect(on('thanksgiving', 2027)).toEqual(['2027-11-25']);
  });

  it('puts market day on the first Saturday of every month', () => {
    const days = on('marketDay', 2026);
    expect(days).toHaveLength(12);
    expect(days.slice(0, 3)).toEqual(['2026-01-03', '2026-02-07', '2026-03-07']);
    for (const d of days) expect(partsOf(d).weekday).toBe(6);
  });

  it('finds the full moons', () => {
    const moons = on('fullMoon', 2026);
    expect(moons.length).toBeGreaterThanOrEqual(12);
    expect(moons.length).toBeLessThanOrEqual(13);
    // Full moons of 2026, give or take the day a time zone puts them on.
    const near = (want: string) =>
      moons.some((m) => Math.abs(Date.parse(m) - Date.parse(want)) <= 86_400_000);
    for (const want of ['2026-01-03', '2026-05-01', '2026-05-31', '2026-09-26', '2026-12-24']) {
      expect(near(want), want).toBe(true);
    }
    expect(isFullMoon('2026-09-12')).toBe(false);
  });

  it('finds the Friday the 13ths', () => {
    expect(on('luckyFriday', 2026)).toEqual(['2026-02-13', '2026-03-13', '2026-11-13']);
  });

  it('has her special days, and every fixed holiday, once a year', () => {
    for (const id of CALENDAR_IDS) {
      const when = CALENDAR[id].when;
      if (id === 'fullMoon' || id === 'marketDay' || id === 'luckyFriday') continue;
      if (CALENDAR[id].kind === 'festival') continue;
      expect(on(id, 2027), id).toHaveLength(1);
      if ('on' in when) expect(on(id, 2027)).toEqual([`2027-${when.on}`]);
    }
    expect(happeningOn(`2026-${SPECIAL_DAYS.birthday}`)[0]).toBe('birthday');
    expect(happeningOn('2026-10-31')).toContain('halloween');
    expect(happeningOn('2026-09-29')).toEqual([]);
  });

  it('lays out a month, and says what is coming up', () => {
    const october = monthOf(2026, 10);
    expect(october).toHaveLength(31);
    expect(october[30]).toMatchObject({ day: '2026-10-31', happening: ['halloween'] });
    const next = comingUp('2026-09-28', 3);
    expect(next).toHaveLength(3);
    expect(next[0]!.day > '2026-09-28').toBe(true);
    for (const d of next) expect(d.happening.length).toBeGreaterThan(0);
  });

  it('spans the Halloween Festival over every day of October, and nothing else', () => {
    const days = daysOf(2026).filter((d) => festivalsOn(d).includes('halloweenFestival'));
    expect(days).toHaveLength(31);
    expect(days[0]).toBe('2026-10-01');
    expect(days.at(-1)).toBe('2026-10-31');
    expect(daysOf(2026).some((d) => happeningOn(d).includes('halloweenFestival'))).toBe(false);
    expect(festivalOn('2026-09-30')).toBeNull();
  });

  it('says how far into a festival a day is, and how long till its big day', () => {
    expect(festivalOn('2026-10-01')).toEqual({
      id: 'halloweenFestival',
      nth: 1,
      of: 31,
      finale: 'halloween',
      left: 30,
    });
    expect(festivalDay('halloweenFestival', '2026-10-30')).toMatchObject({ nth: 30, left: 1 });
    expect(festivalDay('halloweenFestival', '2026-10-31')).toMatchObject({ nth: 31, left: 0 });
  });

  it('marks a festival on every day of its month, and has it coming up on its first', () => {
    const october = monthOf(2026, 10);
    expect(october.every((d) => d.festivals.includes('halloweenFestival'))).toBe(true);
    expect(monthOf(2026, 9).some((d) => d.festivals.length > 0)).toBe(false);
    const next = comingUp('2026-09-29', 3);
    expect(next[0]).toEqual({
      day: '2026-10-01',
      happening: ['halloweenFestival'],
      festivals: ['halloweenFestival'],
    });
    // Once it's on, it isn't coming up again till next year.
    const later = comingUp('2026-10-01', 4);
    expect(later.some((d) => d.festivals.length > 0)).toBe(false);
  });

  it('says something warm of every row', () => {
    for (const id of CALENDAR_IDS) {
      expect(CALENDAR[id].about.length, id).toBeGreaterThan(10);
      expect(CALENDAR[id].icon, id).not.toBe('');
    }
  });
});
