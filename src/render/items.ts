import { ICON_SIZE, TILE_SIZE } from '../config/world';
import { bake } from '../sprites/bake';
import { ITEM_ART } from '../sprites/items';
import type { Palette, SpriteSource } from '../sprites/sprite';
import type { ItemId } from '../types/ids';

/** How many world pixels a pixel of an icon is, where the world draws one (a snack, a bubble). */
export const ICON_SCALE = TILE_SIZE / ICON_SIZE;

/** An icon's grid, baked for the world at `ICON_SCALE`. */
export function bakeIcon(key: string, source: SpriteSource, palette: Palette): HTMLCanvasElement {
  return bake(key, source, palette, { scale: ICON_SCALE });
}

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
