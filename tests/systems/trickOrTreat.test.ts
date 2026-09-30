import { describe, expect, it } from 'vitest';
import { AT_THE_DOOR, BEST_SWEET, SWEETS } from '../../src/data/trickOrTreat';
import { VILLAGER_IDS } from '../../src/data/villagers';
import { shiftDay } from '../../src/systems/calendar';
import { onceADay } from '../../src/systems/gathering';
import {
  aSweet,
  doorLine,
  isSweetSeason,
  isTrickOrTreat,
  knockKey,
  sweetAt,
  treeSweet,
} from '../../src/systems/trickOrTreat';

const at = (month: number, date: number, hour: number) =>
  new Date(2026, month - 1, date, hour).getTime();

describe('trick or treat', () => {
  it('is every evening of October, and no other time', () => {
    expect(isTrickOrTreat(at(10, 1, 19))).toBe(true);
    expect(isTrickOrTreat(at(10, 31, 22))).toBe(true);
    // Past midnight is still the evening before, by the 5am day.
    expect(isTrickOrTreat(at(11, 1, 1))).toBe(true);
    expect(isTrickOrTreat(at(10, 1, 1))).toBe(false);
    expect(isTrickOrTreat(at(10, 12, 15))).toBe(false);
    expect(isTrickOrTreat(at(9, 30, 20))).toBe(false);
    expect(isTrickOrTreat(at(11, 1, 19))).toBe(false);
  });

  it('grows sweets on the candy tree all day, all October', () => {
    expect(isSweetSeason(at(10, 12, 9))).toBe(true);
    expect(isSweetSeason(at(11, 2, 9))).toBe(false);
  });

  it('deals each door its sweet by the day, the gummy cluster the rarest', () => {
    expect(sweetAt('barty', '2026-10-03')).toBe(sweetAt('barty', '2026-10-03'));
    const counts = new Map<string, number>();
    for (let d = 0; d < 400; d++) {
      for (const id of VILLAGER_IDS) {
        const item = sweetAt(id, shiftDay('2026-10-01', d));
        counts.set(item, (counts.get(item) ?? 0) + 1);
      }
    }
    for (const { item } of SWEETS) expect(counts.get(item), item).toBeGreaterThan(0);
    const best = counts.get(BEST_SWEET)!;
    for (const { item } of SWEETS) {
      if (item !== BEST_SWEET) expect(counts.get(item)!).toBeGreaterThan(best);
    }
  });

  it('drops a sweet from the tree that is the same all window', () => {
    expect(treeSweet(at(10, 5, 13))).toBe(treeSweet(at(10, 5, 17)));
  });

  it('keeps a door once a day', () => {
    expect(onceADay(knockKey('cody'))).toBe(true);
  });

  it('says what happens at the door, home or out', () => {
    for (const id of VILLAGER_IDS) {
      expect(AT_THE_DOOR[id], id).toContain('{sweet}');
      expect(doorLine(id, 'gummyCluster', true)).toContain('a gummy cluster');
      expect(doorLine(id, 'gummyCluster', true)).not.toContain('{sweet}');
    }
    expect(doorLine('barty', 'chewyDots', false)).toContain('—Barty');
    expect(aSweet('sourGhouls')).toBe('a bag of sour ghouls');
  });
});
