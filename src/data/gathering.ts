import type { ItemId, PatchId, PropId } from '../types/ids';

export interface Yield {
  item: ItemId;
  count: number;
}

/** What each thing in town gives once a day, until the day turns over at 5am (decisions.md 4). */
export const PROP_YIELDS: Partial<Record<PropId, Yield>> = {
  tree: { item: 'wood', count: 3 },
  rock: { item: 'stone', count: 2 },
};

export const PATCHES: Record<PatchId, Yield> = {
  moonpetals: { item: 'moonpetal', count: 2 },
  forgetMeBoos: { item: 'forgetMeBoo', count: 2 },
  ghostDaisies: { item: 'ghostDaisy', count: 2 },
};

/** The late-night snacks. One of them turns up somewhere in town each night. */
export const SNACKS: readonly ItemId[] = [
  'midnightPizza',
  'batWingCookie',
  'pumpkinPudding',
  'ghostMallow',
];
