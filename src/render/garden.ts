import { TILE_SIZE } from '../config/world';
import {
  CROP_ART,
  HOSTA_LEAVES,
  SEEDED,
  SOIL,
  SPRINKLER,
  SPRINKLER_PALETTE,
  SPROUT,
  TILLED_PALETTE,
  WATERED_PALETTE,
} from '../sprites/garden';
import { bake } from '../sprites/bake';
import { PALETTE } from '../sprites/palette';
import { tileHash } from '../sprites/terrain';
import { plantingIsRare, stageOf, type Planting } from '../systems/farming';
import type { Tile } from '../systems/pathfinding';
import { bedKey } from '../world/Farm';
import type { World } from '../world/World';
import type { Point } from './camera';
import { glowOf, type Drawable } from './scene';

/*
 * Hosta La Vista Farm as it's drawn (phase P): each bed dry or watered at a glance, what grows in
 * it, her sprinklers in their corners with a spray now and then, a twinkle on what's ripe, and
 * brackets round the bed whose pop-up is up.
 */

/** Where a sprinkler stands in its bed: the back right corner, its head over the bed's edge. */
const SPRINKLER_AT = { x: 16, y: -6 };
/** How often a sprinkler gives a little spray, and for how long. */
const SPRAY_EVERY_MS = 7000;
const SPRAY_MS = 1400;
const SPRAY_REACH = 26;
const SPRAY_DROPS = 10;

/** Her garden: tilled soil, darker where it's been watered today, and whatever is growing in it. */
export function bedDrawables(world: World, raining: boolean): Drawable[] {
  return world.map.beds.flatMap((bed) => oneBed(world, bed, raining));
}

/** One bed as it's drawn: its sprinkler, its soil, and what grows in it. */
function oneBed(world: World, bed: Tile, raining: boolean): Drawable[] {
  const farm = world.farm;
  const drawables: Drawable[] = [];
  if (farm.hasSprinkler(bed)) drawables.push(sprinklerDrawable(bed));
  if (!farm.isTilled(bed)) return drawables;
  const planting = farm.planting(bed);
  const wet = raining || world.garden.wateredBy(bed) !== null;
  const soil = wet
    ? bake('soil:watered', SOIL, WATERED_PALETTE)
    : bake('soil:tilled', SOIL, TILLED_PALETTE);
  const x = bed.tx * TILE_SIZE;
  const y = bed.ty * TILE_SIZE;
  drawables.push({ footY: y + 1, sprite: soil, x, y });
  if (planting) {
    drawables.push(cropDrawable(bed, planting, world.clock.now(), farm.sprinkled(bed)));
  }
  return drawables;
}

/**
 * The bed her pop-up is about, drawn as it stands in her garden at 32 into a canvas of the HUD's
 * (0.2's K2): its soil, its sprinkler and the crop at the stage it's at, rather than the crop's
 * 16-pixel icon. False for a wild bed, which is only grass.
 */
export function drawBedPicture(canvas: HTMLCanvasElement, world: World, bed: Tile): boolean {
  const drawables = oneBed(world, bed, world.weather.today() === 'rain');
  if (!world.farm.isTilled(bed) || drawables.length === 0) return false;
  const left = bed.tx * TILE_SIZE;
  const bottom = (bed.ty + 1) * TILE_SIZE;
  const top = Math.min(...drawables.map((d) => d.y));
  canvas.width = TILE_SIZE;
  canvas.height = bottom - top;
  const ctx = canvas.getContext('2d');
  if (!ctx) return false;
  ctx.imageSmoothingEnabled = false;
  for (const d of [...drawables].sort((a, b) => a.footY - b.footY)) {
    ctx.drawImage(d.sprite, d.x - left, d.y - top);
  }
  return true;
}

function cropDrawable(bed: Tile, planting: Planting, now: number, sprinkled: string | null) {
  const { crop } = planting;
  const art = CROP_ART[crop];
  const stage = stageOf(planting, now, sprinkled);
  // A hosta comes up in one of its three leaf colours, and a rose that will pick blue is blue.
  const leaves = crop === 'hosta' ? tileHash(bed.tx, bed.ty) % HOSTA_LEAVES.length : 0;
  const greens = crop === 'hosta' ? HOSTA_LEAVES[leaves]! : art.greens;
  const rare = stage === 'ripe' && plantingIsRare(bedKey(bed), planting);
  let key = `crop:${crop}:${stage}:${leaves}`;
  let sprite: HTMLCanvasElement;
  let glow: HTMLCanvasElement | undefined;
  if (stage === 'seed') sprite = bake('crop:seed', SEEDED, greens);
  else if (stage === 'sprout') sprite = bake(`crop:sprout:${leaves}`, SPROUT, greens);
  else if (stage === 'growing') sprite = bake(key, art.growing, greens);
  else {
    const palette =
      crop === 'hosta' ? greens : rare && art.rarePalette ? art.rarePalette : art.ripePalette;
    key += rare ? ':rare' : '';
    sprite = bake(key, art.ripe, palette);
    if (art.glow) glow = glowOf(`glow:${key}`, art.ripe, palette, art.glow);
  }
  const footY = (bed.ty + 1) * TILE_SIZE;
  const d: Drawable = { footY, sprite, x: bed.tx * TILE_SIZE, y: footY - sprite.height };
  if (glow) d.glow = glow;
  return d;
}

function sprinklerDrawable(bed: Tile): Drawable {
  const sprite = bake('sprinkler', SPRINKLER, SPRINKLER_PALETTE);
  const x = bed.tx * TILE_SIZE + SPRINKLER_AT.x;
  const y = bed.ty * TILE_SIZE + SPRINKLER_AT.y;
  // Behind whatever grows in its bed, so a crop is never hidden by it.
  return { footY: y + sprite.height, sprite, x, y };
}

/**
 * Now and then each sprinkler throws a ring of drops out over the beds it reaches, arcing up and
 * falling, so it reads as working. Each has its own moment, from where it stands.
 */
export function drawSprinklerSpray(
  ctx: CanvasRenderingContext2D,
  world: World,
  cam: Point,
  nowMs: number,
): void {
  const px = 2;
  ctx.fillStyle = PALETTE.waterLight;
  for (const s of world.farm.sprinklersIn) {
    const since = (nowMs + tileHash(s.tx, s.ty) * 97) % SPRAY_EVERY_MS;
    if (since > SPRAY_MS) continue;
    const t = since / SPRAY_MS;
    const cx = s.tx * TILE_SIZE + SPRINKLER_AT.x + 8 - cam.x;
    const cy = s.ty * TILE_SIZE + SPRINKLER_AT.y + 3 - cam.y;
    const r = 4 + t * SPRAY_REACH;
    const lift = Math.sin(Math.PI * t) * 8;
    ctx.globalAlpha = 1 - t * 0.7;
    for (let i = 0; i < SPRAY_DROPS; i++) {
      const a = (i / SPRAY_DROPS) * Math.PI * 2 + t * 0.6;
      const x = Math.round(cx + Math.cos(a) * r);
      const y = Math.round(cy + Math.sin(a) * r * 0.6 - lift + t * 6);
      ctx.fillRect(x, y, px, px);
    }
  }
  ctx.globalAlpha = 1;
}

/** A little star that winks over each ripe crop, so a ready bed reads from across the farm. */
export function drawRipeSparkles(
  ctx: CanvasRenderingContext2D,
  world: World,
  cam: Point,
  nowMs: number,
): void {
  if (world.scene !== 'town') return;
  const now = world.clock.now();
  const px = 2;
  for (const bed of world.map.beds) {
    const planting = world.farm.planting(bed);
    if (!planting || stageOf(planting, now, world.farm.sprinkled(bed)) !== 'ripe') continue;
    const beat = Math.floor(nowMs / 240 + tileHash(bed.tx, bed.ty)) % 6;
    if (beat > 2) continue;
    const x = bed.tx * TILE_SIZE + 24 - cam.x;
    const y = bed.ty * TILE_SIZE + 2 - cam.y;
    const arm = beat === 1 ? px * 2 : px;
    ctx.fillStyle = PALETTE.candle;
    ctx.fillRect(x - arm, y, arm * 2 + px, px);
    ctx.fillRect(x, y - arm, px, arm * 2 + px);
    ctx.fillStyle = PALETTE.candleBright;
    ctx.fillRect(x, y, px, px);
  }
}

/** Brackets round the bed whose pop-up is up, breathing a little, so she knows which it means. */
export function drawBedLook(
  ctx: CanvasRenderingContext2D,
  world: World,
  cam: Point,
  nowMs: number,
): void {
  const bed = world.garden.looking;
  if (!bed || world.scene !== 'town') return;
  const px = 2;
  const arm = 8;
  const out = Math.round((Math.sin(nowMs / 200) + 1) * 1) * px;
  const left = bed.tx * TILE_SIZE - cam.x - out;
  const top = bed.ty * TILE_SIZE - cam.y - out;
  const size = TILE_SIZE + out * 2 - px;
  ctx.fillStyle = PALETTE.candleBright;
  for (const [cx, dx] of [
    [left, 1],
    [left + size, -1],
  ] as const) {
    for (const [cy, dy] of [
      [top, 1],
      [top + size, -1],
    ] as const) {
      ctx.fillRect(dx > 0 ? cx : cx - arm + px, cy, arm, px);
      ctx.fillRect(cx, dy > 0 ? cy : cy - arm + px, px, arm);
    }
  }
}
