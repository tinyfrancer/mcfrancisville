import type { FairPrizeId } from '../types/ids';
import type { ItemRow } from './items';

/*
 * What's only ever won at the Hollow Fairground (V1's R6b, decision 315): the best prize at the
 * duck pond and the strength bell. On no shelf, and Ollie's catalogue never offers it again
 * (`orderPrice`); worth less than a go, as every prize is; a squishy, on her squishy shelf with the
 * rest and three of them a figurine at Gourdon's bench.
 */

export const FAIR_PRIZES = ['luckyDuckSquish'] as const satisfies readonly FairPrizeId[];

export const FAIR_PRIZE_ITEMS: Record<FairPrizeId, ItemRow> = {
  luckyDuckSquish: {
    name: 'Lucky duck squish',
    kind: 'squishy',
    description:
      'A squeezy little ghost duckling in a gold paper crown, only ever won at the Hollow Fairground. Squeeze it and it quacks "boo".',
  },
};

export const FAIR_PRIZE_VALUES: Record<FairPrizeId, number> = {
  luckyDuckSquish: 12,
};
