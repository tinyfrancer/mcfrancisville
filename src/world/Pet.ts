import { TILE_SIZE } from '../config/world';
import { JOBS, TRICKS, type PetLevel } from '../data/affection';
import { PETS } from '../data/pets';
import { findPath, stringPull, type Tile } from '../systems/pathfinding';
import type { RestSpot } from '../systems/petRest';
import {
  barkTarget,
  dreamsOfHer,
  drawTarget,
  fetchable,
  florenceAwake,
  forageNow,
  habitBubble,
  NO_FINDS,
  pickleAwake,
  restsNow,
  roamGoal,
  sniffGoal,
  STARTLE_EVERY_MS,
  STARTLE_MS,
  STARTLE_REACH,
  trickNow,
  zoomies,
  type Bubble,
  type PetFinds,
} from '../systems/pets';
import type { Facing, PetId, ZoneId } from '../types/ids';
import { BODY_RADIUS } from './Movement';
import type { Ground } from './Neighbour';

/**
 * How a pet is standing: on its feet, trotting, sitting beside her, or, for Florence, asleep
 * under her blanket, and for Elvira, curled up in a ball; and once it knows one (V1's R6c), in
 * the middle of its trick; and Pickle (1.5's G7) playing dead, startled or complimented.
 */
export type PetPose = 'stand' | 'walk' | 'sit' | 'sleep' | 'curl' | 'trick' | 'playDead';

/** Beyond this many tiles from her, a pet following her is simply beside her again. */
export const CATCH_UP_TILES = 10;

/** How long she stands still before Florence nods off, and Elvira comes to curl up by her. */
export const NAP_AFTER_MS = 2500;
export const CUDDLE_AFTER_MS = 1500;
/** How long she stands still before a pet goes about its job, or shows off its trick. */
export const JOB_AFTER_MS = 600;
export const TRICK_AFTER_MS = 2000;

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
  /** Her camera is up (1.5's G5): it stops where it is and sits facing her for the photo. */
  posing?: boolean;
  /** Where her neighbours are standing, for Dolly to bark at. */
  villagers: readonly Tile[];
  /** The open tiles it can wander to at home. */
  roam: readonly Tile[];
  /** Fibi's had a bone back today. */
  happy: boolean;
  /** How fond it is of her (V1's R6c): its job from one, its trick from two. */
  level?: PetLevel;
  /** Where it rests at home, if the room has somewhere it likes. */
  rest?: RestSpot | null;
  /** What a walk turns up round her, for its job. */
  finds?: PetFinds;
  /** Whether it has done a job already: barked at a critter, drawn an orb, found today's mound. */
  done?: (key: string) => boolean;
}

/**
 * Something a pet did that the world should know of (V1's R6c): its job on a walk, or its trick.
 * The pet only decides; `PetCare` makes it so.
 */
export type PetDeed =
  | { job: 'sniff'; at: Tile }
  | { job: 'bark'; key: string; at: Tile }
  | { job: 'draw'; key: string; from: Tile; to: Tile }
  | { job: 'fetch'; at: Tile }
  | { job: 'forage'; at: Tile }
  | { trick: true; own: boolean };

/**
 * One of her pets, where it is and what it's up to. Everything it does is worked out as it goes,
 * from where she is and the clock: nothing about it is saved but its name, its accessory and how
 * fond it is of her (decisions.md 68). Like the neighbours, it's never solid.
 */
export class Pet {
  readonly id: PetId;
  /** Which of the places it's in: at home, or out in town with her. */
  scene: ZoneId = 'home';
  x = 0;
  y = 0;
  /** Pets walk side on, so they only ever face left or right. */
  facing: 'left' | 'right' = 'right';
  /** Sitting, it faces into the room, or away up it: towards her, or the fire (V1's R6c). */
  looking: 'front' | 'back' = 'front';
  moving = false;
  walkMs = 0;
  pose: PetPose = 'stand';
  /** Up on a bed or a sofa at home, and how high; null on the floor. */
  perch: { lift: number; floor: Tile } | null = null;
  /** When its trick started, while it's doing it. */
  trickAt: number | null = null;
  /** Wybie on his way to a dropped thing, or back to her with it. */
  fetching: 'out' | 'back' | null = null;
  private said: { bubble: Bubble; until: number } | null = null;
  /** The corners of its way, in world pixels. */
  private path: { x: number; y: number }[] = [];
  private headedFor: Tile | null = null;
  private barkedAt = -Infinity;
  /** Where Dolly is hiding from, while she hides behind her. */
  private hidingFrom: Tile | null = null;
  /** Which stretch of time Wybie last had the zoomies in, so he runs one lap a stretch. */
  private zoomSlot = -1;
  private zooming = false;
  /** Which stretch it last showed off its trick in, on its own, so it's once a stretch. */
  private trickSlot = -1;
  private level: PetLevel = 0;
  /** Pickle playing dead until then (1.5's G7), and when a neighbour last startled him. */
  private deadUntil = 0;
  private startledAt = -Infinity;

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
    this.fetching = null;
    this.perch = null;
    this.trickAt = null;
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
    if (this.pose === 'sleep') {
      return this.id === 'florence' && this.level >= 1 && dreamsOfHer(now) ? 'heart' : 'zzz';
    }
    return habitBubble(this.id, now, happy);
  }

  /** Turns to look at a point. */
  face(x: number): void {
    if (x !== this.x) this.facing = x > this.x ? 'right' : 'left';
  }

  /** Sits facing her: away from the room if she's up it, into the room if not. */
  private lookAt(her: Her): void {
    this.face(her.x);
    this.looking = her.y < this.y - TILE_SIZE / 2 ? 'back' : 'front';
  }

  /**
   * Her camera is up (1.5's G5): wherever it is, mid-trot or mid-trick, asleep or not, it stops
   * and sits looking at her, on its perch if it's up on one, until the camera goes down.
   */
  private sitForPhoto(her: Her): void {
    this.deadUntil = 0;
    this.path = [];
    this.headedFor = null;
    this.moving = false;
    this.walkMs = 0;
    this.zooming = false;
    this.fetching = null;
    this.trickAt = null;
    this.lookAt(her);
    this.pose = 'sit';
  }

  /**
   * Plays dead for `ms` (1.5's G7): Pickle, startled by a neighbour or paid a compliment, flops
   * over wherever he is, and is up again as if nothing happened.
   */
  playDead(now: number, ms: number): void {
    this.path = [];
    this.headedFor = null;
    this.moving = false;
    this.walkMs = 0;
    this.trickAt = null;
    this.deadUntil = now + ms;
    this.pose = 'playDead';
  }

  /** Does its trick (V1's R6c), from the start. */
  perform(now: number): void {
    this.trickAt = now;
    this.pose = 'trick';
  }

  /** How far through its trick it is, 0 to 1, or null if it isn't doing one. */
  trickDone(now: number): number | null {
    if (this.trickAt === null) return null;
    return Math.min(1, (now - this.trickAt) / TRICKS[this.id].ms);
  }

  update(deltaMs: number, s: PetSurroundings): PetDeed | null {
    this.level = s.level ?? 0;
    if (s.posing) {
      this.sitForPhoto(s.her);
      return null;
    }
    if (s.now < this.deadUntil) {
      this.pose = 'playDead';
      return null;
    }
    if (this.pose === 'playDead') this.pose = 'sit';
    if (this.trickAt !== null) {
      const over = s.now - this.trickAt >= TRICKS[this.id].ms;
      if (over || (s.following && s.her.moving && !s.held)) {
        this.trickAt = null;
        if (this.pose === 'trick') this.pose = 'sit';
      } else {
        this.pose = 'trick';
        return null;
      }
    }
    if (!this.perch && !s.ground.canWalk(this.tile.tx, this.tile.ty) && !this.moving) {
      // Something was put down where it was sitting: up it gets, and over to somewhere open.
      const open = nearestOpen(this.tile, s.ground);
      if (open) this.place(open);
    }
    if (s.held) {
      if (this.perch) {
        this.face(s.her.x);
        if (this.pose !== 'sleep' && this.pose !== 'curl') this.pose = 'sit';
        return null;
      }
      this.settle(deltaMs, s.ground);
      if (!this.moving) {
        this.lookAt(s.her);
        this.pose = 'sit';
      }
      return null;
    }
    if (s.following) return this.follow(deltaMs, s);
    this.potter(deltaMs, s);
    // Sat about at home while she stands by, it might show off its trick.
    if (this.moving || this.pose !== 'sit' || s.her.moving) return null;
    return this.ownTrick(s);
  }

  /** Walking with her: close behind while she walks, and up to its habits when she stops. */
  private follow(deltaMs: number, s: PetSurroundings): PetDeed | null {
    if (this.perch) this.place(this.perch.floor);
    const her = tileOf(s.her.x, s.her.y);
    const me = this.tile;
    if (reach(me, her) > CATCH_UP_TILES) {
      // Out of sight, and back at her side: even Gary, who always turns up somehow.
      const beside = this.behind(s) ?? nearestOpen(her, s.ground);
      if (beside) this.place(beside);
      return null;
    }
    const finds = s.finds ?? NO_FINDS;
    const done = s.done ?? (() => false);
    const working = (s.level ?? 0) >= 1;
    const job = JOBS[this.id].job;
    if (this.fetching) return this.fetch(deltaMs, s, finds);
    // Dolly barks the shy ones out, and Elvira draws the orbs in, as she goes.
    if (working && job === 'bark') {
      const shy = barkTarget(her, finds.critters, (key) => done(`bark:${key}`));
      if (shy) {
        this.say('woof', s.now, BARK_MS);
        this.face(shy.tx * TILE_SIZE + TILE_SIZE / 2);
        return { job: 'bark', key: shy.key, at: { tx: shy.tx, ty: shy.ty } };
      }
    }
    if (working && job === 'draw') {
      const orb = drawTarget(her, finds.critters, (key) => done(`draw:${key}`), s.ground.canWalk);
      if (orb) {
        this.say('heart', s.now, BARK_MS);
        const from = finds.critters.find((c) => c.key === orb.key)!;
        return { job: 'draw', key: orb.key, from: { tx: from.tx, ty: from.ty }, to: orb.to };
      }
    }
    const speed = PETS[this.id].speed * (reach(me, her) > 2 && this.id !== 'gary' ? 1.4 : 1);
    if (s.her.moving) {
      this.hidingFrom = null;
      this.zooming = false;
      if (this.pose === 'sleep' || this.pose === 'curl') this.pose = 'stand';
      const goal = this.behind(s);
      if (goal && reach(me, her) > 1) this.walk(deltaMs, goal, speed, s.ground);
      else this.settle(deltaMs, s.ground);
      return null;
    }

    if (working && job === 'fetch' && s.her.stillMs >= JOB_AFTER_MS) {
      if (fetchable(her, finds.lost)) {
        this.fetching = 'out';
        this.zooming = false;
        return this.fetch(deltaMs, s, finds);
      }
    }
    if (this.id === 'dolly') this.barkAt(s, her);
    if (this.id === 'pickle' && this.startled(s)) return null;
    if (this.id === 'wybie' && this.zoom(deltaMs, s, her)) return null;
    if (working && job === 'forage' && finds.outdoors && pickleAwake(s.now)) {
      if (!this.moving && s.her.stillMs >= JOB_AFTER_MS && !done('forage') && forageNow(s.now)) {
        this.say('found', s.now, 1600);
        return { job: 'forage', at: me };
      }
    }
    if (working && job === 'sniff' && finds.mound && s.her.stillMs >= JOB_AFTER_MS) {
      const sniff = sniffGoal(her, finds.mound, s.ground.canWalk);
      if (sniff) {
        if (!sameTile(sniff.goal, me) || this.moving) {
          this.walk(deltaMs, sniff.goal, speed, s.ground);
          if (!sameTile(sniff.goal, this.tile) || this.moving) return null;
        }
        this.settle(deltaMs, s.ground);
        this.face(finds.mound.tx * TILE_SIZE + TILE_SIZE / 2);
        this.looking = finds.mound.ty < me.ty ? 'back' : 'front';
        this.pose = 'sit';
        if (!sniff.by) {
          if (!this.said || s.now >= this.said.until) this.say('sniff', s.now, 900);
          return null;
        }
        if (!this.said || s.now >= this.said.until) this.say('found', s.now, 1600);
        return done('sniff') ? null : { job: 'sniff', at: finds.mound };
      }
    }

    let goal: Tile | null = null;
    if (this.hidingFrom) goal = this.awayFrom(this.hidingFrom, her, s.ground);
    else if (this.id === 'elvira' && s.her.stillMs >= CUDDLE_AFTER_MS) goal = this.cuddleBy(her, s);
    else if (reach(me, her) > 1 || sameTile(me, her)) goal = this.behind(s);
    if (goal && !sameTile(goal, me)) {
      this.walk(deltaMs, goal, speed, s.ground);
      return null;
    }
    this.settle(deltaMs, s.ground);
    if (this.moving) return null;
    const own = this.ownTrick(s);
    if (own) return own;
    this.lookAt(s.her);
    if (this.id === 'elvira' && s.her.stillMs >= CUDDLE_AFTER_MS) this.pose = 'curl';
    else if (this.id === 'florence' && s.her.stillMs >= NAP_AFTER_MS) this.pose = 'sleep';
    else if (this.id === 'pickle' && !pickleAwake(s.now) && s.her.stillMs >= NAP_AFTER_MS) {
      // Out with her by day, he naps the moment she stops: it's the middle of his night.
      this.pose = 'sleep';
    } else if (this.id === 'gary' && working && s.her.stillMs >= NAP_AFTER_MS * 2) {
      this.pose = 'sleep';
    } else if (this.pose !== 'sleep' && this.pose !== 'curl') this.pose = 'sit';
    return null;
  }

  /** Wybie off for a dropped thing, flat out, and back to her with it. */
  private fetch(deltaMs: number, s: PetSurroundings, finds: PetFinds): PetDeed | null {
    if (this.fetching === 'out') {
      const lost = finds.lost;
      if (!lost) {
        this.fetching = 'back';
        return null;
      }
      if (!sameTile(this.tile, lost) || this.moving) {
        this.walk(deltaMs, lost, ZOOM_SPEED, s.ground);
        if (this.path.length === 0 && !this.moving && !sameTile(this.tile, lost)) {
          // Nowhere to get to it from: never mind, back to her.
          this.fetching = 'back';
        }
        return null;
      }
      this.fetching = 'back';
      this.say('found', s.now, 1400);
      return { job: 'fetch', at: lost };
    }
    const goal = this.behind(s);
    const her = tileOf(s.her.x, s.her.y);
    if (goal && reach(this.tile, her) > 1) {
      this.walk(deltaMs, goal, ZOOM_SPEED, s.ground);
      return null;
    }
    this.settle(deltaMs, s.ground);
    if (!this.moving) {
      this.fetching = null;
      this.lookAt(s.her);
      this.pose = 'sit';
      this.say('heart', s.now, 1400);
    }
    return null;
  }

  /** Once it knows its trick, it shows it off now and then on its own, when she's stood a while. */
  private ownTrick(s: PetSurroundings): PetDeed | null {
    if ((s.level ?? 0) < 2 || s.her.stillMs < TRICK_AFTER_MS) return null;
    const slot = Math.floor(s.now / 40_000);
    if (slot === this.trickSlot || !trickNow(this.id, s.now, TRICKS[this.id].ms)) return null;
    this.trickSlot = slot;
    this.perform(s.now);
    return { trick: true, own: true };
  }

  /**
   * At home, pottering about: each stretch of time it heads somewhere new in the room and sits,
   * or (V1's R6c) to its resting spot, by the fire or up on the bed. Florence mostly sleeps, Gary
   * barely moves, Wybie zooms, and Elvira comes to curl up by her whenever she stands still.
   */
  private potter(deltaMs: number, s: PetSurroundings): void {
    const { now } = s;
    if (s.roam.length === 0) return this.settle(deltaMs, s.ground);
    const her = tileOf(s.her.x, s.her.y);
    if (this.id === 'elvira' && !s.her.moving && s.her.stillMs >= CUDDLE_AFTER_MS) {
      if (this.perch) this.place(this.perch.floor);
      const goal = this.cuddleBy(her, s);
      if (goal && !sameTile(goal, this.tile)) return this.walk(deltaMs, goal, AMBLE * 2, s.ground);
      this.settle(deltaMs, s.ground);
      if (!this.moving) {
        this.face(s.her.x);
        this.pose = 'curl';
      }
      return;
    }
    const asleep =
      (this.id === 'florence' && !florenceAwake(now)) ||
      (this.id === 'pickle' && !pickleAwake(now));
    if (s.rest && (asleep || restsNow(this.id, now))) return this.rest(deltaMs, s, s.rest, asleep);
    if (this.perch) this.place(this.perch.floor);
    if (asleep) {
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
    if (!this.moving) {
      this.pose = this.id === 'gary' ? 'stand' : 'sit';
      this.looking = 'front';
    }
  }

  /** Off to its resting spot, up onto it if it's a bed or a sofa, and settled there. */
  private rest(deltaMs: number, s: PetSurroundings, spot: RestSpot, asleep: boolean): void {
    const settled = asleep ? 'sleep' : this.id === 'elvira' ? 'curl' : 'sit';
    if (this.perch) {
      this.pose = settled;
      return;
    }
    if (!sameTile(spot.floor, this.tile) || this.moving) {
      const speed = this.id === 'gary' ? 0.5 : AMBLE;
      this.walk(deltaMs, spot.floor, speed, s.ground);
      if (!sameTile(spot.floor, this.tile) || this.moving) return;
    }
    this.settle(deltaMs, s.ground);
    if (this.moving) return;
    this.looking = spot.looks;
    if (spot.perch) {
      ({ x: this.x, y: this.y } = centreOf(spot.perch.tile));
      this.perch = { lift: spot.perch.lift, floor: spot.floor };
    }
    this.pose = settled;
  }

  /** Pickle plays dead when a neighbour comes right up to him, now and then. True if he does. */
  private startled(s: PetSurroundings): boolean {
    if (s.now - this.startledAt < STARTLE_EVERY_MS) return false;
    if (!s.villagers.some((v) => reach(v, this.tile) <= STARTLE_REACH)) return false;
    this.startledAt = s.now;
    this.playDead(s.now, STARTLE_MS);
    return true;
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
        this.path = [...lap, ...lap, lap[0]!].map(centreOf);
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

  /**
   * Heads for `goal` by the quickest way, planning afresh whenever the goal moves: an A* path
   * pulled taut as hers is (1.1's W1, decision 340), so it trots straight across open ground.
   */
  private walk(deltaMs: number, goal: Tile, speed: number, ground: Ground): void {
    if (!sameTile(goal, this.headedFor)) {
      this.headedFor = goal;
      const from = this.tile;
      const path = findPath(from, goal, ground.canWalk, ground.width, ground.height);
      if (path === null) {
        this.path = [];
        this.settle(deltaMs, ground);
        return;
      }
      // From where it is, with its own tile's middle first, which the pull leaves out whenever
      // heading straight on wouldn't shave a corner.
      const start = { x: this.x / TILE_SIZE, y: this.y / TILE_SIZE };
      const middles = [from, ...path].map((t) => ({ x: t.tx + 0.5, y: t.ty + 0.5 }));
      this.path = stringPull(start, middles, ground.canWalk, BODY_RADIUS).map((t) => ({
        x: t.x * TILE_SIZE,
        y: t.y * TILE_SIZE,
      }));
    }
    this.pose = 'walk';
    this.stepPath(deltaMs, speed);
  }

  /** Finishes the step it's on, if it's between tiles, and stands. */
  private settle(deltaMs: number, ground: Ground): void {
    const here = this.tile;
    const c = centreOf(here);
    if (c.x !== this.x || c.y !== this.y) {
      this.path = [c];
      this.headedFor = null;
      this.stepPath(deltaMs, PETS[this.id].speed);
      return;
    }
    this.path = [];
    this.headedFor = null;
    this.moving = false;
    this.walkMs = 0;
    if (this.pose === 'walk') this.pose = 'stand';
    if (!this.perch && !ground.canWalk(here.tx, here.ty)) {
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
      const next = this.path[0]!;
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
