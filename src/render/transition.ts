import type { DayWindow } from '../data/windows';
import { bake } from '../sprites/bake';
import {
  BROOM_SEAT,
  POOF_FRAMES,
  POOF_PALETTE,
  RIDING_BROOM,
  ridingBroomPalette,
} from '../sprites/broomFlight';
import { DOLL_HEIGHT, SIT_DROP, SIT_FROM } from '../sprites/doll';
import { lookKey } from '../sprites/broom';
import { PALETTE } from '../sprites/palette';
import type { World } from '../world/World';
import type { Point } from './camera';
import { bakeDoll } from './doll';

/*
 * Between places (V1's E4, decision 283): an iris that closes on her and opens on her at the new
 * place, her broom seen flying off before it, and a wash of colour as a window of the day turns.
 * The world never knows: these are the view's, started by the moments that say she went somewhere
 * (`entered`, `flew`) or the day turned (`window`) in `wiring/moments.ts`. Drawn over the canvas
 * by `main.ts` after the view, only while one is under way, so play costs nothing.
 *
 * A place's moment plays before the next frame is drawn, so the canvas still holds the last
 * frame of the place she left: it is copied once and closed over, and the new place opens.
 */

/** The iris closing on her where she was, and opening on her where she is. */
export const IRIS_CLOSE_MS = 180;
export const IRIS_OPEN_MS = 220;
/** Her broom swooping off before the iris closes. */
export const FLIGHT_MS = 560;
/** How long after `flew` she is seen at the new place, for its landing to wait for. */
export const LANDING_MS = FLIGHT_MS + IRIS_CLOSE_MS;
/** A window of the day's wash: up quickly, and away slowly. */
export const WASH_MS = 1100;
const WASH_UP_MS = 260;
const WASH_ALPHA = 0.22;

/** Each window's wash: a warm morning, a golden afternoon, a cool evening. */
export const WASH_COLOUR: Record<DayWindow, string> = {
  morning: PALETTE.skyDawn,
  afternoon: PALETTE.skyGolden,
  evening: PALETTE.skyDusk,
};

/** What's under way, as the smoke check and the tests see it. */
export interface TransitionState {
  kind: 'iris' | 'broom' | 'wash';
  progress: number;
}

/** How long a frame drawn after she went is kept for its moment. */
const LEFT_KEPT_MS = 500;

/** Her middle, this far above her feet, is where the iris closes and opens. */
const HER_MIDDLE = 22;
/** How far up and across she swoops before she's off the frame. */
const SWOOP_RISE = 90;

interface Passage {
  kind: 'iris' | 'broom';
  age: number;
  /** Where she stood on the frame she left, her feet, and that frame. */
  from: Point;
  frozen: HTMLCanvasElement;
  /** Her on her broom, and the way she flies (1 right, -1 left). */
  rider?: { sprite: HTMLCanvasElement; dir: 1 | -1; trail: Point[] };
}

export interface TransitionsOptions {
  /** Whether the phone asks for less motion: a fade through dark, and no flight. */
  reduced?: () => boolean;
}

/** The transitions under way: a place's (an iris, a flight) and a window's wash. */
export class Transitions {
  private readonly canvas: HTMLCanvasElement;
  private readonly reduced: () => boolean;
  private passage: Passage | null = null;
  private wash: { colour: string; age: number } | null = null;
  /** Her feet on the canvas as the last frame drew her. */
  private her: Point = { x: 0, y: 0 };
  /** The frame she left, kept only while a passage is under way. */
  private readonly frozen = document.createElement('canvas');
  /** Where she was last drawn (her place and room), to see a frame drawn after she has gone. */
  private where: string | null = null;
  /** The frame she left and where she stood on it, kept for the moment that says she went. */
  private left: { her: Point; age: number } | null = null;

  constructor(canvas: HTMLCanvasElement, options: TransitionsOptions = {}) {
    this.canvas = canvas;
    this.reduced = options.reduced ?? (() => false);
  }

  /** Lets go of the frame she left. */
  private release(): void {
    this.frozen.width = 0;
    this.frozen.height = 0;
  }

  /** A copy of the frame she's leaving, made once as she goes. */
  private freeze(): HTMLCanvasElement {
    const { frozen, canvas } = this;
    frozen.width = canvas.width;
    frozen.height = canvas.height;
    frozen.getContext('2d')?.drawImage(canvas, 0, 0);
    return frozen;
  }

  /**
   * Before a frame is drawn, where she is. Something that moves her outside the step (her broom,
   * the map) puts her in the new place before its moment plays, and a frame can be drawn between:
   * then the canvas still holding the place she left is kept for the passage the moment starts.
   */
  leaving(where: string): void {
    const went = this.where !== null && where !== this.where;
    this.where = where;
    if (!went || this.passage?.age === 0) return;
    this.freeze();
    this.left = { her: this.her, age: 0 };
  }

  /** The frame she left and where she stood on it: kept from before the move, or the canvas now. */
  private departure(): { frozen: HTMLCanvasElement; from: Point } {
    const left = this.left;
    this.left = null;
    if (left) return { frozen: this.frozen, from: left.her };
    return { frozen: this.freeze(), from: this.her };
  }

  /** Where the frame just drawn has her feet, in canvas pixels. */
  seen(her: Point): void {
    this.her = { x: Math.round(her.x), y: Math.round(her.y) };
  }

  /** She went through a door, a doorway or the mat: an iris on her. */
  entered(): void {
    // A flight just begun (`flew` comes just before its `entered`) carries on.
    if (this.passage?.age === 0) return;
    this.passage = { kind: 'iris', age: 0, ...this.departure() };
  }

  /** She flew by broom: her on it, swooping off the frame, then the iris. */
  flew(world: World): void {
    const { canvas } = this;
    const { frozen, from } = this.departure();
    if (this.reduced()) {
      this.passage = { kind: 'iris', age: 0, from, frozen };
      return;
    }
    const sprite = riderSprite(world);
    // Off toward whichever side of the frame has more room.
    const dir = from.x < canvas.width / 2 ? 1 : -1;
    this.passage = { kind: 'broom', age: 0, from, frozen, rider: { sprite, dir, trail: [] } };
  }

  /** A window of the day turned: a wash of its colour over the frame. */
  windowTurned(window: DayWindow): void {
    this.wash = { colour: WASH_COLOUR[window], age: 0 };
  }

  /** Everything moved on by one step of the simulation. */
  step(deltaMs: number): void {
    // A frame kept for a moment that never came (a place loaded, not walked to) is let go.
    if (this.left && (this.left.age += deltaMs) > LEFT_KEPT_MS) {
      this.left = null;
      if (!this.passage) this.release();
    }
    if (this.passage) {
      this.passage.age += deltaMs;
      if (this.passage.age >= passageMs(this.passage.kind)) {
        this.passage = null;
        if (!this.left) this.release();
      }
    }
    if (this.wash) {
      this.wash.age += deltaMs;
      if (this.wash.age >= WASH_MS) this.wash = null;
    }
  }

  /** What's under way, if anything: the passage first. */
  state(): TransitionState | null {
    if (this.passage) {
      const { kind, age } = this.passage;
      return { kind, progress: Math.min(1, age / passageMs(kind)) };
    }
    if (this.wash) return { kind: 'wash', progress: Math.min(1, this.wash.age / WASH_MS) };
    return null;
  }

  /** Draws whatever is under way over the frame just drawn; nothing at all when nothing is. */
  draw(ctx: CanvasRenderingContext2D): void {
    if (!this.passage && !this.wash) return;
    const { canvas } = ctx;
    ctx.imageSmoothingEnabled = false;
    if (this.wash) {
      ctx.globalAlpha = washAlpha(this.wash.age);
      ctx.fillStyle = this.wash.colour;
      ctx.fillRect(0, 0, canvas.width, canvas.height);
      ctx.globalAlpha = 1;
    }
    const p = this.passage;
    if (!p) return;
    const away = p.kind === 'broom' ? FLIGHT_MS : 0;
    const closing = p.age < away + IRIS_CLOSE_MS;
    // Before the iris opens, the frame she left is shown, still; stretched to the canvas if going
    // in or out has fitted it afresh (a room is fitted at its own scale).
    const kx = p.frozen.width > 0 ? canvas.width / p.frozen.width : 1;
    const ky = p.frozen.height > 0 ? canvas.height / p.frozen.height : 1;
    const from = { x: Math.round(p.from.x * kx), y: Math.round(p.from.y * ky) };
    if (closing) ctx.drawImage(p.frozen, 0, 0, canvas.width, canvas.height);
    if (p.rider && p.age < away) this.drawFlight(ctx, p.age, from, p.rider);
    else if (p.rider) drawPoof(ctx, from, 2);
    const centre = closing
      ? { x: from.x, y: from.y - HER_MIDDLE }
      : { x: this.her.x, y: this.her.y - HER_MIDDLE };
    const t = closing
      ? Math.max(0, (p.age - away) / IRIS_CLOSE_MS)
      : (p.age - away - IRIS_CLOSE_MS) / IRIS_OPEN_MS;
    if (this.reduced()) {
      // A fade through dark, nothing moving.
      ctx.globalAlpha = Math.min(1, Math.max(0, closing ? t : 1 - t));
      ctx.fillStyle = PALETTE.ink;
      ctx.fillRect(0, 0, canvas.width, canvas.height);
      ctx.globalAlpha = 1;
      return;
    }
    if (closing && p.age < away) return;
    const reach = farthest(centre, canvas.width, canvas.height);
    const r = closing ? reach * (1 - t * t) : reach * (1 - (1 - t) * (1 - t));
    drawIris(ctx, centre, r);
  }

  /** Her on her broom along her swoop, the poof where she stood, and a sparkle trail. */
  private drawFlight(
    ctx: CanvasRenderingContext2D,
    age: number,
    from: Point,
    rider: NonNullable<Passage['rider']>,
  ): void {
    const t = age / FLIGHT_MS;
    drawPoof(ctx, from, t < 0.12 ? 0 : 1);
    const at = swoopAt(t, from, rider.dir, ctx.canvas.width, rider.sprite.width);
    rider.trail.push(at);
    if (rider.trail.length > TRAIL) rider.trail.shift();
    ctx.fillStyle = PALETTE.candleBright;
    rider.trail.forEach((q, i) => {
      if (i % 2 === 1) return;
      ctx.globalAlpha = (i + 1) / rider.trail.length;
      ctx.fillRect(q.x - rider.dir * 20, q.y - 6, 2, 2);
    });
    ctx.globalAlpha = 1;
    const { sprite, dir } = rider;
    const x = at.x - Math.round(sprite.width / 2);
    const y = at.y - sprite.height;
    if (dir === 1) ctx.drawImage(sprite, x, y);
    else {
      ctx.save();
      ctx.scale(-1, 1);
      ctx.drawImage(sprite, -x - sprite.width, y);
      ctx.restore();
    }
  }
}

/** How long each passage takes from start to finish. */
export function passageMs(kind: 'iris' | 'broom'): number {
  return (kind === 'broom' ? FLIGHT_MS : 0) + IRIS_CLOSE_MS + IRIS_OPEN_MS;
}

/** How strong a window's wash is, `age` into it: up quickly, away slowly. */
export function washAlpha(age: number): number {
  if (age < 0 || age >= WASH_MS) return 0;
  if (age < WASH_UP_MS) return WASH_ALPHA * (age / WASH_UP_MS);
  return WASH_ALPHA * (1 - (age - WASH_UP_MS) / (WASH_MS - WASH_UP_MS));
}

/** How many of her last places the trail behind her broom remembers. */
const TRAIL = 10;

/**
 * Where she is on her swoop, `t` of the way through it (her feet, on a whole pixel): a hop up,
 * then away faster and faster, up and across till she's past the frame's edge.
 */
export function swoopAt(t: number, from: Point, dir: 1 | -1, width: number, size: number): Point {
  const u = Math.min(1, Math.max(0, t));
  const edge = dir === 1 ? width + size : -size;
  const across = (edge - from.x) * u * u;
  const rise = SWOOP_RISE * (1 - (1 - u) * (1 - u)) + 12 * Math.sin(Math.PI * Math.min(1, u * 3));
  return { x: Math.round(from.x + across), y: Math.round(from.y - rise) };
}

/** The farthest corner of the frame from `at`, so a circle that big covers it all. */
function farthest(at: Point, width: number, height: number): number {
  const dx = Math.max(at.x, width - at.x);
  const dy = Math.max(at.y, height - at.y);
  return Math.ceil(Math.hypot(dx, dy)) + 2;
}

/**
 * Each row's opening in an iris of radius `r` round `at`: the columns from `left` up to `right`
 * show the frame; the rest is dark. Whole pixels, so its edge is a staircase like the art's.
 */
export function irisRows(
  at: Point,
  r: number,
  width: number,
  height: number,
): { left: number; right: number }[] {
  const rows: { left: number; right: number }[] = [];
  for (let y = 0; y < height; y++) {
    const dy = y + 0.5 - at.y;
    const half = r * r - dy * dy;
    if (half <= 0) {
      rows.push({ left: 0, right: 0 });
      continue;
    }
    const w = Math.sqrt(half);
    const left = Math.max(0, Math.round(at.x - w));
    const right = Math.min(width, Math.round(at.x + w));
    rows.push(left < right ? { left, right } : { left: 0, right: 0 });
  }
  return rows;
}

function drawIris(ctx: CanvasRenderingContext2D, at: Point, r: number): void {
  const { width, height } = ctx.canvas;
  ctx.fillStyle = PALETTE.ink;
  irisRows(at, r, width, height).forEach(({ left, right }, y) => {
    if (right <= left) {
      ctx.fillRect(0, y, width, 1);
      return;
    }
    if (left > 0) ctx.fillRect(0, y, left, 1);
    if (right < width) ctx.fillRect(right, y, width - right, 1);
  });
}

/** The poof's foot is this far below hers, so it hides her shadow too. */
const POOF_BELOW = 6;

function drawPoof(ctx: CanvasRenderingContext2D, feet: Point, frame: number): void {
  const art = POOF_FRAMES[frame]!;
  const sprite = bake(`poof:${frame}`, art, POOF_PALETTE);
  ctx.drawImage(sprite, feet.x - sprite.width / 2, feet.y - sprite.height + POOF_BELOW);
}

/** Her sat on her broom, in its colours, flying right: made once a flight. */
function riderSprite(world: World): HTMLCanvasElement {
  const look = world.broom.look;
  const her = bakeDoll(world.wardrobe.look, 'right', 0, 'sit');
  const broom = bake(`broom:riding:${lookKey(look)}`, RIDING_BROOM, ridingBroomPalette(look));
  // Her hips on the broom's handle a little ahead of its bow, its bristles behind her.
  const hips = her.height - DOLL_HEIGHT + SIT_FROM + SIT_DROP;
  const herLeft = BROOM_SEAT.x - Math.round(her.width / 2) + 2;
  const herTop = BROOM_SEAT.y - hips;
  const left = Math.min(0, herLeft);
  const top = Math.min(0, herTop);
  const canvas = document.createElement('canvas');
  canvas.width = Math.max(broom.width, herLeft + her.width) - left;
  canvas.height = Math.max(broom.height, herTop + her.height) - top;
  const c = canvas.getContext('2d')!;
  c.imageSmoothingEnabled = false;
  c.drawImage(broom, -left, -top);
  c.drawImage(her, herLeft - left, herTop - top);
  return canvas;
}
