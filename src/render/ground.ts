import { TILE_SIZE } from '../config/world';
import { bake } from '../sprites/bake';
import { PALETTE, SHADOW_ALPHA } from '../sprites/palette';
import { PROP_ART } from '../sprites/props';
import { DECAL_ART, DECAL_PALETTE } from '../sprites/clutter';
import type { ClutterRule } from '../data/clutter';
import { decalsOf, type Decal } from './clutter';
import { puddlesOf, type Puddle } from './puddles';
import { PUDDLE_ART, PUDDLE_PALETTE } from '../sprites/puddles';
import { groundPieces } from '../sprites/terrain';
import { tileAt, type TileMap } from '../systems/grid';
import type { TileId } from '../types/ids';
import type { Point, Size } from './camera';
import {
  changedTiles,
  Chunks,
  chunkGrid,
  chunkRect,
  chunksInView,
  chunksTouching,
  type ChunkRect,
} from './chunks';

export { SHADOW_ALPHA };

/**
 * Fills a pixel ellipse centred on (cx, cy), one row at a time with no smoothing, so a shadow has
 * the same crisp stepped edge as the art it sits under.
 */
export function fillPixelEllipse(
  ctx: CanvasRenderingContext2D,
  cx: number,
  cy: number,
  w: number,
  h: number,
): void {
  const ry = h / 2;
  const rx = w / 2;
  for (let row = 0; row < h; row++) {
    const dy = (row + 0.5 - ry) / ry;
    const half = Math.round(rx * Math.sqrt(Math.max(0, 1 - dy * dy)));
    if (half > 0) ctx.fillRect(Math.round(cx - half), Math.round(cy - ry + row), half * 2, 1);
  }
}

function context(canvas: HTMLCanvasElement): CanvasRenderingContext2D {
  const ctx = canvas.getContext('2d');
  if (!ctx) throw new Error('no 2d context');
  return ctx;
}

function blank(width: number, height: number): HTMLCanvasElement {
  const canvas = document.createElement('canvas');
  canvas.width = width;
  canvas.height = height;
  return canvas;
}

/**
 * How far, in tiles, beyond a chunk's edge its bake reaches: a tile is drawn from its neighbours,
 * a hedge's shadow falls a few pixels onto the tile below and a bed's onto the one beside, so a
 * chunk baked with a ring of its neighbours' tiles comes out pixel for pixel as the whole map
 * would, and the seams between chunks aren't there.
 */
const BAKE_MARGIN = 1;

/** Ground that stands up off the grass, and so casts a shadow and takes none of its own. */
const RAISED: ReadonlySet<TileId | undefined> = new Set(['hedge', 'cliff', 'bed']);

/**
 * A place's ground, baked in chunks (decision 138, superseding 23's one canvas): each tile grass
 * with whatever lies on it shaped by its neighbours (`sprites/terrain.ts`), then the place's
 * clutter (fallen leaves, pebbles, lily pads), and over it all the shadows. A chunk is baked the
 * first time the camera reaches it and kept; each frame copies only the chunks under the view.
 * When the tiles change (the pond freezing over, `retile`) only the chunks they touch are baked
 * again, and when she leaves the place (`release`) the lot is let go, to be baked again as she
 * comes back to it.
 */
export class Ground {
  private map: TileMap;
  private readonly clutter: readonly ClutterRule[];
  private decals: Decal[];
  private readonly chunks: Chunks<HTMLCanvasElement>;
  /** Whether it's baked as it looks in the rain, dark and with puddles (V1's L3). */
  private isWet = false;
  private puddles: Puddle[] | null = null;

  constructor(map: TileMap, clutter: readonly ClutterRule[] = [], chunkTiles?: number) {
    this.map = map;
    this.clutter = clutter;
    this.decals = decalsOf(map, clutter, (id) => DECAL_ART[id].length);
    this.chunks = new Chunks(chunkGrid(map, chunkTiles), (i) => this.bakeChunk(i));
  }

  get size(): Size {
    return { width: this.chunks.grid.width, height: this.chunks.grid.height };
  }

  /** Draws the ground under a view whose top-left is `cam`, baking whatever it hasn't yet. */
  draw(ctx: CanvasRenderingContext2D, cam: Point, view: Size): void {
    const { grid } = this.chunks;
    for (const i of chunksInView(grid, cam, view)) {
      const rect = chunkRect(grid, i);
      ctx.drawImage(this.chunks.get(i), rect.x - cam.x, rect.y - cam.y);
    }
  }

  /**
   * Lays new tiles over the same map (the pond frozen over, or thawed), and lets go of every
   * chunk a changed tile reaches, so it's baked afresh the next time it's drawn.
   */
  retile(tiles: readonly TileId[]): void {
    const changed = changedTiles(this.map.tiles, tiles, this.map.width);
    if (changed.length === 0) return;
    this.map = { ...this.map, tiles: [...tiles] };
    this.decals = decalsOf(this.map, this.clutter, (id) => DECAL_ART[id].length);
    this.puddles = null;
    this.chunks.invalidate(chunksTouching(this.chunks.grid, changed, BAKE_MARGIN));
  }

  /**
   * Bakes the ground wet, dark with puddles on the paths, or dry again (V1's L3): every chunk is
   * let go when the day's weather turns it, and baked afresh as it's drawn; never per frame.
   */
  wet(wet: boolean): void {
    if (wet === this.isWet) return;
    this.isWet = wet;
    this.chunks.release();
  }

  /** Lets go of every baked chunk, for a place she has left. */
  release(): void {
    this.chunks.release();
  }

  /** How many chunks are baked now, and the canvas memory they hold, in bytes. */
  get memory(): { chunks: number; bytes: number } {
    const { grid } = this.chunks;
    let bytes = 0;
    for (let i = 0; i < grid.cols * grid.rows; i++) {
      if (!this.chunks.has(i)) continue;
      const { width, height } = chunkRect(grid, i);
      bytes += width * height * 4;
    }
    return { chunks: this.chunks.baked, bytes };
  }

  /** The whole ground on one canvas, for checking the chunks against (`groundSeams`). */
  whole(): HTMLCanvasElement {
    const { width, height } = this.size;
    const canvas = blank(width, height);
    this.draw(context(canvas), { x: 0, y: 0 }, { width, height });
    return canvas;
  }

  private bakeChunk(index: number): HTMLCanvasElement {
    const rect = chunkRect(this.chunks.grid, index);
    const canvas = blank(rect.width, rect.height);
    const g = context(canvas);
    g.translate(-rect.x, -rect.y);
    const { map } = this;
    const at = (tx: number, ty: number) => tileAt(map, tx, ty);
    const T = TILE_SIZE;
    const tx0 = Math.max(0, Math.floor(rect.x / T) - BAKE_MARGIN);
    const ty0 = Math.max(0, Math.floor(rect.y / T) - BAKE_MARGIN);
    const tx1 = Math.min(map.width, Math.ceil((rect.x + rect.width) / T) + BAKE_MARGIN);
    const ty1 = Math.min(map.height, Math.ceil((rect.y + rect.height) / T) + BAKE_MARGIN);
    for (let ty = ty0; ty < ty1; ty++) {
      for (let tx = tx0; tx < tx1; tx++) {
        for (const p of groundPieces(at, tx, ty)) {
          g.drawImage(bake(p.key, p.source, p.palette), tx * T, ty * T);
        }
      }
    }
    for (const d of this.decals) {
      if (d.tx < tx0 || d.tx >= tx1 || d.ty < ty0 || d.ty >= ty1) continue;
      const art = DECAL_ART[d.decal][d.look]!;
      g.drawImage(bake(`decal:${d.decal}:${d.look}`, art, DECAL_PALETTE), d.tx * T, d.ty * T);
    }
    if (this.isWet) this.drawWet(g, rect, { tx0, ty0, tx1, ty1 });
    drawShadows(g, map, rect, { tx0, ty0, tx1, ty1 });
    return canvas;
  }

  /** The rain on the ground as it's baked: everything a shade darker, and the puddles. */
  private drawWet(
    g: CanvasRenderingContext2D,
    rect: ChunkRect,
    tiles: { tx0: number; ty0: number; tx1: number; ty1: number },
  ): void {
    g.globalCompositeOperation = 'multiply';
    g.fillStyle = PALETTE.wetGround;
    g.fillRect(rect.x, rect.y, rect.width, rect.height);
    g.globalCompositeOperation = 'source-over';
    this.puddles ??= puddlesOf(this.map);
    for (const p of this.puddles) {
      if (p.tx < tiles.tx0 || p.tx >= tiles.tx1 || p.ty < tiles.ty0 || p.ty >= tiles.ty1) continue;
      g.drawImage(bake(`puddle:${p.look}`, PUDDLE_ART[p.look]!, PUDDLE_PALETTE), p.x, p.y);
    }
  }
}

/**
 * Shadows, down and to the right the way the light falls on every sprite: under a hedge, at the
 * foot of a cliff, in front of a raised bed, and a soft one under each prop. They're drawn opaque
 * onto a layer of their own, rubbed out wherever a hedge or cliff stands, and laid down once at
 * `SHADOW_ALPHA`, so where two overlap (a row of fence) they don't double up. The layer is the
 * chunk's size and takes every caster in the chunk's ring of tiles and every prop, so a shadow
 * that crosses a seam is the same on both sides of it.
 */
function drawShadows(
  g: CanvasRenderingContext2D,
  map: TileMap,
  rect: ChunkRect,
  tiles: { tx0: number; ty0: number; tx1: number; ty1: number },
): void {
  const T = TILE_SIZE;
  const layer = blank(rect.width, rect.height);
  const s = context(layer);
  s.translate(-rect.x, -rect.y);
  s.fillStyle = PALETTE.ink;
  for (let ty = tiles.ty0; ty < tiles.ty1; ty++) {
    for (let tx = tiles.tx0; tx < tiles.tx1; tx++) {
      const id = tileAt(map, tx, ty);
      const up = tileAt(map, tx, ty - 1);
      const left = tileAt(map, tx - 1, ty);
      const x = tx * T;
      const y = ty * T;
      if (id === 'hedge' || id === 'cliff' || id === 'steps') continue;
      if (up === 'hedge') s.fillRect(x, y - 4, T, 10);
      if (left === 'hedge') s.fillRect(x - 3, y, 7, T);
      if (up === 'cliff') s.fillRect(x, y, T, 6);
      if (up === 'bed' && id !== 'bed') s.fillRect(x + 2, y, T, 4);
    }
  }
  for (const prop of map.props) {
    const { w, h, dy = 0 } = PROP_ART[prop.id].shadow;
    const cx = (prop.tx + prop.w / 2) * T;
    const footY = (prop.ty + prop.h) * T;
    fillPixelEllipse(s, cx, footY - 2 - dy, w, h);
  }
  // Nothing casts a shadow onto the top of a hedge or a cliff, which stand above it.
  s.globalCompositeOperation = 'destination-out';
  const at = (tx: number, ty: number) => tileAt(map, tx, ty);
  for (let ty = tiles.ty0; ty < tiles.ty1; ty++) {
    for (let tx = tiles.tx0; tx < tiles.tx1; tx++) {
      if (!RAISED.has(tileAt(map, tx, ty))) continue;
      const top = groundPieces(at, tx, ty)[1]!;
      s.drawImage(bake(top.key, top.source, top.palette), tx * T, ty * T);
    }
  }
  g.globalAlpha = SHADOW_ALPHA;
  g.drawImage(layer, rect.x, rect.y);
  g.globalAlpha = 1;
}
