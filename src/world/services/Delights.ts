import { BLESS_YOU } from '../../data/delights';
import { FLYER_HOURS } from '../../data/sky';
import type { Weather } from '../../data/weather';
import { dayKey, hourOf, windowKey } from '../../systems/clock';
import {
  blesser,
  cawKey,
  fliersAbout,
  flierFor,
  firefliesOut,
  PERCH_AFTER_MS,
  PERCH_EVERY_MS,
  scarecrowBy,
  SNEEZE_KEY,
  sneezeAfter,
  tickles,
} from '../../systems/delights';
import { fill } from '../../systems/friendship';
import { tileAt } from '../../systems/grid';
import type { Tile } from '../../systems/pathfinding';
import { actionMs } from '../../systems/poses';
import type { CritterId, MapZoneId } from '../../types/ids';
import type { WorldContext } from '../context';
import type { Movement } from '../Movement';
import type { Zones } from '../zones/Zones';
import type { Neighbourhood } from './Neighbourhood';
import type { Takings } from './Takings';

/** What the small delights read of the rest of the world. */
export interface DelightsReads {
  zones: Zones;
  takings: Takings;
  neighbourhood: Neighbourhood;
  movement: () => Movement;
  /** The place outdoors she's in, or null indoors. */
  outside: () => MapZoneId | null;
  weather: () => Weather;
  /** A spring in her step from a meal (phase R): above one, she's running, too quick for fireflies. */
  pace: () => number;
  name: () => string;
}

/** The crow on a scarecrow, cawing at her: which scarecrow, and when (on the clock). */
export interface Caw {
  place: MapZoneId;
  tile: Tile;
  at: number;
}

/**
 * Small delights outdoors (1.6's X5, decision 384): a butterfly or moth landing on her hat when
 * she stands still a while where one's about, flying off as she moves; fireflies round her on
 * summer nights; the crow on the scarecrow cawing as she walks past, once a window; and a sneeze
 * in the long grass in spring, once a window, blessed by a neighbour in earshot. Each is a moment
 * for the view and the sound, and none is kept but what the day's takings keep.
 */
export class Delights {
  private readonly ctx: WorldContext;
  private readonly reads: DelightsReads;
  /** How long she has stood still where she is outdoors. */
  private stillMs = 0;
  private lastPerch = -Infinity;
  private perches = 0;
  private perch: CritterId | null = null;
  private place: MapZoneId | null = null;
  private lastTile: Tile | null = null;
  /** The tickly tiles she has walked onto this window, towards a sneeze. */
  private tickled = { window: '', count: 0 };
  private caw: Caw | null = null;

  constructor(ctx: WorldContext, reads: DelightsReads) {
    this.ctx = ctx;
    this.reads = reads;
  }

  /** The butterfly or moth on her hat now, if one has landed. */
  perched(): CritterId | null {
    return this.perch;
  }

  /** The last caw at her, while she's in its place. */
  cawed(): Caw | null {
    return this.caw && this.caw.place === this.reads.outside() ? this.caw : null;
  }

  /** Whether fireflies are gathered round her now. */
  fireflies(): boolean {
    const place = this.reads.outside();
    if (!place) return false;
    const p = this.reads.movement().player;
    if (p.moving && this.reads.pace() > 1) return false;
    const zone = this.reads.zones.outdoor(place);
    const t = this.reads.movement().tile;
    const now = this.ctx.clock.now();
    const ground = zone ? tileAt(zone.map, t.tx, t.ty) : undefined;
    return firefliesOut(dayKey(now), hourOf(now), ground, this.reads.weather());
  }

  step(deltaMs: number): void {
    const place = this.reads.outside();
    const movement = this.reads.movement();
    const p = movement.player;
    if (place !== this.place) {
      this.place = place;
      this.stillMs = 0;
      this.lastTile = null;
      this.flyOff();
    }
    if (!place) return;
    if (p.moving) {
      this.stillMs = 0;
      this.flyOff();
    } else {
      this.stillMs += deltaMs;
      if (this.stillMs >= PERCH_AFTER_MS) this.land(place);
    }
    const tile = movement.tile;
    const last = this.lastTile;
    this.lastTile = tile;
    if (last && (last.tx !== tile.tx || last.ty !== tile.ty)) this.stepped(place, tile);
  }

  /** One lands on her hat, if one's about and none has this last minute. */
  private land(place: MapZoneId): void {
    const now = this.ctx.clock.now();
    if (this.perch || now - this.lastPerch < PERCH_EVERY_MS) return;
    const day = dayKey(now);
    const flier = flierFor(
      fliersAbout(place, day, hourOf(now), this.reads.weather()),
      day,
      this.perches,
    );
    // Nothing about here: she'll be told again only after another minute's standing.
    this.lastPerch = now;
    if (!flier) return;
    this.perches += 1;
    this.perch = flier;
    this.ctx.moments.push({ kind: 'landed', critter: flier });
  }

  private flyOff(): void {
    if (!this.perch) return;
    this.ctx.moments.push({ kind: 'flewOff', critter: this.perch });
    this.perch = null;
  }

  /** She has walked onto a new tile: past a scarecrow, or into the tickly grass. */
  private stepped(place: MapZoneId, tile: Tile): void {
    const zone = this.reads.zones.outdoor(place);
    if (!zone) return;
    const { takings } = this.reads;
    const now = this.ctx.clock.now();
    const scarecrow = scarecrowBy(zone.map.props, tile);
    const crows = FLYER_HOURS.crow;
    // By day, while the crows are about.
    if (scarecrow && hourOf(now) >= crows.from && hourOf(now) < crows.to) {
      const key = cawKey(place, scarecrow);
      if (takings.isReady(key)) {
        takings.take(key);
        this.caw = { place, tile: { tx: scarecrow.tx, ty: scarecrow.ty }, at: now };
        const { tx, ty, w, h } = scarecrow;
        this.ctx.moments.push({ kind: 'cawed', box: { tx, ty, w, h } });
      }
    }
    const day = dayKey(now);
    if (!tickles(day, tileAt(zone.map, tile.tx, tile.ty))) return;
    const window = windowKey(now);
    if (this.tickled.window !== window) this.tickled = { window, count: 0 };
    this.tickled.count += 1;
    if (this.tickled.count < sneezeAfter(window) || !takings.isReady(SNEEZE_KEY)) return;
    takings.take(SNEEZE_KEY);
    this.reads.movement().hold(actionMs('sneeze'));
    const near = this.reads.neighbourhood.neighboursIn(place);
    const by = blesser(near, tile);
    this.ctx.moments.push(
      by
        ? { kind: 'sneezed', by: by.id, line: fill(BLESS_YOU[by.id], { name: this.reads.name() }) }
        : { kind: 'sneezed' },
    );
  }
}
