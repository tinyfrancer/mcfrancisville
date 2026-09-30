import { INTERIOR_IDS, INTERIORS } from '../../data/interiors';
import { BEST_SWEET } from '../../data/trickOrTreat';
import { dayKey } from '../../systems/clock';
import { sayTo } from '../../systems/friendship';
import { doorLine, isTrickOrTreat, knockKey, sweetAt } from '../../systems/trickOrTreat';
import type { InteriorId, VillagerId, ZoneId } from '../../types/ids';
import type { Bag } from '../Bag';
import type { WorldContext } from '../context';
import type { WorldEvent } from '../events';
import type { Takings } from './Takings';

/** What trick or treat reads of the rest of the world. */
export interface TrickOrTreatReads {
  /** Whether a neighbour lives in town today. */
  livesHere: (villager: VillagerId) => boolean;
  /** Whether something's on inside a place now, which she's asked in to rather than knocking. */
  hosting: (zone: ZoneId) => boolean;
  /** Whether a neighbour is in a place now: at home, to answer the door. */
  isIn: (villager: VillagerId, zone: ZoneId) => boolean;
  /** Her name, for what they say. */
  name: () => string;
}

/**
 * Trick or treat (0.2's J2, decision 144): on an evening of the Halloween Festival, walking up to
 * a neighbour's door is a knock, and gets her a sweet instead of going in, once a day a door. The
 * neighbour hands it over if they're home, or it's left in a bowl on the step. A second walk up
 * goes in as ever, and a door with a happening on inside is simply open.
 */
export class TrickOrTreat {
  private readonly ctx: WorldContext;
  private readonly bag: Bag;
  private readonly takings: Takings;
  private readonly reads: TrickOrTreatReads;

  constructor(ctx: WorldContext, keeps: { bag: Bag; takings: Takings }, reads: TrickOrTreatReads) {
    this.ctx = ctx;
    this.bag = keeps.bag;
    this.takings = keeps.takings;
    this.reads = reads;
  }

  /** Whose door leads into a place, if it's a neighbour's who lives here. */
  private ownerOf(to: ZoneId): VillagerId | null {
    const inside = (INTERIOR_IDS as readonly ZoneId[]).includes(to);
    const owner = inside ? INTERIORS[to as InteriorId].owner : undefined;
    return owner && this.reads.livesHere(owner) ? owner : null;
  }

  /** Whether a knock at the door into a place would get her a sweet now. */
  answers(to: ZoneId): boolean {
    const owner = this.ownerOf(to);
    return (
      owner !== null &&
      isTrickOrTreat(this.ctx.clock.now()) &&
      this.takings.isReady(knockKey(owner)) &&
      !this.reads.hosting(to)
    );
  }

  /** She has walked up to the door into a place: a sweet, if it's a trick-or-treat door tonight. */
  knock(to: ZoneId): WorldEvent | null {
    if (!this.answers(to)) return null;
    const villager = this.ownerOf(to)!;
    const day = dayKey(this.ctx.clock.now());
    const item = sweetAt(villager, day);
    const home = this.reads.isIn(villager, to);
    this.takings.take(knockKey(villager));
    this.bag.add(item, 1);
    this.ctx.events.emit('bag', this.bag.contents);
    if (item === BEST_SWEET) this.ctx.signals.emit('thrilled', { by: 'find' });
    const line = sayTo(doorLine(villager, item, home), this.reads.name(), day);
    return { kind: 'trickOrTreat', villager, item, home, line };
  }
}
