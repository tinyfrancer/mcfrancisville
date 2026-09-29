import { bakeLayers } from '../sprites/bake';
import { DOLL_FRAMES } from '../sprites/doll';
import {
  figureLayers,
  MAUDE_GLOW,
  MAUDE_PALETTE,
  maudeRows,
  type Figure,
} from '../sprites/villagers';
import type { Facing, ZoneId } from '../types/ids';
import type { World } from '../world/World';
import { PALETTE } from '../sprites/palette';
import type { Point } from './camera';
import { glowOf, type Drawable } from './scene';

/** How long each of a neighbour's walk frames shows: a slower step than hers. */
const AMBLE_FRAME_MS = 180;

/** A neighbour (or the Moon Pie Man, or Wes), baked for one facing and frame. */
export function bakeFigure(id: Figure, facing: Facing, frame: number): HTMLCanvasElement {
  const f = frame % DOLL_FRAMES;
  return bakeLayers(`figure:${id}:${facing}:${f}`, () => figureLayers(id, facing, f), {
    flipX: facing === 'left',
  });
}

/** Maude's soft glow after dark: all of her sheet, in its own pale colour. */
export function maudeGlow(facing: Facing): HTMLCanvasElement {
  return glowOf(`glow:maude:${facing}`, { rows: maudeRows(facing) }, MAUDE_PALETTE, MAUDE_GLOW, {
    flipX: facing === 'left',
  });
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
      const sprite = bakeFigure(n.id, n.facing, frame);
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
      return d;
    });
}

/**
 * Draws a neighbour into a canvas of the HUD's at 1×, as the talk sheet's portrait: their head
 * and shoulders, a 32-pixel square of them, facing her.
 */
export function drawPortrait(canvas: HTMLCanvasElement, id: Figure): void {
  const sprite = bakeFigure(id, 'down', 0);
  const size = 32;
  canvas.width = size;
  canvas.height = size;
  const ctx = canvas.getContext('2d');
  if (!ctx) return;
  ctx.imageSmoothingEnabled = false;
  ctx.clearRect(0, 0, size, size);
  // Maude's sheet starts a little lower in her sprite than the others' heads.
  const top = id === 'maude' ? 6 : 0;
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
