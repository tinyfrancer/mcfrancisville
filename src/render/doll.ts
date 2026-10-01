import { bakeLayers } from '../sprites/bake';
import { DOLL_HEIGHT, dollKey, dollLayers } from '../sprites/doll';
import type { Facing, Pose, Slot } from '../types/ids';
import type { Look, Worn } from '../types/look';

/**
 * Her, baked for one facing and frame, or a pose. Each look is drawn once, and after that it's a
 * lookup.
 */
export function bakeDoll(
  look: Look,
  facing: Facing,
  frame: number,
  pose?: Pose,
): HTMLCanvasElement {
  return bakeLayers(
    dollKey(look, facing, frame, pose),
    () => dollLayers(look, facing, frame, pose),
    { flipX: !pose && facing === 'left' },
  );
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

/** The size of the canvas a close-up is drawn into, which the HUD shows at 1×. */
const DETAIL = 48;

/**
 * The part of her a piece is worn on, as a square of her pixels that goes into the close-up a
 * whole number of times: her head, her middle, or, for glasses, a necklace and shoes, a small
 * square drawn three times the size.
 */
const WORN_AT: Record<Slot, { x: number; y: number; size: 16 | 24 }> = {
  hat: { x: 4, y: 0, size: 24 },
  glasses: { x: 8, y: 9, size: 16 },
  necklace: { x: 8, y: 22, size: 16 },
  top: { x: 4, y: 22, size: 24 },
  bottom: { x: 4, y: 24, size: 24 },
  shoes: { x: 8, y: 32, size: 16 },
  gloves: { x: 0, y: 27, size: 16 },
  outer: { x: 4, y: 22, size: 24 },
  tights: { x: 8, y: 32, size: 16 },
};

const SHOE_STAND: Worn = { id: 'sundressFloral', fabric: 'lavender' };

function pick(outfit: Look['outfit'], slot: Slot): Look['outfit'] {
  const worn = outfit[slot];
  return worn ? { [slot]: worn } : {};
}

/** Her, close up on where a piece is worn, into a 48×48 canvas of the HUD's at 1×. */
export function drawWornDetail(canvas: HTMLCanvasElement, look: Look, slot: Slot): void {
  // Shoes and tights are shown under a sundress, on her legs: jeans would hide them.
  const shown: Look =
    slot === 'shoes' || slot === 'tights'
      ? { ...look, outfit: { top: SHOE_STAND, ...pick(look.outfit, slot) } }
      : look;
  const sprite = bakeDoll(shown, 'down', 0);
  const out = DETAIL;
  canvas.width = out;
  canvas.height = out;
  const ctx = canvas.getContext('2d');
  if (!ctx) return;
  ctx.imageSmoothingEnabled = false;
  ctx.clearRect(0, 0, out, out);
  const { x, y, size } = WORN_AT[slot];
  // A tall hat lifts her in her picture; the hat's close-up starts at its tip, the rest at her.
  const hat = sprite.height - DOLL_HEIGHT;
  ctx.drawImage(sprite, x, slot === 'hat' ? y : y + hat, size, size, 0, 0, out, out);
}
