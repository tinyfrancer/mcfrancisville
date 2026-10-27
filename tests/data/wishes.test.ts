import { describe, expect, it } from 'vitest';
import { ITEMS } from '../../src/data/items';
import { WELL_BACK, WELL_FINDS, WELL_PENNY_LINE, WISHES } from '../../src/data/wishes';
import { shiftDay } from '../../src/systems/calendar';
import { fill } from '../../src/systems/friendship';
import { decorOn } from '../../src/systems/holidays';
import { seasonOf } from '../../src/systems/seasons';
import { comesUpOn, wishOn } from '../../src/systems/well';
import { weatherOn } from '../../src/systems/weather';

/** Two years of days from the start of 2026. */
const DAYS = Array.from({ length: 730 }, (_, i) => shiftDay('2026-01-01', i));

const whenKey = (w: (typeof WISHES)[number]) => (w.when ? JSON.stringify(w.when) : null);

describe('the wishing well (1.7 Y2)', () => {
  it('has forty or so wishes, each a line that reads with any name in it', () => {
    expect(WISHES.length).toBeGreaterThanOrEqual(40);
    expect(new Set(WISHES.map((w) => w.line)).size).toBe(WISHES.length);
    for (const name of ['Cody', 'marigold', '  Ann  Marie ', '']) {
      for (const { line } of WISHES) {
        const said = fill(line, { name });
        expect(said, line).toMatch(/^["'A-Z]/);
        expect(said, line).toMatch(/[.!?…]["')]?$/);
        expect(said, line).not.toMatch(/[{}]| {2}| [,.!?;:]/);
        expect(said.length, line).toBeLessThan(140);
      }
    }
    for (const line of [WELL_PENNY_LINE, `${WELL_BACK} a wishing pebble!`]) {
      expect(line).toMatch(/^[A-Z].*[.!]$/);
    }
  });

  it("gives every season's, holiday's and weather's lines in pairs, one for odd days and one for even", () => {
    const parities = new Map<string, Set<number>>();
    WISHES.forEach((w, i) => {
      const key = whenKey(w);
      if (key) parities.set(key, (parities.get(key) ?? new Set()).add(i % 2));
    });
    expect(parities.size).toBeGreaterThanOrEqual(8);
    for (const [key, seen] of parities) expect([...seen].sort(), key).toEqual([0, 1]);
  });

  it('never says the same wish two days running, and says every one in two years', () => {
    const said = new Set<string>();
    let yesterday = '';
    for (const day of DAYS) {
      const { line } = wishOn(day);
      expect(line, day).not.toBe(yesterday);
      yesterday = line;
      said.add(line);
    }
    expect(said.size).toBe(WISHES.length);
  });

  it("says a day's season, holiday or weather only on such a day, and now and then on one", () => {
    let special = 0;
    for (const day of DAYS) {
      const { when } = wishOn(day);
      if (!when) continue;
      special++;
      if ('season' in when) expect(seasonOf(day), day).toBe(when.season);
      if ('decor' in when) expect(decorOn(day), day).toBe(when.decor);
      if ('weather' in when) expect(weatherOn(day), day).toBe(when.weather);
    }
    expect(special).toBeGreaterThan(DAYS.length / 6);
    expect(special).toBeLessThan(DAYS.length / 2);
  });

  it('sends something back up about one toss in seven, a pebble or a bead she knows', () => {
    const found = DAYS.map(comesUpOn).filter((f) => f !== null);
    expect(found.length / DAYS.length).toBeGreaterThan(1 / 10);
    expect(found.length / DAYS.length).toBeLessThan(1 / 5);
    for (const item of found) expect(WELL_FINDS.map((f) => f.item)).toContain(item);
    expect(new Set(found).size).toBeGreaterThan(1);
    for (const { item } of WELL_FINDS) expect(ITEMS[item]).toBeDefined();
  });
});
