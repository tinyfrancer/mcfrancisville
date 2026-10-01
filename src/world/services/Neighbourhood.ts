import { isKept } from '../../data/items';
import { HAPPENINGS } from '../../data/happenings';
import { VILLAGER_IDS, VILLAGERS, type Favour } from '../../data/villagers';
import { dayKey, hourOf } from '../../systems/clock';
import {
  dayLine,
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
import { happeningOf, happeningsAt, venueOf } from '../../systems/happenings';
import { holidayOn } from '../../systems/holidays';
import { HOLIDAY_TREATS } from '../../data/holidays';
import { lotOf, unpackingAt, type Moving } from '../../systems/newcomers';
import { visitOf, whereabouts, type Place } from '../../systems/schedules';
import type { TalkScene } from '../../systems/dialogue';
import { isBracelet } from '../../systems/wardrobe';
import { nextZoneToward } from '../../systems/zones';
import type { HappeningId, ItemId, VillagerId, ZoneId } from '../../types/ids';
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
import type { SmallEvents } from './SmallEvents';
import type { Takings } from './Takings';
import type { Wallet } from './Wallet';

/** What friendship reaches into: what she gives from, is paid into, and is written to. */
export interface NeighbourhoodKeeps {
  friends: Friends;
  bag: Bag;
  wallet: Wallet;
  mailbox: Mailbox;
  wardrobe: Wardrobe;
  /** Where a happening's gift, once handed over, is kept till it comes round again. */
  takings: Takings;
  /** The window's news, or what someone has lost. */
  smallEvents: SmallEvents;
  /** Who lives in town today. */
  town: Townsfolk;
  /** What's going on round her, for what a neighbour brings up (0.2's D2). */
  scene?: () => TalkScene;
}

/** How she knows a neighbour: met, moved in but not met yet, or still to come (phase T). */
export type Acquaintance = 'met' | 'new' | 'coming';

/** Where a neighbour is, and what they're there for, if it's more than their day (0.2's U3). */
export interface Whereabout {
  zone: ZoneId;
  doing:
    | { happening: HappeningId }
    | { visiting: VillagerId | 'her' }
    | { party: true }
    | { moving: true }
    | null;
}

/** Who lives in town today (phase T): her first neighbours, and newcomers once they've moved in. */
export interface Townsfolk {
  residents(): readonly VillagerId[];
  moving(villager: VillagerId): Moving;
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
  /**
   * Every neighbour, whether or not they live here yet; none in a town without them (a test's
   * small map).
   */
  private readonly everyone: readonly Neighbour[];
  /** Those who were living here when last stepped, so one who moves in is simply there. */
  private present = new Set<VillagerId>();
  /** Who she's talking to, if anyone: they wait for her. */
  private talking: VillagerId | null = null;
  /** How many times she has talked to each today, for their lines to move on. */
  private talks = new Map<VillagerId, { day: string; count: number; said: string[] }>();
  /** Who last let one go on a talk, and when it clears. */
  private puffed: { id: VillagerId; until: number } | null = null;
  /** What each has said their piece for: a visit to her (`day@from`) or a happening. */
  private heard = new Map<VillagerId, string>();

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
    this.everyone = peopled ? VILLAGER_IDS.map((id) => new Neighbour(id, 'town', ZERO)) : [];
    this.settle(this.plan());
  }

  /** Her neighbours who live here now, wherever each is. */
  get neighbours(): Neighbour[] {
    const residents = this.keeps.town.residents();
    return this.everyone.filter((n) => residents.includes(n.id));
  }

  /** Anyone who has come to live here since last time is simply where they should be. */
  private settle(plan: Map<VillagerId, Place>): void {
    for (const n of this.neighbours) {
      if (this.present.has(n.id)) continue;
      const goal = plan.get(n.id)!;
      n.zone = goal.zone;
      n.place(goal);
    }
    this.present = new Set(plan.keys());
  }

  /** Those settled here, who pay visits and are visited: not a newcomer on their moving day. */
  private callers(): VillagerId[] {
    const { town } = this.keeps;
    return town.residents().filter((id) => town.moving(id) === 'settled');
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

  /** One of their happenings going on in a place now, with someone there for it. */
  happeningIn(zone: ZoneId): HappeningId | null {
    const now = this.ctx.clock.now();
    const day = dayKey(now);
    if (this.neighbours.length === 0 || specialDayOf(day) === 'birthday') return null;
    const on = happeningsAt(hourOf(now), day).find((id) => venueOf(id).zone === zone);
    return on ?? null;
  }

  /** Whoever in a place has a spell about them just now, sparkling (a happening's `sparkles`). */
  sparkling(zone: ZoneId): Neighbour[] {
    const happening = this.happeningIn(zone);
    if (!happening || !HAPPENINGS[happening].sparkles) return [];
    const host = this.neighbour(HAPPENINGS[happening].who[0]!);
    return host.zone === zone ? [host] : [];
  }

  neighbour(id: VillagerId): Neighbour {
    return this.everyone.find((n) => n.id === id)!;
  }

  /**
   * How she knows a neighbour (0.2's U3): her first neighbours from the start, a newcomer once
   * she's talked to them; until then one who has moved in is `new`, and one still to come `coming`.
   */
  knows(id: VillagerId): Acquaintance {
    const lives = this.keeps.town.residents().includes(id);
    const { talked, points } = this.keeps.friends.of(id);
    if (!VILLAGERS[id].newcomer || (lives && (talked !== null || points > 0))) return 'met';
    return lives ? 'new' : 'coming';
  }

  /**
   * Where a neighbour who lives here is just now, and what for (0.2's U3): a happening of theirs,
   * a visit, her birthday party, or unpacking on their moving day. Null for one not living here.
   */
  whereIs(id: VillagerId): Whereabout | null {
    if (!this.keeps.town.residents().includes(id) || !this.everyone.length) return null;
    const now = this.ctx.clock.now();
    const hour = hourOf(now);
    const day = dayKey(now);
    const zone = this.neighbour(id).zone;
    if (specialDayOf(day) === 'birthday') return { zone, doing: { party: true } };
    if (this.keeps.town.moving(id) === 'moving') return { zone, doing: { moving: true } };
    const happening = happeningOf(id, hour, day);
    if (happening) {
      const at = venueOf(happening).zone;
      // On their way, they're only said to be where they are.
      return { zone, doing: at === zone ? { happening } : null };
    }
    const visit = visitOf(id, hour, day, this.callers());
    return { zone, doing: visit ? { visiting: visit.host } : null };
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
   * Where each neighbour should be now, as a place and a tile: at their stop, beside whoever
   * they're visiting, or on their moving day by their new front door, guests placed after everyone
   * else so no two stand on one tile.
   */
  private plan(): Map<VillagerId, Place> {
    const now = this.ctx.clock.now();
    const hour = hourOf(now);
    const day = dayKey(now);
    const callers = this.callers();
    const party = specialDayOf(day) === 'birthday';
    const plan = new Map<VillagerId, Place>();
    const guests: [VillagerId, ZoneId, Tile | null][] = [];
    for (const n of this.neighbours) {
      const lot = !party && this.keeps.town.moving(n.id) === 'moving' ? lotOf(n.id) : undefined;
      if (lot) {
        plan.set(n.id, { zone: lot.zone, ...unpackingAt(lot) });
        continue;
      }
      const where = whereabouts(n.id, hour, day, callers);
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
    this.settle(plan);
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

  /**
   * A guest standing with whoever they're visiting, or gathered round, turns to them; at a
   * happening that looks one way (a film), everyone does.
   */
  private faceHost(n: Neighbour): void {
    const now = this.ctx.clock.now();
    const day = dayKey(now);
    const at = specialDayOf(day) === 'birthday' ? null : happeningOf(n.id, hourOf(now), day);
    const faces = at && !n.moving ? HAPPENINGS[at].faces : undefined;
    if (faces) {
      n.facing = faces;
      return;
    }
    const where = whereabouts(n.id, hourOf(now), dayKey(now), this.callers());
    const host = 'host' in where && where.host !== 'her' ? this.neighbour(where.host) : undefined;
    if (host?.zone !== n.zone) return;
    if (!host.moving) host.face(n.x, n.y);
    n.face(host.x, host.y);
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

  private talksToday(id: VillagerId): { count: number; said: string[] } {
    const t = this.talks.get(id);
    return t && t.day === dayKey(this.ctx.clock.now()) ? t : { count: 0, said: [] };
  }

  /**
   * Talks to a neighbour: what they say, and whether it was the day's first talk, which brings
   * them a little closer. Cody lets one go now and then.
   */
  talk(id: VillagerId): Chat {
    const now = this.ctx.clock.now();
    const day = dayKey(now);
    const today = this.talksToday(id);
    const talks = today.count;
    const bonus = this.keeps.friends.of(id).talked !== day;
    if (bonus) this.befriend(id, TALK_POINTS, { talked: day });
    const puff = puffsOnTalk(id, day, talks);
    const hour = hourOf(now);
    const at = puff ? null : this.atHappening(id, hour, day, talks);
    const unpacking = puff || at ? null : this.unpacking(id, day, talks);
    const dropping = puff || at || unpacking ? null : this.dropsBy(id, hour, day, talks);
    const small = puff || at || unpacking || dropping ? null : this.keeps.smallEvents.talk(id);
    const said = puff
      ? puffLine(id, day, talks)
      : (at?.line ??
        unpacking ??
        dropping ??
        small?.line ??
        lineFor(id, {
          hearts: this.keeps.friends.hearts(id),
          day,
          hour,
          talks,
          said: today.said,
          away: this.away(),
          scene: this.keeps.scene?.(),
        }));
    this.talks.set(id, { day, count: talks + 1, said: [...today.said, said] });
    if (puff) this.puffed = { id, until: now + PUFF_MS };
    const chat: Chat = {
      line: fill(said, { name: this.name, years: yearsMarried(day) }),
      bonus,
      puff,
    };
    const treat = talks === 0 ? this.treat(id, day) : null;
    if (treat) chat.gift = treat;
    if (at?.gift) chat.gift = at.gift;
    if (small?.candy) chat.candy = small.candy;
    return chat;
  }

  /**
   * What a neighbour hands her with their holiday line (phase U): a treat on Halloween, once each,
   * whoever she talks to. Null on any other day, or once she has theirs.
   */
  private treat(id: VillagerId, day: string): ItemId | null {
    const holiday = holidayOn(day);
    const treat = holiday && dayLine(id, day) ? HOLIDAY_TREATS[holiday] : undefined;
    const { bag, takings } = this.keeps;
    const key = `treat:${id}`;
    if (!treat || !takings.isReady(key)) return null;
    takings.take(key);
    bag.add(treat, 1);
    this.ctx.events.emit('bag', bag.contents);
    return treat;
  }

  /**
   * What a neighbour says the first time she talks to them at one of their happenings, unless the
   * day's own line comes first, and what the host hands her, once.
   */
  /** Neighbours who haven't moved in yet, whom no one talks of till they have. */
  private away(): VillagerId[] {
    const residents = this.keeps.town.residents();
    return VILLAGER_IDS.filter((id) => !residents.includes(id));
  }

  private atHappening(
    id: VillagerId,
    hour: number,
    day: string,
    talks: number,
  ): { line: string; gift?: ItemId } | null {
    if (talks === 0 && dayLine(id, day)) return null;
    const happening = happeningOf(id, hour, day);
    const line = happening && HAPPENINGS[happening].says[id];
    if (!happening || !line) return null;
    const key = `${happening}:${day}`;
    if (this.heard.get(id) === key) return null;
    this.heard.set(id, key);
    const { gift, who } = HAPPENINGS[happening];
    const { bag, takings } = this.keeps;
    const taking = `happening:${happening}`;
    if (!gift || who[0] !== id || !takings.isReady(taking)) return { line };
    takings.take(taking);
    bag.add(gift, 1);
    this.ctx.events.emit('bag', bag.contents);
    return { line, gift };
  }

  /**
   * What a newcomer says first on their moving day, among their boxes, unless the day's own line
   * comes first.
   */
  private unpacking(id: VillagerId, day: string, talks: number): string | null {
    const newcomer = VILLAGERS[id].newcomer;
    if (!newcomer || this.keeps.town.moving(id) !== 'moving') return null;
    if (talks === 0 && dayLine(id, day)) return null;
    const key = `moving:${day}`;
    if (this.heard.get(id) === key) return null;
    this.heard.set(id, key);
    return newcomer.unpacking;
  }

  /**
   * What a neighbour says first when she finds them visiting her at home, once a visit, unless
   * the day's own line comes first.
   */
  private dropsBy(id: VillagerId, hour: number, day: string, talks: number): string | null {
    const callers = this.callers();
    const visit = visitOf(id, hour, day, callers);
    const where = whereabouts(id, hour, day, callers);
    if (!visit || !('host' in where) || where.host !== 'her') return null;
    if (talks === 0 && dayLine(id, day)) return null;
    const key = `${day}@${visit.from}`;
    if (this.heard.get(id) === key) return null;
    this.heard.set(id, key);
    return VILLAGERS[id].dropsBy;
  }

  /** Whoever in a place has just let one go, for the view to draw the puff. */
  puffing(zone: ZoneId): Neighbour[] {
    const now = this.ctx.clock.now();
    return this.neighboursIn(zone).filter(
      (n) => (this.puffed?.id === n.id && now < this.puffed.until) || puffingAt(n.id, now),
    );
  }

  /**
   * Gives a neighbour something from her bag. Only the first gift of the day counts; a second is
   * politely turned down, and stays in her bag. Null if she hasn't got it.
   */
  give(id: VillagerId, item: ItemId): GiftResult | null {
    const { bag, friends } = this.keeps;
    if (bag.spare(item) === 0 || isKept(item)) return null;
    const day = dayKey(this.ctx.clock.now());
    if (friends.of(id).gifted === day) {
      return { declined: true, line: fill(declineLine(id), { name: this.name }) };
    }
    bag.remove(item);
    this.ctx.events.emit('bag', bag.contents);
    const reaction = reactionTo(id, item);
    const wears = isBracelet(item) ? { wears: item } : {};
    this.befriend(id, GIFT_POINTS[reaction], { gifted: day, ...wears });
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
