/**
 * The id unions. Data is keyed by these through `Record<Id, …>`, so adding an id is a compile error
 * everywhere it has to be answered.
 */
export type TileId = 'grass' | 'flowers' | 'path' | 'water' | 'waterEdge' | 'hedge';

export type PropId =
  | 'tree'
  | 'pumpkin'
  | 'lantern'
  | 'gravestone'
  | 'fence'
  | 'fencePost'
  | 'well'
  | 'homeHouse'
  | 'shopHouse'
  | 'salonHouse';

export type Facing = 'down' | 'up' | 'left' | 'right';
