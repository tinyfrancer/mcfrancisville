import { bakeLayers } from '../sprites/bake';
import { DOLL_FRAMES, DOLL_HEIGHT } from '../sprites/doll';
import {
  figureLayers,
  MAUDE_GLOW,
  NEIGHBOUR_BUBBLES,
  MAUDE_PALETTE,
  maudeRows,
  pumpkinHead,
  PUMPKIN_HEAD_GLOW,
  type Figure,
} from '../sprites/villagers';
import type { Facing, ZoneId } from '../types/ids';
import type { World } from '../world/World';
import { PALETTE } from '../sprites/palette';
import { TILE_SIZE } from '../config/world';
import type { Point } from './camera';
import { fillPixelEllipse } from './ground';
import { bakeIcon } from './items';
import { glowOf, type Drawable } from './scene';

/** How long each of a neighbour's walk frames shows: a slower step than hers. */
const AMBLE_FRAME_MS = 180;

/**
 * A neighbour (or the Moon Pie Man, or Wes), baked for one facing and frame, `costumed` for the
 * Halloween Festival.
 */
export function bakeFigure(
  id: Figure,
  facing: Facing,
  frame: number,
  costumed = false,
): HTMLCanvasElement {
  const f = frame % DOLL_FRAMES;
  const key = `figure:${id}:${facing}:${f}${costumed ? ':costume' : ''}`;
  return bakeLayers(key, () => figureLayers(id, facing, f, costumed), {
    flipX: facing === 'left',
  });
}

/** Maude's soft glow after dark: all of her sheet, in its own pale colour. */
export function maudeGlow(facing: Facing): HTMLCanvasElement {
  return glowOf(`glow:maude:${facing}`, { rows: maudeRows(facing) }, MAUDE_PALETTE, MAUDE_GLOW, {
    flipX: facing === 'left',
  });
}

/** Gourdon's carved face after dark, candlelit from inside his pumpkin. */
function gourdonGlow(facing: Facing, frame: number): HTMLCanvasElement {
  const f = frame % DOLL_FRAMES;
  const head = pumpkinHead(facing, f);
  return glowOf(
    `glow:gourdon:${facing}:${f}`,
    { rows: head.rows },
    head.palette,
    PUMPKIN_HEAD_GLOW,
    {
      flipX: facing === 'left',
    },
  );
}

/**
 * Her neighbours in a place, outdoors or in, where they are and mid-step, with their shadows.
 * Maude floats, bobbing, and glows a little after dark. `except` is one drawn another way (Cody,
 * dancing with her).
 */
export function neighbourDrawables(
  world: World,
  zone: ZoneId,
  nowMs: number,
  except?: Figure,
): Drawable[] {
  return world.neighbourhood
    .neighboursIn(zone)
    .filter((n) => n.id !== except)
    .map((n) => {
      const frame = n.moving ? 1 + (Math.floor(n.walkMs / AMBLE_FRAME_MS) % 2) : 0;
      const sprite = bakeFigure(n.id, n.facing, frame, world.holidays.inCostume(n.id));
      const footY = Math.round(n.y) + 14;
      const x = Math.round(n.x);
      const ghost = n.id === 'maude';
      const lift = ghost ? 5 + Math.round(Math.sin(nowMs / 450) * 2) : 0;
      const d: Drawable = {
        footY,
        sprite,
        x: x - sprite.width / 2,
        y: footY - sprite.height - lift,
        shadow: { cx: x, cy: footY - 2, w: ghost ? 16 : 24, h: ghost ? 6 : 8 },
      };
      if (ghost) d.glow = maudeGlow(n.facing);
      if (n.id === 'gourdon') d.glow = gourdonGlow(n.facing, frame);
      return d;
    });
}

/**
 * Draws a neighbour into a canvas of the HUD's at 1×, as the talk sheet's portrait: their head
 * and shoulders, a 32-pixel square of them, facing her.
 */
export function drawPortrait(canvas: HTMLCanvasElement, id: Figure, costumed = false): void {
  const sprite = bakeFigure(id, 'down', 0, costumed);
  const size = 32;
  canvas.width = size;
  canvas.height = size;
  const ctx = canvas.getContext('2d');
  if (!ctx) return;
  ctx.imageSmoothingEnabled = false;
  ctx.clearRect(0, 0, size, size);
  // Maude's sheet starts a little lower in her sprite than the others' heads.
  // A costume's tall hat is left above the frame, so the face sits where it always does.
  const hat = sprite.height - bakeFigure(id, 'down', 0).height;
  const top = (id === 'maude' ? 6 : 0) + hat;
  ctx.drawImage(sprite, 0, top, size, size, 0, 0, size, size);
}

/** Where each twinkle of a spell sits round a neighbour's head, and its turn to shine. */
const TWINKLES: readonly { dx: number; dy: number; beat: number }[] = [
  { dx: -14, dy: -46, beat: 0 },
  { dx: 12, dy: -40, beat: 2 },
  { dx: -4, dy: -54, beat: 4 },
  { dx: 16, dy: -52, beat: 1 },
];

/** A spell gone mildly wrong: little lavender and mint stars winking round whoever cast it. */
export function drawSpellSparkles(
  ctx: CanvasRenderingContext2D,
  world: World,
  zone: ZoneId,
  cam: Point,
  nowMs: number,
): void {
  const px = 2;
  for (const n of world.neighbourhood.sparkling(zone)) {
    for (const t of TWINKLES) {
      const beat = (Math.floor(nowMs / 200) + t.beat) % 6;
      if (beat > 2) continue;
      const x = Math.round(n.x) + t.dx - cam.x;
      const y = Math.round(n.y) + t.dy - cam.y;
      const arm = beat === 1 ? px * 2 : px;
      ctx.fillStyle = t.beat % 2 === 0 ? PALETTE.lavender : PALETTE.skinMinty;
      ctx.fillRect(x - arm, y, arm * 2 + px, px);
      ctx.fillRect(x, y - arm, px, arm * 2 + px);
      ctx.fillStyle = PALETTE.bone;
      ctx.fillRect(x, y, px, px);
    }
  }
}

/**
 * A "!" over a neighbour with news for her, and a "?" over one who has lost something, bobbing a
 * little. Drawn after the light, so she can see them across the town at night.
 */
export function drawNeighbourBubbles(
  ctx: CanvasRenderingContext2D,
  world: World,
  zone: ZoneId,
  cam: Point,
  nowMs: number,
): void {
  for (const n of world.neighbourhood.neighboursIn(zone)) {
    const bubble = world.smallEvents.bubble(n.id);
    if (!bubble) continue;
    const art = NEIGHBOUR_BUBBLES[bubble];
    const sprite = bakeIcon(`bubble:${bubble === '!' ? 'news' : 'lost'}`, art.source, art.palette);
    const bob = 2 * (Math.floor(nowMs / 500) % 2);
    // Over a tall hat (Agatha's) as well as a ghost's float.
    const sprite0 = bakeFigure(n.id, 'down', 0, world.holidays.inCostume(n.id));
    const lift = (n.id === 'maude' ? 6 : 0) + sprite0.height - DOLL_HEIGHT;
    const x = Math.round(n.x) + 4 - cam.x;
    const y = Math.round(n.y) - 36 - lift - sprite.height - bob - cam.y;
    ctx.drawImage(sprite, x, y);
  }
}

/** Where something lost lies in town: a glint that winks, bright enough to find at night. */
export function drawLostGlint(
  ctx: CanvasRenderingContext2D,
  world: World,
  zone: ZoneId,
  cam: Point,
  nowMs: number,
): void {
  const lying = zone === 'town' ? world.smallEvents.lying() : null;
  if (!lying) return;
  const px = 2;
  const beat = Math.floor(nowMs / 180) % 8;
  const x = lying.at.tx * TILE_SIZE + 16 - cam.x;
  const y = lying.at.ty * TILE_SIZE + 14 - cam.y;
  // Always a little star, flaring now and then so it catches her eye.
  const arm = beat === 2 ? px * 4 : beat === 1 || beat === 3 ? px * 3 : px * 2;
  ctx.fillStyle = PALETTE.candle;
  ctx.fillRect(x - arm, y, arm * 2 + px, px);
  ctx.fillRect(x, y - arm, px, arm * 2 + px);
  ctx.fillStyle = PALETTE.candleBright;
  ctx.fillRect(x - px, y - px, px * 3, px * 3);
}

/**
 * A little lavender cloud drifting up beside whoever has just let one go, thinning out. Never
 * gross; they don't even notice.
 */
export function drawPuffs(
  ctx: CanvasRenderingContext2D,
  world: World,
  zone: ZoneId,
  cam: Point,
  nowMs: number,
): void {
  for (const n of world.neighbourhood.puffing(zone)) {
    const rise = Math.floor(nowMs / 200) % 4;
    const x = Math.round(n.x) - 18 - cam.x;
    const y = Math.round(n.y) - 4 - 2 * rise - cam.y;
    ctx.globalAlpha = 0.75;
    ctx.fillStyle = PALETTE.skinMinty;
    fillPixelEllipse(ctx, x, y, 10, 6);
    fillPixelEllipse(ctx, x - 6, y - 4, 8, 6);
    ctx.fillStyle = PALETTE.lavender;
    fillPixelEllipse(ctx, x - 2, y - 10 + 2 * (rise & 1), 6, 6);
    ctx.globalAlpha = 1;
  }
}
