import { bakeLayers } from '../sprites/bake';
import { dollKey, dollLayers } from '../sprites/doll';
import type { Facing, Slot } from '../types/ids';
import type { Look, Worn } from '../types/look';

/**
 * Her, baked for one facing and frame, `scale` times her grid. Each look is drawn once, and after
 * that it's a lookup.
 */
export function bakeDoll(look: Look, facing: Facing, frame: number, scale = 1): HTMLCanvasElement {
  return bakeLayers(dollKey(look, facing, frame), () => dollLayers(look, facing, frame), {
    flipX: facing === 'left',
    scale,
  });
}

/**
 * Draws her into a canvas of the HUD's at 1×; the HUD scales it up with CSS by a whole number, so
 * it stays crisp. This is the only way the HUD gets a picture of her (decisions.md 9).
 */
export function drawDollPreview(canvas: HTMLCanvasElement, look: Look, facing: Facing): void {
  const sprite = bakeDoll(look, facing, 0);
  canvas.width = sprite.width;
  canvas.height = sprite.height;
  const ctx = canvas.getContext('2d');
  if (!ctx) return;
  ctx.clearRect(0, 0, canvas.width, canvas.height);
  ctx.drawImage(sprite, 0, 0);
}

/**
 * The part of her a piece is worn on, as a square of her pixels: her head, her middle, or, for
 * shoes, just her feet, which are small enough to want drawing twice the size.
 */
const WORN_AT: Record<Slot, { x: number; y: number; size: number }> = {
  hat: { x: 0, y: 0, size: 16 },
  glasses: { x: 0, y: 0, size: 16 },
  necklace: { x: 0, y: 6, size: 16 },
  top: { x: 0, y: 9, size: 16 },
  bottom: { x: 0, y: 16, size: 16 },
  shoes: { x: 4, y: 24, size: 8 },
};

const SHOE_STAND: Worn = { id: 'sundressFloral', fabric: 'lavender' };

function pick(outfit: Look['outfit'], slot: Slot): Look['outfit'] {
  const worn = outfit[slot];
  return worn ? { [slot]: worn } : {};
}

/** Her, close up on where a piece is worn, into a 16×16 canvas of the HUD's at 1×. */
export function drawWornDetail(canvas: HTMLCanvasElement, look: Look, slot: Slot): void {
  // Shoes are shown under a sundress, on bare legs: jeans would hide all but their soles.
  const shown: Look =
    slot === 'shoes'
      ? { ...look, outfit: { top: SHOE_STAND, ...pick(look.outfit, 'shoes') } }
      : look;
  const sprite = bakeDoll(shown, 'down', 0);
  const out = sprite.width;
  canvas.width = out;
  canvas.height = out;
  const ctx = canvas.getContext('2d');
  if (!ctx) return;
  ctx.imageSmoothingEnabled = false;
  ctx.clearRect(0, 0, out, out);
  const { x, y, size } = WORN_AT[slot];
  ctx.drawImage(sprite, x, y, size, size, 0, 0, out, out);
}
