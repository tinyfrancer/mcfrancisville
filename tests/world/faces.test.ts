import { describe, expect, it } from 'vitest';
import { FEEL_AFTER_MS } from '../../src/systems/moods';
import { FEEL_MS, HOLD_UP_MS } from '../../src/systems/poses';
import { feelOf } from '../../src/world/services/Poses';
import { harness } from './harness';

describe("faces that feel (V1's L7)", () => {
  it('a loved gift makes them laugh for joy, on their face in the world, and her too', () => {
    const h = harness();
    h.world.talk.startTalk('maude');
    expect(h.world.talk.feelingOf('maude')).toBeNull();
    h.world.bag.add('loveBracelet', 1);
    const given = h.world.talk.give('maude', 'loveBracelet');
    expect(given?.feels).toBe('laugh');
    expect(h.world.talk.feelingOf('maude')).toBe('laugh');
    // Only the one she's talking to.
    expect(h.world.talk.feelingOf('rufus')).toBeNull();
    h.tick(1);
    expect(h.world.poses.face()).toBe('laugh');
    // While she stays to talk it stays; once she goes, a moment more.
    h.clock.advance(60_000);
    expect(h.world.talk.feelingOf('maude')).toBe('laugh');
    h.world.talk.endTalk();
    h.clock.advance(FEEL_AFTER_MS - 100);
    expect(h.world.talk.feelingOf('maude')).toBe('laugh');
    h.clock.advance(200);
    expect(h.world.talk.feelingOf('maude')).toBeNull();
  });

  it('a second gift in a day is turned down bashfully', () => {
    const h = harness();
    h.world.bag.add('moonflower', 2);
    h.world.talk.give('barty', 'moonflower');
    expect(h.world.talk.give('barty', 'moonflower')?.feels).toBe('shy');
  });

  it('says how each line of a heart moment is said, and her chip that is a feeling shows', () => {
    const h = harness();
    h.world.friends.update('rufus', { points: 1000, moments: [2, 4, 5] });
    h.world.talk.startTalk('rufus');
    h.world.talk.talk('rufus');
    const told = h.world.talk.talk('rufus');
    // The eight-heart moment's own moods.
    expect([told.feels, ...(told.moreFeels ?? [])]).toEqual(['shy', 'sad', 'sad', 'happy']);
    expect(h.world.talk.feelingOf('rufus')).toBe('shy');
    h.world.talk.feel('rufus', 'happy');
    expect(h.world.talk.feelingOf('rufus')).toBe('happy');

    h.clock.advance(24 * 3_600_000);
    h.world.talk.talk('rufus');
    const ten = h.world.talk.talk('rufus');
    expect(ten.replies?.[0]).toBe("It's allowed!");
    expect(h.world.poses.face()).toBeNull();
    const back = h.world.talk.reply('rufus', 0);
    // "YES! I'm telling the moon!…" is said gladly, and her "It's allowed!" shows on her face.
    expect(back?.feels).toBe('happy');
    expect(h.world.poses.face()).toBe('happy');
  });

  it('gives every talk a feeling or none, the one on their face', () => {
    const h = harness();
    for (const id of ['cody', 'maude', 'gourdon', 'barty'] as const) {
      h.world.talk.startTalk(id);
      const chat = h.world.talk.talk(id);
      expect(chat.feels).not.toBeUndefined();
      expect(h.world.talk.feelingOf(id)).toBe(chat.feels);
      h.world.talk.endTalk();
    }
  });

  it('her face reacts to a catch, a gift, a fright and a shelf finished, then settles', () => {
    expect(feelOf({ kind: 'caught', critter: 'candleMoth', first: false })).toBe('happy');
    expect(feelOf({ kind: 'caught', critter: 'candleMoth', first: true })).toBe('surprised');
    expect(feelOf({ kind: 'gave', villager: 'maude', item: 'moonflower', reaction: 'loved' })).toBe(
      'laugh',
    );
    expect(feelOf({ kind: 'wesGone', line: 0 })).toBe('surprised');
    expect(feelOf({ kind: 'shelved', shelf: 'mothFamily' as never })).toBe('laugh');
    expect(feelOf({ kind: 'tilled', tx: 0, ty: 0 })).toBeNull();

    const h = harness();
    h.world.poses.feel('surprised');
    expect(h.world.poses.face()).toBe('surprised');
    h.clock.advance(FEEL_MS + 1);
    expect(h.world.poses.face()).toBeNull();
  });

  it('waits for a find held up before her face shows how she feels about it', () => {
    const h = harness();
    h.world.poses.saw([{ kind: 'caught', critter: 'candleMoth', first: false }]);
    // A catch is held up (after the net comes down), and the feeling lasts past it.
    h.clock.advance(HOLD_UP_MS + FEEL_MS - 50);
    expect(h.world.poses.face()).toBe('happy');
  });
});
