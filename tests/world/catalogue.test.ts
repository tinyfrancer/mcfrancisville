import { describe, expect, it } from 'vitest';
import { FURNITURE } from '../../src/data/furniture';
import type { Ware } from '../../src/data/shop';
import { keyOf } from '../../src/systems/catalogue';
import { letterOf } from '../../src/systems/friendship';
import { priceOf } from '../../src/systems/shop';
import { World } from '../../src/world/World';
import { harness, type Harness } from './harness';

const CHAIR: Ware = { furniture: 'pumpkinChair' };
const GOO: Ware = { item: 'ghostGooBall' };

const chairs = (world: World) => world.home.stored.find((s) => s.id === 'pumpkinChair')?.count ?? 0;

/** The next morning, after 5am, and a step for the round to come. */
function nextMorning(h: Harness, hour = 6) {
  const now = new Date(h.clock.now());
  h.clock.set(new Date(now.getFullYear(), now.getMonth(), now.getDate() + 1, hour));
  return h.tick(1);
}

describe("Ollie's catalogue", () => {
  it('lists what she has had from the first day, at the shelf price', () => {
    const { world } = harness();
    const chair = world.catalogue.entries().find((e) => keyOf(e.ware) === keyOf(CHAIR));
    expect(chair).toMatchObject({ group: 'furniture', price: priceOf(CHAIR), yours: false });
  });

  it('leaves out what no shop sells, and what is hers for good already', () => {
    const { world } = harness(undefined, { home: { stored: [{ id: 'ghostStories', count: 1 }] } });
    const keys = world.catalogue.entries().map((e) => keyOf(e.ware));
    expect(world.belongings.hasHad({ furniture: 'ghostStories' })).toBe(true);
    expect(keys).not.toContain('furniture:ghostStories');
    expect(keys.some((k) => k.startsWith('outfit:') || k.startsWith('wallpaper:'))).toBe(false);
    for (const e of world.catalogue.entries()) {
      if ('furniture' in e.ware) expect(FURNITURE[e.ware.furniture].price).toBe(e.price);
    }
  });

  it('remembers a squishy she sold, and lets her order it again', () => {
    const { world } = harness(undefined, { finds: { bag: [{ id: 'ghostGooBall', count: 1 }] } });
    expect(world.shops.sell('ghostGooBall', 1)).not.toBeNull();
    expect(world.bag.count('ghostGooBall')).toBe(0);
    expect(world.catalogue.entries().some((e) => keyOf(e.ware) === keyOf(GOO))).toBe(true);
    expect(world.belongings.snapshot().ever).toContain('item:ghostGooBall');
  });

  it('never sells what she has never had', () => {
    const { world } = harness(undefined, { candy: 5000 });
    expect(world.catalogue.order({ furniture: 'bubbleTank' })).toBeNull();
    expect(world.wallet.candy).toBe(5000);
  });

  it('takes nothing for an order she cannot afford', () => {
    const { world } = harness(undefined, { candy: 10 });
    expect(world.catalogue.order(CHAIR)).toBeNull();
    expect(world.wallet.candy).toBe(10);
    expect(world.deliveries.onTheWay()).toEqual([]);
  });
});

describe("Ollie's deliveries", () => {
  it('bring an order next morning, in a letter from him with the thing in it', () => {
    const h = harness(undefined, { candy: 1000 });
    const { world } = h;
    const had = chairs(world);
    expect(world.catalogue.order(CHAIR)).toMatchObject({ kind: 'ordered', price: 350 });
    expect(world.wallet.candy).toBe(650);
    expect(world.deliveries.onTheWay()).toEqual([CHAIR]);

    // Not today, however late.
    h.clock.set(new Date(2026, 8, 26, 23, 59));
    h.tick(1);
    expect(world.mailbox.view().some((l) => l.id.startsWith('order:'))).toBe(false);

    const events = nextMorning(h);
    expect(events).toContainEqual({ kind: 'delivered', wares: [CHAIR] });
    const letter = world.mailbox.view().find((l) => l.id.startsWith('order:'))!;
    expect(letter).toMatchObject({ from: 'ollie', gift: CHAIR, opened: false });
    expect(world.deliveries.onTheWay()).toEqual([]);
    expect(chairs(world)).toBe(had);
    expect(world.mailbox.open(letter.id)).toBe(true);
    expect(chairs(world)).toBe(had + 1);
  });

  it('come before 5am to the day they were ordered on, at 5am the next', () => {
    const h = harness(undefined, { candy: 1000 });
    h.clock.set(new Date(2026, 8, 27, 2));
    h.world.catalogue.order(CHAIR);
    h.clock.set(new Date(2026, 8, 27, 4, 59));
    h.tick(1);
    expect(h.world.deliveries.onTheWay()).toHaveLength(1);
    h.clock.set(new Date(2026, 8, 27, 5));
    h.tick(1);
    expect(h.world.deliveries.onTheWay()).toHaveLength(0);
  });

  it('bring two of the same, in two letters', () => {
    const h = harness(undefined, { candy: 1000 });
    h.world.catalogue.order(CHAIR);
    h.world.catalogue.order(CHAIR);
    nextMorning(h);
    const letters = h.world.mailbox.view().filter((l) => l.id.startsWith('order:'));
    expect(letters).toHaveLength(2);
    const had = chairs(h.world);
    for (const l of letters) h.world.mailbox.open(l.id);
    expect(chairs(h.world)).toBe(had + 2);
  });

  it('keep what is on its way, and what she has had, through a save', () => {
    const h = harness(undefined, {
      candy: 1000,
      finds: { bag: [{ id: 'ghostGooBall', count: 1 }] },
    });
    h.world.shops.sell('ghostGooBall', 1);
    h.world.catalogue.order(CHAIR);
    const saved = h.world.save();
    expect(saved.orders).toEqual([{ ware: 'furniture:pumpkinChair', on: '2026-09-26' }]);
    const again = harness(undefined, { ever: saved.ever, orders: saved.orders });
    expect(again.world.deliveries.onTheWay()).toEqual([CHAIR]);
    expect(again.world.belongings.hasHad(GOO)).toBe(true);
    nextMorning(again);
    expect(again.world.mailbox.view().some((l) => l.id.startsWith('order:'))).toBe(true);
  });

  it("let go of what a save keeps that this build doesn't know", () => {
    const { world } = harness(undefined, {
      ever: ['furniture:noSuchThing', 'nonsense', 'item:ghostGooBall'],
      orders: [{ ware: 'furniture:noSuchThing', on: '2026-09-25' }],
    });
    expect(world.belongings.snapshot().ever).toContain('item:ghostGooBall');
    expect(world.belongings.snapshot().ever).not.toContain('furniture:noSuchThing');
    expect(world.deliveries.onTheWay()).toEqual([]);
  });

  it('write letters any build can read back, with the thing in them', () => {
    expect(letterOf('order:furniture:pumpkinChair:3')).toMatchObject({
      from: 'ollie',
      gift: CHAIR,
    });
    expect(letterOf('order:item:ghostGooBall:0')?.gift).toEqual(GOO);
    expect(letterOf('order:furniture:noSuchThing:0')).toBeNull();
    expect(letterOf('order:item:wood:0')).toBeNull();
  });
});
