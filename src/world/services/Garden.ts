import { cropFromSeed, CROPS } from '../../data/crops';
import { FURNITURE } from '../../data/furniture';
import type { Held } from '../../data/tools';
import {
  bedAction,
  lookAt,
  rowToSow,
  SPRINKLER,
  type BedJob,
  type BedLook,
  type BedState,
} from '../../systems/beds';
import {
  daysToRipe,
  keepSprinkling,
  plantedInSeason,
  plantingSeed,
  stageOf,
  wateredBy,
  water,
  yieldOf,
  type Planting,
  type Sprinkled,
} from '../../systems/farming';
import { dayKey } from '../../systems/clock';
import type { CropId, ItemId } from '../../types/ids';
import type { Bag } from '../Bag';
import type { WorldContext } from '../context';
import type { WorldEvent } from '../events';
import { bedKey, placeOf, type Farm, type Plot, type SavedBed, type SavedSprinkler } from '../Farm';

/**
 * Hosta La Vista Farm, and every bed beyond it (0.2's N1): tending her beds, planting them from her
 * bag, and her sprinklers. A tap on a bed first looks at it (phase P): `look` says what's in it and
 * what walking up will do, and a second tap does it, by `visit`, from the same rule (`bedAction`).
 * The same rules hold in every place; a crop only grows a day sooner where it thrives.
 */
export class Garden {
  private readonly ctx: WorldContext;
  private readonly bag: Bag;
  /** Which beds are tilled, and what's growing in each. */
  readonly farm: Farm;
  private lookingAt: Plot | null = null;

  constructor(ctx: WorldContext, bag: Bag, farm: Farm) {
    this.ctx = ctx;
    this.bag = bag;
    this.farm = farm;
    if (farm.strayed > 0) bag.add(SPRINKLER, farm.strayed);
    for (const seed of farm.strayedSeeds) bag.add(seed, 1);
    // A planter carries what's growing in it across her room; put away, it gives her what was in it.
    ctx.signals.on('moved', ({ piece, from, to }) => {
      if (!FURNITURE[piece].planter) return;
      const was = { zone: 'home' as const, ...from };
      if (to) this.farm.move(was, { zone: 'home', ...to });
      else this.uproot(was);
    });
  }

  /** The bed whose pop-up is up, if one is. */
  get looking(): Plot | null {
    return this.lookingAt;
  }

  /** Puts up a bed's pop-up, or takes it down with null. */
  lookAt(bed: Plot | null): void {
    const same =
      bed === this.lookingAt || (bed && this.lookingAt && bedKey(bed) === bedKey(this.lookingAt));
    if (same) return;
    this.lookingAt = bed ? { zone: placeOf(bed), tx: bed.tx, ty: bed.ty } : null;
    this.ctx.events.emit('bed', this.lookingAt);
  }

  /** What a bed's pop-up says, with `held` in her hand. */
  look(bed: Plot, held: Held): BedLook {
    const now = this.ctx.clock.now();
    const state = this.stateOf(bed);
    const action = bedAction(state, held, now);
    const row = action.kind === 'sow' ? this.row(bed, action.seed).length : 0;
    return lookAt(bed, state, held, now, row);
  }

  /** How a bed is, for the rules. */
  stateOf(bed: Plot): BedState {
    return {
      tilled: this.farm.isTilled(bed),
      planting: this.farm.planting(bed),
      sprinkler: this.farm.hasSprinkler(bed),
      sprinkled: this.farm.sprinkled(bed),
    };
  }

  /** What has watered a bed today, for drawing it wet. */
  wateredBy(bed: Plot) {
    return wateredBy(this.farm.planting(bed), this.ctx.clock.now(), this.farm.sprinkled(bed));
  }

  /**
   * She has walked up to a bed to do `job`: what its pop-up said (`tend`), plant the seed in her
   * hand along the row, or take its sprinkler out.
   */
  visit(bed: Plot, held: Held, job: BedJob = 'tend'): WorldEvent {
    if (job === 'unfit' && this.farm.hasSprinkler(bed)) return this.unfit(bed);
    const action = bedAction(this.stateOf(bed), held, this.ctx.clock.now());
    if (job === 'row' && action.kind === 'sow') return this.sowRow(bed, action.seed);
    switch (action.kind) {
      case 'fit':
        return this.fit(bed);
      case 'sow':
        this.farm.till(bed);
        return this.plant(bed, action.seed) ?? this.tend(bed);
      default:
        return this.tend(bed);
    }
  }

  /**
   * She has walked up to a bed with nothing special in hand: she tills it if it's wild, picks
   * what's ripe (and keeps a seed back to plant again), or waters what's growing, once a day. An
   * empty bed waits for her to choose a seed, which the HUD asks her and hands to `plant`.
   */
  tend(bed: Plot): WorldEvent {
    const now = this.ctx.clock.now();
    const { tx, ty } = bed;
    const action = bedAction(this.stateOf(bed), 'hands', now);
    if (action.kind === 'till') {
      this.farm.till(bed);
      return { kind: 'tilled', tx, ty };
    }
    const planting = this.farm.planting(bed);
    if (!planting) return { kind: 'bare', tx, ty };
    const { crop } = planting;
    const sprinkled = this.farm.sprinkled(bed);
    if (action.kind === 'pick') {
      const row = CROPS[crop];
      const { item, count } = yieldOf(row.harvest, plantingSeed(bedKey(bed), planting));
      this.bag.add(item, count);
      this.bag.add(row.seed, 1);
      this.farm.set(bed, null);
      this.ctx.events.emit('bag', this.bag.contents);
      const first = this.farm.pick(crop);
      if (first) this.ctx.signals.emit('thrilled', { by: 'harvest' });
      return { kind: 'harvested', crop, item, count, seed: row.seed, first };
    }
    if (action.kind === 'water') {
      const watered = water(planting, now);
      this.farm.set(bed, watered);
      return { kind: 'watered', crop, days: daysToRipe(watered, now, sprinkled) };
    }
    const days = daysToRipe(planting, now, sprinkled);
    const by = planting.lastWatered === dayKey(now) ? 'can' : wateredBy(null, now, sprinkled);
    if (by === 'rain') return { kind: 'growing', crop, days, rained: true };
    if (by === 'sprinkler') return { kind: 'growing', crop, days, sprinkled: true };
    return { kind: 'growing', crop, days };
  }

  /**
   * Plants a seed from her bag in a tilled, empty bed. Null, and nothing taken, if the bed isn't
   * ready for one or she has none of that seed.
   */
  plant(bed: Plot, seed: ItemId): WorldEvent | null {
    const crop = cropFromSeed(seed);
    if (!crop || !this.farm.isTilled(bed) || this.farm.planting(bed)) return null;
    if (!this.bag.remove(seed)) return null;
    const quick = CROPS[crop].thrives?.some((zone) => zone === placeOf(bed));
    const planting: Planting = {
      crop,
      plantedAt: this.ctx.clock.now(),
      waterings: 0,
      lastWatered: null,
      ...(quick ? { quick: true } : {}),
    };
    this.farm.set(bed, planting);
    this.ctx.events.emit('bag', this.bag.contents);
    return {
      kind: 'planted',
      crop,
      tx: bed.tx,
      ty: bed.ty,
      ...(quick ? { quick: true } : {}),
      ...(plantedInSeason(planting) ? { season: true } : {}),
    };
  }

  /** The beds planting a row from `bed` with `seed` would fill, in the order it fills them. */
  row(bed: Plot, seed: ItemId): Plot[] {
    const zone = placeOf(bed);
    return rowToSow(
      bed,
      (t) => this.farm.isBed({ zone, ...t }),
      (t) => !this.farm.planting({ zone, ...t }),
      this.bag.count(seed),
    ).map((t) => ({ zone, tx: t.tx, ty: t.ty }));
  }

  /** Plants `seed` along the row from `bed`, tilling what's wild, as far as her seeds go. */
  private sowRow(bed: Plot, seed: ItemId): WorldEvent {
    const crop = cropFromSeed(seed) as CropId;
    let count = 0;
    for (const t of this.row(bed, seed)) {
      this.farm.till(t);
      if (this.plant(t, seed)) count++;
    }
    return { kind: 'sowedRow', crop, count };
  }

  /** Stands the sprinkler from her bag in this bed's corner. It waters from today. */
  private fit(bed: Plot): WorldEvent {
    if (!this.bag.remove(SPRINKLER)) return this.tend(bed);
    this.farm.fit(bed, dayKey(this.ctx.clock.now()));
    this.ctx.events.emit('bag', this.bag.contents);
    return { kind: 'fitted', beds: this.farm.reachOf(bed).length };
  }

  /** Takes a sprinkler back into her bag. What it watered stays watered. */
  private unfit(bed: Plot): WorldEvent {
    const now = this.ctx.clock.now();
    const reach = this.farm.reachOf(bed);
    const before = new Map<string, Sprinkled>(
      reach.map((t) => [bedKey(t), this.farm.sprinkled(t)]),
    );
    this.farm.unfit(bed);
    for (const t of reach) {
      const planting = this.farm.planting(t);
      if (!planting) continue;
      const kept = keepSprinkling(
        planting,
        now,
        before.get(bedKey(t)) ?? null,
        this.farm.sprinkled(t),
      );
      this.farm.set(t, kept);
    }
    this.bag.add(SPRINKLER, 1);
    this.ctx.events.emit('bag', this.bag.contents);
    return { kind: 'unfitted' };
  }

  /** A bed that's gone: what was in it comes back, picked if it was ripe, else as its seed. */
  private uproot(bed: Plot): void {
    const sprinkled = this.farm.sprinkled(bed);
    if (this.farm.unfit(bed)) this.bag.add(SPRINKLER, 1);
    const planting = this.farm.uproot(bed);
    if (planting) {
      const row = CROPS[planting.crop];
      if (stageOf(planting, this.ctx.clock.now(), sprinkled) === 'ripe') {
        const { item, count } = yieldOf(row.harvest, plantingSeed(bedKey(bed), planting));
        this.bag.add(item, count);
      }
      this.bag.add(row.seed, 1);
    }
    if (this.lookingAt && bedKey(this.lookingAt) === bedKey(bed)) this.lookAt(null);
    this.ctx.events.emit('bag', this.bag.contents);
  }

  snapshot(): {
    beds: SavedBed[];
    harvested: CropId[];
    sprinklers: SavedSprinkler[];
    farmRows: number;
  } {
    return {
      beds: this.farm.snapshot(),
      harvested: this.farm.harvested,
      sprinklers: this.farm.sprinklerSnapshot(),
      farmRows: this.farm.rows,
    };
  }
}
