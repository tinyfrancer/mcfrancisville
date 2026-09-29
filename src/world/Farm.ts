import { CROPS } from '../data/crops';
import type { Tile } from '../systems/pathfinding';
import { inReach, SPRINKLER_REACH } from '../systems/beds';
import type { Planting, Sprinkled } from '../systems/farming';
import type { CropId } from '../types/ids';

/** A bed she has tilled, and what's growing in it, if anything. */
export interface SavedBed {
  tx: number;
  ty: number;
  planting: Planting | null;
}

/** A sprinkler in a bed's corner (phase P), and the day key it has watered from. */
export interface SavedSprinkler {
  tx: number;
  ty: number;
  since: string;
}

export const bedKey = (t: Tile) => `bed:${t.tx},${t.ty}`;

/**
 * Her garden: which beds are tilled and what's in them. It only keeps state; the rules for growing
 * are `systems/farming.ts`, and `World` decides what a visit does. A tilled bed stays tilled for
 * good, and nothing in one ever withers (decisions.md 11).
 */
export class Farm {
  private readonly beds = new Map<string, SavedBed>();
  private readonly onMap: ReadonlySet<string>;
  /** Every crop she has ever picked. */
  private readonly picked: Set<CropId>;
  private readonly sprinklers = new Map<string, SavedSprinkler>();
  /** Sprinklers saved in beds the map no longer has, to go back in her bag. */
  readonly strayed: number;

  /**
   * `saved` is the farm from a save. A bed the map no longer has, or a crop this build doesn't know,
   * is dropped rather than the town set aside over it.
   */
  constructor(
    beds: readonly Tile[],
    saved: readonly SavedBed[] = [],
    harvested: readonly string[] = [],
    sprinklers: readonly SavedSprinkler[] = [],
  ) {
    this.onMap = new Set(beds.map(bedKey));
    this.picked = new Set(harvested.filter((id): id is CropId => id in CROPS));
    for (const bed of saved) {
      if (!this.onMap.has(bedKey(bed))) continue;
      const planting = bed.planting && bed.planting.crop in CROPS ? { ...bed.planting } : null;
      this.beds.set(bedKey(bed), { tx: bed.tx, ty: bed.ty, planting });
    }
    let strayed = 0;
    for (const { tx, ty, since } of sprinklers) {
      const key = bedKey({ tx, ty });
      if (this.onMap.has(key) && !this.sprinklers.has(key)) {
        this.sprinklers.set(key, { tx, ty, since });
      } else strayed++;
    }
    this.strayed = strayed;
  }

  isBed(t: Tile): boolean {
    return this.onMap.has(bedKey(t));
  }

  isTilled(t: Tile): boolean {
    return this.beds.has(bedKey(t));
  }

  planting(t: Tile): Planting | null {
    return this.beds.get(bedKey(t))?.planting ?? null;
  }

  till(t: Tile): void {
    if (this.isBed(t) && !this.isTilled(t)) {
      this.beds.set(bedKey(t), { tx: t.tx, ty: t.ty, planting: null });
    }
  }

  /** Puts `planting` in a tilled bed, or clears it with null. */
  set(t: Tile, planting: Planting | null): void {
    const bed = this.beds.get(bedKey(t));
    if (bed) bed.planting = planting;
  }

  hasSprinkler(t: Tile): boolean {
    return this.sprinklers.has(bedKey(t));
  }

  /** Every sprinkler, where it stands and since when. */
  get sprinklersIn(): readonly SavedSprinkler[] {
    return [...this.sprinklers.values()];
  }

  /** The day key the earliest sprinkler reaching this bed has watered it from, if any does. */
  sprinkled(t: Tile): Sprinkled {
    let from: Sprinkled = null;
    for (const s of this.sprinklers.values()) {
      if (inReach(s, t) && (from === null || s.since < from)) from = s.since;
    }
    return from;
  }

  /** Every bed a sprinkler at `t` reaches, itself included. */
  reachOf(t: Tile): Tile[] {
    const beds: Tile[] = [];
    const r = SPRINKLER_REACH;
    for (let ty = t.ty - r; ty <= t.ty + r; ty++) {
      for (let tx = t.tx - r; tx <= t.tx + r; tx++) {
        if (this.isBed({ tx, ty })) beds.push({ tx, ty });
      }
    }
    return beds;
  }

  /** Stands a sprinkler in a bed that has none, watering from `since`. */
  fit(t: Tile, since: string): boolean {
    if (!this.isBed(t) || this.hasSprinkler(t)) return false;
    this.sprinklers.set(bedKey(t), { tx: t.tx, ty: t.ty, since });
    return true;
  }

  unfit(t: Tile): boolean {
    return this.sprinklers.delete(bedKey(t));
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
