import { describe, expect, it } from 'vitest';
import { LOST, LOST_CANDY } from '../../src/data/smallEvents';
import { windowKey } from '../../src/systems/clock';
import { fill } from '../../src/systems/friendship';
import { smallEventOf, type SmallEvent } from '../../src/systems/smallEvents';
import { fromSave, World } from '../../src/world/World';
import { FakeClock } from '../../src/systems/clock';
import { harness, type Harness } from './harness';

/** The first window from Saturday 26 September with a small event of a kind, and a time in it. */
function windowWith<K extends SmallEvent['kind']>(
  kind: K,
): { at: Date; event: Extract<SmallEvent, { kind: K }> } {
  for (let day = 26; day < 60; day++) {
    for (const hour of [8, 13, 19]) {
      const at = new Date(2026, 8, day, hour);
      const event = smallEventOf(windowKey(at.getTime()));
      if (event.kind === kind) return { at, event: event as Extract<SmallEvent, { kind: K }> };
    }
  }
  throw new Error(`no ${kind} window`);
}

function walkTo(h: Harness, tx: number, ty: number) {
  expect(h.world.tapTile(tx, ty), `a way to ${tx},${ty}`).toBe(true);
  return h.until(() => !h.world.player.moving, `walking to ${tx},${ty}`).concat(h.tick(2));
}

describe('news', () => {
  it('puts a "!" over whoever has it until she has heard it', () => {
    const { at, event } = windowWith('news');
    const h = harness();
    h.clock.set(at);
    const who = event.news.who;
    expect(h.world.smallEvents.bubble(who)).toBe('!');
    const chat = h.world.neighbourhood.talk(who);
    expect(chat.line).toBe(fill(event.news.line, { name: h.world.name }));
    expect(h.world.smallEvents.bubble(who)).toBeNull();
    expect(h.world.neighbourhood.talk(who).line).not.toBe(chat.line);
  });
});

describe('something lost', () => {
  it('glints where it lies, is picked up by walking onto it, and handed back for thanks', () => {
    const { at, event } = windowWith('lost');
    const h = harness();
    h.clock.set(at);
    const owner = LOST[event.lost].who;
    expect(h.world.smallEvents.lying()).toEqual({ lost: event.lost, at: event.at });
    expect(h.world.smallEvents.bubble(owner)).toBe('?');
    // They ask after it, once, and say where.
    expect(h.world.neighbourhood.talk(owner).line).toContain(event.where);
    expect(h.world.neighbourhood.talk(owner).line).not.toContain(event.where);

    const events = walkTo(h, event.at.tx, event.at.ty);
    expect(events).toContainEqual({ kind: 'foundLost', lost: event.lost });
    expect(h.world.smallEvents.lying()).toBeNull();
    expect(h.world.smallEvents.errand).toBe(event.lost);
    expect(h.world.smallEvents.bubble(owner)).toBe('?');

    const candy = h.world.wallet.candy;
    const points = h.world.friends.of(owner).points;
    const thanks = h.world.neighbourhood.talk(owner);
    expect(thanks.candy).toBe(LOST_CANDY);
    expect(h.world.wallet.candy).toBe(candy + LOST_CANDY);
    expect(h.world.friends.of(owner).points).toBeGreaterThan(points);
    expect(h.world.smallEvents.errand).toBeNull();
    expect(h.world.smallEvents.bubble(owner)).toBeNull();
  });

  it('stays in her hands across a window, and a reload, till it is handed back', () => {
    const { at, event } = windowWith('lost');
    const h = harness();
    h.clock.set(at);
    walkTo(h, event.at.tx, event.at.ty);
    h.clock.set(at.getTime() + 24 * 3_600_000);
    const save = h.world.save();
    expect(save.errand).toBe(event.lost);
    const again = new World({ ...fromSave(save), clock: new FakeClock(h.clock.now()) });
    expect(again.smallEvents.errand).toBe(event.lost);
    expect(again.smallEvents.bubble(LOST[event.lost].who)).toBe('?');
  });
});
