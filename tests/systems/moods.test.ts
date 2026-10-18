import { describe, expect, it } from 'vitest';
import { HEART_MOMENTS } from '../../src/data/heartMoments';
import { REPLIES } from '../../src/data/replies';
import { SMALL_TALK, TOPICS } from '../../src/data/smallTalk';
import { VILLAGER_IDS } from '../../src/data/villagers';
import { feelingIn, feelingOf, giftFeeling, herFeeling } from '../../src/systems/moods';
import { FEELINGS, type Feeling } from '../../src/types/mood';

describe("how a line is said (V1's L7)", () => {
  it("hears a feeling in a line's own words", () => {
    expect(feelingIn('Ha! You got me there.')).toBe('laugh');
    expect(feelingIn('Hmph. Fine. It suits you.')).toBe('cross');
    expect(feelingIn("I'm so sorry, it's gone.")).toBe('sad');
    expect(feelingIn('Um. Hello.')).toBe('shy');
    expect(feelingIn('Oh! There you are.')).toBe('surprised');
    expect(feelingIn('What a lovely day!')).toBe('happy');
    expect(feelingIn('The library opens at nine.')).toBeNull();
    // A word that only has a cue in it isn't one.
    expect(feelingIn('The harvest moon is up.')).toBeNull();
  });

  it("takes a row's feeling first, then its topic's, its words', its kind's, then the band's", () => {
    const base = { kind: 'pool' as const, text: 'Ha! Look at that.', band: 'best' as const };
    expect(feelingOf({ ...base, mood: 'sad' })).toBe('sad');
    // A row that says "as usual" is as usual, whatever its words.
    expect(feelingOf({ ...base, mood: null })).toBeNull();
    expect(feelingOf({ ...base, topic: 'storm' })).toBe('surprised');
    expect(feelingOf(base)).toBe('laugh');
    expect(feelingOf({ ...base, text: 'Fancy that.', kind: 'happening' })).toBe('happy');
    expect(feelingOf({ ...base, text: 'Fancy that.' })).toBe('happy');
    expect(feelingOf({ ...base, text: 'Fancy that.', band: 'hello' })).toBeNull();
  });

  it('laughs for joy at a loved gift, smiles at a liked one, and is bashful turning one down', () => {
    expect(giftFeeling('loved')).toBe('laugh');
    expect(giftFeeling('liked')).toBe('happy');
    expect(giftFeeling('fine')).toBeNull();
    expect(giftFeeling(null)).toBe('shy');
  });

  it('shows her feeling only for a chip that is one', () => {
    expect(herFeeling('Thank you!')).toBe('happy');
    expect(herFeeling('I picked it just for today.')).toBeNull();
    expect(herFeeling('I picked it just for today.', 'shy')).toBe('shy');
  });

  it('gives every row a feeling there is a face for', () => {
    const known = (f: Feeling | null | undefined) =>
      f === null || f === undefined || FEELINGS.includes(f);
    for (const row of Object.values(REPLIES))
      for (const f of row?.feels ?? []) expect(known(f)).toBe(true);
    for (const id of VILLAGER_IDS) {
      for (const moment of HEART_MOMENTS[id] ?? []) {
        expect(moment.moods?.length ?? 0).toBeLessThanOrEqual(moment.lines.length);
        for (const f of moment.moods ?? []) expect(known(f)).toBe(true);
      }
    }
  });

  it('says a good many lines with a feeling, and leaves a good many as they are', () => {
    let felt = 0;
    let all = 0;
    for (const topic of TOPICS) {
      for (const id of VILLAGER_IDS) {
        for (const text of SMALL_TALK[topic][id]) {
          all += 1;
          if (feelingOf({ kind: 'topic', topic, text, band: 'friend' })) felt += 1;
        }
      }
    }
    // Faces change often enough to notice, never on every line.
    expect(felt / all).toBeGreaterThan(0.25);
    expect(felt / all).toBeLessThan(0.85);
  });
});
