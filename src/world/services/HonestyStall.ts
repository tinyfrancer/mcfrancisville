import { ITEMS } from '../../data/items';
import { windowKey } from '../../systems/clock';
import {
  emptyStall,
  settleStall,
  stallTakes,
  stockStall,
  stallCount,
  type StallSnapshot,
  type StallStack,
} from '../../systems/passive';
import type { ItemId } from '../../types/ids';
import type { Bag } from '../Bag';
import type { WorldContext } from '../context';
import type { WorldEvent } from '../events';
import type { Wallet } from './Wallet';

function isStacks(value: unknown): value is StallStack[] {
  return (
    Array.isArray(value) &&
    value.every(
      (s) =>
        typeof s === 'object' &&
        s !== null &&
        typeof s.id === 'string' &&
        Number.isInteger(s.count) &&
        s.count > 0,
    )
  );
}

/** A saved stall, less anything this build doesn't know; a bad one is an empty stall. */
function repaired(saved: Partial<StallSnapshot> | undefined, now: number): StallSnapshot {
  if (!saved) return emptyStall(now);
  const known = (stacks: unknown) =>
    isStacks(stacks) ? stacks.filter((s) => s.id in ITEMS).map((s) => ({ ...s })) : [];
  return {
    stock: known(saved.stock).filter((s) => stallTakes(s.id)),
    since: typeof saved.since === 'number' && Number.isFinite(saved.since) ? saved.since : now,
    sold: known(saved.sold),
    tin: Number.isInteger(saved.tin) && saved.tin! >= 0 ? saved.tin! : 0,
    shelves: saved.shelves === 1 ? 1 : 0,
  };
}

/**
 * The honesty stall at the farm gate (phase O, decisions.md 82): she leaves what she grows on it,
 * it sells a few things each window at the shop's price, and the Candy waits in its tin until she
 * next comes by. Its sales are worked out from when they last were, never ticked.
 */
export class HonestyStall {
  private readonly ctx: WorldContext;
  private readonly bag: Bag;
  private readonly wallet: Wallet;
  private stall: StallSnapshot;
  /** The window its sales were last worked out in, so a step only works them out once a window. */
  private settledIn = '';

  constructor(
    ctx: WorldContext,
    keeps: { bag: Bag; wallet: Wallet },
    saved?: Partial<StallSnapshot>,
  ) {
    this.ctx = ctx;
    this.bag = keeps.bag;
    this.wallet = keeps.wallet;
    this.stall = repaired(saved, ctx.clock.now());
  }

  /** The stall now: what's on it, what has sold since she last came by, and the tin. */
  view(): Readonly<StallSnapshot> {
    this.settle();
    return this.stall;
  }

  /** Whether anything is out on it, for the view. */
  get stocked(): boolean {
    return this.view().stock.length > 0;
  }

  /** Works the sales out when a window turns while she plays, so the stall empties as it sells. */
  check(): void {
    if (windowKey(this.ctx.clock.now()) !== this.settledIn) this.settle();
  }

  /** She came by: the tin into her Candy, and what sold. Null if nothing has. */
  collect(): WorldEvent | null {
    const { sold, tin } = this.view();
    if (sold.length === 0) return null;
    this.stall = { ...this.stall, sold: [], tin: 0 };
    this.wallet.earn(tin);
    this.emit();
    return { kind: 'stallSold', sold: sold.map((s) => ({ ...s })), candy: tin };
  }

  /** Leaves `count` of something from her bag on it, as many as fit; how many went. */
  leave(item: ItemId, count: number): number {
    this.settle();
    const have = Math.min(count, this.bag.spare(item));
    const before = stallCount(this.stall.stock);
    this.stall = stockStall(this.stall, item, have);
    const left = stallCount(this.stall.stock) - before;
    if (left > 0) {
      this.bag.remove(item, left);
      this.ctx.events.emit('bag', this.bag.contents);
      this.emit();
    }
    return left;
  }

  /** How many shelves she has built onto it (0.2's E1): one at most. */
  get shelves(): number {
    return this.stall.shelves;
  }

  /** Builds its second shelf on, from her workbench. */
  addShelf(): void {
    this.settle();
    this.stall = { ...this.stall, shelves: 1 };
    this.emit();
  }

  /** Takes everything of one kind back off it, into her bag; how many. */
  takeBack(item: ItemId): number {
    this.settle();
    const stack = this.stall.stock.find((s) => s.id === item);
    if (!stack) return 0;
    this.stall = { ...this.stall, stock: this.stall.stock.filter((s) => s !== stack) };
    this.bag.add(item, stack.count);
    this.ctx.events.emit('bag', this.bag.contents);
    this.emit();
    return stack.count;
  }

  snapshot(): { stall: StallSnapshot } {
    const { stock, since, sold, tin, shelves } = this.view();
    return {
      stall: {
        stock: stock.map((s) => ({ ...s })),
        since,
        sold: sold.map((s) => ({ ...s })),
        tin,
        shelves,
      },
    };
  }

  private settle(): void {
    const now = this.ctx.clock.now();
    const before = stallCount(this.stall.stock);
    this.stall = settleStall(this.stall, now);
    this.settledIn = windowKey(now);
    if (stallCount(this.stall.stock) !== before) this.emit();
  }

  private emit(): void {
    this.ctx.events.emit('stall', this.stall);
  }
}
