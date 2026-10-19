import { describe, expect, it } from 'vitest';
import { TOWN } from '../../src/data/maps';
import { happeningOn, festivalsOn, keyOf, daysIn, partsOf } from '../../src/systems/calendar';
import { happeningsOn } from '../../src/systems/happenings';
import { parseMap } from '../../src/systems/grid';
import { passersOn, rareEventOn } from '../../src/systems/rareEvents';
import { visitsOn } from '../../src/systems/schedules';
import { peddlerSpot, popUpLot } from '../../src/systems/shop';
import { weatherOn } from '../../src/systems/weather';

/*
 * V1's R3, done when a simulated month has no two days alike: each day's calendar rows and
 * festivals, her neighbours' happenings, the rare event, who's passing through or visiting, the
 * Moon Pie Man and the pop-up, and the weather, taken together, differ from every other day's.
 */

const map = parseMap(TOWN);

/** Everything that makes a day itself, as one string. */
function dayOf(day: string): string {
  const noon = new Date(`${day}T12:00:00`).getTime();
  return JSON.stringify({
    calendar: happeningOn(day),
    festivals: festivalsOn(day),
    happenings: happeningsOn(day),
    rare: rareEventOn(day),
    passers: passersOn(day),
    visits: visitsOn(day).map((v) => `${v.guest}>${v.host}@${v.from}`),
    moonPie: peddlerSpot(map.peddlerSpots, noon) !== null,
    popUp: popUpLot(map.popUpLots, noon) !== null,
    weather: weatherOn(day),
  });
}

function monthDays(year: number, month: number): string[] {
  return Array.from({ length: daysIn(year, month) }, (_, i) => keyOf(year, month, i + 1));
}

describe('weeks that differ (V1 R3)', () => {
  it('has no two days alike in a month, every month for two years', () => {
    for (let m = 0; m < 24; m++) {
      const year = 2026 + Math.floor((m + 9) / 12);
      const month = ((m + 9) % 12) + 1;
      const days = monthDays(year, month);
      const seen = new Map<string, string>();
      for (const day of days) {
        const it = dayOf(day);
        expect(seen.get(it), `${day} is ${seen.get(it)} again`).toBeUndefined();
        seen.set(it, day);
      }
    }
  });

  it('has something on in the daytime every Monday, Tuesday and Thursday', () => {
    for (const day of monthDays(2027, 3)) {
      const { weekday } = partsOf(day);
      if (![1, 2, 4].includes(weekday)) continue;
      const daytime = happeningsOn(day).filter((id) =>
        ['marketRound', 'cloudWatching', 'herbWalk'].includes(id),
      );
      expect(daytime.length, day).toBe(1);
    }
  });
});
