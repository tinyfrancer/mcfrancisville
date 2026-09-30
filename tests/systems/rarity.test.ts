import { describe, expect, it } from 'vitest';
import { CRITTER_IDS, CRITTERS } from '../../src/data/critters';
import { TOWN } from '../../src/data/maps';
import { ZONE_IDS, ZONES } from '../../src/data/zones';
import { dayKey } from '../../src/systems/clock';
import { crittersOut, isAbout, placeHabitats, townHabitats } from '../../src/systems/critters';
import { parseMap } from '../../src/systems/grid';
import { hashString } from '../../src/systems/random';
import { weatherOn } from '../../src/systems/weather';
import type { CritterId, MapZoneId } from '../../src/types/ids';

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
  const start = new Date(2026, 9 + m, 1);
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
      expect(CRITTER_IDS.length - found, start).toBeGreaterThanOrEqual(CRITTER_IDS.length / 4);
      expect(found, start).toBeGreaterThanOrEqual(CRITTER_IDS.length / 2);
    }
  });

  it('finds the year-round commons first and the legendary ones last', () => {
    const mean = (rarity: string) => {
      const ids = CRITTER_IDS.filter(
        (id) => CRITTERS[id].rarity === rarity && !CRITTERS[id].season,
      );
      const days = YEARS.flatMap(({ firsts }) => ids.map((id) => firsts.get(id)!));
      return days.reduce((sum, d) => sum + d, 0) / days.length;
    };
    expect(mean('common')).toBeLessThan(mean('uncommon'));
    expect(mean('uncommon')).toBeLessThan(mean('rare'));
    expect(mean('rare')).toBeLessThan(mean('legendary'));
  });
});
