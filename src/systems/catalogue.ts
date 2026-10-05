import { DELIVERER, DELIVERY_LETTERS, type CatalogueGroup } from '../data/catalogue';
import { FLOORINGS, FURNITURE, WALLPAPERS } from '../data/furniture';
import { ITEMS } from '../data/items';
import { OUTFITS } from '../data/outfits';
import { ACCESSORIES } from '../data/pets';
import type { Ware } from '../data/shop';
import type {
  AccessoryId,
  FlooringId,
  FurnitureId,
  ItemId,
  OutfitId,
  VillagerId,
  WallpaperId,
} from '../types/ids';
import { hashString } from './random';
import { priceOf, wareKey } from './shop';

/**
 * Ollie's catalogue (0.3's S1): what she has ever had, kept as keys (`furniture:pumpkinChair`),
 * which of it can be ordered again and for what, and the letter an order comes in.
 */

/** The bag's things the catalogue lists: the ones she collects and might give away or sell. */
const BAG_KINDS = ['squishy', 'doll', 'record'] as const;

/** A ware as one string, as `ever` and an order keep it: `furniture:pumpkinChair`. */
export function keyOf(ware: Ware): string {
  return wareKey(ware).join(':');
}

const KNOWN: Record<string, (id: string) => Ware | null> = {
  item: (id) => (id in ITEMS ? { item: id as ItemId } : null),
  furniture: (id) => (id in FURNITURE ? { furniture: id as FurnitureId } : null),
  outfit: (id) => (id in OUTFITS ? { outfit: id as OutfitId } : null),
  wallpaper: (id) => (id in WALLPAPERS ? { wallpaper: id as WallpaperId } : null),
  flooring: (id) => (id in FLOORINGS ? { flooring: id as FlooringId } : null),
  accessory: (id) => (id in ACCESSORIES ? { accessory: id as AccessoryId } : null),
};

/** The ware a key names, or null for one this build doesn't know. */
export function wareOf(key: string): Ware | null {
  const at = key.indexOf(':');
  if (at < 0) return null;
  return KNOWN[key.slice(0, at)]?.(key.slice(at + 1)) ?? null;
}

/** Which of the catalogue's kinds a ware is, or null for one it doesn't list (a seed, a recipe). */
export function groupOf(ware: Ware): CatalogueGroup | null {
  if ('furniture' in ware) return 'furniture';
  if ('outfit' in ware) return 'clothes';
  if ('wallpaper' in ware || 'flooring' in ware) return 'surfaces';
  if ('accessory' in ware) return 'pets';
  if ('item' in ware) {
    const kind = ITEMS[ware.item].kind;
    return (BAG_KINDS as readonly string[]).includes(kind) ? (kind as CatalogueGroup) : null;
  }
  return null;
}

/**
 * What an order costs: the shelf's full price, never less, so the catalogue never undercuts a
 * shop. Null for what no shop sells (a gift, a keepsake, a made piece): a gift is one of a kind,
 * and what she makes she makes again at her workbench.
 */
export function orderPrice(ware: Ware): number | null {
  if (groupOf(ware) === null) return null;
  try {
    const price = priceOf(ware);
    return price > 0 ? price : null;
  } catch {
    return null;
  }
}

/** Everything she has, as plain lists, from which what she has ever had is seeded. */
export interface Owned {
  items: readonly string[];
  furniture: readonly string[];
  outfits: readonly string[];
  wallpapers: readonly string[];
  floorings: readonly string[];
  accessories: readonly string[];
}

/** The keys of everything she has that the catalogue lists, each once, in a steady order. */
export function everOf(owned: Owned): string[] {
  const keys = [
    ...owned.furniture.map((id) => `furniture:${id}`),
    ...owned.items.map((id) => `item:${id}`),
    ...owned.outfits.map((id) => `outfit:${id}`),
    ...owned.wallpapers.map((id) => `wallpaper:${id}`),
    ...owned.floorings.map((id) => `flooring:${id}`),
    ...owned.accessories.map((id) => `accessory:${id}`),
  ];
  return [
    ...new Set(
      keys.filter((key) => {
        const ware = wareOf(key);
        return ware !== null && groupOf(ware) !== null;
      }),
    ),
  ];
}

/** One order on its way: what, and the day (key) she ordered it. It comes the morning after. */
export interface Order {
  ware: string;
  on: string;
}

/** Whether an order placed on `on` has come by `today` (both day keys): any morning after. */
export function isDue(order: Order, today: string): boolean {
  return order.on < today;
}

const ORDER = 'order';

/** The letter an order comes in, by its ware and how many orders came before it. */
export function deliveryLetterId(ware: Ware, n: number): string {
  return `${ORDER}:${keyOf(ware)}:${n}`;
}

/** Whether a letter is one an order came in. */
export function isDeliveryLetter(id: string): boolean {
  return id.startsWith(`${ORDER}:`);
}

/** Ollie's letter for an order, with the thing in it; null for an id that isn't one this build knows. */
export function deliveryLetter(id: string): { from: VillagerId; text: string; gift: Ware } | null {
  if (!isDeliveryLetter(id)) return null;
  const rest = id.slice(ORDER.length + 1);
  const at = rest.lastIndexOf(':');
  const n = Number(rest.slice(at + 1));
  const ware = at > 0 && Number.isInteger(n) ? wareOf(rest.slice(0, at)) : null;
  const group = ware ? groupOf(ware) : null;
  if (!ware || !group) return null;
  const lines = DELIVERY_LETTERS[group];
  return { from: DELIVERER, text: lines[hashString(id) % lines.length]!, gift: ware };
}
