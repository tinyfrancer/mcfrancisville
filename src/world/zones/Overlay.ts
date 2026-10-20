import type { PlacedProp } from '../../systems/grid';

/**
 * Something that stands in a place outdoors over its map (1.1's W1, decision 340): the lots'
 * houses, the day's decorations, the project sites, the stalls, a shut gate, today's mound, the
 * farm's built rows, her yard's pieces. `MapZone` asks a list of them, in order, where she can
 * walk and what she walks up to, so a new thing standing in a place is a line in that list.
 */
export interface Overlay {
  /** What of it stands on a tile, to be walked up to; absent if it only stands in the way. */
  propAt?(tx: number, ty: number): PlacedProp | undefined;
  /** Whether it stands in the way on a tile, so nobody walks there. */
  blocks(tx: number, ty: number): boolean;
}
