import { describe, expect, it } from 'vitest';
import { CONSTELLATION_IDS, CONSTELLATIONS, MONTHLY, SKY_BOX } from '../../src/data/constellations';
import { keyOf, shiftDay } from '../../src/systems/calendar';
import { decorOn } from '../../src/systems/holidays';
import { rareEventOn } from '../../src/systems/rareEvents';
import {
  constellationOf,
  findableOn,
  linesLit,
  skyOf,
  starAt,
  tapStar,
  type Trace,
} from '../../src/systems/stars';
import type { ConstellationId } from '../../src/types/ids';

/** The night sky (1.5's G4, decision 373). */
describe('the constellations', () => {
  it('are twelve, one a month, and three for holidays', () => {
    expect(MONTHLY).toEqual([
      'snowflake',
      'candle',
      'toadstool',
      'moth',
      'broom',
      'lantern',
      'key',
      'cat',
      'cauldron',
      'bat',
      'pumpkin',
      'ghost',
    ]);
    for (let month = 1; month <= 12; month++) {
      expect(CONSTELLATIONS[constellationOf(month)].when).toEqual({ month });
    }
    const holidays = CONSTELLATION_IDS.filter((id) => 'holiday' in CONSTELLATIONS[id].when);
    expect(holidays.map((id) => CONSTELLATIONS[id].when)).toEqual([
      { holiday: 'valentines' },
      { holiday: 'easter' },
      { holiday: 'christmas' },
    ]);
    expect(constellationOf(10)).toBe('bat');
  });

  it('each have five to nine stars in the box, every one after the first joining one before', () => {
    for (const id of CONSTELLATION_IDS) {
      const { stars, lines } = CONSTELLATIONS[id];
      expect(stars.length, id).toBeGreaterThanOrEqual(5);
      expect(stars.length, id).toBeLessThanOrEqual(9);
      for (const { x, y } of stars) {
        expect(x >= 0 && x <= SKY_BOX.w && y >= 0 && y <= SKY_BOX.h, id).toBe(true);
      }
      for (let i = 1; i < stars.length; i++) {
        expect(
          lines.some(([a, b]) => (a === i && b < i) || (b === i && a < i)),
          `${id}'s star ${i}`,
        ).toBe(true);
      }
      for (const [a, b] of lines)
        expect(a !== b && a < stars.length && b < stars.length).toBe(true);
      // Two stars of one shape far enough apart that a fingertip touches only one.
      for (let i = 0; i < stars.length; i++) {
        for (let j = i + 1; j < stars.length; j++) {
          const d = Math.hypot(stars[i]!.x - stars[j]!.x, stars[i]!.y - stars[j]!.y);
          expect(d, `${id} ${i}–${j}`).toBeGreaterThanOrEqual(8);
        }
      }
    }
  });
});

describe('what she can find', () => {
  it("is this month's and the two months' before it, this month's first", () => {
    // An ordinary day with nothing on: no holiday's decorations, no meteor shower.
    const day = '2026-08-12';
    expect(decorOn(day)).toBeNull();
    expect(rareEventOn(day)).not.toBe('meteorShower');
    expect(findableOn(day)).toEqual(['cat', 'key', 'lantern']);
  });

  it('wraps round the year', () => {
    const day = ['2027-01-12', '2027-01-13', '2027-01-14', '2027-01-15'].find(
      (d) => rareEventOn(d) !== 'meteorShower' && decorOn(d) === null,
    )!;
    expect(findableOn(day)).toEqual(['snowflake', 'ghost', 'pumpkin']);
  });

  it("puts a holiday's out while its decorations are up, and every one on a meteor shower's night", () => {
    expect(findableOn('2027-02-14')).toContain('heart');
    expect(findableOn('2026-12-24')).toContain('christmasStar');
    expect(findableOn('2026-12-24')[0]).toBe('ghost');
    let day = '2026-10-26';
    while (rareEventOn(day) !== 'meteorShower') day = shiftDay(day, 1);
    const all = findableOn(day);
    expect(new Set(all)).toEqual(new Set(CONSTELLATION_IDS));
    expect(all[0]).toBe(constellationOf(Number(day.slice(5, 7))));
  });

  it('never leaves a constellation more than a year away', () => {
    const seen = new Set<ConstellationId>();
    for (let k = 0; k < 366; k++) {
      for (const id of findableOn(shiftDay(keyOf(2027, 1, 1), k))) seen.add(id);
    }
    expect(seen.size).toBe(CONSTELLATION_IDS.length);
  });
});

describe('the sky', () => {
  it('is open after dark on a clear day, bright by day and cloudy in rain or fog', () => {
    expect(skyOf(22, 'clear')).toBe('open');
    expect(skyOf(2, 'clear')).toBe('open');
    expect(skyOf(20, 'clear')).toBe('open');
    expect(skyOf(19.5, 'clear')).toBe('bright');
    expect(skyOf(12, 'clear')).toBe('bright');
    expect(skyOf(22, 'rain')).toBe('cloudy');
    expect(skyOf(22, 'fog')).toBe('cloudy');
  });
});

describe('tracing', () => {
  it('lights the stars in order, the last lighting the whole', () => {
    let trace: Trace = { id: 'christmasStar', lit: 0 };
    const results: string[] = [];
    for (let star = 0; star < 5; star++) {
      const tapped = tapStar(trace, star);
      trace = tapped.trace;
      results.push(tapped.result.kind);
    }
    expect(results).toEqual(['lit', 'lit', 'lit', 'lit', 'done']);
    expect(linesLit('christmasStar', 5)).toHaveLength(5);
  });

  it('only twinkles a star out of order, and loses nothing for it', () => {
    let trace: Trace = { id: 'bat', lit: 0 };
    trace = tapStar(trace, 0).trace;
    trace = tapStar(trace, 1).trace;
    const wrong = tapStar(trace, 5);
    expect(wrong.result.kind).toBe('twinkle');
    expect(wrong.trace).toEqual({ id: 'bat', lit: 2 });
    const again = tapStar(wrong.trace, 0);
    expect(again.result.kind).toBe('twinkle');
    expect(tapStar(again.trace, 2).result.kind).toBe('lit');
  });

  it('draws a line only once both its stars are lit', () => {
    expect(linesLit('bat', 1)).toEqual([]);
    expect(linesLit('bat', 2)).toEqual([[0, 1]]);
    expect(linesLit('bat', 6)).toContainEqual([5, 3]);
  });

  it('finds the star a fingertip touches', () => {
    const { x, y } = CONSTELLATIONS.bat.stars[4]!;
    expect(starAt('bat', x + 3, y - 2)).toBe(4);
    expect(starAt('bat', 30, 40 + 30)).toBeNull();
  });
});
