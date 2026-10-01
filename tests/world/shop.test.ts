import { describe, expect, it } from 'vitest';
import { TOWN } from '../../src/data/maps';
import { STARTING_CANDY, type Ware } from '../../src/data/shop';
import { FakeClock } from '../../src/systems/clock';
import { popUpLot, sellValue, type Offer } from '../../src/systems/shop';
import { World } from '../../src/world/World';
import { harness, type Harness } from './harness';

/** The first day from the harness's own on which the pop-up is, or isn't, in town. */
function dayWhen(inTown: boolean): Date {
  for (let i = 0; i < 60; i++) {
    const day = new Date(2026, 8, 26 + i, 12);
    if ((popUpLot(TOWN.popUpLots!, day.getTime()) !== null) === inTown) return day;
  }
  throw new Error('no such day');
}

const offers = (world: World, shop: 'corner' | 'popUp'): Offer[] =>
  world.shops.stock(shop).flatMap((shelf) => shelf.offers);

function onShelf(world: World, pick: (o: Offer) => boolean): Offer {
  const offer = offers(world, 'corner').find(pick);
  if (!offer) throw new Error('nothing like that on the shelves today');
  return offer;
}

const seedOffer = (world: World) =>
  onShelf(world, (o) => 'item' in o.ware && /Seed|Bulb|Division/.test(o.ware.item));
const clothesOffer = (world: World) => onShelf(world, (o) => 'outfit' in o.ware);

function walkTo(h: Harness, tx: number, ty: number) {
  h.world.tapTile(tx, ty);
  return h.until(() => !h.world.player.moving, `walking to ${tx},${ty}`).concat(h.tick(1));
}

describe('Candy', () => {
  it('starts a new game with a little, and a saved game with what she had', () => {
    expect(harness().world.wallet.candy).toBe(STARTING_CANDY);
    expect(harness(undefined, { candy: 742 }).world.wallet.candy).toBe(742);
  });

  it('is kept whole and never below nothing, whatever a save says', () => {
    expect(harness(undefined, { candy: -5 }).world.wallet.candy).toBe(STARTING_CANDY);
    expect(harness(undefined, { candy: 2.5 }).world.wallet.candy).toBe(STARTING_CANDY);
  });

  it('is saved as it stands', () => {
    const { world } = harness(undefined, { candy: 321 });
    expect(world.wallet.snapshot()).toEqual({ candy: 321 });
  });
});

describe('Cobweb Corner', () => {
  it('opens when she walks up to the teal shop', () => {
    const h = harness();
    const shop = TOWN.rows.findIndex((row) => row.includes('S'));
    const tx = TOWN.rows[shop]!.indexOf('S');
    expect(walkTo(h, tx + 1, shop + 1)).toContainEqual(
      expect.objectContaining({ kind: 'arrived', at: 'shopHouse' }),
    );
  });

  it('sells her a seed into her bag, for what it says on the shelf', () => {
    const { world } = harness();
    const offer = seedOffer(world);
    const seed = (offer.ware as { item: 'pumpkinSeed' }).item;
    const before = world.bag.count(seed);
    let told = -1;
    world.events.on('candy', (candy) => (told = candy));
    expect(world.shops.buy('corner', offer.ware)).toEqual({
      kind: 'bought',
      shop: 'corner',
      ware: offer.ware,
      price: offer.price,
    });
    expect(world.bag.count(seed)).toBe(before + 1);
    expect(world.wallet.candy).toBe(STARTING_CANDY - offer.price);
    expect(told).toBe(world.wallet.candy);
  });

  it('sells as many of something as she likes, while her Candy lasts', () => {
    const { world } = harness();
    const offer = seedOffer(world);
    let bought = 0;
    while (world.shops.buy('corner', offer.ware)) bought++;
    expect(bought).toBe(Math.floor(STARTING_CANDY / offer.price));
    expect(world.wallet.candy).toBeLessThan(offer.price);
  });

  it("sells this window's special at its lower price, and has another after noon", () => {
    const h = harness(undefined, { candy: 50_000 });
    h.clock.set(new Date(2026, 8, 26, 9));
    const special = () => h.world.shops.stock('corner')[0]!;
    expect(special().name).toBe("This morning's special");
    const offer = special().offers[0]!;
    expect(h.world.shops.buy('corner', offer.ware)).toMatchObject({ price: offer.price });
    expect(offer.price).toBeLessThan(offer.was!);
    h.clock.set(new Date(2026, 8, 26, 12));
    expect(special().name).toBe("This afternoon's special");
  });

  it('puts clothes in her closet for good, and only once', () => {
    const { world } = harness(undefined, { candy: 5000 });
    const offer = clothesOffer(world);
    const outfit = (offer.ware as { outfit: 'glitterHeels' }).outfit;
    expect(world.wardrobe.owned).not.toContain(outfit);
    expect(world.shops.buy('corner', offer.ware)).not.toBeNull();
    expect(world.wardrobe.owned).toContain(outfit);
    expect(world.shops.buy('corner', offer.ware)).toBeNull();
    expect(world.wallet.candy).toBe(5000 - offer.price);
  });

  it('puts furniture in her storage chest, as many as she likes', () => {
    const { world } = harness(undefined, { candy: 50_000 });
    const offer = onShelf(world, (o) => 'furniture' in o.ware);
    const id = (offer.ware as { furniture: 'cauldron' }).furniture;
    const before = world.home.stored.find((s) => s.id === id)?.count ?? 0;
    expect(world.shops.buy('corner', offer.ware)).not.toBeNull();
    expect(world.shops.buy('corner', offer.ware)).not.toBeNull();
    expect(world.home.stored).toContainEqual({ id, count: before + 2 });
  });

  it('gives her a wallpaper and a flooring for good, and only once', () => {
    const { world } = harness(undefined, { candy: 50_000 });
    for (const kind of ['wallpaper', 'flooring'] as const) {
      const offer = onShelf(world, (o) => kind in o.ware);
      expect(world.shops.buy('corner', offer.ware)).not.toBeNull();
      expect(world.shops.buy('corner', offer.ware)).toBeNull();
    }
    expect(world.home.wallpapers).toHaveLength(2);
    expect(world.home.floorings).toHaveLength(2);
  });

  it("won't sell what she can't afford, or what isn't on the shelves today", () => {
    const { world } = harness(undefined, { candy: 0 });
    expect(world.shops.buy('corner', seedOffer(world).ware)).toBeNull();
    const rich = harness(undefined, { candy: 5000 }).world;
    const sold = new Set(offers(rich, 'corner').map((o) => JSON.stringify(o.ware)));
    const missing = (['pumpkinSeed', 'roseSeed', 'batFlowerSeed', 'hostaDivision'] as const)
      .map((item): Ware => ({ item }))
      .find((w) => !sold.has(JSON.stringify(w)))!;
    expect(rich.shops.buy('corner', missing)).toBeNull();
    expect(rich.shops.buy('corner', { item: 'blueRose' })).toBeNull();
    expect(rich.wallet.candy).toBe(5000);
  });

  it('has new stock after 5am, and a new special each window', () => {
    const h = harness();
    h.clock.set(new Date(2026, 8, 26, 18));
    const today = JSON.stringify(h.world.shops.stock('corner'));
    h.clock.set(new Date(2026, 8, 27, 4, 59));
    expect(JSON.stringify(h.world.shops.stock('corner'))).toBe(today);
    h.clock.set(new Date(2026, 8, 27, 5));
    expect(JSON.stringify(h.world.shops.stock('corner'))).not.toBe(today);
  });

  it('buys things from her bag, one or all', () => {
    const { world } = harness(undefined, { finds: { bag: [{ id: 'wood', count: 6 }] } });
    expect(world.shops.sell('wood')).toEqual({
      kind: 'sold',
      item: 'wood',
      count: 1,
      candy: sellValue('wood'),
    });
    expect(world.shops.sell('wood', 5)).toEqual({
      kind: 'sold',
      item: 'wood',
      count: 5,
      candy: sellValue('wood') * 5,
    });
    expect(world.bag.count('wood')).toBe(0);
    expect(world.wallet.candy).toBe(STARTING_CANDY + sellValue('wood') * 6);
  });

  it("won't buy more than she has, or her purse butter", () => {
    const { world } = harness(undefined, {
      finds: {
        bag: [
          { id: 'rose', count: 1 },
          { id: 'purseButter', count: 5 },
        ],
      },
    });
    expect(world.shops.sell('rose', 2)).toBeNull();
    expect(world.shops.sell('purseButter')).toBeNull();
    expect(world.bag.count('rose')).toBe(1);
    expect(world.bag.count('purseButter')).toBe(5);
    expect(world.wallet.candy).toBe(STARTING_CANDY);
  });
});

describe('the pop-up shop', () => {
  it('stands solid on its lot on the days it is in town, and nowhere on the others', () => {
    const h = harness();
    h.clock.set(dayWhen(true));
    const shop = h.world.stalls.popUp()!;
    expect(shop).toMatchObject({ id: 'popUpShop', w: 3, h: 2 });
    expect(h.world.canWalk(shop.tx + 1, shop.ty + 1)).toBe(false);
    expect(h.world.canWalk(shop.tx + 1, shop.ty + 2)).toBe(true);
    h.clock.set(dayWhen(false));
    expect(h.world.stalls.popUp()).toBeNull();
    expect(h.world.canWalk(shop.tx + 1, shop.ty + 1)).toBe(true);
  });

  it('opens when she walks up to it', () => {
    const h = harness();
    h.clock.set(dayWhen(true));
    const shop = h.world.stalls.popUp()!;
    const events = walkTo(h, shop.tx + 1, shop.ty);
    expect(events).toContainEqual(expect.objectContaining({ kind: 'arrived', at: 'popUpShop' }));
    const { tx, ty } = h.world.snapshot();
    const beside = tx >= shop.tx - 1 && tx <= shop.tx + 3 && ty >= shop.ty - 1 && ty <= shop.ty + 2;
    expect(beside, `${tx},${ty}`).toBe(true);
  });

  it('sells costumes and shoes while it is in town, and nothing when it is gone', () => {
    const h = harness(undefined, { candy: 5000 });
    h.clock.set(dayWhen(true));
    const offer = offers(h.world, 'popUp')[0]!;
    expect(h.world.shops.buy('popUp', offer.ware)).toMatchObject({ kind: 'bought', shop: 'popUp' });
    h.clock.set(dayWhen(false));
    expect(h.world.shops.isOpen('popUp')).toBe(false);
    expect(h.world.shops.buy('popUp', offers(h.world, 'popUp')[0]!.ware)).toBeNull();
  });

  it('never has her standing inside it: a save on its lot starts her at her door', () => {
    const day = dayWhen(true);
    const lot = popUpLot(TOWN.popUpLots!, day.getTime())!;
    const player = { tx: lot.tx + 1, ty: lot.ty, facing: 'down' as const, zone: 'town' as const };
    expect(new World({ clock: new FakeClock(day), player }).snapshot()).toMatchObject(TOWN.spawn);
    expect(new World({ clock: new FakeClock(dayWhen(false)), player }).snapshot()).toMatchObject({
      tx: player.tx,
      ty: player.ty,
    });
  });
});

describe("market day's stall at the fairground (0.2 M3)", () => {
  const marketDay = new Date(2026, 10, 7, 10);

  it('carries it out to the stall, open from the first day, to buy from there', () => {
    const h = harness(TOWN);
    h.clock.set(marketDay);
    expect(h.world.shops.isOpen('market')).toBe(true);
    expect(h.world.shops.stock('corner').some((s) => s.name === 'Market table')).toBe(false);
    const offer = h.world.shops.stock('market')[0]!.offers.find((o) => o.price <= STARTING_CANDY)!;
    expect(h.world.shops.buy('market', offer.ware)).toMatchObject({ kind: 'bought' });
    h.clock.set(new Date(2026, 10, 8, 10));
    expect(h.world.shops.isOpen('market')).toBe(false);
  });
});
