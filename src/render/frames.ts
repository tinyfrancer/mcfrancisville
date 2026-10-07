import { bake } from '../sprites/bake';
import { frameAt, sourcesOf, type Frames } from '../sprites/frames';
import type { Palette, SpriteSource } from '../sprites/sprite';
import { tileHash } from '../sprites/terrain';
import { glowOf } from './scene';

/**
 * Something that moves on its own where it stands (V1's E5): its art's frames, what it's baked
 * under, and its own phase, so two of a kind side by side don't move as one.
 */
export interface Moving {
  frames: Frames;
  source: SpriteSource;
  palette: Palette;
  glow?: Palette;
  /** What its still picture is baked under; each frame is baked under this and its number. */
  key: string;
  flip?: boolean;
  phase: number;
}

/** A phase of its own for something standing at a tile, anywhere in the round of `period`. */
export function phaseAt(tx: number, ty: number, period: number): number {
  return tileHash(tx * 5 + 11, ty * 3 + 7) % Math.max(1, Math.round(period));
}

/** Its picture and lit keys `nowMs` on the clock, each baked once. */
export function framed(
  m: Moving,
  nowMs: number,
): { sprite: HTMLCanvasElement; glow?: HTMLCanvasElement; frame: number } {
  const frame = frameAt(m.frames, nowMs, m.phase);
  return { ...frameSprites(m, frame), frame };
}

/** Frame `frame`'s picture and lit keys, baked through `bake` so the bloom is cached per frame. */
export function frameSprites(
  m: Moving,
  frame: number,
): { sprite: HTMLCanvasElement; glow?: HTMLCanvasElement } {
  const sources = sourcesOf(m.frames);
  const source = sources[frame] ?? m.source;
  const options = m.flip ? { flipX: true } : {};
  const drawn = sources[frame] ? `${m.key}:f${frame}` : m.key;
  const sprite = bake(drawn, source, m.palette, options);
  const lit = m.frames.glows?.[frame] ?? m.glow;
  if (!lit) return { sprite };
  const glowKey = `glow:${m.key}:f${sources[frame] ? frame : 0}:g${m.frames.glows ? frame : 0}`;
  return { sprite, glow: glowOf(glowKey, source, m.palette, lit, options) };
}
