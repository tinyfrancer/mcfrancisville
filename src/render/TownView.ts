import { TILE_SIZE } from '../config/world';
import { bake } from '../sprites/bake';
import { PALETTE } from '../sprites/palette';
import {
  CROP_ART,
  HOSTA_LEAVES,
  SEEDED,
  SOIL,
  SPROUT,
  TILLED_PALETTE,
  WATERED_PALETTE,
} from '../sprites/garden';
import { ITEM_ART, PATCH_ART, SPROUTS, SPROUTS_PALETTE } from '../sprites/items';
import { MAILBOX_FULL, PROP_ART } from '../sprites/props';
import { spriteSize } from '../sprites/sprite';
import { daylight, hourOf, type Daylight } from '../systems/clock';
import { plantingIsRare, stageOf, wateredToday, type Planting } from '../systems/farming';
import { patchKey, propKey } from '../systems/gathering';
import type { Tile } from '../systems/pathfinding';
import { bedKey } from '../world/Farm';
import { tileCentre, tileOf, type Town } from '../world/Town';
import { cameraOrigin, screenToWorld, worldToScreen, type Point } from './camera';
import { fillPixelEllipse, renderGround, tileHash } from './ground';
import { bakeFigure, maudeGlow } from './villagers';
import { critterDrawable, critterLight, drawNet } from './critters';
import { boneDrawable, drawPetBubbles, petDrawable } from './pets';
import { Lighting } from './lighting';
import {
  drawDrawables,
  drawLight,
  drawTarget,
  glowOf,
  onScreen,
  playerDrawable,
  type Drawable,
  type SceneView,
  type WorldLight,
} from './scene';

/** The night's snack sits in a small pool of light of its own, so it can be spotted from afar. */
const SNACK_LIGHT = { radius: 18, strength: 0.9 };
/** Moonpetals glow a little, once the moon is out, and so do moonflowers in bloom. */
const MOONPETAL_LIGHT = { radius: 10, strength: 0.5 };

/** How long each of a neighbour's walk frames shows: a slower step than hers. */
const AMBLE_FRAME_MS = 180;

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

export interface TownViewOptions {
  /** Draws the town in the light of this hour instead of the clock's (`?hour=`, for reviewing art). */
  hour?: number | null;
}

/**
 * Draws a `Town`. It reads the town every frame and writes to it only through `tapTile`
 * (decisions.md 9).
 */
export class TownView implements SceneView {
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
  /** The pop-up shop, baked once and drawn wherever it stands today. */
  private readonly popUpSprite: HTMLCanvasElement;
  private readonly popUpGlow: HTMLCanvasElement | undefined;
  /** Her mailbox, and how it looks with its flag up for a letter. */
  private mailbox: { drawable: Drawable; full: HTMLCanvasElement } | null = null;

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
      const v = art.variants ? tileHash(prop.tx, prop.ty) % art.variants.length : 0;
      const palette = art.variants?.[v] ?? art.palette;
      const sprite = bake(`prop:${prop.id}:${v}`, art.source, palette);
      const { width, height } = spriteSize(art.source);
      const footY = (prop.ty + prop.h) * TILE_SIZE;
      const x = prop.tx * TILE_SIZE + (prop.w * TILE_SIZE - width) / 2;
      const y = footY - height;
      const drawable: Drawable = { footY, sprite, x, y };
      if (art.glow) drawable.glow = glowOf(`glow:${prop.id}`, art.source, art.palette, art.glow);
      if (prop.id === 'mailbox') {
        this.mailbox = { drawable, full: bake('prop:mailbox:full', MAILBOX_FULL, palette) };
      } else if (art.spent) {
        const spent = bake(`prop:${prop.id}:spent`, art.spent, palette);
        this.givers.push({ key: propKey(prop), drawable, ready: sprite, spent });
      } else {
        this.props.push(drawable);
      }
      for (const l of art.lights ?? []) {
        this.lights.push({ x: x + l.x, y: y + l.y, radius: l.radius });
      }
    }
    const popUp = PROP_ART.popUpShop;
    this.popUpSprite = bake('prop:popUpShop:0', popUp.source, popUp.palette);
    if (popUp.glow) {
      this.popUpGlow = glowOf('glow:popUpShop', popUp.source, popUp.palette, popUp.glow);
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

    drawTarget(ctx, this.town, cam, nowMs);

    const drawables = [
      ...this.props,
      ...this.giverDrawables(),
      ...this.bedDrawables(),
      ...this.snackDrawables(nowMs),
      ...this.popUpDrawables(),
      ...this.mailboxDrawables(),
      ...this.cartDrawables(),
      ...this.neighbourDrawables(nowMs),
      ...this.wesDrawables(),
      ...this.town.collecting.critters().map((c) => critterDrawable(c, nowMs)),
      ...this.town.petsHere().map((p) => petDrawable(p, this.town, nowMs)),
      ...this.boneDrawables(),
      playerDrawable(this.town, nowMs),
    ].filter((d) => onScreen(d, cam, canvas));
    drawables.sort((a, b) => a.footY - b.footY);
    drawDrawables(ctx, drawables, cam);
    this.drawPuff(nowMs);
    drawNet(ctx, this.town, cam);

    const lights = [...this.lights, ...this.nightLights(nowMs)];
    const light = this.daylight();
    drawLight(ctx, this.lighting, this.glowLayer, this.town, cam, light, drawables, lights);
    this.drawSnackTwinkle(nowMs);
    drawPetBubbles(ctx, this.town.petsHere(), this.town, cam, nowMs);
  }

  /** Fibi's bone, if she has left it somewhere in town today. */
  private boneDrawables(): Drawable[] {
    const bone = this.town.lostBone();
    return bone?.scene === 'town' ? [boneDrawable(bone.tx, bone.ty)] : [];
  }

  /** Each tree, rock and patch as it is today: ready to give, or resting until tomorrow. */
  private giverDrawables(): Drawable[] {
    return this.givers.map((g) => {
      const ready = this.town.takings.isReady(g.key);
      const d = { ...g.drawable, sprite: ready ? g.ready : g.spent };
      if (ready && g.readyGlow) d.glow = g.readyGlow;
      return d;
    });
  }

  /** Her garden: tilled soil, darker where she's watered today, and whatever is growing in it. */
  private bedDrawables(): Drawable[] {
    const farm = this.town.farm;
    const now = this.town.clock.now();
    const drawables: Drawable[] = [];
    for (const bed of this.town.map.beds) {
      if (!farm.isTilled(bed)) continue;
      const planting = farm.planting(bed);
      const wet = planting !== null && wateredToday(planting, now);
      const soil = wet
        ? bake('soil:watered', SOIL, WATERED_PALETTE)
        : bake('soil:tilled', SOIL, TILLED_PALETTE);
      const x = bed.tx * TILE_SIZE;
      const y = bed.ty * TILE_SIZE;
      drawables.push({ footY: y + 1, sprite: soil, x, y });
      if (planting) drawables.push(this.cropDrawable(bed, planting, now));
    }
    return drawables;
  }

  private cropDrawable(bed: Tile, planting: Planting, now: number): Drawable {
    const { crop } = planting;
    const art = CROP_ART[crop];
    const stage = stageOf(planting, now);
    // A hosta comes up in one of its three leaf colours, and a rose that will pick blue is blue.
    const leaves = crop === 'hosta' ? tileHash(bed.tx, bed.ty) % HOSTA_LEAVES.length : 0;
    const greens = crop === 'hosta' ? HOSTA_LEAVES[leaves]! : art.greens;
    const rare = stage === 'ripe' && plantingIsRare(bedKey(bed), planting);
    let key = `crop:${crop}:${stage}:${leaves}`;
    let sprite: HTMLCanvasElement;
    let glow: HTMLCanvasElement | undefined;
    if (stage === 'seed') sprite = bake('crop:seed', SEEDED, greens);
    else if (stage === 'sprout') sprite = bake(`crop:sprout:${leaves}`, SPROUT, greens);
    else if (stage === 'growing') sprite = bake(key, art.growing, greens);
    else {
      const palette =
        crop === 'hosta' ? greens : rare && art.rarePalette ? art.rarePalette : art.ripePalette;
      key += rare ? ':rare' : '';
      sprite = bake(key, art.ripe, palette);
      if (art.glow) glow = glowOf(`glow:${key}`, art.ripe, palette, art.glow);
    }
    const footY = (bed.ty + 1) * TILE_SIZE;
    const d: Drawable = { footY, sprite, x: bed.tx * TILE_SIZE, y: footY - sprite.height };
    if (glow) d.glow = glow;
    return d;
  }

  /**
   * The pop-up shop, where it stands today. It moves, so unlike the other buildings its shadow is
   * drawn with it rather than baked into the ground.
   */
  private popUpDrawables(): Drawable[] {
    const lot = this.town.stalls.popUp();
    if (!lot) return [];
    const art = PROP_ART.popUpShop;
    const sprite = this.popUpSprite;
    const footY = (lot.ty + lot.h) * TILE_SIZE;
    const x = lot.tx * TILE_SIZE + (lot.w * TILE_SIZE - sprite.width) / 2;
    const d: Drawable = {
      footY,
      sprite,
      x,
      y: footY - sprite.height,
      shadow: { cx: x + sprite.width / 2, cy: footY - 2, w: art.shadow.w, h: art.shadow.h },
    };
    if (this.popUpGlow) d.glow = this.popUpGlow;
    return [d];
  }

  /** Her mailbox, its flag up while a letter waits in it. */
  private mailboxDrawables(): Drawable[] {
    if (!this.mailbox) return [];
    const { drawable, full } = this.mailbox;
    return [this.town.letters.unread > 0 ? { ...drawable, sprite: full } : drawable];
  }

  /**
   * The Moon Pie Man and his cart, where they are today. He stands behind the counter, which hides
   * him from the waist down.
   */
  private cartDrawables(): Drawable[] {
    const cart = this.town.stalls.moonPieCart();
    if (!cart) return [];
    const art = PROP_ART.moonPieCart;
    const sprite = bake('prop:moonPieCart:0', art.source, art.palette);
    const footY = (cart.ty + cart.h) * TILE_SIZE;
    const x = cart.tx * TILE_SIZE;
    const man = bakeFigure('moonPieMan', 'down', 0);
    return [
      { footY: footY - 1, sprite: man, x: x + 3, y: footY - 1 - man.height },
      {
        footY,
        sprite,
        x,
        y: footY - sprite.height,
        shadow: { cx: x + sprite.width / 2, cy: footY - 2, w: art.shadow.w, h: art.shadow.h },
      },
    ];
  }

  /**
   * Her neighbours, where they are and mid-step, with their shadows. Maude floats, bobbing, and
   * glows a little after dark.
   */
  private neighbourDrawables(nowMs: number): Drawable[] {
    return this.town.neighbours.map((n) => {
      const frame = n.moving ? 1 + (Math.floor(n.walkMs / AMBLE_FRAME_MS) % 2) : 0;
      const sprite = bakeFigure(n.id, n.facing, frame);
      const footY = Math.round(n.y) + 7;
      const x = Math.round(n.x);
      const ghost = n.id === 'maude';
      const lift = ghost ? 3 + Math.round(Math.sin(nowMs / 450)) : 0;
      const d: Drawable = {
        footY,
        sprite,
        x: x - sprite.width / 2,
        y: footY - sprite.height - lift,
        shadow: { cx: x, cy: footY - 1, w: ghost ? 8 : 12, h: ghost ? 3 : 4 },
      };
      if (ghost) d.glow = maudeGlow(n.facing);
      return d;
    });
  }

  /**
   * Wes, when he's lurking: half behind a tree, peering out the side he's on. The tree is drawn
   * over him, so only the half of him that's very bad at hiding shows.
   */
  private wesDrawables(): Drawable[] {
    const wes = this.town.mystery.wes();
    if (!wes) return [];
    const sprite = bakeFigure('wes', wes.side, 0);
    const lean = wes.side === 'right' ? -6 : 6;
    const { x } = tileCentre(wes);
    const footY = wes.ty * TILE_SIZE + 14;
    return [{ footY, sprite, x: x - sprite.width / 2 + lean, y: footY - sprite.height }];
  }

  /**
   * Cody's puff, when he lets one go: a little lavender cloud that drifts up beside him and
   * thins out. Never gross; he doesn't even notice.
   */
  private drawPuff(nowMs: number): void {
    if (!this.town.puffing()) return;
    const cody = this.town.neighbours.find((n) => n.id === 'cody');
    if (!cody) return;
    const rise = Math.floor(nowMs / 200) % 4;
    const x = Math.round(cody.x) - 9 - this.camera.x;
    const y = Math.round(cody.y) - 2 - rise - this.camera.y;
    const ctx = this.ctx;
    ctx.globalAlpha = 0.75;
    ctx.fillStyle = PALETTE.skinMinty;
    fillPixelEllipse(ctx, x, y, 5, 3);
    fillPixelEllipse(ctx, x - 3, y - 2, 4, 3);
    ctx.fillStyle = PALETTE.lavender;
    fillPixelEllipse(ctx, x - 1, y - 5 + (rise & 1), 3, 3);
    ctx.globalAlpha = 1;
  }

  /** The night's snack, bobbing gently where it waits, lit so it can't be missed. */
  private snackDrawables(nowMs: number): Drawable[] {
    const snack = this.town.gathering.snack();
    if (!snack) return [];
    const art = ITEM_ART[snack.item];
    const sprite = bake(`item:${snack.item}`, art.source, art.palette);
    const bob = Math.round(Math.sin(nowMs / 400));
    const x = snack.tx * TILE_SIZE;
    const y = snack.ty * TILE_SIZE - 3 + bob;
    return [{ footY: snack.ty * TILE_SIZE + 9, sprite, x, y, glow: sprite }];
  }

  /**
   * Lights that come and go: the snack's, the pop-up's, each moonpetal patch in bloom, and every
   * critter that glows.
   */
  private nightLights(nowMs: number): WorldLight[] {
    const lights: WorldLight[] = [];
    for (const c of this.town.collecting.critters()) {
      const light = critterLight(c, nowMs);
      if (light) lights.push(light);
    }
    const popUp = this.town.stalls.popUp();
    if (popUp) {
      const height = this.popUpSprite.height;
      const top = (popUp.ty + popUp.h) * TILE_SIZE - height;
      for (const l of PROP_ART.popUpShop.lights ?? []) {
        lights.push({ x: popUp.tx * TILE_SIZE + l.x, y: top + l.y, radius: l.radius });
      }
    }
    const snack = this.town.gathering.snack();
    if (snack) {
      const { x, y } = tileCentre(snack);
      lights.push({ x, y: y - 4, radius: SNACK_LIGHT.radius, strength: SNACK_LIGHT.strength });
    }
    for (const g of this.givers) {
      if (g.light && this.town.takings.isReady(g.key)) {
        lights.push({ ...g.light, strength: MOONPETAL_LIGHT.strength });
      }
    }
    const now = this.town.clock.now();
    for (const bed of this.town.map.beds) {
      const planting = this.town.farm.planting(bed);
      if (!planting || !CROP_ART[planting.crop].glow || stageOf(planting, now) !== 'ripe') continue;
      const { x, y } = tileCentre(bed);
      lights.push({ x, y: y - 8, radius: MOONPETAL_LIGHT.radius + 4, strength: 0.6 });
    }
    return lights;
  }

  /** A little star that winks above the snack, so it reads as a treat from across the square. */
  private drawSnackTwinkle(nowMs: number): void {
    const snack = this.town.gathering.snack();
    if (!snack || Math.floor(nowMs / 350) % 3 === 0) return;
    const x = snack.tx * TILE_SIZE + 13 - this.camera.x;
    const y = snack.ty * TILE_SIZE - 3 - this.camera.y;
    this.ctx.fillStyle = PALETTE.candleBright;
    this.ctx.fillRect(x - 1, y, 3, 1);
    this.ctx.fillRect(x, y - 1, 1, 3);
  }
}
