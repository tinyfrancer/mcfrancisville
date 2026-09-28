import { ZONE_IDS, ZONES } from '../../data/zones';
import { dayKey } from '../../systems/clock';
import {
  holds,
  linksBetween,
  openFromStart,
  outsideOf,
  type UnlockFacts,
} from '../../systems/zones';
import type { Tile } from '../../systems/pathfinding';
import type { Facing, ZoneId } from '../../types/ids';
import type { Atlas } from '../Atlas';
import type { WorldContext } from '../context';
import type { WorldEvent } from '../events';
import type { Movement } from '../Movement';
import type { Crossing, Zone } from '../zones/Zone';
import type { Zones } from '../zones/Zones';
import type { Mailbox } from './Mailbox';

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

  constructor(ctx: WorldContext, reads: TravelReads, start: ZoneId) {
    this.ctx = ctx;
    this.reads = reads;
    this.where = start;
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
      this.ctx.moments.push({ kind: 'opened', zone });
      this.ctx.events.emit('atlas', this.reads.atlas);
    }
  }

  /**
   * She has arrived at a way out: through it, if the place beyond is open, or told what would open
   * it if it's shut.
   */
  cross(crossing: Crossing): WorldEvent {
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
    this.ctx.moments.push(this.arrive(to, entry.tile, entry.facing));
    return true;
  }

  private arrive(to: ZoneId, tile: Tile, facing: Facing): WorldEvent {
    const from = this.where;
    this.where = to;
    this.reads.movement.standAt(tile, facing);
    this.ctx.signals.emit('crossed', { from, to });
    this.ctx.events.emit('scene', to);
    // Only a place on the world map is found: going into a building is just going in.
    if (ZONES[to].onMap && this.reads.atlas.find(to)) {
      this.ctx.moments.push({ kind: 'found', zone: to });
      if (ZONES[to].letter) this.reads.mailbox.post(`found:${to}`, dayKey(this.ctx.clock.now()));
      this.ctx.events.emit('atlas', this.reads.atlas);
    }
    return { kind: 'entered', scene: to };
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
