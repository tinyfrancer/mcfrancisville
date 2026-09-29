import { TILE_SIZE } from '../config/world';
import { TOWN, type MapSource } from '../data/maps';
import type { Look } from '../types/look';
import { bakeDoll } from './doll';
import { overview } from './overview';

/** The corner of the town round her house that the title screen shows, in tiles. */
const CROP = { tx: 1, ty: 3, w: 8, h: 10 };
/** Where she stands in it: on the path in front of her door. */
const HER = { tx: 3, ty: 7 };

/**
 * The title screen's picture (phase V): her plum house with Skelly in the yard, her pots and the
 * candy tree, cut from the town and drawn as it lays out, and her at her door.
 */
export function drawTitleScene(canvas: HTMLCanvasElement, look: Look): void {
  const corner: MapSource = {
    rows: TOWN.rows.slice(CROP.ty, CROP.ty + CROP.h).map((r) => r.slice(CROP.tx, CROP.tx + CROP.w)),
    legend: TOWN.legend,
    spawn: HER,
  };
  const scene = overview(corner);
  canvas.width = scene.width;
  canvas.height = scene.height;
  const ctx = canvas.getContext('2d');
  if (!ctx) return;
  ctx.putImageData(new ImageData(scene.data, scene.width, scene.height), 0, 0);
  const her = bakeDoll(look, 'down', 0);
  const x = HER.tx * TILE_SIZE + (TILE_SIZE - her.width) / 2;
  const feet = (HER.ty + 1) * TILE_SIZE - 2;
  ctx.drawImage(her, x, feet - her.height);
}
