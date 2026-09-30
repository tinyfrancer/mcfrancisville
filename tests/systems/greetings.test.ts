import { describe, expect, it } from 'vitest';
import { CALENDAR, CALENDAR_IDS } from '../../src/data/calendar';
import { EASTER_EGG_ODDS, HOLIDAY_GREETINGS, WELCOMES } from '../../src/data/greetings';
import { dayKey } from '../../src/systems/clock';
import { greetingFor } from '../../src/systems/greetings';

const at = (month: number, day: number, hour: number, minute = 0, year = 2026) =>
  new Date(year, month - 1, day, hour, minute).getTime();
const HOUR = 3_600_000;

/** A plain day: nothing on, and no Easter egg. */
function plainDay(): number {
  for (let d = 1; d < 365; d++) {
    const now = at(1, d, 9);
    const g = greetingFor(now, now - 20 * HOUR, 'Em');
    if (g.kind === 'back') return now;
  }
  throw new Error('no plain day');
}

describe("Cody's greeting", () => {
  it('is his hello to a brand-new neighbour', () => {
    expect(greetingFor(at(9, 27, 9), null, 'Em')).toMatchObject({
      kind: 'first',
      line: WELCOMES.first,
    });
  });

  it('welcomes her back by how long she has been away', () => {
    const now = plainDay();
    const line = (away: number) => greetingFor(now, now - away, 'Em').line;
    expect(WELCOMES.minutes).toContain(line(5 * 60_000));
    expect(WELCOMES.hours).toContain(line(2 * HOUR));
    expect(WELCOMES.window.morning).toContain(line(20 * HOUR));
    expect(line(3 * 24 * HOUR)).toMatch(/3 days/);
    expect(line(8 * 24 * HOUR)).toMatch(/8 days/);
    expect(line(30 * 24 * HOUR)).toMatch(/4 weeks/);
  });

  it('says good afternoon in a new window of the same day', () => {
    const morning = plainDay();
    const afternoon = morning + 5 * HOUR;
    expect(WELCOMES.window.afternoon).toContain(greetingFor(afternoon, morning, 'Em').line);
  });

  it('keeps the same line all through a window', () => {
    const now = plainDay();
    expect(greetingFor(now, now - 2 * HOUR, 'Em')).toEqual(
      greetingFor(now + 30 * 60_000, now - 2 * HOUR, 'Em'),
    );
  });

  it("is the day's own on a special day, every time", () => {
    expect(greetingFor(at(6, 6, 9, 0, 2027), at(6, 6, 8, 0, 2027), 'Em').line).toMatch(/7 years/);
    expect(greetingFor(at(4, 9, 9), at(4, 8, 9), 'Em').kind).toBe('special');
  });

  it("is the holiday's on the first visit of a holiday, and his welcome after", () => {
    const christmas = at(12, 25, 9);
    const first = greetingFor(christmas, at(12, 24, 20), 'Em');
    expect(first).toMatchObject({ kind: 'holiday', line: HOLIDAY_GREETINGS.christmas });
    expect(greetingFor(christmas + HOUR, christmas, 'Em').kind).toBe('back');
  });

  it('has a line for every holiday and town event on the calendar', () => {
    for (const id of CALENDAR_IDS) {
      // A festival is a month of days: its own words are the calendar's and the morning's.
      if (CALENDAR[id].kind === 'special' || CALENDAR[id].kind === 'festival') continue;
      expect(HOLIDAY_GREETINGS[id as keyof typeof HOLIDAY_GREETINGS], id).toBeTruthy();
    }
  });

  it('is now and then the red Tesla or the Pokémon reminder, on the first visit of a day', () => {
    const kinds = { redOne: 0, pokemon: 0 };
    let days = 0;
    for (let d = 0; d < 2000; d++) {
      const now = at(1, 1, 9, 0, 2027) + d * 24 * HOUR;
      const g = greetingFor(now, now - 20 * HOUR, 'Em');
      if (g.kind === 'holiday') continue;
      days++;
      if (g.kind === 'redOne' || g.kind === 'pokemon') kinds[g.kind]++;
      if (g.kind === 'redOne') expect(g.after).toBeTruthy();
      // Later the same day it's his usual welcome.
      expect(['back', 'special']).toContain(greetingFor(now + HOUR, now, 'Em').kind);
    }
    expect(kinds.redOne / days).toBeGreaterThan(EASTER_EGG_ODDS.redOne / 200);
    expect(kinds.redOne / days).toBeLessThan((EASTER_EGG_ODDS.redOne * 2) / 100);
    expect(kinds.pokemon / days).toBeGreaterThan(EASTER_EGG_ODDS.pokemon / 200);
    expect(kinds.pokemon / days).toBeLessThan((EASTER_EGG_ODDS.pokemon * 2) / 100);
  });

  it('fills in her name and never leaves a blank', () => {
    for (let d = 0; d < 400; d++) {
      const now = at(1, 1, 9 + (d % 12), 0, 2027) + d * 24 * HOUR;
      for (const away of [60_000, 2 * HOUR, 20 * HOUR, 4 * 24 * HOUR, 40 * 24 * HOUR]) {
        const { line, reply } = greetingFor(now, now - away, 'Em Rose');
        expect(line, dayKey(now)).not.toMatch(/\{|\}/);
        expect(reply).toBeTruthy();
      }
    }
  });
});
