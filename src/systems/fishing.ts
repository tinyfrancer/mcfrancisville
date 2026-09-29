import { hashString } from './random';

/*
 * Her rod (phase Q, decision 121). Once her float is in, a fish takes an interest in rounds: a
 * wait, a few nibbles that only dip the float, and then a bite, long enough to tap without
 * hurrying. A bite let go is followed by another round, for as long as she likes, so a fish is
 * never lost for a slow tap. Each round is worked out from the cast, never ticked.
 */

/** From the flick of her rod to the float landing. */
export const CAST_MS = 600;
/** How long a nibble dips the float. A tap then is too soon, and reels in empty. */
export const NIBBLE_MS = 300;
/** How long a bite holds the float under: a tap any time in it lands the fish. */
export const BITE_MS = 1500;

/** What her float is doing. */
export type LineState = 'casting' | 'waiting' | 'nibble' | 'bite';

/** One round of a fish's interest: when each nibble and then the bite come, from its start. */
export interface Round {
  nibbles: readonly number[];
  bite: number;
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

/** How long a round lasts, its bite let go. */
function lengthOf(round: Round): number {
  return round.bite + BITE_MS;
}

/** Where a line cast `elapsed` milliseconds ago is at. */
export function lineAt(seed: string, wary: number, elapsed: number, eager = false): LineAt {
  if (elapsed < CAST_MS) return { state: 'casting', round: 0 };
  let t = elapsed - CAST_MS;
  for (let round = 0; ; round++) {
    const r = roundOf(seed, round, wary, eager);
    if (t >= lengthOf(r)) {
      t -= lengthOf(r);
      continue;
    }
    if (t >= r.bite) return { state: 'bite', round };
    const nibble = r.nibbles.findIndex((n) => t >= n && t < n + NIBBLE_MS);
    return nibble >= 0 ? { state: 'nibble', round, nibble } : { state: 'waiting', round };
  }
}
