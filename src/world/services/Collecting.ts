import { CRITTERS, flies, isCritter } from '../../data/critters';
import { MUSEUM_LABELS, MUSEUM_LETTERS, MUSEUM_SPECIAL } from '../../data/museum';
import { dayKey, hourOf } from '../../systems/clock';
import {
  critterKey,
  crittersOut,
  flutterTo,
  placeHabitats,
  townHabitats,
  type Habitats,
  type OutCritter,
} from '../../systems/critters';
import { hashString } from '../../systems/gathering';
import { walkable } from '../../systems/grid';
import type { Tile } from '../../systems/pathfinding';
import type { CritterId, MapZoneId } from '../../types/ids';
import type { Bag } from '../Bag';
import type { Cabinet } from '../Cabinet';
import type { WorldContext } from '../context';
import type { Critter, WorldEvent } from '../events';
import type { MapZone } from '../zones/MapZone';
import type { Mailbox } from './Mailbox';
import type { Takings } from './Takings';

/** How long a swing of her net takes. */
export const NET_MS = 420;

/** What catching and donating reach into: where she keeps what she catches, and her mail. */
export interface CollectingKeeps {
  bag: Bag;
  takings: Takings;
  cabinet: Cabinet;
  mailbox: Mailbox;
}

/**
 * Her net and her Curiosity Cabinet: the critters out in each place this hour and where, catching
 * them, and giving them to Wrapunzel's museum (decisions.md 62–66). Each place outdoors deals its
 * own critters onto its own habitats (phase I).
 */
export class Collecting {
  private readonly ctx: WorldContext;
  private readonly keeps: CollectingKeeps;
  private readonly places: ReadonlyMap<MapZoneId, MapZone>;
  private readonly peopled: boolean;
  /** The place outdoors she is in, or null indoors. */
  private readonly outside: () => MapZoneId | null;
  /** Where critters can be in each place, from its map, worked out the first time it's asked. */
  private readonly habitats = new Map<MapZoneId, Habitats>();
  /** Each place's critters, dealt once an hour, before today's catches are taken out. */
  private readonly dealt = new Map<MapZoneId, { hour: string; out: OutCritter[] }>();
  /** Critters that have fluttered off this hour, by key: where to, and how often. */
  private fluttered = new Map<string, { tile: Tile; times: number }>();
  private flutteredHour = '';
  /** When her net's swing ends. */
  private netUntil = 0;

  constructor(
    ctx: WorldContext,
    keeps: CollectingKeeps,
    places: readonly MapZone[],
    peopled: boolean,
    outside: () => MapZoneId | null,
  ) {
    this.ctx = ctx;
    this.keeps = keeps;
    this.places = new Map(places.map((z) => [z.id, z]));
    this.peopled = peopled;
    this.outside = outside;
  }

  /**
   * Where critters can be in a place. The town's keep clear of its neighbours' stops; a town
   * without neighbours (a test's small map) has only its map to go on.
   */
  habitatsIn(place: MapZoneId): Habitats {
    let found = this.habitats.get(place);
    if (!found) {
      const zone = this.zone(place);
      found =
        place === 'town' ? townHabitats(zone.map, this.peopled) : placeHabitats(place, zone.map);
      this.habitats.set(place, found);
    }
    return found;
  }

  private zone(place: MapZoneId): MapZone {
    const zone = this.places.get(place);
    if (!zone) throw new Error(`no place ${place}`);
    return zone;
  }

  /**
   * The critters out in a place now (where she is, if it isn't said), and where, less any she has
   * caught this hour. The hour's are dealt once (decisions.md 4); one that has fluttered off is
   * wherever it went. None indoors.
   */
  critters(place: MapZoneId | null = this.outside()): Critter[] {
    if (place === null) return [];
    const now = this.ctx.clock.now();
    const day = dayKey(now);
    const hour = Math.floor(hourOf(now));
    const which = `${day}@${hour}`;
    if (this.flutteredHour !== which) {
      this.fluttered.clear();
      this.flutteredHour = which;
    }
    let dealt = this.dealt.get(place);
    if (dealt?.hour !== which) {
      const canBe = (t: Tile) => this.canBe(place, t);
      dealt = { hour: which, out: crittersOut(day, hour, this.habitatsIn(place), canBe, place) };
      this.dealt.set(place, dealt);
    }
    const out: Critter[] = [];
    for (const c of dealt.out) {
      const key = critterKey(hour, c.slot, place);
      if (!this.keeps.takings.isReady(key)) continue;
      const moved = this.fluttered.get(key);
      out.push(moved ? { ...c, ...moved.tile, key } : { ...c, key });
    }
    return out;
  }

  /** One of this hour's critters where she is, by its key, if it's still out. */
  find(key: string): Critter | undefined {
    return this.critters().find((c) => c.key === key);
  }

  /**
   * Where a critter may be today: open ground nothing is standing on, or water where it can be
   * reached from open ground.
   */
  private canBe(place: MapZoneId, t: Tile): boolean {
    const zone = this.zone(place);
    if (zone.canWalk(t.tx, t.ty)) return true;
    if (walkable(zone.map, t.tx, t.ty)) return false;
    for (let y = t.ty - 1; y <= t.ty + 1; y++) {
      for (let x = t.tx - 1; x <= t.tx + 1; x++) if (zone.canWalk(x, y)) return true;
    }
    return false;
  }

  /** The critter on a tile where she is; one that flies can be tapped in the air above it too. */
  critterAt(tx: number, ty: number): Critter | undefined {
    const place = this.outside();
    if (place === null) return undefined;
    const zone = this.zone(place);
    const air =
      zone.propAt(tx, ty) === undefined &&
      !zone.map.patches.some((p) => p.tx === tx && p.ty === ty);
    return this.critters(place).find(
      (c) => c.tx === tx && (c.ty === ty || (air && flies(c.critter) && c.ty - 1 === ty)),
    );
  }

  /** Whether her net is mid-swing, and how far through: 0 as it starts, 1 as it ends. */
  netSwing(): number | null {
    const left = this.netUntil - this.ctx.clock.now();
    return left > 0 && left <= NET_MS ? 1 - left / NET_MS : null;
  }

  /**
   * A swing of her net at a critter within reach. A wary one flutters off to somewhere near the
   * first time or two; otherwise it's caught, into her bag and her Curiosity Cabinet.
   */
  swing(critter: Critter): WorldEvent {
    const now = this.ctx.clock.now();
    const day = dayKey(now);
    this.netUntil = now + NET_MS;
    const id = critter.critter;
    const row = CRITTERS[id];
    const times = this.fluttered.get(critter.key)?.times ?? 0;
    const place = this.outside();
    if (times < row.wary && place !== null) {
      const others = new Set(this.critters(place).map((c) => `${c.tx},${c.ty}`));
      const to = flutterTo(
        critter,
        this.habitatsIn(place)[row.habitat],
        (t) => this.canBe(place, t) && !others.has(`${t.tx},${t.ty}`),
      );
      if (to) {
        this.fluttered.set(critter.key, { tile: to, times: times + 1 });
        return { kind: 'fled', critter: id };
      }
    }
    const { bag, takings, cabinet } = this.keeps;
    takings.take(critter.key);
    bag.add(id, 1);
    const first = cabinet.record(id, day);
    this.ctx.events.emit('bag', bag.contents);
    if (first) this.ctx.events.emit('cabinet', cabinet);
    if (row.rarity === 'rare') this.ctx.signals.emit('thrilled', { by: 'catch' });
    return { kind: 'caught', critter: id, first };
  }

  /**
   * Gives a critter from her bag to Wrapunzel's museum, to go on show: what its label says, or null
   * if she hasn't one, or one is already on show. Wrapunzel writes as the cases fill.
   */
  donate(id: CritterId): string | null {
    const { bag, cabinet, mailbox } = this.keeps;
    if (!isCritter(id) || cabinet.isDonated(id) || !bag.remove(id)) return null;
    cabinet.donate(id);
    this.ctx.events.emit('bag', bag.contents);
    this.ctx.events.emit('cabinet', cabinet);
    const day = dayKey(this.ctx.clock.now());
    for (const letter of MUSEUM_LETTERS) {
      if (cabinet.onShow >= letter.donated) mailbox.post(`museum:${letter.donated}`, day);
    }
    const label = MUSEUM_SPECIAL[id] ?? MUSEUM_LABELS[hashString(id) % MUSEUM_LABELS.length]!;
    return label.replaceAll('{critter}', CRITTERS[id].name.toLowerCase());
  }
}
