import type { Stop } from '../data/villagers';
import { WORKS } from '../data/work';
import type { VillagerId, WorkId } from '../types/ids';
import type { Stance } from '../types/stance';
import { specialDayOf } from './friendship';
import { happeningOf } from './happenings';
import { findPath, type Tile } from './pathfinding';
import { blinking, breathingOut } from './poses';
import { hashMixed } from './random';
import { scheduleOn, visitOf } from './schedules';

/*
 * Her neighbours alive at their stops (V1's E3, decision 282): a stroll round the stop now and
 * then, a breath and a blink, a wave as she comes near, chatter between two who stand together,
 * and their job in their hands. The rules, worked out from a neighbour's id and the time; the
 * neighbour (`world/Neighbour.ts`) keeps where it's up to and the view draws it.
 */

// ---- Where they are: their own stop, or somewhere else for the hour -------------------------

/**
 * The stop a neighbour keeps at an hour of a day, when it's their stop they're at: not on her
 * birthday, at a happening or on a visit, where they keep their places (decision 282).
 */
export function stopNow(villager: VillagerId, hour: number, day: string): Stop | null {
  if (specialDayOf(day) === 'birthday') return null;
  if (happeningOf(villager, hour, day) || visitOf(villager, hour, day)) return null;
  const schedule = scheduleOn(villager, day);
  let stop = schedule[schedule.length - 1]!;
  for (const s of schedule) if (s.from <= hour) stop = s;
  return stop;
}

// ---- A stroll round the stop ---------------------------------------------------------------

/** How long they stand at their stop before strolling, between these. */
export const STROLL_AFTER_MS: readonly [number, number] = [20_000, 40_000];
/** How long they stand where they strolled to before going back. */
export const LINGER_MS: readonly [number, number] = [3_000, 6_000];
/** How far from the stop a stroll goes, in tiles either way, and in steps along the way there. */
export const STROLL_REACH = 2;
export const STROLL_STEPS = 3;

function between([lo, hi]: readonly [number, number], hash: number): number {
  return lo + (hash % (hi - lo + 1));
}

/** How long a neighbour stands at their stop before their `n`th stroll. */
export function strollAfter(id: VillagerId, n: number): number {
  return between(STROLL_AFTER_MS, hashMixed(`stroll:${id}:${n}`));
}

/** How long they stand where their `n`th stroll took them. */
export function lingerFor(id: VillagerId, n: number): number {
  return between(LINGER_MS, hashMixed(`linger:${id}:${n}`));
}

/** The ground round a stop, and the tiles on it she needs kept clear. */
export interface StrollGround {
  canWalk(tx: number, ty: number): boolean;
  width: number;
  height: number;
  /** A way out, a mat, a door step, the way up to a seat: somewhere she goes to use something. */
  needed(tx: number, ty: number): boolean;
}

/**
 * Where a neighbour may stroll from a stop: open tiles a tile or two from it, a short walk away,
 * none she needs and none another neighbour stands at (`taken`), nearest rows first.
 */
export function strollTiles(ground: StrollGround, stop: Tile, taken: readonly Tile[]): Tile[] {
  const tiles: Tile[] = [];
  for (let ty = stop.ty - STROLL_REACH; ty <= stop.ty + STROLL_REACH; ty++) {
    for (let tx = stop.tx - STROLL_REACH; tx <= stop.tx + STROLL_REACH; tx++) {
      if (tx === stop.tx && ty === stop.ty) continue;
      if (!ground.canWalk(tx, ty) || ground.needed(tx, ty)) continue;
      if (taken.some((t) => t.tx === tx && t.ty === ty)) continue;
      const path = findPath(stop, { tx, ty }, ground.canWalk, ground.width, ground.height);
      if (path && path.length <= STROLL_STEPS) tiles.push({ tx, ty });
    }
  }
  return tiles;
}

/** Which of the tiles round their stop a neighbour's `n`th stroll goes to. */
export function strollTo(id: VillagerId, n: number, tiles: readonly Tile[]): Tile | null {
  if (tiles.length === 0) return null;
  return tiles[hashMixed(`strollTo:${id}:${n}`) % tiles.length]!;
}

// ---- A wave as she comes near --------------------------------------------------------------

/** Within this many tiles she's near: they turn to her, and wave once. */
export const NEAR_TILES = 2;
/** Beyond this many she's gone, and the next time she comes near they wave again. */
export const GONE_TILES = 3;
/** A wave, the hand one way and the other every `WAVE_FRAME_MS`. */
export const NEIGHBOUR_WAVE_MS = 1_200;
export const WAVE_FRAME_MS = 200;

/** Which way their hand is, `left` ms before the wave is done. */
export function waveFrame(left: number): 0 | 1 {
  return Math.floor((NEIGHBOUR_WAVE_MS - left) / WAVE_FRAME_MS) % 2 === 0 ? 0 : 1;
}

// ---- A breath, a blink, and their job, each to a beat of their own ---------------------------

/** Where in their breath and blink a neighbour is, so a crowd doesn't breathe as one. */
function phaseOf(id: VillagerId): number {
  return hashMixed(`breath:${id}`) % 10_000;
}

/** A neighbour standing still: breathing out, and blinking, `ms` on the clock. */
export function restOf(id: VillagerId, ms: number): { out: boolean; blink: boolean } {
  const t = ms + phaseOf(id);
  return { out: breathingOut(t), blink: blinking(t) };
}

/** Which of a job's two frames shows, `ms` on the clock. */
export function workFrame(id: VillagerId, work: WorkId, ms: number): 0 | 1 {
  return Math.floor((ms + phaseOf(id)) / WORKS[work].frameMs) % 2 === 0 ? 0 : 1;
}

/** What of a neighbour says how they stand. */
export interface Standing {
  id: VillagerId;
  moving: boolean;
  /** How much longer they wave. */
  waveMs: number;
  working: WorkId | null;
  /** Sat on a seat beside their stop. */
  seated: boolean;
}

/**
 * How a neighbour stands, `ms` on the clock, or null walking: waving as she comes near, at their
 * job, or standing (or sitting) breathing and blinking. Never one still frame for long.
 */
export function stanceOf(n: Standing, ms: number): Stance | null {
  if (n.moving) return null;
  const sit = n.seated;
  if (n.waveMs > 0) return { act: 'wave', frame: waveFrame(n.waveMs), sit };
  const { out, blink } = restOf(n.id, ms);
  if (n.working) return { act: n.working, frame: workFrame(n.id, n.working, ms), sit, blink };
  return { sit, out, blink };
}

// ---- Chatter between two who stand together --------------------------------------------------

/** What two standing together say, a bubble at a time, taking turns. */
export type Chatter = '…' | '♪' | '♥';

/** A beat of chatter: one of them says something, or neither does for a moment. */
export const CHAT_BEAT_MS = 2_600;

/** A pause is said most, a song now and then, and a heart least. */
const CHATS: readonly (Chatter | null)[] = ['…', '…', '…', '♪', '♪', '♥', null, null];

/**
 * What a pair standing together says on a beat of their chat: whose turn it is (the first named,
 * or the second), and the bubble, or nothing for a moment.
 */
export function chatOn(
  pair: readonly [VillagerId, VillagerId],
  beat: number,
): { by: VillagerId; chat: Chatter } | null {
  const chat = CHATS[hashMixed(`chat:${pair[0]}+${pair[1]}:${beat}`) % CHATS.length]!;
  return chat ? { by: pair[beat % 2]!, chat } : null;
}
