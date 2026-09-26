import { TOWN, type MapSource } from '../data/maps';
import type { SavedPlayer } from '../persistence/SaveState';
import { TILE_SIZE } from '../config/world';
import { parseMap, walkable, type TileMap } from '../systems/grid';
import { findPath, type Tile } from '../systems/pathfinding';
import type { Facing } from '../types/ids';

/** Four tiles a second: brisk enough to cross town in under ten, slow enough to feel like a stroll. */
export const WALK_SPEED = 4 * TILE_SIZE;

/** Moments the view draws and the sound plays; state the view reads off the town instead. */
export type WorldEvent = { kind: 'arrived'; tx: number; ty: number };

export interface Player {
  /** World pixels, at the centre of her feet's tile when she stands still. */
  x: number;
  y: number;
  facing: Facing;
  moving: boolean;
  /** Time spent walking since she last stood still; the walk cycle is read off it. */
  walkMs: number;
}

export function tileCentre(t: Tile): { x: number; y: number } {
  return { x: t.tx * TILE_SIZE + TILE_SIZE / 2, y: t.ty * TILE_SIZE + TILE_SIZE / 2 };
}

export function tileOf(x: number, y: number): Tile {
  return { tx: Math.floor(x / TILE_SIZE), ty: Math.floor(y / TILE_SIZE) };
}

/**
 * The town and everyone in it, with no idea it is being drawn (decisions.md 9). The view reads it
 * once a frame and calls `tapTile`; nothing else reaches in.
 */
export class Town {
  readonly map: TileMap;
  readonly player: Player;
  /** Where she is headed, for the view's sparkle. Null once she arrives. */
  target: Tile | null = null;
  private path: Tile[] = [];

  /**
   * `saved` puts her back where she was. If that tile has stopped being somewhere she can stand (a
   * later map put a tree on it), she starts at her door instead of inside the tree.
   */
  constructor(source: MapSource = TOWN, saved?: SavedPlayer) {
    this.map = parseMap(source);
    const startTile = saved && walkable(this.map, saved.tx, saved.ty) ? saved : this.map.spawn;
    const facing = saved?.facing ?? 'down';
    this.player = { ...tileCentre(startTile), facing, moving: false, walkMs: 0 };
  }

  /** What of her is worth saving: the tile she is on and the way she faces. */
  snapshot(): SavedPlayer {
    const { tx, ty } = tileOf(this.player.x, this.player.y);
    return { tx, ty, facing: this.player.facing };
  }

  canWalk = (tx: number, ty: number): boolean => walkable(this.map, tx, ty);

  /**
   * Walk to a tapped tile. A tap on something solid (a tree, a house) walks to the open tile beside
   * it that is quickest to reach, which is where later phases will have her talk, pick or open.
   * Returns false when there is nowhere to go.
   */
  tapTile(tx: number, ty: number): boolean {
    const here = tileOf(this.player.x, this.player.y);
    const goals = this.canWalk(tx, ty) ? [{ tx, ty }] : this.openTilesBeside(tx, ty);
    let best: Tile[] | null = null;
    for (const goal of goals) {
      const path = findPath(here, goal, this.canWalk, this.map.width, this.map.height);
      if (path && (!best || path.length < best.length)) best = path;
    }
    if (!best) return false;

    // Back to the middle of her own tile first: heading straight for the next one from part way
    // along a step could shave the corner of whatever she is walking past.
    const centre = tileCentre(here);
    const offCentre = centre.x !== this.player.x || centre.y !== this.player.y;
    this.path = offCentre ? [here, ...best] : best;
    this.target = best.at(-1) ?? here;
    if (this.path.length === 0) this.stop();
    else this.player.moving = true;
    return true;
  }

  update(deltaMs: number): WorldEvent[] {
    const events: WorldEvent[] = [];
    if (this.path.length === 0) return events;
    const p = this.player;
    let budget = (WALK_SPEED * deltaMs) / 1000;
    p.moving = true;
    p.walkMs += deltaMs;

    // Spend the frame's whole travel, across as many tiles as it covers, so a long frame on a slow
    // phone lands exactly where a smooth one would.
    while (budget > 0 && this.path.length > 0) {
      const next = tileCentre(this.path[0]!);
      const dx = next.x - p.x;
      const dy = next.y - p.y;
      const dist = Math.hypot(dx, dy);
      if (dist > 0) p.facing = facingFor(dx, dy);
      if (dist <= budget) {
        p.x = next.x;
        p.y = next.y;
        budget -= dist;
        this.path.shift();
      } else {
        p.x += (dx / dist) * budget;
        p.y += (dy / dist) * budget;
        budget = 0;
      }
    }

    if (this.path.length === 0) {
      const here = tileOf(p.x, p.y);
      events.push({ kind: 'arrived', tx: here.tx, ty: here.ty });
      this.stop();
    }
    return events;
  }

  private stop(): void {
    this.player.moving = false;
    this.player.walkMs = 0;
    this.target = null;
  }

  private openTilesBeside(tx: number, ty: number): Tile[] {
    const prop = this.map.props.find(
      (p) => tx >= p.tx && tx < p.tx + p.w && ty >= p.ty && ty < p.ty + p.h,
    );
    const box = prop ?? { tx, ty, w: 1, h: 1 };
    const open: Tile[] = [];
    for (let y = box.ty - 1; y <= box.ty + box.h; y++) {
      for (let x = box.tx - 1; x <= box.tx + box.w; x++) {
        const inside = x >= box.tx && x < box.tx + box.w && y >= box.ty && y < box.ty + box.h;
        if (!inside && this.canWalk(x, y)) open.push({ tx: x, ty: y });
      }
    }
    return open;
  }
}

function facingFor(dx: number, dy: number): Facing {
  if (Math.abs(dx) > Math.abs(dy)) return dx > 0 ? 'right' : 'left';
  return dy > 0 ? 'down' : 'up';
}
