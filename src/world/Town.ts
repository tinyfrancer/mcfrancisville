import { TOWN, type MapSource } from '../data/maps';
import type { SavedPlayer } from '../persistence/SaveState';
import { TILE_SIZE } from '../config/world';
import { PATCHES, PROP_YIELDS } from '../data/gathering';
import { dayKey, systemClock, type Clock } from '../systems/clock';
import {
  isReady,
  patchKey,
  propKey,
  pruneTaken,
  SNACK_KEY,
  snackTonight,
  type Snack,
} from '../systems/gathering';
import { parseMap, walkable, type PlacedProp, type TileMap } from '../systems/grid';
import { findPath, type Tile } from '../systems/pathfinding';
import type { Facing, ItemId, PropId } from '../types/ids';
import { Bag, type Stack } from './Bag';
import { EventBus } from './eventBus';
import { Wardrobe, type ClosetSnapshot } from './Wardrobe';

/** Four tiles a second: brisk enough to cross town in under ten, slow enough to feel like a stroll. */
export const WALK_SPEED = 4 * TILE_SIZE;

/** Where something she gathered came from: a tree or rock, a flower patch, or the night's snack. */
export type GatherSource = PropId | 'flowers' | 'snack';

/**
 * Moments the view draws and the sound plays; state the view reads off the town instead. `at` is
 * the prop she was tapped over to, when she walked to one rather than to open ground. `resting` is
 * something that has already given what it gives today, and will again tomorrow.
 */
export type WorldEvent =
  | { kind: 'arrived'; tx: number; ty: number; at?: PropId }
  | { kind: 'gathered'; from: GatherSource; item: ItemId; count: number }
  | { kind: 'resting'; from: GatherSource; item: ItemId };

/** The state the HUD follows (decisions.md 9). */
export interface TownState extends Record<string, unknown> {
  bag: readonly Stack[];
}

/** What of her finds is saved: the bag, and what she has taken today. */
export interface FindsSnapshot {
  bag: Stack[];
  taken: Record<string, string>;
}

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

export interface TownOptions {
  map?: MapSource;
  /** Where she was when the game was last saved. */
  player?: SavedPlayer;
  closet?: Partial<ClosetSnapshot>;
  finds?: Partial<FindsSnapshot>;
  clock?: Clock;
}

/**
 * The town and everyone in it, with no idea it is being drawn (decisions.md 9). The view reads it
 * once a frame and calls `tapTile`; nothing else reaches in.
 */
export class Town {
  readonly map: TileMap;
  readonly player: Player;
  readonly wardrobe: Wardrobe;
  /** The phone's clock, or a test's (decisions.md 4). */
  readonly clock: Clock;
  readonly bag: Bag;
  readonly events = new EventBus<TownState>();
  /** What she has taken, and on which day; see `systems/gathering.ts`. */
  private taken: Record<string, string>;
  /** Where she is headed, for the view's sparkle. Null once she arrives. */
  target: Tile | null = null;
  private path: Tile[] = [];
  /** The prop she is walking to, said on arrival so the game can open it. */
  private visiting: PlacedProp | undefined;
  /** An arrival with no walk, made by the next `update` so every arrival comes from one place. */
  private arrivedInPlace: Tile | null = null;

  /**
   * `saved` puts her back where she was. If that tile has stopped being somewhere she can stand (a
   * later map put a tree on it), she starts at her door instead of inside the tree.
   */
  constructor(options: TownOptions = {}) {
    const saved = options.player;
    this.map = parseMap(options.map ?? TOWN);
    this.clock = options.clock ?? systemClock;
    this.wardrobe = new Wardrobe(options.closet);
    this.bag = new Bag(options.finds?.bag);
    this.taken = { ...options.finds?.taken };
    const startTile = saved && walkable(this.map, saved.tx, saved.ty) ? saved : this.map.spawn;
    const facing = saved?.facing ?? 'down';
    this.player = { ...tileCentre(startTile), facing, moving: false, walkMs: 0 };
  }

  /** What of her is worth saving: the tile she is on and the way she faces. */
  snapshot(): SavedPlayer {
    const { tx, ty } = tileOf(this.player.x, this.player.y);
    return { tx, ty, facing: this.player.facing };
  }

  /** Her bag, and today's takings; yesterday's are dropped, since they no longer mean anything. */
  finds(): FindsSnapshot {
    return { bag: this.bag.snapshot(), taken: pruneTaken(this.taken, this.clock.now()) };
  }

  /** Whether a tree, rock or patch (by its key in `systems/gathering.ts`) has anything to give today. */
  isReady(key: string): boolean {
    return isReady(this.taken, key, this.clock.now());
  }

  /** Tonight's snack, where it waits, until she finds it. Null by day. */
  snack(): Snack | null {
    return snackTonight(this.map.snackSpots, this.taken, this.clock.now());
  }

  canWalk = (tx: number, ty: number): boolean => walkable(this.map, tx, ty);

  /**
   * Walk to a tapped tile. A tap on something solid (a tree, a house) walks to the open tile beside
   * it that is quickest to reach, which is where later phases will have her talk, pick or open.
   * Returns false when there is nowhere to go.
   */
  tapTile(tx: number, ty: number): boolean {
    const here = tileOf(this.player.x, this.player.y);
    const prop = this.propAt(tx, ty);
    const goals = this.canWalk(tx, ty) ? [{ tx, ty }] : this.openTilesBeside(tx, ty);
    let best: Tile[] | null = null;
    for (const goal of goals) {
      const path = findPath(here, goal, this.canWalk, this.map.width, this.map.height);
      if (path && (!best || path.length < best.length)) best = path;
    }
    if (!best) return false;
    this.visiting = prop;
    this.arrivedInPlace = null;

    // Back to the middle of her own tile first: heading straight for the next one from part way
    // along a step could shave the corner of whatever she is walking past.
    const centre = tileCentre(here);
    const offCentre = centre.x !== this.player.x || centre.y !== this.player.y;
    this.path = offCentre ? [here, ...best] : best;
    this.target = best.at(-1) ?? here;
    if (this.path.length === 0) {
      this.stop();
      this.arrivedInPlace = here;
    } else {
      this.player.moving = true;
    }
    return true;
  }

  update(deltaMs: number): WorldEvent[] {
    const events: WorldEvent[] = [];
    if (this.arrivedInPlace) {
      events.push(...this.arrival(this.arrivedInPlace));
      this.arrivedInPlace = null;
    }
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
      events.push(...this.arrival(tileOf(p.x, p.y)));
      this.stop();
    }
    return events;
  }

  /**
   * She has arrived, and anything there that gives something is gathered: the tree or rock she
   * walked up to, the flowers she walked onto, or the night's snack where it waits.
   */
  private arrival(here: Tile): WorldEvent[] {
    const arrived: WorldEvent = { kind: 'arrived', tx: here.tx, ty: here.ty };
    const events: WorldEvent[] = [arrived];
    const prop = this.visiting;
    this.visiting = undefined;

    if (prop) {
      arrived.at = prop.id;
      const give = PROP_YIELDS[prop.id];
      if (give) events.push(this.gather(propKey(prop), prop.id, give.item, give.count));
    }
    const patch = this.map.patches.find((p) => p.tx === here.tx && p.ty === here.ty);
    if (patch && !prop) {
      const give = PATCHES[patch.id];
      events.push(this.gather(patchKey(patch), 'flowers', give.item, give.count));
    }
    const snack = this.snack();
    if (snack && snack.tx === here.tx && snack.ty === here.ty && !prop) {
      events.push(this.gather(SNACK_KEY, 'snack', snack.item, 1));
    }
    return events;
  }

  private gather(key: string, from: GatherSource, item: ItemId, count: number): WorldEvent {
    if (!this.isReady(key)) return { kind: 'resting', from, item };
    this.taken[key] = dayKey(this.clock.now());
    this.bag.add(item, count);
    this.events.emit('bag', this.bag.contents);
    return { kind: 'gathered', from, item, count };
  }

  private propAt(tx: number, ty: number) {
    return this.map.props.find(
      (p) => tx >= p.tx && tx < p.tx + p.w && ty >= p.ty && ty < p.ty + p.h,
    );
  }

  private stop(): void {
    this.player.moving = false;
    this.player.walkMs = 0;
    this.target = null;
  }

  private openTilesBeside(tx: number, ty: number): Tile[] {
    const box = this.propAt(tx, ty) ?? { tx, ty, w: 1, h: 1 };
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
