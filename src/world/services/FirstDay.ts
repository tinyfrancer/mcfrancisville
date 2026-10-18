import { FIRST_DAY, FIRST_DAY_IDS, FIRST_DAY_STEPS } from '../../data/firstDay';
import { ITEMS } from '../../data/items';
import type { VisitGift } from '../../data/visits';
import { allDone, newlyDone, progressOf, type FirstDayFacts } from '../../systems/firstDay';
import type { FirstDayStepId } from '../../types/ids';
import type { Bag } from '../Bag';
import type { WorldContext } from '../context';
import type { WorldEvent } from '../events';
import type { Belongings } from './Belongings';
import type { Wallet } from './Wallet';

/**
 * What of her first day is kept (save v50): the steps done, and whether it's over. An old save's
 * is over from the start: she knows her way round already.
 */
export interface FirstDaySnapshot {
  done: FirstDayStepId[];
  over: boolean;
}

/** What doing a step gives into. */
export interface FirstDayKeeps {
  bag: Bag;
  wallet: Wallet;
  belongings: Belongings;
}

/** What the thread reads of the town. */
export interface FirstDayReads {
  /** What the town keeps that the steps are worked out from. */
  facts: () => FirstDayFacts;
  /** Whether her first day has begun: her look made, and Cody's welcome said. */
  begun: () => boolean;
}

/** A step as the card shows it. */
export interface FirstDayStepView {
  id: FirstDayStepId;
  done: boolean;
  have: number;
  need: number;
}

function repaired(saved: Partial<FirstDaySnapshot> | undefined): FirstDaySnapshot {
  const ids: readonly string[] = FIRST_DAY_IDS;
  const done = Array.isArray(saved?.done)
    ? FIRST_DAY_IDS.filter((id) => saved.done!.includes(id) && ids.includes(id))
    : [];
  return { done, over: saved?.over === true || allDone(done) };
}

/**
 * Cody's thread over her first day (V1's R1, decision 311). Each step is worked out from what the
 * town already keeps, re-read when something happens, so she can do them in any order, before
 * she has looked or after; as one is done it's kept, its gift given and a `firstDay` moment told,
 * and with the last his keepsake goes in her storage chest. Nothing waits on it.
 */
export class FirstDay {
  private readonly ctx: WorldContext;
  private readonly keeps: FirstDayKeeps;
  private readonly reads: FirstDayReads;
  private state: FirstDaySnapshot;
  /** Something changed since the facts were last read. */
  private dirty = true;

  constructor(
    ctx: WorldContext,
    keeps: FirstDayKeeps,
    reads: FirstDayReads,
    saved?: Partial<FirstDaySnapshot>,
  ) {
    this.ctx = ctx;
    this.keeps = keeps;
    this.reads = reads;
    this.state = repaired(saved);
    const touched = () => (this.dirty = true);
    for (const key of ['bag', 'candy', 'friends', 'stall'] as const) ctx.events.on(key, touched);
  }

  /** Whether the thread is under way: her first day begun, and a step still to do. */
  get open(): boolean {
    return !this.state.over && this.reads.begun();
  }

  /** The steps done, in the card's order. */
  get done(): readonly FirstDayStepId[] {
    return this.state.done;
  }

  /** Every step, done or not, and how far along. */
  steps(): FirstDayStepView[] {
    const facts = this.reads.facts();
    return FIRST_DAY_IDS.map((id) => {
      const done = this.state.done.includes(id);
      const { have, need } = progressOf(id, facts);
      return { id, done, have: done ? need : have, need };
    });
  }

  /**
   * After a step of the world: if anything happened, the steps done now that weren't, each kept
   * with its gift and told; the last brings his keepsake.
   */
  saw(events: readonly WorldEvent[]): WorldEvent[] {
    if (!this.open || (!this.dirty && events.length === 0)) return [];
    this.dirty = false;
    const fresh = newlyDone(this.state.done, this.reads.facts());
    if (fresh.length === 0) return [];
    const told: WorldEvent[] = [];
    for (const step of fresh) {
      const { reward } = FIRST_DAY_STEPS[step];
      this.give(reward);
      const done = FIRST_DAY_IDS.filter((id) => id === step || this.done.includes(id));
      this.state = { ...this.state, done };
      told.push({ kind: 'firstDay', step, reward });
    }
    if (allDone(this.state.done)) {
      this.state = { ...this.state, over: true };
      const keepsake = FIRST_DAY.keepsake;
      this.give({ furniture: keepsake });
      const last = told[told.length - 1]!;
      if (last.kind === 'firstDay') last.keepsake = keepsake;
    }
    this.ctx.events.emit('firstDay', this.state.done);
    return told;
  }

  snapshot(): { firstDay: FirstDaySnapshot } {
    return { firstDay: { done: [...this.state.done], over: this.state.over } };
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
