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
import { fromSave, World } from '../../src/world/World';
import type { Plot } from '../../src/world/Farm';
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

/** Taps a bed twice, to look and then to walk up and do what it said, and lets her get there. */
function tend(h: Harness, bed: Plot) {
  h.world.tapTile(bed.tx, bed.ty);
  h.world.tapTile(bed.tx, bed.ty);
  return h.until(() => !h.world.player.moving, `tending ${bed.tx},${bed.ty}`).concat(h.tick(1));
}

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

describe("Boo Acres' greenhouse (0.3's F2)", () => {
  /** In the greenhouse, by the mat, with seeds. */
  const inside = (at = new Date(2026, 8, 26, 12)) => {
    const h = harness(undefined, {
      player: { zone: 'greenhouse', tx: 5, ty: 9, facing: 'up' },
      finds: {
        bag: [
          { id: 'pumpkinSeed', count: 4 },
          { id: 'tomatoSeed', count: 2 },
        ],
      },
    });
    h.clock.set(at);
    return h;
  };

  it('goes in by its glass door at Boo Acres, and back out onto the step', () => {
    const h = standingIn('booAcres', BOO_ACRES.spawn);
    const glass = ACRES.props.find((p) => p.id === 'greenhouse')!;
    expect(walkTo(h, glass.tx + 2, glass.ty + 2)).toContainEqual({
      kind: 'entered',
      scene: 'greenhouse',
    });
    const mat = h.world.zones.room('greenhouse').room.mat;
    walkTo(h, mat.tx, mat.ty - 1);
    expect(walkTo(h, mat.tx, mat.ty)).toContainEqual({ kind: 'entered', scene: 'booAcres' });
    expect(h.world.movement.tile).toEqual({ tx: glass.tx + 2, ty: glass.ty + glass.h });
  });

  it('has twelve raised beds, each one of hers, and its door at Boo Acres', () => {
    const h = inside();
    const beds = h.world.farm.bedsIn('greenhouse');
    expect(beds).toHaveLength(12);
    for (const bed of beds) expect(h.world.farm.isBed(bed)).toBe(true);
    expect(BOO_ACRES.doors).toContainEqual({ prop: 'greenhouse', to: 'greenhouse' });
  });

  it('grows a crop as if in its own season, all year, and no sooner in its season', () => {
    // September: tomatoes are summer's, so under glass they're quick; in July they're in season.
    const h = inside();
    const [bed, next] = h.world.farm.bedsIn('greenhouse');
    tend(h, bed!);
    expect(h.world.garden.plant(bed!, 'tomatoSeed')).toMatchObject({ quick: true });
    expect(h.world.farm.planting(bed!)!.quick).toBe(true);

    const july = inside(new Date(2027, 6, 10, 12));
    tend(july, next!);
    expect(july.world.garden.plant(next!, 'tomatoSeed')).toMatchObject({ season: true });
    expect(july.world.farm.planting(next!)!.quick).toBeUndefined();
    // A pumpkin has no season, so the glass is its season every day.
    tend(july, bed!);
    expect(july.world.garden.plant(bed!, 'pumpkinSeed')).toMatchObject({ quick: true });
  });

  it('grows a pumpkin there to be picked a day sooner than in a field, and keeps it in a save', () => {
    const h = inside();
    const [bed] = h.world.farm.bedsIn('greenhouse');
    tend(h, bed!);
    h.world.garden.plant(bed!, 'pumpkinSeed');
    h.clock.advance(24 * 60 * 60 * 1000);
    expect(tend(h, bed!)).toContainEqual(
      expect.objectContaining({ kind: 'harvested', item: 'pumpkin' }),
    );
    tend(h, bed!);
    h.world.garden.plant(bed!, 'pumpkinSeed');
    const again = new World({ clock: h.clock, ...fromSave(h.world.save()) });
    expect(again.farm.planting(bed!)).toMatchObject({ crop: 'pumpkin', quick: true });
  });
});

describe("Boo Acres' barn (0.3's F2)", () => {
  const SPRINKLERS = { id: 'sprinkler' as const, count: 6 };

  it('splits the fields into blocks of rows, and waters each whole with as few as it takes', () => {
    const h = standingIn('booAcres', BOO_ACRES.spawn, [SPRINKLERS]);
    const wall = h.world.barn.wall();
    expect(wall.inBag).toBe(6);
    expect(wall.fields.map((f) => [f.rows, f.beds, f.needs])).toEqual([
      [[1, 2], 12, 2],
      [[3, 4], 12, 2],
    ]);
    expect(h.world.barn.sprinkle(0)).toBe(2);
    const after = h.world.barn.wall();
    expect(after.inBag).toBe(4);
    expect(after.fields[0]).toMatchObject({ watered: 12, needs: 0, standing: 2 });
    expect(after.standing).toEqual([{ zone: 'booAcres', count: 2 }]);
    for (const bed of h.world.farm.bedsIn('booAcres').slice(0, 12)) {
      expect(h.world.farm.sprinkled(bed)).not.toBeNull();
    }
  });

  it('sprinkles as far as her sprinklers go, and brings them in again', () => {
    const h = standingIn('booAcres', BOO_ACRES.spawn, [{ id: 'sprinkler', count: 1 }]);
    expect(h.world.barn.sprinkle(1)).toBe(1);
    expect(h.world.barn.wall().fields[1]).toMatchObject({ needs: 1, standing: 1 });
    expect(h.world.barn.bringIn(1)).toBe(1);
    expect(h.world.bag.count('sprinkler')).toBe(1);
    expect(h.world.barn.wall().fields[1]).toMatchObject({ watered: 0, standing: 0 });
  });

  it('takes in the rows she builds', () => {
    const h = standingIn('booAcres', BOO_ACRES.spawn);
    h.world.farm.extend();
    h.world.farm.extend();
    h.world.farm.extend();
    expect(h.world.barn.wall().fields.map((f) => f.rows)).toEqual([
      [1, 2],
      [3, 4],
      [5, 5],
    ]);
  });

  it('opens when she walks up to the barn', () => {
    const h = standingIn('booAcres', BOO_ACRES.spawn);
    const barn = ACRES.props.find((p) => p.id === 'barn')!;
    expect(walkTo(h, barn.tx + 3, barn.ty + 3)).toContainEqual(
      expect.objectContaining({ kind: 'arrived', at: 'barn' }),
    );
  });
});
