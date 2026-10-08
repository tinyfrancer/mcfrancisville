import { describe, expect, it } from 'vitest';
import { CRITTER_IDS, CRITTERS } from '../../src/data/critters';
import { FOSSIL_IDS, FOSSILS } from '../../src/data/fossils';
import { TOWN } from '../../src/data/maps';
import { ZONE_IDS, ZONES } from '../../src/data/zones';
import { dayKey } from '../../src/systems/clock';
import { daysBetween, shiftDay } from '../../src/systems/calendar';
import {
  crittersOut,
  isAbout,
  nextChance,
  placeHabitats,
  townHabitats,
} from '../../src/systems/critters';
import { findIn } from '../../src/systems/fossils';
import { parseMap } from '../../src/systems/grid';
import { hashString } from '../../src/systems/random';
import { weatherOn } from '../../src/systems/weather';
import type { CritterId, FossilId, MapZoneId } from '../../src/types/ids';

/*
 * 0.2's F1 (decision 150): real rarity, and seasons, so the last of the Curiosity Cabinet takes
 * most of a year. Done when a simulated year of play at an hour a day fills it in about ten months.
 */

const PLACES = ZONE_IDS.filter((id): id is MapZoneId => ZONES[id].map !== undefined).map((id) => {
  const map = parseMap(id === 'town' ? TOWN : ZONES[id].map!);
  return { id, habitats: id === 'town' ? townHabitats(map, true) : placeHabitats(id, map) };
});

/** The hours she might play, one a day: from eight in the morning until one at night. */
const PLAY_HOURS = [8, 9, 10, 11, 12, 13, 14, 15, 16, 17, 18, 19, 20, 21, 22, 23, 0];

const MONTH = 365 / 12;

/**
 * A year of play at an hour a day from `start`. The hour is dealt from the day, as life decides
 * it; she goes to the two places where the Cabinet's hints say the most she hasn't found could be
 * about, and catches everything out there. The day of the year each kind was first caught.
 */
function playYear(start: Date): Map<CritterId, number> {
  const firsts = new Map<CritterId, number>();
  for (let d = 0; d < 365; d++) {
    const date = new Date(start.getFullYear(), start.getMonth(), start.getDate() + d, 12);
    const day = dayKey(date.getTime());
    const hour = PLAY_HOURS[hashString(`play:${day}`) % PLAY_HOURS.length]!;
    const weather = weatherOn(day);
    const hinted = (place: MapZoneId) =>
      CRITTER_IDS.filter(
        (c) =>
          !firsts.has(c) && CRITTERS[c].where.includes(place) && isAbout(c, day, hour, weather),
      ).length;
    const order = [...PLACES].sort((a, b) => hinted(b.id) - hinted(a.id));
    for (const place of order.slice(0, 2)) {
      for (const c of crittersOut(day, hour, place.habitats, undefined, place.id)) {
        if (!firsts.has(c.critter)) firsts.set(c.critter, d);
      }
    }
  }
  return firsts;
}

/** A year of play from the first of each month, October 2026 to September 2027. */
const YEARS = Array.from({ length: 12 }, (_, m) => {
  const start = new Date(2026, 9 + m, 1, 12);
  return { start: dayKey(start.getTime()), firsts: playYear(start) };
});

describe('filling the Curiosity Cabinet', () => {
  it('takes about ten months at an hour a day, whenever in the year she starts', () => {
    for (const { start, firsts } of YEARS) {
      expect(
        CRITTER_IDS.filter((id) => !firsts.has(id)),
        start,
      ).toEqual([]);
      const last = Math.max(...firsts.values());
      expect(last / MONTH, start).toBeGreaterThan(8.5);
      expect(last / MONTH, start).toBeLessThan(11);
    }
  });

  it('leaves about a third still to find after the first month', () => {
    for (const { start, firsts } of YEARS) {
      const found = [...firsts.values()].filter((d) => d < MONTH).length;
      const quarter = Math.floor(CRITTER_IDS.length / 4);
      expect(CRITTER_IDS.length - found, start).toBeGreaterThanOrEqual(quarter);
      expect(found, start).toBeGreaterThanOrEqual(CRITTER_IDS.length / 2);
    }
  });

  it('finds the year-round commons first and the legendary ones last', () => {
    const mean = (rarity: string) => {
      const ids = CRITTER_IDS.filter(
        (id) => CRITTERS[id].rarity === rarity && !CRITTERS[id].season && !CRITTERS[id].holiday,
      );
      const days = YEARS.flatMap(({ firsts }) => ids.map((id) => firsts.get(id)!));
      return days.reduce((sum, d) => sum + d, 0) / days.length;
    };
    expect(mean('common')).toBeLessThan(mean('uncommon'));
    expect(mean('uncommon')).toBeLessThan(mean('rare'));
    expect(mean('rare')).toBeLessThan(mean('legendary'));
  });
});

/*
 * V1's R5 (decisions 271 and 310): no critter is ever more than a month away. Out of its season,
 * off its holiday or in the wrong weather, it visits round each full moon.
 */

describe('the wait for any critter', () => {
  it('is never more than 31 days, from any day of two years', () => {
    // The days each critter could be out, then the longest run of days without one.
    const SPAN = 730 + 40;
    const days = Array.from({ length: SPAN }, (_, d) => shiftDay('2026-10-01', d));
    const chances = new Map<CritterId, number[]>(CRITTER_IDS.map((id) => [id, []]));
    for (const [d, day] of days.entries()) {
      const weather = weatherOn(day);
      for (const id of CRITTER_IDS) {
        const out = Array.from({ length: 24 }, (_, h) => h).some((h) =>
          isAbout(id, day, h, weather),
        );
        if (out) chances.get(id)!.push(d);
      }
    }
    const longest = CRITTER_IDS.map((id) => {
      const at = [0, ...chances.get(id)!];
      return [id, Math.max(...at.slice(1).map((d, i) => d - at[i]!))] as const;
    });
    expect(longest.filter(([, wait]) => wait > 31)).toEqual([]);
    // And the Cabinet says so: the next chance from any day is the one these give.
    expect(daysBetween('2026-10-01', nextChance('pumpkinBat', '2026-12-01', 5)!.day)).toBe(
      chances.get('pumpkinBat')!.find((d) => d >= 61),
    );
  });
});

/*
 * 0.3's C1 (decision 250): the fossils, a mound a day in each place. A year of play at an hour a
 * day, going to the two places where the Cabinet hints the most fossils she hasn't found are, and
 * digging both their mounds, finds every fossil in about two months, the commons first.
 */

/** The day of the year each fossil was first dug up, digging the two places where the Cabinet hints the most she hasn't found could be. */
function digYear(start: Date): Map<FossilId, number> {
  const firsts = new Map<FossilId, number>();
  for (let d = 0; d < 365; d++) {
    const date = new Date(start.getFullYear(), start.getMonth(), start.getDate() + d, 12);
    const day = dayKey(date.getTime());
    const hinted = (place: MapZoneId) =>
      FOSSIL_IDS.filter((f) => !firsts.has(f) && FOSSILS[f].where.includes(place)).length;
    const places = [...PLACES]
      .map((p) => p.id)
      .sort(
        (a, b) =>
          hinted(b) - hinted(a) ||
          (hashString(`go:${day}:${a}`) % 97) - (hashString(`go:${day}:${b}`) % 97),
      );
    for (const place of places.slice(0, 2)) {
      const find = findIn(place, day);
      if ('fossil' in find && !firsts.has(find.fossil)) firsts.set(find.fossil, d);
    }
  }
  return firsts;
}

const DIGS = Array.from({ length: 12 }, (_, m) => {
  const start = new Date(2026, 9 + m, 1, 12);
  return { start: dayKey(start.getTime()), firsts: digYear(start) };
});

describe('filling the fossil case', () => {
  it('takes about two months at two mounds a day on average, and never more than five', () => {
    for (const { start, firsts } of DIGS) {
      expect(
        FOSSIL_IDS.filter((id) => !firsts.has(id)),
        start,
      ).toEqual([]);
      expect(Math.max(...firsts.values()) / MONTH, start).toBeLessThan(5);
    }
    const months = DIGS.map(({ firsts }) => Math.max(...firsts.values()) / MONTH);
    const mean = months.reduce((sum, m) => sum + m, 0) / months.length;
    expect(mean).toBeGreaterThan(1.5);
    expect(mean).toBeLessThan(3);
  });

  it('finds the commons first and the rare ones last', () => {
    const mean = (rarity: string) => {
      const ids = FOSSIL_IDS.filter((id) => FOSSILS[id].rarity === rarity);
      const days = DIGS.flatMap(({ firsts }) => ids.map((id) => firsts.get(id)!));
      return days.reduce((sum, d) => sum + d, 0) / days.length;
    };
    expect(mean('common')).toBeLessThan(mean('uncommon'));
    expect(mean('uncommon')).toBeLessThan(mean('rare'));
  });

  it('buries a fossil in most mounds, and a bead or Candy in the rest', () => {
    const finds = DIGS.slice(0, 1).flatMap(({ start }) =>
      Array.from({ length: 365 }, (_, d) => {
        const [y, m, dd] = start.split('-').map(Number);
        return findIn('town', dayKey(new Date(y!, m! - 1, dd! + d, 12).getTime()));
      }),
    );
    const fossils = finds.filter((f) => 'fossil' in f).length / finds.length;
    expect(fossils).toBeGreaterThan(0.65);
    expect(fossils).toBeLessThan(0.85);
    expect(finds.some((f) => 'bead' in f)).toBe(true);
    expect(finds.some((f) => 'candy' in f)).toBe(true);
  });
});
