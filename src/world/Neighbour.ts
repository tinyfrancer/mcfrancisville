import { TILE_SIZE } from '../config/world';
import { findPath, type Tile } from '../systems/pathfinding';
import type { Facing, VillagerId } from '../types/ids';

/** Two and a half tiles a second: an amble, slower than she walks, so she can always catch them. */
export const AMBLE_SPEED = 2.5 * TILE_SIZE;

export interface Ground {
  canWalk(tx: number, ty: number): boolean;
  width: number;
  height: number;
}

/**
 * A villager out in town: where they stand, which way they face, and the path to wherever the
 * clock says they should be. They're never solid, so they can't block her way or each other's.
 */
export class Neighbour {
  readonly id: VillagerId;
  x: number;
  y: number;
  facing: Facing = 'down';
  moving = false;
  /** Time spent walking since they last stood still; the walk cycle is read off it. */
  walkMs = 0;
  private path: Tile[] = [];
  private headedFor: Tile | null = null;

  constructor(id: VillagerId, at: Tile) {
    this.id = id;
    ({ x: this.x, y: this.y } = centreOf(at));
  }

  get tile(): Tile {
    return { tx: Math.floor(this.x / TILE_SIZE), ty: Math.floor(this.y / TILE_SIZE) };
  }

  /** Stands them straight on a tile, with nowhere to go. */
  place(at: Tile): void {
    ({ x: this.x, y: this.y } = centreOf(at));
    this.path = [];
    this.headedFor = at;
    this.stand();
  }

  /**
   * Walks toward `goal` for `deltaMs`. A villager who is `held` (she's talking to them, or on her
   * way to) finishes the step they're on and waits there, going on once she's done. One who can find no way there is simply
   * there: better to skip a walk than to be stuck behind the pop-up shop all afternoon.
   */
  step(deltaMs: number, goal: Tile, ground: Ground, held: boolean): void {
    if (!sameTile(goal, this.headedFor)) {
      this.headedFor = goal;
      const from = this.tile;
      const path = findPath(from, goal, ground.canWalk, ground.width, ground.height);
      if (path === null) {
        this.place(goal);
        return;
      }
      this.path = path;
    }
    if (this.path.length === 0 || (held && this.atCentre())) {
      this.stand();
      return;
    }
    this.moving = true;
    this.walkMs += deltaMs;
    let budget = (AMBLE_SPEED * deltaMs) / 1000;
    while (budget > 0 && this.path.length > 0) {
      const next = centreOf(this.path[0]!);
      const dx = next.x - this.x;
      const dy = next.y - this.y;
      const dist = Math.hypot(dx, dy);
      if (dist > 0) this.facing = facingFor(dx, dy);
      if (dist <= budget) {
        this.x = next.x;
        this.y = next.y;
        budget -= dist;
        this.path.shift();
        if (held) break;
      } else {
        this.x += (dx / dist) * budget;
        this.y += (dy / dist) * budget;
        budget = 0;
      }
    }
    if (this.path.length === 0) this.stand();
  }

  private atCentre(): boolean {
    const c = centreOf(this.tile);
    return c.x === this.x && c.y === this.y;
  }

  /** Turns to look at a point, as they do when she's close by. */
  face(x: number, y: number): void {
    if (this.moving) return;
    const dx = x - this.x;
    const dy = y - this.y;
    if (dx !== 0 || dy !== 0) this.facing = facingFor(dx, dy);
  }

  private stand(): void {
    this.moving = false;
    this.walkMs = 0;
  }
}

function centreOf(t: Tile): { x: number; y: number } {
  return { x: t.tx * TILE_SIZE + TILE_SIZE / 2, y: t.ty * TILE_SIZE + TILE_SIZE / 2 };
}

function sameTile(a: Tile, b: Tile | null): boolean {
  return b !== null && a.tx === b.tx && a.ty === b.ty;
}

export function facingFor(dx: number, dy: number): Facing {
  if (Math.abs(dx) > Math.abs(dy)) return dx > 0 ? 'right' : 'left';
  return dy > 0 ? 'down' : 'up';
}
