import { describe, expect, it } from 'vitest';
import { BEST_CALLS, BEST_LETTERS, BEST_TALK } from '../../src/data/bestFriends';
import { HEART_MOMENTS, MOMENT_HEARTS } from '../../src/data/heartMoments';
import { ITEMS } from '../../src/data/items';
import { ANSWER_TALK, QUESTIONS } from '../../src/data/questions';
import { REPLIES } from '../../src/data/replies';
import { SMALL_TALK, TOPICS } from '../../src/data/smallTalk';
import { SPECIAL_LETTERS } from '../../src/data/specialDays';
import { VILLAGER_IDS, VILLAGERS } from '../../src/data/villagers';

/** Everyone but Cody, whose moments, call and letters are P5's: he's married to her. */
const FRIENDS = VILLAGER_IDS.filter((id) => id !== 'cody');

describe("heart moments (V1's P2)", () => {
  it('gives every neighbour but Cody five, at two, four, five, eight and ten hearts', () => {
    for (const id of FRIENDS) {
      const moments = HEART_MOMENTS[id];
      expect(
        moments?.map((m) => m.hearts),
        id,
      ).toEqual([...MOMENT_HEARTS]);
    }
    expect(HEART_MOMENTS.cody).toBeUndefined();
  });

  it('makes each a short scene of three to six lines, with two or three replies if any', () => {
    for (const [id, moments] of Object.entries(HEART_MOMENTS)) {
      for (const m of moments) {
        expect(m.lines.length, `${id} ${m.hearts}`).toBeGreaterThanOrEqual(3);
        expect(m.lines.length, `${id} ${m.hearts}`).toBeLessThanOrEqual(6);
        if (m.replies) expect([2, 3], `${id} ${m.hearts}`).toContain(m.replies.length);
        if (m.gift) expect(ITEMS[m.gift], `${id} ${m.hearts}`).toBeDefined();
      }
      const all = moments.flatMap((m) => m.lines);
      expect(new Set(all).size, `${id} says something twice`).toBe(all.length);
    }
  });
});

describe("questions (V1's P2)", () => {
  it('has every neighbour ask one, with two or three answers kept by an id of their own', () => {
    for (const id of VILLAGER_IDS) {
      const { answers } = QUESTIONS[id];
      expect([2, 3], id).toContain(answers.length);
      expect(new Set(answers.map((a) => a.id)).size, id).toBe(answers.length);
      for (const a of answers) {
        expect(a.say.length, `${id} ${a.id}`).toBeLessThanOrEqual(26);
        expect(a.called, `${id} ${a.id}`).toMatch(/^[a-z]|^the [A-Z]/);
      }
      expect(ANSWER_TALK[id], id).toHaveLength(3);
    }
  });
});

describe("what she says back (V1's P2)", () => {
  it('has every neighbour answer each of her chips, on topics they bring up', () => {
    for (const [topic, row] of Object.entries(REPLIES)) {
      expect(TOPICS, topic).toContain(topic);
      expect([2, 3], topic).toContain(row.say.length);
      for (const say of row.say) expect(say.length, say).toBeLessThanOrEqual(30);
      for (const id of VILLAGER_IDS)
        expect(row.back[id], `${topic} ${id}`).toHaveLength(row.say.length);
    }
  });
});

describe("best friends (V1's P2)", () => {
  it('gives everyone lines for missing her and asking her along, three each', () => {
    for (const topic of ['missed', 'invite'] as const) {
      expect(SMALL_TALK[topic]).toBe(BEST_TALK[topic]);
      for (const id of VILLAGER_IDS) expect(BEST_TALK[topic][id], `${topic} ${id}`).toHaveLength(3);
    }
  });

  it('has every friend but Cody call by choice and write three letters', () => {
    for (const id of FRIENDS) {
      expect(BEST_CALLS[id], id).toBeTruthy();
      expect(BEST_LETTERS[id], id).toHaveLength(3);
      // Signed, if loudly: Rufus signs in capitals.
      const name = VILLAGERS[id].name.toLowerCase();
      for (const letter of BEST_LETTERS[id]!) expect(letter.toLowerCase()).toContain(name);
    }
  });

  it('has all twelve sign her birthday letter', () => {
    const letter = SPECIAL_LETTERS.birthday!.letter;
    for (const id of VILLAGER_IDS) expect(letter, id).toContain(VILLAGERS[id].name);
  });
});
