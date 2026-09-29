import { TILE_SIZE } from '../config/world';
import { CRITTERS, flies } from '../data/critters';
import { bake } from '../sprites/bake';
import { CRITTER_ART, glows, silhouetteOf } from '../sprites/critters';
import type { CritterId } from '../types/ids';
import { PALETTE } from '../sprites/palette';
import type { Critter, World } from '../world/World';
import type { Point } from './camera';
import { tileHash } from '../sprites/terrain';
import { glowOf, type Drawable, type WorldLight } from './scene';

/** How long each of a flier's wing frames shows: a quick flutter. */
const FLAP_MS = 150;
/** A glowing critter's own small pool of light after dark. */
const CRITTER_LIGHT = { radius: 22, strength: 0.6 };

/**
 * How see-through a fish's shadow is: its shape all in the pond's deepest colour. What glows of it
 * still glows, so a lantern fish or a blue moonfish can be told after dark.
 */
const SHADOW_ALPHA = 0.6;

/** A critter is drawn a little under a tile across, in the middle of its tile. */
const INSET = 4;

/**
 * Where a critter is drawn this frame, its sprite's top left, as it flutters, hops or swims about
 * its tile.
 */
function pose(c: Critter, nowMs: number): { x: number; y: number; frame: number; flip: boolean } {
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
  return { x: x + potter, y: y + 1 + hop, frame: 0, flip: phase % 2 === 0 };
}

/** A critter where it is this frame, with its little shadow, and what of it glows. */
export function critterDrawable(c: Critter, nowMs: number): Drawable {
  const art = CRITTER_ART[c.critter];
  const { x, y, frame, flip } = pose(c, nowMs);
  const row = CRITTERS[c.critter];
  const fish = row.family === 'fish';
  // A fish is only its shadow in the water (phase Q), a small one its 16-pixel shape.
  const small = fish && row.shadow === 1;
  const source = (small ? art.frames : art.world)[frame]!;
  const look = fish ? 'shadow' : 'world';
  const key = `critter:${look}:${c.critter}:${frame}:${flip ? 'l' : 'r'}`;
  const sprite = bake(key, source, fish ? silhouetteOf(c.critter, PALETTE.iron) : art.palette, {
    flipX: flip,
  });
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
    d.shadow = { cx: c.tx * TILE_SIZE + 16, cy: ground + 26, w: aloft ? 10 : 16, h: 4 };
  }
  if (art.glow) {
    d.glow = glowOf(`glow:${key}`, source, art.palette, art.glow, { flipX: flip });
  }
  return d;
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
  const hx = Math.round(p.x) - cam.x + fx * 6;
  const hy = Math.round(p.y) - cam.y - 12;
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
