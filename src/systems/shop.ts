import { FLOORINGS, FURNITURE, WALLPAPERS } from '../data/furniture';
import { ACCESSORIES } from '../data/pets';
import { RECIPES } from '../data/recipes';
import {
  ITEM_VALUE,
  MOON_PIE_DAYS_IN_SEVEN,
  OUTFIT_PRICE,
  POP_UP_DAYS_IN_SEVEN,
  POP_UP_SEASON,
  SHOPS,
  type Ware,
} from '../data/shop';
import type { ItemId, ShopId } from '../types/ids';
import { festivalsOn, isHappening } from './calendar';
import { dayKey, type DayWindow } from './clock';
import { hashString, seeded } from './random';
import type { Tile } from './pathfinding';

/** One thing on a shelf today, and what it costs. */
export interface Offer {
  ware: Ware;
  price: number;
  /** What it usually costs, when it's a special. */
  was?: number;
}

export interface Shelf {
  name: string;
  offers: Offer[];
}

/** What the shops pay for one; nothing for what they won't take. */
export function sellValue(item: ItemId): number {
  return ITEM_VALUE[item];
}

export function canSell(item: ItemId): boolean {
  return sellValue(item) > 0;
}

/**
 * What a ware costs: twice what the shop would pay for a thing for her bag, and its own price for
 * clothes, furniture, wallpaper, flooring, recipe cards and pets' accessories.
 */
export function priceOf(ware: Ware): number {
  if ('item' in ware) return ITEM_VALUE[ware.item] * 2;
  if ('furniture' in ware) {
    const price = FURNITURE[ware.furniture].price;
    if (price === undefined) throw new Error(`${ware.furniture} isn't sold`);
    return price;
  }
  if ('wallpaper' in ware) return WALLPAPERS[ware.wallpaper].price;
  if ('flooring' in ware) return FLOORINGS[ware.flooring].price;
  if ('recipe' in ware) {
    const card = RECIPES[ware.recipe].card;
    if (card === undefined) throw new Error(`${ware.recipe} has no card`);
    return card;
  }
  if ('accessory' in ware) {
    const price = ACCESSORIES[ware.accessory].price;
    if (price === undefined) throw new Error(`${ware.accessory} isn't sold`);
    return price;
  }
  const price = OUTFIT_PRICE[ware.outfit];
  if (price === undefined) throw new Error(`no price for ${ware.outfit}`);
  return price;
}

/** A ware as its kind and id, such as `['furniture', 'cauldron']`. */
export function wareKey(ware: Ware): [kind: string, id: string] {
  return Object.entries(ware)[0] as [string, string];
}

export function sameWare(a: Ware, b: Ware): boolean {
  const [kind, id] = wareKey(a);
  const [otherKind, otherId] = wareKey(b);
  return kind === otherKind && id === otherId;
}

function pickSome<T>(from: readonly T[], count: number, seed: string): T[] {
  const random = seeded(hashString(seed));
  const deck = [...from];
  for (let i = deck.length - 1; i > 0; i--) {
    const j = Math.floor(random() * (i + 1));
    [deck[i], deck[j]] = [deck[j]!, deck[i]!];
  }
  return deck.slice(0, count);
}

/**
 * What a shop has on its shelves on `day` (a day key) in a window: the same all day, and new at
 * 5am, but for a shelf dealt each window, new at noon and 6pm too, and a shelf put out only on a
 * town event's days. Nothing is saved: each shelf is
 * dealt from its pool by a hash of the shop, the shelf and the day or window (decisions.md 42, 81).
 */
export function stockOf(shop: ShopId, day: string, window: DayWindow = 'morning'): Shelf[] {
  const shelves = SHOPS[shop].shelves.map((shelf, s) => ({ shelf, s }));
  return shelves.flatMap(({ shelf, s }) => {
    if (shelf.on && !isHappening(shelf.on, day)) return [];
    const when = shelf.everyWindow ? `${day}@${window}` : day;
    const shown: Shelf = {
      name: shelf.name.replace('{window}', window),
      offers: shelf.picks.flatMap((pick, p) =>
        pickSome(pick.from, pick.count, `${shop}:${s}:${p}:${when}`).map((ware) => {
          const price = priceOf(ware);
          if (!shelf.off) return { ware, price };
          return { ware, price: Math.max(1, Math.round(price * (1 - shelf.off))), was: price };
        }),
      ),
    };
    return [shown];
  });
}

/**
 * Where the pop-up shop stands today, by the top-left of its footprint, or null on a day it isn't
 * in town (decisions.md 44); every day of its season, the Halloween Festival. Like the night's snack, it's read from the day key, so it's the same
 * all day with nothing saved.
 */
export function popUpLot(lots: readonly Tile[], now: number): Tile | null {
  if (lots.length === 0) return null;
  const day = dayKey(now);
  const h = hashString(`popUp:${day}`);
  if (h % 7 >= POP_UP_DAYS_IN_SEVEN && !festivalsOn(day).includes(POP_UP_SEASON)) return null;
  return lots[(h >>> 8) % lots.length]!;
}

/**
 * Where the Moon Pie Man has set up his cart today, by the top-left of its footprint, or null on a
 * day he isn't about. Like the pop-up, it's read from the day key, but with a hash of its own, so
 * the two turn up independently.
 */
export function peddlerSpot(spots: readonly Tile[], now: number): Tile | null {
  if (spots.length === 0) return null;
  const h = hashString(`moonPie:${dayKey(now)}`);
  if (h % 7 >= MOON_PIE_DAYS_IN_SEVEN) return null;
  return spots[(h >>> 8) % spots.length]!;
}
