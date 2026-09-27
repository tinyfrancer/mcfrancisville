import { CROPS } from '../data/crops';
import type { Tile } from '../systems/pathfinding';
import type { Planting } from '../systems/farming';

/** A bed she has tilled, and what's growing in it, if anything. */
export interface SavedBed {
  tx: number;
  ty: number;
  planting: Planting | null;
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

  /**
   * `saved` is the farm from a save. A bed the map no longer has, or a crop this build doesn't know,
   * is dropped rather than the town set aside over it.
   */
  constructor(beds: readonly Tile[], saved: readonly SavedBed[] = []) {
    this.onMap = new Set(beds.map(bedKey));
    for (const bed of saved) {
      if (!this.onMap.has(bedKey(bed))) continue;
      const planting = bed.planting && bed.planting.crop in CROPS ? { ...bed.planting } : null;
      this.beds.set(bedKey(bed), { tx: bed.tx, ty: bed.ty, planting });
    }
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

  snapshot(): SavedBed[] {
    return [...this.beds.values()].map((b) => ({
      ...b,
      planting: b.planting ? { ...b.planting } : null,
    }));
  }
}
