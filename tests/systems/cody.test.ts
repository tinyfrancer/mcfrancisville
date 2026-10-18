import { describe, expect, it } from 'vitest';
import {
  ASKS,
  ASKS_ABOUT,
  HER_DAY_ANSWERS,
  HER_DAY_BACKS,
  HUSBAND_TALK,
  MARRIED_LINES,
  OUR_STORY,
  TOGETHER,
  YESTERDAY,
} from '../../src/data/cody';
import { shiftDay } from '../../src/systems/calendar';
import {
  askOf,
  atHers,
  backOf,
  eveningAtHers,
  husbandTopics,
  storyDue,
  yesterdayOf,
} from '../../src/systems/cody';
import { STRANGERS, type Around, type TalkScene } from '../../src/systems/dialogue';
import { fill, linesNow, tierOf } from '../../src/systems/friendship';
import { bandOf } from '../../src/systems/remembering';
import { bandOf as bandSaid } from '../../src/hud/NeighboursSheet';

const PLAIN: Around = {
  weather: 'clear',
  storm: false,
  holding: 'hands',
  caught: null,
  pet: null,
  wearing: ['maroonTee', 'jeans'],
  placed: null,
  harvested: null,
  donated: null,
  visits: 1,
  clue: null,
  met: null,
};

const scene = (more: Partial<TalkScene> = {}): TalkScene => ({
  ...PLAIN,
  ...STRANGERS,
  band: 'married',
  ...more,
});

/** Every line of his here, with every placeholder filled as a talk would. */
function allLines(): string[] {
  return [
    ...MARRIED_LINES,
    ...ASKS,
    ...Object.values(ASKS_ABOUT).flat(),
    ...Object.values(HER_DAY_BACKS).flat(),
    ...Object.values(YESTERDAY).flat(),
    ...Object.values(HUSBAND_TALK).flat(),
    ...OUR_STORY.flatMap((s) => [...s.lines, ...(s.replies ?? []).map((r) => r.back)]),
    ...Object.values(TOGETHER).flatMap((t) => t.lines),
  ];
}

describe("Cody, married (V1's P5)", () => {
  it('is in a band of his own from the first day, above best friends', () => {
    expect(bandOf(0, 'cody')).toBe('married');
    expect(bandOf(10, 'maude')).toBe('best');
    expect(tierOf(0, 'cody')).toBe('married');
    expect(bandSaid(0, 'cody', '2026-10-17')).toBe('Married, 6 years');
    expect(bandSaid(0, 'maude')).toBe('Getting to know you');
    // A husband's lines are his friend and close lines, and a husband's own.
    const pool = linesNow('cody', 0, 12);
    expect(pool).toEqual(expect.arrayContaining([...MARRIED_LINES]));
    expect(pool).not.toContain("I'm a vampire, babe. I don't do mornings. I barely do afternoons.");
  });

  it('spends most evenings at hers, from seven, and one night in seven at the manor', () => {
    let nights = 0;
    let day = '2026-10-01';
    for (let i = 0; i < 140; i++, day = shiftDay(day, 1)) if (eveningAtHers(day)) nights++;
    expect(nights / 140).toBeGreaterThan(0.75);
    expect(nights / 140).toBeLessThan(0.95);
    const home = ['2026-10-01', '2026-10-02', '2026-10-05'].find(eveningAtHers)!;
    expect(atHers(18.5, home)).toBe(false);
    expect(atHers(20, home)).toBe(true);
    expect(atHers(23, home)).toBe(false);
    // Never on her birthday: everyone is at the party.
    expect(eveningAtHers('2027-04-09')).toBe(false);
  });

  it('asks about the first thing she did today, or the day’s way of asking', () => {
    const day = '2026-10-17';
    expect(ASKS).toContain(askOf(PLAIN, day));
    const caught = askOf({ ...PLAIN, caught: 'candleMoth' }, day);
    expect(caught).toContain('a candle moth');
    const picked = askOf({ ...PLAIN, harvested: { crop: 'pumpkin', day } }, day);
    expect(picked).toMatch(/pumpkin/i);
    expect(askOf({ ...PLAIN, harvested: { crop: 'pumpkin', day: '2026-10-16' } }, day)).toBe(
      askOf(PLAIN, day),
    );
    expect(askOf({ ...PLAIN, placed: { piece: 'batLamp', day } }, day)).toMatch(/bat lamp/i);
  });

  it('never asks or answers the same way twice in a week', () => {
    for (const answer of HER_DAY_ANSWERS) {
      const week = Array.from({ length: 7 }, (_, i) => backOf(answer, shiftDay('2026-10-01', i)));
      expect(new Set(week).size).toBe(7);
    }
    const asks = Array.from({ length: 7 }, (_, i) => askOf(PLAIN, shiftDay('2026-10-01', i)));
    expect(new Set(asks).size).toBe(7);
  });

  it('brings up her day the next day, first, and what only he notices', () => {
    const day = '2026-10-18';
    const herDay = { day: '2026-10-17', answer: 'long' as const };
    expect(YESTERDAY.long).toContain(yesterdayOf(herDay, day));
    // Two days on, it's old news.
    expect(yesterdayOf(herDay, '2026-10-19')).toBeNull();
    const told = scene({ here: 'home' });
    const topics = husbandTopics('cody', { ...told, pets: ['Fibi'], yard: ['gardenBench'] }, day);
    expect(topics.map((t) => t.topic)).toEqual(['look', 'pets', 'yard']);
    expect(topics.find((t) => t.topic === 'pets')!.lines[0]!.text).toContain('Fibi');
    // Nobody else says any of it.
    expect(husbandTopics('maude', told, day)).toEqual([]);
    const placed = scene({ here: 'home', placed: { piece: 'batLamp', day: '2026-10-10' } });
    expect(husbandTopics('cody', placed, day).map((t) => t.topic)).toContain('newest');
  });

  it('tells their story over her first weeks, a scene at a time', () => {
    expect(storyDue(1, [])).toBeNull();
    expect(storyDue(3, [])?.id).toBe('ice');
    expect(storyDue(30, ['ice'])?.id).toBe('castle');
    expect(storyDue(30, ['ice', 'castle'])?.id).toBe('moon');
    expect(storyDue(30, ['ice', 'castle', 'moon'])).toBeNull();
    expect(OUR_STORY.at(-1)!.replies).toHaveLength(3);
  });

  it('says every line whole, and "babe" in about one line in four', () => {
    const lines = allLines();
    for (const line of lines) {
      const said = fill(line, { name: 'Mary Beth', years: 6 }).replaceAll(
        /\{(catch|donated|harvest|piece|wearing|with|pet|yard|snack)\}/g,
        'thing',
      );
      expect(said, line).not.toMatch(/[{}]|\bundefined\b|\bnull\b/);
      expect(said, line).not.toMatch(/’/);
    }
    const babe = lines.filter((l) => /\bbabe\b/i.test(l)).length / lines.length;
    expect(babe).toBeLessThan(0.3);
    expect(babe).toBeGreaterThan(0.1);
  });
});
