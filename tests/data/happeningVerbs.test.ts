import { describe, expect, it } from 'vitest';
import { BIRTHDAY_LINES, BIRTHDAY_PARTIES, PARTY_IDS } from '../../src/data/birthdayParties';
import { BIRTHDAYS } from '../../src/data/birthdays';
import { BAKES } from '../../src/data/baking';
import { HAPPENING_IDS, HAPPENINGS } from '../../src/data/happenings';
import { VERBS, verbRow } from '../../src/data/happeningVerbs';
import { INTERIORS } from '../../src/data/interiors';
import { ITEMS } from '../../src/data/items';
import { fill } from '../../src/systems/friendship';
import { choicesOn, recalled, requestsFrom } from '../../src/systems/joining';
import { LESSONS, tunesOf } from '../../src/data/instruments';
import { WEEKLY_HAPPENINGS } from '../../src/data/weeklyHappenings';
import { happensOn } from '../../src/systems/happenings';

const NAMES = ['Kaylee', 'mel', 'Ana Sofia'];

/** Her name straight after a thing reads as one more thing (`tests/data/dialogue.test.ts`). */
const AFTER_A_THING = /\b(?:a|an|my|your|some|the)\s+(?:[\w'-]+\s+){0,2}[\w'-]+, \{name\}/;

/** A line said with each sample name, nothing left to fill, her name never after a thing. */
function reads(line: string, label: string) {
  for (const name of NAMES) {
    const said = fill(line, { name });
    expect(said, label).not.toMatch(/[{}]/);
  }
  for (const sentence of line.split(/(?<=[.!?])\s+/)) {
    expect(AFTER_A_THING.test(sentence), `${label}: ${sentence}`).toBe(false);
  }
}

describe("every happening has a verb (V1's P4)", () => {
  it('names one for every happening, its own or one of P4s', () => {
    for (const id of HAPPENING_IDS) expect(VERBS[id], id).toBeDefined();
    const own = HAPPENING_IDS.filter((id) => 'own' in VERBS[id]);
    expect(own.sort()).toEqual(['anniversaryDuet', 'costumeContest', 'eggHunt', 'unmasking']);
  });

  it('asks before a pick, says something after, and remembers it the next time', () => {
    for (const id of HAPPENING_IDS) {
      const row = verbRow(id);
      if (!row) continue;
      expect(row.label, id).toMatch(/^\S+ \S/);
      if (row.choices) {
        expect(row.ask, id).toBeTruthy();
        reads(row.ask!, id);
        expect(row.remembers, id).toContain('{choice}');
      } else {
        expect(row.done, id).toBeTruthy();
        reads(row.done!, id);
        expect(row.remembers, id).not.toContain('{choice}');
      }
      const list = row.choices === 'tunes' ? null : (row.choices ?? null);
      if (list) {
        const ids = list.map((c) => c.id);
        expect(new Set(ids).size, id).toBe(ids.length);
        expect(row.deal ?? ids.length, id).toBeLessThanOrEqual(ids.length);
        for (const c of list) {
          reads(c.back, `${id} ${c.id}`);
          reads(row.remembers.replaceAll('{choice}', c.called), `${id} ${c.id}`);
          if (c.gives) expect(ITEMS[c.gives].kind, `${id} ${c.id}`).toBe('seed');
        }
      }
      // Only Cody calls her babe, and only where he's the host.
      const lines = [row.ask, row.done, row.remembers, ...(list ?? []).map((c) => c.back)];
      const babe = lines.some((l) => l !== undefined && /\bbabe\b/.test(l));
      expect(babe, id).toBe(HAPPENINGS[id].who[0] === 'cody');
    }
  });

  it('deals the picks a week at a time, the same all week and new the next', () => {
    const row = verbRow('bookClub')!;
    const week = ['2026-10-12', '2026-10-14', '2026-10-18'].map((d) =>
      choicesOn('bookClub', row, d).map((c) => c.id),
    );
    expect(week[1]).toEqual(week[0]);
    expect(week[2]).toEqual(week[0]);
    const weeks = new Set(
      Array.from({ length: 8 }, (_, k) =>
        choicesOn('bookClub', row, `2026-11-${String(2 + 7 * (k % 4)).padStart(2, '0')}`)
          .map((c) => c.id)
          .join(),
      ),
    );
    expect(weeks.size).toBeGreaterThan(1);
  });

  it('takes the recital requests from what she has learnt first, three in all', () => {
    expect(requestsFrom([])).toEqual(tunesOf('piano').slice(0, 3));
    expect(requestsFrom([LESSONS[0]!, LESSONS[1]!])).toEqual([
      LESSONS[1],
      LESSONS[0],
      tunesOf('piano')[0],
    ]);
  });

  it('remembers on a later day only, and forgets a pick it no longer knows', () => {
    const row = verbRow('stargazing')!;
    const pip = { on: '2026-10-15', choice: 'pip' };
    expect(recalled(row, pip, '2026-10-15')).toBeNull();
    expect(recalled(row, pip, '2026-10-22')).toContain('Little Pip');
    expect(recalled(row, { on: '2026-10-15', choice: 'gone' }, '2026-10-22')).toBeNull();
    expect(recalled(verbRow('moonHowl')!, { on: '2026-09-26' }, '2026-10-26')).toContain('AWOO');
  });
});

describe("baking together, a step at a time (V1's P4)", () => {
  it('tells every bake in three steps at the bowl or the oven, then its line', () => {
    for (const bake of BAKES) {
      expect(bake.steps, bake.item).toHaveLength(3);
      expect(bake.steps[0]!.does, bake.item).toBe('pour');
      expect(
        bake.steps.some((s) => s.does === 'crouch'),
        bake.item,
      ).toBe(true);
      for (const step of bake.steps) reads(step.line, bake.item);
    }
  });
});

describe("every neighbour's week and birthday (V1's P4)", () => {
  it('gives Hazel, Boothoven, Nessa, Ollie and Gourdon a happening a week, and Nessa her dusk', () => {
    const hosts = Object.values(WEEKLY_HAPPENINGS).map((r) => r.who[0]);
    expect(new Set(hosts)).toEqual(new Set(['nessa', 'boothoven', 'ollie', 'hazel', 'gourdon']));
    const week = Array.from({ length: 7 }, (_, i) => `2026-10-${12 + i}`);
    expect(week.every((d) => happensOn('lanternLighting', d))).toBe(true);
    for (const id of ['recital', 'lanternNight', 'parcelDay', 'openDay'] as const) {
      expect(
        week.filter((d) => happensOn(id, d)),
        id,
      ).toHaveLength(1);
    }
    // Stargazing only on a clear Thursday.
    const thursdays = Array.from({ length: 52 }, (_, k) =>
      new Date(Date.UTC(2027, 0, 7 + 7 * k)).toISOString().slice(0, 10),
    );
    const clear = thursdays.filter((d) => happensOn('stargazing', d)).length;
    expect(clear).toBeGreaterThan(10);
    expect(clear).toBeLessThan(52);
  });

  it('has a birthday line and a party at theirs for everyone with a birthday', () => {
    const withDays = Object.keys(BIRTHDAYS).filter(
      (id) => typeof BIRTHDAYS[id as 'maude'] === 'string',
    );
    expect(Object.keys(BIRTHDAY_LINES).sort()).toEqual(withDays.sort());
    expect(PARTY_IDS).toHaveLength(withDays.length);
    for (const id of PARTY_IDS) {
      const row = BIRTHDAY_PARTIES[id];
      const host = row.who[0]!;
      expect(`${host}Birthday`).toBe(id);
      expect('inside' in row.where && INTERIORS[row.where.inside], id).toBeTruthy();
      reads(BIRTHDAY_LINES[host as keyof typeof BIRTHDAY_LINES], host);
      for (const line of Object.values(row.says)) reads(line!, id);
      expect(happensOn(id, `2027-${BIRTHDAYS[host] as string}`), id).toBe(host !== 'robBoo');
    }
  });
});
