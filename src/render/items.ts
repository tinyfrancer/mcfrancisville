import type { CalendarId } from '../data/calendar';
import { CALENDAR_MARKS, CALENDAR_PAGE, NEIGHBOUR_CAKE } from '../sprites/calendarMarks';
import { ICON_SIZE, TILE_SIZE } from '../config/world';
import type { BroomLook } from '../data/broom';
import { broomIconArt, lookKey } from '../sprites/broom';
import { bake } from '../sprites/bake';
import { ITEM_ART, type ItemArt } from '../sprites/items';
import { rodPalette, TOOL_ART } from '../sprites/tools';
import type { RodColourId } from '../data/rods';
import { paintedRod } from './scene';
import type { Palette, SpriteSource } from '../sprites/sprite';
import type { ItemId, ToolId } from '../types/ids';

/** How many world pixels a pixel of an icon is, where the world draws one (a snack, a bubble). */
export const ICON_SCALE = TILE_SIZE / ICON_SIZE;

/** An icon's grid, baked for the world at `ICON_SCALE`. */
export function bakeIcon(key: string, source: SpriteSource, palette: Palette): HTMLCanvasElement {
  return bake(key, source, palette, { scale: ICON_SCALE });
}

/** An item, baked once, drawn into a canvas of the HUD's at 1× for CSS to scale by a whole number. */
export function drawItemIcon(canvas: HTMLCanvasElement, id: ItemId): void {
  drawIcon(canvas, `item:${id}`, ITEM_ART[id]);
}

/** Her broom in her colours (0.2's P1), at 1×. */
export function drawBroomIcon(canvas: HTMLCanvasElement, look: BroomLook): void {
  drawIcon(canvas, `broom:${lookKey(look)}`, broomIconArt(look));
}

/** A day's mark on the calendar (0.2's K2), at 1×. */
export function drawCalendarMark(canvas: HTMLCanvasElement, id: CalendarId): void {
  drawIcon(canvas, `mark:${id}`, CALENDAR_MARKS[id]);
}

/** A neighbour's birthday cake on the calendar, or a plain page of it (0.2's U4), at 1×. */
export function drawPlainMark(canvas: HTMLCanvasElement, mark: 'neighbourBirthday' | 'page'): void {
  drawIcon(canvas, `mark:${mark}`, mark === 'page' ? CALENDAR_PAGE : NEIGHBOUR_CAKE);
}

/** Something she can hold on the quick bar, at 1×; her rod in the colour she painted it. */
export function drawToolIcon(canvas: HTMLCanvasElement, id: ToolId): void {
  if (id === 'rod') drawRodIcon(canvas, paintedRod());
  else drawIcon(canvas, `tool:${id}`, TOOL_ART[id]);
}

/** Her rod in one of its colours, at 1× (0.2's K2). */
export function drawRodIcon(canvas: HTMLCanvasElement, colour: RodColourId): void {
  drawIcon(canvas, `tool:rod:${colour}`, { ...TOOL_ART.rod, palette: rodPalette(colour) });
}

function drawIcon(canvas: HTMLCanvasElement, key: string, art: ItemArt): void {
  const sprite = bake(key, art.source, art.palette);
  canvas.width = sprite.width;
  canvas.height = sprite.height;
  const ctx = canvas.getContext('2d');
  if (!ctx) return;
  ctx.clearRect(0, 0, canvas.width, canvas.height);
  ctx.drawImage(sprite, 0, 0);
}
