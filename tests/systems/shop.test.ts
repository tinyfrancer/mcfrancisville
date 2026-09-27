import { describe, expect, it } from 'vitest';
import { RECIPES } from '../../src/data/recipes';
import { FURNITURE } from '../../src/data/furniture';
import { STARTER_HOME } from '../../src/data/home';
import { ITEMS } from '../../src/data/items';
import { TOWN } from '../../src/data/maps';
import { OUTFITS, STARTER_WARDROBE } from '../../src/data/outfits';
import { ITEM_VALUE, OUTFIT_PRICE, SHOPS, type Ware } from '../../src/data/shop';
import { dayKey } from '../../src/systems/clock';
import { canSell, popUpLot, priceOf, sameWare, stockOf } from '../../src/systems/shop';
import type { FurnitureId, ItemId, ShopId } from '../../src/types/ids';

const SHOP_IDS = Object.keys(SHOPS) as ShopId[];

/** A year of day keys, from the day the harness stands still on. */
const YEAR = Array.from({ length: 365 }, (_, i) => dayKey(new Date(2026, 8, 26 + i, 12).getTime()));

const wares = (shop: ShopId, day: string): Ware[] =>
  stockOf(shop, day).flatMap((shelf) => shelf.offers.map((o) => o.ware));

const isFancy = (w: Ware) => 'outfit' in w && OUTFITS[w.outfit].fancy === true;

describe('the day’s stock', () => {
  it('is the same all day, and new when the day turns over at 5am', () => {
    const morning = dayKey(new Date(2026, 8, 26, 9).getTime());
    const lateNight = dayKey(new Date(2026, 8, 27, 4, 59).getTime());
    expect(stockOf('corner', lateNight)).toEqual(stockOf('corner', morning));
    const shown = (day: string) => JSON.stringify(stockOf('corner', day));
    const tomorrow = dayKey(new Date(2026, 8, 27, 5).getTime());
    expect(shown(tomorrow)).not.toBe(shown(morning));
  });

  it('deals each shelf the number it asks for, with nothing twice', () => {
    for (const shop of SHOP_IDS) {
      for (const day of YEAR.slice(0, 30)) {
        stockOf(shop, day).forEach((shelf, s) => {
          const want = SHOPS[shop].shelves[s]!.picks.reduce((n, p) => n + p.count, 0);
          expect(shelf.offers, `${shop} ${shelf.name} ${day}`).toHaveLength(want);
          const keys = shelf.offers.map((o) => JSON.stringify(o.ware));
          expect(new Set(keys).size).toBe(keys.length);
        });
      }
    }
  });

  it('always has fancy shoes, a pair or two, and a pizza at Cobweb Corner', () => {
    for (const day of YEAR) {
      expect(wares('corner', day).filter(isFancy), day).toHaveLength(2);
      expect(wares('popUp', day).filter(isFancy), day).toHaveLength(1);
      expect(wares('corner', day)).toContainEqual({ item: 'jackOLanternPizza' });
    }
  });

  it('gets round to everything each shop carries, within a year', () => {
    for (const shop of SHOP_IDS) {
      const seen = new Set(YEAR.flatMap((day) => wares(shop, day).map((w) => JSON.stringify(w))));
      for (const shelf of SHOPS[shop].shelves) {
        for (const pick of shelf.picks) {
          for (const w of pick.from) expect(seen, JSON.stringify(w)).toContain(JSON.stringify(w));
        }
      }
    }
  });

  it('prices each thing at twice what the shop would pay, and each piece of clothing at its own', () => {
    expect(priceOf({ item: 'pumpkinSeed' })).toBe(ITEM_VALUE.pumpkinSeed * 2);
    expect(priceOf({ outfit: 'glitterHeels' })).toBe(OUTFIT_PRICE.glitterHeels);
    for (const shop of SHOP_IDS) {
      for (const day of YEAR.slice(0, 7)) {
        for (const { ware, price } of stockOf(shop, day).flatMap((s) => s.offers)) {
          expect(price, JSON.stringify(ware)).toBeGreaterThan(0);
        }
      }
    }
  });

  it('only sells clothes she could not already have from the start', () => {
    for (const shop of SHOP_IDS) {
      for (const shelf of SHOPS[shop].shelves) {
        for (const w of shelf.picks.flatMap((p) => p.from)) {
          if ('outfit' in w) expect(STARTER_WARDROBE, w.outfit).not.toContain(w.outfit);
        }
      }
    }
  });

  it('tells wares apart', () => {
    expect(sameWare({ item: 'rose' }, { item: 'rose' })).toBe(true);
    expect(sameWare({ item: 'rose' }, { item: 'blueRose' })).toBe(false);
    expect(sameWare({ outfit: 'catEars' }, { item: 'rose' })).toBe(false);
    expect(sameWare({ outfit: 'catEars' }, { outfit: 'catEars' })).toBe(true);
    expect(sameWare({ furniture: 'cauldron' }, { furniture: 'cauldron' })).toBe(true);
    expect(sameWare({ furniture: 'cauldron' }, { furniture: 'batLamp' })).toBe(false);
    expect(sameWare({ wallpaper: 'batDamask' }, { flooring: 'checkerboard' })).toBe(false);
  });

  it('sells every piece of furniture with a price, and prices every piece she can only buy', () => {
    const sold = new Set(
      SHOP_IDS.flatMap((shop) =>
        SHOPS[shop].shelves.flatMap((shelf) => shelf.picks.flatMap((p) => p.from)),
      ).flatMap((w) => ('furniture' in w ? [w.furniture] : [])),
    );
    const made = new Set(
      Object.values(RECIPES).flatMap((r) => ('furniture' in r.makes ? [r.makes.furniture] : [])),
    );
    for (const id of Object.keys(FURNITURE) as FurnitureId[]) {
      const hers = id === 'mysteryCorkboard' || id === 'workbench';
      expect(sold.has(id), id).toBe(!hers && !made.has(id));
      expect(FURNITURE[id].price !== undefined, id).toBe(sold.has(id));
    }
    expect(priceOf({ furniture: 'marbleRun' })).toBe(FURNITURE.marbleRun.price);
  });

  it('has furniture at Cobweb Corner, and a wallpaper and a flooring she does not have yet', () => {
    for (const day of YEAR.slice(0, 30)) {
      const today = wares('corner', day);
      expect(
        today.filter((w) => 'furniture' in w),
        day,
      ).toHaveLength(3);
      const surfaces = today.filter((w) => 'wallpaper' in w || 'flooring' in w);
      expect(surfaces, day).toHaveLength(2);
      for (const w of surfaces) {
        if ('wallpaper' in w) expect(w.wallpaper).not.toBe(STARTER_HOME.wallpaper);
        if ('flooring' in w) expect(w.flooring).not.toBe(STARTER_HOME.flooring);
      }
      expect(
        wares('popUp', day).filter((w) => 'furniture' in w),
        day,
      ).toHaveLength(2);
    }
  });
});

describe('selling', () => {
  it('takes everything but purse butter', () => {
    for (const id of Object.keys(ITEMS) as ItemId[]) {
      expect(canSell(id), id).toBe(id !== 'purseButter');
    }
  });

  it('pays more for what took longer to grow than for what she picks up', () => {
    expect(ITEM_VALUE.blueRose).toBeGreaterThan(ITEM_VALUE.rose);
    expect(ITEM_VALUE.pumpkin).toBeGreaterThan(ITEM_VALUE.wood);
    expect(ITEM_VALUE.pumpkin).toBeGreaterThan(priceOf({ item: 'pumpkinSeed' }));
  });
});

describe('the pop-up shop', () => {
  const lots = TOWN.popUpLots!;
  const noon = (i: number) => new Date(2026, 8, 26 + i, 12).getTime();

  it('is in town on about four days in seven, on one of its lots', () => {
    const open = YEAR.map((_, i) => popUpLot(lots, noon(i))).filter((lot) => lot !== null);
    expect(open.length / YEAR.length).toBeGreaterThan(0.45);
    expect(open.length / YEAR.length).toBeLessThan(0.7);
    for (const lot of open) expect(lots).toContainEqual(lot);
  });

  it('turns up on every lot, given long enough', () => {
    const used = new Set(YEAR.map((_, i) => JSON.stringify(popUpLot(lots, noon(i)))));
    for (const lot of lots) expect(used).toContain(JSON.stringify(lot));
  });

  it('stays put all day, and moves on when the day turns over', () => {
    const i = YEAR.findIndex((_, d) => popUpLot(lots, noon(d)) !== null);
    const day = new Date(2026, 8, 26 + i);
    const at = (h: number, m = 0) => popUpLot(lots, day.getTime() + (h * 60 + m) * 60_000);
    expect(at(5)).toEqual(at(12));
    expect(at(28, 59)).toEqual(at(12));
    const sameEveryMorning = YEAR.slice(0, 14).every(
      (_, d) => JSON.stringify(popUpLot(lots, noon(d))) === JSON.stringify(at(12)),
    );
    expect(sameEveryMorning).toBe(false);
  });

  it('never comes to a town with nowhere to stand', () => {
    expect(popUpLot([], noon(0))).toBeNull();
  });
});
