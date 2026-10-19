import { describe, expect, it } from 'vitest';
import { BEST_CALLS, BEST_TALK } from '../../src/data/bestFriends';
import { HEART_MOMENTS } from '../../src/data/heartMoments';
import { ANSWER_TALK, QUESTIONS } from '../../src/data/questions';
import { REPLIES } from '../../src/data/replies';
import { shiftDay } from '../../src/systems/calendar';
import { callOn } from '../../src/systems/calls';
import { dayKey } from '../../src/systems/clock';
import { fill } from '../../src/systems/friendship';
import type { VillagerId } from '../../src/types/ids';
import { DEFAULT_LOOK } from '../../src/data/outfits';
import type { Friendship } from '../../src/world/Friends';
import { World } from '../../src/world/World';
import { harness } from './harness';

const DAY_MS = 24 * 3_600_000;
const NAME = 'Em';

/** Whether a line she heard is one of these templates, whatever filled it. */
function isOneOf(line: string, templates: readonly string[]): boolean {
  return templates.some((template) => {
    const pattern = fill(template, { name: NAME })
      .replace(/[.*+?^$()|[\]\\]/g, '\\$&')
      .replace(/\\?\{\w+\\?\}/g, '.+');
    return new RegExp(`^${pattern}$`).test(line);
  });
}

/** A town where she's called Em, with a neighbour as close as `points` make them. */
function town(id: VillagerId, points: number, also: Partial<Friendship> = {}) {
  const h = harness(undefined, { closet: { look: { ...DEFAULT_LOOK, name: NAME } } });
  h.world.friends.update(id, { points, ...also });
  return h;
}

describe("heart moments (V1's P2)", () => {
  it('tells the two-heart moment after their hello, once, and keeps it told', () => {
    const h = town('maude', 200);
    const hello = h.world.neighbourhood.talk('maude');
    expect(hello.more).toBeUndefined();
    expect(hello.waiting).toBe(true);
    const told = h.world.neighbourhood.talk('maude');
    const moment = HEART_MOMENTS.maude![0]!;
    expect(told.more).toHaveLength(moment.lines.length - 1);
    expect(h.world.friends.of('maude').moments).toEqual([2]);
    for (let i = 0; i < 6; i++) expect(h.world.neighbourhood.talk('maude').more).toBeUndefined();
    h.clock.advance(DAY_MS);
    h.world.neighbourhood.talk('maude');
    expect(h.world.neighbourhood.talk('maude').more).toBeUndefined();
  });

  it('tells one a day, lowest first, when a friendship has come a long way at once', () => {
    const h = town('nessa', 1000);
    const told: number[] = [];
    for (let d = 0; d < 7; d++) {
      for (let t = 0; t < 4; t++) h.world.neighbourhood.talk('nessa');
      told.push(h.world.friends.of('nessa').moments?.length ?? 0);
      h.clock.advance(DAY_MS);
    }
    expect(told).toEqual([1, 2, 3, 4, 5, 5, 5]);
    expect(h.world.friends.of('nessa').moments).toEqual([2, 4, 5, 8, 10]);
  });

  it('hands her what comes with a moment', () => {
    const h = town('gourdon', 1000, { moments: [2, 4, 5, 8] });
    const before = h.world.bag.count('pumpkinSeed');
    h.world.neighbourhood.talk('gourdon');
    const told = h.world.neighbourhood.talk('gourdon');
    expect(told.gift).toBe('pumpkinSeed');
    expect(h.world.bag.count('pumpkinSeed')).toBe(before + 1);
  });

  it('has nothing to tell before two hearts, and Cody tells none here (P5 does him)', () => {
    const h = town('rufus', 150);
    h.world.neighbourhood.talk('rufus');
    expect(h.world.neighbourhood.talk('rufus').more).toBeUndefined();
    const c = town('cody', 1000);
    for (let t = 0; t < 4; t++) expect(c.world.neighbourhood.talk('cody').more).toBeUndefined();
  });
});

describe("their questions, and her answers (V1's P2)", () => {
  it('asks at three hearts, keeps her answer, and asks no more', () => {
    const h = town('hazel', 300, { moments: [2] });
    h.world.neighbourhood.talk('hazel');
    const asked = h.world.neighbourhood.talk('hazel');
    expect(asked.line).toBe(fill(QUESTIONS.hazel.ask, { name: NAME }));
    expect(asked.replies).toEqual(QUESTIONS.hazel.answers.map((a) => a.say));
    const back = h.world.neighbourhood.reply('hazel', 0);
    expect(back?.line).toBe(fill(QUESTIONS.hazel.answers[0]!.back, { name: NAME }));
    expect(h.world.friends.of('hazel').answered).toBe('red');
    expect(h.world.neighbourhood.reply('hazel', 0)).toBeNull();
    h.clock.advance(DAY_MS);
    const later = Array.from({ length: 5 }, () => h.world.neighbourhood.talk('hazel').line);
    expect(later).not.toContain(fill(QUESTIONS.hazel.ask, { name: NAME }));
  });

  it('asks again another day if she walks away without answering', () => {
    const h = town('barty', 300, { moments: [2] });
    h.world.neighbourhood.talk('barty');
    expect(h.world.neighbourhood.talk('barty').replies).toHaveLength(3);
    h.world.neighbourhood.endTalk();
    expect(h.world.neighbourhood.reply('barty', 1)).toBeNull();
    expect(h.world.friends.of('barty').answered).toBeUndefined();
    h.clock.advance(DAY_MS);
    h.world.neighbourhood.talk('barty');
    expect(h.world.neighbourhood.talk('barty').line).toBe(
      fill(QUESTIONS.barty.ask, { name: NAME }),
    );
  });

  it('brings her answer up now and then in the days after', () => {
    const h = town('rufus', 300, { moments: [2], answered: 'sunflower' });
    const heard: string[] = [];
    for (let d = 0; d < 21; d++) {
      for (let t = 0; t < 5; t++) heard.push(h.world.neighbourhood.talk('rufus').line);
      h.clock.advance(DAY_MS);
    }
    const about = heard.filter((line) => isOneOf(line, ANSWER_TALK.rufus));
    expect(about.length).toBeGreaterThan(1);
    expect(about.every((line) => line.includes('sunflowers'))).toBe(true);
  });
});

describe("what she says back (V1's P2)", () => {
  it('offers chips on a topic she can answer, and they answer what she picked', () => {
    const h = town('ollie', 0);
    let replied = false;
    for (let t = 0; t < 12 && !replied; t++) {
      const chat = h.world.neighbourhood.talk('ollie');
      if (!chat.replies) continue;
      const topic = Object.values(REPLIES).find((row) =>
        row.say.every((say, i) => chat.replies![i] === say),
      );
      expect(topic).toBeDefined();
      const back = h.world.neighbourhood.reply('ollie', 1);
      expect(back?.line).toBe(fill(topic!.back.ollie[1]!, { name: NAME }));
      replied = true;
    }
    expect(replied).toBe(true);
  });
});

describe("best friends (V1's P2)", () => {
  it('misses her after three days away', () => {
    const h = town('scarah', 1000, { moments: [2, 4, 5, 8, 10], answered: 'autumn' });
    h.world.neighbourhood.talk('scarah');
    h.clock.advance(4 * DAY_MS);
    const first = h.world.neighbourhood.talk('scarah').line;
    expect(isOneOf(first, BEST_TALK.missed.scarah), first).toBe(true);
    expect(first).toContain('four days');
  });

  it('writes to her now and then', () => {
    const h = town('ollie', 1000, { moments: [2, 4, 5, 8, 10] });
    for (let d = 0; d < 60; d++) {
      h.tick(1);
      h.clock.advance(DAY_MS);
    }
    const letters = h.world.mailbox.view().filter((l) => l.id.startsWith('dear:ollie:'));
    expect(letters.length).toBeGreaterThan(1);
    expect(letters.length).toBeLessThan(12);
    expect(letters.every((l) => l.from === 'ollie' && l.text.includes(NAME))).toBe(true);
  });

  it('calls at her house by choice now and then, and says so', () => {
    const h = town('maude', 1000, { moments: [2, 4, 5, 8, 10], answered: 'ghost' });
    const start = dayKey(h.clock.now());
    let day = start;
    let call = callOn('maude', day);
    for (let d = 1; !call && d < 60; d++) {
      day = shiftDay(start, d);
      call = callOn('maude', day);
    }
    expect(call).not.toBeNull();
    const [y, m, dd] = day.split('-').map(Number);
    h.clock.set(new Date(y!, m! - 1, dd!, call!.from, 30));
    h.tick(2);
    expect(h.world.neighbourhood.whereIs('maude')?.doing).toEqual({ visiting: 'her' });
    // In town, she walks to the door and in.
    h.until(() => h.world.neighbourhood.neighbour('maude').zone === 'home', 'Maude going in');
    // A neighbour who isn't a best friend keeps their own day.
    const other = harness();
    other.clock.set(h.clock.now());
    other.tick(2);
    expect(other.world.neighbourhood.whereIs('maude')?.doing).not.toEqual({ visiting: 'her' });
    const said = h.world.neighbourhood.talk('maude').line;
    expect(said).toBe(fill(BEST_CALLS.maude!, { name: NAME }));
  });
});

describe("what's kept (V1's P2)", () => {
  it('keeps her answers and the moments told through a save', () => {
    const h = town('agatha', 400, { moments: [2], answered: 'luck' });
    h.world.neighbourhood.talk('agatha');
    h.world.neighbourhood.talk('agatha');
    expect(h.world.friends.of('agatha').moments).toEqual([2, 4]);
    const again = new World({ friends: h.world.save() });
    expect(again.friends.of('agatha').moments).toEqual([2, 4]);
    expect(again.friends.of('agatha').answered).toBe('luck');
  });

  it('forgets an answer or a moment this build does not know, rather than refusing a save', () => {
    const world = new World({
      friends: {
        friends: {
          hazel: {
            points: 500,
            talked: null,
            gifted: null,
            favour: null,
            answered: 'nope',
            moments: [2, 3, 'x' as never, 10],
          },
        },
      },
    });
    expect(world.friends.of('hazel').answered).toBeUndefined();
    expect(world.friends.of('hazel').moments).toEqual([2, 10]);
  });
});
