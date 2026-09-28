import type { ItemId, PatchId, PropId } from '../types/ids';

export interface RareYield {
  item: ItemId;
  /** One time in this many. */
  oneIn: number;
}

export interface Yield {
  item: ItemId;
  count: number;
  /** Now and then it gives this instead, one of it. */
  rare?: RareYield;
  /** Now and then it gives one of these as well. */
  bonus?: { from: readonly ItemId[]; oneIn: number };
}

/** Beads for her bracelets (phase 8), found in rocks and trees and sold in Cobweb Corner. */
export const BEADS: readonly ItemId[] = [
  'heartBead',
  'loveBeads',
  'smileyBead',
  'tigerFootballBead',
  'scarletFootballBead',
  'batBead',
  'ghostBead',
];

/** What each thing in town gives once a day, until the day turns over at 5am (decisions.md 4). */
export const PROP_YIELDS: Partial<Record<PropId, Yield>> = {
  // Beads turn up in about every other rock and one tree in eight: there are far more trees.
  tree: { item: 'wood', count: 3, bonus: { from: BEADS, oneIn: 8 } },
  rock: { item: 'stone', count: 2, bonus: { from: BEADS, oneIn: 2 } },
  // Their real garden has one rose bush (personal_touches.md), so hers is growing on day one.
  roseBush: { item: 'rose', count: 2, rare: { item: 'blueRose', oneIn: 12 } },
  // Whisperwood's (phase I): its old trees give more, and its toadstools grow back by morning.
  oldTree: { item: 'wood', count: 5, bonus: { from: BEADS, oneIn: 4 } },
  toadstools: { item: 'toadstool', count: 2 },
};

export const PATCHES: Record<PatchId, Yield> = {
  moonpetals: { item: 'moonpetal', count: 2 },
  forgetMeBoos: { item: 'forgetMeBoo', count: 2 },
  ghostDaisies: { item: 'ghostDaisy', count: 2 },
  milkweed: { item: 'milkweed', count: 2 },
};

/** The late-night snacks. One of them turns up somewhere in town each night. */
export const SNACKS: readonly ItemId[] = [
  'midnightPizza',
  'batWingCookie',
  'pumpkinPudding',
  'ghostMallow',
];
