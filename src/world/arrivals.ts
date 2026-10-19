import type { PlacedProp } from '../systems/grid';
import type { Tile } from '../systems/pathfinding';
import type { PropId } from '../types/ids';
import type { Arrived, WorldEvent } from './events';
import type { MapZone } from './zones/MapZone';

/** Where she has walked up to a prop, for whatever arriving there does. */
export interface AtProp {
  prop: PlacedProp;
  /** The tile she stands on. */
  here: Tile;
  /** Her arrival, which a handler may fill in (what a goose says). */
  arrived: Arrived;
  /** The place outdoors she's in, or undefined indoors. */
  place: MapZone | undefined;
}

/**
 * What walking up to one kind of prop does (1.1's W1, decision 340): the moments after her
 * arrival, or null to let it go on to a door, a way out and gathering, as a goose indoors would.
 */
export type OnArrival = (at: AtProp) => WorldEvent[] | null;

/**
 * Arriving at a prop, by its id: each row given by the area that makes the service doing it, as
 * `World`'s `arrivals` are by visit kind. Asked before the door, the way out and gathering.
 */
export type PropArrivals = Partial<Record<PropId, OnArrival>>;

/** The areas' rows as one table; a prop two areas both claim is a mistake, said at once. */
export function arrivalsOf(...tables: readonly PropArrivals[]): PropArrivals {
  const all: PropArrivals = {};
  for (const table of tables) {
    for (const id of Object.keys(table) as PropId[]) {
      if (all[id]) throw new Error(`Two areas say what arriving at ${id} does`);
      all[id] = table[id];
    }
  }
  return all;
}
