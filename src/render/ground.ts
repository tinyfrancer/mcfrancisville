import { TILE_SIZE } from '../config/world';
import { bake } from '../sprites/bake';
import { PALETTE, SHADOW_ALPHA } from '../sprites/palette';
import { PROP_ART } from '../sprites/props';
import { groundPieces } from '../sprites/terrain';
import { tileAt, type TileMap } from '../systems/grid';
import type { TileId } from '../types/ids';
import { propScale } from './legacy';

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
 * The ground never changes, so it is drawn once to a canvas the size of the whole map and each
 * frame copies the visible window of it (decisions.md 23). Each tile is grass with whatever lies
 * on it shaped by its neighbours (`sprites/terrain.ts`), and over it all go the shadows.
 */
export function renderGround(map: TileMap): HTMLCanvasElement {
  const ground = blank(map.width * TILE_SIZE, map.height * TILE_SIZE);
  const g = context(ground);
  const at = (tx: number, ty: number) => tileAt(map, tx, ty);
  for (let ty = 0; ty < map.height; ty++) {
    for (let tx = 0; tx < map.width; tx++) {
      for (const p of groundPieces(at, tx, ty)) {
        g.drawImage(bake(p.key, p.source, p.palette), tx * TILE_SIZE, ty * TILE_SIZE);
      }
    }
  }
  drawShadows(g, map);
  return ground;
}

/** Ground that stands up off the grass, and so casts a shadow and takes none of its own. */
const RAISED: ReadonlySet<TileId | undefined> = new Set(['hedge', 'cliff', 'bed']);

/**
 * Shadows, down and to the right the way the light falls on every sprite: under a hedge, at the
 * foot of a cliff, in front of a raised bed, and a soft one under each prop. They're drawn opaque
 * onto a layer of their own, rubbed out wherever a hedge or cliff stands, and laid down once at
 * `SHADOW_ALPHA`, so where two overlap (a row of fence) they don't double up.
 */
function drawShadows(g: CanvasRenderingContext2D, map: TileMap): void {
  const T = TILE_SIZE;
  const layer = blank(g.canvas.width, g.canvas.height);
  const s = context(layer);
  s.fillStyle = PALETTE.ink;
  for (let ty = 0; ty < map.height; ty++) {
    for (let tx = 0; tx < map.width; tx++) {
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
    const { w, h } = PROP_ART[prop.id].shadow;
    const scale = propScale(prop.id);
    const cx = (prop.tx + prop.w / 2) * T;
    const footY = (prop.ty + prop.h) * T;
    fillPixelEllipse(s, cx, footY - 2 * scale, w * scale, h * scale);
  }
  // Nothing casts a shadow onto the top of a hedge or a cliff, which stand above it.
  s.globalCompositeOperation = 'destination-out';
  const at = (tx: number, ty: number) => tileAt(map, tx, ty);
  for (let ty = 0; ty < map.height; ty++) {
    for (let tx = 0; tx < map.width; tx++) {
      if (!RAISED.has(tileAt(map, tx, ty))) continue;
      const top = groundPieces(at, tx, ty)[1]!;
      s.drawImage(bake(top.key, top.source, top.palette), tx * T, ty * T);
    }
  }
  g.globalAlpha = SHADOW_ALPHA;
  g.drawImage(layer, 0, 0);
  g.globalAlpha = 1;
}
