import {
  CANDY_PER_WINDOW,
  SAPLING_DAYS,
  SAPLING_ONE_IN,
  SHELF_HOLDS,
  SHELF_SELLS_PER_WINDOW,
  STALL_HOLDS,
  STALL_SELLS_PER_WINDOW,
  STALL_WARES,
  TREE_FIRST_FILL,
  TREE_HOLDS,
  TREE_LOOK_FROM,
  type TreeLook,
} from '../data/passive';
import type { ItemId } from '../types/ids';
import { daysBetween } from './calendar';
import { dayKey, windowKey, windowsBetween } from './clock';
import { hashString } from './random';
import { sellValue } from './shop';

/**
 * The rules for passive Candy (decisions.md 82), worked out from when she last shook the tree or
 * saw the stall and the clock now, so nothing is ticked while the game is closed.
 */

/** How many windows' candy the tree holds now. Null is a tree nobody has shaken yet. */
export function treeWindows(shaken: number | null, now: number): number {
  if (shaken === null) return TREE_FIRST_FILL;
  return windowsBetween(shaken, now, TREE_HOLDS);
}

export function treeCandy(windows: number): number {
  return windows * CANDY_PER_WINDOW;
}

export function treeLook(windows: number): TreeLook {
  if (windows >= TREE_LOOK_FROM.laden) return 'laden';
  return windows >= TREE_LOOK_FROM.few ? 'few' : 'bare';
}

/**
 * Whether the candy tree drops a sapling as she shakes it now (0.2's E1): about one window in
 * `SAPLING_ONE_IN`, by a hash of the window, so shaking it twice in one window can't fish for one.
 */
export function dropsSapling(now: number): boolean {
  return hashString(`sapling:${windowKey(now)}`) % SAPLING_ONE_IN === 0;
}

/** How many more days a sapling planted at `planted` takes to be a tree; 0 once it is one. */
export function saplingDaysLeft(planted: number, now: number): number {
  return Math.max(0, SAPLING_DAYS - daysBetween(dayKey(planted), dayKey(now)));
}

/** One kind of thing on the stall, or sold from it. */
export interface StallStack {
  id: ItemId;
  count: number;
}

/**
 * The honesty stall as it's saved: what's on it (what she left longest ago first), when its sales
 * were last worked out, and what has sold since she last came by, with the Candy left in its tin,
 * and how many shelves she has built onto it (0.2's E1).
 */
export interface StallSnapshot {
  stock: StallStack[];
  since: number;
  sold: StallStack[];
  tin: number;
  shelves: number;
}

export function emptyStall(now: number): StallSnapshot {
  return { stock: [], since: now, sold: [], tin: 0, shelves: 0 };
}

/** How many things fit on a stall with so many shelves built on. */
export function stallHolds(shelves: number): number {
  return STALL_HOLDS + shelves * SHELF_HOLDS;
}

/** How many things a stall with so many shelves sells a window. */
export function stallSells(shelves: number): number {
  return STALL_SELLS_PER_WINDOW + shelves * SHELF_SELLS_PER_WINDOW;
}

export function stallTakes(item: ItemId): boolean {
  return STALL_WARES.includes(item);
}

export function stallCount(stacks: readonly StallStack[]): number {
  return stacks.reduce((n, s) => n + s.count, 0);
}

/** How many more of anything the stall has room for. */
export function stallRoom(stall: StallSnapshot): number {
  return Math.max(0, stallHolds(stall.shelves) - stallCount(stall.stock));
}

function addTo(stacks: StallStack[], id: ItemId, count: number): void {
  const stack = stacks.find((s) => s.id === id);
  if (stack) stack.count += count;
  else stacks.push({ id, count });
}

/**
 * The stall with its sales worked out to `now`: so many things a window since it was last worked
 * out, what she left longest ago first, each for what Cobweb Corner would pay, into its tin.
 */
export function settleStall(stall: StallSnapshot, now: number): StallSnapshot {
  const onIt = stallCount(stall.stock);
  const sells = stallSells(stall.shelves);
  const windows = windowsBetween(stall.since, now, Math.ceil(onIt / sells));
  let selling = Math.min(onIt, windows * sells);
  const stock = stall.stock.map((s) => ({ ...s }));
  const sold = stall.sold.map((s) => ({ ...s }));
  let tin = stall.tin;
  while (selling > 0 && stock.length > 0) {
    const first = stock[0]!;
    const n = Math.min(selling, first.count);
    first.count -= n;
    selling -= n;
    addTo(sold, first.id, n);
    tin += n * sellValue(first.id);
    if (first.count === 0) stock.shift();
  }
  return { ...stall, stock, since: Math.max(stall.since, now), sold, tin };
}

/** The stall with more of something left on it, as much as there's room for. */
export function stockStall(stall: StallSnapshot, id: ItemId, count: number): StallSnapshot {
  const n = Math.min(count, stallRoom(stall));
  if (n <= 0 || !stallTakes(id)) return stall;
  const stock = stall.stock.map((s) => ({ ...s }));
  addTo(stock, id, n);
  return { ...stall, stock };
}
