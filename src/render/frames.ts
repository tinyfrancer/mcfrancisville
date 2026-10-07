import { bake } from '../sprites/bake';
import { frameAt, sourcesOf, type Frames } from '../sprites/frames';
import type { Palette, SpriteSource } from '../sprites/sprite';
import { tileHash } from '../sprites/terrain';
import { glowOf } from './scene';
import { FURNITURE_ART, furnitureSprite } from '../sprites/furniture';
import type { PieceSprite } from './room';

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

/**
 * A piece of furniture as it's drawn now, if it moves on its own (a fire, a pendulum, bubbles):
 * facing her or mirrored, as its frames are drawn; turned side on or away, it's still.
 */
export function animatePiece(s: PieceSprite, nowMs: number): PieceSprite {
  const { id, turn, tx, ty } = s.piece;
  const art = FURNITURE_ART[id];
  if (!art.frames) return s;
  const facing = furnitureSprite(id, turn);
  if (facing.source !== art.source) return s;
  const m: Moving = {
    frames: art.frames,
    source: art.source,
    palette: art.palette,
    key: `furniture:${id}:${turn}`,
    flip: facing.flip,
    phase: phaseAt(tx, ty, art.frames.period),
  };
  if (art.glow) m.glow = art.glow;
  const { sprite, glow } = framed(m, nowMs);
  return glow ? { ...s, sprite, glow } : { ...s, sprite };
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
