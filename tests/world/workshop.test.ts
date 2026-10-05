import { describe, expect, it } from 'vitest';
import { FIXTURES } from '../../src/data/interiors';
import type { Ware } from '../../src/data/shop';
import { bookPrice } from '../../src/systems/workshop';
import type { FurnitureId } from '../../src/types/ids';
import type { World } from '../../src/world/World';
import { harness, type Harness } from './harness';

const stored = (world: World, id: FurnitureId) =>
  world.home.stored.find((s) => s.id === id)?.count ?? 0;

/** The next morning, after 5am, and a step for the round to come. */
function nextMorning(h: Harness, hour = 6) {
  const now = new Date(h.clock.now());
  h.clock.set(new Date(now.getFullYear(), now.getMonth(), now.getDate() + 1, hour));
  return h.tick(1);
}

describe("Gourdon's workshop", () => {
  it("opens at his carpenter's bench", () => {
    expect(FIXTURES.carpentersBench.opens).toEqual({ shop: 'workshop' });
  });

  it('sells what is fresh from the bench today, into her chest, at the shelf price', () => {
    const { world } = harness(undefined, { candy: 5000 });
    expect(world.shops.isOpen('workshop')).toBe(true);
    const [offer] = world.shops.stock('workshop')[0]!.offers;
    const piece = (offer!.ware as { furniture: FurnitureId }).furniture;
    const had = stored(world, piece);
    expect(world.shops.buy('workshop', offer!.ware)).toMatchObject({ kind: 'bought' });
    expect(world.wallet.candy).toBe(5000 - offer!.price);
    expect(stored(world, piece)).toBe(had + 1);
  });

  it('makes any piece in his book to order, and Ollie brings it in the morning', () => {
    const h = harness(undefined, { candy: 5000 });
    const { world } = h;
    const bench: Ware = { furniture: 'gardenBench' };
    const price = bookPrice('gardenBench')!;
    expect(world.workshop.book().some((p) => p.piece === 'gardenBench')).toBe(true);
    expect(world.workshop.order('gardenBench')).toEqual({ kind: 'ordered', ware: bench, price });
    expect(world.wallet.candy).toBe(5000 - price);
    expect(world.deliveries.onTheWay()).toEqual([bench]);

    const events = nextMorning(h);
    expect(events).toContainEqual({ kind: 'delivered', wares: [bench] });
    const letter = world.mailbox.view().find((l) => l.id.startsWith('order:'))!;
    expect(letter).toMatchObject({ from: 'ollie', gift: bench, opened: false });
    expect(world.mailbox.open(letter.id)).toBe(true);
    expect(stored(world, 'gardenBench')).toBe(1);
  });

  it('takes nothing for a piece she cannot afford, or one he does not make', () => {
    const { world } = harness(undefined, { candy: 100 });
    expect(world.workshop.order('batBed')).toBeNull();
    expect(world.wallet.candy).toBe(100);
    expect(world.deliveries.onTheWay()).toEqual([]);
    const rich = harness(undefined, { candy: 5000 }).world;
    expect(rich.workshop.order('ghostStories')).toBeNull();
    expect(rich.wallet.candy).toBe(5000);
  });
});
