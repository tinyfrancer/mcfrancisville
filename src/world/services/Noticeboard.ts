import type { FestivalId } from '../../data/calendar';
import { NOTICE_POINTS } from '../../data/notices';
import { dayKey, hourOf, windowKey, windowOf } from '../../systems/clock';
import { noticeCandy, noticeKey, noticesIn, postersOn, type Poster } from '../../systems/notices';
import type { ItemId, VillagerId } from '../../types/ids';
import type { Bag } from '../Bag';
import type { WorldContext } from '../context';
import type { WorldEvent } from '../events';
import type { Takings } from './Takings';
import type { Wallet } from './Wallet';

/** A note on the board as she sees it: who, what, what it brings, and whether it's done. */
export interface Notice {
  slot: number;
  from: VillagerId;
  item: ItemId;
  count: number;
  /** In their words, with `{what}` still to fill. */
  note: string;
  candy: number;
  /** She has answered it this window. */
  done: boolean;
  /** The festival it's pinned up for, if it is. */
  during?: FestivalId;
}

/** What answering a note reaches into. */
export interface NoticeboardKeeps {
  bag: Bag;
  wallet: Wallet;
  takings: Takings;
  /** A little more friendship with whoever pinned it. */
  thank: (villager: VillagerId, points: number) => void;
}

/**
 * The noticeboard by the square (phase N): three notes from her neighbours each window, and
 * answering one with what it asks for, for Candy and a little friendship. An answered note is
 * kept in `Takings` for the window, so nothing new is saved.
 */
export class Noticeboard {
  private readonly ctx: WorldContext;
  private readonly keeps: NoticeboardKeeps;

  constructor(ctx: WorldContext, keeps: NoticeboardKeeps) {
    this.ctx = ctx;
    this.keeps = keeps;
  }

  notices(): Notice[] {
    const now = this.ctx.clock.now();
    return noticesIn(windowKey(now), windowOf(now)).map(({ slot, row }) => ({
      slot,
      from: row.from,
      item: row.item,
      count: row.count,
      note: row.note,
      candy: noticeCandy(row),
      done: !this.keeps.takings.isReady(noticeKey(slot)),
      ...(row.during ? { during: row.during } : {}),
    }));
  }

  /** The day's events, pinned up with where to go for each (0.2's M3). */
  posters(): Poster[] {
    const now = this.ctx.clock.now();
    return postersOn(dayKey(now), hourOf(now));
  }

  /**
   * Hands over what a note asks for, and takes it down: Candy, and a little friendship with who
   * pinned it. Null if it's done already or she hasn't enough.
   */
  answer(slot: number): WorldEvent | null {
    const notice = this.notices().find((n) => n.slot === slot);
    const { bag, wallet, takings, thank } = this.keeps;
    if (!notice || notice.done || !bag.remove(notice.item, notice.count)) return null;
    takings.take(noticeKey(slot));
    this.ctx.events.emit('bag', bag.contents);
    wallet.earn(notice.candy);
    thank(notice.from, NOTICE_POINTS);
    return {
      kind: 'answered',
      from: notice.from,
      item: notice.item,
      count: notice.count,
      candy: notice.candy,
    };
  }
}
