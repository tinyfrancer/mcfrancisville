import { TILE_SIZE } from '../config/world';
import { PETS } from '../data/pets';
import { findPath, type Tile } from '../systems/pathfinding';
import { florenceAwake, habitBubble, roamGoal, zoomies, type Bubble } from '../systems/pets';
import type { Facing, PetId, SceneId } from '../types/ids';
import type { Ground } from './Neighbour';

/**
 * How a pet is standing: on its feet, trotting, sitting beside her, or, for Florence, asleep
 * under her blanket, and for Elvira, curled up in a ball.
 */
export type PetPose = 'stand' | 'walk' | 'sit' | 'sleep' | 'curl';

/** Beyond this many tiles from her, a pet following her is simply beside her again. */
export const CATCH_UP_TILES = 10;

/** How long she stands still before Florence nods off, and Elvira comes to curl up by her. */
export const NAP_AFTER_MS = 2500;
export const CUDDLE_AFTER_MS = 1500;

/** How long between Dolly's barks at the same neighbour, and how long a bark shows. */
export const BARK_EVERY_MS = 12_000;
const BARK_MS = 1400;

/** Wybie's top speed, with the zoomies. */
const ZOOM_SPEED = 9;
/** How fast a pet ambles about at home, in tiles a second, when it isn't following her. */
const AMBLE = 2.2;

/** Her, as a pet sees her. */
export interface Her {
  x: number;
  y: number;
  facing: Facing;
  moving: boolean;
  /** How long she has been standing still. */
  stillMs: number;
}

/** What a pet takes in each step. */
export interface PetSurroundings {
  now: number;
  ground: Ground;
  her: Her;
  /** Walking with her, rather than pottering about at home. */
  following: boolean;
  /** She is walking up to it, or has its sheet open, so it waits for her. */
  held: boolean;
  /** Where her neighbours are standing, for Dolly to bark at. */
  villagers: readonly Tile[];
  /** The open tiles it can wander to at home. */
  roam: readonly Tile[];
  /** Fibi's had a bone back today. */
  happy: boolean;
}

/**
 * One of her pets, where it is and what it's up to. Everything it does is worked out as it goes,
 * from where she is and the clock: nothing about it is saved but its name and its accessory
 * (decisions.md 68). Like the neighbours, it's never solid.
 */
export class Pet {
  readonly id: PetId;
  /** Which of the places it's in: at home, or out in town with her. */
  scene: SceneId = 'home';
  x = 0;
  y = 0;
  /** Pets are drawn side on, so they only ever face left or right. */
  facing: 'left' | 'right' = 'right';
  moving = false;
  walkMs = 0;
  pose: PetPose = 'stand';
  private said: { bubble: Bubble; until: number } | null = null;
  private path: Tile[] = [];
  private headedFor: Tile | null = null;
  private barkedAt = -Infinity;
  /** Where Dolly is hiding from, while she hides behind her. */
  private hidingFrom: Tile | null = null;
  /** Which stretch of time Wybie last had the zoomies in, so he runs one lap a stretch. */
  private zoomSlot = -1;
  private zooming = false;

  constructor(id: PetId, at: Tile) {
    this.id = id;
    this.place(at);
  }

  get tile(): Tile {
    return { tx: Math.floor(this.x / TILE_SIZE), ty: Math.floor(this.y / TILE_SIZE) };
  }

  /** Puts it straight on a tile, with nowhere to go. */
  place(at: Tile): void {
    ({ x: this.x, y: this.y } = centreOf(at));
    this.path = [];
    this.headedFor = null;
    this.zooming = false;
    this.moving = false;
    this.walkMs = 0;
  }

  /** Something it says for a moment: a heart as she pets it, say. */
  say(bubble: Bubble, now: number, forMs: number): void {
    this.said = { bubble, until: now + forMs };
  }

  /** What it's saying now, if anything: something it was given to say, or one of its habits. */
  bubble(now: number, happy = false): Bubble | null {
    if (this.said && now < this.said.until) return this.said.bubble;
    if (this.pose === 'sleep') return 'zzz';
    return habitBubble(this.id, now, happy);
  }

  /** Turns to look at a point. */
  face(x: number): void {
    if (x !== this.x) this.facing = x > this.x ? 'right' : 'left';
  }

  update(deltaMs: number, s: PetSurroundings): void {
    if (!s.ground.canWalk(this.tile.tx, this.tile.ty) && !this.moving) {
      // Something was put down where it was sitting: up it gets, and over to somewhere open.
      const open = nearestOpen(this.tile, s.ground);
      if (open) this.place(open);
    }
    if (s.held) {
      this.settle(deltaMs, s.ground);
      if (!this.moving) {
        this.face(s.her.x);
        this.pose = 'sit';
      }
      return;
    }
    if (s.following) this.follow(deltaMs, s);
    else this.potter(deltaMs, s);
  }

  /** Walking with her: close behind while she walks, and up to its habits when she stops. */
  private follow(deltaMs: number, s: PetSurroundings): void {
    const her = tileOf(s.her.x, s.her.y);
    const me = this.tile;
    if (reach(me, her) > CATCH_UP_TILES) {
      // Out of sight, and back at her side: even Gary, who always turns up somehow.
      const beside = this.behind(s) ?? nearestOpen(her, s.ground);
      if (beside) this.place(beside);
      return;
    }
    const speed = PETS[this.id].speed * (reach(me, her) > 2 && this.id !== 'gary' ? 1.4 : 1);
    if (s.her.moving) {
      this.hidingFrom = null;
      this.zooming = false;
      if (this.pose === 'sleep' || this.pose === 'curl') this.pose = 'stand';
      const goal = this.behind(s);
      if (goal && reach(me, her) > 1) this.walk(deltaMs, goal, speed, s.ground);
      else this.settle(deltaMs, s.ground);
      return;
    }

    if (this.id === 'dolly') this.barkAt(s, her);
    if (this.id === 'wybie' && this.zoom(deltaMs, s, her)) return;

    let goal: Tile | null = null;
    if (this.hidingFrom) goal = this.awayFrom(this.hidingFrom, her, s.ground);
    else if (this.id === 'elvira' && s.her.stillMs >= CUDDLE_AFTER_MS) goal = this.cuddleBy(her, s);
    else if (reach(me, her) > 1 || sameTile(me, her)) goal = this.behind(s);
    if (goal && !sameTile(goal, me)) {
      this.walk(deltaMs, goal, speed, s.ground);
      return;
    }
    this.settle(deltaMs, s.ground);
    if (this.moving) return;
    this.face(s.her.x);
    if (this.id === 'elvira' && s.her.stillMs >= CUDDLE_AFTER_MS) this.pose = 'curl';
    else if (this.id === 'florence' && s.her.stillMs >= NAP_AFTER_MS) this.pose = 'sleep';
    else if (this.pose !== 'sleep' && this.pose !== 'curl') this.pose = 'sit';
  }

  /**
   * At home, pottering about: each stretch of time it heads somewhere new in the room and sits.
   * Florence mostly sleeps, Gary barely moves, Wybie zooms, and Elvira comes to curl up by her
   * whenever she stands still.
   */
  private potter(deltaMs: number, s: PetSurroundings): void {
    const { now } = s;
    if (s.roam.length === 0) return this.settle(deltaMs, s.ground);
    const her = tileOf(s.her.x, s.her.y);
    if (this.id === 'elvira' && !s.her.moving && s.her.stillMs >= CUDDLE_AFTER_MS) {
      const goal = this.cuddleBy(her, s);
      if (goal && !sameTile(goal, this.tile)) return this.walk(deltaMs, goal, AMBLE * 2, s.ground);
      this.settle(deltaMs, s.ground);
      if (!this.moving) {
        this.face(s.her.x);
        this.pose = 'curl';
      }
      return;
    }
    if (this.id === 'florence' && !florenceAwake(now)) {
      this.settle(deltaMs, s.ground);
      if (!this.moving) this.pose = 'sleep';
      return;
    }
    const period = this.id === 'gary' ? 40_000 : this.id === 'wybie' ? 2500 : 9000;
    const goal = roamGoal(this.id, now, period, s.roam);
    let speed = AMBLE;
    if (this.id === 'gary') speed = 0.5;
    if (this.id === 'wybie') speed = zoomies(now) ? ZOOM_SPEED : AMBLE;
    if (!sameTile(goal, this.tile)) return this.walk(deltaMs, goal, speed, s.ground);
    this.settle(deltaMs, s.ground);
    if (!this.moving) this.pose = this.id === 'gary' ? 'stand' : 'sit';
  }

  /** Dolly barks at a neighbour who comes close, then hides behind her. */
  private barkAt(s: PetSurroundings, her: Tile): void {
    const near = s.villagers.find((v) => reach(v, her) <= 3);
    if (!near) {
      this.hidingFrom = null;
      return;
    }
    if (s.now - this.barkedAt >= BARK_EVERY_MS) {
      this.barkedAt = s.now;
      this.say('woof', s.now, BARK_MS);
    }
    this.hidingFrom = near;
  }

  /** Wybie, with the zoomies: a lap of the tiles round her, flat out. True while he's running. */
  private zoom(deltaMs: number, s: PetSurroundings, her: Tile): boolean {
    const slot = Math.floor(s.now / 8000);
    if (!this.zooming && zoomies(s.now) && slot !== this.zoomSlot && s.her.stillMs > 800) {
      const ring = RING.map(([dx, dy]) => ({ tx: her.tx + dx, ty: her.ty + dy })).filter((t) =>
        s.ground.canWalk(t.tx, t.ty),
      );
      if (ring.length > 2) {
        this.zoomSlot = slot;
        this.zooming = true;
        this.pose = 'walk';
        // Round twice, from wherever on the ring is nearest.
        const start = ring.reduce(
          (best, t, i) => (reach(t, this.tile) < reach(ring[best]!, this.tile) ? i : best),
          0,
        );
        const lap = [...ring.slice(start), ...ring.slice(0, start)];
        this.path = [...lap, ...lap, lap[0]!];
        this.headedFor = null;
      }
    }
    if (!this.zooming) return false;
    this.stepPath(deltaMs, ZOOM_SPEED);
    if (this.path.length === 0) this.zooming = false;
    return true;
  }

  /** The open tile behind her, or else any open tile beside her. */
  private behind(s: PetSurroundings): Tile | null {
    const her = tileOf(s.her.x, s.her.y);
    const [dx, dy] = STEP[s.her.facing];
    const back = { tx: her.tx - dx, ty: her.ty - dy };
    if (s.ground.canWalk(back.tx, back.ty)) return back;
    const me = this.tile;
    let best: Tile | null = null;
    for (const [ox, oy] of RING) {
      const t = { tx: her.tx + ox, ty: her.ty + oy };
      if (s.ground.canWalk(t.tx, t.ty) && (!best || reach(t, me) < reach(best, me))) best = t;
    }
    return best;
  }

  /** The open tile on the far side of her from `from`, to hide behind her. */
  private awayFrom(from: Tile, her: Tile, ground: Ground): Tile | null {
    const dx = Math.sign(her.tx - from.tx);
    const dy = Math.sign(her.ty - from.ty);
    const options = [
      { tx: her.tx + dx, ty: her.ty + dy },
      { tx: her.tx + dx, ty: her.ty },
      { tx: her.tx, ty: her.ty + dy },
    ];
    return options.find((t) => !sameTile(t, her) && ground.canWalk(t.tx, t.ty)) ?? null;
  }

  /** The open tile right beside her, left or right, to curl up on. */
  private cuddleBy(her: Tile, s: PetSurroundings): Tile | null {
    const sides = [
      { tx: her.tx + 1, ty: her.ty },
      { tx: her.tx - 1, ty: her.ty },
      { tx: her.tx, ty: her.ty + 1 },
    ];
    const me = this.tile;
    if (sides.some((t) => sameTile(t, me))) return me;
    return sides.find((t) => s.ground.canWalk(t.tx, t.ty)) ?? this.behind(s);
  }

  /** Heads for `goal` by the quickest way, planning afresh whenever the goal moves. */
  private walk(deltaMs: number, goal: Tile, speed: number, ground: Ground): void {
    if (!sameTile(goal, this.headedFor)) {
      this.headedFor = goal;
      const path = findPath(this.tile, goal, ground.canWalk, ground.width, ground.height);
      if (path === null) {
        this.path = [];
        this.settle(deltaMs, ground);
        return;
      }
      // Back to the middle of its own tile first, so it never cuts a corner.
      this.path = [this.tile, ...path];
    }
    this.pose = 'walk';
    this.stepPath(deltaMs, speed);
  }

  /** Finishes the step it's on, if it's between tiles, and stands. */
  private settle(deltaMs: number, ground: Ground): void {
    const here = this.tile;
    const c = centreOf(here);
    if (c.x !== this.x || c.y !== this.y) {
      this.path = [here];
      this.headedFor = null;
      this.stepPath(deltaMs, PETS[this.id].speed);
      return;
    }
    this.path = [];
    this.headedFor = null;
    this.moving = false;
    this.walkMs = 0;
    if (this.pose === 'walk') this.pose = 'stand';
    if (!ground.canWalk(here.tx, here.ty)) {
      const open = nearestOpen(here, ground);
      if (open) this.place(open);
    }
  }

  private stepPath(deltaMs: number, speed: number): void {
    if (this.path.length === 0) {
      this.moving = false;
      return;
    }
    this.moving = true;
    this.walkMs += deltaMs;
    let budget = (speed * TILE_SIZE * deltaMs) / 1000;
    while (budget > 0 && this.path.length > 0) {
      const next = centreOf(this.path[0]!);
      const dx = next.x - this.x;
      const dy = next.y - this.y;
      const dist = Math.hypot(dx, dy);
      if (dx !== 0) this.facing = dx > 0 ? 'right' : 'left';
      if (dist <= budget) {
        this.x = next.x;
        this.y = next.y;
        budget -= dist;
        this.path.shift();
      } else {
        this.x += (dx / dist) * budget;
        this.y += (dy / dist) * budget;
        budget = 0;
      }
    }
    if (this.path.length === 0) {
      this.moving = false;
      this.walkMs = 0;
      this.headedFor = null;
      if (this.pose === 'walk') this.pose = 'stand';
    }
  }
}

/** The eight tiles round one, clockwise from the top. */
const RING: readonly (readonly [number, number])[] = [
  [0, -1],
  [1, -1],
  [1, 0],
  [1, 1],
  [0, 1],
  [-1, 1],
  [-1, 0],
  [-1, -1],
];

const STEP: Record<Facing, readonly [number, number]> = {
  up: [0, -1],
  down: [0, 1],
  left: [-1, 0],
  right: [1, 0],
};

function centreOf(t: Tile): { x: number; y: number } {
  return { x: t.tx * TILE_SIZE + TILE_SIZE / 2, y: t.ty * TILE_SIZE + TILE_SIZE / 2 };
}

function tileOf(x: number, y: number): Tile {
  return { tx: Math.floor(x / TILE_SIZE), ty: Math.floor(y / TILE_SIZE) };
}

function sameTile(a: Tile, b: Tile | null): boolean {
  return b !== null && a.tx === b.tx && a.ty === b.ty;
}

function reach(a: Tile, b: Tile): number {
  return Math.max(Math.abs(a.tx - b.tx), Math.abs(a.ty - b.ty));
}

/** The nearest open tile to `t`, within a few steps. */
export function nearestOpen(t: Tile, ground: Ground): Tile | null {
  for (let r = 1; r <= 4; r++) {
    for (let y = t.ty - r; y <= t.ty + r; y++) {
      for (let x = t.tx - r; x <= t.tx + r; x++) {
        if (Math.max(Math.abs(x - t.tx), Math.abs(y - t.ty)) === r && ground.canWalk(x, y)) {
          return { tx: x, ty: y };
        }
      }
    }
  }
  return null;
}
