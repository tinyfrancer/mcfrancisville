import { TILE_SIZE } from '../config/world';
import { bake } from '../sprites/bake';
import { PALETTE } from '../sprites/palette';
import { PROP_ART } from '../sprites/props';
import { spriteSize } from '../sprites/sprite';
import { TILE_ART } from '../sprites/tiles';
import { tileCentre, tileOf, type Town } from '../world/Town';
import { bakeDoll } from './doll';
import { cameraOrigin, screenToWorld, worldToScreen, type Point } from './camera';

/** How long each walk frame shows. Two frames a step, about two steps a tile. */
const WALK_FRAME_MS = 140;

/** Her feet sit this far below the centre of her tile, so she stands *on* it rather than astride. */
const FEET_BELOW_CENTRE = 7;

interface Drawable {
  footY: number;
  draw(ctx: CanvasRenderingContext2D, camera: Point): void;
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
  private readonly props: Drawable[];
  private camera: Point = { x: 0, y: 0 };

  constructor(town: Town, canvas: HTMLCanvasElement) {
    this.town = town;
    this.canvas = canvas;
    const ctx = canvas.getContext('2d');
    if (!ctx) throw new Error('no 2d context');
    this.ctx = ctx;
    this.ground = this.renderGround();
    this.props = this.town.map.props.map((prop) => {
      const art = PROP_ART[prop.id];
      const sprite = bake(`prop:${prop.id}`, art.source, art.palette);
      const { width, height } = spriteSize(art.source);
      const footY = (prop.ty + prop.h) * TILE_SIZE;
      const x = prop.tx * TILE_SIZE + (prop.w * TILE_SIZE - width) / 2;
      const y = footY - height;
      return { footY, draw: (c, cam) => c.drawImage(sprite, x - cam.x, y - cam.y) };
    });
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

    const drawables = [...this.props, this.playerDrawable()];
    drawables.sort((a, b) => a.footY - b.footY);
    for (const d of drawables) d.draw(ctx, cam);
  }

  /**
   * The ground never changes, so it is drawn once to a canvas the size of the whole map and each
   * frame copies the visible window of it (decisions.md 23).
   */
  private renderGround(): HTMLCanvasElement {
    const { map } = this.town;
    const ground = document.createElement('canvas');
    ground.width = map.width * TILE_SIZE;
    ground.height = map.height * TILE_SIZE;
    const g = ground.getContext('2d');
    if (!g) throw new Error('no 2d context');
    for (let ty = 0; ty < map.height; ty++) {
      for (let tx = 0; tx < map.width; tx++) {
        const id = map.tiles[ty * map.width + tx]!;
        const art = TILE_ART[id];
        g.drawImage(bake(`tile:${id}`, art.source, art.palette), tx * TILE_SIZE, ty * TILE_SIZE);
      }
    }
    return ground;
  }

  private playerDrawable(): Drawable {
    const p = this.town.player;
    const index = p.moving ? 1 + (Math.floor(p.walkMs / WALK_FRAME_MS) % 2) : 0;
    const sprite = bakeDoll(this.town.wardrobe.look, p.facing, index);
    const footY = Math.round(p.y) + FEET_BELOW_CENTRE;
    return {
      footY,
      draw: (c, cam) => {
        const x = Math.round(p.x) - sprite.width / 2 - cam.x;
        c.globalAlpha = 0.35;
        c.fillStyle = PALETTE.ink;
        c.fillRect(x + 3, footY - 1 - cam.y, sprite.width - 6, 2);
        c.globalAlpha = 1;
        c.drawImage(sprite, x, footY - sprite.height - cam.y);
      },
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
