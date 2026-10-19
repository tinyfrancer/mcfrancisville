import { describe, expect, it } from 'vitest';
import { HEART_MOMENTS } from '../../src/data/heartMoments';
import { REPLIES } from '../../src/data/replies';
import { SMALL_TALK, TOPICS } from '../../src/data/smallTalk';
import { VILLAGER_IDS } from '../../src/data/villagers';
import { WELCOMES } from '../../src/data/greetings';
import { NOTICES } from '../../src/data/notices';
import {
  closenessFeeling,
  feelingIn,
  feelingOf,
  giftFeeling,
  greetingFeeling,
  herFeeling,
  noteFeeling,
} from '../../src/systems/moods';
import { bandOf } from '../../src/systems/remembering';
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

describe("the faces on the sheets' busts (1.0.1)", () => {
  it('warms a neighbour on their page the closer they are, from none at a hello', () => {
    expect(closenessFeeling(bandOf(0))).toBeNull();
    expect(closenessFeeling(bandOf(7))).toBe('happy');
    expect(closenessFeeling(bandOf(10))).toBe('happy');
    expect(closenessFeeling(bandOf(0, 'cody'))).toBe('happy');
    // Never colder for more hearts.
    let warm = false;
    for (let hearts = 0; hearts <= 10; hearts++) {
      const now = closenessFeeling(bandOf(hearts)) !== null;
      expect(now || !warm, `${hearts}`).toBe(true);
      warm = now;
    }
  });

  it('gladdens the face by a note she has answered, and reads one still up by its words', () => {
    const notes = NOTICES.map((n) => n.note);
    for (const note of notes) expect(noteFeeling(note, true)).toBe('happy');
    expect(noteFeeling('NEED {what} FOR A BOUQUET!!! Shh!!!', false)).toBe('happy');
    expect(noteFeeling('{what}, please. For soup. It is just soup.', false)).toBeNull();
    // Some notes have a face of their own, but not every one.
    const felt = notes.map((n) => noteFeeling(n, false)).filter((f) => f !== null);
    expect(felt.length).toBeGreaterThan(0);
    expect(felt.length).toBeLessThan(notes.length);
  });

  it("gives Cody's greeting his line's feeling, or a married man's warmth", () => {
    expect(greetingFeeling('Oh! There you are.', 'married')).toBe('surprised');
    expect(greetingFeeling('Morning, babe.', 'married')).toBe('happy');
    expect(greetingFeeling('Morning.', 'hello')).toBeNull();
    const lines = Object.values(WELCOMES).flatMap((v) =>
      typeof v === 'string' ? [v] : Array.isArray(v) ? v : Object.values(v).flat(),
    );
    expect(lines.length).toBeGreaterThan(10);
    for (const line of lines) expect(greetingFeeling(line, 'married'), line).not.toBeNull();
  });
});
