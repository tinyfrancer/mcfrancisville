import { describe, expect, it } from 'vitest';
import { MEMORY_TALK } from '../../src/data/memoryTalk';
import { dayKey } from '../../src/systems/clock';
import { fill } from '../../src/systems/friendship';
import { OPENERS_KEPT } from '../../src/systems/remembering';
import type { VillagerId } from '../../src/types/ids';
import { World } from '../../src/world/World';
import { harness } from './harness';

const DAY_MS = 24 * 3_600_000;

/** Whether a line she heard is one of a memory topic's, whatever it was filled with. */
function onTopic(line: string, topic: keyof typeof MEMORY_TALK, id: VillagerId): boolean {
  return MEMORY_TALK[topic][id].some((template) => {
    const pattern = fill(template, { name: 'friend' })
      .replace(/[.*+?^$()|[\]\\]/g, '\\$&')
      .replace(/\\?\{\w+\\?\}/g, '.+');
    return new RegExp(`^${pattern}$`).test(line);
  });
}

describe("what her neighbours remember (V1's P1)", () => {
  it('remembers the last gift she gave each, and brings it up in the days after', () => {
    const h = harness();
    h.world.bag.add('moonflower', 1);
    h.world.neighbourhood.give('barty', 'moonflower');
    expect(h.world.friends.of('barty').gave).toBe('moonflower');
    h.clock.advance(DAY_MS);
    const heard = Array.from({ length: 10 }, () => h.world.neighbourhood.talk('barty').line);
    expect(heard.some((line) => onTopic(line, 'gift', 'barty'))).toBe(true);
    expect(heard.some((line) => /\bmoonflower\b.*\byesterday\b/.test(line))).toBe(true);
  });

  it('says how long it has been, first, after three days or more without a talk', () => {
    const h = harness();
    h.world.neighbourhood.talk('maude');
    h.clock.advance(5 * DAY_MS);
    const first = h.world.neighbourhood.talk('maude').line;
    expect(onTopic(first, 'away', 'maude'), first).toBe(true);
    expect(first).toContain('five days');
    h.clock.advance(DAY_MS);
    expect(onTopic(h.world.neighbourhood.talk('maude').line, 'away', 'maude')).toBe(false);
  });

  it('says a band has been reached once, on the talk that reaches it', () => {
    const h = harness();
    h.world.neighbourhood.talk('ollie');
    h.world.friends.update('ollie', { points: 295 });
    h.clock.advance(DAY_MS);
    // The day's first talk brings them to three hearts, and says so.
    const first = h.world.neighbourhood.talk('ollie').line;
    expect(h.world.friends.hearts('ollie')).toBe(3);
    expect(onTopic(first, 'band', 'ollie'), first).toBe(true);
    const later = Array.from({ length: 6 }, () => h.world.neighbourhood.talk('ollie').line);
    expect(later.some((line) => onTopic(line, 'band', 'ollie'))).toBe(false);
  });

  it('keeps what she picked, gave the museum and put out, with the day she did it', () => {
    const h = harness();
    const day = dayKey(h.clock.now());
    h.world.ctx.signals.emit('harvested', { crop: 'pumpkin' });
    h.world.bag.add('candleMoth', 1);
    expect(h.world.collecting.donate('candleMoth')).not.toBeNull();
    h.world.ctx.signals.emit('placed', { piece: 'batLamp' });
    expect(h.world.lately.last).toEqual({
      harvested: { crop: 'pumpkin', day },
      donated: { thing: 'candleMoth', day },
      placed: { piece: 'batLamp', day },
    });
    const heard = Array.from({ length: 12 }, () => h.world.neighbourhood.talk('wrapunzel').line);
    for (const topic of ['harvest', 'donated', 'placed'] as const) {
      expect(
        heard.some((line) => onTopic(line, topic, 'wrapunzel')),
        topic,
      ).toBe(true);
    }
    expect(heard.some((line) => /\ba candle moth\b/.test(line))).toBe(true);
  });

  it('opens each day of a week with something new', () => {
    const h = harness();
    for (let d = 0; d < 10; d++) {
      h.world.neighbourhood.talk('gourdon');
      h.clock.advance(DAY_MS);
    }
    const opened = h.world.friends.of('gourdon').opened ?? [];
    expect(opened.length).toBeGreaterThan(0);
    expect(opened.length).toBeLessThanOrEqual(OPENERS_KEPT);
    expect(new Set(opened).size).toBe(opened.length);
  });

  it('keeps what they remember through a save', () => {
    const h = harness();
    h.world.bag.add('moonflower', 1);
    h.world.neighbourhood.give('hazel', 'moonflower');
    h.world.neighbourhood.talk('hazel');
    h.world.ctx.signals.emit('harvested', { crop: 'basil' });
    const save = h.world.save();
    const again = new World({ friends: save, lately: h.world.lately.snapshot().lately });
    const hazel = again.friends.of('hazel');
    expect(hazel.gave).toBe('moonflower');
    expect(hazel.spoke).toBe(h.world.friends.hearts('hazel'));
    expect(hazel.opened).toEqual(h.world.friends.of('hazel').opened);
    expect(again.lately.last.harvested?.crop).toBe('basil');
  });

  it('forgets what this build no longer knows, rather than refusing a save', () => {
    const world = new World({
      friends: {
        friends: {
          barty: {
            points: 10,
            talked: null,
            gifted: '2026-09-01',
            favour: null,
            gave: 'nope' as never,
            opened: [1, 'x' as never],
          },
        },
      },
      lately: {
        harvested: { crop: 'nope' as never, day: '2026-09-01' },
        placed: null,
        donated: null,
      },
    });
    expect(world.friends.of('barty').gave).toBeUndefined();
    expect(world.friends.of('barty').opened).toEqual([1]);
    expect(world.lately.last.harvested).toBeNull();
  });
});
