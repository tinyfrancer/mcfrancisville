import { describe, expect, it } from 'vitest';
import { CALENDAR } from '../../src/data/calendar';
import { HAPPENINGS } from '../../src/data/happenings';
import { HOLIDAY_LINES } from '../../src/data/holidayLines';
import { DECOR, DECOR_IDS, EGG_SPOTS, EGGS_HIDDEN, GARLANDS } from '../../src/data/holidays';
import { SPOTS, TOWN, TOWN_SPOTS } from '../../src/data/maps';
import { PARTY_SPOTS } from '../../src/data/specialDays';
import { VILLAGER_IDS } from '../../src/data/villagers';
import { fallsOn, keyOf } from '../../src/systems/calendar';
import { dayLine, letterOf, lettersOn, lineFor } from '../../src/systems/friendship';
import { parseMap, walkable } from '../../src/systems/grid';
import { happeningOf, happensOn } from '../../src/systems/happenings';
import {
  decorOn,
  eggsOn,
  freezesOn,
  goesUpOn,
  isFrozen,
  holidayLetterId,
  holidayOn,
  skyAt,
} from '../../src/systems/holidays';
import { whereabouts } from '../../src/systems/schedules';
import type { VillagerId } from '../../src/types/ids';

/** Every day key of a year. */
const daysOf = (year: number) =>
  Array.from({ length: 366 }, (_, i) => keyOf(year, 1, i + 1)).filter((d) =>
    d.startsWith(`${year}`),
  );

const FIRST: VillagerId[] = ['maude', 'rufus', 'wrapunzel', 'agatha', 'barty', 'cody'];

describe('the holidays', () => {
  it('put up each set of decorations for its days before and after, and take them down', () => {
    expect(decorOn('2026-11-30')).toBeNull();
    expect(decorOn('2026-12-01')).toBe('christmas');
    expect(decorOn('2026-12-25')).toBe('christmas');
    expect(decorOn('2026-12-30')).toBe('christmas');
    expect(decorOn('2026-12-31')).toBe('newYear');
    expect(decorOn('2027-01-01')).toBe('newYear');
    expect(decorOn('2027-01-02')).toBeNull();
    expect(decorOn('2026-10-01')).toBe('halloween');
    expect(decorOn('2026-10-31')).toBe('halloween');
    expect(decorOn('2026-11-01')).toBeNull();
    expect(decorOn('2027-02-07')).toBeNull();
    expect(decorOn('2027-02-08')).toBe('valentines');
    expect(decorOn('2027-02-15')).toBeNull();
    // Thanksgiving 2026 is the 26th of November.
    expect(decorOn('2026-11-19')).toBeNull();
    expect(decorOn('2026-11-20')).toBe('thanksgiving');
    expect(decorOn('2026-11-27')).toBeNull();
    // Easter 2027 is the 28th of March, and stays up the Monday after.
    expect(decorOn('2027-03-22')).toBe('easter');
    expect(decorOn('2027-03-29')).toBe('easter');
    expect(decorOn('2027-03-30')).toBeNull();
  });

  it('gives a day that two sets could share to the nearer holiday, and a holiday its own day', () => {
    // Easter 2008 was the 23rd of March, a week after St Patrick's.
    expect(decorOn('2008-03-16')).toBe('stPatricks');
    expect(decorOn('2008-03-17')).toBe('stPatricks');
    expect(decorOn('2008-03-18')).toBe('easter');
  });

  it('has each set up on its own holiday, every year, and never two sets at once', () => {
    for (const year of [2026, 2027, 2028, 2030]) {
      for (const id of DECOR_IDS) {
        const day = daysOf(year).find((d) => fallsOn(CALENDAR[DECOR[id].holiday].when, d))!;
        expect(decorOn(day), `${id} ${year}`).toBe(id);
      }
      const up = daysOf(year).filter((d) => decorOn(d) !== null);
      expect(up.length).toBeGreaterThan(60);
    }
  });

  it('says a set is going up only on its first morning', () => {
    expect(goesUpOn('2026-12-01')).toBe('christmas');
    expect(goesUpOn('2026-12-02')).toBeNull();
    expect(goesUpOn('2026-12-31')).toBe('newYear');
    expect(goesUpOn('2026-10-01')).toBe('halloween');
    expect(goesUpOn('2026-09-30')).toBeNull();
  });

  it('knows the big holiday on a day, but not her own days or the town events', () => {
    expect(holidayOn('2026-12-25')).toBe('christmas');
    expect(holidayOn('2026-12-24')).toBe('christmasEve');
    expect(holidayOn('2027-04-09')).toBeNull();
    expect(holidayOn('2026-11-13')).toBeNull();
  });

  it('puts fireworks over town on the Fourth and at New Year, and snow at Christmas', () => {
    expect(skyAt('2026-07-04', 20)).toBeNull();
    expect(skyAt('2026-07-04', 21)).toBe('fireworks');
    expect(skyAt('2026-07-04', 23)).toBe('fireworks');
    expect(skyAt('2026-12-31', 23)).toBe('fireworks');
    // Midnight is still New Year's Eve's day key, until 5am.
    expect(skyAt('2026-12-31', 0)).toBe('fireworks');
    expect(skyAt('2026-12-31', 2)).toBeNull();
    expect(skyAt('2026-12-24', 9)).toBe('snow');
    expect(skyAt('2026-12-25', 21)).toBe('snow');
    expect(skyAt('2026-12-26', 12)).toBeNull();
  });

  it("brings a letter on Valentine's, at Christmas and at New Year, as well as her own days'", () => {
    expect(holidayLetterId('2026-12-25')).toBe('christmas:2026');
    expect(holidayLetterId('2027-02-14')).toBe('valentines:2027');
    expect(holidayLetterId('2027-01-01')).toBe('newYear:2027');
    expect(holidayLetterId('2026-10-31')).toBeNull();
    expect(letterOf('christmas:2026')).toMatchObject({
      from: 'everyone',
      gift: { furniture: 'holidayTree' },
    });
    expect(letterOf('valentines:2027')).toMatchObject({ from: 'cody' });
    expect(letterOf('newYear:2027')).toMatchObject({ from: 'mayor' });
    expect(lettersOn('2027-04-09')).toEqual(['birthday:2027']);
    expect(lettersOn('2026-12-25')).toEqual(['christmas:2026']);
    expect(lettersOn('2026-09-29')).toEqual([]);
  });

  it('has every neighbour say something of their own first on a holiday, her own days first', () => {
    for (const id of VILLAGER_IDS) {
      expect(dayLine(id, '2026-12-25')).toBe(HOLIDAY_LINES.christmas[id]);
      const first = lineFor(id, { hearts: 0, day: '2026-10-31', hour: 12, talks: 0 });
      expect(first).toBe(HOLIDAY_LINES.halloween[id]);
      const second = lineFor(id, { hearts: 0, day: '2026-10-31', hour: 12, talks: 1 });
      expect(second).not.toBe(HOLIDAY_LINES.halloween[id]);
    }
    expect(dayLine('cody', '2026-09-29')).toBeNull();
    // Her birthday's line comes first, whatever else the day is.
    expect(dayLine('cody', '2027-04-09')).toMatch(/birthday/);
  });

  it('hides eight eggs at Easter, the same all day, and none on any other day', () => {
    const eggs = eggsOn('2027-03-28');
    expect(eggs).toHaveLength(EGGS_HIDDEN);
    expect(new Set(eggs.map((e) => `${e.tx},${e.ty}`)).size).toBe(EGGS_HIDDEN);
    expect(eggsOn('2027-03-28')).toEqual(eggs);
    expect(eggsOn('2028-04-16')).not.toEqual(eggs);
    expect(eggsOn('2027-03-27')).toEqual([]);
  });

  it('hides eggs on open grass, and stands the square pieces on open ground, off every spot', () => {
    const map = parseMap(TOWN);
    const kept = [...Object.values(TOWN_SPOTS), ...map.snackSpots, ...map.beds, ...map.patches].map(
      (t) => `${t.tx},${t.ty}`,
    );
    const covered = (t: { tx: number; ty: number }) =>
      [
        ...map.popUpLots.flatMap((l) =>
          [0, 1, 2].flatMap((x) => [0, 1].map((y) => `${l.tx + x},${l.ty + y}`)),
        ),
        ...map.peddlerSpots.flatMap((l) =>
          [0, 1].flatMap((x) => [0, 1].map((y) => `${l.tx + x},${l.ty + y}`)),
        ),
        ...kept,
      ].includes(`${t.tx},${t.ty}`);
    for (const egg of EGG_SPOTS) {
      expect(walkable(map, egg.tx, egg.ty), `egg ${egg.tx},${egg.ty}`).toBe(true);
      expect(covered(egg), `egg ${egg.tx},${egg.ty}`).toBe(false);
    }
    for (const id of DECOR_IDS) {
      for (const piece of DECOR[id].pieces) {
        expect(walkable(map, piece.tx, piece.ty), `${id} ${piece.prop}`).toBe(true);
        expect(covered(piece), `${id} ${piece.prop}`).toBe(false);
      }
    }
    expect(Object.keys(SPOTS.town)).toEqual(Object.keys(TOWN_SPOTS));
  });

  it('strings its garlands between lamps', () => {
    const map = parseMap(TOWN);
    for (const ends of GARLANDS) {
      for (const end of ends) {
        const lamp = map.props.find((p) => p.tx === end.tx && p.ty === end.ty);
        expect(lamp?.id, `${end.tx},${end.ty}`).toBe('lantern');
      }
    }
  });

  it('has a gathering for each big holiday (Christmas on its eve), only on its day', () => {
    const held = Object.values(HAPPENINGS).flatMap((row) =>
      'holiday' in row.on ? [row.on.holiday] : [],
    );
    for (const id of DECOR_IDS) {
      expect(held, id).toContain(id === 'christmas' ? 'christmasEve' : DECOR[id].holiday);
    }
    expect(happensOn('halloweenParty', '2026-10-31')).toBe(true);
    expect(happensOn('halloweenParty', '2026-10-30')).toBe(false);
    expect(happensOn('carols', '2026-12-24')).toBe(true);
  });

  it('gathers everyone round the well for a party, before any of their own happenings', () => {
    // Halloween 2025 was a Friday, the night of Wrapunzel's midnight bake.
    expect(happeningOf('wrapunzel', 23, '2025-10-31')).toBe('halloweenParty');
    for (const id of FIRST) {
      const at = whereabouts(id, 20, '2026-10-31');
      expect(at).toEqual({ zone: 'town', tile: TOWN_SPOTS[PARTY_SPOTS[id]] });
    }
    // Earlier that day, it's their usual day.
    expect(whereabouts('maude', 10, '2026-10-31')).not.toEqual({
      zone: 'town',
      tile: TOWN_SPOTS[PARTY_SPOTS.maude],
    });
  });

  it('freezes the pond over from mid-December to mid-January', () => {
    expect(isFrozen('2026-12-14')).toBe(false);
    expect(isFrozen('2026-12-15')).toBe(true);
    expect(isFrozen('2027-01-01')).toBe(true);
    expect(isFrozen('2027-01-15')).toBe(true);
    expect(isFrozen('2027-01-16')).toBe(false);
    expect(freezesOn('2026-12-15')).toBe(true);
    expect(freezesOn('2026-12-16')).toBe(false);
  });
});
