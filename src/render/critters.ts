import { TILE_SIZE } from '../config/world';
import { CRITTERS, flies } from '../data/critters';
import { bake } from '../sprites/bake';
import { CRITTER_ART, critterArt, glows, RIM, rimmed, silhouetteOf } from '../sprites/critters';
import type { CritterId } from '../types/ids';
import { PALETTE } from '../sprites/palette';
import type { Palette } from '../sprites/sprite';
import type { Critter, World } from '../world/World';
import type { Point } from './camera';
import { tileHash } from '../sprites/terrain';
import { glowOf, playerDrawable, type Drawable, type WorldLight } from './scene';
import { DOLL_HEIGHT, DOLL_WIDTH, SWING_HAND, viewOf } from '../sprites/doll';

/** How long each of a flier's wing frames shows: a quick flutter. */
const FLAP_MS = 150;
/** A glowing critter's own small pool of light after dark. */
const CRITTER_LIGHT = { radius: 22, strength: 0.6 };

/**
 * How see-through a fish's shadow is: its shape all in the pond's deepest colour. What glows of it
 * still glows, so a lantern fish or a blue moonfish can be told after dark.
 */
const SHADOW_ALPHA = 0.6;

/** A fish's shadow: its shape in iron, with a rim the colour of the light on the water. */
function shadowPalette(id: CritterId): Palette {
  return { ...silhouetteOf(id, PALETTE.iron), [RIM]: PALETTE.waterLight };
}

/** A critter is drawn a little under a tile across, in the middle of its tile. */
const INSET = 4;

/** How high a shy critter's hop a tile away arcs (V1's R6a). */
const HOP_LIFT = 8;

/**
 * How far a shy critter still is from the tile it's hopping to (V1's R6a), easing in, and how high
 * it's lifted on the way: a little arc, never a jump cut.
 */
function hopOf(c: Critter): { dx: number; dy: number; lift: number } {
  if (!c.hop) return { dx: 0, dy: 0, lift: 0 };
  const t = Math.min(1, Math.max(0, c.hop.t));
  const left = (1 - t) * (1 - t);
  return {
    dx: Math.round((c.hop.tx - c.tx) * TILE_SIZE * left),
    dy: Math.round((c.hop.ty - c.ty) * TILE_SIZE * left),
    lift: Math.round(Math.sin(t * Math.PI) * HOP_LIFT),
  };
}

/**
 * Where a critter is drawn this frame, its sprite's top left, as it flutters, hops or swims about
 * its tile, and on its way there if it's drifting off.
 */
function pose(c: Critter, nowMs: number): { x: number; y: number; frame: number; flip: boolean } {
  const at = settled(c, nowMs);
  const hop = hopOf(c);
  return { ...at, x: at.x + hop.dx, y: at.y + hop.dy - hop.lift };
}

function settled(
  c: Critter,
  nowMs: number,
): { x: number; y: number; frame: number; flip: boolean } {
  const phase = tileHash(c.tx, c.ty) % 1000;
  const t = nowMs + phase * 7;
  const x = c.tx * TILE_SIZE + INSET;
  const y = c.ty * TILE_SIZE;
  const family = CRITTERS[c.critter].family;
  if (flies(c.critter)) {
    const drift = Math.round(Math.sin(t / 700) * 4);
    const bob = Math.round(Math.sin(t / 260) * 4);
    // An orb pair goes slowly round each other; wings flutter.
    const frame = Math.floor(t / (family === 'orb' ? 600 : FLAP_MS)) % 2;
    return { x: x + drift, y: y - 14 + bob, frame, flip: Math.cos(t / 700) < 0 };
  }
  if (family === 'fish') {
    // Round and round a little, turning as it goes, with a flick of the tail now and then.
    const swim = Math.sin(t / 900);
    return {
      x: x + Math.round(swim * 6),
      y: y - 2 + 2 * Math.round(Math.cos(t / 900)),
      frame: Math.floor(t / 400) % 2,
      flip: Math.cos(t / 900) > 0,
    };
  }
  // A frog hops on the spot now and then; a beetle potters from side to side.
  const hop = family === 'frog' && Math.floor(t / 180) % 14 === 0 ? -4 : 0;
  const potter = family === 'beetle' ? Math.round(Math.sin(t / 1100) * 4) : 0;
  // A creepy-crawly stays where it is and wiggles, slowly (0.3's C2); the spider's frames are one.
  const wiggle = family === 'crawly' ? Math.floor(t / 900) % 2 : 0;
  return { x: x + potter, y: y + 1 + hop, frame: wiggle, flip: phase % 2 === 0 };
}

/** A critter where it is this frame, with its little shadow, and what of it glows. */
export function critterDrawable(c: Critter, nowMs: number): Drawable {
  const art = critterArt(c.critter, c.shiny);
  const { x, y, frame, flip } = pose(c, nowMs);
  const row = CRITTERS[c.critter];
  const fish = row.family === 'fish';
  // A fish is only its shadow in the water (phase Q), a small one its 16-pixel shape.
  const small = fish && row.shadow === 1;
  const source = (small ? art.frames : art.world)[frame]!;
  const look = fish ? 'shadow' : c.shiny ? 'shiny' : 'world';
  const key = `critter:${look}:${c.critter}:${frame}:${flip ? 'l' : 'r'}`;
  const sprite = fish
    ? bake(key, rimmed(source, art.palette), shadowPalette(c.critter), { flipX: flip })
    : bake(key, source, art.palette, { flipX: flip });
  const ground = c.ty * TILE_SIZE;
  const d: Drawable = {
    // A fish is in the water, under anything that stands at the edge of the pond.
    footY: fish ? ground + 2 : ground + 24,
    sprite,
    x: small ? x + 4 : x,
    y: small ? y + 4 : y,
    ...(fish ? { alpha: SHADOW_ALPHA } : {}),
  };
  if (!fish) {
    const aloft = flies(c.critter);
    const hop = hopOf(c);
    d.shadow = {
      cx: c.tx * TILE_SIZE + 16 + hop.dx,
      cy: ground + 26 + hop.dy,
      w: aloft ? 10 : 16,
      h: 4,
    };
  }
  if (art.glow) {
    d.glow = glowOf(`glow:${key}`, source, art.palette, art.glow, { flipX: flip });
  }
  return d;
}

/** How long a shiny's glint takes to come round (1.4's G1): slow, so it reads as a twinkle. */
const GLINT_MS = 1800;

/**
 * The glint over a shiny critter (1.4's G1), drawn over the light so it's seen from across the
 * lawn by day or night: a little four-pointed star that swells and fades at one corner of it,
 * then the other, as the ripe twinkle does over a bed, but slower and brighter. A fish's glints
 * are over its shadow in the water.
 */
export function drawShinyGlints(
  ctx: CanvasRenderingContext2D,
  critters: readonly Critter[],
  cam: Point,
  nowMs: number,
): void {
  const px = 2;
  for (const c of critters) {
    if (!c.shiny) continue;
    const t = (nowMs + tileHash(c.tx, c.ty) * 13) / GLINT_MS;
    const turn = Math.floor(t);
    const beat = Math.floor((t - turn) * 8);
    // Four beats of the eight a glint, then a rest: swelling, full, full, fading.
    if (beat > 3) continue;
    const arm = beat === 1 || beat === 2 ? px * 2 : px;
    const { x, y } = pose(c, nowMs);
    const corner = turn % 2 === 0 ? { dx: 20, dy: 2 } : { dx: 2, dy: 18 };
    const sx = x + corner.dx - cam.x;
    const sy = y + corner.dy - cam.y;
    ctx.fillStyle = PALETTE.candle;
    ctx.fillRect(sx - arm, sy, arm * 2 + px, px);
    ctx.fillRect(sx, sy - arm, px, arm * 2 + px);
    ctx.fillStyle = PALETTE.white;
    ctx.fillRect(sx, sy, px, px);
    if (arm > px) {
      // A fleck beside it at its brightest.
      ctx.fillStyle = PALETTE.candleBright;
      ctx.fillRect(sx + (turn % 2 === 0 ? -10 : 10), sy + 8, px, px);
    }
  }
}

/** The little light a glowing critter casts after dark. */
export function critterLight(c: Critter, nowMs: number): WorldLight | null {
  if (!glows(c.critter)) return null;
  const { x, y } = pose(c, nowMs);
  return {
    x: x + 12,
    y: y + 12,
    radius: CRITTER_LIGHT.radius,
    strength: CRITTER_LIGHT.strength,
  };
}

const REACH: Record<string, [number, number]> = {
  down: [0, 1],
  up: [0, -1],
  left: [-1, 0],
  right: [1, 0],
};

/**
 * Her net, mid-swing: a wooden handle and a hoop of pale mesh, sweeping across the way she faces
 * and down onto whatever she's after.
 */
export function drawNet(ctx: CanvasRenderingContext2D, world: World, cam: Point): void {
  const swing = world.collecting.netSwing();
  if (swing === null) return;
  const p = world.player;
  const [fx, fy] = REACH[p.facing]!;
  const facing = Math.atan2(fy, fx);
  const angle = facing - 1.2 + swing * 2.1;
  // From her hand, which swings with it (V1's E2).
  const her = playerDrawable(world);
  const frames = SWING_HAND[viewOf(p.facing)];
  const hand = frames[world.poses.frame() % frames.length]!;
  const body = her.y + her.sprite.height - DOLL_HEIGHT;
  const hx = her.x + (p.facing === 'left' ? DOLL_WIDTH - 1 - hand.x : hand.x) - cam.x;
  const hy = body + hand.y - cam.y;
  const dx = Math.cos(angle);
  const dy = Math.sin(angle);
  const dot = (x: number, y: number, w: number, h: number) => ctx.fillRect(hx + x, hy + y, w, h);
  ctx.fillStyle = PALETTE.wood;
  for (let i = 0; i < 18; i++) dot(Math.round(dx * i), Math.round(dy * i), 2, 2);
  const cx = Math.round(dx * 24);
  const cy = Math.round(dy * 24);
  ctx.globalAlpha = 0.7;
  ctx.fillStyle = PALETTE.ghost;
  dot(cx - 5, cy - 5, 11, 11);
  ctx.globalAlpha = 1;
  ctx.fillStyle = PALETTE.stoneLight;
  dot(cx - 4, cy - 6, 9, 1);
  dot(cx - 4, cy + 6, 9, 1);
  dot(cx - 6, cy - 4, 1, 9);
  dot(cx + 6, cy - 4, 1, 9);
  dot(cx - 5, cy - 5, 1, 1);
  dot(cx + 5, cy - 5, 1, 1);
  dot(cx - 5, cy + 5, 1, 1);
  dot(cx + 5, cy + 5, 1, 1);
}

/** A critter she hasn't found yet, all in shadow, at 1× for the HUD to scale up. */
export function drawSilhouette(canvas: HTMLCanvasElement, id: CritterId): void {
  const art = CRITTER_ART[id];
  const sprite = bake(`critter:${id}:missing`, art.world[0], silhouetteOf(id));
  canvas.width = sprite.width;
  canvas.height = sprite.height;
  const ctx = canvas.getContext('2d');
  if (!ctx) return;
  ctx.clearRect(0, 0, canvas.width, canvas.height);
  ctx.drawImage(sprite, 0, 0);
}
