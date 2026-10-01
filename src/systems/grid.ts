import { PROP_FOOTPRINT, type DoorSource, type MapSource } from '../data/maps';
import type { MapZoneId, PatchId, PropId, TileId, ZoneId } from '../types/ids';

export interface PlacedProp {
  id: PropId;
  /** Top-left tile of the footprint. */
  tx: number;
  ty: number;
  w: number;
  h: number;
  /** A signpost's: the place it names, and which way its board points to the way there. */
  sign?: Signpost;
  /**
   * A fence's: which of its neighbours are fence too, as the ground's are (1 up, 2 right, 4
   * down, 8 left), so a run joins up and turns its corners (0.2's K1).
   */
  joins?: number;
}

/** The props that join up with their own kind, a fence going round a corner. */
const JOINING: ReadonlySet<PropId> = new Set<PropId>(['fence', 'fencePost']);

export interface Signpost {
  to: MapZoneId;
  way: 'left' | 'right';
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
  /** A gate hangs across it (`ExitSource.gate`). */
  gate?: true;
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
  /** The rows kept for the farm's extensions (0.2's N1): the first row's tiles first. */
  plots: { tx: number; ty: number }[][];
  /** Where the pop-up shop may stand, by the top-left of its footprint. */
  popUpLots: { tx: number; ty: number }[];
  peddlerSpots: { tx: number; ty: number }[];
  exits: MapExit[];
  doors: DoorSource[];
  /** Monarchs fluttering about, to be seen (`MapSource.butterflies`). */
  butterflies: number;
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
  const plots: { tx: number; ty: number }[][] = [];

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
      if (entry.plot) (plots[entry.plot - 1] ??= []).push({ tx, ty });
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
  for (const sign of source.signs ?? []) {
    const post = props.find((p) => p.id === 'signpost' && p.tx === sign.tx && p.ty === sign.ty);
    if (!post) throw new Error(`no signpost at ${sign.tx},${sign.ty}`);
    const exit = exits.find((e) => e.to === sign.to);
    if (!exit)
      throw new Error(`the signpost at ${sign.tx},${sign.ty} names ${sign.to}, no way out`);
    post.sign = { to: sign.to, way: exit.tx + exit.w / 2 < sign.tx + 0.5 ? 'left' : 'right' };
  }
  const fences = new Set(props.filter((p) => JOINING.has(p.id)).map((p) => p.ty * width + p.tx));
  for (const p of props) {
    if (!JOINING.has(p.id)) continue;
    const at = (dx: number, dy: number) => fences.has((p.ty + dy) * width + p.tx + dx);
    p.joins =
      (p.ty > 0 && at(0, -1) ? 1 : 0) |
      (p.tx < width - 1 && at(1, 0) ? 2 : 0) |
      (at(0, 1) ? 4 : 0) |
      (p.tx > 0 && at(-1, 0) ? 8 : 0);
  }
  const nameless = props.find((p) => p.id === 'signpost' && !p.sign);
  if (nameless) throw new Error(`the signpost at ${nameless.tx},${nameless.ty} names nowhere`);
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
    plots: Array.from(plots, (row) => row ?? []),
    popUpLots,
    peddlerSpots,
    exits,
    doors,
    butterflies: source.butterflies ?? 0,
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
