import { ITEMS } from '../../data/items';
import type { VisitGift } from '../../data/visits';
import { dayKey } from '../../systems/clock';
import { greetingFor, type Greeting } from '../../systems/greetings';
import { giftFor } from '../../systems/visits';
import type { Bag } from '../Bag';
import type { WorldContext } from '../context';
import type { Belongings } from './Belongings';
import type { Wallet } from './Wallet';

/** How many days she has visited, and the last. */
export interface VisitsSnapshot {
  count: number;
  /** The day key of her last visit; empty before the first. */
  last: string;
}

/** A visit counted, and the gift it brought. */
export interface Visit {
  count: number;
  gift: VisitGift;
}

/** What opening the game brings: Cody's greeting, and today's visit if it's her first today. */
export interface Welcome {
  greeting: Greeting;
  visit: Visit | null;
}

/** What a visit's gift goes into, and her name for the greeting. */
export interface VisitKeeps {
  bag: Bag;
  wallet: Wallet;
  belongings: Belongings;
  name: () => string;
}

/**
 * Her visits (phase O): each day she opens the game counts one, and brings a gift (decisions.md
 * 115). They only ever count up, so a day away is never a streak lost. The first visit of the
 * game's opening is counted by `welcome`, with Cody's greeting (decisions.md 114); a day that
 * turns while she plays is counted by `check`, with a `visit` moment.
 */
export class Visits {
  private readonly ctx: WorldContext;
  private readonly keeps: VisitKeeps;
  private visits: VisitsSnapshot;
  /** Whether she has been welcomed yet this time the game is open; only then do days count on. */
  private welcomed = false;

  constructor(ctx: WorldContext, keeps: VisitKeeps, saved?: Partial<VisitsSnapshot>) {
    this.ctx = ctx;
    this.keeps = keeps;
    const count = saved?.count;
    this.visits = {
      count: Number.isInteger(count) && count! >= 0 ? count! : 0,
      last: typeof saved?.last === 'string' ? saved.last : '',
    };
  }

  get count(): number {
    return this.visits.count;
  }

  /**
   * She has opened the game: Cody's greeting, and today's visit and its gift if this is the first
   * today. `lastPlayedAt` is null for a brand-new game.
   */
  welcome(lastPlayedAt: number | null): Welcome {
    this.welcomed = true;
    const greeting = greetingFor(this.ctx.clock.now(), lastPlayedAt, this.keeps.name());
    return { greeting, visit: this.countToday() };
  }

  /** A new day while she plays is a visit too, told with a `visit` moment. */
  check(): void {
    if (!this.welcomed) return;
    const visit = this.countToday();
    if (visit) this.ctx.moments.push({ kind: 'visit', ...visit });
  }

  snapshot(): { visits: VisitsSnapshot } {
    return { visits: { ...this.visits } };
  }

  /** Counts today's visit and gives its gift, unless today is counted already. */
  private countToday(): Visit | null {
    const today = dayKey(this.ctx.clock.now());
    if (this.visits.last === today) return null;
    const count = this.visits.count + 1;
    this.visits = { count, last: today };
    const gift = giftFor(count);
    this.give(gift);
    return { count, gift };
  }

  private give(gift: VisitGift): void {
    const { bag, wallet, belongings } = this.keeps;
    if ('candy' in gift) wallet.earn(gift.candy);
    else if ('furniture' in gift) belongings.receive(gift);
    else if (gift.item in ITEMS) {
      bag.add(gift.item, gift.count);
      this.ctx.events.emit('bag', bag.contents);
    }
  }
}
