import type { KiteId } from '../../types/ids';
import { DOLL_HEIGHT } from '../../sprites/doll';
import { KITE_ALOFT, KITE_KNOT, KITE_PALETTES, KITE_TAIL } from '../../sprites/kite';
import { PALETTE as C } from '../../sprites/palette';
import { bake } from '../../sprites/bake';
import type { World } from '../../world/World';
import type { Flight } from '../../world/services/Kite';
import type { MapZone } from '../../world/zones/MapZone';
import type { Point } from '../camera';
import type { Drawable } from '../scene';
import type { Pass } from './pass';

/*
 * Her kite up in the sky (1.6's X6, decision 385): climbing from her hand as it goes up, then
 * bobbing and dipping on the wind, its tail streaming out behind and down, the string a line from
 * her raised hand. Drawn over everything standing and under the light, so the hour lights it as it
 * lights her. Worked out from the clock and the flight alone; nothing in the world knows of it.
 */

/** How long it takes to climb to the top of its string. */
const CLIMB_MS = 2400;
/** How far up and out it flies from her hand, at the top of its string, in world pixels. */
const ALOFT = { out: 56, up: 132 };
/** How long each frame of its flapping shows. */
const FLAP_MS = 260;
/** How many bows on its tail, and how far apart. */
const TAIL = { bows: 6, apart: 6 };

/** Where her raised hand is in her sprite, holding the string, by which way she faces. */
const HAND_UP = {
  down: { x: 21, y: 5 },
  up: { x: 21, y: 5 },
  right: { x: 17, y: 5 },
  left: { x: 14, y: 5 },
} as const;

/** Where the kite's knot is now, from her hand, the way the wind takes it. */
export function kiteAt(
  hand: Point,
  side: 1 | -1,
  sinceMs: number,
  nowMs: number,
): { x: number; y: number } {
  const t = Math.min(1, Math.max(0, sinceMs / CLIMB_MS));
  const rise = 1 - (1 - t) * (1 - t);
  const sway = Math.sin(nowMs / 1700) * 10 + Math.sin(nowMs / 730) * 4;
  const bob = Math.sin(nowMs / 1100) * 6 + Math.sin(nowMs / 410) * 2;
  return {
    x: Math.round(hand.x + side * (ALOFT.out + sway) * rise),
    y: Math.round(hand.y - (ALOFT.up + bob) * rise),
  };
}

/** A pixel at a time along a sagging line from `a` to `b`. */
function drawString(ctx: CanvasRenderingContext2D, a: Point, b: Point, sag: number): void {
  const steps = Math.max(8, Math.ceil(Math.hypot(b.x - a.x, b.y - a.y)));
  for (let i = 0; i <= steps; i++) {
    const t = i / steps;
    const x = a.x + (b.x - a.x) * t;
    const y = a.y + (b.y - a.y) * t + Math.sin(t * Math.PI) * sag;
    ctx.fillRect(Math.round(x), Math.round(y), 1, 1);
  }
}

/** Its tail streaming out downwind and down from the knot, a bow at a time, rippling. */
function drawTail(
  ctx: CanvasRenderingContext2D,
  kite: KiteId,
  knot: Point,
  side: 1 | -1,
  nowMs: number,
): void {
  const { bow, knot: tie } = KITE_TAIL[kite];
  let last = knot;
  for (let i = 1; i <= TAIL.bows; i++) {
    const ripple = Math.round(Math.sin(nowMs / 280 + i * 0.9) * (1 + i * 0.5));
    const at = {
      x: Math.round(knot.x + side * (i * TAIL.apart * 0.7 + ripple)),
      y: Math.round(knot.y + i * TAIL.apart + ripple / 2),
    };
    ctx.fillStyle = tie;
    drawString(ctx, last, at, 0);
    ctx.fillStyle = bow;
    ctx.fillRect(at.x - 2, at.y - 1, 2, 2);
    ctx.fillRect(at.x + 1, at.y - 1, 2, 2);
    ctx.fillStyle = tie;
    ctx.fillRect(at.x, at.y - 1, 1, 2);
    last = at;
  }
}

/** Draws the kite up from her hand, its string and its tail, in the view's pixels. */
export function drawKite(
  ctx: CanvasRenderingContext2D,
  flight: Flight,
  facing: keyof typeof HAND_UP,
  me: Drawable,
  cam: Point,
  sinceMs: number,
  nowMs: number,
): void {
  const body = me.y + me.sprite.height - DOLL_HEIGHT;
  const grip = HAND_UP[facing];
  const hand = { x: me.x + grip.x - cam.x, y: body + grip.y - cam.y };
  const side = facing === 'left' ? -1 : 1;
  const tie = KITE_KNOT[flight.kite];
  const aloft = kiteAt(hand, side, sinceMs, nowMs);
  // On a phone on its side the view is a few tiles tall, and the top of the string is above it:
  // the kite flies lower there rather than off the top (V1.6's review, decision 386).
  const knot = { x: aloft.x, y: Math.max(aloft.y, tie.y + 2) };
  ctx.fillStyle = C.cream;
  ctx.globalAlpha = 0.85;
  drawString(ctx, hand, knot, 8);
  ctx.globalAlpha = 1;
  drawTail(ctx, flight.kite, knot, side, nowMs);
  const frame = Math.floor(nowMs / FLAP_MS) % 2;
  const art = KITE_ALOFT[flight.kite][frame]!;
  const sprite = bake(`kite:${flight.kite}:${frame}`, art, KITE_PALETTES[flight.kite]);
  ctx.drawImage(sprite, knot.x - tie.x, knot.y - tie.y);
}

/** Her kite over the place she's flying it in (1.6's X6). */
export function kitePass(world: World, zone: MapZone): Pass {
  return {
    name: 'kite',
    over(ctx, { me, cam, nowMs }) {
      const flight = world.kite.flying;
      if (!flight || flight.zone !== zone.id) return;
      const since = world.clock.now() - flight.since;
      drawKite(ctx, flight, world.player.facing, me, cam, since, nowMs);
    },
  };
}
