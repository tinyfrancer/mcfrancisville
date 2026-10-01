import type { PropId } from '../types/ids';

/**
 * A seat (0.2's G1): how high it holds her, in pixels up from the floor at its front edge to where
 * she rests. Walking up to one sits her down, and the next tap stands her up; nothing else
 * happens (decision 136).
 */
export interface SeatRow {
  height: number;
}

/** What she can sit on outdoors: the benches by the water, a fallen log, a stump in the woods. */
export const PROP_SEATS: Partial<Record<PropId, SeatRow>> = {
  bench: { height: 14 },
  log: { height: 12 },
  stump: { height: 12 },
};
