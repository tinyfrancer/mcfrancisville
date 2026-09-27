import { TILE_SIZE } from '../config/world';
import { FURNITURE } from '../data/furniture';
import { CHEST, type Placed, type Room } from '../data/home';
import { bake } from '../sprites/bake';
import {
  DOOR_MAT_ART,
  FLOORING_ART,
  FURNITURE_ART,
  furnitureSprite,
  WALLPAPER_ART,
} from '../sprites/furniture';
import { PALETTE } from '../sprites/palette';
import { PROP_ART } from '../sprites/props';
import { daylight, hourOf, type Daylight } from '../systems/clock';
import { footprint } from '../systems/decor';
import { tileCentre, tileOf, type World } from '../world/World';
import { cameraOrigin, screenToWorld, worldToScreen, type Point } from './camera';
import { SHADOW_ALPHA } from './ground';
import { Lighting } from './lighting';
import { boneDrawable, drawPetBubbles, petDrawable } from './pets';
import { bakeFigure } from './villagers';
import {
  danceStep,
  drawDrawables,
  drawLight,
  drawTarget,
  glowOf,
  playerDrawable,
  type Drawable,
  type SceneView,
  type WorldLight,
} from './scene';

/** How far a room at night is lifted toward daylight: indoors is cozy, never dark. */
const INDOOR_SOFTEN = 0.5;

/** A piece she has picked up while decorating floats this far above where it stands. */
const LIFT = 2;

/** How a placed piece is drawn: its picture, where, and what of it glows. */
interface PieceSprite {
  piece: Placed;
  sprite: HTMLCanvasElement;
  x: number;
  y: number;
  footY: number;
  glow?: HTMLCanvasElement;
  lights: WorldLight[];
}

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
  /** The walls and floor, drawn once for each paper and flooring she has up. */
  private room: { key: string; canvas: HTMLCanvasElement } | null = null;
  private camera: Point = { x: 0, y: 0 };

  constructor(world: World, canvas: HTMLCanvasElement, options: HomeViewOptions = {}) {
    this.world = world;
    this.canvas = canvas;
    this.hour = options.hour ?? null;
    const ctx = canvas.getContext('2d');
    if (!ctx) throw new Error('no 2d context');
    this.ctx = ctx;
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
    // A pet in front of a piece is the pet.
    const hit = this.world.petCare.petAt(under.tx, under.ty) ? null : this.standingAt(world);
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
    this.camera = cameraOrigin(this.world.player, canvas, size);
    const cam = this.camera;
    ctx.imageSmoothingEnabled = false;
    ctx.fillStyle = PALETTE.ink;
    ctx.fillRect(0, 0, canvas.width, canvas.height);
    this.drawFrame(room, cam);
    ctx.drawImage(this.roomCanvas(room), -cam.x, -cam.y);

    const pieces = this.world.home.placed.map((p) => this.pieceSprite(p));
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
      ...this.codyDancing(nowMs),
    ];
    const bone = this.world.petCare.lostBone();
    if (bone?.scene === 'home') drawables.push(boneDrawable(bone.tx, bone.ty));
    for (const s of pieces) {
      if (FURNITURE[s.piece.id].layer !== 'floor') continue;
      const { w } = footprint(s.piece.id, s.piece.turn);
      const lift = s.piece === selected ? LIFT : 0;
      const d: Drawable = {
        footY: s.footY,
        sprite: s.sprite,
        x: s.x,
        y: s.y - lift,
        shadow: {
          cx: s.piece.tx * TILE_SIZE + (w * TILE_SIZE) / 2,
          cy: s.footY - 2,
          w: w * 14,
          h: 4,
        },
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
      .map((p) => this.pieceSprite(p))
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

  private pieceSprite(piece: Placed): PieceSprite {
    const art = FURNITURE_ART[piece.id];
    const { source, flip } = furnitureSprite(piece.id, piece.turn);
    const key = `furniture:${piece.id}:${piece.turn}`;
    const sprite = bake(key, source, art.palette, { flipX: flip });
    const { w, h } = footprint(piece.id, piece.turn);
    const layer = FURNITURE[piece.id].layer;
    const footY = (piece.ty + h) * TILE_SIZE;
    const x = piece.tx * TILE_SIZE + (w * TILE_SIZE - sprite.width) / 2;
    const y = layer === 'floor' ? footY - sprite.height : piece.ty * TILE_SIZE;
    const s: PieceSprite = { piece, sprite, x, y, footY, lights: [] };
    if (art.glow) {
      s.glow = glowOf(`glow:${key}`, source, art.palette, art.glow, { flipX: flip });
    }
    for (const l of art.lights ?? []) {
      const lx = flip ? sprite.width - 1 - l.x : l.x;
      s.lights.push({ x: x + lx, y: y + l.y, radius: l.radius });
    }
    return s;
  }

  /** Cody, come over to dance with her, a step behind her on the beat. */
  private codyDancing(nowMs: number): Drawable[] {
    const at = this.world.recordPlayer.dance()?.cody;
    if (!at) return [];
    const step = danceStep(nowMs, 2);
    const sprite = bakeFigure('cody', step.facing, step.frame);
    const { x, y } = tileCentre(at);
    const footY = y + 7;
    return [
      {
        footY,
        sprite,
        x: x - sprite.width / 2,
        y: footY - sprite.height - step.hop,
        shadow: { cx: x, cy: footY - 1, w: 12, h: 4 },
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
      shadow: { cx: x + 8, cy: footY - 2, w: art.shadow.w, h: art.shadow.h },
    };
  }

  /** The walls papered and the floor laid, with a moulding, a skirting board and the door mat. */
  private roomCanvas(room: Room): HTMLCanvasElement {
    const home = this.world.home;
    const key = `${home.wallpaper}:${home.flooring}:${room.size}`;
    if (this.room?.key === key) return this.room.canvas;
    const width = room.width * TILE_SIZE;
    const height = room.height * TILE_SIZE;
    const wallHeight = room.wallRows * TILE_SIZE;
    const canvas = document.createElement('canvas');
    canvas.width = width;
    canvas.height = height;
    const g = canvas.getContext('2d');
    if (!g) throw new Error('no 2d context');
    const paper = WALLPAPER_ART[home.wallpaper];
    const floor = FLOORING_ART[home.flooring];
    const paperTile = bake(`wallpaper:${home.wallpaper}`, paper.source, paper.palette);
    const floorTile = bake(`flooring:${home.flooring}`, floor.source, floor.palette);
    for (let ty = 0; ty < room.height; ty++) {
      for (let tx = 0; tx < room.width; tx++) {
        const tile = ty < room.wallRows ? paperTile : floorTile;
        g.drawImage(tile, tx * TILE_SIZE, ty * TILE_SIZE);
      }
    }
    // The moulding along the top of the wall, and the skirting board along the bottom.
    g.fillStyle = PALETTE.barkDark;
    g.fillRect(0, 0, width, 2);
    g.fillStyle = PALETTE.bark;
    g.fillRect(0, 2, width, 1);
    g.fillStyle = PALETTE.wood;
    g.fillRect(0, wallHeight - 4, width, 1);
    g.fillStyle = PALETTE.bark;
    g.fillRect(0, wallHeight - 3, width, 3);
    // The wall's shadow on the floor, which is what makes it stand up from it.
    g.globalAlpha = SHADOW_ALPHA;
    g.fillStyle = PALETTE.ink;
    g.fillRect(0, wallHeight, width, 2);
    g.globalAlpha = 1;
    const mat = bake('doorMat', DOOR_MAT_ART.source, DOOR_MAT_ART.palette);
    g.drawImage(mat, room.mat.tx * TILE_SIZE, room.mat.ty * TILE_SIZE);
    this.room = { key, canvas };
    return canvas;
  }

  /** The room's walls seen edge-on round the floor, with the doorway out under the mat. */
  private drawFrame(room: Room, cam: Point): void {
    const { ctx } = this;
    const x = -cam.x;
    const y = -cam.y;
    const width = room.width * TILE_SIZE;
    const height = room.height * TILE_SIZE;
    ctx.fillStyle = PALETTE.dusk;
    ctx.fillRect(x - 4, y - 4, width + 8, height + 8);
    ctx.fillStyle = PALETTE.stoneLight;
    ctx.fillRect(x + room.mat.tx * TILE_SIZE + 2, y + height, TILE_SIZE - 4, 4);
  }

  /** Faint dots at the corners of the tiles, so she can see where a piece will go. */
  private drawGrid(room: Room, cam: Point): void {
    const { ctx } = this;
    ctx.globalAlpha = 0.45;
    ctx.fillStyle = PALETTE.ghost;
    for (let ty = 1; ty < room.height; ty++) {
      for (let tx = 1; tx < room.width; tx++) {
        ctx.fillRect(tx * TILE_SIZE - cam.x, ty * TILE_SIZE - cam.y, 1, 1);
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
    ctx.fillRect(x, y, w * TILE_SIZE, 1);
    ctx.fillRect(x, y + h * TILE_SIZE - 1, w * TILE_SIZE, 1);
    ctx.fillRect(x, y, 1, h * TILE_SIZE);
    ctx.fillRect(x + w * TILE_SIZE - 1, y, 1, h * TILE_SIZE);
    ctx.globalAlpha = 1;
  }
}
