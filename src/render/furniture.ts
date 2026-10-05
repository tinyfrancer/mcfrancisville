import { bake, bakeLayers } from '../sprites/bake';
import { showcaseLayers } from '../sprites/display';
import { FURNITURE_ART } from '../sprites/furniture';
import { FIXTURE_ART } from '../sprites/interiors';
import { FLOORING_ART, WALLPAPER_ART } from '../sprites/surfaces';
import { windowArt } from '../sprites/wallsAndFloors';
import { isWindowPaper } from '../data/wallsAndFloors';
import type {
  DisplayPiece,
  FixtureId,
  FlooringId,
  FurnitureId,
  ItemId,
  SetPiece,
  WallpaperId,
  WindowPaperId,
} from '../types/ids';

/**
 * A piece of furniture, facing her, standing at the bottom of a square canvas of the HUD's at 1×:
 * 32 or 64 pixels a side, so the sheet's fixed size scales most pieces by a whole number.
 */
export function drawFurnitureIcon(canvas: HTMLCanvasElement, id: FurnitureId): void {
  const art = FURNITURE_ART[id];
  standAtFoot(canvas, bake(`furniture:${id}`, art.source, art.palette));
}

/** A piece that shows things off with `contents` in it (0.3's H2), as `drawFurnitureIcon` draws one. */
export function drawShowcaseIcon(
  canvas: HTMLCanvasElement,
  id: SetPiece | DisplayPiece,
  contents: readonly ItemId[],
): void {
  const key = `furniture:${id}:0:${contents.join(',')}`;
  standAtFoot(
    canvas,
    bakeLayers(key, () => showcaseLayers(id, contents)),
  );
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
  if ('wallpaper' in surface && isWindowPaper(surface.wallpaper)) {
    drawWindowIcon(canvas, surface.wallpaper, tile);
    return;
  }
  canvas.width = tile.width;
  canvas.height = tile.height;
  canvas.getContext('2d')?.drawImage(tile, 0, 0);
}

/** A wallpaper with windows (0.3's S4): two tiles of its paper each way, a window on it by day. */
function drawWindowIcon(canvas: HTMLCanvasElement, id: WindowPaperId, tile: HTMLCanvasElement) {
  const side = tile.width * 2;
  canvas.width = side;
  canvas.height = side;
  const ctx = canvas.getContext('2d');
  if (!ctx) return;
  for (const x of [0, tile.width]) for (const y of [0, tile.height]) ctx.drawImage(tile, x, y);
  const art = windowArt(id, 'day');
  const pane = bake(`window:${id}:day`, art.source, art.palette);
  ctx.drawImage(pane, Math.floor((side - pane.width) / 2), side - 4 - pane.height);
}
