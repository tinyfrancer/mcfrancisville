import { resolverFor, type Effects } from './effects';
import { bakeFigure } from './villagers';
import { FOSSIL_IDS } from '../data/fossils';
import { FOSSIL_ART } from '../sprites/fossils';
import { TILE_SIZE } from '../config/world';
import { CRITTERS } from '../data/critters';
import { FIXTURES, INTERIORS } from '../data/interiors';
import { bake } from '../sprites/bake';
import { CRITTER_ART } from '../sprites/critters';
import { FIXTURE_ART } from '../sprites/interiors';
import { PLANTER_SOIL } from '../sprites/crafted';
import { drawBedLook, drawRipeSparkles, plantedDrawable } from './garden';
import { PALETTE } from '../sprites/palette';
import { daylight, hourOf, type Daylight } from '../systems/clock';
import type { CritterId } from '../types/ids';
import { tileCentre, tileOf, type World } from '../world/World';
import { boxOf, layerOf, type RoomThing, type RoomZone } from '../world/zones/RoomZone';
import { FollowCamera, screenToWorld, worldToScreen, type Point } from './camera';
import { bakeDoll } from './doll';
import { DOLL_HEIGHT } from '../sprites/doll';
import { Lighting } from './lighting';
import { drawGlints } from './bloom';
import { drawPetBubbles, petDrawable } from './pets';
import { drawNeighbourBubbles, drawPuffs, neighbourDrawables } from './villagers';
import { drawRoomFrame, INDOOR_SOFTEN, pieceShadow, pieceSprite, roomShell } from './room';
import {
  drawDrawables,
  drawLight,
  drawTarget,
  glowOf,
  playerDrawable,
  type Drawable,
  type SceneView,
  type WorldLight,
} from './scene';

export interface RoomViewOptions {
  /** Lights the room as at this hour instead of the clock's (`?hour=`). */
  hour?: number | null;
  /** What the moments look like where they happen, drawn over everything (V1's E1). */
  effects?: Effects;
}

/** A thing in the room as it's drawn: where, its picture, and what of it glows. */
interface ThingSprite {
  thing: RoomThing;
  sprite: HTMLCanvasElement;
  x: number;
  y: number;
  footY: number;
  glow?: HTMLCanvasElement;
  lights: WorldLight[];
  shadow?: Drawable['shadow'];
}

/** Every critter by its family, in the order the cabinet lists them. */
const FAMILIES = Object.entries(CRITTERS) as [CritterId, (typeof CRITTERS)[CritterId]][];

/**
 * Draws the inside of one of the town's buildings (phase H): its walls and floor, what stands and
 * hangs there, the critters on show in the museum's cases, her, and a pet out with her. It reads
 * the world each frame and writes to it only through `tapTile`, as the other views do.
 */
export class RoomView implements SceneView {
  private readonly world: World;
  private readonly zone: RoomZone;
  private readonly canvas: HTMLCanvasElement;
  private readonly ctx: CanvasRenderingContext2D;
  private readonly hour: number | null;
  private readonly lighting = new Lighting();
  private readonly glowLayer = document.createElement('canvas');
  private readonly sprites: readonly ThingSprite[];
  private camera: Point = { x: 0, y: 0 };
  private readonly follower = new FollowCamera();
  private readonly effects: Effects | null;

  constructor(
    world: World,
    zone: RoomZone,
    canvas: HTMLCanvasElement,
    options: RoomViewOptions = {},
  ) {
    this.world = world;
    this.zone = zone;
    this.canvas = canvas;
    this.hour = options.hour ?? null;
    this.effects = options.effects ?? null;
    const ctx = canvas.getContext('2d');
    if (!ctx) throw new Error('no 2d context');
    this.ctx = ctx;
    // Nothing in a building moves, so each thing is placed once.
    this.sprites = zone.things.map((t) => thingSprite(t));
  }

  follow(deltaMs: number): void {
    this.follower.follow(this.world.player, deltaMs);
  }

  cameraOrigin(): Point {
    return { ...this.camera };
  }

  daylight(): Daylight {
    return daylight(this.hour ?? hourOf(this.world.clock.now()));
  }

  /** A tap counts for whatever stands there wherever her finger lands on its picture. */
  tap(clientX: number, clientY: number): void {
    const rect = this.canvas.getBoundingClientRect();
    const at = screenToWorld(clientX, clientY, rect, this.canvas, this.camera);
    const under = tileOf(at.x, at.y);
    const someone =
      this.world.petCare.petAt(under.tx, under.ty) ??
      this.world.neighbourhood.villagerAt(under.tx, under.ty);
    const hit = someone ? null : this.standingAt(at);
    const { tx, ty } = hit ? boxOf(hit) : under;
    this.world.tapTile(tx, ty);
  }

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
    const room = this.zone.room;
    const row = INTERIORS[this.zone.id];
    const size = { width: room.width * TILE_SIZE, height: room.height * TILE_SIZE };
    this.camera = this.follower.origin(this.world.player, canvas, size);
    const cam = this.camera;
    ctx.imageSmoothingEnabled = false;
    ctx.fillStyle = PALETTE.ink;
    ctx.fillRect(0, 0, canvas.width, canvas.height);
    drawRoomFrame(ctx, room, cam);
    ctx.drawImage(roomShell(room, row.wallpaper, row.flooring), -cam.x, -cam.y);

    for (const layer of ['wall', 'rug'] as const) {
      for (const s of this.sprites) {
        if (layerOf(s.thing) !== layer) continue;
        ctx.drawImage(s.sprite, s.x - cam.x, s.y - cam.y);
        this.drawSitter(s, cam);
      }
    }
    drawTarget(ctx, this.world, cam, nowMs);

    const drawables: Drawable[] = [
      playerDrawable(this.world, nowMs),
      ...this.world.petCare.here().map((p) => petDrawable(p, this.world, nowMs)),
      ...neighbourDrawables(this.world, this.zone.id, nowMs),
    ];
    for (const s of this.sprites) {
      if (layerOf(s.thing) !== 'floor') continue;
      const d: Drawable = { footY: s.footY, sprite: s.sprite, x: s.x, y: s.y };
      if (s.shadow) d.shadow = s.shadow;
      if (s.glow) d.glow = s.glow;
      drawables.push(d, ...this.onShow(s), ...this.growing(s));
    }
    drawables.sort((a, b) => a.footY - b.footY);
    drawDrawables(ctx, drawables, cam);
    drawPuffs(ctx, this.world, this.zone.id, cam, nowMs);
    // The glow from walls and rugs too, which are under everything else.
    const lit = this.sprites.filter((s) => s.glow && layerOf(s.thing) !== 'floor');
    const underneath: Drawable[] = lit.map((s) => ({
      footY: -1,
      sprite: s.sprite,
      x: s.x,
      y: s.y,
      glow: s.glow!,
    }));
    drawLight(
      ctx,
      this.lighting,
      this.glowLayer,
      this.world,
      cam,
      this.daylight(),
      [...underneath, ...drawables],
      this.sprites.flatMap((s) => s.lights),
      INDOOR_SOFTEN,
    );
    drawRipeSparkles(ctx, this.world, this.zone.id, cam, nowMs, PLANTER_SOIL);
    drawBedLook(ctx, this.world, this.zone.id, cam, nowMs);
    drawPetBubbles(ctx, this.world.petCare.here(), this.world, cam, nowMs);
    drawNeighbourBubbles(ctx, this.world, this.zone.id, cam, nowMs);
    if (this.effects)
      drawGlints(ctx, this.effects.glints(this.zone.id), cam, this.daylight().lamps);
    this.effects?.draw(ctx, this.zone.id, cam, resolverFor(this.world));
  }

  /** What grows in a raised bed (0.3's F2), standing in its soil as in a planter at home. */
  private growing(s: ThingSprite): Drawable[] {
    if (!('fixture' in s.thing) || !FIXTURES[s.thing.fixture.id].planter) return [];
    const { tx, ty } = s.thing.fixture;
    const crop = plantedDrawable(
      this.world,
      { zone: this.zone.id, tx, ty },
      s.footY + 0.5,
      PLANTER_SOIL,
    );
    return crop ? [crop] : [];
  }

  /**
   * Her, painted into her portrait as a pin-up, as she looks now: it restyles when she does. In the
   * castle hall's (phase U), the two of them side by side.
   */
  private drawSitter(s: ThingSprite, cam: Point): void {
    if (!('fixture' in s.thing)) return;
    const { sitter, couple } = FIXTURE_ART[s.thing.fixture.id];
    if (sitter) {
      const her = bakeDoll(this.world.wardrobe.look, 'down', 0, 'pinup');
      const hat = her.height - DOLL_HEIGHT;
      this.ctx.drawImage(her, s.x + sitter.x - cam.x, s.y + sitter.y - hat - cam.y);
    }
    if (couple) {
      const her = bakeDoll(this.world.wardrobe.look, 'right', 0);
      const him = bakeFigure('cody', 'left', 0);
      const up = (c: HTMLCanvasElement) => c.height - DOLL_HEIGHT;
      this.ctx.drawImage(him, s.x + couple.him.x - cam.x, s.y + couple.him.y - up(him) - cam.y);
      this.ctx.drawImage(her, s.x + couple.her.x - cam.x, s.y + couple.her.y - up(her) - cam.y);
    }
  }

  /**
   * The critters in a museum case, each she has given the museum in its nook, drawn just in front
   * of the case's glass.
   */
  private onShow(s: ThingSprite): Drawable[] {
    if (!('fixture' in s.thing)) return [];
    const { shows } = s.thing.fixture;
    const nooks = FIXTURE_ART[s.thing.fixture.id].nooks;
    if (!shows || !nooks) return [];
    if (shows === 'fossil') return this.fossilsOnShow(s, nooks);
    const family = FAMILIES.filter(([, row]) => row.family === shows).map(([id]) => id);
    const shown: Drawable[] = [];
    family.forEach((id, i) => {
      const nook = nooks[i];
      if (!nook || !this.world.cabinet.isDonated(id)) return;
      const art = CRITTER_ART[id];
      const sprite = bake(`critter:world:${id}:0:r`, art.world[0], art.palette);
      shown.push({ footY: s.footY + 0.5, sprite, x: s.x + nook.x, y: s.y + nook.y });
    });
    return shown;
  }

  /** The fossils she has given the museum, each in its nook of the seventh case (0.3's C1). */
  private fossilsOnShow(s: ThingSprite, nooks: readonly { x: number; y: number }[]): Drawable[] {
    return FOSSIL_IDS.flatMap((id, i) => {
      const nook = nooks[i];
      if (!nook || !this.world.cabinet.isDonated(id)) return [];
      const art = FOSSIL_ART[id];
      const sprite = bake(`fossil:${id}`, art.source, art.palette);
      return [{ footY: s.footY + 0.5, sprite, x: s.x + nook.x, y: s.y + nook.y }];
    });
  }

  /** The frontmost standing thing whose picture has a pixel at `at`. */
  private standingAt(at: Point): RoomThing | null {
    const standing = this.sprites
      .filter((s) => layerOf(s.thing) === 'floor')
      .sort((a, b) => b.footY - a.footY);
    for (const s of standing) {
      const x = Math.floor(at.x - s.x);
      const y = Math.floor(at.y - s.y);
      if (x < 0 || y < 0 || x >= s.sprite.width || y >= s.sprite.height) continue;
      const alpha = s.sprite.getContext('2d')?.getImageData(x, y, 1, 1).data[3] ?? 0;
      if (alpha > 0) return s.thing;
    }
    return null;
  }
}

/** Where a thing in a room is drawn: a fixture at 32, a piece of furniture still at 16. */
function thingSprite(thing: RoomThing): ThingSprite {
  if ('piece' in thing) {
    const s = pieceSprite(thing.piece);
    const drawn: ThingSprite = { ...s, thing, lights: s.lights };
    if (layerOf(thing) === 'floor') drawn.shadow = pieceShadow(s);
    return drawn;
  }
  const { fixture } = thing;
  const art = FIXTURE_ART[fixture.id];
  const key = `fixture:${fixture.id}`;
  const sprite = bake(key, art.source, art.palette);
  const box = boxOf(thing);
  const footY = (box.ty + box.h) * TILE_SIZE;
  const x = box.tx * TILE_SIZE + (box.w * TILE_SIZE - sprite.width) / 2;
  const floor = layerOf(thing) === 'floor';
  const y = floor ? footY - sprite.height : box.ty * TILE_SIZE;
  const drawn: ThingSprite = {
    thing,
    sprite,
    x,
    y,
    footY,
    lights: (art.lights ?? []).map((l) => ({ x: x + l.x, y: y + l.y, radius: l.radius })),
  };
  if (floor) {
    drawn.shadow = { cx: x + sprite.width / 2, cy: footY - 4, w: box.w * 28, h: 8 };
  }
  if (art.glow) drawn.glow = glowOf(`glow:${key}`, art.source, art.palette, art.glow);
  return drawn;
}
