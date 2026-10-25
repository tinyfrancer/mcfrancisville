import { describe, expect, it } from 'vitest';
import { HAPPENINGS } from '../../src/data/happenings';
import { verbRow } from '../../src/data/happeningVerbs';
import { ITEMS } from '../../src/data/items';
import { choicesOn } from '../../src/systems/joining';
import type { ZoneId } from '../../src/types/ids';
import { harness, type Harness } from './harness';

/** Her standing in a place, the town settled into the hour. */
function at(zone: ZoneId, tx: number, ty: number, when: Date, saved = {}): Harness {
  const h = harness(undefined, { player: { zone, tx, ty, facing: 'up' }, ...saved });
  h.clock.set(when);
  h.tick(2);
  h.until(
    () => h.world.neighbourhood.neighbours.every((n) => !n.moving),
    'everyone to get where they are going',
    180_000,
  );
  return h;
}

// A Wednesday evening: book club in Maude's library.
const BOOK_CLUB = new Date(2026, 9, 14, 20);
const NEXT_WEEK = new Date(2026, 9, 21, 20);

describe("joining in at a happening (V1's P4)", () => {
  it("picks next week's book with the host, once, and she remembers it next week", () => {
    const h = at('library', 4, 6, BOOK_CLUB);
    expect(h.world.neighbourhood.neighbour('maude').zone).toBe('library');
    // Only the host has the verb.
    expect(h.world.joining.verbFor('agatha')).toBeNull();
    const verb = h.world.joining.verbFor('maude')!;
    expect(verb.happening).toBe('bookClub');
    expect(verb.choices).toHaveLength(3);
    expect(verb.ask).not.toContain('{name}');
    // Not one that isn't on offer, and nothing without a pick.
    expect(h.world.joining.join('maude', 'notABook')).toBeNull();
    expect(h.world.joining.join('maude')).toBeNull();
    const points = h.world.friends.of('maude').points;
    const pick = verb.choices[1]!;
    const joined = h.world.joining.join('maude', pick.id)!;
    expect(joined.lines[0]).not.toContain('{name}');
    expect(h.world.friends.of('maude').points).toBeGreaterThan(points);
    expect(h.tick(1)).toContainEqual({ kind: 'joined', happening: 'bookClub', villager: 'maude' });
    // Once a night.
    expect(h.world.joining.verbFor('maude')).toBeNull();
    expect(h.world.joining.recall('bookClub', 'maude')).toBeNull();

    // Next week, through the save, her first word at book club is the book she picked.
    const saved = h.world.joining.snapshot();
    const later = at('library', 4, 6, NEXT_WEEK, saved);
    const called = (verbRow('bookClub')!.choices as readonly { id: string; called: string }[]).find(
      (c) => c.id === pick.id,
    )!.called;
    const remembered = later.world.joining.recall('bookClub', 'maude')!;
    expect(remembered).toContain(called);
    const line = later.world.talk.talk('maude').line;
    expect(line).toContain(called);
    expect(line).not.toContain('{');
    // And the week's picks have turned over.
    expect(later.world.joining.verbFor('maude')).not.toBeNull();
  });

  it('forgets a happening or a pick this build no longer knows, and keeps the rest', () => {
    const h = at('library', 4, 6, NEXT_WEEK, {
      happenings: {
        bookClub: { on: '2026-10-14', choice: 'aBookLongGone' },
        notAHappening: { on: '2026-10-14' },
        moonHowl: { on: '2026-09-26' },
      },
    });
    expect(h.world.joining.recall('bookClub', 'maude')).toBeNull();
    expect(Object.keys(h.world.joining.snapshot().happenings).sort()).toEqual([
      'bookClub',
      'moonHowl',
    ]);
  });

  it('swaps one of her seeds for a packet at the Sunday swap', () => {
    // A Sunday morning at the farm gate.
    const h = at('town', 15, 12, new Date(2026, 9, 18, 9));
    const verb = h.world.joining.verbFor('barty')!;
    expect(verb.happening).toBe('seedSwap');
    const row = verbRow('seedSwap')!;
    const offered = choicesOn('seedSwap', row, '2026-10-18');
    const packet = offered[0]!.gives!;
    const seeds = () =>
      h.world.bag.contents
        .filter((s) => ITEMS[s.id].kind === 'seed' && s.id !== packet)
        .reduce((n, s) => n + s.count, 0);
    const mine = seeds();
    const had = h.world.bag.count(packet);
    const joined = h.world.joining.join('barty', offered[0]!.id)!;
    expect(h.world.bag.count(packet)).toBe(had + 1);
    if (mine > 0) {
      expect(seeds()).toBe(mine - 1);
      expect(joined.aside).toContain('You left');
    } else expect(joined.aside).toContain('You took');
  });

  it('howls with Rufus at the full moon, a verb with nothing to pick', () => {
    // The full moon of 26 October, up at the lookout.
    const h = at('town', 29, 3, new Date(2026, 9, 26, 22));
    expect(HAPPENINGS.moonHowl.who[0]).toBe('rufus');
    const verb = h.world.joining.verbFor('rufus')!;
    expect(verb).toMatchObject({ happening: 'moonHowl', choices: [] });
    expect(h.world.joining.join('rufus', 'loudly')).toBeNull();
    expect(h.world.joining.join('rufus')!.lines[0]).toContain('AWOO');
  });

  it("requests a tune at Boothoven's recital from those she knows, and he plays it", () => {
    // A Tuesday evening in his parlour, two tunes learnt.
    const h = at('boothovenParlour', 4, 7, new Date(2026, 9, 13, 20), {
      tunes: ['lanternWaltz', 'cobwebNocturne'],
    });
    const verb = h.world.joining.verbFor('boothoven')!;
    expect(verb.happening).toBe('recital');
    expect(verb.choices.map((c) => c.id).slice(0, 2)).toEqual(['cobwebNocturne', 'lanternWaltz']);
    h.world.joining.join('boothoven', 'lanternWaltz');
    expect(h.tick(1)).toContainEqual(
      expect.objectContaining({ kind: 'tune', tune: 'lanternWaltz' }),
    );
  });
});
