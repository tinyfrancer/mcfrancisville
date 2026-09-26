import { describe, expect, it } from 'vitest';
import { TOWN } from '../../src/data/maps';
import { STARTING_CANDY, type Ware } from '../../src/data/shop';
import { FakeClock } from '../../src/systems/clock';
import { popUpLot, sellValue, type Offer } from '../../src/systems/shop';
import { Town } from '../../src/world/Town';
import { harness, type Harness } from './harness';

/** The first day from the harness's own on which the pop-up is, or isn't, in town. */
function dayWhen(inTown: boolean): Date {
  for (let i = 0; i < 60; i++) {
    const day = new Date(2026, 8, 26 + i, 12);
    if ((popUpLot(TOWN.popUpLots!, day.getTime()) !== null) === inTown) return day;
  }
  throw new Error('no such day');
}

const offers = (town: Town, shop: 'corner' | 'popUp'): Offer[] =>
  town.stock(shop).flatMap((shelf) => shelf.offers);

function onShelf(town: Town, pick: (o: Offer) => boolean): Offer {
  const offer = offers(town, 'corner').find(pick);
  if (!offer) throw new Error('nothing like that on the shelves today');
  return offer;
}

const seedOffer = (town: Town) =>
  onShelf(town, (o) => 'item' in o.ware && /Seed|Bulb|Division/.test(o.ware.item));
const clothesOffer = (town: Town) => onShelf(town, (o) => 'outfit' in o.ware);

function walkTo(h: Harness, tx: number, ty: number) {
  h.town.tapTile(tx, ty);
  return h.until(() => !h.town.player.moving, `walking to ${tx},${ty}`).concat(h.tick(1));
}

describe('Candy', () => {
  it('starts a new game with a little, and a saved game with what she had', () => {
    expect(harness().town.candy).toBe(STARTING_CANDY);
    expect(harness(undefined, { candy: 742 }).town.candy).toBe(742);
  });

  it('is kept whole and never below nothing, whatever a save says', () => {
    expect(harness(undefined, { candy: -5 }).town.candy).toBe(STARTING_CANDY);
    expect(harness(undefined, { candy: 2.5 }).town.candy).toBe(STARTING_CANDY);
  });

  it('is saved as it stands', () => {
    const { town } = harness(undefined, { candy: 321 });
    expect(town.wallet()).toEqual({ candy: 321 });
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
    const { town } = harness();
    const offer = seedOffer(town);
    const seed = (offer.ware as { item: 'pumpkinSeed' }).item;
    const before = town.bag.count(seed);
    let told = -1;
    town.events.on('candy', (candy) => (told = candy));
    expect(town.buy('corner', offer.ware)).toEqual({
      kind: 'bought',
      shop: 'corner',
      ware: offer.ware,
      price: offer.price,
    });
    expect(town.bag.count(seed)).toBe(before + 1);
    expect(town.candy).toBe(STARTING_CANDY - offer.price);
    expect(told).toBe(town.candy);
  });

  it('sells as many of something as she likes, while her Candy lasts', () => {
    const { town } = harness();
    const offer = seedOffer(town);
    let bought = 0;
    while (town.buy('corner', offer.ware)) bought++;
    expect(bought).toBe(Math.floor(STARTING_CANDY / offer.price));
    expect(town.candy).toBeLessThan(offer.price);
  });

  it('puts clothes in her closet for good, and only once', () => {
    const { town } = harness(undefined, { candy: 5000 });
    const offer = clothesOffer(town);
    const outfit = (offer.ware as { outfit: 'glitterHeels' }).outfit;
    expect(town.wardrobe.owned).not.toContain(outfit);
    expect(town.buy('corner', offer.ware)).not.toBeNull();
    expect(town.wardrobe.owned).toContain(outfit);
    expect(town.buy('corner', offer.ware)).toBeNull();
    expect(town.candy).toBe(5000 - offer.price);
  });

  it("won't sell what she can't afford, or what isn't on the shelves today", () => {
    const { town } = harness(undefined, { candy: 0 });
    expect(town.buy('corner', seedOffer(town).ware)).toBeNull();
    const rich = harness(undefined, { candy: 5000 }).town;
    const sold = new Set(offers(rich, 'corner').map((o) => JSON.stringify(o.ware)));
    const missing = (['pumpkinSeed', 'roseSeed', 'batFlowerSeed', 'hostaDivision'] as const)
      .map((item): Ware => ({ item }))
      .find((w) => !sold.has(JSON.stringify(w)))!;
    expect(rich.buy('corner', missing)).toBeNull();
    expect(rich.buy('corner', { item: 'blueRose' })).toBeNull();
    expect(rich.candy).toBe(5000);
  });

  it('has new stock after 5am', () => {
    const h = harness();
    const today = JSON.stringify(h.town.stock('corner'));
    h.clock.set(new Date(2026, 8, 27, 4, 59));
    expect(JSON.stringify(h.town.stock('corner'))).toBe(today);
    h.clock.set(new Date(2026, 8, 27, 5));
    expect(JSON.stringify(h.town.stock('corner'))).not.toBe(today);
  });

  it('buys things from her bag, one or all', () => {
    const { town } = harness(undefined, { finds: { bag: [{ id: 'wood', count: 6 }] } });
    expect(town.sell('wood')).toEqual({ kind: 'sold', item: 'wood', count: 1, candy: 4 });
    expect(town.sell('wood', 5)).toEqual({ kind: 'sold', item: 'wood', count: 5, candy: 20 });
    expect(town.bag.count('wood')).toBe(0);
    expect(town.candy).toBe(STARTING_CANDY + sellValue('wood') * 6);
  });

  it("won't buy more than she has, or her purse butter", () => {
    const { town } = harness(undefined, {
      finds: {
        bag: [
          { id: 'rose', count: 1 },
          { id: 'purseButter', count: 5 },
        ],
      },
    });
    expect(town.sell('rose', 2)).toBeNull();
    expect(town.sell('purseButter')).toBeNull();
    expect(town.bag.count('rose')).toBe(1);
    expect(town.bag.count('purseButter')).toBe(5);
    expect(town.candy).toBe(STARTING_CANDY);
  });
});

describe('the pop-up shop', () => {
  it('stands solid on its lot on the days it is in town, and nowhere on the others', () => {
    const h = harness();
    h.clock.set(dayWhen(true));
    const shop = h.town.popUp()!;
    expect(shop).toMatchObject({ id: 'popUpShop', w: 3, h: 2 });
    expect(h.town.canWalk(shop.tx + 1, shop.ty + 1)).toBe(false);
    expect(h.town.canWalk(shop.tx + 1, shop.ty + 2)).toBe(true);
    h.clock.set(dayWhen(false));
    expect(h.town.popUp()).toBeNull();
    expect(h.town.canWalk(shop.tx + 1, shop.ty + 1)).toBe(true);
  });

  it('opens when she walks up to it', () => {
    const h = harness();
    h.clock.set(dayWhen(true));
    const shop = h.town.popUp()!;
    const events = walkTo(h, shop.tx + 1, shop.ty);
    expect(events).toContainEqual(expect.objectContaining({ kind: 'arrived', at: 'popUpShop' }));
    const { tx, ty } = h.town.snapshot();
    const beside = tx >= shop.tx - 1 && tx <= shop.tx + 3 && ty >= shop.ty - 1 && ty <= shop.ty + 2;
    expect(beside, `${tx},${ty}`).toBe(true);
  });

  it('sells costumes and shoes while it is in town, and nothing when it is gone', () => {
    const h = harness(undefined, { candy: 5000 });
    h.clock.set(dayWhen(true));
    const offer = offers(h.town, 'popUp')[0]!;
    expect(h.town.buy('popUp', offer.ware)).toMatchObject({ kind: 'bought', shop: 'popUp' });
    h.clock.set(dayWhen(false));
    expect(h.town.isOpen('popUp')).toBe(false);
    expect(h.town.buy('popUp', offers(h.town, 'popUp')[0]!.ware)).toBeNull();
  });

  it('never has her standing inside it: a save on its lot starts her at her door', () => {
    const day = dayWhen(true);
    const lot = popUpLot(TOWN.popUpLots!, day.getTime())!;
    const player = { tx: lot.tx + 1, ty: lot.ty, facing: 'down' as const };
    expect(new Town({ clock: new FakeClock(day), player }).snapshot()).toMatchObject(TOWN.spawn);
    expect(new Town({ clock: new FakeClock(dayWhen(false)), player }).snapshot()).toMatchObject({
      tx: player.tx,
      ty: player.ty,
    });
  });
});
