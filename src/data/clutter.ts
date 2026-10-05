import type { MapZoneId, PropId, TileId } from '../types/ids';

/** The flat things the ground is baked with (phase L): nothing she can pick up or bump into. */
export type DecalId = 'leaves' | 'pebbles' | 'lilyPad' | 'twigs';

/**
 * Where a place scatters one kind of decal: on which ground, on about one tile in `oneIn`, and, if
 * `near` is given, only beside one of those props (fallen leaves under the trees).
 */
export interface ClutterRule {
  decal: DecalId;
  on: TileId;
  oneIn: number;
  near?: readonly PropId[];
}

const TREES: readonly PropId[] = ['tree', 'oldTree', 'willow'];
/** Boo Acres' fruit trees (0.3's F1). */
const ORCHARD: readonly PropId[] = ['appleTree', 'pearTree', 'plumTree', 'persimmonTree'];

/**
 * What each place outdoors is scattered with. A tile takes the first rule that lands on it, and
 * never one where something stands, flowers grow or she has a garden bed.
 */
export const CLUTTER: Record<MapZoneId, readonly ClutterRule[]> = {
  town: [
    { decal: 'leaves', on: 'grass', oneIn: 2, near: TREES },
    // Leaves blown up against the well, so the square isn't bare cobbles (0.2's K1).
    { decal: 'leaves', on: 'path', oneIn: 2, near: ['well'] },
    { decal: 'pebbles', on: 'path', oneIn: 9 },
    { decal: 'lilyPad', on: 'water', oneIn: 6 },
  ],
  whisperwood: [
    { decal: 'leaves', on: 'grass', oneIn: 2, near: TREES },
    { decal: 'twigs', on: 'grass', oneIn: 7 },
    { decal: 'pebbles', on: 'path', oneIn: 6 },
  ],
  lanternShore: [
    { decal: 'lilyPad', on: 'water', oneIn: 7 },
    { decal: 'leaves', on: 'grass', oneIn: 3, near: TREES },
    { decal: 'pebbles', on: 'path', oneIn: 7 },
  ],
  castleHill: [
    { decal: 'leaves', on: 'grass', oneIn: 3, near: TREES },
    { decal: 'pebbles', on: 'path', oneIn: 10 },
  ],
  // Straw blown off the hay, and leaves under the orchard and the trees round the edge (0.3's F1).
  booAcres: [
    { decal: 'leaves', on: 'grass', oneIn: 2, near: [...TREES, ...ORCHARD] },
    { decal: 'lilyPad', on: 'water', oneIn: 5 },
    { decal: 'pebbles', on: 'path', oneIn: 8 },
    { decal: 'twigs', on: 'grass', oneIn: 10 },
  ],
  // Trodden grass round the midway, and leaves under its trees (0.2's M1).
  fairground: [
    { decal: 'leaves', on: 'grass', oneIn: 2, near: TREES },
    { decal: 'pebbles', on: 'path', oneIn: 7 },
    { decal: 'twigs', on: 'grass', oneIn: 9 },
  ],
  hiddenClearing: [
    { decal: 'lilyPad', on: 'water', oneIn: 3 },
    { decal: 'leaves', on: 'grass', oneIn: 2, near: TREES },
    { decal: 'twigs', on: 'grass', oneIn: 6 },
  ],
};
