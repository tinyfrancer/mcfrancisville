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
  bestTapAfter,
  BETWEEN_THROWS_MS,
  closedLine,
  fairTipOn,
  fortuneOn,
  freeGoOn,
  isOpen,
  luckyCritter,
  patternOf,
  pointsOf,
  prizeOf,
  prizeRank,
  score,
  whenOut,
  type Grade,
  type Pattern,
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

/** The day's free go, taken (V1's R6b); `fortune:` keys come once a day. */
export const FREE_GO_KEY = 'fortune:freeGo';

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

/**
 * A throw thrown: how well it went, where it went, the pattern it was thrown at, when, and how far
 * into its sweep (so the stage can hold everything where it was).
 */
export interface Thrown {
  grade: Grade;
  at: number;
  pattern: Pattern;
  tappedAt: number;
  ms: number;
}

/**
 * A go at a game, as it stands (V1's R6b): each throw thrown, and the one under way, its moving
 * thing and when it began to move (null at the bell until she takes hold); null once all thrown.
 */
export interface Round {
  activity: ActivityId;
  throws: readonly Thrown[];
  next: { pattern: Pattern; startedAt: number | null } | null;
  /** Whether this go is the day's free one. */
  free: boolean;
}

/** A go done: how it went, the prize, and what it cost (nothing, the day's free go). */
export interface Won {
  item: ItemId;
  /** How many throws were good or better, and the points (two a near-perfect one). */
  landed: number;
  points: number;
  /** Which prize, from 0 (the floor), and whether it's the best. */
  rank: number;
  top: boolean;
  candy: number;
  free: boolean;
}

/** Her fortune, read. */
export interface Reading {
  /** Who reads it: Agatha, or the ball by itself. */
  reader: 'agatha' | 'ball';
  opening: string;
  line: string;
  lucky: { critter: CritterId; line: string } | null;
  /** Now and then, the ball points her to today's free go (V1's R6b). */
  fair: string | null;
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
 * ends, with its prize, so a go left half thrown costs nothing; nothing about one is saved. Since
 * V1's R6b (decision 315) a throw is a tap in time, scored by `systems/activities.ts`, and the
 * day's first go at one stall is free (`FREE_GO_KEY` in `Takings`).
 */
export class Activities {
  private readonly ctx: WorldContext;
  private readonly keeps: { bag: Bag; wallet: Wallet; takings: Takings };
  private readonly reads: ActivitiesReads;
  private going: {
    activity: ActivityId;
    seed: string;
    slow: boolean;
    throws: Thrown[];
    startedAt: number | null;
  } | null = null;
  /** Goes started, for each go's seed with the day. */
  private goes = 0;

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

  /** Whether a game's first go today is free and not yet had (V1's R6b). */
  freeToday(id: ActivityId): boolean {
    const now = this.ctx.clock.now();
    return freeGoOn(dayKey(now)) === id && this.keeps.takings.isReady(FREE_GO_KEY);
  }

  /** The game whose first go is free today, whether had or not. */
  freeGo(): ActivityId {
    return freeGoOn(dayKey(this.ctx.clock.now()));
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
      next:
        next < game.throws
          ? { pattern: patternOf(game, going.seed, next, going.slow), startedAt: going.startedAt }
          : null,
      free: this.freeToday(id),
    };
  }

  /**
   * Starts a go at a game, if it's open and she has the Candy for it (or it's the day's free go);
   * one already going goes on. `slow` is reduced motion: the same go, only gentler.
   */
  start(id: ActivityId, slow = false): Round | null {
    const game = gameOf(id);
    if (!game || !this.isOpen(id)) return null;
    if (!this.freeToday(id) && this.keeps.wallet.candy < ACTIVITIES[id].cost) return null;
    if (this.going?.activity !== id) {
      const now = this.ctx.clock.now();
      this.goes += 1;
      this.going = {
        activity: id,
        seed: `${dayKey(now)}:${id}:${this.goes}`,
        slow,
        throws: [],
        startedAt: game.motion === 'bell' ? null : now,
      };
    }
    return this.round(id);
  }

  /**
   * When a tap would do best in the go she's on, from now (the bell's from when she took hold, or
   * now): for the tests, and smoke's timed tap. Null with no go on.
   */
  bestTapAt(id: ActivityId): number | null {
    const next = this.round(id)?.next;
    if (!next) return null;
    const now = this.ctx.clock.now();
    const started = next.startedAt ?? now;
    return bestTapAfter(next.pattern, started, Math.max(now, started));
  }

  /** Takes hold of the mallet at the bell: its puck starts up from now. */
  hold(id: ActivityId): Round | null {
    const game = gameOf(id);
    const going = this.going;
    if (!game || !going || going.activity !== id) return null;
    if (game.motion === 'bell') going.startedAt = this.ctx.clock.now();
    return this.round(id);
  }

  /**
   * A throw in the go she's on, now: scored on where the moving thing is (at the duck pond, the
   * duck nearest `at` along the pond). The last throw ends the go: the Candy is paid (none for
   * the day's free go), and the prize for how well it went goes into her bag.
   */
  toss(id: ActivityId, at = 0.5): { thrown: Thrown; won: Won | null } | null {
    const game = gameOf(id);
    const going = this.going;
    if (!game || !going || going.activity !== id) return null;
    const now = this.ctx.clock.now();
    const pattern = patternOf(game, going.seed, going.throws.length, going.slow);
    const startedAt = going.startedAt ?? now;
    const scored = score(pattern, now, startedAt, at);
    const thrown: Thrown = { ...scored, pattern, tappedAt: now, ms: Math.max(0, now - startedAt) };
    going.throws.push(thrown);
    going.startedAt = game.motion === 'bell' ? null : now + BETWEEN_THROWS_MS;
    this.ctx.moments.push({
      kind: 'tossed',
      activity: id,
      landed: scored.grade > 0,
      grade: scored.grade,
    });
    if (going.throws.length < game.throws) return { thrown, won: null };
    this.going = null;
    return { thrown, won: this.award(id, game, going.throws) };
  }

  private award(id: ActivityId, game: Game['game'], throws: readonly Thrown[]): Won {
    const { bag, wallet, takings } = this.keeps;
    const free = this.freeToday(id);
    const candy = free ? 0 : ACTIVITIES[id].cost;
    const points = pointsOf(throws.map((t) => t.grade));
    const rank = prizeRank(game, points);
    const item = prizeOf(game, points);
    const top = rank === game.prizes.length - 1;
    const landed = throws.filter((t) => t.grade > 0).length;
    if (free) takings.take(FREE_GO_KEY);
    else wallet.spend(candy);
    bag.add(item, 1);
    this.ctx.events.emit('bag', bag.contents);
    this.ctx.moments.push({ kind: 'won', activity: id, item, landed, top });
    return { item, landed, points, rank, top, candy, free };
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
    const tip = fairTipOn(day);
    return {
      reader: agatha ? 'agatha' : 'ball',
      opening: agatha ? fill(AGATHA_READS, { name: this.reads.name() }) : BALL_READS,
      line: fortuneOn(day),
      lucky: lucky && {
        critter: lucky.critter,
        line: `Lucky critter: a ${CRITTERS[lucky.critter].name}, ${whenOut(lucky, hour)}, in ${ZONES[lucky.where].name}.`,
      },
      // Only while the free go is still to be had.
      fair: tip && this.keeps.takings.isReady(FREE_GO_KEY) ? tip : null,
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
