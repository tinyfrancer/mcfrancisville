import type { CropId, ItemId, MapZoneId } from '../types/ids';
import type { Yield } from './gathering';
import { SEASON_MONTHS, type SeasonId } from './milestones';

export interface CropRow {
  /** How it's said in a sentence: "You watered the {name}." */
  name: string;
  /** What she plants it from. Every harvest gives one back (decisions.md 39). */
  seed: ItemId;
  harvest: Yield;
  /** How many mornings it takes to ripen unwatered. Each day it's watered counts as one more. */
  days: number;
  /**
   * Where it grows best, a day sooner: the plots beyond the town (0.2's N1), or a planter box at
   * home (0.2's N2).
   */
  thrives?: readonly (MapZoneId | 'home')[];
  /** Its own season, when it ripens a day sooner (0.2's N2); never slower out of it (decision 11). */
  season?: SeasonId;
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
  // 0.2's N2: food for the dishes the neighbours love (spaghetti, chips and guacamole, a roast
  // gourd, lavender shortbread), and more flowers, each a day sooner in its season.
  tomato: {
    name: 'tomatoes',
    seed: 'tomatoSeed',
    harvest: { item: 'tomato', count: 3 },
    days: 3,
    season: 'summer',
  },
  garlic: {
    name: 'garlic',
    seed: 'garlicClove',
    harvest: { item: 'garlic', count: 2 },
    days: 3,
    season: 'autumn',
  },
  // Herbs on the windowsill (question 86): basil does best in a planter box at home.
  basil: {
    name: 'basil',
    seed: 'basilSeed',
    harvest: { item: 'basil', count: 3 },
    days: 3,
    thrives: ['home'],
  },
  avocado: {
    name: 'avocado bush',
    seed: 'avocadoPit',
    harvest: { item: 'avocado', count: 2 },
    days: 4,
  },
  // The corn maze's own sweetcorn, tall and golden by October.
  sweetcorn: {
    name: 'sweetcorn',
    seed: 'sweetcornSeed',
    harvest: { item: 'sweetcorn', count: 2 },
    days: 4,
    season: 'autumn',
  },
  // The game's own: a little gourd that glows in the dark, like a nightlight on the vine.
  glowGourd: {
    name: 'glow gourds',
    seed: 'glowGourdSeed',
    harvest: { item: 'glowGourd', count: 1 },
    days: 3,
    season: 'autumn',
  },
  sunflower: {
    name: 'sunflower',
    seed: 'sunflowerSeed',
    harvest: { item: 'sunflower', count: 1 },
    days: 4,
    season: 'summer',
  },
  blackTulip: {
    name: 'black tulips',
    seed: 'tulipBulb',
    harvest: { item: 'blackTulip', count: 2 },
    days: 3,
    season: 'spring',
  },
  lavender: {
    name: 'lavender',
    seed: 'lavenderSeed',
    harvest: { item: 'lavender', count: 3 },
    days: 3,
    season: 'summer',
  },
  // For the Day of the Dead, at the end of the festival.
  marigold: {
    name: 'marigolds',
    seed: 'marigoldSeed',
    harvest: { item: 'marigold', count: 2 },
    days: 3,
    season: 'autumn',
  },
  // A real flower that blooms in the snow, and loves the shade under the woods' old trees
  // (question 87).
  christmasRose: {
    name: 'Christmas roses',
    seed: 'christmasRoseSeed',
    harvest: { item: 'christmasRose', count: 2 },
    days: 4,
    season: 'winter',
    thrives: ['whisperwood'],
  },
  // Irises like their feet wet, so they grow best by the lake (question 87).
  iris: {
    name: 'irises',
    seed: 'irisBulb',
    harvest: { item: 'iris', count: 2 },
    days: 3,
    season: 'spring',
    thrives: ['lanternShore'],
  },
};

/** Whether a crop planted in a month (1–12) is in its season. */
export function inSeason(crop: CropId, month: number): boolean {
  const season = CROPS[crop].season;
  return season !== undefined && SEASON_MONTHS[season].includes(month);
}

/** Which crop a seed grows, for the seed sheet and for planting. */
export function cropFromSeed(seed: ItemId): CropId | undefined {
  return (Object.keys(CROPS) as CropId[]).find((id) => CROPS[id].seed === seed);
}
