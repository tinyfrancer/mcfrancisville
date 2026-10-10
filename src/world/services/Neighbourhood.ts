import { FURNITURE } from '../../data/furniture';
import { isKept } from '../../data/items';
import { doorStep } from '../../data/maps';
import { PROP_SEATS } from '../../data/seats';
import { WORKS } from '../../data/work';
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
  PUFF_MS,
  puffingAt,
  puffLine,
  puffsOnTalk,
  reactionTo,
  rewardsBetween,
  specialDayOf,
  TALK_POINTS,
  talkLine,
  yearsMarried,
} from '../../systems/friendship';
import { bandOf, bandReached, OPENERS_KEPT } from '../../systems/remembering';
import { BEST_CALLS } from '../../data/bestFriends';
import type { Reply } from '../../data/replies';
import { BEST_HEARTS, bestLetterId, writesOn } from '../../systems/bestFriends';
import { callOf } from '../../systems/calls';
import { answerSaid, momentDue, questionDue, repliesTo } from '../../systems/voice';
import type { Tile } from '../../systems/pathfinding';
import { happeningOf, happeningsAt, venueOf } from '../../systems/happenings';
import { holidayOn } from '../../systems/holidays';
import { HOLIDAY_TREATS } from '../../data/holidays';
import {
  CHAT_BEAT_MS,
  chatOn,
  NEAR_TILES,
  stopNow,
  strollTiles,
  strollTo,
  type Chatter,
} from '../../systems/neighbourLife';
import {
  stopsIn,
  visitOf,
  whereabouts,
  type Place,
  type Visit,
  type Whereabouts,
} from '../../systems/schedules';
import type { Around, Between } from '../../systems/dialogue';
import { isBracelet } from '../../systems/wardrobe';
import { nextZoneToward } from '../../systems/zones';
import type { HappeningId, ItemId, VillagerId, ZoneId } from '../../types/ids';
import type { Bag } from '../Bag';
import type { WorldContext } from '../context';
import type { Chat, GiftResult } from '../events';
import type { Friends, Friendship } from '../Friends';
import { tileOf } from '../Movement';
import { Neighbour } from '../Neighbour';
import type { Wardrobe } from '../Wardrobe';
import { boxOf, worthVisiting } from '../zones/RoomZone';
import type { Zone } from '../zones/Zone';
import type { Zones } from '../zones/Zones';
import type { Mailbox } from './Mailbox';
import type { SmallEvents } from './SmallEvents';
import type { Takings } from './Takings';
import { seatFacing, seatOn, type Seat } from './Sitting';
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
  /** What's going on round her, for what a neighbour brings up (0.2's D2, V1's P1). */
  scene?: () => Around;
}

/** Where a neighbour is, and what they're there for, if it's more than their day (0.2's U3). */
export interface Whereabout {
  zone: ZoneId;
  doing: { happening: HappeningId } | { visiting: VillagerId | 'her' } | { party: true } | null;
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
  /** Every neighbour; none in a town without them (a test's small map). */
  private readonly everyone: Neighbour[];
  /** Who she's talking to, if anyone: they wait for her. */
  private talking: VillagerId | null = null;
  /** How many times she has talked to each today, for their lines to move on. */
  private talks = new Map<VillagerId, { day: string; count: number; said: string[] }>();
  /** Who last let one go on a talk, and when it clears. */
  private puffed: { id: VillagerId; until: number } | null = null;
  /** What each has said their piece for: a visit to her (`day@from`) or a happening. */
  private heard = new Map<VillagerId, string>();
  /** Where each stop's strolls may go, by place and stop (V1's E3). */
  private strollsFrom = new Map<string, Tile[]>();
  /** The seat beside each stop, by place and tile, or null for none. */
  private seats = new Map<string, Seat | null>();
  /** Stepped time, the beat of their chatter. */
  private chatMs = 0;
  /** What she can say back to the last line, and to whom (V1's P2). */
  private pending: { id: VillagerId; replies: readonly Answering[] } | null = null;
  /** The day each last told her a heart moment, and asked their question: one a day. */
  private told = new Map<VillagerId, string>();
  private asked = new Map<VillagerId, string>();
  /** The last day a best friend's letter was looked for, so it's looked for once a day. */
  private wroteOn: string | null = null;

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
    for (const [id, goal] of this.plan()) {
      const n = this.neighbour(id);
      n.zone = goal.zone;
      n.place(goal);
    }
    // Whoever is visiting her follows her through into the next of her rooms (0.3's H4).
    ctx.signals.on('crossed', ({ from, to }) => {
      if (from !== 'home' || to !== 'home') return;
      const mat = zones.home.entry().tile;
      for (const n of this.neighboursIn('home')) n.place(mat);
    });
  }

  /** Her neighbours, wherever each is: everyone lives in town (decision 211). */
  get neighbours(): Neighbour[] {
    return this.everyone;
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
      // Sat down (V1's E3), they're on the seat beside their tile: a tap on it is a tap on them.
      const sat = n.seat && tileOf(n.seat.x, n.seat.floor - 1);
      if (sat && sat.tx === tx && sat.ty === ty) return true;
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
   * Where a neighbour is just now, and what for (0.2's U3): a happening of theirs, a visit, or her
   * birthday party. Null in a town without them.
   */
  whereIs(id: VillagerId): Whereabout | null {
    if (!this.everyone.length) return null;
    const now = this.ctx.clock.now();
    const hour = hourOf(now);
    const day = dayKey(now);
    const zone = this.neighbour(id).zone;
    if (specialDayOf(day) === 'birthday') return { zone, doing: { party: true } };
    const happening = happeningOf(id, hour, day);
    if (happening) {
      const at = venueOf(happening).zone;
      // On their way, they're only said to be where they are.
      return { zone, doing: at === zone ? { happening } : null };
    }
    if (this.callNow(id, hour, day)) return { zone, doing: { visiting: 'her' } };
    const visit = visitOf(id, hour, day);
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
    this.pending = null;
  }

  /**
   * A best friend's call at her house by choice (V1's P2, `systems/calls.ts`), if they're paying
   * one now. Never Cody's: his evenings at hers are his own (P5).
   */
  private callNow(id: VillagerId, hour: number, day: string): Visit | null {
    return this.keeps.friends.hearts(id) >= BEST_HEARTS ? callOf(id, hour, day) : null;
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
      const where = this.callNow(n.id, hour, day) ? CALLING : whereabouts(n.id, hour, day);
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
    const now = this.ctx.clock.now();
    const hour = hourOf(now);
    const day = dayKey(now);
    this.chatMs += deltaMs;
    for (const n of this.neighbours) {
      const goal = plan.get(n.id)!;
      if (n.zone !== where) {
        this.keepAway(n, goal, where);
        n.rest();
        continue;
      }
      const t0 = n.tile;
      const away = Math.max(Math.abs(t0.tx - me.tx), Math.abs(t0.ty - me.ty));
      const near = away <= NEAR_TILES;
      // At their own stop, they stroll round it now and then, and sit or work at it (V1's E3).
      const calling = this.callNow(n.id, hour, day) !== null;
      const stop = goal.zone === n.zone && !calling ? stopNow(n.id, hour, day) : null;
      const held = n.id === this.talking || n.id === heading;
      if (held) n.hold();
      else {
        const to = goal.zone === n.zone ? goal : this.wayOut(n, goal);
        if (!to) continue;
        const aim = stop ? n.roam(goal, deltaMs, near, (k) => this.strollFrom(n.id, goal, k)) : to;
        n.step(deltaMs, aim, this.zones.get(n.zone));
      }
      n.notice(away, deltaMs);
      const settled = stop !== null && n.settled;
      n.seat = settled && stop.sits !== false ? this.seatBeside(n.zone, goal) : null;
      n.working = settled && !near && stop.doing ? stop.doing : null;
      if (n.seat) n.facing = n.seat.facing;
      else if (held || near) n.face(her.x, her.y);
      else if (n.working) n.facing = WORKS[n.working].faces;
      else this.faceHost(n);
    }
  }

  /** Where a neighbour's `k`th stroll from their stop goes, if anywhere. */
  private strollFrom(id: VillagerId, stop: Place, k: number): Tile | null {
    return strollTo(id, k, this.strollsAround(stop));
  }

  /**
   * The tiles a stroll from a stop may go to (V1's E3): worked out once a stop, and kept to those
   * still open today, since a mound or her yard's pieces can stand on one.
   */
  strollsAround(stop: Place): readonly Tile[] {
    const key = `${stop.zone}:${stop.tx},${stop.ty}`;
    const zone = this.zones.get(stop.zone);
    let tiles = this.strollsFrom.get(key);
    if (!tiles) {
      const taken = stopsIn(stop.zone).filter((t) => t.tx !== stop.tx || t.ty !== stop.ty);
      const ground = {
        canWalk: zone.canWalk.bind(zone),
        width: zone.width,
        height: zone.height,
        needed: (tx: number, ty: number) => this.needed(zone, { tx, ty }),
      };
      tiles = strollTiles(ground, stop, taken);
      this.strollsFrom.set(key, tiles);
    }
    return tiles.filter((t) => zone.canWalk(t.tx, t.ty));
  }

  /**
   * A tile she goes to to use something, kept clear of strolls: a way out or a mat, a door step,
   * or the way up to a seat.
   */
  private needed(zone: Zone, at: Tile): boolean {
    if (zone.doorAt(at, undefined)) return true;
    return SIDES.some((d) => {
      const prop = zone.propAt(at.tx + d.tx, at.ty + d.ty);
      if (!prop) return false;
      if (PROP_SEATS[prop.id]) return true;
      const step = zone.doorAt(at, prop) ? doorStep(prop) : null;
      return step !== null && step.tx === at.tx && step.ty === at.ty;
    });
  }

  /**
   * A seat beside a stop for whoever keeps it (V1's E3): a bench, log or stump outdoors, a chair
   * or settee in a room, on the side nearest first: above, then either side, then below. Found
   * once a stop: the seats outdoors and in the buildings stay where they are.
   */
  private seatBeside(zoneId: ZoneId, at: Tile): Seat | null {
    const key = `${zoneId}:${at.tx},${at.ty}`;
    let seat = this.seats.get(key);
    if (seat === undefined) {
      seat = this.findSeat(zoneId, at);
      this.seats.set(key, seat);
    }
    return seat;
  }

  private findSeat(zoneId: ZoneId, at: Tile): Seat | null {
    const zone = this.zones.get(zoneId);
    const room = this.zones.inside(zoneId);
    for (const d of SIDES) {
      const tx = at.tx + d.tx;
      const ty = at.ty + d.ty;
      const prop = zone.propAt(tx, ty);
      const row = prop && PROP_SEATS[prop.id];
      if (prop && row) return seatOn(prop, row, 'down', at);
      const thing = room?.thingAt(tx, ty);
      if (!thing || !('piece' in thing)) continue;
      const { id, turn } = thing.piece;
      const seat = FURNITURE[id].seat;
      if (seat) return seatOn(boxOf(thing), seat, seatFacing(id, turn), at);
    }
    return null;
  }

  /**
   * What two neighbours standing together in a place say just now (V1's E3): a guest and whoever
   * they're visiting, or any two standing still side by side, each in one pair; a bubble at a
   * beat, taking turns. `beat` names it, so the view shows each once.
   */
  chatter(zone: ZoneId): { by: VillagerId; chat: Chatter; beat: string }[] {
    const still = this.neighboursIn(zone).filter(
      (n) => !n.moving && n.id !== this.talking && n.waveMs === 0,
    );
    const paired = new Set<VillagerId>();
    const said: { by: VillagerId; chat: Chatter; beat: string }[] = [];
    for (const a of still) {
      if (paired.has(a.id)) continue;
      const b = still.find((o) => o !== a && !paired.has(o.id) && together(a, o));
      if (!b) continue;
      paired.add(a.id).add(b.id);
      const pair = [a.id, b.id] as const;
      const beat = Math.floor(this.chatMs / CHAT_BEAT_MS);
      const on = chatOn(pair, beat);
      if (on) said.push({ ...on, beat: `${a.id}+${b.id}:${beat}` });
    }
    return said;
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
    const where = whereabouts(n.id, hourOf(now), dayKey(now));
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
    const { friends } = this.keeps;
    const before = friends.of(id);
    const bonus = before.talked !== day;
    if (bonus) this.befriend(id, TALK_POINTS, { talked: day });
    this.pending = null;
    // After their hello, a heart moment or their question comes first (V1's P2).
    const told = talks > 0 ? this.tell(id, day) : null;
    const puff = !told && puffsOnTalk(id, day, talks);
    const hour = hourOf(now);
    const at = puff || told ? null : this.atHappening(id, hour, day, talks);
    const dropping = puff || at || told ? null : this.dropsBy(id, hour, day, talks);
    const small = puff || at || dropping || told ? null : this.keeps.smallEvents.talk(id);
    const around = this.keeps.scene?.();
    const own =
      puff || at || dropping || small || told
        ? null
        : talkLine(id, {
            hearts: friends.hearts(id),
            day,
            hour,
            talks,
            said: today.said,
            scene: around ? { ...around, ...this.between(id, before) } : undefined,
            opened: before.opened ?? [],
          });
    const said = told
      ? told.line
      : puff
        ? puffLine(id, day, talks)
        : (at?.line ?? dropping ?? small?.line ?? own!.line);
    this.talks.set(id, { day, count: talks + 1, said: [...today.said, said] });
    if (own) this.remember(id, before, own.topic, own.opener);
    if (puff) this.puffed = { id, until: now + PUFF_MS };
    const say = (text: string) => fill(text, { name: this.name, years: yearsMarried(day) });
    const chat: Chat = { line: say(said), bonus, puff };
    const treat = talks === 0 ? this.treat(id, day) : null;
    if (treat) chat.gift = treat;
    if (at?.gift) chat.gift = at.gift;
    if (small?.candy) chat.candy = small.candy;
    // Her voice (V1's P2): the rest of a moment, and what she can say back to it, to their
    // question, or to a line on a topic she can answer.
    if (told?.more.length) chat.more = told.more.map(say);
    if (told?.gift) chat.gift = told.gift;
    const replies = told?.replies ?? (own ? repliesTo(id, own.topic) : []);
    if (replies.length > 0) {
      this.pending = { id, replies };
      chat.replies = replies.map((r) => say(r.say));
      if (told) chat.asked = true;
    }
    if (!told && this.hasToTell(id, day)) chat.waiting = true;
    return chat;
  }

  /**
   * What she says back (V1's P2): the `k`th of the chips on their last line, and what they say to
   * it. Her answer to their question is kept. Null if there's nothing to answer.
   */
  reply(id: VillagerId, k: number): Chat | null {
    const answering = this.pending?.id === id ? this.pending.replies[k] : undefined;
    if (!answering) return null;
    this.pending = null;
    if (answering.answer) this.keeps.friends.update(id, { answered: answering.answer });
    const day = dayKey(this.ctx.clock.now());
    const line = fill(answering.back, { name: this.name, years: yearsMarried(day) });
    return { line, bonus: false, puff: false };
  }

  /**
   * A heart moment a neighbour has to tell her (V1's P2), the next of theirs she has reached, one a
   * day; or else their question, until she answers it, asked once a day. Telling a moment keeps it
   * told, and hands her whatever comes with it.
   */
  private tell(id: VillagerId, day: string): Told | null {
    const { friends, bag } = this.keeps;
    const friendship = friends.of(id);
    const seen = friendship.moments ?? [];
    const moment = this.told.get(id) === day ? null : momentDue(id, friends.hearts(id), seen);
    if (moment) {
      this.told.set(id, day);
      friends.update(id, { moments: [...seen, moment.hearts] });
      if (moment.gift) {
        bag.add(moment.gift, 1);
        this.ctx.events.emit('bag', bag.contents);
      }
      const [line, ...more] = moment.lines;
      return { line: line!, more, replies: moment.replies ?? [], gift: moment.gift };
    }
    const asking =
      this.asked.get(id) === day ? null : questionDue(id, friends.hearts(id), friendship.answered);
    if (!asking) return null;
    this.asked.set(id, day);
    const replies = asking.answers.map((a) => ({ say: a.say, back: a.back, answer: a.id }));
    return { line: asking.ask, more: [], replies };
  }

  /** Whether a neighbour has a moment to tell her or a question to ask on her next talk today. */
  private hasToTell(id: VillagerId, day: string): boolean {
    const { friends } = this.keeps;
    const f = friends.of(id);
    const hearts = friends.hearts(id);
    const moment = this.told.get(id) !== day && momentDue(id, hearts, f.moments ?? []) !== null;
    return moment || (this.asked.get(id) !== day && questionDue(id, hearts, f.answered) !== null);
  }

  /** A best friend's letter now and then (V1's P2), looked for the first time a day is stepped. */
  check(): void {
    const day = dayKey(this.ctx.clock.now());
    if (day === this.wroteOn) return;
    this.wroteOn = day;
    const { friends, mailbox } = this.keeps;
    for (const id of VILLAGER_IDS) {
      if (friends.hearts(id) >= BEST_HEARTS && writesOn(id, day)) {
        mailbox.post(bestLetterId(id, day), day);
      }
    }
  }

  /**
   * What's between her and a neighbour as she talks to them (V1's P1), from their friendship as it
   * was before this talk: the last gift and its day, the last talk before today, a band reached
   * since they last spoke to her, and the bracelet of hers they wear.
   */
  private between(id: VillagerId, before: Friendship): Between {
    const { gave, gifted, talked, spoke, wears } = before;
    const hearts = this.keeps.friends.hearts(id);
    return {
      gave: gave && gifted ? { item: gave, day: gifted } : null,
      talked,
      reached: bandReached(spoke, hearts),
      wears: wears ?? null,
      band: bandOf(hearts),
      answer: answerSaid(id, before.answered),
    };
  }

  /**
   * What a neighbour keeps of a talk (V1's P1): the line they opened the day with, and how close
   * they were, once a band reached has been said (or there wasn't one), so it's said just once.
   */
  private remember(
    id: VillagerId,
    before: Friendship,
    topic: string | null,
    opener: number | null,
  ): void {
    const { friends } = this.keeps;
    const hearts = friends.hearts(id);
    const change: Partial<Friendship> = {};
    if (opener !== null) change.opened = [...(before.opened ?? []), opener].slice(-OPENERS_KEPT);
    if (topic === 'band' || bandReached(before.spoke, hearts) === null) change.spoke = hearts;
    friends.update(id, change);
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
   * What a neighbour says first when she finds them visiting her at home, once a visit, unless
   * the day's own line comes first.
   */
  private dropsBy(id: VillagerId, hour: number, day: string, talks: number): string | null {
    // A best friend who called by choice says so (V1's P2).
    if (this.callNow(id, hour, day)) {
      if (talks === 0 && dayLine(id, day)) return null;
      const key = `${day}@call`;
      if (this.heard.get(id) === key) return null;
      this.heard.set(id, key);
      return BEST_CALLS[id] ?? null;
    }
    const visit = visitOf(id, hour, day);
    const where = whereabouts(id, hour, day);
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
    this.befriend(id, GIFT_POINTS[reaction], { gifted: day, gave: item, ...wears });
    if (reaction === 'loved') this.ctx.signals.emit('thrilled', { by: 'gift' });
    this.ctx.moments.push({ kind: 'gave', villager: id, item, reaction });
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

/** Where a best friend calling by choice is: at her house, just inside the door (V1's P2). */
const CALLING: Whereabouts = { zone: 'home', beside: null, host: 'her' };

/** Something she can say back, and what's kept if it's her answer to their question. */
type Answering = Reply & { answer?: string };

/** A heart moment or a question, told on a talk (V1's P2). */
interface Told {
  line: string;
  more: string[];
  replies: readonly Answering[];
  gift?: ItemId;
}

/** Above, either side, then below: where to look round a tile for a seat or a door. */
const SIDES: readonly Tile[] = [
  { tx: 0, ty: -1 },
  { tx: -1, ty: 0 },
  { tx: 1, ty: 0 },
  { tx: 0, ty: 1 },
];

/** Two standing side by side, or a tile apart corner to corner. */
function together(a: Neighbour, b: Neighbour): boolean {
  const ta = a.tile;
  const tb = b.tile;
  return Math.max(Math.abs(ta.tx - tb.tx), Math.abs(ta.ty - tb.ty)) <= 1;
}

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
