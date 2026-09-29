import type { FurnitureId, ItemId } from '../types/ids';
import { BEADS } from './gathering';

/**
 * A gift for every visit (decisions.md 115): a visit is a day she opens the game, and they count
 * up and never down, so a day away is never a streak broken, only a gift waiting for the next.
 */
export type VisitGift =
  { candy: number } | { item: ItemId; count: number } | { furniture: FurnitureId };

/** A gift in the week's round: some Candy, or one of a few things, taking turns round to round. */
export type RoundGift = { candy: number } | { oneOf: readonly ItemId[]; count: number };

const SEEDS: readonly ItemId[] = [
  'pumpkinSeed',
  'moonflowerSeed',
  'candyCornSeed',
  'snapdragonSeed',
  'ghostPepperSeed',
  'batFlowerSeed',
  'roseSeed',
];

const SNACKS: readonly ItemId[] = ['batWingCookie', 'ghostMallow', 'pumpkinPudding', 'moonPieMini'];

/** The ordinary visits, seven to a round: Candy, seeds, a bead, a snack. */
export const VISIT_ROUND: readonly RoundGift[] = [
  { candy: 30 },
  { oneOf: SEEDS, count: 3 },
  { oneOf: BEADS, count: 1 },
  { candy: 40 },
  { oneOf: SNACKS, count: 1 },
  { oneOf: SEEDS, count: 3 },
  { candy: 50 },
];

/** The visits worth a little more, by number: a welcome, then something for the house. */
export const VISIT_MILESTONES: Readonly<Record<number, VisitGift>> = {
  1: { item: 'ghostMallow', count: 2 },
  7: { furniture: 'floatingCandles' },
  14: { item: 'ghostGooBall', count: 1 },
  30: { furniture: 'batGarland' },
  50: { furniture: 'crystalBall' },
  75: { item: 'blueMoonGooBall', count: 1 },
  100: { furniture: 'moonPainting' },
  150: { furniture: 'velvetSettee' },
  200: { furniture: 'stainedGlass' },
  365: { furniture: 'blueRoseDome' },
};

/** Every hundredth visit past the table's, a bigger handful of Candy. */
export const HUNDREDTH_VISIT: VisitGift = { candy: 300 };
