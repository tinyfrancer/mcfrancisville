import { describe, expect, it } from 'vitest';
import { DISHES } from '../../src/data/dishes';
import { CROPS } from '../../src/data/crops';
import { PROP_YIELDS } from '../../src/data/gathering';
import { BOO_ACRES } from '../../src/data/maps';
import { FRUIT_OF, FRUITS, ORCHARD_DISHES, type FruitTreeId } from '../../src/data/orchard';
import { RECIPES } from '../../src/data/recipes';
import { VILLAGERS } from '../../src/data/villagers';
import { parseMap } from '../../src/systems/grid';
import type { ItemId, ZoneId } from '../../src/types/ids';
import { harness, type Harness } from './harness';

/** She stands in `zone` on `tile`, with what a test hands her. */
function standingIn(
  zone: ZoneId,
  tile: { tx: number; ty: number },
  bag: { id: ItemId; count: number }[] = [],
): Harness {
  return harness(undefined, { player: { zone, ...tile, facing: 'down' }, finds: { bag } });
}

function walkTo(h: Harness, tx: number, ty: number) {
  h.world.tapTile(tx, ty);
  return h.until(() => !h.world.player.moving, `walking to ${tx},${ty}`).concat(h.tick(1));
}

const ACRES = parseMap(BOO_ACRES);

describe("Boo Acres' orchard (0.3's F2)", () => {
  it('gives each kind of tree its own fruit, two a window', () => {
    for (const [tree, fruit] of Object.entries(FRUIT_OF)) {
      expect(PROP_YIELDS[tree as FruitTreeId]).toEqual({ item: fruit, count: 2 });
    }
    const trees = ACRES.props.filter((p) => p.id in FRUIT_OF).map((p) => p.id);
    expect(new Set(trees)).toEqual(new Set(Object.keys(FRUIT_OF)));
  });

  it('picks an apple tree once a window, and it has more the next', () => {
    const h = standingIn('booAcres', BOO_ACRES.spawn);
    const tree = ACRES.props.find((p) => p.id === 'appleTree')!;
    expect(walkTo(h, tree.tx, tree.ty)).toContainEqual({
      kind: 'gathered',
      from: 'appleTree',
      item: 'apple',
      count: 2,
    });
    walkTo(h, BOO_ACRES.spawn.tx, BOO_ACRES.spawn.ty);
    expect(walkTo(h, tree.tx, tree.ty)).toContainEqual(
      expect.objectContaining({ kind: 'resting', from: 'appleTree', back: 'evening' }),
    );
    h.clock.set(new Date(2026, 8, 26, 18));
    walkTo(h, BOO_ACRES.spawn.tx, BOO_ACRES.spawn.ty);
    walkTo(h, tree.tx, tree.ty);
    expect(h.world.bag.count('apple')).toBe(4);
  });

  it('cooks every fruit into a dish at the stove, each loved by a neighbour', () => {
    const used = new Set<string>();
    for (const id of Object.keys(ORCHARD_DISHES) as (keyof typeof ORCHARD_DISHES)[]) {
      expect(DISHES[id]).toBeDefined();
      const recipe = RECIPES[id];
      expect(recipe.at).toBe('stove');
      for (const need of recipe.needs) if ('item' in need) used.add(need.item);
      expect(
        Object.values(VILLAGERS).some((v) => v.loves.includes(id)),
        `someone loves ${id}`,
      ).toBe(true);
    }
    for (const fruit of FRUITS) expect(used.has(fruit), fruit).toBe(true);
  });
});

describe("Boo Acres' seed cart (0.3's F2)", () => {
  const seedsOn = (h: Harness) =>
    h.world.shops
      .stock('seeds')
      .flatMap((shelf) => shelf.offers)
      .flatMap((o) => ('item' in o.ware ? [o.ware.item] : []));

  it('sells every seed there is, every day, in the same order', () => {
    const h = standingIn('booAcres', BOO_ACRES.spawn);
    const every = Object.values(CROPS).map((c) => c.seed);
    const first = seedsOn(h);
    expect(new Set(first)).toEqual(new Set(every));
    expect(first).toHaveLength(every.length);
    for (const day of [27, 28, 29, 30]) {
      h.clock.set(new Date(2026, 8, day, 12));
      expect(seedsOn(h)).toEqual(first);
    }
    expect(h.world.shops.isOpen('seeds')).toBe(true);
  });

  it("opens when she walks up to the cart, and sells her a seed and the orchard's cards", () => {
    const h = harness(undefined, {
      player: { zone: 'booAcres', ...BOO_ACRES.spawn, facing: 'down' },
      candy: 500,
    });
    const cart = ACRES.props.find((p) => p.id === 'seedCart')!;
    expect(walkTo(h, cart.tx, cart.ty)).toContainEqual(
      expect.objectContaining({ kind: 'arrived', at: 'seedCart' }),
    );
    const before = h.world.bag.count('irisBulb');
    expect(h.world.shops.buy('seeds', { item: 'irisBulb' })).toMatchObject({ kind: 'bought' });
    expect(h.world.bag.count('irisBulb')).toBe(before + 1);
    expect(h.world.shops.buy('seeds', { recipe: 'applePie' })).toMatchObject({ kind: 'bought' });
  });
});
