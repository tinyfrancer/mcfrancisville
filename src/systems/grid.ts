import { PROP_FOOTPRINT, type DoorSource, type MapSource } from '../data/maps';
import type { PatchId, PropId, TileId, ZoneId } from '../types/ids';

export interface PlacedProp {
  id: PropId;
  /** Top-left tile of the footprint. */
  tx: number;
  ty: number;
  w: number;
  h: number;
}

export interface PlacedPatch {
  id: PatchId;
  tx: number;
  ty: number;
}

/** A way out at the map's edge, as the box of tiles she walks onto. */
export interface MapExit {
  to: ZoneId;
  tx: number;
  ty: number;
  w: number;
  h: number;
}

export interface TileMap {
  width: number;
  height: number;
  tiles: TileId[];
  props: PlacedProp[];
  /** Row-major, true where nothing may stand. */
  solid: boolean[];
  spawn: { tx: number; ty: number };
  patches: PlacedPatch[];
  snackSpots: { tx: number; ty: number }[];
  /** Her garden beds, each tile one bed, tended from beside it. */
  beds: { tx: number; ty: number }[];
  /** Where the pop-up shop may stand, by the top-left of its footprint. */
  popUpLots: { tx: number; ty: number }[];
  peddlerSpots: { tx: number; ty: number }[];
  exits: MapExit[];
  doors: DoorSource[];
}

/**
 * Turns a map's text into tiles, props and a walkability grid. A multi-tile prop is written as a
 * block of its letter the size of its footprint, so the text looks like the town; a block of the
 * wrong size is a mistake in the map and throws rather than drawing half a house.
 */
export function parseMap(source: MapSource): TileMap {
  const height = source.rows.length;
  const width = source.rows[0]?.length ?? 0;
  const tiles: TileId[] = [];
  const solid: boolean[] = [];
  const claimed = new Array<boolean>(width * height).fill(false);
  const props: PlacedProp[] = [];
  const patches: PlacedPatch[] = [];
  const beds: { tx: number; ty: number }[] = [];

  const charAt = (tx: number, ty: number): string | undefined => source.rows[ty]?.[tx];

  for (let ty = 0; ty < height; ty++) {
    const row = source.rows[ty]!;
    if (row.length !== width) throw new Error(`map row ${ty} is ${row.length} wide, not ${width}`);
    for (let tx = 0; tx < width; tx++) {
      const ch = row[tx]!;
      const entry = source.legend[ch];
      if (!entry) throw new Error(`map character '${ch}' at ${tx},${ty} is not in the legend`);
      tiles.push(entry.tile);
      solid.push(entry.solid ?? false);
      if (entry.patch) patches.push({ id: entry.patch, tx, ty });
      if (entry.tile === 'bed') beds.push({ tx, ty });
    }
  }

  for (let ty = 0; ty < height; ty++) {
    for (let tx = 0; tx < width; tx++) {
      const ch = charAt(tx, ty)!;
      const id = source.legend[ch]!.prop;
      if (!id || claimed[ty * width + tx]) continue;
      const { w, h } = PROP_FOOTPRINT[id];
      for (let dy = 0; dy < h; dy++) {
        for (let dx = 0; dx < w; dx++) {
          const at = (ty + dy) * width + tx + dx;
          if (charAt(tx + dx, ty + dy) !== ch || claimed[at]) {
            throw new Error(`the ${id} at ${tx},${ty} needs a ${w}x${h} block of '${ch}'`);
          }
          claimed[at] = true;
          solid[at] = true;
        }
      }
      props.push({ id, tx, ty, w, h });
    }
  }

  const snackSpots = (source.snackSpots ?? []).map((t) => ({ ...t }));
  const popUpLots = (source.popUpLots ?? []).map((t) => ({ ...t }));
  const peddlerSpots = (source.peddlerSpots ?? []).map((t) => ({ ...t }));
  const spawn = { ...source.spawn };
  const exits = (source.exits ?? []).map((e) => ({ ...e, w: e.w ?? 1, h: e.h ?? 1 }));
  const doors = (source.doors ?? []).map((d) => ({ ...d }));
  return {
    width,
    height,
    tiles,
    props,
    solid,
    spawn,
    patches,
    snackSpots,
    beds,
    popUpLots,
    peddlerSpots,
    exits,
    doors,
  };
}

export function walkable(map: TileMap, tx: number, ty: number): boolean {
  if (tx < 0 || ty < 0 || tx >= map.width || ty >= map.height) return false;
  return !map.solid[ty * map.width + tx];
}

export function tileAt(map: TileMap, tx: number, ty: number): TileId | undefined {
  if (tx < 0 || ty < 0 || tx >= map.width || ty >= map.height) return undefined;
  return map.tiles[ty * map.width + tx];
}
