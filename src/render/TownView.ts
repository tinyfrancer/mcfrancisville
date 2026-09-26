import { TILE_SIZE } from '../config/world';
import { bake } from '../sprites/bake';
import { PALETTE } from '../sprites/palette';
import { ITEM_ART, PATCH_ART, SPROUTS, SPROUTS_PALETTE } from '../sprites/items';
import { PROP_ART } from '../sprites/props';
import { spriteSize, type Palette, type SpriteSource } from '../sprites/sprite';
import { daylight, hourOf, type Daylight } from '../systems/clock';
import { patchKey, propKey } from '../systems/gathering';
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

/** A lamp's pool of light, in world pixels. `strength` defaults to how lit the lamps are. */
interface WorldLight {
  x: number;
  y: number;
  radius: number;
  strength?: number;
}

/** She carries a little light of her own after dark, so she is never lost in it. */
const HER_LIGHT = { radius: 20, strength: 0.45 };
/** The night's snack sits in a small pool of light of its own, so it can be spotted from afar. */
const SNACK_LIGHT = { radius: 18, strength: 0.9 };
/** Moonpetals glow a little, once the moon is out. */
const MOONPETAL_LIGHT = { radius: 10, strength: 0.5 };

/** Anything in town that gives something once a day, and how it looks before and after. */
interface Giver {
  key: string;
  drawable: Drawable;
  ready: HTMLCanvasElement;
  spent: HTMLCanvasElement;
  /** Its bloom's own glow and light, for a patch that glows at night. */
  readyGlow?: HTMLCanvasElement;
  light?: WorldLight;
}

/** Bakes the keys of a palette that light up, with every other key left clear. */
function glowOf(key: string, source: SpriteSource, palette: Palette, lit: Palette) {
  const unlit = Object.fromEntries(Object.keys(palette).map((k) => [k, null]));
  return bake(key, source, { ...unlit, ...lit });
}

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
  private readonly givers: Giver[] = [];
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
      if (art.glow) drawable.glow = glowOf(`glow:${prop.id}`, art.source, art.palette, art.glow);
      if (art.spent) {
        const spent = bake(`prop:${prop.id}:spent`, art.spent, art.palette);
        this.givers.push({ key: propKey(prop), drawable, ready: sprite, spent });
      } else {
        this.props.push(drawable);
      }
      for (const l of art.lights ?? []) {
        this.lights.push({ x: x + l.x, y: y + l.y, radius: l.radius });
      }
    }
    const sprouts = bake('patch:sprouts', SPROUTS, SPROUTS_PALETTE);
    for (const patch of town.map.patches) {
      const art = PATCH_ART[patch.id];
      const ready = bake(`patch:${patch.id}`, art.source, art.palette);
      const x = patch.tx * TILE_SIZE;
      const y = patch.ty * TILE_SIZE;
      // Flat on the ground: anything standing on or below the tile covers it.
      const drawable: Drawable = { footY: y + 1, sprite: ready, x, y };
      const giver: Giver = { key: patchKey(patch), drawable, ready, spent: sprouts };
      if (art.glows) {
        giver.readyGlow = glowOf(`glow:patch:${patch.id}`, art.source, art.palette, {
          f: art.palette.f ?? null,
        });
        giver.light = { x: x + 8, y: y + 8, radius: MOONPETAL_LIGHT.radius };
      }
      this.givers.push(giver);
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

    const drawables = [
      ...this.props,
      ...this.giverDrawables(),
      ...this.snackDrawables(nowMs),
      this.playerDrawable(),
    ].filter((d) => this.onScreen(d));
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

    const light = this.daylight();
    this.drawLight(light, drawables, this.nightLights());
    this.drawSnackTwinkle(nowMs);
  }

  /** Each tree, rock and patch as it is today: ready to give, or resting until tomorrow. */
  private giverDrawables(): Drawable[] {
    return this.givers.map((g) => {
      const ready = this.town.isReady(g.key);
      const d = { ...g.drawable, sprite: ready ? g.ready : g.spent };
      if (ready && g.readyGlow) d.glow = g.readyGlow;
      return d;
    });
  }

  /** The night's snack, bobbing gently where it waits, lit so it can't be missed. */
  private snackDrawables(nowMs: number): Drawable[] {
    const snack = this.town.snack();
    if (!snack) return [];
    const art = ITEM_ART[snack.item];
    const sprite = bake(`item:${snack.item}`, art.source, art.palette);
    const bob = Math.round(Math.sin(nowMs / 400));
    const x = snack.tx * TILE_SIZE;
    const y = snack.ty * TILE_SIZE - 3 + bob;
    return [{ footY: snack.ty * TILE_SIZE + 9, sprite, x, y, glow: sprite }];
  }

  /** Lights that come and go: the snack's, and each moonpetal patch in bloom. */
  private nightLights(): WorldLight[] {
    const lights: WorldLight[] = [];
    const snack = this.town.snack();
    if (snack) {
      const { x, y } = tileCentre(snack);
      lights.push({ x, y: y - 4, radius: SNACK_LIGHT.radius, strength: SNACK_LIGHT.strength });
    }
    for (const g of this.givers) {
      if (g.light && this.town.isReady(g.key)) {
        lights.push({ ...g.light, strength: MOONPETAL_LIGHT.strength });
      }
    }
    return lights;
  }

  /** A little star that winks above the snack, so it reads as a treat from across the square. */
  private drawSnackTwinkle(nowMs: number): void {
    const snack = this.town.snack();
    if (!snack || Math.floor(nowMs / 350) % 3 === 0) return;
    const x = snack.tx * TILE_SIZE + 13 - this.camera.x;
    const y = snack.ty * TILE_SIZE - 3 - this.camera.y;
    this.ctx.fillStyle = PALETTE.candleBright;
    this.ctx.fillRect(x - 1, y, 3, 1);
    this.ctx.fillRect(x, y - 1, 1, 3);
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
  private drawLight(
    light: Daylight,
    drawables: readonly Drawable[],
    extra: readonly WorldLight[],
  ): void {
    const { ctx } = this;
    const cam = this.camera;
    const p = this.town.player;
    const lights: ScreenLight[] = [...this.lights, ...extra].map((l) => ({
      x: l.x - cam.x,
      y: l.y - cam.y,
      radius: l.radius,
      strength: (l.strength ?? 1) * light.lamps,
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
