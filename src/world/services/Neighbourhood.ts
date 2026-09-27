import { VILLAGER_IDS, VILLAGERS, type Favour } from '../../data/villagers';
import { dayKey, hourOf } from '../../systems/clock';
import {
  declineLine,
  FAVOUR_POINTS,
  favourCandy,
  favourOf,
  fill,
  GIFT_POINTS,
  giftLine,
  lineFor,
  PUFF_MS,
  puffingAt,
  puffLine,
  puffsOnTalk,
  reactionTo,
  rewardsBetween,
  stopOf,
  TALK_POINTS,
  yearsMarried,
} from '../../systems/friendship';
import type { ItemId, VillagerId } from '../../types/ids';
import type { Bag } from '../Bag';
import type { WorldContext } from '../context';
import type { Chat, GiftResult } from '../events';
import type { Friends } from '../Friends';
import { tileOf } from '../Movement';
import { Neighbour, type Ground } from '../Neighbour';
import type { Wardrobe } from '../Wardrobe';
import type { TownZone } from '../zones/TownZone';
import type { Mailbox } from './Mailbox';
import type { Wallet } from './Wallet';

/** What friendship reaches into: what she gives from, is paid into, and is written to. */
export interface NeighbourhoodKeeps {
  friends: Friends;
  bag: Bag;
  wallet: Wallet;
  mailbox: Mailbox;
  wardrobe: Wardrobe;
}

/**
 * Her neighbours (decisions.md 56–61): where each walks by the clock, talking, gifts, favours, and
 * friendships that grow and post a letter at each milestone.
 */
export class Neighbourhood {
  private readonly ctx: WorldContext;
  private readonly keeps: NeighbourhoodKeeps;
  private readonly world: TownZone;
  private readonly outside: () => boolean;
  /** Her neighbours, out in town; none in a town without them (a test's small map). */
  readonly neighbours: readonly Neighbour[];
  /** The town, as her neighbours walk it, wherever she happens to be. */
  private readonly ground: Ground;
  /** Who she's talking to, if anyone: they wait for her. */
  private talking: VillagerId | null = null;
  /** How many times she has talked to each today, for their lines to move on. */
  private talks = new Map<VillagerId, { day: string; count: number }>();
  /** When Cody's last puff clears. */
  private puffUntil = 0;

  constructor(
    ctx: WorldContext,
    keeps: NeighbourhoodKeeps,
    world: TownZone,
    peopled: boolean,
    outside: () => boolean,
  ) {
    this.ctx = ctx;
    this.keeps = keeps;
    this.world = world;
    this.outside = outside;
    this.ground = { canWalk: world.canWalk, width: world.width, height: world.height };
    const now = ctx.clock.now();
    this.neighbours = peopled
      ? VILLAGER_IDS.map((id) => new Neighbour(id, stopOf(id, hourOf(now), dayKey(now))))
      : [];
  }

  private get name(): string {
    return this.keeps.wardrobe.look.name;
  }

  /**
   * The neighbour standing on a tile out in town, by their feet, or by their head where that isn't
   * over something else she might have meant, like the mailbox.
   */
  villagerAt(tx: number, ty: number): Neighbour | undefined {
    if (!this.outside()) return undefined;
    const heads = this.world.propAt(tx, ty) === undefined;
    return this.neighbours.find((n) => {
      const t = n.tile;
      return t.tx === tx && (t.ty === ty || (heads && t.ty - 1 === ty));
    });
  }

  neighbour(id: VillagerId): Neighbour {
    return this.neighbours.find((n) => n.id === id)!;
  }

  /** Who she's talking to, if anyone. */
  get talkingTo(): VillagerId | null {
    return this.talking;
  }

  /** She has walked up to them, and they stop to talk. */
  startTalk(id: VillagerId): void {
    this.talking = id;
  }

  /** She's done talking, and they can be on their way. */
  endTalk(): void {
    this.talking = null;
  }

  /**
   * Each neighbour walks to where the clock says they should be. One she's talking to, or walking
   * up to (`heading`), waits for her; one she's standing near turns to look at her.
   */
  step(deltaMs: number, her: { x: number; y: number }, heading: VillagerId | null): void {
    const now = this.ctx.clock.now();
    const hour = hourOf(now);
    const day = dayKey(now);
    const outside = this.outside();
    const me = tileOf(her.x, her.y);
    for (const n of this.neighbours) {
      const held = n.id === this.talking || n.id === heading;
      n.step(deltaMs, stopOf(n.id, hour, day), this.ground, held);
      const t = n.tile;
      const near = Math.max(Math.abs(t.tx - me.tx), Math.abs(t.ty - me.ty)) <= 2;
      if (outside && (held || near)) n.face(her.x, her.y);
    }
  }

  private talksToday(id: VillagerId): number {
    const t = this.talks.get(id);
    return t && t.day === dayKey(this.ctx.clock.now()) ? t.count : 0;
  }

  /**
   * Talks to a neighbour: what they say, and whether it was the day's first talk, which brings
   * them a little closer. Cody lets one go now and then.
   */
  talk(id: VillagerId): Chat {
    const now = this.ctx.clock.now();
    const day = dayKey(now);
    const talks = this.talksToday(id);
    const bonus = this.keeps.friends.of(id).talked !== day;
    if (bonus) this.befriend(id, TALK_POINTS, { talked: day });
    const puff = id === 'cody' && puffsOnTalk(day, talks);
    const said = puff
      ? puffLine(day, talks)
      : lineFor(id, { hearts: this.keeps.friends.hearts(id), day, hour: hourOf(now), talks });
    this.talks.set(id, { day, count: talks + 1 });
    if (puff) this.puffUntil = now + PUFF_MS;
    return { line: fill(said, { name: this.name, years: yearsMarried(day) }), bonus, puff };
  }

  /** Whether Cody has just let one go, for the view to draw the puff. */
  puffing(): boolean {
    const now = this.ctx.clock.now();
    return now < this.puffUntil || puffingAt(now);
  }

  /**
   * Gives a neighbour something from her bag. Only the first gift of the day counts; a second is
   * politely turned down, and stays in her bag. Null if she hasn't got it.
   */
  give(id: VillagerId, item: ItemId): GiftResult | null {
    const { bag, friends } = this.keeps;
    if (bag.count(item) === 0 || item === 'fibisBone') return null;
    const day = dayKey(this.ctx.clock.now());
    if (friends.of(id).gifted === day) {
      return { declined: true, line: fill(declineLine(id), { name: this.name }) };
    }
    bag.remove(item);
    this.ctx.events.emit('bag', bag.contents);
    const reaction = reactionTo(id, item);
    this.befriend(id, GIFT_POINTS[reaction], { gifted: day });
    return { declined: false, reaction, line: fill(giftLine(id, item), { name: this.name }) };
  }

  /** What a neighbour has to ask of her today, until she's done it. */
  favour(id: VillagerId): Favour | null {
    const day = dayKey(this.ctx.clock.now());
    if (this.keeps.friends.of(id).favour === day) return null;
    return favourOf(id, day);
  }

  /**
   * Hands over what a neighbour asked for, and takes their thanks and some Candy. Null if they
   * asked nothing today or she hasn't enough of it.
   */
  doFavour(id: VillagerId): { line: string; candy: number } | null {
    const favour = this.favour(id);
    const { bag, wallet } = this.keeps;
    if (!favour || !bag.remove(favour.item, favour.count)) return null;
    const candy = favourCandy(favour);
    this.ctx.events.emit('bag', bag.contents);
    wallet.earn(candy);
    this.befriend(id, FAVOUR_POINTS, { favour: dayKey(this.ctx.clock.now()) });
    return { line: fill(VILLAGERS[id].thanks, { name: this.name }), candy };
  }

  /** Adds to a friendship, and posts a letter for each milestone it passes. */
  private befriend(id: VillagerId, points: number, change: Parameters<Friends['update']>[1]): void {
    const { friends, mailbox } = this.keeps;
    const before = friends.of(id).points;
    friends.update(id, { ...change, points: before + points });
    const day = dayKey(this.ctx.clock.now());
    for (const reward of rewardsBetween(id, before, friends.of(id).points)) {
      mailbox.post(`${id}:${reward.hearts}`, day);
    }
    this.ctx.events.emit('friends', friends);
  }
}
