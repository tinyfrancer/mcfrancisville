import { ICON_SIZE } from '../config/world';
import type { FilterId } from '../data/photo';
import { ITEM_ART } from '../sprites/items';
import { PALETTE } from '../sprites/palette';
import type { Sticker } from '../systems/photo';
import { filterPixels } from './filters';
import { bakeIcon, ICON_SCALE } from './items';

/*
 * The photo mode's viewfinder (1.5's G5, decision 374): a polaroid laid over the canvas, the world
 * outside it dimmed, the filter shown live inside it, and the photo itself, cut from the canvas
 * pixel for pixel (the canvas is at her pixels, `render/pixelScale.ts`), filtered, stickered.
 */

/** The polaroid's white round the photo, in her pixels: its sides and top, and its deeper foot. */
export const POLAROID = { edge: 6, foot: 22 };

/** Room left round the polaroid, so a little of the world shows past every edge of it. */
const MARGIN = 10;

/** How much wider than tall the photo may be, on a phone on its side. */
const WIDEST = 1.5;

/** Where the photo is on the canvas, in its pixels (hers). */
export interface FrameBox {
  x: number;
  y: number;
  width: number;
  height: number;
}

/**
 * The photo's box on a canvas `width` × `height`: as big as fits inside its polaroid with a margin
 * all round, in the middle; square on a phone held upright, wider (to half again) on its side.
 * Null on a canvas too small to hold one.
 */
export function frameOf(width: number, height: number): FrameBox | null {
  const roomW = width - 2 * (POLAROID.edge + MARGIN);
  const roomH = height - POLAROID.edge - POLAROID.foot - 2 * MARGIN;
  if (roomW < 16 || roomH < 16) return null;
  const h = Math.floor(Math.min(roomH, roomW));
  const w = Math.floor(Math.min(roomW, roomW > roomH ? h * WIDEST : h));
  const card = h + POLAROID.edge + POLAROID.foot;
  return {
    x: Math.floor((width - w) / 2),
    y: Math.floor((height - card) / 2) + POLAROID.edge,
    width: w,
    height: h,
  };
}

/** Lays the viewfinder over a drawn frame: the dim round it, the polaroid, the filter inside. */
export function drawViewfinder(
  ctx: CanvasRenderingContext2D,
  canvas: { width: number; height: number },
  filter: FilterId,
  nowMs: number,
): void {
  const box = frameOf(canvas.width, canvas.height);
  if (!box) return;
  if (filter !== 'plain') filterRegion(ctx, box, filter, nowMs);
  const card = {
    x: box.x - POLAROID.edge,
    y: box.y - POLAROID.edge,
    width: box.width + 2 * POLAROID.edge,
    height: box.height + POLAROID.edge + POLAROID.foot,
  };
  ctx.save();
  ctx.fillStyle = PALETTE.ink;
  ctx.globalAlpha = 0.5;
  ctx.fillRect(0, 0, canvas.width, card.y);
  ctx.fillRect(0, card.y + card.height, canvas.width, canvas.height - card.y - card.height);
  ctx.fillRect(0, card.y, card.x, card.height);
  ctx.fillRect(card.x + card.width, card.y, canvas.width - card.x - card.width, card.height);
  // A shadow along the card's right and foot, as if it were held a little off the town.
  ctx.globalAlpha = 0.35;
  ctx.fillRect(card.x + 2, card.y + card.height, card.width, 2);
  ctx.fillRect(card.x + card.width, card.y + 2, 2, card.height);
  ctx.globalAlpha = 1;
  ctx.fillStyle = PALETTE.white;
  ctx.fillRect(card.x, card.y, card.width, POLAROID.edge);
  ctx.fillRect(card.x, box.y + box.height, card.width, POLAROID.foot);
  ctx.fillRect(card.x, box.y, POLAROID.edge, box.height);
  ctx.fillRect(box.x + box.width, box.y, POLAROID.edge, box.height);
  ctx.restore();
}

/** How often the live filter is worked out again: the world is frozen, only its glints move. */
const REFILTER_MS = 120;

let kept: { pixels: ImageData; key: string; at: number } | null = null;

/**
 * The world inside the frame, through the filter, as the photo will have it. Read back from the
 * canvas a few times a second rather than every frame, which a phone feels; between, the last is
 * put back.
 */
function filterRegion(
  ctx: CanvasRenderingContext2D,
  box: FrameBox,
  filter: FilterId,
  nowMs: number,
): void {
  const key = `${filter}:${box.x},${box.y},${box.width}x${box.height}`;
  if (!kept || kept.key !== key || nowMs - kept.at >= REFILTER_MS) {
    const pixels = ctx.getImageData(box.x, box.y, box.width, box.height);
    filterPixels(pixels, filter);
    kept = { pixels, key, at: nowMs };
  }
  ctx.putImageData(kept.pixels, box.x, box.y);
}

/** How big a sticker is on the photo, in her pixels: its 16-pixel icon at twice. */
export const STICKER_SIZE = ICON_SIZE * ICON_SCALE;

/**
 * The photo (1.5's G5): the frame's box cut from a canvas just drawn clean, through the filter,
 * with her stickers on top at twice their icons. Null if the canvas is too small for a frame.
 */
export function photoFrom(
  canvas: HTMLCanvasElement,
  filter: FilterId,
  stickers: readonly Sticker[],
): HTMLCanvasElement | null {
  const box = frameOf(canvas.width, canvas.height);
  if (!box) return null;
  const picture = document.createElement('canvas');
  picture.width = box.width;
  picture.height = box.height;
  const ctx = picture.getContext('2d', { willReadFrequently: true });
  if (!ctx) return null;
  ctx.imageSmoothingEnabled = false;
  ctx.drawImage(canvas, box.x, box.y, box.width, box.height, 0, 0, box.width, box.height);
  if (filter !== 'plain') {
    const pixels = ctx.getImageData(0, 0, box.width, box.height);
    filterPixels(pixels, filter);
    ctx.putImageData(pixels, 0, 0);
  }
  for (const s of stickers) {
    const art = ITEM_ART[s.id];
    const sprite = bakeIcon(`item:${s.id}`, art.source, art.palette);
    const x = Math.round(s.x * box.width - sprite.width / 2);
    const y = Math.round(s.y * box.height - sprite.height / 2);
    ctx.drawImage(sprite, x, y);
  }
  return picture;
}
