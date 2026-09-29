import { describe, expect, it } from 'vitest';
import { FURNITURE } from '../../src/data/furniture';
import { HOLIDAY_GREETINGS, POKEMON, RED_ONE, WELCOMES } from '../../src/data/greetings';
import { HAPPENINGS } from '../../src/data/happenings';
import { FIXTURES, INTERIORS } from '../../src/data/interiors';
import {
  MUSEUM_GREETING,
  MUSEUM_LABELS,
  MUSEUM_LETTERS,
  MUSEUM_SPECIAL,
} from '../../src/data/museum';
import { CLUES, MAYOR_LETTERS, WES_GONE } from '../../src/data/mystery';
import { LOST, NEWS } from '../../src/data/smallEvents';
import { SPECIAL_LETTERS, SPECIAL_LINES } from '../../src/data/specialDays';
import { VILLAGER_IDS, VILLAGERS } from '../../src/data/villagers';
import { ZONES } from '../../src/data/zones';
import { declineLine, fill } from '../../src/systems/friendship';

/** Every sentence in a table of rows, however deep. */
function sentences(value: unknown): string[] {
  if (typeof value === 'string') return value.includes(' ') ? [value] : [];
  if (Array.isArray(value)) return value.flatMap(sentences);
  if (typeof value === 'object' && value !== null) return Object.values(value).flatMap(sentences);
  return [];
}

/** Everything she reads that her name can be in: what her neighbours say, write and sign. */
const LINES = [
  ...sentences(VILLAGERS),
  ...VILLAGER_IDS.map(declineLine),
  ...sentences([SPECIAL_LINES, SPECIAL_LETTERS]),
  ...sentences([HAPPENINGS, NEWS, LOST]),
  ...sentences([WELCOMES, HOLIDAY_GREETINGS, RED_ONE, POKEMON]),
  ...sentences([MUSEUM_GREETING, MUSEUM_LABELS, MUSEUM_LETTERS, MUSEUM_SPECIAL]),
  ...sentences([CLUES, MAYOR_LETTERS, WES_GONE]),
  ...sentences(ZONES),
  ...sentences([FIXTURES, INTERIORS]),
  ...Object.values(FURNITURE).flatMap((row) => sentences(row.says ?? [])),
];

/** One word, two, long and hyphened, typed in lower case, with stray spaces, and none at all. */
const NAMES = ['Em', 'Mary Beth', 'Pumpkin Pie', 'Anastasia-Rosalind', 'em', '  Em  Lou ', ''];

/** A line as she reads it: her name, and the things a line leaves to be filled in. */
function render(line: string, name: string): string {
  const filled = line
    .replaceAll('{what}', '2 pumpkins')
    .replaceAll('{where}', 'by the willow')
    .replaceAll('{critter}', 'candle moth');
  return fill(filled, { name, years: 6, days: '3 days' });
}

describe('dialogue with her name in it', () => {
  it('has lines to read', () => {
    expect(LINES.filter((l) => l.includes('{name}')).length).toBeGreaterThan(60);
  });

  it.each(NAMES)('reads cleanly with the name "%s"', (name) => {
    for (const line of LINES) {
      const said = render(line, name);
      expect(said, line).not.toMatch(/[{}]/);
      expect(said, line).not.toMatch(/ {2}| [,.!?;:]/);
      expect(said, line).not.toMatch(/\bundefined\b|\bnull\b|\bNaN\b/);
    }
  });

  it('starts a sentence with her name in a capital, however she typed it', () => {
    for (const line of LINES.filter((l) => l.includes('{name}'))) {
      for (const said of [render(line, 'em'), render(line, '')]) {
        expect(said, line).not.toMatch(/(^|[.!?…]\s+|\n)(em|friend)\b/);
      }
    }
  });

  /*
   * A name straight after a thing ("I made you a bouquet, {name}"), someone else's name, or
   * eating ("Have you eaten, {name}?") reads as one more thing on the list when she has two words
   * to her name: "Have you eaten, Pumpkin Pie?". Put her name first, or after a greeting, instead.
   * Saying what she is ("You're a treasure, {name}") is fine.
   */
  it('never puts her name where it could be read as a thing', () => {
    const neighbours = VILLAGER_IDS.map((id) => VILLAGERS[id].name).join('|');
    const afterAThing = /\b(?:a|an|my|your|some|the)\s+(?:[\w'-]+\s+){0,2}[\w'-]+, \{name\}/;
    const afterSomeone = new RegExp(`\\b(?:${neighbours}), \\{name\\}`);
    const afterEating = /\b(?:eaten|eat|ate|cooked|baked|tried|tasted), \{name\}/;
    for (const line of LINES) {
      for (const sentence of line.split(/(?<=[.!?])\s+/)) {
        if (!sentence.includes('{name}')) continue;
        const sayingWhatSheIs = /^["']?(?:You're|You are|You've|Cody says)\b/.test(sentence);
        expect(!sayingWhatSheIs && afterAThing.test(sentence), sentence).toBe(false);
        expect(afterSomeone.test(sentence), sentence).toBe(false);
        expect(afterEating.test(sentence), sentence).toBe(false);
      }
    }
  });
});
