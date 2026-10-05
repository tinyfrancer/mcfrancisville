import { ZONE_IDS, ZONES } from '../../data/zones';
import { dayKey } from '../../systems/clock';
import {
  holds,
  linksBetween,
  openFromStart,
  outsideOf,
  sideOf,
  type UnlockFacts,
} from '../../systems/zones';
import type { Tile } from '../../systems/pathfinding';
import { knowFairground } from '../../systems/venues';
import type { Facing, RoomId, ZoneId } from '../../types/ids';
import type { Atlas } from '../Atlas';
import type { WorldContext } from '../context';
import type { WorldEvent } from '../events';
import type { Movement } from '../Movement';
import type { Crossing, Zone } from '../zones/Zone';
import type { Zones } from '../zones/Zones';
import type { Mailbox } from './Mailbox';
import type { SavedPlayer } from '../../persistence/SaveState';

/** A place as the world map shows it. */
export interface Place {
  id: ZoneId;
  name: string;
  blurb: string;
  icon: string;
  /** Where it sits on the map, in percent. */
  at: { x: number; y: number };
  /** Whether she has been; one she hasn't is a question mark on the path from one she has. */
  found: boolean;
  open: boolean;
  /** Whether she is there now (at home, or in a building, counts as in the place outside). */
  here: boolean;
  /** What opens it, while it's shut. */
  hint: string | null;
}

/** A way out of the place she's in, as the world map lists it (0.2's C1). */
export interface WayOut {
  to: ZoneId;
  /** Which edge of the place it's off. */
  side: 'north' | 'south' | 'east' | 'west';
  name: string;
  icon: string;
  /** Whether she has been there; the map doesn't name a place she hasn't. */
  found: boolean;
  /** A place the world map keeps quiet about until she finds it. */
  secret: boolean;
}

/** What travelling reads of the rest of the world. */
export interface TravelReads {
  zones: Zones;
  atlas: Atlas;
  movement: Movement;
  mailbox: Mailbox;
  /** What the places' unlock rules ask about. */
  facts: UnlockFacts;
}

/**
 * Where she is, and going from place to place (decisions.md 90, 91): through a door or off the edge
 * of a map, or by the world map to anywhere she has found. It finds places as she first gets to
 * them, and opens shut ones the moment what opens them holds. Every crossing goes through here.
 */
export class Travel {
  private readonly ctx: WorldContext;
  private readonly reads: TravelReads;
  private where: ZoneId;
  /** Where she last flew home from by broom (0.2's P1), to fly back to; kept in the save. */
  private flewFrom: SavedPlayer | null;

  constructor(
    ctx: WorldContext,
    reads: TravelReads,
    start: ZoneId,
    left: SavedPlayer | null = null,
  ) {
    this.ctx = ctx;
    this.reads = reads;
    this.where = start;
    this.flewFrom = left && (ZONE_IDS as string[]).includes(left.zone) ? left : null;
    knowFairground(this.isOpen('fairground'));
  }

  /** Where she flew home from, if she hasn't flown back there yet. */
  get left(): SavedPlayer | null {
    return this.flewFrom;
  }

  /** The place she is in now. */
  get here(): ZoneId {
    return this.where;
  }

  get zone(): Zone {
    return this.reads.zones.get(this.where);
  }

  isOpen(zone: ZoneId): boolean {
    return openFromStart(zone) || this.reads.atlas.isOpened(zone);
  }

  /** Opens any shut place whose rule has come to hold, with a moment to say so. */
  check(): void {
    for (const zone of ZONE_IDS) {
      if (this.isOpen(zone) || !holds(ZONES[zone].unlock, this.reads.facts)) continue;
      this.reads.atlas.open(zone);
      if (zone === 'fairground') knowFairground(true);
      this.ctx.moments.push({ kind: 'opened', zone });
      this.ctx.events.emit('atlas', this.reads.atlas);
    }
  }

  /**
   * She has arrived at a way out: through it, if the place beyond is open, or told what would open
   * it if it's shut.
   */
  cross(crossing: Crossing): WorldEvent {
    if (crossing.room) return this.within(crossing.room);
    if (!this.isOpen(crossing.to)) return { kind: 'shut', zone: crossing.to };
    const entry = this.reads.zones.get(crossing.to).entry(this.where, crossing.along);
    return this.arrive(crossing.to, entry.tile, entry.facing);
  }

  /**
   * Goes straight to a place by the world map, arriving where it's first come to. False if she's
   * there already, or it isn't somewhere she has found and can get into.
   */
  go(to: ZoneId): boolean {
    const here = outsideOf(this.where);
    if (to === here || !this.reads.atlas.hasFound(to) || !this.isOpen(to) || !ZONES[to].onMap) {
      return false;
    }
    const entry = this.reads.zones.get(to).entry(null);
    this.ctx.moments.push({ kind: 'flew', to });
    this.ctx.moments.push(this.arrive(to, entry.tile, entry.facing));
    return true;
  }

  /**
   * Swoops her home by broom, onto her mat (0.2's P1), keeping the spot she flew from so the
   * stand by the door can fly her back to it. False if she's home already.
   */
  home(call?: string): boolean {
    if (this.where === 'home') return false;
    const { tile, player } = this.reads.movement;
    this.flewFrom = { zone: this.where, tx: tile.tx, ty: tile.ty, facing: player.facing };
    const entry = this.reads.zones.get('home').entry(null);
    this.ctx.moments.push({ kind: 'flew', to: 'home', ...(call && { call }) });
    this.ctx.moments.push(this.arrive('home', entry.tile, entry.facing));
    return true;
  }

  /**
   * Flies her back to exactly where she flew home from, or to where a place is first come to if
   * that spot can't be stood on any more. False if there's nowhere kept, or it has since shut.
   */
  back(call?: string): boolean {
    const spot = this.flewFrom;
    if (!spot || spot.zone === this.where || !this.isOpen(spot.zone)) return false;
    const zone = this.reads.zones.get(spot.zone);
    const stands = zone.canWalk(spot.tx, spot.ty);
    const entry = zone.entry(null);
    this.flewFrom = null;
    this.ctx.moments.push({ kind: 'flew', to: spot.zone, ...(call && { call }) });
    this.ctx.moments.push(
      stands
        ? this.arrive(spot.zone, { tx: spot.tx, ty: spot.ty }, spot.facing)
        : this.arrive(spot.zone, entry.tile, entry.facing),
    );
    return true;
  }

  /** Through a doorway into another of her rooms, still at home (0.3's H4). */
  private within(room: RoomId): WorldEvent {
    const entry = this.reads.zones.home.through(room);
    return this.arrive('home', entry.tile, entry.facing);
  }

  private arrive(to: ZoneId, tile: Tile, facing: Facing): WorldEvent {
    const from = this.where;
    if (from === 'home' && to !== 'home') this.reads.zones.home.leave();
    this.where = to;
    this.reads.movement.standAt(tile, facing);
    this.ctx.signals.emit('crossed', { from, to });
    this.ctx.events.emit('scene', to);
    // Only a place on the world map is found, or a room with a letter for the first time she's in
    // it (the castle's hall): going into any other building is just going in.
    const { onMap, letter } = ZONES[to];
    if ((onMap || letter) && this.reads.atlas.find(to)) {
      if (onMap) this.ctx.moments.push({ kind: 'found', zone: to });
      if (letter) this.reads.mailbox.post(`found:${to}`, dayKey(this.ctx.clock.now()));
      this.ctx.events.emit('atlas', this.reads.atlas);
    }
    return { kind: 'entered', scene: to };
  }

  /**
   * The ways out of the place she's in, or of the place outside the building she's in.
   */
  waysOut(): WayOut[] {
    const { map } = this.reads.zones.map(outsideOf(this.where));
    return map.exits.map((exit) => ({
      to: exit.to,
      side: sideOf(exit, map),
      name: ZONES[exit.to].name,
      icon: ZONES[exit.to].icon,
      found: this.reads.atlas.hasFound(exit.to),
      secret: ZONES[exit.to].secret === true,
    }));
  }

  /**
   * The places on the world map: every one she has found, and a question mark for each joined to
   * one she has, unless it's a secret.
   */
  places(): Place[] {
    const { atlas } = this.reads;
    const links = linksBetween();
    const here = outsideOf(this.where);
    const places: Place[] = [];
    for (const id of ZONE_IDS) {
      const row = ZONES[id];
      if (!row.onMap) continue;
      const found = atlas.hasFound(id);
      const beside = links.some(
        ([a, b]) => (a === id && atlas.hasFound(b)) || (b === id && atlas.hasFound(a)),
      );
      if (!found && (!beside || row.secret)) continue;
      const open = this.isOpen(id);
      places.push({
        id,
        name: row.name,
        blurb: row.blurb,
        icon: row.icon,
        at: row.onMap,
        found,
        open,
        here: id === here,
        hint: open ? null : (row.shut ?? null),
      });
    }
    return places;
  }
}
