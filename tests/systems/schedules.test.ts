import { FIRST_NEIGHBOURS } from '../../src/systems/newcomers';
import { describe, expect, it } from 'vitest';
import { TOWN } from '../../src/data/maps';
import { VILLAGER_IDS, VILLAGERS, type Stop } from '../../src/data/villagers';
import { parseMap } from '../../src/systems/grid';
import { happeningOf, placeAt } from '../../src/systems/happenings';
import {
  isWeekend,
  stopAt,
  stopOf,
  VISIT_HOURS,
  visitOf,
  visitsOn,
  whereabouts,
} from '../../src/systems/schedules';

/** A fortnight of day keys from a Monday, 28 September 2026. */
const FORTNIGHT = Array.from({ length: 14 }, (_, i) => {
  const d = new Date(Date.UTC(2026, 8, 28 + i));
  return d.toISOString().slice(0, 10);
});

describe('the week', () => {
  it('has its weekend on Saturday and Sunday, by the day key', () => {
    expect(isWeekend('2026-09-26')).toBe(true);
    expect(isWeekend('2026-09-27')).toBe(true);
    expect(isWeekend('2026-09-28')).toBe(false);
    expect(isWeekend('2026-10-02')).toBe(false);
  });
});

describe('where villagers are', () => {
  it('follows their schedule, the last stop running on past midnight', () => {
    const weekday = VILLAGERS.cody.schedule.weekday;
    const first = weekday[0]!;
    const last = weekday.at(-1)!;
    const at = (s: Stop) => stopAt(s);
    expect(stopOf('cody', first.from, '2026-09-28')).toEqual(at(first));
    expect(stopOf('cody', 23.5, '2026-09-28')).toEqual(at(last));
    expect(stopOf('cody', 2, '2026-09-28')).toEqual(at(last));
  });

  it('keeps a different day at the weekend', () => {
    const differs = VILLAGER_IDS.some((id) =>
      Array.from({ length: 24 }, (_, h) => h).some(
        (h) =>
          JSON.stringify(stopOf(id, h, '2026-09-28')) !==
          JSON.stringify(stopOf(id, h, '2026-09-26')),
      ),
    );
    expect(differs).toBe(true);
    // Friday night, up past midnight, is still Friday's.
    const friday = VILLAGERS.barty.schedule.weekday.at(-1)!;
    expect(stopOf('barty', 3, '2026-10-02')).toEqual(stopAt(friday));
  });

  it('can be somewhere beyond the town, or inside', () => {
    expect(stopOf('rufus', 7, '2026-09-28').zone).toBe('whisperwood');
    expect(stopOf('rufus', 12, '2026-09-28').zone).toBe('town');
    expect(stopOf('maude', 10, '2026-09-28').zone).toBe('library');
    expect(stopOf('wrapunzel', 6, '2026-09-28').zone).toBe('crumbs');
  });

  it('is the party at the square on her birthday', () => {
    const party = stopOf('maude', 10, '2027-04-09');
    expect(party).not.toEqual(stopOf('maude', 10, '2027-04-10'));
    const well = parseMap(TOWN).props.find((p) => p.id === 'well')!;
    expect(Math.abs(party.tx + 0.5 - (well.tx + well.w / 2))).toBeLessThanOrEqual(3);
    expect(Math.abs(party.ty + 0.5 - (well.ty + well.h / 2))).toBeLessThanOrEqual(3);
    expect(visitsOn('2027-04-09', FIRST_NEIGHBOURS)).toEqual([]);
  });
});

describe('visits', () => {
  it('bring someone round to hers once a day, and neighbours to each other most windows', () => {
    let pairs = 0;
    for (const day of FORTNIGHT) {
      const visits = visitsOn(day, FIRST_NEIGHBOURS);
      expect(
        visits.filter((v) => v.host === 'her'),
        day,
      ).toHaveLength(1);
      pairs += visits.filter((v) => v.host !== 'her').length;
    }
    expect(pairs).toBeGreaterThan(14);
    expect(pairs).toBeLessThan(42);
  });

  it('are never paid by a host, nor to themselves, and keep to their hours', () => {
    const hours = Object.values(VISIT_HOURS).map(([from, until]) => `${from}-${until}`);
    for (const day of FORTNIGHT) {
      const visits = visitsOn(day, FIRST_NEIGHBOURS);
      for (const v of visits) {
        expect(v.guest).not.toBe(v.host);
        expect(hours).toContain(`${v.from}-${v.until}`);
        const alongside = visits.filter((o) => o.from === v.from && o !== v);
        for (const o of alongside) {
          expect([o.guest, o.host]).not.toContain(v.guest);
          if (v.host !== 'her') expect(o.guest).not.toBe(v.host);
        }
      }
    }
  });

  it('are never at noon, when everyone is out in the square at the weekend', () => {
    for (const day of FORTNIGHT) {
      for (const id of VILLAGER_IDS) expect(visitOf(id, 12, day, FIRST_NEIGHBOURS)).toBeNull();
    }
  });

  it('put a guest beside their host, or just inside her door', () => {
    for (const day of FORTNIGHT) {
      for (const v of visitsOn(day, FIRST_NEIGHBOURS)) {
        // One of their own happenings comes first.
        if (happeningOf(v.guest, v.from, day)) continue;
        const where = whereabouts(v.guest, v.from, day, FIRST_NEIGHBOURS);
        if (v.host === 'her') {
          expect(where).toEqual({ zone: 'home', beside: null, host: 'her' });
        } else {
          const at = happeningOf(v.host, v.from, day);
          const { zone, ...tile } = at ? placeAt(at, v.host).place : stopOf(v.host, v.from, day);
          expect(where).toEqual({ zone, beside: tile, host: v.host });
        }
        if (!happeningOf(v.guest, v.until, day)) {
          expect('tile' in whereabouts(v.guest, v.until, day, FIRST_NEIGHBOURS)).toBe(true);
        }
      }
    }
  });
});
