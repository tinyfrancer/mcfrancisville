import { bake } from '../sprites/bake';
import { PALETTE } from '../sprites/palette';
import type { Palette, RasterOptions, SpriteSource } from '../sprites/sprite';
import { tileCentre, type World } from '../world/World';
import type { Seat } from '../world/services/Sitting';
import type { Point } from './camera';
import { bakeDoll } from './doll';
import { DOLL_HEIGHT, SIT_DROP, SIT_FROM } from '../sprites/doll';
import { fillPixelEllipse, SHADOW_ALPHA } from './ground';
import type { Lighting, ScreenLight } from './lighting';
import { drawBloom } from './bloom';
import type { Daylight } from '../systems/clock';
import { isTool, type Held } from '../data/tools';
import { ITEM_ART } from '../sprites/items';
import {
  HELD_ART,
  HELD_PACKET,
  ICON_GRIP,
  PACKET_GRIP,
  ROD_LINE_KEYS,
  rodPalette,
} from '../sprites/tools';
import { FIRST_ROD, type RodColourId } from '../data/rods';
import { ITEMS } from '../data/items';
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
  /** She has left this view for another: let go of what's cheap to make again (the ground). */
  rest?(): void;
  /** The ground's baked chunks and the canvas memory they hold, in bytes. */
  groundMemory?(): { chunks: number; bytes: number };
  /** Pixels where the chunked ground differs from the ground baked whole (the smoke check). */
  groundSeams?(): number;
  /** The trees drawn see-through now, by their tiles, and how opaque (0.3's A3, the smoke check). */
  seeThroughCrowns?(): { tx: number; ty: number; alpha: number }[];
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
  /**
   * A tree's key, by which its crown is drawn see-through while it hides something she might want
   * behind it (0.3's A3, `render/occlusion.ts`).
   */
  crown?: string;
  /**
   * Something held, drawn with it: in front, or behind when she has her back to us. In front, the
   * `fist`, a patch of the drawable's own picture, is drawn again over it, so her hand closes
   * round the handle rather than standing beside it (phase V).
   */
  held?: {
    sprite: HTMLCanvasElement;
    x: number;
    y: number;
    behind: boolean;
    fist?: { x: number; y: number; w: number; h: number };
  };
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
  const seat = world.sitting.seat;
  if (seat) return seatedDrawable(world, seat);
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
  const cast = world.fishing.line !== null;
  // Her hand is where it is on her body, below whatever a tall hat adds above her.
  const body = top + sprite.height - DOLL_HEIGHT;
  const held = busy ? undefined : inHand(world.hands.held, p.facing, left, body, cast);
  if (held && !held.behind) {
    const hand = HAND[p.facing];
    held.fist = { x: hand.x - 2, y: body - top + FIST_TOP, w: 5, h: 4 };
  }
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
 * Her sat on a seat (0.2's G1), the bottom of her hips on its top: drawn just in front of it, so
 * its back is behind her, or just behind it with her back to us, so its back hides her.
 */
function seatedDrawable(world: World, seat: Seat): Drawable {
  const sprite = bakeDoll(world.wardrobe.look, seat.facing, 0, 'sit');
  const hips = sprite.height - DOLL_HEIGHT + SIT_FROM + SIT_DROP;
  return {
    footY: seat.floor + (seat.facing === 'down' ? 1 : -1),
    sprite,
    x: Math.round(seat.x - sprite.width / 2),
    y: Math.round(seat.y) - hips,
  };
}

/**
 * Where her hand is in her sprite, facing each way: the hand on the side we see, or for her back,
 * the one that pokes out. A thing she holds points away from her, so facing us it's mirrored.
 */
const HAND: Record<Facing, { x: number; y: number; flip: boolean; behind: boolean }> = {
  down: { x: 8, y: 35, flip: true, behind: false },
  up: { x: 23, y: 35, flip: false, behind: true },
  right: { x: 15, y: 35, flip: false, behind: false },
  left: { x: 16, y: 35, flip: true, behind: false },
};

/**
 * The colour her rod is painted (0.2's K2). A preference of the phone's, not part of her town, so
 * it's handed to the drawing from outside the world, when the game starts and when she repaints.
 */
let rodColour: RodColourId = FIRST_ROD;

export function paintRod(colour: RodColourId): void {
  rodColour = colour;
}

export function paintedRod(): RodColourId {
  return rodColour;
}

/** Her fist's top row in her sprite (rows 34 to 36 are her mitten of a hand, 37 its outline). */
const FIST_TOP = 34;

/**
 * What she's holding, at 1×, its grip in her hand; nothing for her bare hands. With her line
 * `cast`, the rod is drawn without its float, which is out in the water.
 */
function inHand(
  held: Held,
  facing: Facing,
  left: number,
  top: number,
  cast = false,
): Drawable['held'] {
  if (held === 'hands') return undefined;
  const seed = !isTool(held) && ITEMS[held].kind === 'seed';
  const art = isTool(held)
    ? HELD_ART[held]
    : seed
      ? { ...ITEM_ART[held], source: HELD_PACKET }
      : ITEM_ART[held];
  const grip = isTool(held) ? HELD_ART[held].grip : seed ? PACKET_GRIP : ICON_GRIP;
  const hand = HAND[facing];
  const bare = cast && held === 'rod';
  const own = held === 'rod' ? rodPalette(rodColour) : art.palette;
  const palette = bare
    ? { ...own, ...Object.fromEntries(ROD_LINE_KEYS.map((k) => [k, null])) }
    : own;
  const paint = held === 'rod' ? `:${rodColour}` : '';
  const key = `held:${held}${paint}${bare ? ':cast' : ''}:${hand.flip ? 'l' : 'r'}`;
  const sprite = bake(key, art.source, palette, { flipX: hand.flip });
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
    if (d.held && !d.held.behind) {
      ctx.drawImage(d.held.sprite, d.held.x - cam.x, d.held.y - cam.y);
      const f = d.held.fist;
      if (f)
        ctx.drawImage(d.sprite, f.x, f.y, f.w, f.h, d.x + f.x - cam.x, d.y + f.y - cam.y, f.w, f.h);
    }
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
    // Something see-through rubs out only as much of the glow behind it as it covers.
    g.globalAlpha = d.alpha ?? 1;
    g.globalCompositeOperation = 'destination-out';
    g.drawImage(d.sprite, d.x - cam.x, d.y - cam.y);
    if (d.glow) {
      g.globalAlpha = 1;
      g.globalCompositeOperation = 'source-over';
      drawBloom(g, d.glow, d.x - cam.x, d.y - cam.y);
      g.drawImage(d.glow, d.x - cam.x, d.y - cam.y);
    }
  }
  g.globalAlpha = 1;
  g.globalCompositeOperation = 'source-over';
  ctx.globalAlpha = light.lamps;
  ctx.drawImage(layer, 0, 0);
  ctx.globalAlpha = 1;
}
