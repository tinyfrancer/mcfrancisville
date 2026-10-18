import { FISH_SIZES } from '../data/fishSizes';
import type { CritterId } from '../types/ids';
import { hashMixed } from './random';

/*
 * How big a fish she lands is (V1's R6a, decision 316): somewhere in its row's range, dealt from
 * the cast, the middling sizes likeliest and the very biggest, a whopper, a treat. Measured in her
 * own hands, in quarters, which is how she'd hold it up to show Cody.
 */

/** The size of a fish landed from a cast, in quarters of a hand; null for anything not a fish. */
export function sizeOf(id: CritterId, seed: string): number | null {
  const range = FISH_SIZES[id];
  if (!range) return null;
  const [least, most] = range;
  // Two rolls averaged, so a fish is more often middling than tiny or huge.
  const a = (hashMixed(`size:a:${seed}`) % 1000) / 1000;
  const b = (hashMixed(`size:b:${seed}`) % 1000) / 1000;
  return Math.min(most, least + Math.floor(((a + b) / 2) * (most - least + 1)));
}

/** Whether a size is a whopper for its kind: in the top fifth of what it comes in. */
export function isWhopper(id: CritterId, size: number): boolean {
  const range = FISH_SIZES[id];
  if (!range) return false;
  const [least, most] = range;
  return size >= most - Math.floor((most - least) / 5);
}

const WHOLE = ['', 'one', 'two', 'three', 'four', 'five', 'six', 'seven', 'eight', 'nine', 'ten'];
const QUARTERS = ['', ' and a quarter', ' and a half', ' and three quarters'];

/** A size as she'd say it: "half a hand", "a hand and a quarter", "two and a half hands". */
export function handsOf(size: number): string {
  const whole = Math.floor(size / 4);
  const part = size % 4;
  if (whole === 0)
    return ['', 'a quarter of a hand', 'half a hand', 'three quarters of a hand'][part]!;
  if (whole === 1) return `a hand${QUARTERS[part]!}`;
  return `${WHOLE[whole] ?? String(whole)}${part === 3 ? ' and three quarter' : QUARTERS[part]!} hands`;
}
