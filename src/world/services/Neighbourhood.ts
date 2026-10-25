import { FURNITURE } from '../../data/furniture';
import { doorStep } from '../../data/maps';
import { PROP_SEATS } from '../../data/seats';
import { WORKS } from '../../data/work';
import { HAPPENING_IDS, HAPPENINGS } from '../../data/happenings';
import { VILLAGER_IDS, type StopLife } from '../../data/villagers';
import { dayKey, hourOf } from '../../systems/clock';
import { puffingAt, specialDayOf } from '../../systems/friendship';
import { callNow } from '../../systems/calls';
import { HUSBAND } from '../../data/cody';
import { atHers, isHusband } from '../../systems/cody';
import { footprint } from '../../systems/decor';
import { inTown } from '../../systems/mayor';
import type { Tile } from '../../systems/pathfinding';
import { happeningOf, happeningsAt, venueOf } from '../../systems/happenings';
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
import { nextZoneToward } from '../../systems/zones';
import type { HappeningId, VillagerId, WorkId, ZoneId } from '../../types/ids';
import type { WorldContext } from '../context';
import type { Friends } from '../Friends';
import { tileOf } from '../Movement';
import { Neighbour } from '../Neighbour';
import { boxOf, worthVisiting } from '../zones/RoomZone';
import type { Zone } from '../zones/Zone';
import type { Zones } from '../zones/Zones';
import { seatFacing, seatOn, type Seat } from './Sitting';
import type { Talk } from './Talk';

/** What the walks read: how close each is, and the talk she's having, which they wait for. */
export interface NeighbourhoodKeeps {
  /** How close each is to her, for a best friend's call (V1's P2). */
  friends: Friends;
  /** Talking with them (1.1's W3): who she's talking to, and what the talk sheet asks here. */
  talk: Talk;
  /**
   * Somewhere a neighbour is off to instead of where the clock says, and the job they do there
   * (V1's P4: Ollie to her mailbox with the post).
   */
  errand?: (id: VillagerId) => Errand | null;
  /** Where her pets are, in the place she is, for Cody to go and pat one (V1's P5). */
  pets?: () => readonly Tile[];
}

/** Where a neighbour has gone instead of their stop, and what they do once there (V1's P4). */
export interface Errand {
  place: Place;
  doing: WorkId;
}

/** Where a neighbour is, and what they're there for, if it's more than their day (0.2's U3). */
export interface Whereabout {
  zone: ZoneId;
  doing: { happening: HappeningId } | { visiting: VillagerId | 'her' } | { party: true } | null;
}

/**
 * Her neighbours (decisions.md 56–61): where each walks by the clock, and what they're about at
 * their stops. Where they're headed is `systems/schedules.ts`'s; walking there, through any door,
 * is this. Talking with them is `Talk` (1.1's W3), which a talk's reads here hand on to.
 */
export class Neighbourhood {
  private readonly ctx: WorldContext;
  private readonly keeps: NeighbourhoodKeeps;
  private readonly zones: Zones;
  /** The place she is in now. */
  private readonly here: () => ZoneId;
  /** Every neighbour; none in a town without them (a test's small map). */
  private readonly everyone: Neighbour[];
  /** Where each stop's strolls may go, by place and stop (V1's E3). */
  private strollsFrom = new Map<string, Tile[]>();
  /** The seat beside each stop, by place and tile, or null for none. */
  private seats = new Map<string, Seat | null>();
  /** Stepped time, the beat of their chatter. */
  private chatMs = 0;

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

  /**
   * Her neighbours, wherever each is: everyone lives in town (decision 211), and the mayor once
   * she has met him (V1's P3b).
   */
  get neighbours(): Neighbour[] {
    return this.everyone.filter((n) => inTown(n.id));
  }

  /**
   * Puts a neighbour straight where the clock says they should be, as the town is when it's made:
   * the mayor, the moment the dust sheet comes off (V1's P3b), rather than walking in at the door.
   */
  settle(id: VillagerId): void {
    const goal = this.plan().get(id);
    if (!goal) return;
    const n = this.neighbour(id);
    n.zone = goal.zone;
    n.place(goal);
  }

  /** The neighbours in a place now. */
  neighboursIn(zone: ZoneId): Neighbour[] {
    return this.neighbours.filter((n) => n.zone === zone);
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
    if (this.callNow(id, hour, day) || this.eveningAtHers(id, hour, day)) {
      return { zone, doing: { visiting: 'her' } };
    }
    const visit = visitOf(id, hour, day);
    return { zone, doing: visit ? { visiting: visit.host } : null };
  }

  /**
   * A best friend's call at her house by choice (V1's P2, `systems/calls.ts`), if they're paying
   * one now. Never Cody's: his evenings at hers are his own (P5).
   */
  private callNow(id: VillagerId, hour: number, day: string): Visit | null {
    return callNow(id, this.keeps.friends.hearts(id), hour, day);
  }

  /** Whether her husband is spending the evening at hers now (V1's P5, `systems/cody.ts`). */
  private eveningAtHers(id: VillagerId, hour: number, day: string): boolean {
    return isHusband(id) && atHers(hour, day);
  }

  /**
   * Where Cody settles at hers of an evening (V1's P5): in front of a seat in the room she's in,
   * the widest first, so he sits down on it; or null for a room with nowhere to sit.
   */
  private sofa(): { at: Tile; seat: Seat } | null {
    const home = this.zones.home;
    const mat = home.entry().tile;
    const seats = [...home.seats]
      .map((piece) => ({ piece, ...footprint(piece.id, piece.turn) }))
      .filter(({ piece }) => seatFacing(piece.id, piece.turn) === 'down')
      .sort((a, b) => b.w - a.w);
    for (const { piece, w, h } of seats) {
      const ty = piece.ty + h;
      for (let dx = 0; dx < w; dx++) {
        const at = { tx: piece.tx + dx, ty };
        if (!home.canWalk(at.tx, at.ty) || (at.tx === mat.tx && at.ty === mat.ty)) continue;
        const box = { tx: piece.tx, ty: piece.ty, w, h };
        return { at, seat: seatOn(box, FURNITURE[piece.id].seat!, 'down', at) };
      }
    }
    return null;
  }

  /** An open tile beside one of her pets where she is, for a stroll to go and pat it (V1's P5). */
  private besidePet(k: number): Tile | null {
    const pets = this.keeps.pets?.() ?? [];
    const pet = pets[k % Math.max(1, pets.length)];
    if (!pet) return null;
    const zone = this.zones.get(this.here());
    const at = besideOf(zone, pet, []);
    return at.tx === pet.tx && at.ty === pet.ty ? null : at;
  }

  /**
   * Cody patting one of her pets at hers (V1's P5): standing still beside it, off his seat. The
   * pet's tile, and a beat so the view shows a heart once a pat; null otherwise.
   */
  patting(): { pet: Tile; beat: string } | null {
    if (this.here() !== 'home' || !this.everyone.length) return null;
    const cody = this.neighbour(HUSBAND);
    if (cody.zone !== 'home' || cody.moving || cody.seat || cody.id === this.keeps.talk.talkingTo)
      return null;
    const t = cody.tile;
    const pet = (this.keeps.pets?.() ?? []).find(
      (p) => Math.max(Math.abs(p.tx - t.tx), Math.abs(p.ty - t.ty)) <= 1,
    );
    return pet ? { pet, beat: `${pet.tx},${pet.ty}@${Math.floor(this.chatMs / PAT_MS)}` } : null;
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
      const errand = this.keeps.errand?.(n.id);
      if (errand) {
        plan.set(n.id, errand.place);
        continue;
      }
      // Her husband settles at hers of an evening, on a seat if there is one (V1's P5).
      if (this.eveningAtHers(n.id, hour, day)) {
        const sofa = this.sofa();
        if (sofa) plan.set(n.id, { zone: 'home', ...sofa.at });
        else guests.push([n.id, 'home', null]);
        continue;
      }
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
      const errand = this.keeps.errand?.(n.id) ?? null;
      // Cody at hers of an evening potters as he would at a stop of his own (V1's P5).
      const evening = this.eveningAtHers(n.id, hour, day);
      const stop =
        goal.zone !== n.zone || calling || errand
          ? null
          : evening
            ? AT_HERS
            : stopNow(n.id, hour, day);
      const held = n.id === this.keeps.talk.talkingTo || n.id === heading;
      if (held) n.hold();
      else {
        const to = goal.zone === n.zone ? goal : this.wayOut(n, goal);
        if (!to) continue;
        const pick = (k: number) =>
          (evening && k % 3 === 1 ? this.besidePet(k) : null) ?? this.strollFrom(n.id, goal, k);
        const aim = stop ? n.roam(goal, deltaMs, near, pick) : to;
        n.step(deltaMs, aim, this.zones.get(n.zone));
      }
      n.notice(away, deltaMs);
      const settled = stop !== null && n.settled;
      n.seat = settled && stop.sits !== false ? this.seatBeside(n.zone, goal) : null;
      // At their stop, a happening they host, or an errand, their job once they're there (V1's P4).
      const there =
        !n.moving && goal.zone === n.zone && n.tile.tx === goal.tx && n.tile.ty === goal.ty;
      const job = stop
        ? settled
          ? stop.doing
          : undefined
        : there
          ? this.jobAt(n.id, errand)
          : null;
      n.working = !near && job ? job : null;
      if (n.seat) n.facing = n.seat.facing;
      else if (held || near) n.face(her.x, her.y);
      else if (n.working) n.facing = WORKS[n.working].faces;
      else this.faceHost(n);
    }
  }

  /** The job a neighbour does away from their stop: an errand's, or a happening's they host. */
  private jobAt(id: VillagerId, errand: Errand | null): WorkId | null {
    if (errand) return errand.doing;
    // Asked each step of everyone standing at a happening, so only of those who host a job.
    if (!WORKING_HOSTS.has(id)) return null;
    const now = this.ctx.clock.now();
    const day = dayKey(now);
    const at = specialDayOf(day) === 'birthday' ? null : happeningOf(id, hourOf(now), day);
    const row = at ? HAPPENINGS[at] : null;
    return row?.doing && row.who[0] === id ? row.doing : null;
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
    // Her rooms change as she decorates, so a seat at hers is looked for afresh (V1's P5).
    if (zoneId === 'home') {
      const sofa = this.sofa();
      return sofa && sofa.at.tx === at.tx && sofa.at.ty === at.ty ? sofa.seat : null;
    }
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
      (n) => !n.moving && n.id !== this.keeps.talk.talkingTo && n.waveMs === 0,
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

  /** Whoever in a place has just let one go, for the view to draw the puff. */
  puffing(zone: ZoneId): Neighbour[] {
    const now = this.ctx.clock.now();
    const puffed = this.keeps.talk.puffedNow(now);
    return this.neighboursIn(zone).filter((n) => puffed === n.id || puffingAt(n.id, now));
  }
}

const ZERO: Tile = { tx: 0, ty: 0 };

/** Whoever hosts a happening with a job to do at it (V1's P4): Nessa's lanterns, say. */
const WORKING_HOSTS = new Set(
  HAPPENING_IDS.flatMap((id) => (HAPPENINGS[id].doing ? [HAPPENINGS[id].who[0]!] : [])),
);

/** Where a best friend calling by choice is: at her house, just inside the door (V1's P2). */
const CALLING: Whereabouts = { zone: 'home', beside: null, host: 'her' };

/** Cody at hers of an evening potters as at a stop of his own, and sits (V1's P5). */
const AT_HERS: StopLife = { sits: true };

/** How long a pat lasts, for its heart. */
const PAT_MS = 8000;

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
