import type { Ware } from '../../data/shop';
import {
  deliveryLetterId,
  isDeliveryLetter,
  isDue,
  keyOf,
  wareOf,
  type Order,
} from '../../systems/catalogue';
import { dayKey } from '../../systems/clock';
import type { WorldContext } from '../context';
import type { Mailbox } from './Mailbox';

/** What of the deliveries is saved: the orders on their way (0.3's S1). */
export interface OrdersSnapshot {
  orders: Order[];
}

/**
 * Ollie's deliveries (0.3's S1): an order goes on his round, and comes the next morning (from 5am,
 * by the day key) in her mailbox, a letter from him with the thing in it. Whatever is sent this way
 * (the catalogue's orders, and S2's from Gourdon's book) comes the same way, paid for already.
 */
export class Deliveries {
  private readonly ctx: WorldContext;
  private readonly mailbox: Mailbox;
  private readonly orders: Order[] = [];
  /** The last day the round was looked for, so it's looked for once a day and as she orders. */
  private checkedOn: string | null = null;

  constructor(ctx: WorldContext, mailbox: Mailbox, saved: readonly Order[] = []) {
    this.ctx = ctx;
    this.mailbox = mailbox;
    for (const o of saved) {
      if (typeof o?.on === 'string' && typeof o.ware === 'string' && wareOf(o.ware)) {
        this.orders.push({ ware: o.ware, on: o.on });
      }
    }
  }

  /** Puts something on tomorrow morning's round. */
  send(ware: Ware): void {
    this.orders.push({ ware: keyOf(ware), on: dayKey(this.ctx.clock.now()) });
    this.ctx.events.emit('orders', this.onTheWay());
  }

  /** What's on its way, oldest first. */
  onTheWay(): Ware[] {
    return this.orders.map((o) => wareOf(o.ware)!);
  }

  /** Posts every order that has come by this morning, a letter each, once a day. */
  check(): void {
    const today = dayKey(this.ctx.clock.now());
    if (today === this.checkedOn || this.orders.length === 0) return;
    this.checkedOn = today;
    const due = this.orders.filter((o) => isDue(o, today));
    if (due.length === 0) return;
    let n = this.mailbox.letters.all.filter((m) => isDeliveryLetter(m.id)).length;
    for (const order of due) {
      const ware = wareOf(order.ware)!;
      this.mailbox.post(deliveryLetterId(ware, n++), today, true);
      this.orders.splice(this.orders.indexOf(order), 1);
    }
    this.ctx.moments.push({ kind: 'delivered', wares: due.map((o) => wareOf(o.ware)!) });
    this.ctx.events.emit('orders', this.onTheWay());
  }

  snapshot(): OrdersSnapshot {
    return { orders: this.orders.map((o) => ({ ...o })) };
  }
}
