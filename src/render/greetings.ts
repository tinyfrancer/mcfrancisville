import { RED_ONE, RED_ONE_PALETTE } from '../sprites/greetings';
import { bake } from '../sprites/bake';

/** Draws the little red Tesla at 1×, for Cody's greeting to drive it across. */
export function drawRedOne(canvas: HTMLCanvasElement): void {
  const sprite = bake('greeting:redOne', RED_ONE, RED_ONE_PALETTE);
  canvas.width = sprite.width;
  canvas.height = sprite.height;
  const ctx = canvas.getContext('2d');
  if (!ctx) return;
  ctx.imageSmoothingEnabled = false;
  ctx.drawImage(sprite, 0, 0);
}
