import { describe, expect, it } from 'vitest';
import { HAPPENINGS } from '../../src/data/happenings';
import { shiftDay } from '../../src/systems/calendar';
import { isVisitDay } from '../../src/systems/critters';
import {
  bubblesOver,
  callersOn,
  hasFresh,
  todayLines,
  visitsIn,
  type TodayFacts,
} from '../../src/systems/today';
import { todayWords } from '../../src/hud/todayWords';

const QUIET: TodayFacts = {
  day: '2026-10-14',
  hour: 10,
  window: '2026-10-14:morning',
  firstDay: null,
  notes: [],
  favours: [],
  tree: 0,
  stall: { tin: 0, sold: 0 },
  ripe: [],
  mounds: [],
  wanted: [],
  happenings: [],
  venue: () => 'town',
  callers: [],
  critters: { visiting: [], fresh: [] },
  rare: null,
  peddlers: [],
  passers: [],
  stray: null,
  project: null,
  freeGo: null,
};

describe("Today's lines (V1's R2)", () => {
  it('has nothing to say of a town with nothing waiting', () => {
    const lines = todayLines(QUIET).filter((l) => l.kind !== 'visitsSoon');
    expect(lines).toEqual([]);
  });

  it('puts Cody’s list first, and leaves out what’s done', () => {
    const lines = todayLines({
      ...QUIET,
      firstDay: { done: 2, of: 6 },
      tree: 60,
      notes: [
        { from: 'maude', done: true },
        { from: 'barty', done: false },
      ],
      mounds: [
        { zone: 'town', tile: { tx: 1, ty: 1 }, dug: true },
        { zone: 'whisperwood', tile: { tx: 2, ty: 2 }, dug: false },
      ],
    });
    expect(lines.map((l) => l.kind).slice(0, 4)).toEqual(['firstDay', 'tree', 'notes', 'mounds']);
    expect(lines.find((l) => l.kind === 'notes')).toMatchObject({ open: 1, from: ['barty'] });
    expect(lines.find((l) => l.kind === 'mounds')).toMatchObject({
      zones: ['whisperwood'],
      go: { zone: 'whisperwood', tile: { tx: 2, ty: 2 } },
    });
    expect(todayLines({ ...QUIET, firstDay: { done: 6, of: 6 } })[0]?.kind).not.toBe('firstDay');
  });

  it('groups ripe beds by place', () => {
    const lines = todayLines({
      ...QUIET,
      ripe: [
        { zone: 'town', tx: 1, ty: 1, crop: 'pumpkin' },
        { zone: 'whisperwood', tx: 4, ty: 4, crop: 'rose' },
        { zone: 'town', tx: 2, ty: 1, crop: 'rose' },
      ],
    });
    expect(lines.filter((l) => l.kind === 'ripe')).toMatchObject([
      { zone: 'town', beds: 2, crop: 'pumpkin', go: { zone: 'town', tile: { tx: 1, ty: 1 } } },
      { zone: 'whisperwood', beds: 1 },
    ]);
  });

  it("names tonight's happening until it's over, and a caller until they've gone", () => {
    const [id] = Object.keys(HAPPENINGS) as (keyof typeof HAPPENINGS)[];
    const row = HAPPENINGS[id!];
    const at = (hour: number) =>
      todayLines({
        ...QUIET,
        hour,
        happenings: [id!],
        callers: [{ who: 'rufus', from: 14, until: 17 }],
      });
    expect(at(row.from - 1).find((l) => l.kind === 'happening')).toMatchObject({ now: false });
    expect(at((row.from + 0.5) % 24).find((l) => l.kind === 'happening')).toMatchObject({
      now: true,
    });
    expect(at(15).find((l) => l.kind === 'callers')).toMatchObject({
      now: true,
      go: { zone: 'home' },
    });
    expect(at(11).find((l) => l.kind === 'callers')).toMatchObject({ now: false });
    expect(at(17.5).some((l) => l.kind === 'callers')).toBe(false);
  });

  it('says the critters are coming in a day or two, the day after a full moon', () => {
    let day = '2026-10-01';
    while (!isVisitDay(day)) day = shiftDay(day, 1);
    expect(visitsIn(shiftDay(day, -2))).toBe(2);
    expect(visitsIn(day)).not.toBe(0);
    const before = todayLines({ ...QUIET, day: shiftDay(day, -1) });
    expect(before.find((l) => l.kind === 'visitsSoon')).toMatchObject({ days: 1 });
  });

  it('counts her husband home of an evening, and the visit dealt to hers', () => {
    for (let k = 0; k < 14; k++) {
      const day = shiftDay('2026-10-12', k);
      for (const c of callersOn(day, () => false)) {
        expect(c.from).toBeLessThan(c.until);
      }
    }
    const week = Array.from({ length: 7 }, (_, k) =>
      callersOn(shiftDay('2026-10-12', k), () => false),
    );
    expect(week.some((day) => day.some((c) => c.who === 'cody' && c.from >= 19))).toBe(true);
  });

  it('is news only for a line she has not seen', () => {
    const lines = todayLines({ ...QUIET, tree: 20 });
    expect(hasFresh(lines, [])).toBe(true);
    expect(
      hasFresh(
        lines,
        lines.map((l) => l.key),
      ),
    ).toBe(false);
  });

  it('puts a favour’s parcel beside the news or the lost thing', () => {
    expect(bubblesOver('!', true)).toEqual(['!', '+']);
    expect(bubblesOver(null, true)).toEqual(['+']);
    expect(bubblesOver('?', false)).toEqual(['?']);
    expect(bubblesOver(null, false)).toEqual([]);
  });

  it('words every kind of line', () => {
    const lines = todayLines({
      ...QUIET,
      firstDay: { done: 1, of: 6 },
      tree: 40,
      stall: { tin: 30, sold: 2 },
      ripe: [{ zone: 'town', tx: 1, ty: 1, crop: 'pumpkin' }],
      notes: [{ from: 'maude', done: false }],
      favours: [{ who: 'barty', item: 'rose', count: 2, zone: 'town' }],
      mounds: [{ zone: 'lanternShore', tile: { tx: 1, ty: 1 }, dug: false }],
      wanted: ['pumpkin'],
      callers: [{ who: 'cody', from: 19, until: 22 }],
      critters: { visiting: ['firefly'], fresh: ['firefly'] },
    });
    for (const line of lines) {
      const words = todayWords(line);
      expect(words.text.length, line.kind).toBeGreaterThan(8);
      expect(words.small.length, line.kind).toBeGreaterThan(3);
    }
    const favour = lines.find((l) => l.kind === 'favour')!;
    expect(todayWords(favour).text).toBe('Barty is asking for 2 roses');
  });
});

describe("Today's free go at the fair (1.0.1)", () => {
  it('says which stall’s first go is free, and takes her up to it', () => {
    const [line] = todayLines({ ...QUIET, freeGo: { id: 'duckPond', open: true } }).filter(
      (l) => l.kind === 'freeGo',
    );
    expect(line).toMatchObject({
      kind: 'freeGo',
      id: 'duckPond',
      key: 'freeGo:2026-10-14',
      go: { zone: 'fairground', prop: 'duckPondStall' },
    });
    expect(todayWords(line!).text).toBe('Your first go at the duck pond is free today');
    expect(todayWords(line!).small).toContain('whenever you like');
    const shut = todayLines({ ...QUIET, freeGo: { id: 'strengthBell', open: false } }).find(
      (l) => l.kind === 'freeGo',
    )!;
    expect(todayWords(shut).small).toContain('once its stall opens');
  });

  it('says nothing once it’s had', () => {
    expect(todayLines(QUIET).some((l) => l.kind === 'freeGo')).toBe(false);
  });
});
