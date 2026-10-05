import { TILE_SIZE } from '../config/world';
import { FURNITURE } from '../data/furniture';
import type { Placed, Room } from '../data/home';
import { FURNITURE_ART, furnitureSprite } from '../sprites/furniture';
import { DOOR_MAT_ART, FLOORING_ART, WALLPAPER_ART } from '../sprites/surfaces';
import { windowArt } from '../sprites/wallsAndFloors';
import { WATCHERS, type Glance } from '../sprites/setsTwo';
import { isWindowPaper, type WindowSky } from '../data/wallsAndFloors';
import { windowsAlong } from '../systems/windowSky';
import { DOORWAY_ART, DOORWAY_HEIGHT, DOORWAY_OVERHANG } from '../sprites/doorway';
import { PALETTE } from '../sprites/palette';
import { footprint } from '../systems/decor';
import type { FlooringId, WallpaperId } from '../types/ids';
import type { Point } from './camera';
import { SHADOW_ALPHA } from './ground';
import { bake, bakeLayers } from '../sprites/bake';
import { isDisplayPiece, isSetPiece } from '../data/display';
import { showcaseLayers } from '../sprites/display';
import type { ItemId } from '../types/ids';
import type { BroomLook } from '../data/broom';
import { broomStandArt, lookKey } from '../sprites/broom';
import { glowOf, type WorldLight } from './scene';

/*
 * What every room shares, her home's and the town's buildings' alike (phase H): the walls and
 * floor, the frame round them, and how a piece of furniture is placed in it.
 */

/** How far a room at night is lifted toward daylight: indoors is cozy, never dark. */
export const INDOOR_SOFTEN = 0.5;

/** How a placed piece is drawn: its picture, where, and what of it glows. */
export interface PieceSprite {
  piece: Placed;
  sprite: HTMLCanvasElement;
  x: number;
  y: number;
  footY: number;
  glow?: HTMLCanvasElement;
  lights: WorldLight[];
}

/**
 * A piece of furniture as it stands (or hangs, or lies) in a room. Her broom's stand is drawn in
 * her broom's colours, when she has them (0.2's P1); a piece that shows things off, with
 * `contents` in it (0.3's H2); a small piece on a surface, `raised` to its top (0.3's H3); a
 * portrait looking toward `herX`, where she stands (0.3's S4).
 */
export function pieceSprite(
  piece: Placed,
  broom?: BroomLook,
  contents: readonly ItemId[] = [],
  raised = 0,
  herX?: number,
): PieceSprite {
  const hers = piece.id === 'broomStand' && broom;
  const art = hers ? broomStandArt(broom) : FURNITURE_ART[piece.id];
  const facing = furnitureSprite(piece.id, piece.turn);
  const glance = herX === undefined ? null : glanceAt(piece, herX);
  const watching = glance ? WATCHERS[piece.id as keyof typeof WATCHERS]?.[glance] : undefined;
  const source = watching ?? facing.source;
  const flip = facing.flip;
  const look = watching ? `:${glance}` : '';
  const key = `furniture:${piece.id}:${piece.turn}${hers ? `:${lookKey(broom)}` : ''}${look}`;
  const id = piece.id;
  const showcase = isSetPiece(id) || isDisplayPiece(id);
  const sprite = showcase
    ? bakeLayers(`${key}:${contents.join(',')}`, () => showcaseLayers(id, contents), {
        flipX: flip,
      })
    : bake(key, source, art.palette, { flipX: flip });
  const { w, h } = footprint(piece.id, piece.turn);
  const layer = FURNITURE[piece.id].layer;
  const footY = (piece.ty + h) * TILE_SIZE;
  const x = piece.tx * TILE_SIZE + (w * TILE_SIZE - sprite.width) / 2;
  const y = (layer === 'floor' ? footY - sprite.height : piece.ty * TILE_SIZE) - raised;
  const s: PieceSprite = { piece, sprite, x, y, footY, lights: [] };
  if (art.glow) {
    s.glow = glowOf(`glow:${key}`, source, art.palette, art.glow, { flipX: flip });
  }
  for (const l of art.lights ?? []) {
    const lx = flip ? sprite.width - (1 + l.x) : l.x;
    s.lights.push({ x: x + lx, y: y + l.y, radius: l.radius });
  }
  return s;
}

/** Which way a piece's eyes look to find her: at her, if she's in front of it, or to her side. */
function glanceAt(piece: Placed, herX: number): Glance {
  const { w } = footprint(piece.id, piece.turn);
  const dx = herX - (piece.tx + w / 2) * TILE_SIZE;
  return dx < -TILE_SIZE ? 'left' : dx > TILE_SIZE ? 'right' : 'ahead';
}

/** The shadow a standing piece casts on the floor. */
export function pieceShadow(s: PieceSprite): { cx: number; cy: number; w: number; h: number } {
  const { w } = footprint(s.piece.id, s.piece.turn);
  return {
    cx: s.piece.tx * TILE_SIZE + (w * TILE_SIZE) / 2,
    cy: s.footY - 4,
    w: w * 28,
    h: 8,
  };
}

const shells = new Map<string, HTMLCanvasElement>();

/**
 * The walls papered and the floor laid, with a moulding along the top, a skirting board along the
 * bottom of the wall, its shadow on the floor, the door mat, and an arch to each room beyond. A
 * wallpaper with windows (0.3's S4) hangs them along the wall, showing `sky`.
 */
export function roomShell(
  room: Room,
  wallpaper: WallpaperId,
  flooring: FlooringId,
  sky: WindowSky = 'day',
  covered: readonly number[] = [],
): HTMLCanvasElement {
  const ways = room.doorways.map((d) => d.tx).join(',');
  const windows = isWindowPaper(wallpaper) ? `:${sky}:${covered.join(',')}` : '';
  const key = `${wallpaper}${windows}:${flooring}:${room.width}x${room.height}:${ways}`;
  const made = shells.get(key);
  if (made) return made;
  const T = TILE_SIZE;
  const width = room.width * T;
  const height = room.height * T;
  const wallHeight = room.wallRows * T;
  const canvas = document.createElement('canvas');
  canvas.width = width;
  canvas.height = height;
  const g = canvas.getContext('2d');
  if (!g) throw new Error('no 2d context');
  g.imageSmoothingEnabled = false;
  const paper = WALLPAPER_ART[wallpaper];
  const floor = FLOORING_ART[flooring];
  const paperTile = bake(`wallpaper:${wallpaper}`, paper.source, paper.palette);
  const floorTile = bake(`flooring:${flooring}`, floor.source, floor.palette);
  for (let ty = 0; ty < room.height; ty++) {
    for (let tx = 0; tx < room.width; tx++) {
      g.drawImage(ty < room.wallRows ? paperTile : floorTile, tx * T, ty * T);
    }
  }
  if (isWindowPaper(wallpaper)) {
    const art = windowArt(wallpaper, sky);
    const pane = bake(`window:${wallpaper}:${sky}`, art.source, art.palette);
    for (const tx of windowsAlong(
      room.width,
      room.doorways.map((d) => d.tx),
      covered,
    )) {
      g.drawImage(pane, tx * T + (T - pane.width) / 2, art.foot - pane.height);
    }
  }
  const band = (y: number, h: number, colour: string) => {
    g.fillStyle = colour;
    g.fillRect(0, y, width, h);
  };
  // The moulding: a dark lip, a lit edge, and its shadow on the paper.
  band(0, 4, PALETTE.barkDark);
  band(4, 2, PALETTE.bark);
  band(6, 1, PALETTE.wood);
  g.globalAlpha = SHADOW_ALPHA;
  band(7, 3, PALETTE.ink);
  g.globalAlpha = 1;
  // The skirting board, lit along its top.
  band(wallHeight - 9, 1, PALETTE.barkDark);
  band(wallHeight - 8, 2, PALETTE.wood);
  band(wallHeight - 6, 5, PALETTE.bark);
  band(wallHeight - 1, 1, PALETTE.barkDark);
  // The wall's shadow on the floor, which is what makes it stand up from it, softening away.
  g.globalAlpha = SHADOW_ALPHA;
  band(wallHeight, 3, PALETTE.ink);
  g.globalAlpha = SHADOW_ALPHA / 2;
  band(wallHeight + 3, 3, PALETTE.ink);
  g.globalAlpha = 1;
  const mat = bake('doorMat', DOOR_MAT_ART.source, DOOR_MAT_ART.palette);
  g.drawImage(mat, room.mat.tx * T, room.mat.ty * T);
  // An arch through the back wall to each room beyond it (0.3's H4), its foot on the floor.
  const arch = bake('doorway', DOORWAY_ART.source, DOORWAY_ART.palette);
  for (const d of room.doorways) {
    g.drawImage(arch, d.tx * T - DOORWAY_OVERHANG, wallHeight - DOORWAY_HEIGHT + 2);
  }
  shells.set(key, canvas);
  return canvas;
}

/** The room's walls seen edge-on round the floor, with the doorway out under the mat. */
export function drawRoomFrame(ctx: CanvasRenderingContext2D, room: Room, cam: Point): void {
  const x = -cam.x;
  const y = -cam.y;
  const width = room.width * TILE_SIZE;
  const height = room.height * TILE_SIZE;
  ctx.fillStyle = PALETTE.dusk;
  ctx.fillRect(x - 8, y - 8, width + 16, height + 16);
  ctx.fillStyle = PALETTE.plum;
  ctx.fillRect(x - 8, y + height, width + 16, 2);
  ctx.fillStyle = PALETTE.stoneLight;
  ctx.fillRect(x + room.mat.tx * TILE_SIZE + 4, y + height, TILE_SIZE - 8, 8);
}
