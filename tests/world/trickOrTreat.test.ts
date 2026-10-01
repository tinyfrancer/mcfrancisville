import { describe, expect, it } from 'vitest';
import { TREE_FIRST_FILL, CANDY_PER_WINDOW } from '../../src/data/passive';
import { dayKey } from '../../src/systems/clock';
import { sweetAt } from '../../src/systems/trickOrTreat';
import type { PropId } from '../../src/types/ids';
import type { WorldEvent } from '../../src/world/World';
import { harness, type Harness } from './harness';

function walkUp(h: Harness, building: PropId): WorldEvent[] {
  const prop = h.world.map.props.find((p) => p.id === building)!;
  expect(h.world.tapTile(prop.tx, prop.ty)).toBe(true);
  return h.until(() => !h.world.player.moving, `walking to ${building}`).concat(h.tick(2));
}

const treats = (events: WorldEvent[]) =>
  events.filter(
    (e): e is Extract<WorldEvent, { kind: 'trickOrTreat' }> => e.kind === 'trickOrTreat',
  );

describe('trick or treat at the doors', () => {
  it("gets a sweet at a neighbour's door on an October evening, instead of going in", () => {
    const h = harness();
    h.clock.set(new Date(2026, 9, 3, 19));
    const sweet = sweetAt('barty', dayKey(h.clock.now()));
    const events = walkUp(h, 'bartyHouse');
    const [treat] = treats(events);
    expect(treat).toMatchObject({ villager: 'barty', item: sweet });
    expect(treat!.line).not.toMatch(/\{(name|sweet|who)\}/);
    expect(h.world.bag.count(sweet)).toBe(1);
    expect(h.world.scene).toBe('town');
    // The next walk up goes in, as ever, and there's no second sweet tonight.
    const again = walkUp(h, 'bartyHouse');
    expect(treats(again)).toEqual([]);
    expect(h.world.scene).toBe('bartyCottage');
    expect(h.world.bag.count(sweet)).toBe(1);
  });

  it('comes back the next evening, and not by day, nor at a shop', () => {
    const h = harness();
    h.clock.set(new Date(2026, 9, 3, 12));
    walkUp(h, 'codyHouse');
    expect(h.world.scene).toBe('codyManor');
    const h2 = harness();
    h2.clock.set(new Date(2026, 9, 3, 20));
    walkUp(h2, 'shopHouse');
    expect(h2.world.scene).toBe('cobwebCorner');
  });

  it('is not for a newcomer who has not moved in', () => {
    const h = harness();
    h.clock.set(new Date(2026, 9, 3, 20));
    expect(h.world.trickOrTreat.answers('ollieCottage')).toBe(false);
    expect(h.world.trickOrTreat.answers('bartyCottage')).toBe(true);
  });

  it('leaves a door open when a happening is on inside', () => {
    const h = harness();
    // Wrapunzel's midnight bake, at Crumbs & Curios.
    h.clock.set(new Date(2026, 9, 2, 23, 0));
    expect(h.world.neighbourhood.happeningIn('crumbs')).toBe('midnightBake');
    expect(h.world.trickOrTreat.answers('crumbs')).toBe(false);
  });

  it('is nothing in September', () => {
    const h = harness();
    h.clock.set(new Date(2026, 8, 30, 20));
    expect(h.world.trickOrTreat.answers('bartyCottage')).toBe(false);
  });
});

describe('the candy tree in October', () => {
  it('drops a sweet with its Candy', () => {
    const h = harness();
    h.clock.set(new Date(2026, 9, 3, 12));
    const events = walkUp(h, 'candyTree');
    const shook = events.find((e) => e.kind === 'shook');
    expect(shook).toMatchObject({ candy: TREE_FIRST_FILL * CANDY_PER_WINDOW });
    const sweet = shook?.kind === 'shook' ? shook.sweet : undefined;
    expect(sweet).toBeDefined();
    expect(h.world.bag.count(sweet!)).toBe(1);
  });
});

describe('the neighbours in costume', () => {
  it('says nothing of those who have not moved in yet', () => {
    const h = harness();
    // Week four's costumes are the newcomers', and none has moved into a new town.
    h.clock.set(new Date(2026, 9, 22, 9));
    expect(h.tick(2).some((e) => e.kind === 'dressedUp')).toBe(false);
  });

  it('puts week one on in the first week', () => {
    const h = harness();
    h.clock.set(new Date(2026, 9, 1, 9));
    const dressed = h.tick(2).find((e) => e.kind === 'dressedUp');
    expect(dressed).toEqual({ kind: 'dressedUp', villagers: ['barty', 'cody'] });
    expect(h.world.holidays.inCostume('cody')).toBe(true);
    expect(h.world.holidays.inCostume('rufus')).toBe(false);
  });
});
