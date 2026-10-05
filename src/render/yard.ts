import { TILE_SIZE } from '../config/world';
import type { Placed } from '../data/home';
import { surfaceTop } from '../data/tabletop';
import { PALETTE } from '../sprites/palette';
import { footprint } from '../systems/decor';
import type { Tile } from '../systems/pathfinding';
import type { World } from '../world/World';
import type { Point } from './camera';
import { pieceShadow, pieceSprite, type PieceSprite } from './room';
import type { Drawable, WorldLight } from './scene';

/*
 * Her yard (0.3's H5), drawn among the town's props: each piece of hers as it would stand in a
 * room, its shadow on the grass, and while she decorates, the lawn it may go on and the piece she
 * has picked up.
 */

/** A piece she has picked up floats this far above where it stands, as indoors. */
const LIFT = 4;

/** Every piece out in her yard as it's drawn, what stands on a surface raised to its top. */
export function yardSprites(world: World): PieceSprite[] {
  const { yard } = world;
  return yard.placed.map((p) => {
    const under = yard.surfaceUnder(p);
    return pieceSprite(p, undefined, [], under ? surfaceTop(under.id) : 0);
  });
}

/** The pieces in her yard, sorted in among everything else, and the light their lamps give. */
export function yardDrawables(world: World): { drawables: Drawable[]; lights: WorldLight[] } {
  const selected = world.decorating.outdoors ? world.decorating.state?.selected : null;
  const lifted = (p: Placed) =>
    !!selected && (p === selected || world.yard.surfaceUnder(p) === selected);
  const drawables: Drawable[] = [];
  const lights: WorldLight[] = [];
  for (const s of yardSprites(world)) {
    const lift = lifted(s.piece) ? LIFT : 0;
    const d: Drawable = s.piece.on
      ? { footY: s.footY + 0.5, sprite: s.sprite, x: s.x, y: s.y - lift }
      : { footY: s.footY, sprite: s.sprite, x: s.x, y: s.y - lift, shadow: pieceShadow(s) };
    if (s.glow) d.glow = s.glow;
    drawables.push(d);
    lights.push(...s.lights.map((l) => ({ ...l, y: l.y - lift })));
  }
  return { drawables, lights };
}

/** While she decorates her yard: faint dots on the lawn a piece may go on, under everything. */
export function drawLawn(ctx: CanvasRenderingContext2D, world: World, cam: Point): void {
  if (!world.decorating.outdoors) return;
  ctx.globalAlpha = 0.5;
  ctx.fillStyle = PALETTE.ghost;
  for (const t of world.yard.lawn()) {
    const x = t.tx * TILE_SIZE - cam.x;
    const y = t.ty * TILE_SIZE - cam.y;
    for (const [dx, dy] of [
      [3, 3],
      [TILE_SIZE - 5, 3],
      [3, TILE_SIZE - 5],
      [TILE_SIZE - 5, TILE_SIZE - 5],
    ] as const) {
      ctx.fillRect(x + dx, y + dy, 2, 2);
    }
  }
  ctx.globalAlpha = 1;
}

/** A breathing candle-coloured outline round the piece she has picked up in her yard. */
export function drawPicked(
  ctx: CanvasRenderingContext2D,
  world: World,
  cam: Point,
  nowMs: number,
): void {
  const piece = world.decorating.outdoors ? world.decorating.state?.selected : null;
  if (piece) {
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
  }
  ctx.globalAlpha = 1;
}

/**
 * The tile of the frontmost piece in her yard whose picture has a pixel at `at`, so a tap on the
 * back of her bench is the bench; for a piece wider than a tile, the column under her finger.
 */
export function yardPieceHit(world: World, at: Point): Tile | null {
  const standing = yardSprites(world).sort(
    (a, b) => b.footY + (b.piece.on ? 0.5 : 0) - (a.footY + (a.piece.on ? 0.5 : 0)),
  );
  for (const s of standing) {
    const x = Math.floor(at.x - s.x);
    const y = Math.floor(at.y - s.y);
    if (x < 0 || y < 0 || x >= s.sprite.width || y >= s.sprite.height) continue;
    const alpha = s.sprite.getContext('2d')?.getImageData(x, y, 1, 1).data[3] ?? 0;
    if (alpha === 0) continue;
    const { w, h } = footprint(s.piece.id, s.piece.turn);
    const column = Math.floor(at.x / TILE_SIZE);
    return {
      tx: Math.min(Math.max(column, s.piece.tx), s.piece.tx + w - 1),
      ty: s.piece.ty + h - 1,
    };
  }
  return null;
}
