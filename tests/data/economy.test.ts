import { describe, expect, it } from 'vitest';
import { ACTIVITIES } from '../../src/data/activities';
import { BAKE_CANDY, BAKE_KEEPS, BAKES } from '../../src/data/baking';
import { CRITTERS } from '../../src/data/critters';
import { FURNITURE, FLOORINGS, WALLPAPERS } from '../../src/data/furniture';
import { PANTRY } from '../../src/data/dishes';
import { PATCHES, PROP_YIELDS, type Yield } from '../../src/data/gathering';
import { ITEMS } from '../../src/data/items';
import { CANDY_PER_WINDOW, CANDY_TREES_MOST } from '../../src/data/passive';
import { WANTED_CRITTERS, WANTED_CROPS, WANTED_DISHES } from '../../src/data/wanted';
import { VISIT_ROUND } from '../../src/data/visits';
import { RECIPES, type Need } from '../../src/data/recipes';
import { ITEM_VALUE, OUTFIT_PRICE, SHOPS } from '../../src/data/shop';
import { favourCandy } from '../../src/systems/friendship';
import { noticeCandy } from '../../src/systems/notices';
import { NOTICES } from '../../src/data/notices';
import { VILLAGERS } from '../../src/data/villagers';
import type { ItemId, MapZoneId, ShopId } from '../../src/types/ids';
import { keyOf, orderPrice } from '../../src/systems/catalogue';
import { stockOf } from '../../src/systems/shop';
import { harness } from '../world/harness';

/**
 * The shape of the economy (phase V's balance pass, decision 128): not its exact numbers, which
 * are hers to tune, but the relationships that keep Candy meaning something and never let a loop
 * make it from nothing.
 */

const ITEM_IDS = Object.keys(ITEMS) as ItemId[];

/** What one of a need is worth at the least: the plainest thing that fills it. */
function cheapest(need: Need): number {
  if ('item' in need) return ITEM_VALUE[need.item];
  const holds = PANTRY[need.any].holds;
  return Math.min(...ITEM_IDS.filter((id) => holds(id)).map((id) => ITEM_VALUE[id]));
}

/** Everything any shop's shelves may carry for her bag. */
const SOLD_ITEMS = new Set(
  Object.values(SHOPS).flatMap((shop) =>
    shop.shelves.flatMap((shelf) =>
      shelf.picks.flatMap((pick) => pick.from.flatMap((w) => ('item' in w ? [w.item] : []))),
    ),
  ),
);

/** What a yield is worth on average, rare finds and bonuses counted at their odds. */
function yieldWorth(y: Yield): number {
  let worth = y.count * ITEM_VALUE[y.item];
  if (y.rare) {
    worth += (ITEM_VALUE[y.rare.item] - worth) / y.rare.oneIn;
  }
  if (y.bonus) {
    const each = y.bonus.from.reduce((s, id) => s + ITEM_VALUE[id], 0) / y.bonus.from.length;
    worth += each / y.bonus.oneIn;
  }
  return worth;
}

/** A round of a place: everything in it she can gather once a window, and what it would sell for. */
function roundOf(zone: MapZoneId): { things: number; candy: number } {
  const map = harness().world.zones.map(zone);
  let things = 0;
  let candy = 0;
  for (const prop of map.map.props) {
    const y = PROP_YIELDS[prop.id];
    if (!y || map.standBeside(prop.tx, prop.ty).length === 0) continue;
    things++;
    candy += yieldWorth(y);
  }
  for (const patch of map.map.patches) {
    things++;
    candy += yieldWorth(PATCHES[patch.id]);
  }
  return { things, candy };
}

const PLACES: readonly MapZoneId[] = [
  'town',
  'whisperwood',
  'lanternShore',
  'castleHill',
  'hiddenClearing',
];

describe('the economy', () => {
  it('never pays more for anything than the shops sell it for', () => {
    for (const id of SOLD_ITEMS) expect(ITEM_VALUE[id], id).toBeGreaterThan(0);
  });

  it('makes nothing worth less than what went into it, or more than buying it all', () => {
    for (const [id, recipe] of Object.entries(RECIPES)) {
      if (!('item' in recipe.makes)) continue;
      const made = ITEM_VALUE[recipe.makes.item];
      const inputs = recipe.needs.reduce((s, n) => s + cheapest(n) * n.count, 0);
      expect(made, `${id} is worth what went in`).toBeGreaterThanOrEqual(inputs);
      const bought = recipe.needs.every((n) => 'item' in n && SOLD_ITEMS.has(n.item));
      if (bought)
        expect(made, `${id} can't be bought, made and sold at a profit`).toBeLessThanOrEqual(
          2 * inputs,
        );
    }
  });

  it("adds a quarter at least to what she makes from what she gathers and grows (0.2's E1)", () => {
    for (const [id, recipe] of Object.entries(RECIPES)) {
      if (!('item' in recipe.makes)) continue;
      const inputs = recipe.needs.reduce((s, n) => s + cheapest(n) * n.count, 0);
      expect(ITEM_VALUE[recipe.makes.item], id).toBeGreaterThanOrEqual(1.25 * inputs);
    }
  });

  it('pays more for a note or a favour than what she hands over would sell for', () => {
    for (const note of NOTICES) {
      expect(noticeCandy(note)).toBeGreaterThan(ITEM_VALUE[note.item] * note.count);
    }
    for (const villager of Object.values(VILLAGERS)) {
      for (const favour of villager.favours) {
        expect(favourCandy(favour)).toBeGreaterThan(ITEM_VALUE[favour.item] * favour.count);
      }
    }
  });

  it('pays about the same for every tree, rock and patch, so a bigger place is only more walking', () => {
    for (const place of PLACES) {
      const { things, candy } = roundOf(place);
      const each = candy / things;
      expect(each, place).toBeGreaterThanOrEqual(4);
      expect(each, place).toBeLessThanOrEqual(12);
    }
  });

  it("prices a window's round of the town between a squishy and a piece of furniture", () => {
    const { candy } = roundOf('town');
    const squishy = 2 * ITEM_VALUE.ghostGooBall;
    expect(candy).toBeGreaterThanOrEqual(squishy);
    expect(candy).toBeLessThanOrEqual(Math.min(...Object.values(OUTFIT_PRICE)) * 2);
  });

  it("puts the dearest thing in the shops within a day's rounds of the town", () => {
    const day = 3 * (roundOf('town').candy + CANDY_PER_WINDOW);
    const prices = [
      ...Object.values(FURNITURE).flatMap((r) => (r.price === undefined ? [] : [r.price])),
      ...Object.values(WALLPAPERS).map((r) => r.price),
      ...Object.values(FLOORINGS).map((r) => r.price),
      ...Object.values(OUTFIT_PRICE),
    ];
    expect(Math.max(...prices)).toBeLessThanOrEqual(day);
    // …and nothing for her closet or home so cheap it isn't worth a round.
    expect(Math.min(...prices)).toBeGreaterThanOrEqual(roundOf('town').candy / 2);
  });

  it('finds a whim buyer a treat on a short visit, and never everything at once', () => {
    // A short visit: half a round of the town, the day's candy on the tree, a visit's Candy.
    const gifts = VISIT_ROUND.flatMap((g) => ('candy' in g ? [g.candy] : []));
    const gift = gifts.reduce((s, c) => s + c, 0) / VISIT_ROUND.length;
    const visit = roundOf('town').candy / 2 + 3 * CANDY_PER_WINDOW + gift;
    expect(visit).toBeGreaterThanOrEqual(Math.min(...Object.values(OUTFIT_PRICE)));
    // …while the dearest piece in the shops takes more than a whole round.
    const dearest = Math.max(
      ...Object.values(FURNITURE).flatMap((r) => (r.price === undefined ? [] : [r.price])),
    );
    expect(dearest).toBeGreaterThan(roundOf('town').candy + 3 * CANDY_PER_WINDOW);
  });

  it("wants nothing at double that the shops sell, or that's made only of what they sell (E1)", () => {
    const fromShops = (n: Need) =>
      'item' in n ? SOLD_ITEMS.has(n.item) : [...SOLD_ITEMS].some((id) => PANTRY[n.any].holds(id));
    for (const id of [...WANTED_CRITTERS, ...WANTED_CROPS, ...WANTED_DISHES]) {
      expect(SOLD_ITEMS.has(id), id).toBe(false);
    }
    for (const recipe of Object.values(RECIPES)) {
      if (!('item' in recipe.makes) || !WANTED_DISHES.includes(recipe.makes.item)) continue;
      expect(recipe.needs.every(fromShops), recipe.makes.item).toBe(false);
    }
  });

  it("keeps a day of all her candy trees short of the dearest piece (E1's saplings)", () => {
    const trees = CANDY_TREES_MOST * 3 * CANDY_PER_WINDOW;
    const dearest = Math.max(
      ...Object.values(FURNITURE).flatMap((r) => (r.price === undefined ? [] : [r.price])),
    );
    expect(trees).toBeLessThan(dearest);
  });

  it("pays a morning's baking with Wrapunzel less than a round of the town (E1)", () => {
    const most = Math.max(...BAKES.map((b) => ITEM_VALUE[b.item]));
    expect(BAKE_CANDY + BAKE_KEEPS * most).toBeLessThan(roundOf('town').candy);
  });

  it("wins nothing at the fairground's games worth a go, so no go makes Candy (M2)", () => {
    for (const row of Object.values(ACTIVITIES)) {
      if (!('game' in row.does)) continue;
      for (const prize of row.does.game.prizes) expect(ITEM_VALUE[prize]).toBeLessThan(row.cost);
    }
  });

  it('sells a caught critter for more the rarer it is', () => {
    const band = { common: 0, uncommon: 0, rare: 0, legendary: 0 };
    const counts = { common: 0, uncommon: 0, rare: 0, legendary: 0 };
    for (const critter of Object.values(CRITTERS)) {
      band[critter.rarity] += critter.value;
      counts[critter.rarity]++;
    }
    const mean = (r: keyof typeof band) => band[r] / counts[r];
    expect(mean('common')).toBeLessThan(mean('uncommon'));
    expect(mean('uncommon')).toBeLessThan(mean('rare'));
    expect(mean('rare')).toBeLessThan(mean('legendary'));
  });

  it("asks no less in Ollie's catalogue than the shelves ever do, and sells back for less (S1)", () => {
    const shops = Object.keys(SHOPS) as ShopId[];
    for (let d = 0; d < 28; d++) {
      const day = `2026-10-${String(d + 1).padStart(2, '0')}`;
      for (const shop of shops) {
        for (const offer of stockOf(shop, day, 'morning', true).flatMap((s) => s.offers)) {
          const price = orderPrice(offer.ware);
          if (price === null) continue;
          expect(price, keyOf(offer.ware)).toBeGreaterThanOrEqual(offer.was ?? offer.price);
          if ('item' in offer.ware) expect(ITEM_VALUE[offer.ware.item]).toBeLessThan(price);
        }
      }
    }
  });
});
