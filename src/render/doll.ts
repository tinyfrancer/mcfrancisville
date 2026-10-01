import { bakeLayers } from '../sprites/bake';
import { closeUpOf } from '../sprites/closeUp';
import { dollKey, dollLayers } from '../sprites/doll';
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
  canvas.width = DETAIL;
  canvas.height = DETAIL;
  const ctx = canvas.getContext('2d');
  if (!ctx) return;
  ctx.imageSmoothingEnabled = false;
  ctx.clearRect(0, 0, DETAIL, DETAIL);
  // Framed to the piece (0.2's K2), and drawn whole at that scale, so a frame wider than her is
  // her with room round her rather than a stretched edge.
  const { x, y, size } = closeUpOf(shown, slot);
  const k = DETAIL / size;
  ctx.drawImage(sprite, -x * k, -y * k, sprite.width * k, sprite.height * k);
}
