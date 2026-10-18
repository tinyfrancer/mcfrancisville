import type { Tile } from '../systems/pathfinding';
import type { SceneView } from './scene';
import { TILE_SIZE } from '../config/world';
import { PALETTE } from '../sprites/palette';

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
  // Close up (decision 290) the frame can run off the canvas's edge: slide it back on, whole,
  // rather than cut it short, so the photo keeps its shape.
  if (right <= 0 || bottom <= 0 || left >= canvas.width || top >= canvas.height) return null;
  const w = Math.min(canvas.width, Math.round(right - left));
  const h = Math.min(canvas.height, Math.round(bottom - top));
  const x = Math.min(Math.max(0, Math.round(left)), canvas.width - w);
  const y = Math.min(Math.max(0, Math.round(top)), canvas.height - h);
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

/** About how wide a saved print is, in pixels: her pixels are scaled up whole to fill it. */
const PRINT_WIDTH = 1080;

/**
 * The photo as a print to keep (V1's S3): the picture at a whole scale, so it stays crisp in her
 * camera roll, on a polaroid's card with the caption written under it. Null if no canvas.
 */
export function printOf(picture: HTMLCanvasElement, caption: string): HTMLCanvasElement | null {
  const scale = Math.max(1, Math.floor(PRINT_WIDTH / Math.max(1, picture.width)));
  const width = picture.width * scale;
  const height = picture.height * scale;
  const edge = Math.round(width * 0.05);
  const foot = Math.round(width * 0.2);
  const print = document.createElement('canvas');
  print.width = width + edge * 2;
  print.height = height + edge + foot;
  const ctx = print.getContext('2d');
  if (!ctx) return null;
  ctx.fillStyle = PALETTE.white;
  ctx.fillRect(0, 0, print.width, print.height);
  ctx.imageSmoothingEnabled = false;
  ctx.drawImage(picture, edge, edge, width, height);
  ctx.fillStyle = PALETTE.ink;
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';
  ctx.font = `${Math.round(foot * 0.26)}px ui-rounded, 'SF Pro Rounded', system-ui, sans-serif`;
  ctx.fillText(caption, print.width / 2, edge + height + foot / 2, print.width - edge * 2);
  return print;
}

/** A canvas as a PNG, or null if the browser won't make one. */
export function pngOf(canvas: HTMLCanvasElement): Promise<Blob | null> {
  return new Promise((resolve) => {
    try {
      canvas.toBlob((blob) => resolve(blob), 'image/png');
    } catch {
      resolve(null);
    }
  });
}
