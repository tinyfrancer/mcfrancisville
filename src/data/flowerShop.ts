import type { FurnitureId, ItemId, VillagerId } from '../types/ids';
import type { HolidayId } from './calendar';
import type { ShopRow, Ware } from './shop';

/*
 * Rufus's flower buckets (V1's P4): the werewolf florist's job, seen. Walking up to his buckets in
 * his cabin (or the ones he keeps in the greenhouse) opens them as a shop, an honesty jar beside
 * them, so the roses he says he sells are roses she can buy, and grow.
 */

const flowers = (...ids: ItemId[]): Ware[] => ids.map((item) => ({ item }));
const pieces = (...ids: FurnitureId[]): Ware[] => ids.map((furniture) => ({ furniture }));

/**
 * What's in his buckets to grow: a bulb, a cutting or a packet of every flower, a few a day. What
 * she grows is wanted at double at Cobweb Corner (`data/wanted.ts`), so he sells it to grow, never
 * picked (the economy test holds it).
 */
const BUCKETS = flowers(
  'moonflowerSeed',
  'snapdragonSeed',
  'spiderLilyBulb',
  'batFlowerSeed',
  'sunflowerSeed',
  'tulipBulb',
  'lavenderSeed',
  'marigoldSeed',
  'christmasRoseSeed',
  'irisBulb',
  'hostaDivision',
);

/** His morning's pick in Whisperwood, in the bucket. */
const WILDFLOWERS = flowers('moonpetal', 'forgetMeBoo', 'ghostDaisy');

/** Something to put them in: his bouquets go out in a vase. */
const VASES = pieces('budVase', 'ghostVase');

export const FLOWER_SHOP: ShopRow = {
  name: "Rufus's flower buckets",
  greeting:
    "Rufus's flowers! Pick a bunch, pop your Candy in the jar. He'll know. He can smell honesty.",
  shelves: [
    // Roses every day, to grow: he sells every one on Valentine's, and buys one back for her.
    { name: 'Roses', picks: [{ from: flowers('roseSeed'), count: 1 }] },
    { name: "Today's buckets", picks: [{ from: BUCKETS, count: 4 }] },
    { name: 'Picked this morning', picks: [{ from: WILDFLOWERS, count: 2 }] },
    { name: 'For a bouquet', picks: [{ from: VASES, count: 1 }] },
  ],
};

/**
 * What one neighbour hands her with their holiday line, where the whole town has no treat that
 * day: on Valentine's, Rufus has sold every rose in his buckets by nine, and bought one back for
 * her (his line in `holidayLines.ts`).
 */
export const HOLIDAY_GIFTS: Partial<Record<HolidayId, Partial<Record<VillagerId, ItemId>>>> = {
  valentines: { rufus: 'rose' },
};
