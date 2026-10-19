import type { Rarity } from '../data/critters';
import type { Grade } from './activities';
import { hashMixed, hashString } from './random';

/*
 * Her rod (phase Q, decision 121). Once her float is in, a fish takes an interest in rounds: a
 * wait, a few nibbles that only dip the float, and then a bite, long enough to tap without
 * hurrying. A bite let go is followed by another round, for as long as she likes, so a fish is
 * never lost for a slow tap. Each round is worked out from the cast, never ticked.
 *
 * V1's R6a (decision 316): the bite is shorter the rarer the fish, and a rare or legendary one,
 * hooked, is reeled in with a tap in time on a sweeping tension bar. A tap outside its window
 * only lets the line go slack, and the fish comes round to bite again: nothing is ever lost.
 */

/** From the flick of her rod to the float landing. */
export const CAST_MS = 600;
/** How long a nibble dips the float. A tap then is too soon, and reels in empty. */
export const NIBBLE_MS = 300;
/**
 * How long a bite holds the float under, by how rare the fish is (V1's R6a): a tap any time in it
 * hooks the fish. A common one gives her all the time in the world; a legendary one, a blink.
 */
export const BITE_MS: Record<Rarity, number> = {
  common: 1500,
  uncommon: 1100,
  rare: 900,
  legendary: 700,
};

/** What her float is doing; `reel` is a rare fish hooked, the tension bar sweeping. */
export type LineState = 'casting' | 'waiting' | 'nibble' | 'bite' | 'reel';

/** One round of a fish's interest: when each nibble and then the bite come, from its start. */
export interface Round {
  nibbles: readonly number[];
  bite: number;
}

/** What a fish on her line is like: how wary, how long it bites, and whether it's eager. */
export interface Nibbler {
  wary: number;
  biteMs: number;
  /** She ate something the fish can smell on her (phase R), and it comes quicker. */
  eager?: boolean;
}

/** Where her line is at: its state, which round, and which nibble if it's nibbling. */
export interface LineAt {
  state: LineState;
  round: number;
  nibble?: number;
}

/**
 * A round of a fish's interest, the same for the same cast. A wary fish (the rare ones) nibbles
 * a couple of times more before it bites, which is all its wariness comes to on a rod. An `eager`
 * one (she ate something the fish can smell on her, phase R) comes quicker and hardly nibbles.
 */
export function roundOf(seed: string, round: number, wary: number, eager = false): Round {
  const roll = hashString(`${seed}#${round}`);
  let at = eager ? 400 + (roll % 500) : 900 + (roll % 1500);
  const count = eager ? wary : ((roll >>> 11) % 3) + wary * 2;
  const nibbles: number[] = [];
  for (let i = 0; i < count; i++) {
    nibbles.push(at);
    at += NIBBLE_MS + 450 + (hashString(`${seed}#${round}:${i}`) % 600);
  }
  return { nibbles, bite: at };
}

/** Where a line cast `elapsed` milliseconds ago is at. */
export function lineAt(seed: string, fish: Nibbler, elapsed: number): LineAt {
  if (elapsed < CAST_MS) return { state: 'casting', round: 0 };
  let t = elapsed - CAST_MS;
  for (let round = 0; ; round++) {
    const r = roundOf(seed, round, fish.wary, fish.eager);
    const length = r.bite + fish.biteMs;
    if (t >= length) {
      t -= length;
      continue;
    }
    if (t >= r.bite) return { state: 'bite', round };
    const nibble = r.nibbles.findIndex((n) => t >= n && t < n + NIBBLE_MS);
    return nibble >= 0 ? { state: 'nibble', round, nibble } : { state: 'waiting', round };
  }
}

/**
 * When the bite she's in, or the next one, starts and ends, in ms from the cast: what a tap in time
 * waits for (the tests' and smoke's timed tap).
 */
export function nextBite(
  seed: string,
  fish: Nibbler,
  elapsed: number,
): { from: number; to: number } {
  let start = CAST_MS;
  for (let round = 0; ; round++) {
    const r = roundOf(seed, round, fish.wary, fish.eager);
    const from = start + r.bite;
    const to = from + fish.biteMs;
    if (elapsed < to) return { from, to };
    start = to;
  }
}

// ---- The reel (V1's R6a) --------------------------------------------------------------------

/**
 * A hooked fish's tension bar: a needle sweeping there and back across it, and the window she
 * taps it in, dealt from the cast. `period` is a sweep there and back.
 */
export interface Reel {
  period: number;
  /** The middle of the window along the bar, 0 to 1. */
  target: number;
  /** How near the middle lands it (good) and lands it beautifully (perfect), along the bar. */
  perfect: number;
  good: number;
}

/**
 * The tension bar for each tier that has one: a rare fish sweeps gently, a legendary one a little
 * quicker and narrower. Common and uncommon fish come straight in on the bite.
 */
export const REELS: Partial<Record<Rarity, Omit<Reel, 'target'>>> = {
  rare: { period: 1800, perfect: 0.05, good: 0.15 },
  legendary: { period: 1500, perfect: 0.04, good: 0.12 },
};

/** How many sweeps the needle makes before the line goes slack by itself, untapped. */
export const REEL_SWEEPS = 3;

/** A hooked fish's tension bar, or null if it needs no reeling: the same for the same cast. */
export function reelOf(seed: string, rarity: Rarity): Reel | null {
  const row = REELS[rarity];
  if (!row) return null;
  const target = 0.3 + (hashMixed(`reel:${seed}`) % 400) / 1000;
  return { ...row, target };
}

const frac = (x: number) => x - Math.floor(x);

/** Where the needle is along the bar, `ms` after the hook: from the left, there and back. */
export function needleAt(reel: Reel, ms: number): number {
  const u = frac(Math.max(0, ms) / reel.period);
  return u < 0.5 ? u * 2 : 2 - u * 2;
}

/** How long the bar sweeps before the line goes slack, untapped. */
export const reelLength = (reel: Reel): number => reel.period * REEL_SWEEPS;

/** How well a tap `ms` after the hook went: 2 beautifully, 1 landed, 0 slack (nothing lost). */
export function reelGrade(reel: Reel, ms: number): Grade {
  const d = Math.abs(needleAt(reel, ms) - reel.target);
  return d <= reel.perfect ? 2 : d <= reel.good ? 1 : 0;
}

/** The next moment from `ms` on that the needle is right on the window's middle. */
export function bestReelAfter(reel: Reel, ms: number): number {
  const half = reel.period / 2;
  const there = reel.target * half;
  const candidates: number[] = [];
  for (let k = Math.floor(Math.max(0, ms) / reel.period); candidates.length < 4; k++) {
    candidates.push(k * reel.period + there, k * reel.period + reel.period - there);
  }
  return candidates.filter((t) => t >= ms).sort((a, b) => a - b)[0]!;
}
