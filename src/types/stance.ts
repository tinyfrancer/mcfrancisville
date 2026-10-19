import type { WorkId } from './ids';
import type { Feeling } from './mood';

/**
 * How a neighbour stands besides walking (V1's E3, decision 282): waving or at their job (`act`,
 * and which of its two frames), sat on a seat, breathing out, blinking; and how they feel about
 * what they're saying (`feel`, V1's L7), on their face in the world and on their bust alike.
 * `systems/neighbourLife.ts` says which; `sprites/villagers.ts` draws it.
 */
export interface Stance {
  act?: 'wave' | WorkId;
  frame?: number;
  sit?: boolean;
  out?: boolean;
  blink?: boolean;
  feel?: Feeling;
}
