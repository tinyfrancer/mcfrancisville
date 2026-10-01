import { describe, expect, it } from 'vitest';
import { CRITTERS } from '../../src/data/critters';
import { FURNITURE } from '../../src/data/furniture';
import {
  CHICKEN_BUTT,
  HOLIDAY_GREETINGS,
  POKEMON,
  RED_ONE,
  WELCOMES,
} from '../../src/data/greetings';
import { HAPPENINGS } from '../../src/data/happenings';
import { HOLIDAY_LINES } from '../../src/data/holidayLines';
import { DECOR, HOLIDAY_LETTERS } from '../../src/data/holidays';
import { FIXTURES, INTERIORS } from '../../src/data/interiors';
import { ITEMS } from '../../src/data/items';
import {
  MUSEUM_GREETING,
  MUSEUM_LABELS,
  MUSEUM_LETTERS,
  MUSEUM_SPECIAL,
} from '../../src/data/museum';
import { CLUES, MAYOR_LETTERS, WES_GONE } from '../../src/data/mystery';
import { OUTFITS } from '../../src/data/outfits';
import { NOTES, NOTES_HEAD } from '../../src/data/patchNotes';
import { ACCESSORIES } from '../../src/data/pets';
import type { Ware } from '../../src/data/shop';
import { LOST, NEWS } from '../../src/data/smallEvents';
import { SPECIAL_LETTERS, SPECIAL_LINES } from '../../src/data/specialDays';
import { TOOLS } from '../../src/data/tools';
import { VILLAGER_IDS, VILLAGERS } from '../../src/data/villagers';
import { ZONES } from '../../src/data/zones';
import { DAY_WINDOWS } from '../../src/data/windows';
import { declineLine, fill, lineFor, linesNow } from '../../src/systems/friendship';

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
  ...sentences([HOLIDAY_LINES, HOLIDAY_LETTERS, DECOR]),
  ...sentences([HAPPENINGS, NEWS, LOST]),
  ...sentences([WELCOMES, HOLIDAY_GREETINGS, RED_ONE, POKEMON, CHICKEN_BUTT]),
  ...sentences([MUSEUM_GREETING, MUSEUM_LABELS, MUSEUM_LETTERS, MUSEUM_SPECIAL]),
  ...sentences([CLUES, MAYOR_LETTERS, WES_GONE, NOTES, NOTES_HEAD]),
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

/** What she reads when she looks at a thing: in her bag, a shop, her closet, her chest. */
const DESCRIPTIONS: Record<string, string> = Object.fromEntries(
  (
    [
      ['item', ITEMS],
      ['outfit', OUTFITS],
      ['furniture', FURNITURE],
      ['accessory', ACCESSORIES],
      ['critter', CRITTERS],
      ['tool', TOOLS],
    ] as const
  ).flatMap(([kind, rows]) =>
    Object.entries(rows as Record<string, { description: string }>).map(([id, row]) => [
      `${kind}:${id}`,
      row.description,
    ]),
  ),
);

/** Everything anyone gives her, wherever it's written down, as `kind:id`. */
function gifts(value: unknown): string[] {
  if (Array.isArray(value)) return value.flatMap(gifts);
  if (typeof value !== 'object' || value === null) return [];
  const own = 'gift' in value ? [Object.entries(value.gift as Ware)[0]!.join(':')] : [];
  return [...own, ...Object.values(value).flatMap(gifts)];
}

describe('descriptions', () => {
  it('are whole sentences that read cleanly', () => {
    for (const [id, text] of Object.entries(DESCRIPTIONS)) {
      expect(text, id).toMatch(/^["'A-Z0-9]/);
      expect(text, id).toMatch(/[.!?…]["')]?$/);
      expect(text, id).not.toMatch(/[{}]| {2}| [,.!?;:]/);
      expect(text, id).not.toMatch(/\bundefined\b|\bnull\b|\bNaN\b/);
    }
  });

  it('say what a thing is, not how many colours it comes in', () => {
    for (const [id, text] of Object.entries(DESCRIPTIONS)) {
      expect(text, id).not.toMatch(/\bcolours?,|among them|\d+ colours/i);
    }
  });

  // Who gives what is for the neighbours' page (U3); a gift says what it is.
  it('say what a gift is, not who gives it', () => {
    const everyone = [...VILLAGER_IDS.map((id) => VILLAGERS[id].name), 'everyone'].join('|');
    const giver = new RegExp(`\\b(?:from|by) (?:${everyone})\\b`);
    const given = gifts([VILLAGERS, SPECIAL_LETTERS, HOLIDAY_LETTERS, MUSEUM_LETTERS, ZONES]);
    expect(given.length).toBeGreaterThan(30);
    for (const id of given.filter((g) => g in DESCRIPTIONS)) {
      expect(DESCRIPTIONS[id], id).not.toMatch(giver);
    }
  });
});

describe("what the neighbours say (0.2's D1)", () => {
  it('is at least eight lines a band, and a line for each window, for every neighbour', () => {
    for (const id of VILLAGER_IDS) {
      const { lines } = VILLAGERS[id];
      for (const band of ['hello', 'friend', 'close', 'night'] as const) {
        expect(lines[band].length, `${id} ${band}`).toBeGreaterThanOrEqual(8);
      }
      for (const window of DAY_WINDOWS)
        expect(lines.windows[window], `${id} ${window}`).toBeTruthy();
      const all = [...lines.hello, ...lines.friend, ...lines.close, ...lines.night];
      const said = [...all, ...Object.values(lines.windows)];
      expect(new Set(said).size, `${id} says something twice`).toBe(said.length);
    }
  });

  it('never repeats a line in a day of talks until every line she could hear has been said', () => {
    for (const id of VILLAGER_IDS) {
      for (const hearts of [0, 4, 8]) {
        for (const day of ['2027-03-03', '2027-03-04', '2027-07-17']) {
          const said: string[] = [];
          // Two talks an hour from five in the morning until two at night.
          for (let hour = 5; hour < 26; hour += 0.5) {
            const h = hour % 24;
            const line = lineFor(id, { hearts, day, hour: h, talks: said.length, said });
            if (said.includes(line)) {
              const now = linesNow(id, hearts, h);
              expect(
                now.every((l) => said.includes(l)),
                `${id} repeated "${line}"`,
              ).toBe(true);
            }
            said.push(line);
          }
        }
      }
    }
  });

  /** Everything Cody says: his talk, his greetings, his holidays and her special days. */
  const cody = VILLAGERS.cody;
  const CODY_SAYS = [
    ...sentences(cody),
    declineLine('cody'),
    ...sentences([WELCOMES, HOLIDAY_GREETINGS, RED_ONE.lines, POKEMON.lines, CHICKEN_BUTT.lines]),
    ...Object.values(HOLIDAY_LINES).map((l) => l.cody),
    ...Object.values(SPECIAL_LINES).map((l) => l.cody),
  ];
  const babe = (lines: readonly string[]) =>
    lines.filter((l) => /\bbabe\b/i.test(l)).length / lines.length;

  it('has Cody say babe in about one line in four, and keep saying it', () => {
    expect(babe(CODY_SAYS)).toBeGreaterThan(0.15);
    expect(babe(CODY_SAYS)).toBeLessThan(0.3);
    const talk = sentences(cody.lines);
    expect(babe(talk)).toBeGreaterThan(0.15);
    expect(babe(talk)).toBeLessThan(0.3);
  });

  it('has him call her mi amor, babe, booby and honey bunny, each now and then', () => {
    for (const name of ['mi amor', 'babe', 'booby', 'honey bunny']) {
      const share = CODY_SAYS.filter((l) => l.toLowerCase().includes(name)).length;
      expect(share, name).toBeGreaterThanOrEqual(5);
    }
  });

  it('calls Wes the creeper, fondly', () => {
    const creeper = sentences(VILLAGERS).filter((l) => /\bthe creeper\b/.test(l));
    expect(creeper.length).toBeGreaterThanOrEqual(2);
  });
});
