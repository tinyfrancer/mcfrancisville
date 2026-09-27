import { TILE_SIZE } from '../config/world';
import { findPath, stringPull, type Tile } from '../systems/pathfinding';
import type { Facing } from '../types/ids';
import { facingFor } from './Neighbour';
import type { Zone } from './zones/Zone';

/** Four tiles a second: brisk enough to cross town in under ten, slow enough to feel like a stroll. */
export const WALK_SPEED = 4 * TILE_SIZE;

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

/** How many steps apart two tiles are, diagonals counting one. */
export function reach(a: Tile, b: Tile): number {
  return Math.max(Math.abs(a.tx - b.tx), Math.abs(a.ty - b.ty));
}

/**
 * The open tiles all round `at` she could stand on to reach it, or just where she stands if she can
 * reach it from there already (`within` steps: 1 for someone beside her, 0 or 1 for a critter).
 */
export function besideGoals(at: Tile, here: Tile, zone: Zone, within: 0 | 1): Tile[] {
  const d = reach(here, at);
  if (d <= 1 && d >= 1 - within && (d === 0 || zone.canWalk(here.tx, here.ty))) return [here];
  const goals: Tile[] = [];
  for (let y = at.ty - 1; y <= at.ty + 1; y++) {
    for (let x = at.tx - 1; x <= at.tx + 1; x++) {
      if ((x !== at.tx || y !== at.ty) && zone.canWalk(x, y)) goals.push({ tx: x, ty: y });
    }
  }
  return goals;
}

/**
 * How far her body reaches either side of her middle, in tiles, for cutting corners: a shade under
 * half a tile, so she can walk a one-tile gap but never brushes what's solid beside it.
 */
const BODY_RADIUS = 7 / 16;

/** Her walking: where she is, the way she faces, and the path she's on. */
export class Movement {
  readonly player: Player;
  /** Where she is headed, for the view's sparkle. Null once she arrives. */
  target: Tile | null = null;
  /** The corners of her way there, in world pixels. */
  private path: { x: number; y: number }[] = [];

  constructor(start: Tile, facing: Facing) {
    this.player = { ...tileCentre(start), facing, moving: false, walkMs: 0 };
  }

  /** The tile she's standing on, or in, mid-step. */
  get tile(): Tile {
    return tileOf(this.player.x, this.player.y);
  }

  get walking(): boolean {
    return this.path.length > 0;
  }

  /**
   * Sets off by the quickest way across `zone` to whichever of `goals` is nearest. False, and she
   * stays put, if none can be reached. A walk of no steps (she's already there) is true, and
   * leaves her standing.
   */
  walkTo(goals: readonly Tile[], zone: Zone): boolean {
    const here = this.tile;
    let best: Tile[] | null = null;
    for (const goal of goals) {
      const path = findPath(here, goal, zone.canWalk, zone.width, zone.height);
      if (path && (!best || path.length < best.length)) best = path;
    }
    if (!best) return false;
    this.target = best.at(-1) ?? here;
    // In tile units, with her own tile's middle first: from part way along a step, heading straight
    // for the next tile could shave the corner of whatever she's walking past, and the pull leaves
    // it out whenever it wouldn't.
    const p = this.player;
    const from = { x: p.x / TILE_SIZE, y: p.y / TILE_SIZE };
    const middles = [here, ...best].map((t) => ({ x: t.tx + 0.5, y: t.ty + 0.5 }));
    this.path = stringPull(from, middles, zone.canWalk, BODY_RADIUS)
      .map((t) => ({ x: t.x * TILE_SIZE, y: t.y * TILE_SIZE }))
      .filter((w, i) => i > 0 || w.x !== p.x || w.y !== p.y);
    if (this.path.length === 0) this.halt();
    else p.moving = true;
    return true;
  }

  /**
   * Walks on for `deltaMs`, spending the frame's whole travel across as many tiles as it covers, so
   * a long frame on a slow phone lands exactly where a smooth one would. The tile she arrived on,
   * the step she gets there; null otherwise.
   */
  step(deltaMs: number): Tile | null {
    if (this.path.length === 0) return null;
    const p = this.player;
    let budget = (WALK_SPEED * deltaMs) / 1000;
    p.moving = true;
    p.walkMs += deltaMs;
    while (budget > 0 && this.path.length > 0) {
      const next = this.path[0]!;
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
    if (this.path.length > 0) return null;
    this.halt();
    return this.tile;
  }

  /** Stands her straight on a tile, facing a way, going nowhere. */
  standAt(tile: Tile, facing: Facing): void {
    Object.assign(this.player, tileCentre(tile), { facing });
    this.halt();
  }

  /** Stops where she is, with nowhere left to go. */
  halt(): void {
    this.path = [];
    this.player.moving = false;
    this.player.walkMs = 0;
    this.target = null;
  }

  /** Turns her toward a point in the world, unless it's right where she stands. */
  face(x: number, y: number): void {
    if (x !== this.player.x || y !== this.player.y) {
      this.player.facing = facingFor(x - this.player.x, y - this.player.y);
    }
  }
}
