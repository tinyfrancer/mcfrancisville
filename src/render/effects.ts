import { ITEM_ART } from '../sprites/items';
import {
  CANDY_POP,
  countArt,
  PARCEL_POP,
  PARTICLE_ART,
  type EffectArt,
  type ParticleKind,
} from '../sprites/effects';
import { NEIGHBOUR_BUBBLES, type Emote } from '../sprites/villagers';
import type { ItemId, VillagerId, ZoneId } from '../types/ids';
import type { World } from '../world/World';
import type { TileBox } from '../world/events';
import { TILE_SIZE } from '../config/world';
import { PALETTE } from '../sprites/palette';
import type { Point } from './camera';
import { bakeIcon } from './items';
import { playerDrawable } from './scene';
import { overHead } from './villagers';

export type { Emote } from '../sprites/villagers';
export type { ParticleKind } from '../sprites/effects';

/**
 * The effects layer (V1's E1, decision 280): what a moment looks like where it happens. The
 * world says what happened and where (`world/events.ts`); `wiring/moments.ts` turns that into
 * effects pushed here; every view draws the ones in its place after everything else. Nothing
 * here is a rule: an effect changes nothing, and losing one loses nothing.
 *
 * Three families. A **pop** is what she got, its own icon arcing from where it came from to over
 * her head and floating up with "+n". A **burst** throws a handful of pooled particles (leaves,
 * dust, a splash, sparkles, hearts, confetti, coins). An **emote** is a bubble (♥ ♪ … ! ?) over
 * her or a neighbour, following them as they move.
 *
 * It is stepped by the simulation's fixed step, like the camera, so smoke cranks it with the
 * world; with reduced motion asked for, pops and emotes are short and still, and nothing flies.
 */

/**
 * Where an effect is: a point in the world, or over her head or a neighbour's, worked out as it's
 * drawn so the bubble follows them.
 */
export type Anchor = Point | { her: true } | { villager: VillagerId };

/** What a pop shows: an item's own icon, a sweet for Candy, or a parcel for anything else. */
export type PopIcon = { item: ItemId } | { candy: true } | { parcel: true };

export type Effect =
  /** `from` her is from her hands, up over her head; from anywhere else, an arc to her. */
  | { kind: 'pop'; icon: PopIcon; count: number; from: Anchor; delayMs?: number }
  /** `spread` is how far round `at` the bits start, in world pixels. */
  | {
      kind: 'burst';
      particle: ParticleKind;
      at: Anchor;
      count?: number;
      spread?: number;
      delayMs?: number;
    }
  | { kind: 'emote'; emote: Emote; over: Anchor; delayMs?: number }
  /** Where her finger came down (V1's E4): a ring that opens and fades. */
  | { kind: 'ring'; at: Point; delayMs?: number }
  /** What she tapped, bracketed for a beat (V1's E4): its tiles, or a neighbour as they move. */
  | { kind: 'outline'; around: Outlined; delayMs?: number };

/** What a tap's outline goes round: a box of tiles, or a neighbour, standing or sat. */
export type Outlined = { box: TileBox } | { villager: VillagerId };

/** A rectangle in world pixels. */
export interface Rect {
  x: number;
  y: number;
  w: number;
  h: number;
}

/** How long a pop takes to reach her, then to float up and go. */
export const POP_ARC_MS = 360;
export const POP_FLOAT_MS = 720;
/** Pops that come together go one after another, this far apart, so each is seen. */
export const POP_GAP_MS = 200;
export const EMOTE_MS = 1400;
/** With reduced motion: a pop and an emote shown still, for this long. */
export const STILL_POP_MS = 800;
export const STILL_EMOTE_MS = 1000;
/** A tap's ring, and the brackets round what she tapped (V1's E4). */
export const RING_MS = 360;
export const OUTLINE_MS = 640;
/** With reduced motion the ring doesn't open, and shows a moment. */
export const STILL_RING_MS = 240;
/** How many particles there can be at once, across every burst. */
export const POOL_SIZE = 96;

/** How high a pop's arc lifts at its middle, and how far it floats up after. */
const ARC_LIFT = 22;
const FLOAT_RISE = 14;
/** The last part of a life over which a thing fades out. */
const FADE_MS = 240;
/** From her hands, a pop starts this far below her head. */
const HANDS_BELOW_HEAD = 18;
/** Her feet are this far below her tile's centre (as `scene.ts` stands her). */
const FEET_BELOW_CENTRE = 13;
/** A footfall every this long of walking: two walk frames, one step. */
const STEP_MS = 280;

/** How each kind of particle moves, in world pixels a millisecond, and how many a burst throws. */
interface Motion {
  life: number;
  count: number;
  spread: number;
  vx: [number, number];
  vy: [number, number];
  gravity: number;
  /** How far it sways side to side as it goes, in pixels. */
  sway: number;
  /** How long each of its frames shows, for one that twinkles or tumbles. */
  frameMs: number;
}

const MOTION: Record<ParticleKind, Motion> = {
  leaf: {
    life: 900,
    count: 6,
    spread: 16,
    vx: [-0.03, 0.03],
    vy: [-0.02, 0.01],
    gravity: 0.00008,
    sway: 2,
    frameMs: 0,
  },
  dust: {
    life: 380,
    count: 5,
    spread: 6,
    vx: [-0.03, 0.03],
    vy: [-0.02, -0.005],
    gravity: 0,
    sway: 0,
    frameMs: 0,
  },
  splash: {
    life: 480,
    count: 6,
    spread: 4,
    vx: [-0.05, 0.05],
    vy: [-0.16, -0.08],
    gravity: 0.0006,
    sway: 0,
    frameMs: 0,
  },
  sparkle: {
    life: 650,
    count: 5,
    spread: 14,
    vx: [0, 0],
    vy: [-0.01, 0],
    gravity: 0,
    sway: 0,
    frameMs: 120,
  },
  heart: {
    life: 1100,
    count: 4,
    spread: 10,
    vx: [-0.015, 0.015],
    vy: [-0.05, -0.03],
    gravity: 0,
    sway: 2,
    frameMs: 0,
  },
  confetti: {
    life: 1300,
    count: 16,
    spread: 8,
    vx: [-0.09, 0.09],
    vy: [-0.2, -0.1],
    gravity: 0.0004,
    sway: 1,
    frameMs: 100,
  },
  coin: {
    life: 650,
    count: 5,
    spread: 6,
    vx: [-0.06, 0.06],
    vy: [-0.18, -0.12],
    gravity: 0.0007,
    sway: 0,
    frameMs: 0,
  },
};

/** One pooled bit, in world pixels. */
interface Particle {
  active: boolean;
  kind: ParticleKind;
  zone: ZoneId;
  x: number;
  y: number;
  vx: number;
  vy: number;
  age: number;
  life: number;
  palette: number;
  phase: number;
}

/** A pop or an emote while it shows, or any effect still waiting out its delay. */
interface Live {
  effect: Effect;
  zone: ZoneId;
  /** Below zero while it waits out its delay. */
  age: number;
  /** Whether it has begun: a pop's start fixed, a burst's bits thrown. */
  started: boolean;
  life: number;
  /** A pop's start, fixed as it begins; null for one from her hands. */
  from: Point | null;
}

/**
 * Works out an anchor where it is now: over a head, or the point itself; null if not here. With
 * the world to read, it also says where a neighbour's figure is (`figure`), for a tap's outline.
 */
export interface Resolve {
  (anchor: Anchor): Point | null;
  figure?(id: VillagerId): Rect | null;
}

/** What a pop or emote is, as the smoke check and the tests see it. */
export interface Shown {
  kind: Effect['kind'];
  zone: ZoneId;
  age: number;
  life: number;
  icon?: PopIcon;
  count?: number;
  emote?: Emote;
  over?: Anchor;
}

export interface EffectsOptions {
  /** Whether the phone asks for less motion. */
  reduced?: () => boolean;
  /** A random number in [0, 1): where the bits fly. Tests pass a seeded one. */
  random?: () => number;
}

const isPoint = (a: Anchor): a is Point => 'x' in a;

/** A bubble already over a neighbour (news, something lost): an emote goes above it. */
const OVER_BUBBLE = 20;

/**
 * Anchors as the world has them now: over her head (her hat's too), over a neighbour's if
 * they're where she is (above any bubble they have), or the point itself.
 */
export function resolverFor(world: World): Resolve {
  const resolve: Resolve = (anchor) => {
    if (isPoint(anchor)) return anchor;
    if ('her' in anchor) return { x: Math.round(world.player.x), y: playerDrawable(world).y - 2 };
    const n = world.neighbourhood.neighbour(anchor.villager);
    if (n.zone !== world.scene) return null;
    const head = overHead(world, n);
    return world.smallEvents.bubble(n.id) ? { x: head.x, y: head.y - OVER_BUBBLE } : head;
  };
  // From over their head (their hat's too) to their feet, or to the seat's edge sat down, so the
  // outline follows them onto a seat as their bubble does (V1's E3).
  resolve.figure = (id) => {
    const n = world.neighbourhood.neighbour(id);
    if (n.zone !== world.scene) return null;
    const head = overHead(world, n);
    const bottom = n.seat ? Math.round(n.seat.y) + SEATED_BELOW : Math.round(n.y) + FIGURE_BELOW;
    return { x: head.x - FIGURE_HALF, y: head.y + 1, w: FIGURE_HALF * 2, h: bottom - head.y - 1 };
  };
  return resolve;
}

/** A neighbour's figure for an outline: half as wide, and how far below them it reaches. */
const FIGURE_HALF = 14;
const FIGURE_BELOW = 15;
const SEATED_BELOW = 8;

/** Where a pop is, `age` into its life, flying from `from` to over `head`: its bottom middle. */
export function popAt(age: number, from: Point | null, head: Point): Point & { alpha: number } {
  const start = from ?? { x: head.x, y: head.y + HANDS_BELOW_HEAD };
  const t = Math.min(1, Math.max(0, age / POP_ARC_MS));
  const eased = 1 - (1 - t) * (1 - t);
  const lift = from ? ARC_LIFT * 4 * t * (1 - t) : 0;
  const rise = age > POP_ARC_MS ? ((age - POP_ARC_MS) / POP_FLOAT_MS) * FLOAT_RISE : 0;
  const life = POP_ARC_MS + POP_FLOAT_MS;
  return {
    x: Math.round(start.x + (head.x - start.x) * eased),
    y: Math.round(start.y + (head.y - start.y) * eased - lift - rise),
    alpha: fadeOf(age, life),
  };
}

function fadeOf(age: number, life: number): number {
  const left = life - age;
  return left >= FADE_MS ? 1 : Math.max(0, left / FADE_MS);
}

/** The effects in flight, for every view to draw its own place's. */
export class Effects {
  private readonly live: Live[] = [];
  private readonly pool: Particle[] = [];
  private readonly reduced: () => boolean;
  private readonly random: () => number;
  /** How long it has been stepped, so pops that come together can be spaced. */
  private time = 0;
  private nextPop = 0;
  private lastFootfall: number | null = null;

  constructor(options: EffectsOptions = {}) {
    this.reduced = options.reduced ?? (() => false);
    this.random = options.random ?? Math.random;
    for (let i = 0; i < POOL_SIZE; i++) {
      this.pool.push({
        active: false,
        kind: 'dust',
        zone: 'town',
        x: 0,
        y: 0,
        vx: 0,
        vy: 0,
        age: 0,
        life: 0,
        palette: 0,
        phase: 0,
      });
    }
  }

  /** Something to show in `zone`. A burst with reduced motion asked for shows nothing. */
  push(zone: ZoneId, effect: Effect): void {
    const still = this.reduced();
    if (effect.kind === 'burst' && still) return;
    let delay = effect.delayMs ?? 0;
    if (effect.kind === 'pop') {
      delay = Math.max(delay, this.nextPop - this.time);
      this.nextPop = this.time + delay + POP_GAP_MS;
    }
    if (effect.kind === 'emote') {
      // One bubble over a head at a time: the newest says it.
      const same = (l: Live) =>
        l.effect.kind === 'emote' && sameAnchor(l.effect.over, effect.over) && l.zone === zone;
      for (let i = this.live.length - 1; i >= 0; i--)
        if (same(this.live[i]!)) this.live.splice(i, 1);
    }
    const life = lifeOf(effect, still);
    this.live.push({ effect, zone, age: -delay, life, from: null, started: false });
  }

  /**
   * A footfall's little puff of dust under her as she walks outdoors, one each step; none
   * indoors, standing still, or with reduced motion.
   */
  walking(
    zone: ZoneId,
    player: { x: number; y: number; moving: boolean; walkMs: number },
    outdoors: boolean,
  ): void {
    const step = player.moving ? Math.floor(player.walkMs / STEP_MS) : null;
    const fell = step !== null && this.lastFootfall !== null && step !== this.lastFootfall;
    this.lastFootfall = step;
    if (!fell || !outdoors || this.reduced()) return;
    const feet = { x: player.x, y: player.y + FEET_BELOW_CENTRE };
    this.spawn(zone, 'dust', feet, 1, 3, 0.6);
  }

  /** Everything moved on by one step of the simulation. */
  step(deltaMs: number, resolve: Resolve): void {
    this.time += deltaMs;
    for (let i = this.live.length - 1; i >= 0; i--) {
      const l = this.live[i]!;
      l.age += deltaMs;
      if (l.age < 0) continue;
      if (!l.started) this.begin(l, resolve);
      if (l.age >= l.life) this.live.splice(i, 1);
    }
    for (const p of this.pool) {
      if (!p.active) continue;
      p.age += deltaMs;
      if (p.age >= p.life) {
        p.active = false;
        continue;
      }
      const m = MOTION[p.kind];
      p.vy += m.gravity * deltaMs;
      p.x += p.vx * deltaMs;
      p.y += p.vy * deltaMs;
    }
  }

  /** An effect's start: a pop's source fixed, a burst's bits thrown (and the burst done). */
  private begin(l: Live, resolve: Resolve): void {
    l.started = true;
    const e = l.effect;
    if (e.kind === 'pop') {
      l.from = isPoint(e.from) ? { ...e.from } : null;
      if (!isPoint(e.from) && !('her' in e.from)) l.from = resolve(e.from);
    }
    if (e.kind === 'burst') {
      const at = resolve(e.at);
      if (at) this.spawn(l.zone, e.particle, at, e.count, e.spread);
      l.life = 0;
    }
  }

  private spawn(
    zone: ZoneId,
    kind: ParticleKind,
    at: Point,
    count = MOTION[kind].count,
    spread = MOTION[kind].spread,
    lifeScale = 1,
  ): void {
    const m = MOTION[kind];
    const r = this.random;
    const between = ([lo, hi]: [number, number]) => lo + (hi - lo) * r();
    for (let i = 0; i < count; i++) {
      const p = this.free();
      p.active = true;
      p.kind = kind;
      p.zone = zone;
      p.x = at.x + (r() * 2 - 1) * spread;
      p.y = at.y + (r() * 2 - 1) * spread * 0.6;
      p.vx = between(m.vx);
      p.vy = between(m.vy);
      p.age = 0;
      p.life = m.life * lifeScale * (0.8 + 0.4 * r());
      p.palette = Math.floor(r() * PARTICLE_ART[kind].palettes.length);
      p.phase = r() * Math.PI * 2;
    }
  }

  /** A free particle, or the one nearest its end when the pool is full. */
  private free(): Particle {
    let oldest = this.pool[0]!;
    for (const p of this.pool) {
      if (!p.active) return p;
      if (p.age / p.life > oldest.age / oldest.life) oldest = p;
    }
    return oldest;
  }

  /** The pops and emotes showing now (not those still waiting), and how many particles fly. */
  shown(): Shown[] {
    return this.live
      .filter((l) => l.started && l.life > 0)
      .map((l) => {
        const e = l.effect;
        const base = { kind: e.kind, zone: l.zone, age: l.age, life: l.life };
        if (e.kind === 'pop') return { ...base, icon: e.icon, count: e.count };
        if (e.kind === 'emote') return { ...base, emote: e.emote, over: e.over };
        return base;
      });
  }

  /** Where the sparkles and coins are in `zone`, for the light to bloom round after dark (V1's L3). */
  glints(zone: ZoneId): Point[] {
    return this.pool
      .filter((p) => p.active && p.zone === zone && (p.kind === 'sparkle' || p.kind === 'coin'))
      .map((p) => ({ x: Math.round(p.x), y: Math.round(p.y) }));
  }

  /** How many particles are flying in `zone` (or anywhere). */
  particles(zone?: ZoneId): number {
    return this.pool.filter((p) => p.active && (zone === undefined || p.zone === zone)).length;
  }

  /**
   * Draws `zone`'s effects over the frame, in world pixels less `cam`, each on a whole pixel:
   * particles first, then pops, then emotes over all.
   */
  draw(ctx: CanvasRenderingContext2D, zone: ZoneId, cam: Point, resolve: Resolve): void {
    const still = this.reduced();
    for (const p of this.pool) {
      if (!p.active || p.zone !== zone) continue;
      const m = MOTION[p.kind];
      const art = PARTICLE_ART[p.kind];
      const frame = m.frameMs > 0 ? Math.floor(p.age / m.frameMs) % art.frames.length : 0;
      const sprite = bakeIcon(
        `effect:${p.kind}:${frame}:${p.palette}`,
        art.frames[frame]!,
        art.palettes[p.palette]!,
      );
      const sway = m.sway * Math.sin(p.age / 150 + p.phase);
      const x = Math.round(p.x + sway - sprite.width / 2) - cam.x;
      const y = Math.round(p.y - sprite.height / 2) - cam.y;
      ctx.globalAlpha = particleAlpha(p.age, p.life);
      ctx.drawImage(sprite, x, y);
    }
    ctx.globalAlpha = 1;
    for (const l of this.live) {
      if (!l.started || l.zone !== zone) continue;
      const e = l.effect;
      if (e.kind === 'pop') this.drawPop(ctx, l, e, cam, resolve, still);
      else if (e.kind === 'emote') drawEmote(ctx, l, e, cam, resolve, still);
      else if (e.kind === 'ring') drawRing(ctx, ringAt(l.age, l.life, still), e.at, cam);
      else if (e.kind === 'outline') {
        const rect =
          'box' in e.around ? boxRect(e.around.box) : resolve.figure?.(e.around.villager);
        if (rect) drawBrackets(ctx, rect, outlineAt(l.age, l.life, still), cam);
      }
    }
    ctx.globalAlpha = 1;
  }

  private drawPop(
    ctx: CanvasRenderingContext2D,
    l: Live,
    e: Extract<Effect, { kind: 'pop' }>,
    cam: Point,
    resolve: Resolve,
    still: boolean,
  ): void {
    const head = resolve({ her: true });
    if (!head) return;
    const at = still
      ? { x: head.x, y: head.y, alpha: fadeOf(l.age, l.life) }
      : popAt(l.age, l.from, head);
    const icon = popSprite(e.icon);
    const left = at.x - Math.round(icon.width / 2) - cam.x;
    const top = at.y - icon.height - cam.y;
    ctx.globalAlpha = at.alpha;
    ctx.drawImage(icon, left, top);
    // The count once it's with her, beside it.
    if (still || l.age >= POP_ARC_MS) {
      const n = countArt(e.count);
      const count = bakeIcon(`effect:count:${e.count}`, n.source, n.palette);
      ctx.drawImage(count, left + icon.width - 2, top + icon.height - count.height);
    }
  }
}

/** How long an effect shows; a burst's life is its bits'. */
function lifeOf(effect: Effect, still: boolean): number {
  switch (effect.kind) {
    case 'pop':
      return still ? STILL_POP_MS : POP_ARC_MS + POP_FLOAT_MS;
    case 'emote':
      return still ? STILL_EMOTE_MS : EMOTE_MS;
    case 'ring':
      return still ? STILL_RING_MS : RING_MS;
    case 'outline':
      return OUTLINE_MS;
    case 'burst':
      return 0;
  }
}

function particleAlpha(age: number, life: number): number {
  const t = age / life;
  return t < 0.65 ? 1 : Math.max(0, (1 - t) / 0.35);
}

function sameAnchor(a: Anchor, b: Anchor): boolean {
  if ('her' in a) return 'her' in b;
  if ('villager' in a) return 'villager' in b && b.villager === a.villager;
  return isPoint(b) && a.x === b.x && a.y === b.y;
}

function popSprite(icon: PopIcon): HTMLCanvasElement {
  if ('item' in icon) {
    const art = ITEM_ART[icon.item];
    return bakeIcon(`item:${icon.item}`, art.source, art.palette);
  }
  const art: EffectArt = 'candy' in icon ? CANDY_POP : PARCEL_POP;
  return bakeIcon(`effect:${'candy' in icon ? 'candy' : 'parcel'}`, art.source, art.palette);
}

/** A bubble over a head: it pops up a little as it comes, bobs, and fades as it goes. */
function drawEmote(
  ctx: CanvasRenderingContext2D,
  l: Live,
  e: Extract<Effect, { kind: 'emote' }>,
  cam: Point,
  resolve: Resolve,
  still: boolean,
): void {
  const head = resolve(e.over);
  if (!head) return;
  const art = NEIGHBOUR_BUBBLES[e.emote];
  const sprite = bakeIcon(`bubble:${emoteKey(e.emote)}`, art.source, art.palette);
  const rise = still ? 0 : l.age < 100 ? -2 : 2 * (Math.floor(l.age / 500) % 2);
  ctx.globalAlpha = fadeOf(l.age, l.life);
  ctx.drawImage(
    sprite,
    Math.round(head.x) + 4 - cam.x,
    Math.round(head.y) - sprite.height - rise - cam.y,
  );
}

/** Each bubble's cache key: the first two keep the names `drawNeighbourBubbles` bakes them by. */
function emoteKey(emote: Emote): string {
  return { '!': 'news', '?': 'lost', '♥': 'emote:heart', '♪': 'emote:note', '…': 'emote:dots' }[
    emote
  ];
}

// ---- A tap (V1's E4, decision 283) -----------------------------------------------------------

/** A ring's radius and how opaque it is, `age` into its life: it opens fast and fades. */
export function ringAt(age: number, life: number, still: boolean): { r: number; alpha: number } {
  const t = Math.min(1, Math.max(0, age / life));
  if (still) return { r: RING_STILL_R, alpha: 1 - t };
  const eased = 1 - (1 - t) * (1 - t);
  return { r: Math.round(RING_FROM + (RING_TO - RING_FROM) * eased), alpha: 1 - t * t };
}

const RING_FROM = 3;
const RING_TO = 12;
const RING_STILL_R = 7;
/** The ring's and the brackets' pixel, two of the world's, as the bed's brackets are. */
const PX = 2;

/**
 * A ring of whole pixels round `at` (a midpoint circle, each point a 2-pixel square), in the
 * candle's colour that marks where she's going.
 */
export function ringPoints(r: number): Point[] {
  const points: Point[] = [];
  const seen = new Set<string>();
  const add = (x: number, y: number) => {
    const k = `${x},${y}`;
    if (seen.has(k)) return;
    seen.add(k);
    points.push({ x, y });
  };
  let x = r;
  let y = 0;
  let err = 1 - r;
  while (x >= y) {
    for (const [px, py] of [
      [x, y],
      [y, x],
      [-y, x],
      [-x, y],
      [-x, -y],
      [-y, -x],
      [y, -x],
      [x, -y],
    ] as const) {
      add(px, py);
    }
    y++;
    if (err < 0) err += 2 * y + 1;
    else {
      x--;
      err += 2 * (y - x) + 1;
    }
  }
  return points;
}

function drawRing(
  ctx: CanvasRenderingContext2D,
  ring: { r: number; alpha: number },
  at: Point,
  cam: Point,
): void {
  if (ring.alpha <= 0) return;
  ctx.globalAlpha = ring.alpha;
  ctx.fillStyle = PALETTE.candleBright;
  const cx = Math.round(at.x) - cam.x - PX / 2;
  const cy = Math.round(at.y) - cam.y - PX / 2;
  for (const p of ringPoints(ring.r)) ctx.fillRect(cx + p.x, cy + p.y, PX, PX);
  ctx.globalAlpha = 1;
}

/** A box of tiles in world pixels. */
function boxRect(box: TileBox): Rect {
  return {
    x: box.tx * TILE_SIZE,
    y: box.ty * TILE_SIZE,
    w: box.w * TILE_SIZE,
    h: box.h * TILE_SIZE,
  };
}

/** How far out the brackets stand and how opaque they are: closing in on it, then fading. */
export function outlineAt(
  age: number,
  life: number,
  still: boolean,
): { out: number; alpha: number } {
  const alpha = fadeOf(age, life);
  if (still) return { out: OUTLINE_REST, alpha };
  const t = Math.min(1, Math.max(0, age / OUTLINE_CLOSE_MS));
  const eased = 1 - (1 - t) * (1 - t);
  const out = OUTLINE_REST + (OUTLINE_FROM - OUTLINE_REST) * (1 - eased);
  return { out: Math.round(out / PX) * PX, alpha };
}

/** The brackets start this far out from what she tapped and close in to `OUTLINE_REST`. */
const OUTLINE_FROM = 8;
const OUTLINE_REST = 2;
const OUTLINE_CLOSE_MS = 140;
/** How long each bracket's arms are. */
const ARM = 8;

/** Four corner brackets round `rect`, the bed's look (`drawBedLook`) at any size. */
function drawBrackets(
  ctx: CanvasRenderingContext2D,
  rect: Rect,
  at: { out: number; alpha: number },
  cam: Point,
): void {
  if (at.alpha <= 0) return;
  ctx.globalAlpha = at.alpha;
  ctx.fillStyle = PALETTE.candleBright;
  const left = Math.round(rect.x) - cam.x - at.out;
  const top = Math.round(rect.y) - cam.y - at.out;
  const right = Math.round(rect.x + rect.w) - cam.x + at.out - PX;
  const bottom = Math.round(rect.y + rect.h) - cam.y + at.out - PX;
  const arm = Math.min(ARM, Math.floor((right - left) / 2), Math.floor((bottom - top) / 2));
  for (const [cx, dx] of [
    [left, 1],
    [right, -1],
  ] as const) {
    for (const [cy, dy] of [
      [top, 1],
      [bottom, -1],
    ] as const) {
      ctx.fillRect(dx > 0 ? cx : cx - arm + PX, cy, arm, PX);
      ctx.fillRect(cx, dy > 0 ? cy : cy - arm + PX, PX, arm);
    }
  }
  ctx.globalAlpha = 1;
}
