import { TILE_SIZE } from '../config/world';
import { FURNITURE } from '../data/furniture';
import type { Placed, Room } from '../data/home';
import {
  DOOR_MAT_ART,
  FLOORING_ART,
  FURNITURE_ART,
  furnitureSprite,
  WALLPAPER_ART,
} from '../sprites/furniture';
import { PALETTE } from '../sprites/palette';
import { footprint } from '../systems/decor';
import type { FlooringId, WallpaperId } from '../types/ids';
import type { Point } from './camera';
import { SHADOW_ALPHA } from './ground';
import { bake } from '../sprites/bake';
import { bakeOld } from './legacy';
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

/** A piece of furniture as it stands (or hangs, or lies) in a room. */
export function pieceSprite(piece: Placed): PieceSprite {
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
    const lx = flip ? sprite.width - (1 + l.x) : l.x;
    s.lights.push({ x: x + lx, y: y + l.y, radius: l.radius });
  }
  return s;
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
 * bottom of the wall, its shadow on the floor, and the door mat. The paper and boards are still
 * version 0's tiles, at 2×; the room round them is drawn at 32.
 */
export function roomShell(
  room: Room,
  wallpaper: WallpaperId,
  flooring: FlooringId,
): HTMLCanvasElement {
  const key = `${wallpaper}:${flooring}:${room.width}x${room.height}`;
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
  const paperTile = bakeOld(`wallpaper:${wallpaper}`, paper.source, paper.palette);
  const floorTile = bakeOld(`flooring:${flooring}`, floor.source, floor.palette);
  for (let ty = 0; ty < room.height; ty++) {
    for (let tx = 0; tx < room.width; tx++) {
      g.drawImage(ty < room.wallRows ? paperTile : floorTile, tx * T, ty * T);
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
  const mat = bakeOld('doorMat', DOOR_MAT_ART.source, DOOR_MAT_ART.palette);
  g.drawImage(mat, room.mat.tx * T, room.mat.ty * T);
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
