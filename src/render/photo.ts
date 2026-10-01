import type { Tile } from '../systems/pathfinding';
import type { SceneView } from './scene';
import { TILE_SIZE } from '../config/world';

/** How much room the photo leaves round them, in tiles: a little either side, more above. */
const ROOM = { side: 1.25, above: 2, below: 0.75 };

/**
 * A photo of whoever stands on `tiles` (0.2's J4): the canvas as it was last drawn, cropped round
 * them, pixel for pixel. Null if they're off the canvas.
 */
export function photoOf(
  canvas: HTMLCanvasElement,
  view: SceneView,
  tiles: readonly Tile[],
): HTMLCanvasElement | null {
  const box = canvas.getBoundingClientRect();
  if (tiles.length === 0 || box.width === 0) return null;
  const perPixel = canvas.width / box.width;
  const toCanvas = (t: Tile) => {
    const p = view.tileToClient(t.tx, t.ty);
    return { x: (p.x - box.left) * perPixel, y: (p.y - box.top) * perPixel };
  };
  const first = tiles[0]!;
  const a = toCanvas(first);
  const b = toCanvas({ tx: first.tx + 1, ty: first.ty });
  const tile = Math.abs(b.x - a.x);
  const points = tiles.map(toCanvas);
  const left = Math.min(...points.map((p) => p.x)) - tile * (0.5 + ROOM.side);
  const right = Math.max(...points.map((p) => p.x)) + tile * (0.5 + ROOM.side);
  const top = Math.min(...points.map((p) => p.y)) - tile * (0.5 + ROOM.above);
  const bottom = Math.max(...points.map((p) => p.y)) + tile * (0.5 + ROOM.below);
  const x = Math.max(0, Math.round(left));
  const y = Math.max(0, Math.round(top));
  const w = Math.min(canvas.width, Math.round(right)) - x;
  const h = Math.min(canvas.height, Math.round(bottom)) - y;
  if (w <= 0 || h <= 0) return null;
  // The canvas is at a whole number of device pixels to each of hers: back to hers.
  const k = Math.max(1, Math.round(tile / TILE_SIZE));
  const picture = document.createElement('canvas');
  picture.width = Math.floor(w / k);
  picture.height = Math.floor(h / k);
  const ctx = picture.getContext('2d');
  if (!ctx) return null;
  ctx.imageSmoothingEnabled = false;
  ctx.drawImage(
    canvas,
    x,
    y,
    picture.width * k,
    picture.height * k,
    0,
    0,
    picture.width,
    picture.height,
  );
  return picture;
}
