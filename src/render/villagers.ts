import { bakeLayers } from '../sprites/bake';
import { DOLL_FRAMES } from '../sprites/doll';
import {
  figureLayers,
  MAUDE_GLOW,
  MAUDE_PALETTE,
  maudeRows,
  type Figure,
} from '../sprites/villagers';
import type { Facing } from '../types/ids';
import { glowOf } from './scene';

/** A neighbour (or the Moon Pie Man), baked for one facing and frame. */
export function bakeFigure(id: Figure, facing: Facing, frame: number): HTMLCanvasElement {
  const f = frame % DOLL_FRAMES;
  return bakeLayers(`figure:${id}:${facing}:${f}`, () => figureLayers(id, facing, f), {
    flipX: facing === 'left',
  });
}

/** Maude's soft glow after dark: all of her sheet, in its own pale colour. */
export function maudeGlow(facing: Facing): HTMLCanvasElement {
  return glowOf(`glow:maude:${facing}`, { rows: maudeRows(facing) }, MAUDE_PALETTE, MAUDE_GLOW, {
    flipX: facing === 'left',
  });
}

/**
 * Draws a neighbour into a canvas of the HUD's at 1×, as the talk sheet's portrait: their head
 * and shoulders, a 16-pixel square of them, facing her.
 */
export function drawPortrait(canvas: HTMLCanvasElement, id: Figure): void {
  const sprite = bakeFigure(id, 'down', 0);
  canvas.width = 16;
  canvas.height = 16;
  const ctx = canvas.getContext('2d');
  if (!ctx) return;
  ctx.imageSmoothingEnabled = false;
  ctx.clearRect(0, 0, 16, 16);
  // Maude floats a little lower in her sprite than the others stand.
  const top = id === 'maude' ? 4 : 0;
  ctx.drawImage(sprite, 0, top, 16, 16, 0, 0, 16, 16);
}
