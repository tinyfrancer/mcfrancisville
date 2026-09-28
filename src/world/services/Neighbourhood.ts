import { isKept } from '../../data/items';
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
  type StopAt,
  TALK_POINTS,
  yearsMarried,
} from '../../systems/friendship';
import type { Tile } from '../../systems/pathfinding';
import { nextZoneToward } from '../../systems/zones';
import type { ItemId, MapZoneId, VillagerId, ZoneId } from '../../types/ids';
import type { Bag } from '../Bag';
import type { WorldContext } from '../context';
import type { Chat, GiftResult } from '../events';
import type { Friends } from '../Friends';
import { tileOf } from '../Movement';
import { Neighbour, type Ground } from '../Neighbour';
import type { Wardrobe } from '../Wardrobe';
import type { Zones } from '../zones/Zones';
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
  private readonly zones: Zones;
  /** The place she is in now. */
  private readonly here: () => ZoneId;
  /** Her neighbours, wherever each is; none in a town without them (a test's small map). */
  readonly neighbours: readonly Neighbour[];
  private readonly grounds = new Map<MapZoneId, Ground>();
  /** Who she's talking to, if anyone: they wait for her. */
  private talking: VillagerId | null = null;
  /** How many times she has talked to each today, for their lines to move on. */
  private talks = new Map<VillagerId, { day: string; count: number }>();
  /** When Cody's last puff clears. */
  private puffUntil = 0;

  constructor(
    ctx: WorldContext,
    keeps: NeighbourhoodKeeps,
    zones: Zones,
    peopled: boolean,
    here: () => ZoneId,
  ) {
    this.ctx = ctx;
    this.keeps = keeps;
    this.zones = zones;
    this.here = here;
    const now = ctx.clock.now();
    this.neighbours = peopled
      ? VILLAGER_IDS.map((id) => {
          const stop = stopOf(id, hourOf(now), dayKey(now));
          return new Neighbour(id, stop.zone, stop);
        })
      : [];
  }

  /** The neighbours in a place now. */
  neighboursIn(zone: ZoneId): Neighbour[] {
    return this.neighbours.filter((n) => n.zone === zone);
  }

  /** A place as her neighbours walk it, made once each: they're asked on every step. */
  private groundOf(zone: MapZoneId): Ground {
    let ground = this.grounds.get(zone);
    if (!ground) {
      const z = this.zones.map(zone);
      ground = { canWalk: z.canWalk, width: z.width, height: z.height };
      this.grounds.set(zone, ground);
    }
    return ground;
  }

  private get name(): string {
    return this.keeps.wardrobe.look.name;
  }

  /**
   * The neighbour standing on a tile where she is, by their feet, or by their head where that
   * isn't over something else she might have meant, like the mailbox.
   */
  villagerAt(tx: number, ty: number): Neighbour | undefined {
    const here = this.here();
    if (here === 'home') return undefined;
    const heads = this.zones.map(here).propAt(tx, ty) === undefined;
    return this.neighboursIn(here).find((n) => {
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
   * Each neighbour goes where the clock says they should be (decisions.md 92). In the place she's
   * in, they walk there, out by the edge if it's somewhere else; one she's talking to, or walking
   * up to (`heading`), waits for her, and one she's standing near turns to look at her. Anywhere
   * else, they're simply at their stop, or come in by the way from where they were when their stop
   * is where she is.
   */
  step(deltaMs: number, her: { x: number; y: number }, heading: VillagerId | null): void {
    const now = this.ctx.clock.now();
    const hour = hourOf(now);
    const day = dayKey(now);
    const where = this.here();
    const me = tileOf(her.x, her.y);
    for (const n of this.neighbours) {
      const stop = stopOf(n.id, hour, day);
      if (n.zone !== where) {
        this.keepAway(n, stop, where);
        continue;
      }
      const held = n.id === this.talking || n.id === heading;
      const goal = stop.zone === n.zone || held ? stop : this.wayOut(n, stop);
      if (!goal) continue;
      n.step(deltaMs, goal, this.groundOf(n.zone), held);
      const t = n.tile;
      const near = Math.max(Math.abs(t.tx - me.tx), Math.abs(t.ty - me.ty)) <= 2;
      if (held || near) n.face(her.x, her.y);
    }
  }

  /** A neighbour away from where she is: at their stop, or coming in to where she is. */
  private keepAway(n: Neighbour, stop: StopAt, where: ZoneId): void {
    if (stop.zone === where) {
      const via = nextZoneToward(stop.zone, n.zone) ?? n.zone;
      n.zone = stop.zone;
      n.place(this.zones.map(stop.zone).entry(via).tile);
      return;
    }
    n.zone = stop.zone;
    n.place(stop);
  }

  /**
   * The way out of a neighbour's place toward a stop somewhere else. Null once they're through it
   * (or if there's no way), and out of her sight they're simply at their stop.
   */
  private wayOut(n: Neighbour, stop: StopAt): Tile | null {
    const next = nextZoneToward(n.zone, stop.zone);
    const exit = next ? this.zones.map(n.zone).map.exits.find((e) => e.to === next) : undefined;
    const door = exit && {
      tx: exit.tx + Math.floor((exit.w - 1) / 2),
      ty: exit.ty + Math.floor((exit.h - 1) / 2),
    };
    const t = n.tile;
    if (door && (n.moving || t.tx !== door.tx || t.ty !== door.ty)) return door;
    n.zone = stop.zone;
    n.place(stop);
    return null;
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
    if (bag.count(item) === 0 || isKept(item)) return null;
    const day = dayKey(this.ctx.clock.now());
    if (friends.of(id).gifted === day) {
      return { declined: true, line: fill(declineLine(id), { name: this.name }) };
    }
    bag.remove(item);
    this.ctx.events.emit('bag', bag.contents);
    const reaction = reactionTo(id, item);
    this.befriend(id, GIFT_POINTS[reaction], { gifted: day });
    if (reaction === 'loved') this.ctx.signals.emit('thrilled', { by: 'gift' });
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
