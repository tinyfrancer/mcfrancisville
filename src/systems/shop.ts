import { FLOORINGS, FURNITURE, WALLPAPERS } from '../data/furniture';
import { RECIPES } from '../data/recipes';
import { ITEM_VALUE, OUTFIT_PRICE, POP_UP_DAYS_IN_SEVEN, SHOPS, type Ware } from '../data/shop';
import type { ItemId, ShopId } from '../types/ids';
import { dayKey } from './clock';
import { hashString } from './gathering';
import type { Tile } from './pathfinding';

/** One thing on a shelf today, and what it costs. */
export interface Offer {
  ware: Ware;
  price: number;
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
 * clothes, furniture, wallpaper, flooring and recipe cards.
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

/** A small seeded generator (mulberry32): the same seed always deals the same shelf. */
function seeded(seed: number): () => number {
  let a = seed >>> 0;
  return () => {
    a = (a + 0x6d2b79f5) >>> 0;
    let t = a;
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
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
 * What a shop has on its shelves on `day` (a day key): the same all day, and new at 5am. Nothing
 * is saved: each shelf is dealt from its pool by a hash of the shop, the shelf and the day
 * (decisions.md 42).
 */
export function stockOf(shop: ShopId, day: string): Shelf[] {
  return SHOPS[shop].shelves.map((shelf, s) => ({
    name: shelf.name,
    offers: shelf.picks.flatMap((pick, p) =>
      pickSome(pick.from, pick.count, `${shop}:${s}:${p}:${day}`).map((ware) => ({
        ware,
        price: priceOf(ware),
      })),
    ),
  }));
}

/**
 * Where the pop-up shop stands today, by the top-left of its footprint, or null on a day it isn't
 * in town (decisions.md 44). Like the night's snack, it's read from the day key, so it's the same
 * all day with nothing saved.
 */
export function popUpLot(lots: readonly Tile[], now: number): Tile | null {
  if (lots.length === 0) return null;
  const h = hashString(`popUp:${dayKey(now)}`);
  if (h % 7 >= POP_UP_DAYS_IN_SEVEN) return null;
  return lots[(h >>> 8) % lots.length]!;
}
