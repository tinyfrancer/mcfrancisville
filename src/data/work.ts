import type { Facing, WorkId } from '../types/ids';

/**
 * A neighbour's job, done at a stop that names it (`doing` on a `Stop`, V1's E3, decision 282):
 * which way they face to do it, how long each of its two frames shows, and whether they kneel to
 * it. While she's within two tiles they stop and look at her instead.
 */
export interface WorkRow {
  /** What it is, for the gallery and the tests. */
  name: string;
  faces: Facing;
  frameMs: number;
  /** Down on their knees for it, folded as she crouches (decision 281). */
  kneels?: true;
}

export const WORKS: Record<WorkId, WorkRow> = {
  flowers: { name: 'a bucket of flowers', faces: 'down', frameMs: 700 },
  sawing: { name: 'sawing a plank', faces: 'down', frameMs: 260 },
  digging: { name: 'digging with a trowel', faces: 'down', frameMs: 420, kneels: true },
  tray: { name: 'a tray of cakes', faces: 'down', frameMs: 650 },
  lantern: { name: 'lighting a lantern', faces: 'down', frameMs: 300 },
  post: { name: 'sorting the post', faces: 'down', frameMs: 800 },
  watering: { name: 'a watering can', faces: 'down', frameMs: 450 },
  telescope: { name: 'at her telescope', faces: 'right', frameMs: 900 },
  conducting: { name: 'conducting', faces: 'down', frameMs: 380 },
  reading: { name: 'reading', faces: 'down', frameMs: 1500 },
  stirring: { name: 'stirring the cauldron', faces: 'left', frameMs: 500 },
  coffee: { name: 'a cup of coffee', faces: 'down', frameMs: 1200 },
};

export const WORK_IDS = Object.keys(WORKS) as WorkId[];
