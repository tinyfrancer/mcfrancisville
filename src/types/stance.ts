import type { WorkId } from './ids';

/**
 * How a neighbour stands besides walking (V1's E3, decision 282): waving or at their job (`act`,
 * and which of its two frames), sat on a seat, breathing out, blinking.
 * `systems/neighbourLife.ts` says which; `sprites/villagers.ts` draws it.
 */
export interface Stance {
  act?: 'wave' | WorkId;
  frame?: number;
  sit?: boolean;
  out?: boolean;
  blink?: boolean;
}
