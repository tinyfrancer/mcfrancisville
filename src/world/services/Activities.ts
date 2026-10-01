import {
  ACTIVITIES,
  AGATHA_READS,
  BALL_READS,
  type ActivityId,
  type Game,
} from '../../data/activities';
import { CRITTERS } from '../../data/critters';
import type { Weather } from '../../data/weather';
import { ZONES } from '../../data/zones';
import {
  activityAt,
  closedLine,
  fortuneOn,
  glintOf,
  isOpen,
  lands,
  luckyCritter,
  prizeOf,
  whenOut,
} from '../../systems/activities';
import { dayKey, hourOf, windowOf } from '../../systems/clock';
import { fill } from '../../systems/friendship';
import { snackOn } from '../../systems/gathering';
import { priceOf } from '../../systems/shop';
import type { CritterId, FixtureId, ItemId, PropId, ZoneId } from '../../types/ids';
import type { Bag } from '../Bag';
import type { WorldContext } from '../context';
import type { Takings } from './Takings';
import type { Wallet } from './Wallet';

/** Kept in `Takings`, once a day. */
export const FORTUNE_KEY = 'fortune:read';

/** What the fairground reads of the rest of the world. */
export interface ActivitiesReads {
  /** Her name, for Agatha. */
  name: () => string;
  weather: () => Weather;
  /** Where Agatha is: behind her crystal ball, or not. */
  agathaAt: () => ZoneId;
  /** Whether she has ever caught a critter, so the fortune can point her to a new one. */
  caught: (id: CritterId) => boolean;
}

/** A go at a game, as it stands: what each throw did, and the target glinting for the next. */
export interface Round {
  activity: ActivityId;
  throws: readonly { target: number; landed: boolean }[];
  /** The target glinting for the next throw; null once every throw is thrown. */
  glint: number | null;
}

/** A go done: what each throw did, how many landed, and the prize. */
export interface Won {
  item: ItemId;
  landed: number;
  top: boolean;
  candy: number;
}

/** Her fortune, read. */
export interface Reading {
  /** Who reads it: Agatha, or the ball by itself. */
  reader: 'agatha' | 'ball';
  opening: string;
  line: string;
  lucky: { critter: CritterId; line: string } | null;
}

/** A snack on a stall, and its price. */
export interface OnStall {
  item: ItemId;
  price: number;
}

const gameOf = (id: ActivityId): Game['game'] | null => {
  const does = ACTIVITIES[id].does;
  return 'game' in does ? does.game : null;
};

/**
 * The Hollow Fairground's activities (0.2's M2, decision 201): its games of taps, the fortune
 * tent and its snack stalls, each a row in `data/activities.ts`. A go at a game is paid for as it
 * ends, with its prize, so a go left half thrown costs nothing; nothing about one is saved.
 */
export class Activities {
  private readonly ctx: WorldContext;
  private readonly keeps: { bag: Bag; wallet: Wallet; takings: Takings };
  private readonly reads: ActivitiesReads;
  private going: { activity: ActivityId; seed: string; throws: Round['throws'][number][] } | null =
    null;

  constructor(
    ctx: WorldContext,
    keeps: { bag: Bag; wallet: Wallet; takings: Takings },
    reads: ActivitiesReads,
  ) {
    this.ctx = ctx;
    this.keeps = keeps;
    this.reads = reads;
  }

  /** The activity she has walked up to, if any: a stall, or the fortune table. */
  at(arrived: { at?: PropId; fixture?: FixtureId }): ActivityId | null {
    if (arrived.at) return activityAt({ prop: arrived.at });
    if (arrived.fixture) return activityAt({ fixture: arrived.fixture });
    return null;
  }

  isOpen(id: ActivityId): boolean {
    const now = this.ctx.clock.now();
    return isOpen(ACTIVITIES[id].hours, dayKey(now), windowOf(now));
  }

  /** What a shut one says, with when it opens. */
  closed(id: ActivityId): string {
    const now = this.ctx.clock.now();
    return closedLine(id, dayKey(now), windowOf(now));
  }

  /** The go at a game she's on, if she's on one there. */
  round(id: ActivityId): Round | null {
    const going = this.going;
    const game = gameOf(id);
    if (!going || going.activity !== id || !game) return null;
    const next = going.throws.length;
    return {
      activity: id,
      throws: [...going.throws],
      glint: next < game.throws ? glintOf(game, going.seed, next) : null,
    };
  }

  /** Starts a go at a game, if it's open and she has the Candy for it; one already going goes on. */
  start(id: ActivityId): Round | null {
    const game = gameOf(id);
    if (!game || !this.isOpen(id)) return null;
    if (this.keeps.wallet.candy < ACTIVITIES[id].cost) return null;
    if (this.going?.activity !== id) {
      this.going = { activity: id, seed: String(this.ctx.clock.now()), throws: [] };
    }
    return this.round(id);
  }

  /**
   * A throw at a target in the go she's on. The last throw ends the go: the Candy is paid, and
   * the prize for how many landed goes into her bag.
   */
  toss(id: ActivityId, target: number): { landed: boolean; won: Won | null } | null {
    const game = gameOf(id);
    const going = this.going;
    if (!game || !going || going.activity !== id) return null;
    if (target < 0 || target >= game.targets) return null;
    const landed = lands(game, going.seed, going.throws.length, target);
    going.throws.push({ target, landed });
    this.ctx.moments.push({ kind: 'tossed', activity: id, landed });
    if (going.throws.length < game.throws) return { landed, won: null };
    this.going = null;
    return { landed, won: this.award(id, game, going.throws.filter((t) => t.landed).length) };
  }

  private award(id: ActivityId, game: Game['game'], landed: number): Won {
    const { bag, wallet } = this.keeps;
    const candy = ACTIVITIES[id].cost;
    const item = prizeOf(game, landed);
    const top = landed >= game.prizes.length - 1;
    wallet.spend(candy);
    bag.add(item, 1);
    this.ctx.events.emit('bag', bag.contents);
    this.ctx.moments.push({ kind: 'won', activity: id, item, landed, top });
    return { item, landed, top, candy };
  }

  /** Whether she has had her fortune read today; reading it again is free. */
  get readToday(): boolean {
    return !this.keeps.takings.isReady(FORTUNE_KEY);
  }

  /**
   * Reads her fortune: the day's line and a critter to look for, in Agatha's voice when she's
   * behind the ball. The first reading of a day costs a little Candy; null if the tent's shut or
   * she hasn't the Candy.
   */
  readFortune(): Reading | null {
    if (!this.isOpen('fortune')) return null;
    const { takings, wallet } = this.keeps;
    if (!this.readToday) {
      if (!wallet.spend(ACTIVITIES.fortune.cost)) return null;
      takings.take(FORTUNE_KEY);
      this.ctx.moments.push({ kind: 'readFortune' });
    }
    return this.reading();
  }

  private reading(): Reading {
    const now = this.ctx.clock.now();
    const day = dayKey(now);
    const hour = hourOf(now);
    const agatha = this.reads.agathaAt() === 'fortuneTent';
    const lucky = luckyCritter(day, hour, this.reads.weather(), this.reads.caught);
    return {
      reader: agatha ? 'agatha' : 'ball',
      opening: agatha ? fill(AGATHA_READS, { name: this.reads.name() }) : BALL_READS,
      line: fortuneOn(day),
      lucky: lucky && {
        critter: lucky.critter,
        line: `Lucky critter: a ${CRITTERS[lucky.critter].name}, ${whenOut(lucky, hour)}, in ${ZONES[lucky.where].name}.`,
      },
    };
  }

  /** What a snack stall has out today, at Cobweb Corner's prices for a thing for her bag. */
  menu(id: ActivityId): OnStall[] {
    const does = ACTIVITIES[id].does;
    if (!('sells' in does)) return [];
    const items = [...does.sells];
    if (does.tonight) {
      const tonight = snackOn(dayKey(this.ctx.clock.now()));
      if (!items.includes(tonight)) items.push(tonight);
    }
    return items.map((item) => ({ item, price: priceOf({ item }) }));
  }

  /** Buys a snack from a stall, if it's open, has it, and she has the Candy. */
  buy(id: ActivityId, item: ItemId): boolean {
    if (!this.isOpen(id)) return false;
    const on = this.menu(id).find((s) => s.item === item);
    const { bag, wallet } = this.keeps;
    if (!on || !wallet.spend(on.price)) return false;
    bag.add(item, 1);
    this.ctx.events.emit('bag', bag.contents);
    this.ctx.moments.push({ kind: 'snackBought', activity: id, item, price: on.price });
    return true;
  }
}
