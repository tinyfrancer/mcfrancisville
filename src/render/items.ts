import { bake } from '../sprites/bake';
import { ITEM_ART } from '../sprites/items';
import type { ItemId } from '../types/ids';

/** An item, baked once, drawn into a canvas of the HUD's at 1× for CSS to scale by a whole number. */
export function drawItemIcon(canvas: HTMLCanvasElement, id: ItemId): void {
  const art = ITEM_ART[id];
  const sprite = bake(`item:${id}`, art.source, art.palette);
  canvas.width = sprite.width;
  canvas.height = sprite.height;
  const ctx = canvas.getContext('2d');
  if (!ctx) return;
  ctx.clearRect(0, 0, canvas.width, canvas.height);
  ctx.drawImage(sprite, 0, 0);
}
