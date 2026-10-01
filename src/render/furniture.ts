import { bake } from '../sprites/bake';
import { FURNITURE_ART } from '../sprites/furniture';
import { FIXTURE_ART } from '../sprites/interiors';
import { FLOORING_ART, WALLPAPER_ART } from '../sprites/surfaces';
import type { FixtureId, FlooringId, FurnitureId, WallpaperId } from '../types/ids';

/**
 * A piece of furniture, facing her, standing at the bottom of a square canvas of the HUD's at 1×:
 * 32 or 64 pixels a side, so the sheet's fixed size scales most pieces by a whole number.
 */
export function drawFurnitureIcon(canvas: HTMLCanvasElement, id: FurnitureId): void {
  const art = FURNITURE_ART[id];
  standAtFoot(canvas, bake(`furniture:${id}`, art.source, art.palette));
}

/** Something standing in a building for good, as a piece is drawn: the fortune table (0.2's M2). */
export function drawFixtureIcon(canvas: HTMLCanvasElement, id: FixtureId): void {
  const art = FIXTURE_ART[id];
  standAtFoot(canvas, bake(`fixture:${id}`, art.source, art.palette));
}

function standAtFoot(canvas: HTMLCanvasElement, sprite: HTMLCanvasElement): void {
  const side = Math.ceil(Math.max(sprite.width, sprite.height) / 32) * 32;
  canvas.width = side;
  canvas.height = side;
  const ctx = canvas.getContext('2d');
  if (!ctx) return;
  ctx.clearRect(0, 0, side, side);
  ctx.drawImage(sprite, Math.floor((side - sprite.width) / 2), side - sprite.height);
}

/** One tile of a wallpaper or a flooring, at 1×. */
export function drawSurfaceIcon(
  canvas: HTMLCanvasElement,
  surface: { wallpaper: WallpaperId } | { flooring: FlooringId },
): void {
  const [key, art] =
    'wallpaper' in surface
      ? [`wallpaper:${surface.wallpaper}`, WALLPAPER_ART[surface.wallpaper]]
      : [`flooring:${surface.flooring}`, FLOORING_ART[surface.flooring]];
  const tile = bake(key, art.source, art.palette);
  canvas.width = tile.width;
  canvas.height = tile.height;
  canvas.getContext('2d')?.drawImage(tile, 0, 0);
}
