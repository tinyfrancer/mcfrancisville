import { describe, expect, it } from 'vitest';
import { MAILBOX_STEP, ROUND_MS } from '../../src/systems/postRound';
import { harness, type Harness } from './harness';

/** Lets the town settle into the hour. */
function settle(h: Harness) {
  h.tick(2);
  h.until(
    () => h.world.neighbourhood.neighbours.every((n) => !n.moving),
    'everyone to get where they are going',
    180_000,
  );
}

/** Maude's letter at three hearts, posted as she talks to Maude. */
const NEARLY_FRIENDS = {
  friends: { friends: { maude: { points: 295, talked: null, gifted: null, favour: null } } },
};

describe("Ollie with the post (V1's P4)", () => {
  it('walks a letter to her mailbox while she is in town, and the flag goes up as he leaves', () => {
    const h = harness(undefined, NEARLY_FRIENDS);
    settle(h);
    expect(h.world.postRound.carrying).toBe(false);
    h.world.talk.talk('maude');
    h.world.talk.endTalk();
    expect(h.tick(1)).toContainEqual({ kind: 'mail', from: 'maude' });
    expect(h.world.postRound.carrying).toBe(true);
    const ollie = h.world.neighbourhood.neighbour('ollie');
    h.until(
      () =>
        ollie.zone === 'town' &&
        ollie.tile.tx === MAILBOX_STEP.tx &&
        ollie.tile.ty === MAILBOX_STEP.ty &&
        !ollie.moving,
      'Ollie at her mailbox',
      ROUND_MS,
    );
    // He stands a moment putting it in, sorting it, then he's off and the flag is up.
    expect(h.world.postRound.carrying).toBe(true);
    h.until(() => !h.world.postRound.carrying, 'the letter in her mailbox', 5_000);
    expect(h.world.letters.unread).toBe(1);
  });

  it("doesn't walk it while she's out of town: it's simply there", () => {
    const h = harness(undefined, {
      ...NEARLY_FRIENDS,
      player: { zone: 'library', tx: 4, ty: 7, facing: 'up' },
    });
    settle(h);
    h.world.talk.talk('maude');
    h.tick(1);
    expect(h.world.postRound.carrying).toBe(false);
    expect(h.world.letters.unread).toBe(1);
  });
});
