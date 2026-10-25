import { afterEach, describe, expect, it } from 'vitest';
import { HAPPENING_IDS, HAPPENINGS } from '../../src/data/happenings';
import { INTERIORS } from '../../src/data/interiors';
import { isFullMoon } from '../../src/systems/calendar';
import {
  happeningOf,
  happeningsAt,
  happensOn,
  hourOfNight,
  placeAt,
} from '../../src/systems/happenings';
import { knowMayor } from '../../src/systems/mayor';
import { whereabouts } from '../../src/systems/schedules';

/** A year of day keys from the start of 2027. */
const YEAR = Array.from({ length: 365 }, (_, i) =>
  new Date(Date.UTC(2027, 0, 1 + i)).toISOString().slice(0, 10),
);

describe('happenings', () => {
  it('are on their days: book club on Wednesdays, the bake on Fridays, the swap on Sundays', () => {
    expect(happensOn('bookClub', '2026-09-30')).toBe(true);
    expect(happensOn('bookClub', '2026-10-01')).toBe(false);
    expect(happensOn('midnightBake', '2026-10-02')).toBe(true);
    expect(happensOn('seedSwap', '2026-10-04')).toBe(true);
    expect(happensOn('movieNight', '2026-10-03')).toBe(true);
    const moons = YEAR.filter((d) => happensOn('moonHowl', d));
    expect(moons.every(isFullMoon)).toBe(true);
    expect(moons.length).toBeGreaterThan(10);
  });

  it('now and then, for a spell gone mildly wrong', () => {
    const spells = YEAR.filter((d) => happensOn('spellGoneWrong', d)).length;
    expect(spells).toBeGreaterThan(365 / 8);
    expect(spells).toBeLessThan(365 / 3);
  });

  it('run on past midnight, still the day they began', () => {
    expect(hourOfNight(1)).toBe(25);
    expect(hourOfNight(22)).toBe(22);
    expect(happeningsAt(1, '2026-10-02')).toContain('midnightBake');
    expect(happeningsAt(3, '2026-10-02')).not.toContain('midnightBake');
    expect(happeningOf('wrapunzel', 23, '2026-10-02')).toBe('midnightBake');
    expect(happeningOf('wrapunzel', 21, '2026-10-02')).toBeNull();
  });

  it('put everyone inside at a place of their own, and the rest outdoors round the host', () => {
    const movie = HAPPENINGS.movieNight.who.map((v) => placeAt('movieNight', v).place);
    expect(new Set(movie.map((p) => `${p.tx},${p.ty}`)).size).toBe(movie.length);
    expect(movie.every((p) => p.zone === 'codyManor')).toBe(true);
    expect(placeAt('spellGoneWrong', 'barty').beside).toBe(true);
    expect(placeAt('spellGoneWrong', 'agatha').beside).toBe(false);
  });

  it('come before visits and the schedule, and after her birthday party', () => {
    const at = whereabouts('maude', 20, '2026-09-30');
    expect(at).toEqual({ zone: 'library', tile: INTERIORS.library.stands[0] });
    const birthday = '2027-04-09';
    expect(whereabouts('rufus', 22, birthday).zone).toBe('town');
    expect('tile' in whereabouts('rufus', 22, birthday)).toBe(true);
  });

  it('have their people, a line from each, and fit indoors', () => {
    for (const id of HAPPENING_IDS) {
      const row = HAPPENINGS[id];
      expect(row.who.length, id).toBeGreaterThan(0);
      expect(row.from, id).toBeLessThan(row.until);
      for (const v of row.who) expect(row.says[v], `${id} ${v}`).toBeTruthy();
      if ('inside' in row.where) {
        expect(row.who.length, id).toBeLessThanOrEqual(INTERIORS[row.where.inside].stands.length);
        expect(row.welcome, id).toBeTruthy();
      }
      // Only Cody calls her babe.
      for (const [v, line] of Object.entries(row.says)) {
        expect(/\bbabe\b/.test(line!), `${id} ${v}`).toBe(v === 'cody');
      }
    }
  });
});

describe('film night (0.2 J3)', () => {
  it("is the Halloween Festival's Saturdays but the 31st, and comes before Cody's movie night", () => {
    const october = Array.from(
      { length: 31 },
      (_, i) => `2026-10-${String(i + 1).padStart(2, '0')}`,
    );
    expect(october.filter((d) => happensOn('filmNight', d))).toEqual([
      '2026-10-03',
      '2026-10-10',
      '2026-10-17',
      '2026-10-24',
    ]);
    expect(happensOn('filmNight', '2026-09-26')).toBe(false);
    expect(happensOn('filmNight', '2026-11-07')).toBe(false);
    expect(happeningOf('cody', 20, '2026-10-10')).toBe('filmNight');
    expect(happeningOf('cody', 20, '2026-10-31')).toBe('halloweenParty');
    expect(happeningOf('cody', 20, '2026-11-07')).toBe('movieNight');
  });

  it('seats everyone a place of their own, facing the screen', () => {
    const { who, where, faces } = HAPPENINGS.filmNight;
    const seats = who.map((v) => placeAt('filmNight', v).place);
    const keys = new Set(seats.map((s) => `${s.tx},${s.ty}`));
    expect(keys.size).toBe(who.length);
    expect(seats.every((s) => s.zone === 'town' && s.ty > 28)).toBe(true);
    expect('seats' in where).toBe(true);
    expect(faces).toBe('up');
  });
});

describe("the hour's happenings, kept (1.3's F2)", () => {
  afterEach(() => knowMayor(null, null));

  it('begin and end on whole hours, which is what lets the hour be the key', () => {
    for (const id of HAPPENING_IDS) {
      expect(Number.isInteger(HAPPENINGS[id].from), id).toBe(true);
      expect(Number.isInteger(HAPPENINGS[id].until), id).toBe(true);
    }
  });

  it('are the same array for the whole hour of a day, and a new one when either turns', () => {
    const evening = happeningsAt(19, '2026-10-02');
    expect(happeningsAt(19.5, '2026-10-02')).toBe(evening);
    expect(happeningsAt(19.9999, '2026-10-02')).toBe(evening);
    const next = happeningsAt(20, '2026-10-02');
    expect(next).not.toBe(evening);
    expect(happeningsAt(20.25, '2026-10-02')).toBe(next);
    expect(happeningsAt(20, '2026-10-03')).not.toBe(next);
  });

  it('turn over at the day, past midnight too: one in the morning is still the night before', () => {
    const late = happeningsAt(1, '2026-10-02');
    expect(happeningsAt(1.75, '2026-10-02')).toBe(late);
    expect(late).toContain('midnightBake');
    expect(happeningsAt(5, '2026-10-02')).not.toContain('midnightBake');
  });

  it('answer as they would unkept, for every hour of a spell of days', () => {
    const days = YEAR.filter((_, i) => i % 9 === 0);
    const fresh = (hour: number, day: string) => {
      // Asking another hour in between drops what was kept.
      happeningsAt((hour + 7) % 24, '2000-01-01');
      return [...happeningsAt(hour, day)];
    };
    for (const day of days) {
      for (let hour = 0; hour < 24; hour += 0.5) {
        const kept = [...happeningsAt(hour, day)];
        expect(happeningsAt(hour, day), `${day} ${hour}`).toEqual(kept);
        expect(fresh(hour, day), `${day} ${hour}`).toEqual(kept);
      }
    }
  });

  it("follow the mayor's story while she plays, without the hour turning", () => {
    const day = '2026-11-10';
    const hour = 20;
    expect(happeningsAt(hour, day)).not.toContain('unmasking');
    knowMayor('2026-11-09', null);
    expect(happeningsAt(hour, day)).toContain('unmasking');
    expect(happeningsAt(hour, day)[0]).toBe('unmasking');
    knowMayor('2026-11-09', day);
    expect(happeningsAt(hour, day)).toContain('unmasking');
    knowMayor('2026-11-09', '2026-11-10');
    expect(happeningsAt(hour, '2026-11-11')).not.toContain('unmasking');
    knowMayor(null, null);
    expect(happeningsAt(hour, day)).not.toContain('unmasking');
  });
});
