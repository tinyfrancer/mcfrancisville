import type { CropId, ItemId, MapZoneId } from '../types/ids';
import type { Yield } from './gathering';

export interface CropRow {
  /** How it's said in a sentence: "You watered the {name}." */
  name: string;
  /** What she plants it from. Every harvest gives one back (decisions.md 39). */
  seed: ItemId;
  harvest: Yield;
  /** How many mornings it takes to ripen unwatered. Each day it's watered counts as one more. */
  days: number;
  /** The plots beyond the town where it grows best, a day sooner (0.2's N1). */
  thrives?: readonly MapZoneId[];
}

/**
 * What grows in her beds. Flowers get the most variety of any crop (personal_touches.md, "Her
 * garden"); pumpkins are the easy early one, and a ripe one is a proper big pumpkin.
 */
export const CROPS: Record<CropId, CropRow> = {
  pumpkin: {
    name: 'pumpkin',
    seed: 'pumpkinSeed',
    harvest: { item: 'pumpkin', count: 1 },
    days: 2,
  },
  ghostPepper: {
    name: 'ghost peppers',
    seed: 'ghostPepperSeed',
    harvest: { item: 'ghostPepper', count: 3 },
    days: 3,
  },
  candyCorn: {
    name: 'candy corn',
    seed: 'candyCornSeed',
    harvest: { item: 'candyCorn', count: 2 },
    days: 4,
  },
  batWingBeans: {
    name: 'bat-wing beans',
    seed: 'batWingBeanSeed',
    harvest: { item: 'batWingBean', count: 3 },
    days: 3,
  },
  // Now and then a rose comes up blue instead (personal_touches.md, "Her garden").
  rose: {
    name: 'roses',
    seed: 'roseSeed',
    harvest: { item: 'rose', count: 2, rare: { item: 'blueRose', oneIn: 8 } },
    days: 4,
  },
  moonflower: {
    name: 'moonflowers',
    seed: 'moonflowerSeed',
    harvest: { item: 'moonflower', count: 2 },
    days: 3,
    thrives: ['lanternShore'],
  },
  snapdragon: {
    name: 'snapdragons',
    seed: 'snapdragonSeed',
    harvest: { item: 'snapdragon', count: 2 },
    days: 3,
  },
  // Spider lilies like their feet damp, by the lake.
  spiderLily: {
    name: 'spider lilies',
    seed: 'spiderLilyBulb',
    harvest: { item: 'spiderLily', count: 2 },
    days: 4,
    thrives: ['lanternShore'],
  },
  // A real flower, near-black and shaped like a bat, with long whiskers. She loves bats. It grows
  // wild in the shade under forest trees, as hostas love the shade.
  batFlower: {
    name: 'bat flowers',
    seed: 'batFlowerSeed',
    harvest: { item: 'batFlower', count: 2 },
    days: 3,
    thrives: ['whisperwood'],
  },
  hosta: {
    name: 'hosta',
    seed: 'hostaDivision',
    harvest: { item: 'hosta', count: 1 },
    days: 2,
    thrives: ['whisperwood'],
  },
};

/** Which crop a seed grows, for the seed sheet and for planting. */
export function cropFromSeed(seed: ItemId): CropId | undefined {
  return (Object.keys(CROPS) as CropId[]).find((id) => CROPS[id].seed === seed);
}
