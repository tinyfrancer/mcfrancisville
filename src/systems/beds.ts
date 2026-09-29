import { cropFromSeed } from '../data/crops';
import { isTool, type Held } from '../data/tools';
import type { Tile } from './pathfinding';
import type { CropId, ItemId } from '../types/ids';
import {
  canWater,
  daysToRipe,
  stageOf,
  wateredBy,
  type Planting,
  type Sprinkled,
  type Stage,
  type Watered,
} from './farming';

/**
 * What walking up to a bed will do (phase P). The bed's pop-up says it and the visit does it, both
 * from this one rule, so a tap never does something the pop-up didn't say.
 */
export type BedAction =
  /** A wild bed: she digs it over, and then picks a seed. */
  | { kind: 'till' }
  /** The seed in her hand goes in, tilling first if it's wild. */
  | { kind: 'sow'; seed: ItemId }
  /** A tilled, empty bed: she picks a seed. */
  | { kind: 'choose' }
  | { kind: 'water' }
  | { kind: 'pick' }
  /** The sprinkler in her hand goes in the bed's corner. */
  | { kind: 'fit' }
  /** Nothing wants doing today. */
  | { kind: 'wait' };

/** What she can do at a bed besides walking up to it: something to it as a whole. */
export type BedJob = 'tend' | 'row' | 'unfit';

/** How a bed is, as far as a visit is concerned. */
export interface BedState {
  tilled: boolean;
  planting: Planting | null;
  /** Whether a sprinkler stands in this bed's corner. */
  sprinkler: boolean;
  /** Since when a sprinkler (here or next door) has watered it. */
  sprinkled: Sprinkled;
}

export function bedAction(bed: BedState, held: Held, now: number): BedAction {
  const { planting, sprinkled } = bed;
  if (held === SPRINKLER && !bed.sprinkler) return { kind: 'fit' };
  if (!planting && !isTool(held) && cropFromSeed(held)) return { kind: 'sow', seed: held };
  if (!bed.tilled) return { kind: 'till' };
  if (!planting) return { kind: 'choose' };
  if (stageOf(planting, now, sprinkled) === 'ripe') return { kind: 'pick' };
  if (canWater(planting, now, sprinkled)) return { kind: 'water' };
  return { kind: 'wait' };
}

/** The item a sprinkler is in her bag, and what she holds to fit one. */
export const SPRINKLER: ItemId = 'sprinkler';

/** How far a sprinkler reaches: its own bed and every bed touching it, corners too. */
export const SPRINKLER_REACH = 1;

export function inReach(sprinkler: Tile, bed: Tile): boolean {
  return (
    Math.abs(sprinkler.tx - bed.tx) <= SPRINKLER_REACH &&
    Math.abs(sprinkler.ty - bed.ty) <= SPRINKLER_REACH
  );
}

/** Everything the bed's pop-up says: what's in it, how it's doing, and what a tap will do. */
export interface BedLook {
  tx: number;
  ty: number;
  tilled: boolean;
  crop: CropId | null;
  stage: Stage | null;
  /** Mornings until it's ripe, if it's growing. */
  days: number | null;
  watered: Watered | null;
  sprinkler: boolean;
  sprinkled: boolean;
  action: BedAction;
  /** How many beds in this row the seed in her hand would plant, this one included (0 if none). */
  row: number;
}

export function lookAt(bed: Tile, state: BedState, held: Held, now: number, row: number): BedLook {
  const { planting, sprinkled } = state;
  const stage = planting ? stageOf(planting, now, sprinkled) : null;
  const action = bedAction(state, held, now);
  return {
    tx: bed.tx,
    ty: bed.ty,
    tilled: state.tilled,
    crop: planting?.crop ?? null,
    stage,
    days: planting && stage !== 'ripe' ? daysToRipe(planting, now, sprinkled) : null,
    watered: state.tilled ? wateredBy(planting, now, sprinkled) : null,
    sprinkler: state.sprinkler,
    sprinkled: sprinkled !== null,
    action,
    row: action.kind === 'sow' ? row : 0,
  };
}

/**
 * The beds a row planting fills, in order: the run of beds either side of `bed` in its row, the
 * nearest first (left before right), those with nothing growing, as many as she has seeds.
 */
export function rowToSow(
  bed: Tile,
  isBed: (t: Tile) => boolean,
  empty: (t: Tile) => boolean,
  seeds: number,
): Tile[] {
  const run: Tile[] = [bed];
  for (let tx = bed.tx - 1; isBed({ tx, ty: bed.ty }); tx--) run.push({ tx, ty: bed.ty });
  for (let tx = bed.tx + 1; isBed({ tx, ty: bed.ty }); tx++) run.push({ tx, ty: bed.ty });
  const near = (t: Tile) => Math.abs(t.tx - bed.tx) * 2 + (t.tx > bed.tx ? 1 : 0);
  return run
    .filter(empty)
    .sort((a, b) => near(a) - near(b))
    .slice(0, seeds);
}
