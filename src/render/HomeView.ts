import { TILE_SIZE } from '../config/world';
import { FURNITURE } from '../data/furniture';
import { CHEST, type Placed, type Room } from '../data/home';
import { PALETTE } from '../sprites/palette';
import { PROP_ART } from '../sprites/props';
import { daylight, hourOf, type Daylight } from '../systems/clock';
import { footprint } from '../systems/decor';
import { tileCentre, tileOf, type World } from '../world/World';
import { FollowCamera, screenToWorld, worldToScreen, type Point } from './camera';
import { Lighting } from './lighting';
import { boneDrawable, drawPetBubbles, petDrawable } from './pets';
import { bakeFigure, neighbourDrawables } from './villagers';
import { bake } from '../sprites/bake';
import { drawRoomFrame, INDOOR_SOFTEN, pieceShadow, pieceSprite, roomShell } from './room';
import {
  danceStep,
  drawDrawables,
  drawLight,
  drawTarget,
  playerDrawable,
  type Drawable,
  type SceneView,
} from './scene';

/** A piece she has picked up while decorating floats this far above where it stands. */
const LIFT = 4;

export interface HomeViewOptions {
  /** Lights the room as at this hour instead of the clock's (`?hour=`). */
  hour?: number | null;
}

/**
 * Draws her home: the walls and floor, what hangs and stands and lies there, and her. Like the
 * town's view, it reads the town each frame and writes to it only through `tapTile`.
 */
export class HomeView implements SceneView {
  private readonly world: World;
  private readonly canvas: HTMLCanvasElement;
  private readonly ctx: CanvasRenderingContext2D;
  private readonly hour: number | null;
  private readonly lighting = new Lighting();
  private readonly glowLayer = document.createElement('canvas');
  private camera: Point = { x: 0, y: 0 };
  private readonly follower = new FollowCamera();

  constructor(world: World, canvas: HTMLCanvasElement, options: HomeViewOptions = {}) {
    this.world = world;
    this.canvas = canvas;
    this.hour = options.hour ?? null;
    const ctx = canvas.getContext('2d');
    if (!ctx) throw new Error('no 2d context');
    this.ctx = ctx;
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

  /**
   * A tap on the page. A tap on a standing piece counts for the piece wherever her finger lands on
   * its picture, so the top of a tall lamp is the lamp, not the wall behind it.
   */
  tap(clientX: number, clientY: number): void {
    const rect = this.canvas.getBoundingClientRect();
    const world = screenToWorld(clientX, clientY, rect, this.canvas, this.camera);
    const under = tileOf(world.x, world.y);
    // A pet or a visitor in front of a piece is them.
    const someone =
      this.world.petCare.petAt(under.tx, under.ty) ??
      this.world.neighbourhood.villagerAt(under.tx, under.ty);
    const hit = someone ? null : this.standingAt(world);
    const { tx, ty } = hit ? { tx: hit.tx, ty: hit.ty } : tileOf(world.x, world.y);
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
    const room = this.world.home.room;
    const size = { width: room.width * TILE_SIZE, height: room.height * TILE_SIZE };
    this.camera = this.follower.origin(this.world.player, canvas, size);
    const cam = this.camera;
    ctx.imageSmoothingEnabled = false;
    ctx.fillStyle = PALETTE.ink;
    ctx.fillRect(0, 0, canvas.width, canvas.height);
    drawRoomFrame(ctx, room, cam);
    const home = this.world.home;
    ctx.drawImage(roomShell(room, home.wallpaper, home.flooring), -cam.x, -cam.y);

    const pieces = this.world.home.placed.map((p) => pieceSprite(p));
    const selected = this.world.decorating.state?.selected ?? null;
    for (const layer of ['wall', 'rug'] as const) {
      for (const s of pieces) {
        if (FURNITURE[s.piece.id].layer !== layer) continue;
        const lift = s.piece === selected ? LIFT : 0;
        ctx.drawImage(s.sprite, s.x - cam.x, s.y - cam.y - lift);
      }
    }
    if (this.world.decorating.state) this.drawGrid(room, cam);
    drawTarget(ctx, this.world, cam, nowMs);

    const drawables: Drawable[] = [
      this.chestDrawable(),
      playerDrawable(this.world, nowMs),
      ...this.world.petCare.here().map((p) => petDrawable(p, this.world, nowMs)),
      // Cody, if he's round, is the one dancing with her.
      ...neighbourDrawables(
        this.world,
        'home',
        nowMs,
        this.world.recordPlayer.dance()?.cody ? 'cody' : undefined,
      ),
      ...this.codyDancing(nowMs),
    ];
    const bone = this.world.petCare.lostBone();
    if (bone?.scene === 'home') drawables.push(boneDrawable(bone.tx, bone.ty));
    for (const s of pieces) {
      if (FURNITURE[s.piece.id].layer !== 'floor') continue;
      const lift = s.piece === selected ? LIFT : 0;
      const d: Drawable = {
        footY: s.footY,
        sprite: s.sprite,
        x: s.x,
        y: s.y - lift,
        shadow: pieceShadow(s),
      };
      if (s.glow) d.glow = s.glow;
      drawables.push(d);
    }
    drawables.sort((a, b) => a.footY - b.footY);
    drawDrawables(ctx, drawables, cam);
    if (selected) this.drawSelected(selected, cam, nowMs);

    const lights = pieces.flatMap((s) => s.lights);
    const light = this.daylight();
    drawLight(
      ctx,
      this.lighting,
      this.glowLayer,
      this.world,
      cam,
      light,
      drawables,
      lights,
      INDOOR_SOFTEN,
    );
    drawPetBubbles(ctx, this.world.petCare.here(), this.world, cam, nowMs);
  }

  /** The frontmost standing piece whose picture has a pixel at `world`. */
  private standingAt(world: Point): Placed | null {
    const standing = this.world.home.placed
      .filter((p) => FURNITURE[p.id].layer === 'floor')
      .map((p) => pieceSprite(p))
      .sort((a, b) => b.footY - a.footY);
    for (const s of standing) {
      const x = Math.floor(world.x - s.x);
      const y = Math.floor(world.y - s.y);
      if (x < 0 || y < 0 || x >= s.sprite.width || y >= s.sprite.height) continue;
      const alpha = s.sprite.getContext('2d')?.getImageData(x, y, 1, 1).data[3] ?? 0;
      if (alpha > 0) return s.piece;
    }
    return null;
  }

  /** Cody, come over to dance with her, a step behind her on the beat. */
  private codyDancing(nowMs: number): Drawable[] {
    const at = this.world.recordPlayer.dance()?.cody;
    if (!at) return [];
    const step = danceStep(nowMs, 2);
    const sprite = bakeFigure('cody', step.facing, step.frame);
    const { x, y } = tileCentre(at);
    const footY = y + 14;
    return [
      {
        footY,
        sprite,
        x: x - sprite.width / 2,
        y: footY - sprite.height - step.hop,
        shadow: { cx: x, cy: footY - 2, w: 24, h: 8 },
      },
    ];
  }

  private chestDrawable(): Drawable {
    const art = PROP_ART.storageChest;
    const sprite = bake('prop:storageChest', art.source, art.palette);
    const footY = (CHEST.ty + 1) * TILE_SIZE;
    const x = CHEST.tx * TILE_SIZE;
    return {
      footY,
      sprite,
      x,
      y: footY - sprite.height,
      shadow: { cx: x + TILE_SIZE / 2, cy: footY - 4, w: art.shadow.w, h: art.shadow.h },
    };
  }

  /** Faint dots at the corners of the tiles, so she can see where a piece will go. */
  private drawGrid(room: Room, cam: Point): void {
    const { ctx } = this;
    ctx.globalAlpha = 0.45;
    ctx.fillStyle = PALETTE.ghost;
    for (let ty = 1; ty < room.height; ty++) {
      for (let tx = 1; tx < room.width; tx++) {
        ctx.fillRect(tx * TILE_SIZE - cam.x, ty * TILE_SIZE - cam.y, 2, 2);
      }
    }
    ctx.globalAlpha = 1;
  }

  /** A breathing candle-coloured outline round the tiles of the piece she has picked up. */
  private drawSelected(piece: Placed, cam: Point, nowMs: number): void {
    const { ctx } = this;
    const { w, h } = footprint(piece.id, piece.turn);
    const x = piece.tx * TILE_SIZE - cam.x;
    const y = piece.ty * TILE_SIZE - cam.y;
    ctx.globalAlpha = 0.6 + 0.4 * Math.sin(nowMs / 200);
    ctx.fillStyle = PALETTE.candle;
    const line = 2;
    ctx.fillRect(x, y, w * TILE_SIZE, line);
    ctx.fillRect(x, y + h * TILE_SIZE - line, w * TILE_SIZE, line);
    ctx.fillRect(x, y, line, h * TILE_SIZE);
    ctx.fillRect(x + w * TILE_SIZE - line, y, line, h * TILE_SIZE);
    ctx.globalAlpha = 1;
  }
}
