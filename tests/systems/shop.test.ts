import { HOLIDAY_LETTERS } from '../../src/data/holidays';
import { MUSEUM_LETTERS } from '../../src/data/museum';
import { SPECIAL_LETTERS } from '../../src/data/specialDays';
import { VILLAGERS } from '../../src/data/villagers';
import { keepsakes } from '../../src/systems/interiors';
import { describe, expect, it } from 'vitest';
import { RECIPES } from '../../src/data/recipes';
import { FURNITURE } from '../../src/data/furniture';
import { STARTER_HOME } from '../../src/data/home';
import { ITEMS } from '../../src/data/items';
import { TOWN } from '../../src/data/maps';
import { OUTFITS, STARTER_WARDROBE } from '../../src/data/outfits';
import { ITEM_VALUE, OUTFIT_PRICE, SHOPS, SPECIAL_OFF, type Ware } from '../../src/data/shop';
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

  it("has a special at Cobweb Corner that's new each window, a quarter off", () => {
    const day = YEAR[0]!;
    const special = (window: 'morning' | 'afternoon' | 'evening') =>
      stockOf('corner', day, window).find((s) => s.name.endsWith('special'))!;
    expect(special('morning').name).toBe("This morning's special");
    expect(special('evening').name).toBe("This evening's special");
    const offer = special('afternoon').offers[0]!;
    expect(offer.was).toBe(priceOf(offer.ware));
    expect(offer.price).toBe(Math.round(offer.was! * (1 - SPECIAL_OFF)));
    // The other shelves are the day's, whatever the window.
    const rest = (window: 'morning' | 'evening') =>
      stockOf('corner', day, window).filter((s) => !s.name.endsWith('special'));
    expect(rest('evening')).toEqual(rest('morning'));
    const specials = new Set(
      YEAR.slice(0, 10).flatMap((d) =>
        (['morning', 'afternoon', 'evening'] as const).map((w) =>
          JSON.stringify(stockOf('corner', d, w)[0]!.offers[0]!.ware),
        ),
      ),
    );
    expect(specials.size).toBeGreaterThan(10);
  });

  it("puts out Cobweb Corner's market table on market day, and only then", () => {
    const table = (day: string) => stockOf('corner', day).find((s) => s.name === 'Market table');
    expect(table('2026-10-03')?.offers).toHaveLength(3);
    expect(table('2026-10-10')).toBeUndefined();
    expect(YEAR.filter((day) => table(day) !== undefined)).toHaveLength(12);
  });

  it('deals each shelf the number it asks for, with nothing twice', () => {
    for (const shop of SHOP_IDS) {
      for (const day of YEAR.slice(0, 30)) {
        stockOf(shop, day).forEach((shelf) => {
          const row = SHOPS[shop].shelves.find(
            (r) => r.name.replace('{window}', 'morning') === shelf.name,
          )!;
          const want = row.picks.reduce((n, p) => n + p.count, 0);
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
      // Market day's table is out twelve days a year: a later test sees to it.
      for (const shelf of SHOPS[shop].shelves.filter((row) => !row.on)) {
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

  it("sells every recipe card, the stove's on a shelf of their own", () => {
    const cards = (shelf: string) =>
      SHOPS.corner.shelves
        .filter((s) => s.name === shelf)
        .flatMap((s) => s.picks.flatMap((p) => p.from))
        .flatMap((w) => ('recipe' in w ? [w.recipe] : []));
    for (const [id, row] of Object.entries(RECIPES)) {
      if (row.card === undefined) continue;
      expect(cards(row.at === 'stove' ? 'Cookbook' : 'Crafting'), id).toContain(id);
    }
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
    // What her neighbours give her, by letter or from their houses, no shop sells either.
    const given = new Set(
      [
        ...[...keepsakes().keys()].map((furniture) => ({ furniture })),
        ...Object.values(VILLAGERS).flatMap((v) => v.rewards.map((r) => r.gift)),
        ...Object.values(SPECIAL_LETTERS).flatMap((l) => (l.gift ? [l.gift] : [])),
        ...Object.values(HOLIDAY_LETTERS).flatMap((l) => (l.gift ? [l.gift] : [])),
        ...MUSEUM_LETTERS.map((l) => l.gift),
      ].flatMap((w) => ('furniture' in w ? [w.furniture] : [])),
    );
    for (const id of Object.keys(FURNITURE) as FurnitureId[]) {
      const hers = ['mysteryCorkboard', 'workbench', 'stove', 'floralLamp'].includes(id);
      expect(sold.has(id), id).toBe(!hers && !made.has(id) && !given.has(id));
      expect(FURNITURE[id].price !== undefined, id).toBe(sold.has(id));
    }
    expect(priceOf({ furniture: 'marbleRun' })).toBe(FURNITURE.marbleRun.price);
  });

  it('has furniture at Cobweb Corner, and a wallpaper and a flooring she does not have yet', () => {
    for (const day of YEAR.slice(0, 30)) {
      const today = stockOf('corner', day)
        .filter((shelf) => !shelf.name.endsWith('special') && shelf.name !== 'Market table')
        .flatMap((shelf) => shelf.offers.map((o) => o.ware));
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
  it("takes everything but purse butter, Fibi's bones and her keepsakes", () => {
    const kept: string[] = ['purseButter', 'fibisBone', 'iceSkates', 'castleKey', 'hallKey'];
    for (const id of Object.keys(ITEMS) as ItemId[]) {
      expect(canSell(id), id).toBe(!kept.includes(id));
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

  it('is in town every day of the Halloween Festival, with its Halloween shelf out', () => {
    for (let date = 1; date <= 31; date++) {
      const at = new Date(2026, 9, date, 12).getTime();
      expect(popUpLot(lots, at), `10-${date}`).not.toBeNull();
      const shelves = stockOf('popUp', dayKey(at));
      const halloween = shelves.find((s) => s.name === 'Halloween');
      expect(halloween?.offers.length).toBe(4);
      for (const { ware } of halloween!.offers) expect('outfit' in ware).toBe(true);
    }
    const november = dayKey(new Date(2026, 10, 1, 12).getTime());
    expect(stockOf('popUp', november).some((s) => s.name === 'Halloween')).toBe(false);
  });
});
