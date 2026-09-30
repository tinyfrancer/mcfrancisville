import { TILE_SIZE } from '../config/world';
import { CALENDAR, type FestivalId } from '../data/calendar';
import { GARLANDS, type DecorId } from '../data/holidays';
import type { Tile } from '../data/maps';
import { bake } from '../sprites/bake';
import {
  DOOR_DRESSINGS,
  FESTIVAL_BANNER_PALETTE,
  festivalBanner,
  GARLAND_STYLES,
  HIDDEN_EGG,
  HIDDEN_EGG_PALETTES,
  LIT_BULB,
} from '../sprites/holidays';
import { PALETTE } from '../sprites/palette';
import { hashString, seeded } from '../systems/random';
import type { Point } from './camera';
import { glowOf, type Drawable } from './scene';

/*
 * The holidays drawn outdoors (phase U): what hangs on every front door, the garlands strung
 * between the square's lamps, Easter's eggs in the grass, and fireworks over town. What stands in
 * the square is a prop like any other, and Skelly's get-up a sprite of his own.
 */

/** A building's front door, where it's drawn: its sprite's top left, its foot, and the door. */
export interface DrawnDoor {
  x: number;
  y: number;
  footY: number;
  door: { x: number; y: number; w: number; h: number };
}

/** What hangs on each front door while a set of decorations is up, halfway down it. */
export function doorDrawables(decor: DecorId, doors: readonly DrawnDoor[]): Drawable[] {
  const art = DOOR_DRESSINGS[decor];
  const sprite = bake(`door:${decor}`, art.source, art.palette);
  const glow = art.glow ? glowOf(`glow:door:${decor}`, art.source, art.palette, art.glow) : null;
  return doors.map((d) => {
    const drawable: Drawable = {
      // Just in front of its building, and behind anyone standing on the step.
      footY: d.footY + 0.5,
      sprite,
      x: Math.round(d.x + d.door.x + d.door.w / 2 - sprite.width / 2),
      y: Math.round(d.y + d.door.y + d.door.h * 0.42 - sprite.height / 2),
    };
    if (glow) drawable.glow = glow;
    return drawable;
  });
}

/** Easter's eggs where they're hidden, each its own colour by where it is. */
export function eggDrawables(eggs: readonly Tile[]): Drawable[] {
  return eggs.map((t) => {
    const v = hashString(`egg:${t.tx},${t.ty}`) % HIDDEN_EGG_PALETTES.length;
    const sprite = bake(`egg:${v}`, HIDDEN_EGG, HIDDEN_EGG_PALETTES[v]!);
    const x = t.tx * TILE_SIZE + (TILE_SIZE - sprite.width) / 2;
    const footY = t.ty * TILE_SIZE + 26;
    return { footY, sprite, x, y: footY - sprite.height };
  });
}

/** Where a garland hangs from a lamp: just under its lantern. */
const HANG = { x: 16, y: 26 };
/** How far a garland sags in the middle, and how far apart its bulbs or pennants are. */
const SAG = 18;
const EVERY = 8;

/** Each point along a garland, a bulb or pennant apart, in world pixels. */
function along(from: Tile, to: Tile): Point[] {
  const ax = from.tx * TILE_SIZE + HANG.x;
  const ay = from.ty * TILE_SIZE + TILE_SIZE - 64 + HANG.y;
  const bx = to.tx * TILE_SIZE + HANG.x;
  const by = to.ty * TILE_SIZE + TILE_SIZE - 64 + HANG.y;
  const steps = Math.max(1, Math.round(Math.hypot(bx - ax, by - ay) / EVERY));
  return Array.from({ length: steps + 1 }, (_, i) => {
    const t = i / steps;
    return {
      x: Math.round(ax + (bx - ax) * t),
      y: Math.round(ay + (by - ay) * t + Math.sin(t * Math.PI) * SAG),
    };
  });
}

/** A string of pixels between points along a garland. */
function drawString(ctx: CanvasRenderingContext2D, points: readonly Point[], cam: Point): void {
  ctx.fillStyle = PALETTE.iron;
  for (let i = 1; i < points.length; i++) {
    const a = points[i - 1]!;
    const b = points[i]!;
    const n = Math.max(Math.abs(b.x - a.x), Math.abs(b.y - a.y));
    for (let k = 0; k < n; k++) {
      const x = Math.round(a.x + ((b.x - a.x) * k) / n);
      const y = Math.round(a.y + ((b.y - a.y) * k) / n);
      ctx.fillRect(x - cam.x, y - cam.y, 1, 1);
    }
  }
}

/**
 * A festival's banner (0.2's J1), hung from the middle of the square's top garland, its rod
 * where the string sags lowest; its string is drawn too, for a festival with no garland up.
 */
export function drawBanner(ctx: CanvasRenderingContext2D, festival: FestivalId, cam: Point): void {
  const lines = CALENDAR[festival].banner;
  const top = GARLANDS[0];
  if (!lines || !top) return;
  const points = along(top[0], top[1]);
  drawString(ctx, points, cam);
  const sprite = bake(`banner:${festival}`, festivalBanner(lines), FESTIVAL_BANNER_PALETTE);
  const middle = points[Math.floor(points.length / 2)]!;
  ctx.drawImage(sprite, Math.round(middle.x - sprite.width / 2) - cam.x, middle.y - 1 - cam.y);
}

/**
 * The garlands between the square's lamps: a string, and on it pennants or bulbs. Drawn over
 * everything, before the light, so the night darkens them; lit bulbs shine after (`drawGarlandLights`).
 */
export function drawGarlands(ctx: CanvasRenderingContext2D, decor: DecorId, cam: Point): void {
  const style = GARLAND_STYLES[decor];
  for (const [from, to] of GARLANDS) {
    const points = along(from, to);
    drawString(ctx, points, cam);
    points.slice(1, -1).forEach((p, i) => {
      ctx.fillStyle = style.colours[i % style.colours.length]!;
      const x = p.x - cam.x;
      const y = p.y - cam.y;
      if (style.kind === 'bulbs') {
        ctx.fillRect(x - 1, y + 1, 3, 3);
        ctx.fillRect(x, y + 4, 1, 1);
      } else {
        for (let j = 0; j < 5; j++)
          ctx.fillRect(x - 2 + Math.ceil(j / 2), y + 1 + j, 5 - 2 * Math.ceil(j / 2), 1);
      }
    });
  }
}

/** The garlands' bulbs lit after dark, twinkling in turn, over the night. */
export function drawGarlandLights(
  ctx: CanvasRenderingContext2D,
  decor: DecorId,
  cam: Point,
  nowMs: number,
  lamps: number,
): void {
  const style = GARLAND_STYLES[decor];
  if (style.kind !== 'bulbs' || lamps <= 0) return;
  const beat = Math.floor(nowMs / 600);
  for (const [from, to] of GARLANDS) {
    along(from, to)
      .slice(1, -1)
      .forEach((p, i) => {
        const colour = style.colours[i % style.colours.length]!;
        ctx.globalAlpha = lamps * ((i + beat) % 3 === 0 ? 0.55 : 1);
        ctx.fillStyle = LIT_BULB[colour] ?? PALETTE.candleBright;
        ctx.fillRect(p.x - cam.x - 1, p.y - cam.y + 1, 3, 3);
      });
  }
  ctx.globalAlpha = 1;
}

/**
 * Fireworks burst over the world in cells of this many pixels a side, each on its own beat, so they
 * stay where they burst as she walks (phase V) and the sky is as busy wherever she is.
 */
const BURST_CELL = 12 * TILE_SIZE;
/** How often each cell's firework bursts, and how long each takes to fade. */
const BURST_EVERY = 2800;
const BURST_MS = 1800;
const SPARKS = 24;
const FIREWORK_COLOURS = [
  PALETTE.roseLight,
  PALETTE.candleBright,
  PALETTE.orbBlueLight,
  PALETTE.orbGreenLight,
  PALETTE.lavender,
  PALETTE.white,
];

/**
 * Fireworks bursting over town (phase U): a ring of sparks that spreads, falls a little and fades,
 * one after another over wherever she is, each at its own place in the world. Drawn after the
 * light, so they shine.
 */
export function drawFireworks(ctx: CanvasRenderingContext2D, cam: Point, nowMs: number): void {
  const { width, height } = ctx.canvas;
  // A burst spreads up to about 60 pixels, so the cells just off screen are drawn too.
  const reach = 64;
  const x0 = Math.floor((cam.x - reach) / BURST_CELL);
  const x1 = Math.floor((cam.x + width + reach) / BURST_CELL);
  const y0 = Math.floor((cam.y - reach) / BURST_CELL);
  const y1 = Math.floor((cam.y + height + reach) / BURST_CELL);
  for (let cy = y0; cy <= y1; cy++) {
    for (let cx = x0; cx <= x1; cx++) {
      const offset = hashString(`fireworks:${cx},${cy}`) % BURST_EVERY;
      const k = Math.floor((nowMs - offset) / BURST_EVERY);
      const age = nowMs - offset - k * BURST_EVERY;
      if (age > BURST_MS) continue;
      const random = seeded(hashString(`firework:${cx},${cy}:${k}`));
      const x = cx * BURST_CELL + 32 + random() * (BURST_CELL - 64) - cam.x;
      const y = cy * BURST_CELL + 32 + random() * (BURST_CELL - 64) - cam.y;
      const colour = FIREWORK_COLOURS[Math.floor(random() * FIREWORK_COLOURS.length)]!;
      burst(ctx, x, y, age / BURST_MS, colour, k);
    }
  }
  ctx.globalAlpha = 1;
}

/** One firework `t` of the way through, from 0 to 1, centred on `cx`, `cy` on the screen. */
function burst(
  ctx: CanvasRenderingContext2D,
  cx: number,
  cy: number,
  t: number,
  colour: string,
  turn: number,
): void {
  const radius = 8 + Math.sqrt(t) * 56;
  const size = t < 0.5 ? 3 : 2;
  ctx.globalAlpha = 1 - t * t;
  ctx.fillStyle = colour;
  for (const [ring, reach] of [
    [0, 1],
    [1, 0.6],
  ] as const) {
    for (let i = 0; i < SPARKS; i++) {
      const a = ((i + ring / 2) / SPARKS) * Math.PI * 2 + turn;
      const x = Math.round(cx + Math.cos(a) * radius * reach);
      const y = Math.round(cy + Math.sin(a) * radius * reach + t * t * 18);
      ctx.fillRect(x, y, size, size);
    }
    ctx.fillStyle = PALETTE.candleBright;
  }
  ctx.globalAlpha = (1 - t) * 0.8;
  ctx.fillStyle = PALETTE.candleBright;
  ctx.fillRect(Math.round(cx) - 1, Math.round(cy) - 1, 3, 3);
}
