import { isFish } from '../data/critters';
import { TILE_SIZE } from '../config/world';
import { PALETTE } from '../sprites/palette';
import { CROP_ART } from '../sprites/garden';
import { bedDrawables, drawBedLook, drawRipeSparkles, drawSprinklerSpray } from './garden';
import { ITEM_ART } from '../sprites/items';
import {
  CANDY_TREE,
  CANDY_TREE_PALETTE,
  PATCH_ART,
  SHOOTS,
  SHOOTS_PALETTE,
} from '../sprites/nature';
import { HONESTY_STALL, HONESTY_STALL_PALETTE } from '../sprites/clutter';
import { POT_ART } from '../sprites/houses';
import { lookOf, MAILBOX_FULL, PROP_ART } from '../sprites/props';
import { dayKey, daylight, hourOf, underFullMoon, type Daylight } from '../systems/clock';
import { isMoonlit } from '../systems/critters';
import { stageOf } from '../systems/farming';
import { patchKey, propKey } from '../systems/gathering';
import type { PlacedProp } from '../systems/grid';
import type { PropId, TileId } from '../types/ids';
import { gateOf } from '../systems/zones';
import { GATE_OPEN, GATE_PALETTE, GATE_SHUT } from '../sprites/wilds';
import { butterflyDrawables, fluttersOf, type Flutter } from './butterflies';
import { tileCentre, tileOf, type World } from '../world/World';
import type { MapZone } from '../world/zones/MapZone';
import { FollowCamera, screenToWorld, worldToScreen, type Point } from './camera';
import { Ground } from './ground';
import {
  bakeFigure,
  drawLostGlint,
  drawNeighbourBubbles,
  drawPuffs,
  drawSpellSparkles,
  neighbourDrawables,
} from './villagers';
import { critterDrawable, critterLight, drawNet } from './critters';
import { drawBite, drawFishRings, drawLine } from './fishing';
import { boneDrawable, drawPetBubbles, petDrawable } from './pets';
import { Lighting } from './lighting';
import { bakeIcon } from './items';
import { drawSnow, drawWeatherAir, drawWeatherGround, WEATHER_LOOK } from './weather';
import {
  doorDrawables,
  eaveDrawables,
  drawFireworks,
  drawBanner,
  drawGarlandLights,
  drawGarlands,
  eggDrawables,
  type DrawnDoor,
} from './holidays';
import {
  SKELLY_CHRISTMAS,
  SKELLY_CHRISTMAS_GLOW,
  SKELLY_CHRISTMAS_PALETTE,
} from '../sprites/holidays';
import { chimneysOf, drawShimmer, drawSmoke, drawTufts, lifeOf, type Life } from './life';
import type { Weather } from '../data/weather';
import { CLUTTER } from '../data/clutter';
import { bake } from '../sprites/bake';
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
const SNACK_LIGHT = { radius: 36, strength: 0.9 };
/** Moonpetals glow a little, once the moon is out, and so do moonflowers in bloom. */
const MOONPETAL_LIGHT = { radius: 20, strength: 0.5 };

/** How long the candy tree shakes for, once she shakes it. */
const SHAKE_MS = 600;

/** Anything outdoors that gives something once a window, and how it looks before and after. */
interface Giver {
  key: string;
  drawable: Drawable;
  ready: HTMLCanvasElement;
  spent: HTMLCanvasElement;
  /** Its bloom's own glow and light, for a patch that glows at night. */
  readyGlow?: HTMLCanvasElement;
  light?: WorldLight;
}

export interface OutdoorViewOptions {
  /** Draws the place in the light of this hour instead of the clock's (`?hour=`, for reviewing art). */
  hour?: number | null;
  /** Draws the place in this weather instead of the day's (`?weather=`, for reviewing art). */
  weather?: Weather | null;
}

/**
 * Draws the `World` in one of its places outdoors: the town, Whisperwood, Lantern Shore. It reads
 * it every frame and writes to it only through `tapTile` (decisions.md 9).
 */
export class OutdoorView implements SceneView {
  private readonly world: World;
  private readonly zone: MapZone;
  /** Whether this is the town, where the farm, the stalls, the snack and the critters are. */
  private readonly town: boolean;
  private readonly canvas: HTMLCanvasElement;
  private readonly ctx: CanvasRenderingContext2D;
  private readonly ground: Ground;
  /** What moves over the ground: glints on the water, long grass, chimney smoke. */
  private readonly life: Life;
  /** The tiles with the pond frozen over, and the life over them, worked out the first winter's day seen. */
  private iced: { tiles: TileId[]; life: Life } | null = null;
  /** Whether the ground is baked with the pond frozen, as it was last drawn. */
  private frozenShown = false;
  private readonly props: Drawable[] = [];
  private readonly givers: Giver[] = [];
  private readonly lights: WorldLight[] = [];
  private readonly lighting = new Lighting();
  /** The lit parts of the frame, drawn over the night once they've been covered by what's in front. */
  private readonly glowLayer = document.createElement('canvas');
  private readonly hour: number | null;
  private readonly weatherShown: Weather | null;
  private camera: Point = { x: 0, y: 0 };
  private readonly follower = new FollowCamera();
  /** The life of the place with the chimneys on its lots, for the lots as they stood last. */
  private lotLife: { lots: readonly PlacedProp[]; life: Life } | null = null;
  /** The pop-up shop, baked once and drawn wherever it stands today. */
  private readonly popUpSprite: HTMLCanvasElement;
  private readonly popUpGlow: HTMLCanvasElement | undefined;
  /** Her mailbox, and how it looks with its flag up for a letter. */
  private mailbox: { drawable: Drawable; full: HTMLCanvasElement } | null = null;
  /** The pots by her door, drawn with whatever she has planted in them. */
  private readonly pots: Drawable[] = [];
  /** The candy tree, drawn as full as it is, and the honesty stall, stocked or not (phase O). */
  private readonly candyTrees: Drawable[] = [];
  private readonly stalls: Drawable[] = [];
  /** The floating lanterns, bobbing on the water. */
  private readonly bobbing: Drawable[] = [];
  /** The monarchs fluttering about, where the place has any. */
  private readonly flutters: Flutter[];
  /** Mounds where something is buried, and how each looks once it's dug up. */
  private readonly mounds: { prop: PlacedProp; drawable: Drawable; dug: HTMLCanvasElement }[] = [];
  /** Every building's front door, for what hangs on it for a holiday (phase U). */
  private readonly doors: DrawnDoor[] = [];
  /** Skelly, drawn in a holiday's get-up while its decorations are up. */
  private readonly skellies: Drawable[] = [];

  constructor(
    world: World,
    zone: MapZone,
    canvas: HTMLCanvasElement,
    options: OutdoorViewOptions = {},
  ) {
    this.world = world;
    this.zone = zone;
    this.town = zone.id === 'town';
    this.canvas = canvas;
    this.hour = options.hour ?? null;
    this.weatherShown = options.weather ?? null;
    const ctx = canvas.getContext('2d');
    if (!ctx) throw new Error('no 2d context');
    this.ctx = ctx;
    this.flutters = fluttersOf(zone.map, zone.map.butterflies);
    this.ground = new Ground(zone.map, CLUTTER[zone.id]);
    this.life = lifeOf(zone.map);
    for (const prop of zone.map.props) {
      const art = PROP_ART[prop.id];
      const { source, palette, form: f, key } = lookOf(prop);
      const sprite = bake(key, source, palette);
      const footY = (prop.ty + prop.h) * TILE_SIZE;
      const x = prop.tx * TILE_SIZE + (prop.w * TILE_SIZE - sprite.width) / 2;
      const y = footY - sprite.height;
      const drawable: Drawable = { footY, sprite, x, y };
      if (art.glow) {
        drawable.glow = glowOf(`glow:${prop.id}:${f}`, source, art.palette, art.glow);
      }
      if (art.door) {
        const building = art.noEaves ? {} : { building: { key: `${prop.id}:${f}`, source } };
        this.doors.push({ x, y, footY, door: art.door, ...building });
      }
      if (prop.id === 'pottedPlant') {
        this.pots.push(drawable);
      } else if (prop.id === 'skelly') {
        this.skellies.push(drawable);
      } else if (prop.id === 'candyTree') {
        this.candyTrees.push(drawable);
      } else if (prop.id === 'honestyStall') {
        this.stalls.push(drawable);
      } else if (prop.id === 'mailbox') {
        const full = bake('prop:mailbox:full', MAILBOX_FULL, palette);
        this.mailbox = { drawable, full };
      } else if (prop.id === 'floatLantern') {
        this.bobbing.push(drawable);
      } else if (prop.id === 'mound') {
        const dug = bake(`prop:mound:dug`, art.spent!, palette);
        this.mounds.push({ prop, drawable, dug });
      } else if (art.spent) {
        const spent = bake(`${key}:spent`, art.spent, palette);
        this.givers.push({ key: propKey(prop, zone.id), drawable, ready: sprite, spent });
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
    const shoots = bake('patch:shoots', SHOOTS, SHOOTS_PALETTE);
    for (const patch of zone.map.patches) {
      const art = PATCH_ART[patch.id];
      const ready = bake(`patch:${patch.id}`, art.source, art.palette);
      const x = patch.tx * TILE_SIZE;
      const y = patch.ty * TILE_SIZE;
      // Flat on the ground: anything standing on or below the tile covers it.
      const drawable: Drawable = { footY: y + 1, sprite: ready, x, y };
      const giver: Giver = { key: patchKey(patch, zone.id), drawable, ready, spent: shoots };
      if (art.glows) {
        giver.readyGlow = glowOf(`glow:patch:${patch.id}`, art.source, art.palette, {
          f: art.palette.f ?? null,
          F: art.palette.F ?? null,
        });
        giver.light = {
          x: x + TILE_SIZE / 2,
          y: y + TILE_SIZE / 2,
          radius: MOONPETAL_LIGHT.radius,
        };
      }
      this.givers.push(giver);
    }
  }

  /**
   * The light the town is in now: the clock's hour, unless the page asked for another, with the
   * lamps lit a little on a grey day, and the night brighter under a full moon.
   */
  daylight(): Daylight {
    const now = this.world.clock.now();
    const hour = this.hour ?? hourOf(now);
    let light = daylight(hour);
    if (isMoonlit(dayKey(now), Math.floor(hour))) light = underFullMoon(light);
    return { ...light, lamps: Math.max(light.lamps, WEATHER_LOOK[this.weather()].lamps) };
  }

  /** Today's weather, unless the page asked for another. */
  weather(): Weather {
    return this.weatherShown ?? this.world.weather.today();
  }

  get mapSize() {
    return { width: this.zone.width * TILE_SIZE, height: this.zone.height * TILE_SIZE };
  }

  follow(deltaMs: number): void {
    this.follower.follow(this.world.player, deltaMs);
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
    this.world.tapTile(tx, ty);
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
    const player = this.world.player;
    this.camera = this.follower.origin(player, canvas, this.mapSize);
    const cam = this.camera;

    ctx.imageSmoothingEnabled = false;
    ctx.fillStyle = PALETTE.hedgeDark;
    ctx.fillRect(0, 0, canvas.width, canvas.height);
    const life = this.season();
    this.ground.draw(ctx, cam, canvas);

    const weather = this.weather();
    drawShimmer(ctx, life, cam, nowMs, weather === 'rain');
    drawTufts(ctx, life, cam, nowMs, weather === 'rain');
    drawWeatherGround(ctx, weather, cam, nowMs);
    drawTarget(ctx, this.world, cam, nowMs);

    const me = playerDrawable(this.world, nowMs);
    const drawables = [
      ...this.props,
      ...this.giverDrawables(),
      ...this.bedDrawables(),
      ...this.snackDrawables(nowMs),
      ...this.popUpDrawables(),
      ...this.lotDrawables(),
      ...this.mailboxDrawables(),
      ...this.potDrawables(),
      ...this.candyDrawables(),
      ...this.moundDrawables(),
      ...this.holidayDrawables(),
      ...this.gateDrawables(),
      ...this.bobbingDrawables(nowMs),
      ...butterflyDrawables(this.flutters, nowMs, this.hour ?? hourOf(this.world.clock.now())),
      ...this.cartDrawables(),
      ...neighbourDrawables(this.world, this.zone.id, nowMs),
      ...this.wesDrawables(),
      ...this.critters().map((c) => critterDrawable(c, nowMs)),
      ...this.world.petCare.here().map((p) => petDrawable(p, this.world, nowMs)),
      ...this.boneDrawables(),
      me,
    ].filter((d) => onScreen(d, cam, canvas));
    drawables.sort((a, b) => a.footY - b.footY);
    drawDrawables(ctx, drawables, cam);
    const decor = this.world.holidays.decor();
    if (this.town && decor) drawGarlands(ctx, decor, cam);
    const banner = this.world.holidays.banner();
    if (this.town && banner) drawBanner(ctx, banner, cam);
    if (this.town) drawSprinklerSpray(ctx, this.world, cam, nowMs);
    drawSmoke(ctx, this.withLots(life), cam, nowMs, weather === 'rain');
    drawPuffs(this.ctx, this.world, this.zone.id, this.camera, nowMs);
    drawSpellSparkles(this.ctx, this.world, this.zone.id, this.camera, nowMs);
    drawNet(ctx, this.world, cam);
    drawFishRings(
      ctx,
      this.world,
      this.critters().filter((c) => isFish(c.critter)),
      cam,
      nowMs,
    );
    drawLine(ctx, this.world, me, cam, nowMs);
    drawWeatherAir(ctx, weather, cam, nowMs);
    const sky = this.world.holidays.sky();
    if (sky === 'snow') drawSnow(ctx, cam, nowMs);

    const lights = [...this.lights, ...this.nightLights(nowMs)];
    const light = this.daylight();
    const { tint } = WEATHER_LOOK[weather];
    drawLight(
      ctx,
      this.lighting,
      this.glowLayer,
      this.world,
      cam,
      light,
      drawables,
      lights,
      0,
      tint,
    );
    if (this.town && decor) drawGarlandLights(ctx, decor, cam, nowMs, light.lamps);
    if (sky === 'fireworks') drawFireworks(ctx, cam, nowMs);
    this.drawSnackTwinkle(nowMs);
    if (this.town) {
      drawRipeSparkles(ctx, this.world, cam, nowMs);
      drawBedLook(ctx, this.world, cam, nowMs);
    }
    drawLostGlint(ctx, this.world, this.zone.id, cam, nowMs);
    drawPetBubbles(ctx, this.world.petCare.here(), this.world, cam, nowMs);
    drawNeighbourBubbles(ctx, this.world, this.zone.id, cam, nowMs);
    drawBite(ctx, this.world, me, cam);
  }

  /**
   * The ground as it is today: its pond frozen over in winter (phase U). The day it freezes or
   * thaws, the chunks of ground the pond touches are baked again; the rest stay as they were.
   */
  private season(): Life {
    const frozen = this.zone.decorations?.frozen ?? false;
    if (frozen && !this.iced) {
      const { map } = this.zone;
      const tiles = map.tiles.map((t, i) =>
        this.zone.isIce(i % map.width, Math.floor(i / map.width)) ? 'ice' : t,
      );
      this.iced = { tiles, life: lifeOf({ ...map, tiles }) };
    }
    if (frozen !== this.frozenShown) {
      this.frozenShown = frozen;
      this.ground.retile(frozen ? this.iced!.tiles : this.zone.map.tiles);
    }
    return frozen ? this.iced!.life : this.life;
  }

  /** She has left: the ground's chunks are let go, and baked again as she comes back. */
  rest(): void {
    this.ground.release();
  }

  groundMemory(): { chunks: number; bytes: number } {
    return this.ground.memory;
  }

  /**
   * How many pixels the ground drawn from its chunks differs from the same ground baked whole,
   * as it is today: none, or there's a seam. For the smoke check only.
   */
  groundSeams(): number {
    const { map } = this.zone;
    const whole = new Ground(map, CLUTTER[this.zone.id], Math.max(map.width, map.height));
    if (this.frozenShown) whole.retile(this.iced!.tiles);
    const a = this.ground.whole();
    const b = whole.whole();
    const pa = a.getContext('2d')!.getImageData(0, 0, a.width, a.height).data;
    const pb = b.getContext('2d')!.getImageData(0, 0, b.width, b.height).data;
    let differ = 0;
    for (let i = 0; i < pa.length; i += 4) {
      if (
        pa[i] !== pb[i] ||
        pa[i + 1] !== pb[i + 1] ||
        pa[i + 2] !== pb[i + 2] ||
        pa[i + 3] !== pb[i + 3]
      )
        differ++;
    }
    return differ;
  }

  /** The critters out here now. */
  private critters() {
    return this.world.collecting.critters(this.zone.id);
  }

  /** Fibi's bone, if she has left it somewhere here today. */
  private boneDrawables(): Drawable[] {
    const bone = this.world.petCare.lostBone();
    return bone?.scene === this.zone.id ? [boneDrawable(bone.tx, bone.ty)] : [];
  }

  /** Each tree, rock and patch as it is now: ready to give, or resting until the next window. */
  private giverDrawables(): Drawable[] {
    return this.givers.map((g) => {
      const ready = this.world.takings.isReady(g.key);
      const d = { ...g.drawable, sprite: ready ? g.ready : g.spent };
      if (ready && g.readyGlow) d.glow = g.readyGlow;
      return d;
    });
  }

  /** Her garden, drawn in `garden.ts`. */
  private bedDrawables(): Drawable[] {
    return this.town ? bedDrawables(this.world, this.weather() === 'rain') : [];
  }

  /**
   * The pop-up shop, where it stands today. It moves, so unlike the other buildings its shadow is
   * drawn with it rather than baked into the ground.
   */
  private popUpDrawables(): Drawable[] {
    const lot = this.zone.stalls?.popUp();
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
      shadow: shadowOf(x + sprite.width / 2, footY, art.shadow),
    };
    if (this.popUpGlow) d.glow = this.popUpGlow;
    return [d];
  }

  /**
   * What stands on the newcomers' lots today (phase T): a sign, a house, their boxes; and in the
   * square, a holiday's piece while its decorations are up (phase U).
   */
  private lotDrawables(): Drawable[] {
    return [...(this.zone.lots?.props() ?? []), ...(this.zone.decorations?.props() ?? [])].map(
      (p) => this.standing(p),
    );
  }

  /** Something that comes and goes, baked once; like the pop-up, its shadow is drawn with it. */
  private standing(p: PlacedProp): Drawable {
    const art = PROP_ART[p.id];
    const sprite = bake(`prop:${p.id}:0:0`, art.source, art.palette);
    const footY = (p.ty + p.h) * TILE_SIZE;
    const x = p.tx * TILE_SIZE + (p.w * TILE_SIZE - sprite.width) / 2;
    const d: Drawable = {
      footY,
      sprite,
      x,
      y: footY - sprite.height,
      shadow: shadowOf(x + sprite.width / 2, footY, art.shadow),
    };
    if (art.glow) d.glow = glowOf(`glow:${p.id}:0`, art.source, art.palette, art.glow);
    return d;
  }

  /** The place's life with the chimneys of the newcomers' houses standing today. */
  private withLots(life: Life): Life {
    const lots = this.zone.lots?.props();
    if (!lots?.length) return life;
    if (this.lotLife?.lots !== lots) {
      this.lotLife = { lots, life: { ...life, chimneys: [...life.chimneys, ...chimneysOf(lots)] } };
    }
    return this.lotLife.life;
  }

  /** Her mailbox, its flag up while a letter waits in it. */
  private mailboxDrawables(): Drawable[] {
    if (!this.mailbox) return [];
    const { drawable, full } = this.mailbox;
    return [this.world.letters.unread > 0 ? { ...drawable, sprite: full } : drawable];
  }

  /** The floating lanterns, each bobbing a pixel up and down in its own time. */
  private bobbingDrawables(nowMs: number): Drawable[] {
    return this.bobbing.map((d) => {
      const bob = Math.round(Math.sin(nowMs / 650 + d.x / 37) * 1.2);
      return { ...d, y: d.y + bob };
    });
  }

  /**
   * The gates across ways out: shut, standing in the way, while the place beyond is, and swung back
   * against their posts once it opens.
   */
  private gateDrawables(): Drawable[] {
    const shut = bake('gate:shut', GATE_SHUT, GATE_PALETTE);
    const open = bake('gate:open', GATE_OPEN, GATE_PALETTE);
    return this.zone.map.exits
      .filter((e) => e.gate)
      .map((e) => {
        const at = gateOf(e, this.zone);
        const sprite = this.world.travel.isOpen(e.to) ? open : shut;
        const footY = (at.ty + at.h) * TILE_SIZE;
        const x = at.tx * TILE_SIZE + (at.w * TILE_SIZE - sprite.width) / 2;
        return { footY, sprite, x, y: footY - sprite.height };
      });
  }

  /** Each mound, glinting until she digs up what's under it, and a hole after. */
  private moundDrawables(): Drawable[] {
    return this.mounds.map(({ prop, drawable, dug }) => {
      if (!this.world.digging.isDug(this.zone.id, prop)) return drawable;
      const hole: Drawable = { ...drawable, sprite: dug };
      delete hole.glow;
      return hole;
    });
  }

  /**
   * The candy tree, bare, with a few sweets or laden, and giving a little shake as she shakes it;
   * and the honesty stall, its crates full while anything is on it.
   */
  private candyDrawables(): Drawable[] {
    const look = this.world.candyTree.look();
    const tree = bake(`candyTree:${look}`, CANDY_TREE[look], CANDY_TREE_PALETTE);
    const shaken = this.world.candyTree.shakenAt;
    const since = shaken === null ? Infinity : this.world.clock.now() - shaken;
    const wiggle = since < SHAKE_MS ? (Math.floor(since / 70) % 2 === 0 ? 1 : -1) : 0;
    const stocked = this.world.stall.stocked ? 'stocked' : 'empty';
    const stall = bake(`honestyStall:${stocked}`, HONESTY_STALL[stocked], HONESTY_STALL_PALETTE);
    return [
      ...this.candyTrees.map((d) => ({ ...d, sprite: tree, x: d.x + wiggle })),
      ...this.stalls.map((d) => ({ ...d, sprite: stall })),
    ];
  }

  /**
   * The holidays (phase U): what hangs on every front door while a set of decorations is up,
   * Skelly in his Santa hat and lights at Christmas (and as he always is otherwise), and Easter's
   * eggs hidden in the grass.
   */
  private holidayDrawables(): Drawable[] {
    const decor = this.world.holidays.decor();
    const skelly: Drawable[] =
      decor === 'christmas'
        ? this.skellies.map((d) => {
            const sprite = bake('skelly:christmas', SKELLY_CHRISTMAS, SKELLY_CHRISTMAS_PALETTE);
            const glow = glowOf(
              'glow:skelly:christmas',
              SKELLY_CHRISTMAS,
              SKELLY_CHRISTMAS_PALETTE,
              SKELLY_CHRISTMAS_GLOW,
            );
            return { ...d, sprite, y: d.footY - sprite.height, glow };
          })
        : this.skellies;
    if (!decor) return skelly;
    const lots = (this.zone.lots?.props() ?? []).flatMap((p): DrawnDoor[] => {
      const art = PROP_ART[p.id];
      if (!art.door) return [];
      const { x, y, footY } = this.standing(p);
      const building = art.noEaves ? {} : { building: { key: p.id, source: art.source } };
      return [{ x, y, footY, door: art.door, ...building }];
    });
    const doors = [...this.doors, ...lots];
    const eggs = this.town ? eggDrawables(this.world.holidays.eggs()) : [];
    return [...skelly, ...doorDrawables(decor, doors), ...eaveDrawables(decor, doors), ...eggs];
  }

  /** Her pots, with what's growing in them now. */
  private potDrawables(): Drawable[] {
    const plant = this.world.porch.plant;
    const art = POT_ART[plant];
    const sprite = bake(`pot:${plant}`, art.source, art.palette);
    return this.pots.map((d) => ({ ...d, sprite }));
  }

  /**
   * The Moon Pie Man and his cart, where they are today. He stands behind the counter, which hides
   * him from the waist down.
   */
  private cartDrawables(): Drawable[] {
    const cart = this.zone.stalls?.moonPieCart();
    if (!cart) return [];
    const art = PROP_ART.moonPieCart;
    const sprite = bake('prop:moonPieCart:0', art.source, art.palette);
    const footY = (cart.ty + cart.h) * TILE_SIZE;
    const x = cart.tx * TILE_SIZE + (cart.w * TILE_SIZE - sprite.width) / 2;
    const man = bakeFigure('moonPieMan', 'down', 0);
    const cartDrawable: Drawable = {
      footY,
      sprite,
      x,
      y: footY - sprite.height,
      shadow: shadowOf(x + sprite.width / 2, footY, art.shadow),
    };
    if (art.glow) cartDrawable.glow = glowOf('glow:moonPieCart', art.source, art.palette, art.glow);
    return [
      {
        footY: footY - 1,
        sprite: man,
        x: x + (sprite.width - man.width) / 2,
        y: footY - 12 - man.height,
      },
      cartDrawable,
    ];
  }

  /**
   * Wes, when he's lurking: half behind a tree, peering out the side he's on. The tree is drawn
   * over him, so only the half of him that's very bad at hiding shows.
   */
  private wesDrawables(): Drawable[] {
    const wes = this.world.mystery.wes();
    if (!wes) return [];
    const sprite = bakeFigure('wes', wes.side, 0);
    const lean = wes.side === 'right' ? -12 : 12;
    const { x } = tileCentre(wes);
    const footY = wes.ty * TILE_SIZE + 28;
    return [{ footY, sprite, x: x - sprite.width / 2 + lean, y: footY - sprite.height }];
  }

  /** Tonight's snack, which only ever waits in town. */
  private snack() {
    return this.town ? this.world.gathering.snack() : null;
  }

  /** The night's snack, bobbing gently where it waits, lit so it can't be missed. */
  private snackDrawables(nowMs: number): Drawable[] {
    const snack = this.snack();
    if (!snack) return [];
    const art = ITEM_ART[snack.item];
    const sprite = bakeIcon(`item:${snack.item}`, art.source, art.palette);
    const bob = 2 * Math.round(Math.sin(nowMs / 400));
    const x = snack.tx * TILE_SIZE;
    const y = snack.ty * TILE_SIZE - 6 + bob;
    return [{ footY: snack.ty * TILE_SIZE + 18, sprite, x, y, glow: sprite }];
  }

  /**
   * Lights that come and go: the snack's, the pop-up's, each moonpetal patch in bloom, and every
   * critter that glows.
   */
  private nightLights(nowMs: number): WorldLight[] {
    const lights: WorldLight[] = [];
    for (const c of this.critters()) {
      const light = critterLight(c, nowMs);
      if (light) lights.push(light);
    }
    const popUp = this.zone.stalls?.popUp();
    if (popUp) lights.push(...this.stallLights(popUp, this.popUpSprite, 'popUpShop'));
    for (const p of [
      ...(this.zone.lots?.props() ?? []),
      ...(this.zone.decorations?.props() ?? []),
    ]) {
      lights.push(...this.stallLights(p, this.standing(p).sprite, p.id));
    }
    const cart = this.zone.stalls?.moonPieCart();
    if (cart) {
      const sprite = bake(
        'prop:moonPieCart:0',
        PROP_ART.moonPieCart.source,
        PROP_ART.moonPieCart.palette,
      );
      lights.push(...this.stallLights(cart, sprite, 'moonPieCart'));
    }
    const snack = this.snack();
    if (snack) {
      const { x, y } = tileCentre(snack);
      lights.push({
        x,
        y: y - 8,
        radius: SNACK_LIGHT.radius,
        strength: SNACK_LIGHT.strength,
      });
    }
    for (const g of this.givers) {
      if (g.light && this.world.takings.isReady(g.key)) {
        lights.push({ ...g.light, strength: MOONPETAL_LIGHT.strength });
      }
    }
    const now = this.world.clock.now();
    for (const bed of this.town ? this.world.map.beds : []) {
      const planting = this.world.farm.planting(bed);
      if (!planting || !CROP_ART[planting.crop].glow) continue;
      if (stageOf(planting, now, this.world.farm.sprinkled(bed)) !== 'ripe') continue;
      const { x, y } = tileCentre(bed);
      lights.push({ x, y: y - 16, radius: MOONPETAL_LIGHT.radius + 8, strength: 0.6 });
    }
    return lights;
  }

  /** A stall's lamplight where it stands today, from its art's lights. */
  private stallLights(
    at: { tx: number; ty: number; w: number; h: number },
    sprite: HTMLCanvasElement,
    id: PropId,
  ): WorldLight[] {
    const top = (at.ty + at.h) * TILE_SIZE - sprite.height;
    const left = (at.tx + at.w / 2) * TILE_SIZE - sprite.width / 2;
    return (PROP_ART[id].lights ?? []).map((l) => ({
      x: left + l.x,
      y: top + l.y,
      radius: l.radius,
    }));
  }

  /** A little star that winks above the snack, so it reads as a treat from across the square. */
  private drawSnackTwinkle(nowMs: number): void {
    const snack = this.snack();
    if (!snack || Math.floor(nowMs / 350) % 3 === 0) return;
    const x = snack.tx * TILE_SIZE + 26 - this.camera.x;
    const y = snack.ty * TILE_SIZE - 6 - this.camera.y;
    const px = 2;
    this.ctx.fillStyle = PALETTE.candleBright;
    this.ctx.fillRect(x - px, y, px * 3, px);
    this.ctx.fillRect(x, y - px, px, px * 3);
  }
}

/** The shadow a stall casts where it stands today, from its art's shadow. */
function shadowOf(cx: number, footY: number, shadow: { w: number; h: number; dy?: number }) {
  return { cx, cy: footY - 2 - (shadow.dy ?? 0), w: shadow.w, h: shadow.h };
}
