import type { CritterId } from '../types/ids';

/**
 * How big each fish comes (V1's R6a, decision 316), smallest to biggest, in quarters of her hand:
 * 4 is a hand long, 10 two and a half. Each range sits in its shadow's: a small shadow half a hand
 * to a hand and a half, a middling one a hand and a quarter to three and a half, a big one two and
 * a half and up. Every fish has a row, and nothing else does (`tests/systems/catchSize.test.ts`).
 */
export const FISH_SIZES: Partial<Record<CritterId, readonly [least: number, most: number]>> = {
  ghostMinnow: [2, 5],
  pumpkinseed: [2, 6],
  crawdad: [2, 5],
  lanternFish: [3, 6],
  snowglobeFish: [3, 6],
  icicleSmelt: [2, 5],
  bobblePerch: [5, 11],
  auroraTrout: [7, 14],
  coldMoonSturgeon: [14, 24],
  moonCarp: [5, 11],
  booKoi: [6, 12],
  catfish: [6, 14],
  blueMoonfish: [6, 12],
  glowJelly: [5, 10],
  ghostPike: [10, 20],
  fogEel: [10, 24],
};

/** The range a fish's shadow allows its sizes, by shadow (small, middling, big). */
export const SHADOW_SIZES: Record<1 | 2 | 3, readonly [least: number, most: number]> = {
  1: [2, 6],
  2: [5, 14],
  3: [10, 24],
};
