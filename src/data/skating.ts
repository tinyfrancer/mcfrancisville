import type { VillagerId } from '../types/ids';
import type { SpotName } from './maps';

/**
 * Someone else on the ice (V1's L4, decision 294): while the town's pond is frozen over (`FROZEN`,
 * round the new year), a neighbour skates on it for a few hours, a stop slipped into their day
 * from `from` until `until`, after which their day goes on as it was.
 */
export interface SkatingRow {
  villager: VillagerId;
  days: 'weekday' | 'weekend';
  from: number;
  until: number;
  at: SpotName<'town'>;
}

export const SKATING: readonly SkatingRow[] = [
  // Nessa, who comes into town at the weekend to look at the fountain, skates round it instead
  // once it's ice: the lake never freezes, so the pond is her one chance.
  { villager: 'nessa', days: 'weekend', from: 11, until: 15, at: 'pondIce' },
  { villager: 'nessa', days: 'weekday', from: 13, until: 15, at: 'pondIce' },
];
