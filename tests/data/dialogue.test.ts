import { describe, expect, it } from 'vitest';
import { CATALOGUE_GREETING, DELIVERY_LETTERS } from '../../src/data/catalogue';
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
import { LAST_PIN } from '../../src/data/mysteryChain';
import { WES_DELIVERS, WES_FIRST, WES_READY, WES_STAYS, WES_TALK } from '../../src/data/wes';
import { OUTFITS } from '../../src/data/outfits';
import { NOTES, NOTES_HEAD } from '../../src/data/patchNotes';
import { ACCESSORIES } from '../../src/data/pets';
import type { Ware } from '../../src/data/shop';
import { LOST, NEWS } from '../../src/data/smallEvents';
import { SMALL_TALK } from '../../src/data/smallTalk';
import { BEST_CALLS, BEST_LETTERS } from '../../src/data/bestFriends';
import { HEART_MOMENTS } from '../../src/data/heartMoments';
import { QUESTIONS } from '../../src/data/questions';
import { REPLIES } from '../../src/data/replies';
import { SPECIAL_LETTERS, SPECIAL_LINES } from '../../src/data/specialDays';
import { TOOLS } from '../../src/data/tools';
import { VILLAGER_IDS, VILLAGERS } from '../../src/data/villagers';
import { ZONES } from '../../src/data/zones';
import { DAY_WINDOWS } from '../../src/data/windows';
import { declineLine, fill, lineFor, linesNow, talkLine } from '../../src/systems/friendship';
import { CROPS } from '../../src/data/crops';
import { FOSSILS } from '../../src/data/fossils';
import { COSTUME_PIECES } from '../../src/data/memoryTalk';
import { shiftDay } from '../../src/systems/calendar';
import { STRANGERS, topicsNow, type TalkScene } from '../../src/systems/dialogue';
import {
  agoOf,
  aThing,
  awayOf,
  hereOf,
  OPENERS_KEPT,
  spokenName,
  type LineKey,
} from '../../src/systems/remembering';

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
  ...sentences([HAPPENINGS, NEWS, LOST, SMALL_TALK]),
  ...sentences([WELCOMES, HOLIDAY_GREETINGS, RED_ONE, POKEMON, CHICKEN_BUTT]),
  ...sentences([MUSEUM_GREETING, MUSEUM_LABELS, MUSEUM_LETTERS, MUSEUM_SPECIAL]),
  ...sentences([CLUES, MAYOR_LETTERS, WES_GONE, NOTES, NOTES_HEAD]),
  ...sentences(ZONES),
  ...sentences([FIXTURES, INTERIORS]),
  ...sentences([DELIVERY_LETTERS, CATALOGUE_GREETING]),
  ...Object.values(FURNITURE).flatMap((row) => sentences(row.says ?? [])),
  // V1's P2: their stories, questions and answers, what she says back, and best friends'.
  ...sentences([HEART_MOMENTS, QUESTIONS, REPLIES, BEST_CALLS, BEST_LETTERS]),
  // V1's P3a: Wes, once he stays for a chat, and the last pin on her corkboard.
  ...sentences([WES_FIRST, WES_TALK, WES_READY, WES_STAYS, WES_DELIVERS, LAST_PIN]),
];

/** One word, two, long and hyphened, typed in lower case, with stray spaces, and none at all. */
const NAMES = ['Em', 'Mary Beth', 'Pumpkin Pie', 'Anastasia-Rosalind', 'em', '  Em  Lou ', ''];

/** A line as she reads it: her name, and the things a line leaves to be filled in. */
function render(line: string, name: string): string {
  const filled = line
    .replaceAll('{what}', '2 pumpkins')
    .replaceAll('{where}', 'by the willow')
    .replaceAll('{critter}', 'candle moth')
    .replaceAll('{catch}', 'an owl-eye moth')
    .replaceAll('{pet}', 'Fibi')
    .replaceAll('{happening}', 'the moon howl')
    .replaceAll('{place}', 'up at the lookout')
    .replaceAll('{away}', 'three days')
    .replaceAll('{gift}', 'moonflower')
    .replaceAll('{ago}', 'yesterday')
    .replaceAll('{harvest}', 'ghost pepper')
    .replaceAll('{donated}', 'an ammonite')
    .replaceAll('{piece}', 'pumpkin lamp')
    .replaceAll('{wearing}', 'moonbeam sandals')
    .replaceAll('{bracelet}', 'friendship bracelet')
    .replaceAll('{here}', 'two months')
    .replaceAll('{answer}', 'the little red star');
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
    ...Object.values(SMALL_TALK).flatMap((l) => l.cody),
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

/** Every way each thing a topic leaves to fill can be said, from the rows themselves. */
const SAID_AS: Record<string, readonly string[]> = {
  wearing: Object.values(OUTFITS).map((row) => spokenName(row.name)),
  piece: Object.values(FURNITURE).map((row) => spokenName(row.name)),
  harvest: Object.values(CROPS).map((row) => spokenName(ITEMS[row.harvest.item].name)),
  donated: [...Object.values(CRITTERS), ...Object.values(FOSSILS)].map((row) => aThing(row.name)),
  gift: Object.values(ITEMS).map((row) => spokenName(row.name)),
  bracelet: Object.values(ITEMS)
    .filter((row) => row.kind === 'bracelet')
    .map((row) => spokenName(row.name)),
  ago: [...new Set(Array.from({ length: 14 }, (_, i) => agoOf(i + 1)!))],
  away: [...new Set(Array.from({ length: 60 }, (_, i) => awayOf(i + 3)!))],
  here: [...new Set(Array.from({ length: 800 }, (_, i) => hereOf(i + 3)!))],
  catch: Object.values(CRITTERS).map((row) => aThing(row.name)),
  pet: ['Fibi', 'Mr Bojangles'],
  happening: ['book club', "the New Year's dip"],
  place: ['at the farm gate', 'up at the lookout'],
  // V1's P2: every answer to every question, as they say it after.
  answer: Object.values(QUESTIONS).flatMap((q) => q.answers.map((a) => a.called)),
};

/**
 * A line with each thing it leaves to fill said every way it can be, one at a time, the rest
 * their first way; her name is left in, to be filled after.
 */
function everyWay(line: string): string[] {
  const keys = Object.keys(SAID_AS).filter((key) => line.includes(`{${key}}`));
  if (keys.length === 0) return [line];
  const firsts = (text: string, except: string) =>
    keys
      .filter((k) => k !== except)
      .reduce((t, k) => t.replaceAll(`{${k}}`, SAID_AS[k]![0]!), text);
  return keys.flatMap((key) =>
    SAID_AS[key]!.map((value) => firsts(line, key).replaceAll(`{${key}}`, value)),
  );
}

const NOBODY: TalkScene = {
  weather: 'clear',
  storm: false,
  holding: 'hands',
  caught: null,
  pet: null,
  wearing: [],
  placed: null,
  harvested: null,
  donated: null,
  visits: 0,
  clue: null,
  ...STRANGERS,
};

/** Scenes on a day between them fitting every topic: nothing, everything, and in between. */
function scenesOn(day: string): TalkScene[] {
  const lately = {
    wearing: ['witchHat', 'stripyTee'] as const,
    placed: { piece: 'batLamp' as const, day },
    harvested: { crop: 'ghostPepper' as const, day },
    donated: { thing: 'ammonite' as const, day },
    visits: 40,
    // V1's P3a: a clue pinned yesterday, which they theorise about.
    clue: { id: 'sash' as const, day: shiftDay(day, -1) },
  };
  const between = {
    gave: { item: 'moonflower' as const, day: shiftDay(day, -2) },
    talked: shiftDay(day, -9),
    reached: 'close' as const,
    wears: 'friendshipBracelet' as const,
    band: 'close' as const,
    answer: 'the little red star',
  };
  return [
    NOBODY,
    { ...NOBODY, ...lately, ...between, weather: 'rain', caught: 'axolotl', pet: 'Fibi' },
    { ...NOBODY, ...lately, wearing: ['stripyTee'], weather: 'rain', storm: true, holding: 'net' },
    { ...NOBODY, ...between, weather: 'fog', holding: 'can' },
    { ...NOBODY, holding: 'rod', visits: 400 },
    { ...NOBODY, holding: 'pumpkinSeed', wearing: ['mummyWraps'] },
    // Best friends (V1's P2), who miss her and ask her along.
    { ...NOBODY, ...between, band: 'best' },
  ];
}

describe("what they remember of her (V1's P1)", () => {
  it('says what she has on as she would, and what she gave with its "a"', () => {
    expect(spokenName('Moonbeam sandals')).toBe('moonbeam sandals');
    expect(spokenName('Mary Janes')).toBe('Mary Janes');
    expect(spokenName('LOVE bracelet')).toBe('LOVE bracelet');
    expect(spokenName('Christmas rose')).toBe('Christmas rose');
    expect(spokenName('Our Halloween photo')).toBe('Halloween photo');
    expect(aThing('Ammonite')).toBe('an ammonite');
    expect(aThing('Hercules beetle')).toBe('a Hercules beetle');
    for (const id of COSTUME_PIECES) expect(OUTFITS[id], id).toBeDefined();
  });

  it('reads cleanly with every thing a line leaves to fill, said every way it can be', () => {
    // Nothing she has or did comes straight before her name, where it could be read as one more
    // thing on the list ("your moonbeam sandals, Pumpkin Pie"); a word for when ("later", "a
    // week ago") is no thing.
    const afterAThing =
      /\b(?:a|an|my|your|some|the)\s+(?:[\w'&-]+\s+){0,3}(?!(?:later|today|tonight|ago|back|days?|weeks?|months?|years?|ages|while)\b)[\w'-]+, \{name\}/i;
    const readAsAThing = (line: string) =>
      line
        .split(/(?<=[.!?])\s+/)
        .some((s) => !/^["']?(?:You're|You are|You've)\b/.test(s) && afterAThing.test(s));
    // Tens of thousands of readings: gathered, then checked once, so the test stays quick.
    const wrong: string[] = [];
    for (const [topic, lines] of Object.entries(SMALL_TALK)) {
      for (const id of VILLAGER_IDS) {
        for (const line of lines[id]) {
          for (const way of everyWay(line)) {
            const where = `${id} ${topic}: ${way}`;
            if (/[{}]/.test(way.replaceAll('{name}', ''))) wrong.push(`unfilled: ${where}`);
            if (readAsAThing(way)) wrong.push(`name after a thing: ${where}`);
            for (const name of ['Pumpkin Pie', 'em', '']) {
              const said = fill(way, { name });
              if (/ {2}| [,.!?;:]|\bundefined\b|\bnull\b/.test(said))
                wrong.push(`spacing: ${said}`);
              if (/(^|[.!?…]\s+)(em|friend)\b/.test(said)) wrong.push(`no capital: ${said}`);
            }
          }
        }
      }
    }
    expect(wrong).toEqual([]);
  });

  it('reads every topic with every scene, from every neighbour', () => {
    const heard = new Set<string>();
    for (const day of ['2027-03-10', '2027-07-17']) {
      for (const scene of scenesOn(day)) {
        for (const id of VILLAGER_IDS) {
          for (const hour of [9, 14, 20]) {
            for (const brought of topicsNow(id, scene, day, hour)) {
              heard.add(brought.topic);
              expect(brought.lines).toHaveLength(3);
              for (const { text } of brought.lines) {
                const said = fill(text, { name: 'Mary Beth' });
                expect(said, `${id} ${brought.topic}`).not.toMatch(/[{}]|\bundefined\b|\bnull\b/);
              }
            }
          }
        }
      }
    }
    expect([...heard].sort()).toEqual(Object.keys(SMALL_TALK).sort());
  });

  it('brings up a band reached and a long time away first, and only what fits', () => {
    const day = '2027-03-10';
    const [plain, busy] = scenesOn(day);
    const topics = (scene: TalkScene) => topicsNow('barty', scene, day, 9).map((b) => b.topic);
    expect(topics(plain!)).toEqual(['morning']);
    expect(topics(busy!).slice(0, 2)).toEqual(['band', 'away']);
    expect(topics(busy!)).toContain('costume');
    expect(topics(busy!)).not.toContain('outfit');
    const yesterday = shiftDay(day, -1);
    const stale: TalkScene = {
      ...busy!,
      talked: shiftDay(day, -2),
      gave: { item: 'moonflower', day: shiftDay(day, -15) },
      harvested: { crop: 'ghostPepper', day: yesterday },
      donated: { thing: 'ammonite', day: yesterday },
      placed: { piece: 'batLamp', day: shiftDay(day, -4) },
      visits: 2,
    };
    for (const gone of ['away', 'gift', 'harvest', 'donated', 'placed', 'here']) {
      expect(topics(stale), gone).not.toContain(gone);
    }
  });

  it('never opens a week of daily talks with the same line twice', () => {
    for (const id of VILLAGER_IDS) {
      for (const hearts of [0, 4, 8, 10]) {
        for (const kind of [0, 1, -1]) {
          let opened: LineKey[] = [];
          const firsts: string[] = [];
          for (let d = 0; d < 28; d++) {
            const day = shiftDay('2027-02-01', d);
            const scenes = scenesOn(day);
            // A plain day every day, a busy one, and a different one each day.
            const scene = scenes[kind >= 0 ? kind : (d * 7) % scenes.length]!;
            const hour = 6 + ((d * 5) % 17);
            const said = talkLine(id, { hearts, day, hour, talks: 0, scene, opened });
            if (said.opener !== null) opened = [...opened, said.opener].slice(-OPENERS_KEPT);
            firsts.push(said.line);
          }
          for (let d = 0; d + 7 <= firsts.length; d++) {
            const week = firsts.slice(d, d + 7);
            expect(new Set(week).size, `${id} ${hearts} ${kind} from day ${d}`).toBe(7);
          }
        }
      }
    }
  });

  it("doesn't open every day with the window's line", () => {
    for (const id of VILLAGER_IDS) {
      let opened: LineKey[] = [];
      let windows = 0;
      for (let d = 0; d < 28; d++) {
        const day = shiftDay('2027-02-01', d);
        const said = talkLine(id, { hearts: 4, day, hour: 9, talks: 0, scene: NOBODY, opened });
        if (said.opener !== null) opened = [...opened, said.opener].slice(-OPENERS_KEPT);
        if (said.topic === 'morning') windows++;
      }
      expect(windows, id).toBeGreaterThan(2);
      expect(windows, id).toBeLessThan(24);
    }
  });
});
