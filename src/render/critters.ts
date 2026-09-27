import { TILE_SIZE } from '../config/world';
import { CRITTERS, flies } from '../data/critters';
import { bake } from '../sprites/bake';
import { CRITTER_ART, glows, silhouetteOf } from '../sprites/critters';
import type { CritterId } from '../types/ids';
import { PALETTE } from '../sprites/palette';
import type { Critter, Town } from '../world/Town';
import type { Point } from './camera';
import { tileHash } from './ground';
import { glowOf, type Drawable, type WorldLight } from './scene';

/** How long each of a flier's wing frames shows: a quick flutter. */
const FLAP_MS = 150;
/** A glowing critter's own small pool of light after dark. */
const CRITTER_LIGHT = { radius: 11, strength: 0.6 };

/** Where a critter is drawn this frame, as it flutters, hops or swims about its tile. */
function pose(c: Critter, nowMs: number): { x: number; y: number; frame: number; flip: boolean } {
  const phase = tileHash(c.tx, c.ty) % 1000;
  const t = nowMs + phase * 7;
  const x = c.tx * TILE_SIZE;
  const y = c.ty * TILE_SIZE;
  const family = CRITTERS[c.critter].family;
  if (flies(c.critter)) {
    const drift = Math.round(Math.sin(t / 700) * 2);
    const bob = Math.round(Math.sin(t / 260) * 2);
    // An orb pair goes slowly round each other; wings flutter.
    const frame = Math.floor(t / (family === 'orb' ? 600 : FLAP_MS)) % 2;
    return { x: x + drift, y: y - 9 + bob, frame, flip: Math.cos(t / 700) < 0 };
  }
  if (family === 'fish') {
    // Round and round a little, turning as it goes, with a flick of the tail now and then.
    const swim = Math.sin(t / 900);
    return {
      x: x + Math.round(swim * 3),
      y: y - 3 + Math.round(Math.cos(t / 900)),
      frame: Math.floor(t / 400) % 2,
      flip: Math.cos(t / 900) > 0,
    };
  }
  // A frog hops on the spot now and then; a beetle potters from side to side.
  const hop = family === 'frog' && Math.floor(t / 180) % 14 === 0 ? -2 : 0;
  const potter = family === 'beetle' ? Math.round(Math.sin(t / 1100) * 2) : 0;
  return { x: x + potter, y: y - 2 + hop, frame: 0, flip: phase % 2 === 0 };
}

/** A critter where it is this frame, with its little shadow, and what of it glows. */
export function critterDrawable(c: Critter, nowMs: number): Drawable {
  const art = CRITTER_ART[c.critter];
  const { x, y, frame, flip } = pose(c, nowMs);
  const key = `critter:${c.critter}:${frame}:${flip ? 'l' : 'r'}`;
  const source = art.frames[frame]!;
  const sprite = bake(key, source, art.palette, { flipX: flip });
  const ground = c.ty * TILE_SIZE;
  const fish = CRITTERS[c.critter].family === 'fish';
  const d: Drawable = {
    // A fish is in the water, under anything that stands at the edge of the pond.
    footY: fish ? ground + 1 : ground + 12,
    sprite,
    x,
    y,
  };
  if (!fish) {
    const aloft = flies(c.critter);
    d.shadow = { cx: x + 8, cy: ground + 13, w: aloft ? 5 : 8, h: 2 };
  }
  if (art.glow) d.glow = glowOf(`glow:${key}`, source, art.palette, art.glow, { flipX: flip });
  return d;
}

/** The little light a glowing critter casts after dark. */
export function critterLight(c: Critter, nowMs: number): WorldLight | null {
  if (!glows(c.critter)) return null;
  const { x, y } = pose(c, nowMs);
  return { x: x + 8, y: y + 8, radius: CRITTER_LIGHT.radius, strength: CRITTER_LIGHT.strength };
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
export function drawNet(ctx: CanvasRenderingContext2D, town: Town, cam: Point): void {
  const swing = town.collecting.netSwing();
  if (swing === null) return;
  const p = town.player;
  const [fx, fy] = REACH[p.facing]!;
  const facing = Math.atan2(fy, fx);
  const angle = facing - 1.2 + swing * 2.1;
  const hx = Math.round(p.x) - cam.x + fx * 3;
  const hy = Math.round(p.y) - cam.y - 6;
  const dx = Math.cos(angle);
  const dy = Math.sin(angle);
  ctx.fillStyle = PALETTE.wood;
  for (let i = 0; i < 9; i++) {
    ctx.fillRect(Math.round(hx + dx * i), Math.round(hy + dy * i), 1, 1);
  }
  const cx = Math.round(hx + dx * 12);
  const cy = Math.round(hy + dy * 12);
  ctx.globalAlpha = 0.7;
  ctx.fillStyle = PALETTE.ghost;
  ctx.fillRect(cx - 2, cy - 2, 5, 5);
  ctx.globalAlpha = 1;
  ctx.fillStyle = PALETTE.stoneLight;
  ctx.fillRect(cx - 2, cy - 3, 5, 1);
  ctx.fillRect(cx - 2, cy + 3, 5, 1);
  ctx.fillRect(cx - 3, cy - 2, 1, 5);
  ctx.fillRect(cx + 3, cy - 2, 1, 5);
}

/** A critter she hasn't found yet, all in shadow, at 1× for the HUD to scale up. */
export function drawSilhouette(canvas: HTMLCanvasElement, id: CritterId): void {
  const art = CRITTER_ART[id];
  const sprite = bake(`critter:${id}:missing`, art.frames[0], silhouetteOf(id));
  canvas.width = sprite.width;
  canvas.height = sprite.height;
  const ctx = canvas.getContext('2d');
  if (!ctx) return;
  ctx.clearRect(0, 0, canvas.width, canvas.height);
  ctx.drawImage(sprite, 0, 0);
}
