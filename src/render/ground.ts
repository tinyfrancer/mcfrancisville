import { OLD_TILE } from '../config/world';
import { bake } from '../sprites/bake';
import { PALETTE, SHADOW_ALPHA } from '../sprites/palette';
import { PROP_ART } from '../sprites/props';
import { TILE_ART, tileSources } from '../sprites/tiles';
import { tileAt, type TileMap } from '../systems/grid';
import type { TileId } from '../types/ids';
import { enlargeCanvas } from './legacy';

export { SHADOW_ALPHA };

/**
 * A whole number from a tile's position that is the same every time, so the grass is scattered
 * the same way on every visit without anything being saved.
 */
export function tileHash(tx: number, ty: number): number {
  let h = Math.imul(tx, 73856093) ^ Math.imul(ty, 19349663);
  h = Math.imul(h ^ (h >>> 13), 1274126177);
  return (h ^ (h >>> 16)) >>> 0;
}

/** Which of `count` looks a tile wears. The plain one is half of all tiles, so it stays calm. */
export function variantOf(tx: number, ty: number, count: number): number {
  if (count <= 1) return 0;
  const roll = tileHash(tx, ty) % (count * 2);
  return roll < count ? roll : 0;
}

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

/** The ground's tiles are version 0's until phase F redraws them, so it is drawn at their size. */
const TILE_SIZE = OLD_TILE;

/**
 * The ground never changes, so it is drawn once to a canvas the size of the whole map and each
 * frame copies the visible window of it (decisions.md 23). It is also where the depth is: varied
 * grass, worn path edges, pond banks, and a shadow under everything that stands on it.
 */
export function renderGround(map: TileMap): HTMLCanvasElement {
  const ground = document.createElement('canvas');
  ground.width = map.width * TILE_SIZE;
  ground.height = map.height * TILE_SIZE;
  const g = context(ground);
  for (let ty = 0; ty < map.height; ty++) {
    for (let tx = 0; tx < map.width; tx++) {
      const id = map.tiles[ty * map.width + tx]!;
      const art = TILE_ART[id];
      const sources = tileSources(art);
      const v = variantOf(tx, ty, sources.length);
      g.drawImage(
        bake(`tile:${id}:${v}`, sources[v]!, art.palette),
        tx * TILE_SIZE,
        ty * TILE_SIZE,
      );
    }
  }
  drawEdges(g, map);
  drawShadows(g, map);
  return enlargeCanvas(ground);
}

const isPath = (id: TileId | undefined) => id === 'path';
const isWater = (id: TileId | undefined) => id === 'water' || id === 'waterEdge';

/**
 * Where two kinds of ground meet. A path gets a darker kerb and a few blades of grass creeping
 * over it; the pond gets an earth bank; a garden bed gets a board round it, deeper along the front
 * where it's raised; a hedge casts a shadow down and to the right, the way the light falls on
 * every sprite.
 */
function drawEdges(g: CanvasRenderingContext2D, map: TileMap): void {
  const T = TILE_SIZE;
  const shadows = document.createElement('canvas');
  shadows.width = g.canvas.width;
  shadows.height = g.canvas.height;
  const s = context(shadows);
  s.fillStyle = PALETTE.ink;

  for (let ty = 0; ty < map.height; ty++) {
    for (let tx = 0; tx < map.width; tx++) {
      const id = tileAt(map, tx, ty);
      const x = tx * T;
      const y = ty * T;
      const up = tileAt(map, tx, ty - 1);
      const down = tileAt(map, tx, ty + 1);
      const left = tileAt(map, tx - 1, ty);
      const right = tileAt(map, tx + 1, ty);

      if (isPath(id)) {
        g.fillStyle = PALETTE.stoneDark;
        if (up !== undefined && !isPath(up)) g.fillRect(x, y, T, 1);
        if (down !== undefined && !isPath(down)) g.fillRect(x, y + T - 1, T, 1);
        if (left !== undefined && !isPath(left)) g.fillRect(x, y, 1, T);
        if (right !== undefined && !isPath(right)) g.fillRect(x + T - 1, y, 1, T);
        creepingGrass(g, tx, ty, { up, down, left, right });
      }

      if (id === 'water') {
        g.fillStyle = PALETTE.earth;
        if (down !== undefined && !isWater(down)) g.fillRect(x, y + T - 2, T, 2);
        if (left !== undefined && !isWater(left)) g.fillRect(x, y, 1, T);
        if (right !== undefined && !isWater(right)) g.fillRect(x + T - 1, y, 1, T);
      }

      if (id === 'bed') {
        g.fillStyle = PALETTE.wood;
        if (up !== 'bed') g.fillRect(x, y, T, 1);
        if (left !== 'bed') g.fillRect(x, y, 1, T);
        if (right !== 'bed') g.fillRect(x + T - 1, y, 1, T);
        if (down !== 'bed') g.fillRect(x, y + T - 2, T, 1);
        g.fillStyle = PALETTE.barkDark;
        if (down !== 'bed') g.fillRect(x, y + T - 1, T, 1);
        if (down !== 'bed' && down !== undefined) s.fillRect(x + 1, y + T, T, 2);
      }

      if (id !== 'hedge' && id !== undefined) {
        if (up === 'hedge') s.fillRect(x, y, T, 3);
        if (left === 'hedge') s.fillRect(x, y, 2, T);
      }
    }
  }
  g.globalAlpha = SHADOW_ALPHA;
  g.drawImage(shadows, 0, 0);
  g.globalAlpha = 1;
}

/** A tuft or two of grass over the edge of a path, where the hash says so. */
function creepingGrass(
  g: CanvasRenderingContext2D,
  tx: number,
  ty: number,
  sides: Record<'up' | 'down' | 'left' | 'right', TileId | undefined>,
): void {
  const T = TILE_SIZE;
  const x = tx * T;
  const y = ty * T;
  const grassy = (id: TileId | undefined) => id === 'grass';
  const h = tileHash(tx, ty);
  // Two spots along each side, somewhere in its middle, each tufted or not by a bit of the hash.
  const spots = [2 + (h % 5), 9 + ((h >>> 3) % 5)];
  spots.forEach((at, i) => {
    const bit = (side: number) => (h >>> (8 + side * 2 + i)) & 1;
    g.fillStyle = PALETTE.moss;
    if (grassy(sides.up) && bit(0)) g.fillRect(x + at, y, 2, 1);
    if (grassy(sides.up) && bit(0)) g.fillRect(x + at, y + 1, 1, 1);
    if (grassy(sides.down) && bit(1)) g.fillRect(x + at, y + T - 1, 2, 1);
    if (grassy(sides.left) && bit(2)) g.fillRect(x, y + at, 1, 2);
    if (grassy(sides.left) && bit(2)) g.fillRect(x + 1, y + at, 1, 1);
    if (grassy(sides.right) && bit(3)) g.fillRect(x + T - 1, y + at, 1, 2);
  });
}

/**
 * A soft shadow under each prop, drawn opaque onto a layer of their own and laid down once at
 * `SHADOW_ALPHA`, so where two overlap (a row of fence) they don't double up.
 */
function drawShadows(g: CanvasRenderingContext2D, map: TileMap): void {
  const layer = document.createElement('canvas');
  layer.width = g.canvas.width;
  layer.height = g.canvas.height;
  const s = context(layer);
  s.fillStyle = PALETTE.ink;
  for (const prop of map.props) {
    const { w, h } = PROP_ART[prop.id].shadow;
    const cx = (prop.tx + prop.w / 2) * TILE_SIZE;
    const footY = (prop.ty + prop.h) * TILE_SIZE;
    fillPixelEllipse(s, cx, footY - 2, w, h);
  }
  g.globalAlpha = SHADOW_ALPHA;
  g.drawImage(layer, 0, 0);
  g.globalAlpha = 1;
}
