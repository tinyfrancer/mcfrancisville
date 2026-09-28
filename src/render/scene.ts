import { bake } from '../sprites/bake';
import { PALETTE } from '../sprites/palette';
import type { Palette, RasterOptions, SpriteSource } from '../sprites/sprite';
import { tileCentre, type World } from '../world/World';
import type { Point } from './camera';
import { bakeDoll } from './doll';
import { fillPixelEllipse, SHADOW_ALPHA } from './ground';
import type { Lighting, ScreenLight } from './lighting';
import type { Daylight } from '../systems/clock';
import { isTool, type Held } from '../data/tools';
import { ITEM_ART } from '../sprites/items';
import { PACKET_GRIP, TOOL_ART } from '../sprites/tools';
import type { Facing } from '../types/ids';

/** What draws one of the places she can be: the town, or her home. */
export interface SceneView {
  /** Moves what the view keeps of its own (the camera) on by one step of the simulation. */
  follow(deltaMs: number): void;
  draw(nowMs: number): void;
  /** A tap on the page, in client pixels. */
  tap(clientX: number, clientY: number): void;
  /** Where on the page the middle of a tile is drawn, for the smoke check to tap it for real. */
  tileToClient(tx: number, ty: number): Point;
  cameraOrigin(): Point;
}

/** Anything stood on the ground, drawn in order of its feet so nearer things cover farther ones. */
export interface Drawable {
  footY: number;
  sprite: HTMLCanvasElement;
  /** World pixels, top-left. */
  x: number;
  y: number;
  /** What of it shines after dusk: its lit keys alone, over the night (see `drawGlows`). */
  glow?: HTMLCanvasElement;
  /** A shadow drawn with it, rather than baked into the ground. */
  shadow?: { cx: number; cy: number; w: number; h: number };
  /** How opaque it's drawn, for something see-through, like a ghost pet. */
  alpha?: number;
  /** Something held, drawn with it: in front, or behind when she has her back to us. */
  held?: { sprite: HTMLCanvasElement; x: number; y: number; behind: boolean };
}

/** A lamp's pool of light, in world pixels. `strength` defaults to how lit the lamps are. */
export interface WorldLight {
  x: number;
  y: number;
  radius: number;
  strength?: number;
}

/** How long each walk frame shows. Two frames a step, about two steps a tile. */
const WALK_FRAME_MS = 140;

/** Her feet sit this far below the centre of her tile, so she stands *on* it rather than astride. */
const FEET_BELOW_CENTRE = 14;

/** She carries a little light of her own after dark, so she is never lost in it. */
export const HER_LIGHT = { radius: 40, strength: 0.45 };

/** Bakes the keys of a palette that light up, with every other key left clear. */
export function glowOf(
  key: string,
  source: SpriteSource,
  palette: Palette,
  lit: Palette,
  options: RasterOptions = {},
): HTMLCanvasElement {
  const unlit = Object.fromEntries(Object.keys(palette).map((k) => [k, null]));
  return bake(key, source, { ...unlit, ...lit }, options);
}

/** Her, where she stands or mid-step, with her shadow under her. */
export function playerDrawable(world: World, nowMs = 0): Drawable {
  const p = world.player;
  const dancing = world.recordPlayer.dance() !== null;
  const index = p.moving ? 1 + (Math.floor(p.walkMs / WALK_FRAME_MS) % 2) : 0;
  const step = danceStep(nowMs);
  const pose = dancing || p.moving ? null : world.poses.pose();
  const look = world.wardrobe.look;
  const sprite = dancing
    ? bakeDoll(look, step.facing, step.frame)
    : bakeDoll(look, p.facing, index, pose ?? undefined);
  const footY = Math.round(p.y) + FEET_BELOW_CENTRE;
  const x = Math.round(p.x);
  const left = x - sprite.width / 2;
  const top = footY - sprite.height - (dancing ? step.hop : 0);
  const busy = dancing || pose !== null || world.collecting.netSwing() !== null;
  const held = busy ? undefined : inHand(world.hands.held, p.facing, left, top);
  return {
    footY,
    sprite,
    x: left,
    y: top,
    shadow: { cx: x, cy: footY - 2, w: 24, h: 8 },
    ...(held ? { held } : {}),
  };
}

/**
 * Where her hand is in her sprite, facing each way: the hand on the side we see, or for her back,
 * the one that pokes out. A thing she holds points away from her, so facing us it's mirrored.
 */
const HAND: Record<Facing, { x: number; y: number; flip: boolean; behind: boolean }> = {
  down: { x: 7, y: 35, flip: true, behind: false },
  up: { x: 22, y: 35, flip: false, behind: true },
  right: { x: 14, y: 35, flip: false, behind: false },
  left: { x: 17, y: 35, flip: true, behind: false },
};

/** What she's holding, at 1×, its grip in her hand; nothing for her bare hands. */
function inHand(held: Held, facing: Facing, left: number, top: number): Drawable['held'] {
  if (held === 'hands') return undefined;
  const art = isTool(held) ? TOOL_ART[held] : ITEM_ART[held];
  const grip = isTool(held) ? TOOL_ART[held].grip : PACKET_GRIP;
  const hand = HAND[facing];
  const sprite = bake(`held:${held}:${hand.flip ? 'l' : 'r'}`, art.source, art.palette, {
    flipX: hand.flip,
  });
  const gx = hand.flip ? sprite.width - 1 - grip.x : grip.x;
  return { sprite, x: left + hand.x - gx, y: top + hand.y - grip.y, behind: hand.behind };
}

/** A beat of Walk the Tomb, at 144 beats a minute. */
const DANCE_BEAT_MS = 60_000 / 144;
const DANCE_FACINGS = ['left', 'down', 'right', 'down'] as const;

/** Where a dancer is in the dance: turning side to side on the beat, and hopping on the off-beat. */
export function danceStep(
  nowMs: number,
  offset = 0,
): {
  facing: (typeof DANCE_FACINGS)[number];
  frame: number;
  hop: number;
} {
  const beat = Math.floor(nowMs / DANCE_BEAT_MS) + offset;
  return {
    facing: DANCE_FACINGS[((beat % 4) + 4) % 4]!,
    frame: 1 + (((beat % 2) + 2) % 2),
    hop: (nowMs / DANCE_BEAT_MS) % 1 < 0.5 ? 4 : 0,
  };
}

/** Draws each in turn, its shadow first. They should already be sorted by their feet. */
export function drawDrawables(
  ctx: CanvasRenderingContext2D,
  drawables: readonly Drawable[],
  cam: Point,
): void {
  for (const d of drawables) {
    if (d.shadow) {
      ctx.globalAlpha = SHADOW_ALPHA;
      ctx.fillStyle = PALETTE.ink;
      const { cx, cy, w, h } = d.shadow;
      fillPixelEllipse(ctx, cx - cam.x, cy - cam.y, w, h);
      ctx.globalAlpha = 1;
    }
    if (d.held?.behind) ctx.drawImage(d.held.sprite, d.held.x - cam.x, d.held.y - cam.y);
    if (d.alpha !== undefined) ctx.globalAlpha = d.alpha;
    ctx.drawImage(d.sprite, d.x - cam.x, d.y - cam.y);
    ctx.globalAlpha = 1;
    if (d.held && !d.held.behind) ctx.drawImage(d.held.sprite, d.held.x - cam.x, d.held.y - cam.y);
  }
}

export function onScreen(d: Drawable, cam: Point, canvas: HTMLCanvasElement): boolean {
  return (
    d.x + d.sprite.width > cam.x &&
    d.y + d.sprite.height > cam.y &&
    d.x < cam.x + canvas.width &&
    d.y < cam.y + canvas.height
  );
}

/** A little candle-coloured sparkle where she is headed, breathing so it reads as alive. */
export function drawTarget(
  ctx: CanvasRenderingContext2D,
  world: World,
  cam: Point,
  nowMs: number,
): void {
  const target = world.target;
  if (!target) return;
  const { x, y } = tileCentre(target);
  const r = 4 + 2 * Math.round((Math.sin(nowMs / 160) + 1) * 1.5);
  const px = 2;
  const cx = Math.round(x) - cam.x - px / 2;
  const cy = Math.round(y) - cam.y - px / 2;
  ctx.fillStyle = PALETTE.candle;
  ctx.fillRect(cx - r, cy, r * 2 + px, px);
  ctx.fillRect(cx, cy - r, px, r * 2 + px);
  ctx.fillStyle = PALETTE.candleBright;
  ctx.fillRect(cx, cy, px, px);
}

/**
 * The time of day over everything, then whatever is lit drawn back on top of it, so a window
 * glows however dark the night. The lit parts go through a layer of their own in the same order
 * as the frame, each sprite rubbing out the glow behind it, so a window never shines through her
 * when she stands in front of the house. `soften` lifts the dark toward daylight, for indoors, and
 * `tint` greys the light for a rainy or foggy day outdoors.
 */
export function drawLight(
  ctx: CanvasRenderingContext2D,
  lighting: Lighting,
  layer: HTMLCanvasElement,
  world: World,
  cam: Point,
  light: Daylight,
  drawables: readonly Drawable[],
  worldLights: readonly WorldLight[],
  soften = 0,
  tint: string | null = null,
): void {
  const p = world.player;
  const lights: ScreenLight[] = worldLights.map((l) => ({
    x: l.x - cam.x,
    y: l.y - cam.y,
    radius: l.radius,
    strength: (l.strength ?? 1) * light.lamps,
  }));
  lights.push({
    x: Math.round(p.x) - cam.x,
    y: Math.round(p.y) - cam.y - 12,
    radius: HER_LIGHT.radius,
    strength: HER_LIGHT.strength * light.lamps,
  });
  lighting.apply(ctx, light, lights, soften, tint);
  if (light.lamps <= 0 || !drawables.some((d) => d.glow)) return;

  if (layer.width !== ctx.canvas.width || layer.height !== ctx.canvas.height) {
    layer.width = ctx.canvas.width;
    layer.height = ctx.canvas.height;
  }
  const g = layer.getContext('2d');
  if (!g) return;
  g.clearRect(0, 0, layer.width, layer.height);
  for (const d of drawables) {
    g.globalCompositeOperation = 'destination-out';
    g.drawImage(d.sprite, d.x - cam.x, d.y - cam.y);
    if (d.glow) {
      g.globalCompositeOperation = 'source-over';
      g.drawImage(d.glow, d.x - cam.x, d.y - cam.y);
    }
  }
  g.globalCompositeOperation = 'source-over';
  ctx.globalAlpha = light.lamps;
  ctx.drawImage(layer, 0, 0);
  ctx.globalAlpha = 1;
}
