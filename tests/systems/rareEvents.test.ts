import { describe, expect, it } from 'vitest';
import { CALENDAR } from '../../src/data/calendar';
import { PROP_FOOTPRINT, TOWN } from '../../src/data/maps';
import {
  PASSER_IDS,
  PASSERS,
  RARE_EVENT_IDS,
  RARE_EVENTS,
  WANDERING_STALL_AT,
} from '../../src/data/rareEvents';
import { ZONES } from '../../src/data/zones';
import { HAPPENINGS } from '../../src/data/happenings';
import {
  festivalOn,
  festivalsOn,
  happeningOn,
  partsOf,
  shiftDay,
  weekOf,
} from '../../src/systems/calendar';
import { happeningsOn } from '../../src/systems/happenings';
import { moundSpot } from '../../src/systems/fossils';
import { parseMap, walkable } from '../../src/systems/grid';
import { findPath } from '../../src/systems/pathfinding';
import {
  arrivesOn,
  isStallWeek,
  passersAt,
  passersOn,
  rareEventBegan,
  rareEventOn,
  rareSkyAt,
  strayOn,
} from '../../src/systems/rareEvents';
import { weatherOn } from '../../src/systems/weather';

const YEARS = 6;
const DAYS = Array.from({ length: 365 * YEARS }, (_, i) => shiftDay('2026-10-01', i));

describe('rare events (V1 R3)', () => {
  it('come about one day in nine, never two at once, never on a holiday or her days', () => {
    const on = DAYS.filter((d) => rareEventOn(d) !== null);
    expect(on.length / DAYS.length).toBeGreaterThan(1 / 11);
    expect(on.length / DAYS.length).toBeLessThan(1 / 7.5);
    // One a day by construction; a day's own event never falls on a holiday or one of her days
    // (the stall stays its week whatever falls in it).
    for (const day of on) {
      if (rareEventOn(day) === 'wanderingStall') continue;
      const kinds = happeningOn(day).map((id) => CALENDAR[id].kind);
      expect(kinds.includes('holiday') || kinds.includes('special'), day).toBe(false);
    }
  });

  it('each come, every one of them, in two years', () => {
    const seen = new Set(DAYS.slice(0, 730).map(rareEventOn));
    for (const id of RARE_EVENT_IDS) expect(seen.has(id), id).toBe(true);
  });

  it('keep to their months and their weather', () => {
    for (const day of DAYS) {
      const id = rareEventOn(day);
      if (!id) continue;
      const row = RARE_EVENTS[id];
      if (row.months) expect(row.months, `${id} ${day}`).toContain(partsOf(day).month);
      if (row.clear) expect(weatherOn(day), `${id} ${day}`).toBe('clear');
      if (id === 'wanderingStall') expect(festivalsOn(day), day).toEqual([]);
    }
  });

  it('come on a festival’s ordinary days, never its first, its finale or its own beats (1.0.1)', () => {
    const octobers = DAYS.filter((d) => partsOf(d).month === 10 && rareEventOn(d) !== null);
    // October is all festival, and the month she plays most: a day's event most Octobers.
    expect(octobers.length).toBeGreaterThanOrEqual(YEARS);
    for (const day of DAYS) {
      const id = rareEventOn(day);
      const festival = festivalOn(day);
      if (!id || !festival) continue;
      expect(id, day).not.toBe('wanderingStall');
      expect(festival.nth, day).toBeGreaterThan(1);
      expect(festival.left === 0 && festival.finale !== null, day).toBe(false);
      const own = happeningsOn(day).filter((h) => 'festival' in HAPPENINGS[h].on);
      expect(own, day).toEqual([]);
    }
    // Film night's Saturdays are the festival's, so never a stranger's.
    const saturdays = DAYS.filter(
      (d) => partsOf(d).month === 10 && partsOf(d).weekday === 6 && partsOf(d).date < 31,
    );
    expect(saturdays.length).toBeGreaterThan(YEARS * 3);
    expect(saturdays.filter((d) => rareEventOn(d) !== null)).toEqual([]);
  });

  it('bring a snow day most winters', () => {
    for (let year = 2027; year < 2026 + YEARS; year++) {
      const winter = DAYS.filter((d) => {
        const { year: y, month } = partsOf(d);
        return (y === year && month <= 2) || (y === year - 1 && month === 12);
      });
      expect(
        winter.some((d) => rareEventOn(d) === 'snowDay'),
        `the winter into ${year}`,
      ).toBe(true);
    }
  });

  it('stand the wandering stall a whole week, Monday to Sunday, never two weeks running', () => {
    const mondays = DAYS.filter((d) => partsOf(d).weekday === 1 && isStallWeek(d));
    expect(mondays.length).toBeGreaterThan(YEARS);
    for (const monday of mondays) {
      for (let k = 0; k < 7; k++) {
        expect(rareEventOn(shiftDay(monday, k)), monday).toBe('wanderingStall');
        expect(rareEventBegan(shiftDay(monday, k))).toBe(monday);
      }
      expect(isStallWeek(shiftDay(monday, 7)), monday).toBe(false);
      expect(weekOf(monday)).toBe(monday);
    }
  });

  it('put shooting stars in the sky only on a meteor shower’s night, and snow all a snow day', () => {
    const shower = DAYS.find((d) => rareEventOn(d) === 'meteorShower')!;
    const snow = DAYS.find((d) => rareEventOn(d) === 'snowDay')!;
    expect(rareSkyAt(shower, 12)).toBeNull();
    expect(rareSkyAt(shower, 22)).toBe('meteors');
    expect(rareSkyAt(shower, 2)).toBe('meteors');
    expect(rareSkyAt(snow, 9)).toBe('snow');
    expect(rareSkyAt(snow, 21)).toBe('snow');
    const plain = DAYS.find((d) => rareEventOn(d) === null)!;
    expect(rareSkyAt(plain, 22)).toBeNull();
  });

  it('stand the stall on open ground in town, its counter walked up to', () => {
    const map = parseMap(TOWN);
    const { w, h } = PROP_FOOTPRINT.wanderingStall;
    for (let y = WANDERING_STALL_AT.ty; y < WANDERING_STALL_AT.ty + h; y++) {
      for (let x = WANDERING_STALL_AT.tx; x < WANDERING_STALL_AT.tx + w; x++) {
        expect(walkable(map, x, y), `${x},${y}`).toBe(true);
      }
    }
    const front = { tx: WANDERING_STALL_AT.tx + 1, ty: WANDERING_STALL_AT.ty + h };
    const can = (x: number, y: number) => walkable(map, x, y);
    expect(findPath(map.spawn, front, can, map.width, map.height)).not.toBeNull();
  });
});

describe('who passes through (V1 R3)', () => {
  it('has the wayfarer only on a stranger’s day, and Moira for her week every July', () => {
    for (const day of DAYS) {
      const passing = passersOn(day);
      expect(passing.includes('wayfarer'), day).toBe(rareEventOn(day) === 'stranger');
      const july = day.slice(5, 7) === '07' && day.slice(8) >= '12' && day.slice(8) <= '18';
      expect(passing.includes('moira'), day).toBe(july);
    }
    expect(arrivesOn('moira', '2027-07-12')).toBe(true);
    expect(arrivesOn('moira', '2027-07-13')).toBe(false);
  });

  it('stands everyone passing through on open ground they can be walked up to', () => {
    for (const id of PASSER_IDS) {
      const { zone, at } = PASSERS[id];
      const map = parseMap(ZONES[zone].map!);
      const can = (x: number, y: number) => walkable(map, x, y);
      for (const t of at) {
        expect(walkable(map, t.tx, t.ty), `${id} ${t.tx},${t.ty}`).toBe(true);
        expect(findPath(map.spawn, t, can, map.width, map.height), id).not.toBeNull();
      }
    }
  });

  it('keeps them to their hours', () => {
    const day = '2027-07-14';
    expect(passersAt(day, 12).map((p) => p.id)).toEqual(['moira']);
    expect(passersAt(day, 23)).toEqual([]);
    expect(passersAt(day, 7)).toEqual([]);
  });
});

describe('a critter gone astray (V1 R3)', () => {
  it('waits on one of its place’s dig spots, never under the day’s mound', () => {
    let seen = 0;
    for (const day of DAYS) {
      const stray = strayOn(day);
      expect(stray !== null, day).toBe(rareEventOn(day) === 'lostCritter');
      if (!stray) continue;
      seen++;
      const spots = ZONES[stray.zone].map!.digSpots ?? [];
      expect(
        spots.some((t) => t.tx === stray.tx && t.ty === stray.ty),
        day,
      ).toBe(true);
      const mound = moundSpot(stray.zone, spots, day);
      expect(mound?.tx === stray.tx && mound.ty === stray.ty, day).toBe(false);
    }
    expect(seen).toBeGreaterThan(YEARS);
  });
});
