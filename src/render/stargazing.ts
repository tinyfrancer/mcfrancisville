import { CONSTELLATION_IDS, CONSTELLATIONS, SKY_BOX } from '../data/constellations';
import { NIGHT, STAR_LOOKS, type StarLook } from '../sprites/stars';
import { PALETTE as C } from '../sprites/palette';
import { moonAge } from '../systems/calendar';
import { hashString, seeded } from '../systems/random';
import { linesLit, starAt } from '../systems/stars';
import type { ConstellationId } from '../types/ids';
import { drawMoon } from './title';

/*
 * The night sky (1.5's G4, decision 373), drawn: the telescope's view on the sky sheet, her star
 * chart in the Cabinet, and the month's constellation faint over the castle hill. Only drawing:
 * what's lit and what's found is the world's (`world.stargazing`, `Cabinet.stars`).
 */

/** The sky sheet's stage, in the sky's own pixels, scaled up by whole pixels on the sheet. */
export const STAGE = { w: 96, h: 64 } as const;
/** Where a constellation's box sits on the stage: the moon has the top right corner. */
const BOX_AT = { x: 14, y: 18 } as const;
/** Tonight's moon on the stage, as the title screen hangs it. */
const MOON = { x: 85, y: 12, r: 9 } as const;

/** What the sky sheet shows now. */
export interface SkyView {
  day: string;
  nowMs: number;
  /** The shape shown, how many of its stars are lit, and when the last of them was. */
  shape: {
    id: ConstellationId;
    lit: number;
    done: boolean;
    /** The star to pulse: the next to tap, while she needs telling. */
    pulse: number | null;
    /** A star that twinkled at a tap out of order, and when. */
    twinkle: { star: number; at: number } | null;
    /** When it was finished, to glow up from. */
    doneAt: number | null;
  } | null;
  /** A meteor shower's night: a shooting star now and then. */
  showers: boolean;
}

/** A tap at a fraction across and down the stage, in the shape's box: its star, or null. */
export function starTapped(id: ConstellationId, fx: number, fy: number): number | null {
  return starAt(id, fx * STAGE.w - BOX_AT.x, fy * STAGE.h - BOX_AT.y);
}

/** Where a constellation's stars are on the stage, as fractions across and down it, in order. */
export function starPoints(id: ConstellationId): { fx: number; fy: number }[] {
  return CONSTELLATIONS[id].stars.map((s) => ({
    fx: (s.x + BOX_AT.x + 0.5) / STAGE.w,
    fy: (s.y + BOX_AT.y + 0.5) / STAGE.h,
  }));
}

const plot = (ctx: CanvasRenderingContext2D, x: number, y: number, colour: string) => {
  ctx.fillStyle = colour;
  ctx.fillRect(x, y, 1, 1);
};

/** A star's look at `x`, `y` in its tones. */
function drawStar(
  ctx: CanvasRenderingContext2D,
  x: number,
  y: number,
  look: StarLook,
  tones: { c: string; a: string; h: string },
): void {
  for (const [dx, dy, tone] of STAR_LOOKS[look]) plot(ctx, x + dx, y + dy, tones[tone]);
}

/** A line of whole pixels from one point to another. */
function drawLine(
  ctx: CanvasRenderingContext2D,
  from: { x: number; y: number },
  to: { x: number; y: number },
  colour: string,
): void {
  const steps = Math.max(Math.abs(to.x - from.x), Math.abs(to.y - from.y));
  ctx.fillStyle = colour;
  for (let k = 0; k <= steps; k++) {
    const t = steps === 0 ? 0 : k / steps;
    ctx.fillRect(
      Math.round(from.x + (to.x - from.x) * t),
      Math.round(from.y + (to.y - from.y) * t),
      1,
      1,
    );
  }
}

/** The stage's night: bands of dark dithered into each other, field stars and tonight's moon. */
const backdrops = new Map<string, HTMLCanvasElement>();
function backdrop(day: string): HTMLCanvasElement {
  const known = backdrops.get(day);
  if (known) return known;
  const canvas = document.createElement('canvas');
  canvas.width = STAGE.w;
  canvas.height = STAGE.h;
  const ctx = canvas.getContext('2d')!;
  const bands = NIGHT.bands;
  const step = STAGE.h / bands.length;
  for (let y = 0; y < STAGE.h; y++) {
    const at = y / step;
    const band = Math.floor(at);
    const near = at - band > 0.75 && band < bands.length - 1;
    for (let x = 0; x < STAGE.w; x++) {
      plot(ctx, x, y, bands[near && (x + y) % 2 === 0 ? band + 1 : band]!);
    }
  }
  drawMoon(ctx, moonAge(day), MOON);
  if (backdrops.size > 4) backdrops.clear();
  backdrops.set(day, canvas);
  return canvas;
}

/** The field's faint stars, the same every night: where each is and how it twinkles. */
const FIELD = (() => {
  const random = seeded(hashString('sky-field'));
  return Array.from({ length: 46 }, (_, k) => ({
    x: Math.floor(random() * STAGE.w),
    y: Math.floor(random() * STAGE.h),
    tone: NIGHT.field[k % 7 === 0 ? 2 : k % 2]!,
    phase: Math.floor(random() * 4000),
    small: k % 9 === 0,
  }));
})();

/** The telescope's view: the night, the field, the shape as far as it's traced, and the moon. */
export function drawSky(canvas: HTMLCanvasElement, view: SkyView): void {
  if (canvas.width !== STAGE.w) canvas.width = STAGE.w;
  if (canvas.height !== STAGE.h) canvas.height = STAGE.h;
  const ctx = canvas.getContext('2d');
  if (!ctx) return;
  ctx.imageSmoothingEnabled = false;
  ctx.drawImage(backdrop(view.day), 0, 0);
  const shape = view.shape;
  const stars = shape
    ? CONSTELLATIONS[shape.id].stars.map((s) => ({ x: s.x + BOX_AT.x, y: s.y + BOX_AT.y }))
    : [];
  // The field, kept off the shape's own stars and the moon, so a tap is never in doubt.
  for (const f of FIELD) {
    if (stars.some((s) => Math.abs(s.x - f.x) < 5 && Math.abs(s.y - f.y) < 5)) continue;
    if (Math.hypot(f.x - MOON.x, f.y - MOON.y) < MOON.r + 3) continue;
    const bright = (view.nowMs + f.phase) % 4000 < 300;
    if (f.small || bright)
      drawStar(ctx, f.x, f.y, bright ? 'small' : 'faint', {
        c: C.white,
        a: f.tone,
        h: f.tone,
      });
    else plot(ctx, f.x, f.y, f.tone);
  }
  if (view.showers) drawShootingStar(ctx, view.nowMs);
  if (!shape) return;
  const { id, lit, done } = shape;
  const glowing = done && shape.doneAt !== null && view.nowMs - shape.doneAt < 1600;
  for (const [a, b] of linesLit(id, done ? stars.length : lit)) {
    drawLine(ctx, stars[a]!, stars[b]!, glowing ? C.candleBright : NIGHT.line);
  }
  stars.forEach((s, i) => {
    const isLit = done || i < lit;
    const twinkling = shape.twinkle?.star === i && view.nowMs - shape.twinkle.at < 450 && !isLit;
    if (twinkling) {
      drawStar(ctx, s.x, s.y, 'lit', { c: C.white, a: C.lavender, h: C.plumLight });
      return;
    }
    if (isLit) {
      drawStar(ctx, s.x, s.y, glowing || (done && i % 2 === 0) ? 'lit' : 'bright', NIGHT.lit);
      return;
    }
    const pulsing = shape.pulse === i && Math.floor(view.nowMs / 450) % 2 === 0;
    drawStar(ctx, s.x, s.y, pulsing ? 'lit' : 'bright', NIGHT.waiting);
  });
}

/** Now and then on a meteor shower's night, a star streaking down across the view. */
function drawShootingStar(ctx: CanvasRenderingContext2D, nowMs: number): void {
  const EVERY = 2600;
  const FALL = 500;
  const k = Math.floor(nowMs / EVERY);
  const age = nowMs - k * EVERY;
  if (age > FALL) return;
  const random = seeded(hashString(`sky-meteor:${k}`));
  const x0 = 30 + random() * 60;
  const y0 = random() * 20;
  const t = age / FALL;
  for (let i = 0; i < 10; i++) {
    const x = Math.round(x0 - t * 30 + i);
    const y = Math.round(y0 + t * 20 - i * 0.66);
    plot(ctx, x, y, i < 2 ? C.white : i < 5 ? C.candleBright : C.lavender);
  }
}

// ---- Her star chart (the Cabinet's Sky tab) ----

/** The chart's cells: five across and three down, a constellation each, in the year's order. */
export const CHART = { cols: 5, rows: 3, cell: { w: 40, h: 32 }, pad: 2 } as const;
const CHART_SIZE = {
  w: CHART.cols * CHART.cell.w + CHART.pad * 2,
  h: CHART.rows * CHART.cell.h + CHART.pad * 2,
};

/** Where each constellation is on the chart, by its place in the year. */
function cellOf(i: number): { x: number; y: number } {
  return {
    x: CHART.pad + (i % CHART.cols) * CHART.cell.w,
    y: CHART.pad + Math.floor(i / CHART.cols) * CHART.cell.h,
  };
}

/** The constellation on the chart at a fraction across and down it, or null. */
export function chartAt(fx: number, fy: number): ConstellationId | null {
  const x = fx * CHART_SIZE.w - CHART.pad;
  const y = fy * CHART_SIZE.h - CHART.pad;
  const col = Math.floor(x / CHART.cell.w);
  const row = Math.floor(y / CHART.cell.h);
  if (col < 0 || col >= CHART.cols || row < 0 || row >= CHART.rows) return null;
  return CONSTELLATION_IDS[row * CHART.cols + col] ?? null;
}

/** A tiny question mark of whole pixels, 3 wide and 5 tall, for a shape still to find. */
const QUERY = ['###', '..#', '.##', '...', '.#.'];

/**
 * Her star chart: the whole sky as a drawn map, each constellation in its cell, lit in gold once
 * she has traced it, and the rest as faint stars with a question mark; the one picked framed.
 */
export function drawStarChart(
  canvas: HTMLCanvasElement,
  found: (id: ConstellationId) => boolean,
  picked: ConstellationId | null,
): void {
  canvas.width = CHART_SIZE.w;
  canvas.height = CHART_SIZE.h;
  const ctx = canvas.getContext('2d');
  if (!ctx) return;
  ctx.imageSmoothingEnabled = false;
  ctx.fillStyle = C.night;
  ctx.fillRect(0, 0, CHART_SIZE.w, CHART_SIZE.h);
  for (let y = 0; y < CHART_SIZE.h; y++) {
    for (let x = (y % 2) * 1; x < CHART_SIZE.w; x += 2) {
      if (y > CHART_SIZE.h * 0.6) plot(ctx, x, y, C.dusk);
    }
  }
  const random = seeded(hashString('chart-field'));
  for (let k = 0; k < 70; k++) {
    plot(ctx, Math.floor(random() * CHART_SIZE.w), Math.floor(random() * CHART_SIZE.h), C.plum);
  }
  CONSTELLATION_IDS.forEach((id, i) => {
    const cell = cellOf(i);
    const has = found(id);
    const scale = { x: (CHART.cell.w - 8) / SKY_BOX.w, y: (CHART.cell.h - 8) / SKY_BOX.h };
    const at = (s: { x: number; y: number }) => ({
      x: cell.x + 4 + Math.round(s.x * scale.x),
      y: cell.y + 4 + Math.round(s.y * scale.y),
    });
    const row = CONSTELLATIONS[id];
    if (has) {
      for (const [a, b] of row.lines) {
        drawLine(ctx, at(row.stars[a]!), at(row.stars[b]!), C.goldShade);
      }
    }
    for (const s of row.stars) {
      const p = at(s);
      if (has) drawStar(ctx, p.x, p.y, 'small', NIGHT.lit);
      else plot(ctx, p.x, p.y, C.plumLight);
    }
    if (!has) {
      QUERY.forEach((line, j) =>
        [...line].forEach((ch, k) => {
          if (ch === '#') plot(ctx, cell.x + CHART.cell.w - 8 + k, cell.y + 3 + j, C.lavender);
        }),
      );
    }
    if (picked === id) {
      ctx.fillStyle = C.gold;
      const { w, h } = CHART.cell;
      for (const [x, y, dx, dy] of [
        [cell.x, cell.y, 1, 1],
        [cell.x + w - 1, cell.y, -1, 1],
        [cell.x, cell.y + h - 1, 1, -1],
        [cell.x + w - 1, cell.y + h - 1, -1, -1],
      ] as const) {
        ctx.fillRect(Math.min(x, x + dx * 3), y, 4, 1);
        ctx.fillRect(x, Math.min(y, y + dy * 3), 1, 4);
      }
    }
  });
}

// ---- Over the castle hill ----

/** Where the shape hangs in the view, from its top right, and how many world pixels a sky pixel is. */
const OVERHEAD = { right: 24, top: 14, scale: 2 } as const;

/**
 * The month's constellation, once she has traced it, faint among the night over the castle hill:
 * fixed to the view, as the sky is, so it stays put as she walks. Over the light, at night only.
 */
export function drawOverhead(
  ctx: CanvasRenderingContext2D,
  id: ConstellationId,
  nowMs: number,
): void {
  const row = CONSTELLATIONS[id];
  const { scale } = OVERHEAD;
  const x0 = ctx.canvas.width - OVERHEAD.right - SKY_BOX.w * scale;
  const y0 = OVERHEAD.top;
  const at = (s: { x: number; y: number }) => ({ x: x0 + s.x * scale, y: y0 + s.y * scale });
  ctx.globalAlpha = 0.22;
  for (const [a, b] of row.lines) drawLine(ctx, at(row.stars[a]!), at(row.stars[b]!), C.lavender);
  row.stars.forEach((s, i) => {
    const p = at(s);
    // Each star breathes on its own slow beat.
    const beat = (Math.sin(nowMs / 900 + i * 1.7) + 1) / 2;
    ctx.globalAlpha = 0.4 + beat * 0.4;
    drawStar(ctx, p.x, p.y, beat > 0.8 ? 'bright' : 'small', NIGHT.waiting);
  });
  ctx.globalAlpha = 1;
}
