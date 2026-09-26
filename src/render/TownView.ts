import { TILE_SIZE } from '../config/world';
import { bake } from '../sprites/bake';
import { PALETTE } from '../sprites/palette';
import { PROP_ART } from '../sprites/props';
import { spriteSize } from '../sprites/sprite';
import { daylight, hourOf, type Daylight } from '../systems/clock';
import { tileCentre, tileOf, type Town } from '../world/Town';
import { bakeDoll } from './doll';
import { cameraOrigin, screenToWorld, worldToScreen, type Point } from './camera';
import { fillPixelEllipse, renderGround, SHADOW_ALPHA } from './ground';
import { Lighting, type ScreenLight } from './lighting';

/** How long each walk frame shows. Two frames a step, about two steps a tile. */
const WALK_FRAME_MS = 140;

/** Her feet sit this far below the centre of her tile, so she stands *on* it rather than astride. */
const FEET_BELOW_CENTRE = 7;

/** Anything stood on the ground, drawn in order of its feet so nearer things cover farther ones. */
interface Drawable {
  footY: number;
  sprite: HTMLCanvasElement;
  /** World pixels, top-left. */
  x: number;
  y: number;
  /** What of it shines after dusk: its lit keys alone, over the night (see `drawLight`). */
  glow?: HTMLCanvasElement;
  /** Her own shadow moves with her; a prop's is part of the ground. */
  shadow?: { cx: number; cy: number; w: number; h: number };
}

/** A lamp's pool of light, in world pixels. */
interface WorldLight {
  x: number;
  y: number;
  radius: number;
}

/** She carries a little light of her own after dark, so she is never lost in it. */
const HER_LIGHT = { radius: 20, strength: 0.45 };

export interface TownViewOptions {
  /** Draws the town in the light of this hour instead of the clock's (`?hour=`, for reviewing art). */
  hour?: number | null;
}

/**
 * Draws a `Town`. It reads the town every frame and writes to it only through `tapTile`
 * (decisions.md 9).
 */
export class TownView {
  private readonly town: Town;
  private readonly canvas: HTMLCanvasElement;
  private readonly ctx: CanvasRenderingContext2D;
  private readonly ground: HTMLCanvasElement;
  private readonly props: Drawable[] = [];
  private readonly lights: WorldLight[] = [];
  private readonly lighting = new Lighting();
  /** The lit parts of the frame, drawn over the night once they've been covered by what's in front. */
  private readonly glowLayer = document.createElement('canvas');
  private readonly hour: number | null;
  private camera: Point = { x: 0, y: 0 };

  constructor(town: Town, canvas: HTMLCanvasElement, options: TownViewOptions = {}) {
    this.town = town;
    this.canvas = canvas;
    this.hour = options.hour ?? null;
    const ctx = canvas.getContext('2d');
    if (!ctx) throw new Error('no 2d context');
    this.ctx = ctx;
    this.ground = renderGround(town.map);
    for (const prop of town.map.props) {
      const art = PROP_ART[prop.id];
      const sprite = bake(`prop:${prop.id}`, art.source, art.palette);
      const { width, height } = spriteSize(art.source);
      const footY = (prop.ty + prop.h) * TILE_SIZE;
      const x = prop.tx * TILE_SIZE + (prop.w * TILE_SIZE - width) / 2;
      const y = footY - height;
      const drawable: Drawable = { footY, sprite, x, y };
      if (art.glow) {
        const unlit = Object.fromEntries(Object.keys(art.palette).map((k) => [k, null]));
        drawable.glow = bake(`glow:${prop.id}`, art.source, { ...unlit, ...art.glow });
      }
      this.props.push(drawable);
      for (const l of art.lights ?? []) {
        this.lights.push({ x: x + l.x, y: y + l.y, radius: l.radius });
      }
    }
  }

  /** The light the town is in now: the clock's hour, unless the page asked for another. */
  daylight(): Daylight {
    return daylight(this.hour ?? hourOf(this.town.clock.now()));
  }

  get mapSize() {
    return { width: this.town.map.width * TILE_SIZE, height: this.town.map.height * TILE_SIZE };
  }

  cameraOrigin(): Point {
    return { ...this.camera };
  }

  /** A tap on the page, in client pixels. */
  tap(clientX: number, clientY: number): void {
    const world = screenToWorld(
      clientX,
      clientY,
      this.canvas.getBoundingClientRect(),
      this.canvas,
      this.camera,
    );
    const { tx, ty } = tileOf(world.x, world.y);
    this.town.tapTile(tx, ty);
  }

  /** Where on the page the middle of a tile is drawn, for the smoke check to tap it for real. */
  tileToClient(tx: number, ty: number): Point {
    return worldToScreen(
      tileCentre({ tx, ty }),
      this.canvas.getBoundingClientRect(),
      this.canvas,
      this.camera,
    );
  }

  draw(nowMs: number): void {
    const { ctx, canvas } = this;
    const player = this.town.player;
    this.camera = cameraOrigin(player, canvas, this.mapSize);
    const cam = this.camera;

    ctx.imageSmoothingEnabled = false;
    ctx.fillStyle = PALETTE.hedgeDark;
    ctx.fillRect(0, 0, canvas.width, canvas.height);
    ctx.drawImage(this.ground, -cam.x, -cam.y);

    this.drawTarget(nowMs);

    const drawables = [...this.props, this.playerDrawable()].filter((d) => this.onScreen(d));
    drawables.sort((a, b) => a.footY - b.footY);
    for (const d of drawables) {
      if (d.shadow) {
        ctx.globalAlpha = SHADOW_ALPHA;
        ctx.fillStyle = PALETTE.ink;
        const { cx, cy, w, h } = d.shadow;
        fillPixelEllipse(ctx, cx - cam.x, cy - cam.y, w, h);
        ctx.globalAlpha = 1;
      }
      ctx.drawImage(d.sprite, d.x - cam.x, d.y - cam.y);
    }

    this.drawLight(this.daylight(), drawables);
  }

  private onScreen(d: Drawable): boolean {
    const cam = this.camera;
    return (
      d.x + d.sprite.width > cam.x &&
      d.y + d.sprite.height > cam.y &&
      d.x < cam.x + this.canvas.width &&
      d.y < cam.y + this.canvas.height
    );
  }

  /**
   * The time of day over everything, then whatever is lit drawn back on top of it, so a window
   * glows however dark the night. The lit parts go through a layer of their own in the same order
   * as the frame, each sprite rubbing out the glow behind it, so a window never shines through her
   * when she stands in front of the house.
   */
  private drawLight(light: Daylight, drawables: readonly Drawable[]): void {
    const { ctx } = this;
    const cam = this.camera;
    const p = this.town.player;
    const lights: ScreenLight[] = this.lights.map((l) => ({
      x: l.x - cam.x,
      y: l.y - cam.y,
      radius: l.radius,
      strength: light.lamps,
    }));
    lights.push({
      x: Math.round(p.x) - cam.x,
      y: Math.round(p.y) - cam.y - 6,
      radius: HER_LIGHT.radius,
      strength: HER_LIGHT.strength * light.lamps,
    });
    this.lighting.apply(ctx, light, lights);
    if (light.lamps <= 0 || !drawables.some((d) => d.glow)) return;

    const layer = this.glowLayer;
    if (layer.width !== this.canvas.width || layer.height !== this.canvas.height) {
      layer.width = this.canvas.width;
      layer.height = this.canvas.height;
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

  private playerDrawable(): Drawable {
    const p = this.town.player;
    const index = p.moving ? 1 + (Math.floor(p.walkMs / WALK_FRAME_MS) % 2) : 0;
    const sprite = bakeDoll(this.town.wardrobe.look, p.facing, index);
    const footY = Math.round(p.y) + FEET_BELOW_CENTRE;
    const x = Math.round(p.x);
    return {
      footY,
      sprite,
      x: x - sprite.width / 2,
      y: footY - sprite.height,
      shadow: { cx: x, cy: footY - 1, w: 12, h: 4 },
    };
  }

  /** A little candle-coloured sparkle where she is headed, breathing so it reads as alive. */
  private drawTarget(nowMs: number): void {
    const target = this.town.target;
    if (!target) return;
    const { x, y } = tileCentre(target);
    const r = 2 + Math.round((Math.sin(nowMs / 160) + 1) * 1.5);
    const cx = Math.round(x) - this.camera.x;
    const cy = Math.round(y) - this.camera.y;
    this.ctx.fillStyle = PALETTE.candle;
    this.ctx.fillRect(cx - r, cy, r * 2 + 1, 1);
    this.ctx.fillRect(cx, cy - r, 1, r * 2 + 1);
    this.ctx.fillStyle = PALETTE.candleBright;
    this.ctx.fillRect(cx, cy, 1, 1);
  }
}
