import { describe, expect, it } from 'vitest';
import { birthdaysOn, isBirthday } from '../../src/data/birthdays';

describe('birthdays on the calendar', () => {
  it("finds a neighbour's birthday on its day, every year", () => {
    expect(birthdaysOn('2026-11-02', ['maude', 'rufus'])).toEqual(['maude']);
    expect(birthdaysOn('2031-11-02', ['maude'])).toEqual(['maude']);
    expect(isBirthday('maude', '2026-11-03')).toBe(false);
  });

  it('marks only the neighbours asked about, and never Cody, whose day is always tomorrow', () => {
    expect(birthdaysOn('2026-11-02', ['rufus'])).toEqual([]);
    for (let month = 1; month <= 12; month++) {
      for (let date = 1; date <= 31; date++) {
        const day = `2026-${String(month).padStart(2, '0')}-${String(date).padStart(2, '0')}`;
        expect(birthdaysOn(day, ['cody'])).toEqual([]);
      }
    }
  });
});
