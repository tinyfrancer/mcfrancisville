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
  specialDayOf,
  TALK_POINTS,
  yearsMarried,
} from '../../systems/friendship';
import type { Tile } from '../../systems/pathfinding';
import { visitOf, whereabouts, type Place } from '../../systems/schedules';
import { nextZoneToward } from '../../systems/zones';
import type { ItemId, VillagerId, ZoneId } from '../../types/ids';
import type { Bag } from '../Bag';
import type { WorldContext } from '../context';
import type { Chat, GiftResult } from '../events';
import type { Friends } from '../Friends';
import { tileOf } from '../Movement';
import { Neighbour } from '../Neighbour';
import type { Wardrobe } from '../Wardrobe';
import { worthVisiting } from '../zones/RoomZone';
import type { Zone } from '../zones/Zone';
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
 * friendships that grow and post a letter at each milestone. Where they're headed is
 * `systems/schedules.ts`'s; walking there, through any door, is this.
 */
export class Neighbourhood {
  private readonly ctx: WorldContext;
  private readonly keeps: NeighbourhoodKeeps;
  private readonly zones: Zones;
  /** The place she is in now. */
  private readonly here: () => ZoneId;
  /** Her neighbours, wherever each is; none in a town without them (a test's small map). */
  readonly neighbours: readonly Neighbour[];
  /** Who she's talking to, if anyone: they wait for her. */
  private talking: VillagerId | null = null;
  /** How many times she has talked to each today, for their lines to move on. */
  private talks = new Map<VillagerId, { day: string; count: number }>();
  /** When Cody's last puff clears. */
  private puffUntil = 0;
  /** The visit to her each guest has said hello for, as `day@from`. */
  private greeted = new Map<VillagerId, string>();

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
    this.neighbours = peopled ? VILLAGER_IDS.map((id) => new Neighbour(id, 'town', ZERO)) : [];
    const plan = this.plan();
    for (const n of this.neighbours) {
      const goal = plan.get(n.id)!;
      n.zone = goal.zone;
      n.place(goal);
    }
  }

  /** The neighbours in a place now. */
  neighboursIn(zone: ZoneId): Neighbour[] {
    return this.neighbours.filter((n) => n.zone === zone);
  }

  private get name(): string {
    return this.keeps.wardrobe.look.name;
  }

  /**
   * The neighbour standing on a tile where she is, by their feet, or by their head where that
   * isn't over something else she might have meant, like the mailbox.
   */
  villagerAt(tx: number, ty: number): Neighbour | undefined {
    const where = this.here();
    const thing = this.zones.inside(where)?.thingAt(tx, ty);
    const heads =
      this.zones.get(where).propAt(tx, ty) === undefined && !(thing && worthVisiting(thing));
    return this.neighboursIn(where).find((n) => {
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
   * Where each neighbour should be now, as a place and a tile: at their stop, or beside whoever
   * they're visiting, guests placed after everyone else so no two stand on one tile.
   */
  private plan(): Map<VillagerId, Place> {
    const now = this.ctx.clock.now();
    const hour = hourOf(now);
    const day = dayKey(now);
    const plan = new Map<VillagerId, Place>();
    const guests: [VillagerId, ZoneId, Tile | null][] = [];
    for (const n of this.neighbours) {
      const where = whereabouts(n.id, hour, day);
      if ('tile' in where) plan.set(n.id, { zone: where.zone, ...where.tile });
      else guests.push([n.id, where.zone, where.beside]);
    }
    for (const [id, zone, beside] of guests) {
      const z = this.zones.get(zone);
      // Indoors, the mat is left clear: it's the way in and out.
      const mat = this.zones.outdoor(zone) ? null : z.entry(null).tile;
      const taken = [...plan.values()].filter((p) => p.zone === zone);
      if (mat) taken.push({ ...mat, zone });
      plan.set(id, { zone, ...besideOf(z, beside ?? mat!, taken) });
    }
    return plan;
  }

  /**
   * Each neighbour goes where the clock says they should be (decisions.md 92). In the place she's
   * in, they walk there, out by the edge or a door if it's somewhere else; one she's talking to,
   * or walking up to (`heading`), waits for her, and one she's standing near turns to look at her,
   * or else at whoever they're visiting. Anywhere else, they're simply where they should be, or
   * come in by the way from where they were when that is where she is.
   */
  step(deltaMs: number, her: { x: number; y: number }, heading: VillagerId | null): void {
    const where = this.here();
    const me = tileOf(her.x, her.y);
    const plan = this.plan();
    for (const n of this.neighbours) {
      const goal = plan.get(n.id)!;
      if (n.zone !== where) {
        this.keepAway(n, goal, where);
        continue;
      }
      const held = n.id === this.talking || n.id === heading;
      if (held) n.hold();
      else {
        const to = goal.zone === n.zone ? goal : this.wayOut(n, goal);
        if (!to) continue;
        n.step(deltaMs, to, this.zones.get(n.zone));
      }
      const t = n.tile;
      const near = Math.max(Math.abs(t.tx - me.tx), Math.abs(t.ty - me.ty)) <= 2;
      if (held || near) n.face(her.x, her.y);
      else this.faceHost(n);
    }
  }

  /** A guest standing with whoever they're visiting turns to them, to chat. */
  private faceHost(n: Neighbour): void {
    const now = this.ctx.clock.now();
    const host = visitOf(n.id, hourOf(now), dayKey(now))?.host;
    const other = host && host !== 'her' ? this.neighbour(host) : undefined;
    if (other?.zone === n.zone && !other.moving) other.face(n.x, n.y);
    if (other?.zone === n.zone) n.face(other.x, other.y);
  }

  /** A neighbour away from where she is: where they should be, or coming in to where she is. */
  private keepAway(n: Neighbour, goal: Place, where: ZoneId): void {
    if (goal.zone === where) {
      const via = nextZoneToward(goal.zone, n.zone) ?? n.zone;
      n.zone = goal.zone;
      n.place(this.zones.get(goal.zone).entry(via).tile);
      return;
    }
    n.zone = goal.zone;
    n.place(goal);
  }

  /**
   * The way out of a neighbour's place toward somewhere else: the edge, a building's door step,
   * or a room's mat. Null once they're through it (or if there's no way), and out of her sight
   * they're simply where they're going.
   */
  private wayOut(n: Neighbour, goal: Place): Tile | null {
    const next = nextZoneToward(n.zone, goal.zone);
    const door = next ? this.leaveBy(n.zone, next) : null;
    const t = n.tile;
    if (door && (n.moving || t.tx !== door.tx || t.ty !== door.ty)) return door;
    n.zone = goal.zone;
    n.place(goal);
    return null;
  }

  /** Where a neighbour leaves a place by, toward the next: the edge, a door step, or the mat. */
  private leaveBy(zone: ZoneId, next: ZoneId): Tile {
    const exit = this.zones.outdoor(zone)?.map.exits.find((e) => e.to === next);
    if (!exit) return this.zones.get(zone).entry(next).tile;
    return {
      tx: exit.tx + Math.floor((exit.w - 1) / 2),
      ty: exit.ty + Math.floor((exit.h - 1) / 2),
    };
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
    const hour = hourOf(now);
    const said = puff
      ? puffLine(day, talks)
      : (this.dropsBy(id, hour, day, talks) ??
        lineFor(id, { hearts: this.keeps.friends.hearts(id), day, hour, talks }));
    this.talks.set(id, { day, count: talks + 1 });
    if (puff) this.puffUntil = now + PUFF_MS;
    return { line: fill(said, { name: this.name, years: yearsMarried(day) }), bonus, puff };
  }

  /**
   * What a neighbour says first when she finds them visiting her at home, once a visit, unless
   * the day's own line comes first.
   */
  private dropsBy(id: VillagerId, hour: number, day: string, talks: number): string | null {
    const visit = visitOf(id, hour, day);
    if (visit?.host !== 'her' || (talks === 0 && specialDayOf(day))) return null;
    const key = `${day}@${visit.from}`;
    if (this.greeted.get(id) === key) return null;
    this.greeted.set(id, key);
    return VILLAGERS[id].dropsBy;
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

  /** A little more friendship for something done for them away from a talk: a note answered. */
  thank(id: VillagerId, points: number): void {
    this.befriend(id, points, {});
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

const ZERO: Tile = { tx: 0, ty: 0 };

/** Beside, then in front of, then behind: two standing side by side face each other to chat. */
const BESIDE: readonly Tile[] = [
  { tx: -1, ty: 0 },
  { tx: 1, ty: 0 },
  { tx: -1, ty: 1 },
  { tx: 1, ty: 1 },
  { tx: 0, ty: 1 },
  { tx: -1, ty: -1 },
  { tx: 1, ty: -1 },
  { tx: 0, ty: -1 },
];

/**
 * An open tile beside `at` for a guest to stand on, where nobody else is (`taken`). `at` itself if
 * there's none.
 */
export function besideOf(zone: Zone, at: Tile, taken: readonly Tile[]): Tile {
  for (const d of BESIDE) {
    const t = { tx: at.tx + d.tx, ty: at.ty + d.ty };
    if (!zone.canWalk(t.tx, t.ty)) continue;
    if (taken.some((o) => o.tx === t.tx && o.ty === t.ty)) continue;
    return t;
  }
  return at;
}
