import { describe, expect, it } from 'vitest';
import { CALENDAR_IDS, CALENDAR, type FestivalId } from '../../src/data/calendar';
import { RHYTHM_GREETINGS } from '../../src/data/greetings';
import { FESTIVAL_LINES } from '../../src/data/festivalLines';
import { RARE_EVENT_IDS } from '../../src/data/rareEvents';
import { festivalDay, festivalsOn, shiftDay } from '../../src/systems/calendar';
import { dayLine } from '../../src/systems/friendship';
import { greetingFor, rhythmOn } from '../../src/systems/greetings';
import { rareEventBegan, rareEventOn } from '../../src/systems/rareEvents';

/* V1's R3: Cody has a hello for every new festival week and every rare event. */

const SEASON_FESTIVALS = CALENDAR_IDS.filter(
  (id): id is Exclude<FestivalId, 'halloweenFestival'> =>
    CALENDAR[id].kind === 'festival' && id !== 'halloweenFestival',
);

const DAYS = Array.from({ length: 1100 }, (_, i) => shiftDay('2026-10-01', i));

describe("Cody's hello on a day out of the ordinary", () => {
  it('has a line for every festival week and every rare event', () => {
    expect(SEASON_FESTIVALS.length).toBe(3);
    for (const id of [...SEASON_FESTIVALS, ...RARE_EVENT_IDS]) {
      expect(RHYTHM_GREETINGS[id], id).toBeTruthy();
    }
  });

  it("says it on the first visit of a festival week's first day, or a rare event's", () => {
    for (const id of SEASON_FESTIVALS) {
      const first = DAYS.find((d) => festivalsOn(d).includes(id) && festivalDay(id, d).nth === 1)!;
      expect(rhythmOn(first), id).toBe(id);
      const morning = new Date(`${first}T09:00:00`).getTime();
      const g = greetingFor(morning, morning - 20 * 3_600_000, 'Em');
      // A holiday on the same day keeps its own hello.
      if (g.line !== RHYTHM_GREETINGS[id]) expect(g.kind, first).toBe('holiday');
      expect(rhythmOn(shiftDay(first, 1)), id).not.toBe(id);
    }
    for (const id of RARE_EVENT_IDS) {
      const day = DAYS.find((d) => rareEventOn(d) === id && rareEventBegan(d) === d)!;
      const morning = new Date(`${day}T09:00:00`).getTime();
      expect(greetingFor(morning, morning - 20 * 3_600_000, 'Em'), id).toMatchObject({
        kind: 'holiday',
        line: RHYTHM_GREETINGS[id],
      });
    }
  });

  it('has a few neighbours say something of each festival week, on its first day', () => {
    for (const id of SEASON_FESTIVALS) {
      const first = DAYS.find((d) => festivalsOn(d).includes(id) && festivalDay(id, d).nth === 1)!;
      const said = Object.keys(FESTIVAL_LINES[id]).filter(
        (who) => dayLine(who as keyof (typeof FESTIVAL_LINES)[typeof id], first) !== null,
      );
      expect(said.length, id).toBeGreaterThanOrEqual(5);
    }
  });
});
