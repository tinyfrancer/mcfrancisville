import { CROPS } from '../data/crops';
import type { Tile } from '../systems/pathfinding';
import { inReach, SPRINKLER_REACH } from '../systems/beds';
import type { Planting, Sprinkled } from '../systems/farming';
import type { CropId, ItemId, RoomId, ZoneId } from '../types/ids';

/**
 * A bed, by the place it's in and its tile there (0.2's N1). A plot with no zone is in town, where
 * every bed was before beds grew anywhere else. At home it is in one of her rooms (1.1's W2): a
 * plot there with no room is in the room she's in, as everything that reads "the room" is.
 */
export interface Plot extends Tile {
  zone?: ZoneId;
  room?: RoomId;
}

/**
 * A bed she has tilled, where it is, and what's growing in it, if anything. A bed at home names
 * its room (save v55); one saved before then is the front room's, where every planter stood.
 */
export interface SavedBed {
  zone: ZoneId;
  room?: RoomId;
  tx: number;
  ty: number;
  planting: Planting | null;
}

/** A sprinkler in a bed's corner (phase P), and the day key it has watered from. */
export interface SavedSprinkler {
  zone: ZoneId;
  room?: RoomId;
  tx: number;
  ty: number;
  since: string;
}

export const placeOf = (p: Plot): ZoneId => p.zone ?? 'town';

/**
 * The bed's own name, which deals its harvest (`plantingSeed`). A town bed's is what it was before
 * beds grew elsewhere, so a rose stays blue across saves; a planter's is the same in any room
 * (1.1's W2), so one in her front room grows as it always has. The farm keeps beds by `slotOf`.
 */
export const bedKey = (p: Plot) =>
  placeOf(p) === 'town' ? `bed:${p.tx},${p.ty}` : `bed:${placeOf(p)}:${p.tx},${p.ty}`;

/** Where her beds are: each place's own from its map, the extension rows, and her planters. */
export interface FarmLand {
  /** The beds each place's map has from the start. */
  beds: Partial<Record<ZoneId, readonly Tile[]>>;
  /**
   * The rows kept for the farm's extensions, the first to be built first: the town's two, then
   * Boo Acres' (0.3's F1). A tile with no zone is in town.
   */
  rows: readonly (readonly Plot[])[];
  /** Where her planters stand in a room of her home (0.2's N1), each with one bed in it. */
  planters: (room: RoomId) => readonly Tile[];
  /** The room of her home she's in, where a plot at home with no room is (1.1's W2). */
  here: () => RoomId;
  /** The beds a built project has made in a place (V1's R4): her greenhouse's planters. */
  projects?: (zone: ZoneId) => readonly Tile[];
}

/** What a saved farm brings back beyond its beds. */
export interface SavedFarm {
  beds?: readonly SavedBed[];
  harvested?: readonly string[];
  sprinklers?: readonly SavedSprinkler[];
  /** How many of the extension rows she has built. */
  rows?: number;
}

/** A bed's place and tile as the farm keeps and saves it, with its room if it's at home. */
type Pinned = { zone: ZoneId; room?: RoomId; tx: number; ty: number };

/**
 * Her garden: which beds are tilled and what's in them, in town, beyond it and at home. It only
 * keeps state; the rules for growing are `systems/farming.ts`, and `World` decides what a visit
 * does. A tilled bed stays tilled for good, and nothing in one ever withers (decisions.md 11).
 */
export class Farm {
  private readonly beds = new Map<string, SavedBed>();
  private readonly fixed: ReadonlySet<string>;
  private readonly land: FarmLand;
  private built: number;
  /** Every crop she has ever picked. */
  private readonly picked: Set<CropId>;
  private readonly sprinklers = new Map<string, SavedSprinkler>();
  /** Sprinklers saved in beds the map no longer has, to go back in her bag. */
  readonly strayed: number;
  /** The seeds of what was growing in beds that are gone (a planter put away), to go back too. */
  readonly strayedSeeds: ItemId[] = [];

  /**
   * A bed the land no longer has, or a crop this build doesn't know, is dropped rather than the
   * save set aside over it; what was growing there comes back to her as its seed.
   */
  constructor(land: FarmLand, saved: SavedFarm = {}) {
    this.land = land;
    this.fixed = new Set(
      Object.entries(land.beds).flatMap(([zone, tiles]) =>
        (tiles ?? []).map((t) => bedKey({ ...t, zone: zone as ZoneId })),
      ),
    );
    const rows = saved.rows ?? 0;
    this.built = Number.isInteger(rows) ? Math.max(0, Math.min(rows, land.rows.length)) : 0;
    this.picked = new Set((saved.harvested ?? []).filter((id): id is CropId => id in CROPS));
    for (const bed of saved.beds ?? []) {
      const known = bed.planting && bed.planting.crop in CROPS ? { ...bed.planting } : null;
      const at = fromSave(bed);
      if (!this.isBed(at)) {
        if (known) this.strayedSeeds.push(CROPS[known.crop].seed);
        continue;
      }
      this.beds.set(this.slotOf(at), { ...this.pinned(at), planting: known });
    }
    let strayed = 0;
    for (const sprinkler of saved.sprinklers ?? []) {
      const at = fromSave(sprinkler);
      const key = this.slotOf(at);
      if (this.isBed(at) && !this.sprinklers.has(key)) {
        this.sprinklers.set(key, { ...this.pinned(at), since: sprinkler.since });
      } else strayed++;
    }
    this.strayed = strayed;
  }

  /** Which of her rooms a bed at home is in: its own, or the one she's in (1.1's W2). */
  private roomOf(p: Plot): RoomId {
    return p.room ?? this.land.here();
  }

  /**
   * Where the farm keeps a bed: by its own name, and at home by its room as well (1.1's W2), so a
   * planter on the same tile of each room is a bed of its own.
   */
  private slotOf(p: Plot): string {
    return placeOf(p) === 'home' ? `bed:home:${this.roomOf(p)}:${p.tx},${p.ty}` : bedKey(p);
  }

  private pinned(p: Plot): Pinned {
    const zone = placeOf(p);
    return zone === 'home'
      ? { zone, room: this.roomOf(p), tx: p.tx, ty: p.ty }
      : { zone, tx: p.tx, ty: p.ty };
  }

  /** The same bed with its place, and at home the room it's in, written on it, to keep hold of. */
  pin(p: Plot): Plot {
    return this.pinned(p);
  }

  isBed(p: Plot): boolean {
    if (this.fixed.has(bedKey(p))) return true;
    const zone = placeOf(p);
    const at = (t: Tile) => t.tx === p.tx && t.ty === p.ty;
    if (this.builtIn(zone).some(at)) return true;
    if (this.land.projects?.(zone).some(at)) return true;
    return zone === 'home' && this.land.planters(this.roomOf(p)).some(at);
  }

  /** Every bed in a place, as it stands now: at home, those in the room she's in. */
  bedsIn(zone: ZoneId): Plot[] {
    const fixed = this.land.beds[zone] ?? [];
    const more = zone === 'home' ? this.land.planters(this.land.here()) : this.builtIn(zone);
    const built = this.land.projects?.(zone) ?? [];
    return [...fixed, ...more, ...built].map((t) => ({ zone, tx: t.tx, ty: t.ty }));
  }

  /** The tiles of the extension rows built so far in a place. */
  private builtIn(zone: ZoneId): Plot[] {
    return this.land.rows
      .slice(0, this.built)
      .flat()
      .filter((t) => placeOf(t) === zone);
  }

  /** How many of the extension rows she has built. */
  get rows(): number {
    return this.built;
  }

  /** Whether there's an extension row left to build. */
  get canExtend(): boolean {
    return this.built < this.land.rows.length;
  }

  /** Builds the next extension row: grass kept for it becomes beds. False if there's none left. */
  extend(): boolean {
    if (!this.canExtend) return false;
    this.built++;
    return true;
  }

  isTilled(p: Plot): boolean {
    return this.beds.has(this.slotOf(p));
  }

  planting(p: Plot): Planting | null {
    return this.beds.get(this.slotOf(p))?.planting ?? null;
  }

  till(p: Plot): void {
    if (this.isBed(p) && !this.isTilled(p)) {
      this.beds.set(this.slotOf(p), { ...this.pinned(p), planting: null });
    }
  }

  /** Puts `planting` in a tilled bed, or clears it with null. */
  set(p: Plot, planting: Planting | null): void {
    const bed = this.beds.get(this.slotOf(p));
    if (bed) bed.planting = planting;
  }

  /** A bed that has moved (a planter carried across her room): it goes with what's in it. */
  move(from: Plot, to: Plot): void {
    const bed = this.beds.get(this.slotOf(from));
    if (!bed) return;
    this.beds.delete(this.slotOf(from));
    this.beds.set(this.slotOf(to), { ...this.pinned(to), planting: bed.planting });
  }

  /** A bed that's gone (a planter put away): what was growing in it, which is no longer kept. */
  uproot(p: Plot): Planting | null {
    const planting = this.planting(p);
    this.beds.delete(this.slotOf(p));
    return planting;
  }

  hasSprinkler(p: Plot): boolean {
    return this.sprinklers.has(this.slotOf(p));
  }

  /** Every sprinkler, where it stands and since when. */
  get sprinklersIn(): readonly SavedSprinkler[] {
    return [...this.sprinklers.values()];
  }

  /** The day key the earliest sprinkler reaching this bed has watered it from, if any does. */
  sprinkled(p: Plot): Sprinkled {
    let from: Sprinkled = null;
    const { zone, room } = this.pinned(p);
    for (const s of this.sprinklers.values()) {
      if (s.zone !== zone || s.room !== room || !inReach(s, p)) continue;
      if (from === null || s.since < from) from = s.since;
    }
    return from;
  }

  /** Every bed a sprinkler at `p` reaches, itself included. */
  reachOf(p: Plot): Plot[] {
    const beds: Plot[] = [];
    const r = SPRINKLER_REACH;
    const { zone, room } = this.pinned(p);
    const place: Plot = room ? { zone, room, tx: 0, ty: 0 } : { zone, tx: 0, ty: 0 };
    for (let ty = p.ty - r; ty <= p.ty + r; ty++) {
      for (let tx = p.tx - r; tx <= p.tx + r; tx++) {
        if (this.isBed({ ...place, tx, ty })) beds.push({ ...place, tx, ty });
      }
    }
    return beds;
  }

  /** Stands a sprinkler in a bed that has none, watering from `since`. */
  fit(p: Plot, since: string): boolean {
    if (!this.isBed(p) || this.hasSprinkler(p)) return false;
    this.sprinklers.set(this.slotOf(p), { ...this.pinned(p), since });
    return true;
  }

  unfit(p: Plot): boolean {
    return this.sprinklers.delete(this.slotOf(p));
  }

  /** Notes that she picked a crop. True the first time she ever has. */
  pick(crop: CropId): boolean {
    if (this.picked.has(crop)) return false;
    this.picked.add(crop);
    return true;
  }

  get harvested(): CropId[] {
    return [...this.picked];
  }

  sprinklerSnapshot(): SavedSprinkler[] {
    return this.sprinklersIn.map((s) => ({ ...s }));
  }

  snapshot(): SavedBed[] {
    return [...this.beds.values()].map((b) => ({
      ...b,
      planting: b.planting ? { ...b.planting } : null,
    }));
  }
}

/** A bed or sprinkler at home saved before beds knew their room (save v55) is the front room's. */
function fromSave(p: Plot): Plot {
  return placeOf(p) === 'home' && p.room === undefined ? { ...p, room: 'main' } : p;
}
