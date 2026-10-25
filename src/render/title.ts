import { TILE_SIZE } from '../config/world';
import { TOWN, type MapSource } from '../data/maps';
import { PALETTE as C } from '../sprites/palette';
import { lookOf, PROP_ART } from '../sprites/props';
import { rasterize, type Palette } from '../sprites/sprite';
import { moonAge, SYNODIC_DAYS } from '../systems/calendar';
import { parseMap } from '../systems/grid';
import { hashString, seeded } from '../systems/random';
import type { Look } from '../types/look';
import { bakeDoll } from './doll';
import { fillPixelEllipse } from './ground';
import { overview } from './overview';

/** The corner of the town round her house that the title screen shows, in tiles. */
const CROP = { tx: 1, ty: 3, w: 8, h: 9 };
/** Where she stands in it: on the path in front of her door. */
const HER = { tx: 3, ty: 7 };
/** The night sky over it (V1's L5), in pixels: short enough that the whole fits a phone on its side. */
export const SKY_HEIGHT = 56;
/** Where the moon hangs, and how big it is. */
const MOON = { x: 204, y: 22, r: 11 };

/**
 * The title screen's picture (phase V; its sky V1's L5): her plum house with Skelly in the yard,
 * her pots and the candy tree, cut from the town and drawn as it lays out, and her at her door,
 * at dusk, under a night sky with the moon at tonight's phase and the woods dark along the
 * horizon. Every season looks the same here: it's the town she first saw.
 */
export function drawTitleScene(canvas: HTMLCanvasElement, look: Look, day: string): void {
  const corner: MapSource = {
    rows: TOWN.rows.slice(CROP.ty, CROP.ty + CROP.h).map((r) => r.slice(CROP.tx, CROP.tx + CROP.w)),
    legend: TOWN.legend,
    spawn: HER,
  };
  const scene = overview(corner);
  const width = scene.width;
  canvas.width = width;
  canvas.height = SKY_HEIGHT + scene.height;
  const ctx = canvas.getContext('2d');
  if (!ctx) return;
  ctx.imageSmoothingEnabled = false;
  paintSky(ctx, width, day);
  ctx.putImageData(new ImageData(scene.data, scene.width, scene.height), 0, SKY_HEIGHT);
  const her = bakeDoll(look, 'down', 0);
  const x = HER.tx * TILE_SIZE + (TILE_SIZE - her.width) / 2;
  const feet = SKY_HEIGHT + (HER.ty + 1) * TILE_SIZE - 2;
  ctx.drawImage(her, x, feet - her.height);
  // Dusk over the town, as the game's light is a multiply over the frame, then what's lit.
  ctx.globalCompositeOperation = 'multiply';
  ctx.fillStyle = C.lightDusk;
  ctx.fillRect(0, SKY_HEIGHT, width, scene.height);
  ctx.globalCompositeOperation = 'source-over';
  drawLit(ctx, corner);
}

/** Bands of night from the top, dithered into each other, with stars, the moon and the woods. */
function paintSky(ctx: CanvasRenderingContext2D, width: number, day: string): void {
  const bands = [C.ink, C.night, C.dusk, C.plum];
  const step = SKY_HEIGHT / bands.length;
  for (let y = 0; y < SKY_HEIGHT; y++) {
    const at = y / step;
    const band = Math.floor(at);
    const near = at - band > 0.8 && band < bands.length - 1;
    for (let x = 0; x < width; x++) {
      const next = near && (x + y) % 2 === 0;
      ctx.fillStyle = bands[next ? band + 1 : band]!;
      ctx.fillRect(x, y, 1, 1);
    }
  }
  const random = seeded(hashString('title-stars'));
  for (let k = 0; k < 26; k++) {
    const sx = Math.floor(random() * width);
    const sy = Math.floor(random() * (SKY_HEIGHT - 20));
    const big = k % 7 === 0;
    ctx.fillStyle = k % 3 === 0 ? C.candleBright : C.lavender;
    ctx.fillRect(sx, sy, 1, 1);
    if (big) {
      ctx.fillStyle = C.candleBright;
      ctx.fillRect(sx - 1, sy, 3, 1);
      ctx.fillRect(sx, sy - 1, 1, 3);
    }
  }
  drawMoon(ctx, moonAge(day), MOON);
  // The woods behind the town, a dark line of crowns along the horizon.
  const woods = seeded(hashString('title-woods'));
  ctx.fillStyle = C.hedgeDark;
  for (let x = -6; x < width + 6; x += 9 + Math.floor(woods() * 5)) {
    const w = 12 + Math.floor(woods() * 8);
    const h = 14 + Math.floor(woods() * 10);
    fillPixelEllipse(ctx, x, SKY_HEIGHT - h / 2 + 4, w, h);
  }
  ctx.fillRect(0, SKY_HEIGHT - 4, width, 4);
}

/**
 * The moon at an age (days since the new moon), at `at`: lit on the right as it waxes and the left
 * as it wanes, the rest of it a shade lighter than the sky so it's always there. The sky sheet
 * hangs tonight's the same way (1.5's G4).
 */
export function drawMoon(
  ctx: CanvasRenderingContext2D,
  age: number,
  at: { x: number; y: number; r: number },
): void {
  const { x: cx, y: cy, r } = at;
  const phase = (age / SYNODIC_DAYS) * Math.PI * 2;
  const waxing = age < SYNODIC_DAYS / 2;
  // A soft ring of light round it first, two dithered steps.
  for (let y = -r - 3; y <= r + 3; y++) {
    for (let x = -r - 3; x <= r + 3; x++) {
      const d = Math.hypot(x + 0.5, y + 0.5);
      if (d > r && d <= r + 3 && (x + y) % 2 === 0) {
        ctx.fillStyle = d <= r + 1.5 ? C.plumLight : C.plum;
        ctx.fillRect(cx + x, cy + y, 1, 1);
      }
    }
  }
  for (let y = -r; y < r; y++) {
    const half = Math.sqrt(Math.max(0, r * r - (y + 0.5) * (y + 0.5)));
    const terminator = Math.cos(phase) * half;
    for (let x = -r; x < r; x++) {
      const px = x + 0.5;
      if (Math.abs(px) > half) continue;
      const lit = waxing ? px > terminator : px < -terminator;
      ctx.fillStyle = lit ? C.cream : C.dusk;
      ctx.fillRect(cx + x, cy + y, 1, 1);
    }
  }
  // A few craters on what's lit.
  ctx.globalCompositeOperation = 'source-atop';
  ctx.fillStyle = C.creamShade;
  for (const [x, y, w] of [
    [-4, -3, 3],
    [2, 2, 4],
    [-2, 5, 2],
    [4, -6, 2],
  ] as const) {
    ctx.fillRect(cx + x, cy + y, w, Math.max(1, w - 1));
  }
  ctx.globalCompositeOperation = 'source-over';
}

/** The windows, lamps and pumpkins in the corner, lit over the dusk as they are in the game. */
function drawLit(ctx: CanvasRenderingContext2D, corner: MapSource): void {
  const map = parseMap(corner);
  for (const prop of map.props) {
    const glow = PROP_ART[prop.id].glow;
    if (!glow) continue;
    const look = lookOf(prop);
    const lit: Palette = {
      ...Object.fromEntries(Object.keys(look.palette).map((k) => [k, null])),
      ...glow,
    };
    const r = rasterize(look.source, lit);
    const image = new ImageData(r.data, r.width, r.height);
    const layer = document.createElement('canvas');
    layer.width = r.width;
    layer.height = r.height;
    layer.getContext('2d')?.putImageData(image, 0, 0);
    const footY = SKY_HEIGHT + (prop.ty + prop.h) * TILE_SIZE;
    ctx.drawImage(
      layer,
      prop.tx * TILE_SIZE + (prop.w * TILE_SIZE - r.width) / 2,
      footY - r.height,
    );
  }
}
