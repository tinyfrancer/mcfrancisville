import { bakeLayers } from '../sprites/bake';
import { dollKey, dollLayers } from '../sprites/doll';
import type { Facing } from '../types/ids';
import type { Look } from '../types/look';

/** Her, baked for one facing and frame. Each look is drawn once, and after that it's a lookup. */
export function bakeDoll(look: Look, facing: Facing, frame: number): HTMLCanvasElement {
  return bakeLayers(dollKey(look, facing, frame), () => dollLayers(look, facing, frame), {
    flipX: facing === 'left',
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
