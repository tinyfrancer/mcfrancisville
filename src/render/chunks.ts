import { TILE_SIZE } from '../config/world';
import type { Point, Size } from './camera';

/**
 * The ground is baked in square chunks this many tiles across (decision 138): big enough that a
 * frame copies a couple of dozen at most, small enough that a place she has only crossed keeps
 * only the ground she saw, and that a change (the pond freezing over) re-bakes a corner of it.
 */
export const CHUNK_TILES = 8;

/** How a map divides into chunks: `cols` × `rows` of them, each `size` pixels but for the last edge. */
export interface ChunkGrid {
  cols: number;
  rows: number;
  /** A whole chunk's side, in pixels. */
  size: number;
  /** The map, in pixels. */
  width: number;
  height: number;
}

export interface ChunkRect {
  x: number;
  y: number;
  width: number;
  height: number;
}

export function chunkGrid(tiles: Size, chunkTiles = CHUNK_TILES, tile = TILE_SIZE): ChunkGrid {
  const size = chunkTiles * tile;
  return {
    cols: Math.ceil(tiles.width / chunkTiles),
    rows: Math.ceil(tiles.height / chunkTiles),
    size,
    width: tiles.width * tile,
    height: tiles.height * tile,
  };
}

/** The pixels a chunk covers, cut short at the map's right and bottom edges. */
export function chunkRect(grid: ChunkGrid, index: number): ChunkRect {
  const col = index % grid.cols;
  const row = Math.floor(index / grid.cols);
  const x = col * grid.size;
  const y = row * grid.size;
  return {
    x,
    y,
    width: Math.min(grid.size, grid.width - x),
    height: Math.min(grid.size, grid.height - y),
  };
}

/** The chunks under a view whose top-left is at `cam`, row-major. */
export function chunksInView(grid: ChunkGrid, cam: Point, view: Size): number[] {
  const col0 = clamp(Math.floor(cam.x / grid.size), 0, grid.cols - 1);
  const col1 = clamp(Math.floor((cam.x + view.width - 1) / grid.size), 0, grid.cols - 1);
  const row0 = clamp(Math.floor(cam.y / grid.size), 0, grid.rows - 1);
  const row1 = clamp(Math.floor((cam.y + view.height - 1) / grid.size), 0, grid.rows - 1);
  const out: number[] = [];
  for (let row = row0; row <= row1; row++) {
    for (let col = col0; col <= col1; col++) out.push(row * grid.cols + col);
  }
  return out;
}

/**
 * The chunks a change to these tiles reaches: each tile's own, and any within `margin` tiles of
 * it, since a tile is drawn from which of its neighbours carry it on and a hedge's shadow falls
 * on the tile below.
 */
export function chunksTouching(
  grid: ChunkGrid,
  tiles: Iterable<{ tx: number; ty: number }>,
  margin = 1,
  chunkTiles = CHUNK_TILES,
): Set<number> {
  const out = new Set<number>();
  const cols = grid.cols;
  const rows = grid.rows;
  for (const { tx, ty } of tiles) {
    const col0 = clamp(Math.floor((tx - margin) / chunkTiles), 0, cols - 1);
    const col1 = clamp(Math.floor((tx + margin) / chunkTiles), 0, cols - 1);
    const row0 = clamp(Math.floor((ty - margin) / chunkTiles), 0, rows - 1);
    const row1 = clamp(Math.floor((ty + margin) / chunkTiles), 0, rows - 1);
    for (let row = row0; row <= row1; row++) {
      for (let col = col0; col <= col1; col++) out.add(row * cols + col);
    }
  }
  return out;
}

/** Which tiles differ between two layouts of the same map. */
export function changedTiles<T>(
  before: readonly T[],
  after: readonly T[],
  width: number,
): { tx: number; ty: number }[] {
  const out: { tx: number; ty: number }[] = [];
  for (let i = 0; i < after.length; i++) {
    if (before[i] !== after[i]) out.push({ tx: i % width, ty: Math.floor(i / width) });
  }
  return out;
}

/**
 * The chunks of one ground, each made by `bake` the first time it's asked for and kept until it
 * is let go: when the tiles under it change, or when she leaves the place. What's baked is
 * whatever `bake` makes, so the bookkeeping is tested without a canvas.
 */
export class Chunks<T> {
  readonly grid: ChunkGrid;
  private readonly bake: (index: number) => T;
  private readonly made = new Map<number, T>();

  constructor(grid: ChunkGrid, bake: (index: number) => T) {
    this.grid = grid;
    this.bake = bake;
  }

  get(index: number): T {
    let chunk = this.made.get(index);
    if (chunk === undefined) {
      chunk = this.bake(index);
      this.made.set(index, chunk);
    }
    return chunk;
  }

  /** Lets go of these chunks, so the next `get` bakes them afresh. */
  invalidate(indexes: Iterable<number>): void {
    for (const i of indexes) this.made.delete(i);
  }

  /** Lets go of every chunk. */
  release(): void {
    this.made.clear();
  }

  /** How many chunks are baked now. */
  get baked(): number {
    return this.made.size;
  }

  /** Whether a chunk is baked now. */
  has(index: number): boolean {
    return this.made.has(index);
  }
}

function clamp(n: number, lo: number, hi: number): number {
  return Math.min(Math.max(n, lo), hi);
}
