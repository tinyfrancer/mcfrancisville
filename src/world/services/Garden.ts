import { cropFromSeed, CROPS } from '../../data/crops';
import {
  canWater,
  daysToRipe,
  plantingSeed,
  rainsOn,
  stageOf,
  water,
  yieldOf,
} from '../../systems/farming';
import { dayKey } from '../../systems/clock';
import type { Tile } from '../../systems/pathfinding';
import type { CropId, ItemId } from '../../types/ids';
import type { Bag } from '../Bag';
import type { WorldContext } from '../context';
import type { WorldEvent } from '../events';
import { bedKey, type Farm, type SavedBed } from '../Farm';

/** Hosta La Vista Farm: tending her beds, and planting them from her bag. */
export class Garden {
  private readonly ctx: WorldContext;
  private readonly bag: Bag;
  /** Which beds are tilled, and what's growing in each. */
  readonly farm: Farm;

  constructor(ctx: WorldContext, bag: Bag, farm: Farm) {
    this.ctx = ctx;
    this.bag = bag;
    this.farm = farm;
  }

  /**
   * She has walked up to a bed: she tills it if it's wild, picks what's ripe (and keeps a seed
   * back to plant again), or waters what's growing, once a day. An empty bed waits for her to
   * choose a seed, which the HUD asks her and hands to `plant`.
   */
  tend(bed: Tile): WorldEvent {
    const now = this.ctx.clock.now();
    const { tx, ty } = bed;
    if (!this.farm.isTilled(bed)) {
      this.farm.till(bed);
      return { kind: 'tilled', tx, ty };
    }
    const planting = this.farm.planting(bed);
    if (!planting) return { kind: 'bare', tx, ty };
    const { crop } = planting;
    const row = CROPS[crop];
    if (stageOf(planting, now) === 'ripe') {
      const { item, count } = yieldOf(row.harvest, plantingSeed(bedKey(bed), planting));
      this.bag.add(item, count);
      this.bag.add(row.seed, 1);
      this.farm.set(bed, null);
      this.ctx.events.emit('bag', this.bag.contents);
      const first = this.farm.pick(crop);
      if (first) this.ctx.signals.emit('thrilled', { by: 'harvest' });
      return { kind: 'harvested', crop, item, count, seed: row.seed, first };
    }
    if (canWater(planting, now)) {
      const watered = water(planting, now);
      this.farm.set(bed, watered);
      return { kind: 'watered', crop, days: daysToRipe(watered, now) };
    }
    const growing: WorldEvent = { kind: 'growing', crop, days: daysToRipe(planting, now) };
    const rained = planting.lastWatered !== dayKey(now) && rainsOn(dayKey(now));
    return rained ? { ...growing, rained } : growing;
  }

  /**
   * Plants a seed from her bag in a tilled, empty bed. Null, and nothing taken, if the bed isn't
   * ready for one or she has none of that seed.
   */
  plant(tx: number, ty: number, seed: ItemId): WorldEvent | null {
    const bed = { tx, ty };
    const crop = cropFromSeed(seed);
    if (!crop || !this.farm.isTilled(bed) || this.farm.planting(bed)) return null;
    if (!this.bag.remove(seed)) return null;
    this.farm.set(bed, { crop, plantedAt: this.ctx.clock.now(), waterings: 0, lastWatered: null });
    this.ctx.events.emit('bag', this.bag.contents);
    return { kind: 'planted', crop, tx, ty };
  }

  snapshot(): { beds: SavedBed[]; harvested: CropId[] } {
    return { beds: this.farm.snapshot(), harvested: this.farm.harvested };
  }
}
