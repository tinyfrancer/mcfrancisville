import { describe, expect, it } from 'vitest';
import { CALENDAR, CALENDAR_IDS, type FestivalId } from '../../src/data/calendar';
import { HAPPENINGS, HAPPENING_IDS } from '../../src/data/happenings';
import { SHOPS } from '../../src/data/shop';
import { CALENDAR_MARKS } from '../../src/sprites/calendarMarks';
import { musicFor } from '../../src/audio/music';
import { festivalDay, festivalsOn, shiftDay } from '../../src/systems/calendar';
import { happensOn } from '../../src/systems/happenings';
import { stockOf } from '../../src/systems/shop';

/* V1's R3: a festival week a season beyond October, each with a shelf, a beat, a banner and a mark. */

const SEASON_FESTIVALS = CALENDAR_IDS.filter(
  (id): id is FestivalId => CALENDAR[id].kind === 'festival' && id !== 'halloweenFestival',
);
const YEAR = Array.from({ length: 365 * 3 }, (_, i) => shiftDay('2027-01-01', i));

describe('a festival week a season (V1 R3)', () => {
  it('is three of them, spring, summer and winter, a week each, never two at once', () => {
    expect(SEASON_FESTIVALS).toEqual(['blossomWeek', 'fireworksWeek', 'lightsWeek']);
    for (const day of YEAR) expect(festivalsOn(day).length, day).toBeLessThanOrEqual(1);
    for (const id of SEASON_FESTIVALS) {
      const days = YEAR.slice(0, 365).filter((d) => festivalsOn(d).includes(id));
      expect(days.length, id).toBe(7);
      expect(festivalDay(id, days[0]!)).toMatchObject({ nth: 1, of: 7 });
      expect(CALENDAR[id].banner?.length, id).toBe(2);
      expect(CALENDAR_MARKS[id], id).toBeDefined();
    }
  });

  it('has its beat once a week, on its Saturday, but never on its finale', () => {
    const beats = HAPPENING_IDS.filter((id) => {
      const { on } = HAPPENINGS[id];
      return 'festival' in on && SEASON_FESTIVALS.includes(on.festival);
    });
    expect(beats.length).toBe(3);
    for (const beat of beats) {
      const { on } = HAPPENINGS[beat];
      if (!('festival' in on)) continue;
      for (let year = 0; year < 3; year++) {
        const week = YEAR.slice(year * 365, year * 365 + 365).filter((d) =>
          festivalsOn(d).includes(on.festival),
        );
        const days = week.filter((d) => happensOn(beat, d));
        expect(days.length, `${beat} ${week[0]}`).toBeLessThanOrEqual(1);
        const finale = CALENDAR[on.festival].finale;
        if (days.length === 0) expect(finale, `${beat} ${week[0]}`).toBeDefined();
      }
    }
  });

  it('puts out a shelf of its own at Cobweb Corner, only that week', () => {
    for (const id of SEASON_FESTIVALS) {
      const shelf = SHOPS.corner.shelves.find((s) => s.on === id);
      expect(shelf, id).toBeDefined();
      const during = YEAR.find((d) => festivalsOn(d).includes(id))!;
      expect(
        stockOf('corner', during).some((s) => s.name === shelf!.name),
        id,
      ).toBe(true);
      expect(
        stockOf('corner', shiftDay(during, -1)).some((s) => s.name === shelf!.name),
        id,
      ).toBe(false);
    }
  });

  it("plays the town's own tune in town, the Halloween Festival's still its own", () => {
    const quiet = { decor: null, fountain: false } as const;
    for (const id of SEASON_FESTIVALS) {
      expect(musicFor('town', 'evening', { ...quiet, festivals: [id] })).toBe('town@evening');
    }
    expect(musicFor('town', 'evening', { ...quiet, festivals: ['halloweenFestival'] })).toBe(
      'halloweenFestival@evening',
    );
  });
});
