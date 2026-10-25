import { CRITTERS, flies, isCritter, type Rarity } from '../../data/critters';
import { MUSEUM_LABELS, MUSEUM_LETTERS, MUSEUM_SHINY, MUSEUM_SPECIAL } from '../../data/museum';
import { shinyOf } from '../../data/shinies';
import { dayKey, hourOf } from '../../systems/clock';
import { lureKey, luredCritter } from '../../systems/cooking';
import {
  critterKey,
  crittersOut,
  flutterTo,
  isCharmed,
  placeHabitats,
  townHabitats,
  type Habitats,
  type OutCritter,
} from '../../systems/critters';
import { hashString } from '../../systems/random';
import { isWhopper } from '../../systems/catchSize';
import { DRIFTS_AN_HOUR, drifts, driftTo, HOP_MS, startles } from '../../systems/drift';
import { walkable } from '../../systems/grid';
import type { Tile } from '../../systems/pathfinding';
import { reach } from '../Movement';
import type { CritterId, MapZoneId } from '../../types/ids';
import type { Bag } from '../Bag';
import type { Cabinet } from '../Cabinet';
import type { WorldContext } from '../context';
import type { Critter, WorldEvent } from '../events';
import type { MapZone } from '../zones/MapZone';
import type { Lure } from './Kitchen';
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

/** What a lure needs to know: what she ate for, and where she's standing to come out near her. */
export interface Lurer {
  lure(): Lure | null;
  standing(): Tile;
}

/**
 * Her net and her Curiosity Cabinet: the critters out in each place this hour and where, catching
 * them, and giving them to Wrapunzel's museum (decisions.md 62–66). Each place outdoors deals its
 * own critters onto its own habitats (phase I). The fish are among them, caught on her rod
 * (`Fishing`, phase Q) and kept here like any other.
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
  /**
   * Critters that have fluttered off this hour, by key: where to, and how often; and how often a
   * shy one has drifted off as she rushed up, and its last hop (V1's R6a).
   */
  private fluttered = new Map<
    string,
    { tile: Tile; times: number; drifts: number; hop?: { from: Tile; at: number } }
  >();
  /** How far she had walked at the last step, so a new walk is seen starting (V1's R6a). */
  private walked = 0;
  /** The shy critters that drifted off since she set off, which she can't net on this walk. */
  private readonly shied = new Set<string>();
  /** The critters a pet barked out this hour, settled for her net (V1's R6c). */
  private readonly settled = new Set<string>();
  /** She has been told how to creep up on a shy one, since the game opened. */
  private toldOfDrift = false;
  private flutteredHour = '';
  /** When her net's swing ends. */
  private netUntil = 0;
  /** What a lure brought out in a place, and where: placed once, near her, when first asked. */
  private lured: { which: string; critter: OutCritter | null } | null = null;
  private readonly lurer: Lurer | null;
  /** Her last catch and the day of it, for the neighbours to hear of; not saved (0.2's D2). */
  private lastCatch: { id: CritterId; day: string } | null = null;
  /** The last shiny she caught and the day of it (1.4's G1); not saved. */
  private lastShiny: { id: CritterId; day: string } | null = null;

  constructor(
    ctx: WorldContext,
    keeps: CollectingKeeps,
    places: readonly MapZone[],
    peopled: boolean,
    outside: () => MapZoneId | null,
    lurer: Lurer | null = null,
  ) {
    this.ctx = ctx;
    this.keeps = keeps;
    this.lurer = lurer;
    this.places = new Map(places.map((z) => [z.id, z]));
    this.peopled = peopled;
    this.outside = outside;
  }

  /** The last critter she caught today, if she has caught one since the game opened. */
  caughtToday(): CritterId | null {
    const last = this.lastCatch;
    return last && last.day === dayKey(this.ctx.clock.now()) ? last.id : null;
  }

  /** The last shiny she caught today, if she has caught one since the game opened (1.4's G1). */
  shinyToday(): CritterId | null {
    const last = this.lastShiny;
    return last && last.day === dayKey(this.ctx.clock.now()) ? last.id : null;
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
      this.settled.clear();
      this.flutteredHour = which;
    }
    let dealt = this.dealt.get(place);
    if (dealt?.hour !== which) {
      const canBe = (t: Tile) => this.canBe(place, t);
      dealt = { hour: which, out: crittersOut(day, hour, this.habitatsIn(place), canBe, place) };
      this.dealt.set(place, dealt);
    }
    const out: Critter[] = [];
    const { cabinet } = this.keeps;
    for (const c of dealt.out) {
      const key = critterKey(hour, c.slot, place);
      if (!this.keeps.takings.isReady(key)) continue;
      // A kind long in her Cabinet with no shiny yet comes out shiny (1.4's G1's charm).
      const charmed =
        !c.shiny &&
        isCharmed(cabinet.caughtOn(c.critter), cabinet.shinyOn(c.critter) !== null, day);
      out.push(this.where(charmed ? { ...c, shiny: true } : c, key, now));
    }
    const lured = this.luredIn(place, out);
    if (lured) out.push(this.where(lured, lureKey(this.lurer!.lure()!.at), now));
    return out;
  }

  /** A critter where it is now: wherever it fluttered or drifted to, and mid-hop if it is. */
  private where(c: OutCritter, key: string, now: number): Critter {
    const moved = this.fluttered.get(key);
    const critter: Critter = moved ? { ...c, ...moved.tile, key } : { ...c, key };
    const hop = moved?.hop;
    if (hop && now - hop.at < HOP_MS) {
      critter.hop = { tx: hop.from.tx, ty: hop.from.ty, t: Math.max(0, now - hop.at) / HOP_MS };
    }
    return critter;
  }

  /**
   * What the shy critters near her make of her this step (V1's R6a): one she's rushing up to
   * drifts a tile away and settles, unless she's creeping up or behind a flier. Each drifts at
   * most `DRIFTS_AN_HOUR` times, then lets her near. `walked` is how many tiles she has walked
   * since she last stood still, or null while she stands.
   */
  notice(her: Tile, walked: number | null): WorldEvent[] {
    const setOff = walked === null || walked < this.walked;
    this.walked = walked ?? 0;
    if (setOff) this.shied.clear();
    if (walked === null) return [];
    const place = this.outside();
    if (place === null) return [];
    const now = this.ctx.clock.now();
    const out = this.critters(place);
    const events: WorldEvent[] = [];
    for (const c of out) {
      const moved = this.fluttered.get(c.key);
      // Once a walk: it has hopped off, and watches her come on.
      if (this.shied.has(c.key) || (moved?.drifts ?? 0) >= DRIFTS_AN_HOUR) continue;
      // One a pet barked out has settled, and lets her come on (V1's R6c).
      if (this.settled.has(c.key)) continue;
      if (!startles(c.critter, c, { her, walked })) continue;
      const taken = new Set(out.map((o) => `${o.tx},${o.ty}`));
      const zone = this.zone(place);
      const free = (t: Tile) =>
        this.canBe(place, t) && zone.canWalk(t.tx, t.ty) && !taken.has(`${t.tx},${t.ty}`);
      const to = driftTo(c, her, free);
      if (!to) continue;
      this.fluttered.set(c.key, {
        tile: to,
        times: moved?.times ?? 0,
        drifts: (moved?.drifts ?? 0) + 1,
        hop: { from: { tx: c.tx, ty: c.ty }, at: now },
      });
      this.shied.add(c.key);
      const first = !this.toldOfDrift;
      this.toldOfDrift = true;
      const drifted: WorldEvent = { kind: 'drifted', critter: c.critter };
      events.push(first ? { ...drifted, first } : drifted);
    }
    return events;
  }

  /** Whether a kind is shy and drifts off if she rushes at it (V1's R6a). */
  isShy(id: CritterId): boolean {
    return drifts(id);
  }

  /** How rare a kind is, which sets how long a fish bites and whether it's reeled in. */
  rarityOf(id: CritterId): Rarity {
    return CRITTERS[id].rarity;
  }

  /** Whether a critter drifted off as she came up on this walk, so her net can't reach it yet. */
  shiedFrom(key: string): boolean {
    return this.shied.has(key);
  }

  /**
   * Dolly barked it out (V1's R6c): it settles where it is for the rest of its hour, never
   * drifting or fluttering off, and her net has it first time.
   */
  settle(key: string): void {
    this.settled.add(key);
    this.shied.delete(key);
  }

  /** Elvira drew it a tile nearer (V1's R6c): it hops there, and stays till anything else moves it. */
  draw(key: string, to: Tile): void {
    const out = this.critters().find((c) => c.key === key);
    if (!out) return;
    const moved = this.fluttered.get(key);
    this.fluttered.set(key, {
      tile: to,
      times: moved?.times ?? 0,
      drifts: moved?.drifts ?? 0,
      hop: { from: { tx: out.tx, ty: out.ty }, at: this.ctx.clock.now() },
    });
  }

  /**
   * The critter a meal lured out in a place (phase R): one of its family, come out near her on a
   * tile of its habitat, apart from the hour's. It stays till it's caught or the window turns.
   */
  private luredIn(place: MapZoneId, others: readonly OutCritter[]): OutCritter | null {
    const lure = this.lurer?.lure();
    if (!lure) return null;
    const which = `${lure.at}@${place}`;
    if (this.lured?.which === which) return this.lured.critter;
    const habitats = this.habitatsIn(place);
    const id = luredCritter(
      lure.family,
      place,
      lure.at,
      this.ctx.clock.now(),
      (c) => this.keeps.cabinet.caughtOn(c) !== null,
      (h) => habitats[h].some((t) => this.canBe(place, t)),
    );
    let critter: OutCritter | null = null;
    if (id) {
      const here = this.lurer!.standing();
      const taken = new Set(others.map((c) => `${c.tx},${c.ty}`));
      const tiles = habitats[CRITTERS[id].habitat].filter(
        (t) => this.canBe(place, t) && !taken.has(`${t.tx},${t.ty}`),
      );
      // Near enough to see, but a step or two off, so it's plain she has a visitor.
      const off = (t: Tile) => {
        const d = reach(here, t);
        return d < 2 ? 100 + d : d;
      };
      const tile = tiles.sort((a, b) => off(a) - off(b))[0];
      if (tile) critter = { slot: -1, critter: id, tx: tile.tx, ty: tile.ty };
    }
    this.lured = { which, critter };
    return critter;
  }

  /** A shiny out where she is now, if one is (1.4's G1), for Today to tell her of. */
  shinyHere(): { critter: CritterId; zone: MapZoneId; tile: Tile; hour: number } | null {
    const place = this.outside();
    if (place === null) return null;
    const shiny = this.critters(place).find((c) => c.shiny);
    if (!shiny) return null;
    const hour = Math.floor(hourOf(this.ctx.clock.now()));
    return { critter: shiny.critter, zone: place, tile: { tx: shiny.tx, ty: shiny.ty }, hour };
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
    // Nothing swims under the pond's ice in winter (phase U).
    if (zone.isIce(t.tx, t.ty)) return false;
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
    this.netUntil = this.ctx.clock.now() + NET_MS;
    const id = critter.critter;
    const row = CRITTERS[id];
    const times = this.fluttered.get(critter.key)?.times ?? 0;
    const place = this.outside();
    if (times < row.wary && place !== null && !this.settled.has(critter.key)) {
      const others = new Set(this.critters(place).map((c) => `${c.tx},${c.ty}`));
      const to = flutterTo(
        critter,
        this.habitatsIn(place)[row.habitat],
        (t) => this.canBe(place, t) && !others.has(`${t.tx},${t.ty}`),
      );
      if (to) {
        const drifted = this.fluttered.get(critter.key)?.drifts ?? 0;
        this.fluttered.set(critter.key, { tile: to, times: times + 1, drifts: drifted });
        return { kind: 'fled', critter: id };
      }
    }
    return this.keep(critter);
  }

  /**
   * A critter caught, in her net or on her rod: gone for the rest of its hour, into her bag and
   * her Curiosity Cabinet. A fish comes with its `size`, measured against her best (V1's R6a).
   */
  keep(critter: Critter, size: number | null = null): WorldEvent {
    const id = critter.critter;
    const shiny = critter.shiny === true;
    const { bag, takings, cabinet } = this.keeps;
    takings.take(critter.key);
    // A shiny is a thing of its own in her bag (1.4's G1), and the critter caught all the same.
    bag.add(shiny ? shinyOf(id) : id, 1);
    const day = dayKey(this.ctx.clock.now());
    const first = cabinet.record(id, day);
    const firstShiny = shiny && cabinet.shine(id, day);
    const best = size === null ? null : cabinet.measure(id, size);
    this.lastCatch = { id, day };
    if (shiny) this.lastShiny = { id, day };
    this.ctx.events.emit('bag', bag.contents);
    if (first || best || firstShiny) this.ctx.events.emit('cabinet', cabinet);
    const rarity = CRITTERS[id].rarity;
    const whopper = size !== null && isWhopper(id, size);
    if (rarity === 'rare' || rarity === 'legendary' || whopper || shiny) {
      this.ctx.signals.emit('thrilled', { by: 'catch' });
    }
    return {
      kind: 'caught',
      critter: id,
      first,
      ...(size === null ? {} : { size }),
      ...(best ? { best } : {}),
      ...(whopper ? { whopper } : {}),
      ...(shiny ? { shiny: true } : {}),
      ...(firstShiny ? { firstShiny: true } : {}),
    };
  }

  /**
   * Gives a critter from her bag to Wrapunzel's museum, to go on show: what its label says, or null
   * if she hasn't one, or one is already on show. Wrapunzel writes as the cases fill.
   */
  donate(id: CritterId, shiny = false): string | null {
    const { bag, cabinet, mailbox } = this.keeps;
    if (!isCritter(id)) return null;
    // A shiny takes its case in place of the plain one, once (1.4's G1).
    const taken = shiny ? cabinet.isShinyShown(id) : cabinet.isDonated(id);
    if (taken || !bag.remove(shiny ? shinyOf(id) : id)) return null;
    cabinet.donate(id, shiny);
    this.ctx.signals.emit('donated', { thing: id });
    this.ctx.events.emit('bag', bag.contents);
    this.ctx.events.emit('cabinet', cabinet);
    const day = dayKey(this.ctx.clock.now());
    for (const letter of MUSEUM_LETTERS) {
      if (cabinet.onShow >= letter.donated) mailbox.post(`museum:${letter.donated}`, day);
    }
    const label = shiny
      ? MUSEUM_SHINY[hashString(id) % MUSEUM_SHINY.length]!
      : (MUSEUM_SPECIAL[id] ?? MUSEUM_LABELS[hashString(id) % MUSEUM_LABELS.length]!);
    return label.replaceAll('{critter}', CRITTERS[id].name.toLowerCase());
  }
}
