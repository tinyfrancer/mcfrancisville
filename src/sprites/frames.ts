import type { Palette, SpriteSource } from './sprite';

/**
 * How a prop, a piece or a fixture moves on its own (V1's E5): pictures that take turns over a
 * period, each baked once as any sprite is, and picked by the view from the clock and a phase of
 * its own, so a row of lamps never flickers in step (decision 284). Never world state: what
 * moves, moves whatever she's doing.
 */
export interface Frames {
  /**
   * Each frame's picture, the same size as the art's `source`, in its place; left out, the
   * `source` throughout. A list, or a function for art dear to draw, called once when it's first
   * drawn rather than as the game loads.
   */
  sources?: readonly SpriteSource[] | (() => readonly SpriteSource[]);
  /** Each frame's lit keys, in place of the art's `glow`: a candle's flicker, a lamp's breath. */
  glows?: readonly Palette[];
  /** How long one round takes, in ms. */
  period: number;
  /**
   * Which frame shows in each equal beat of the period, if not each in turn: mostly the first, with
   * a dip or two, for something that flickers now and then.
   */
  order?: readonly number[];
}

const drawn = new WeakMap<Frames, readonly SpriteSource[]>();

/** The frames' pictures, drawn the first time they're asked for; empty for a flicker of glows. */
export function sourcesOf(frames: Frames): readonly SpriteSource[] {
  const { sources } = frames;
  if (!sources) return [];
  if (typeof sources !== 'function') return sources;
  let found = drawn.get(frames);
  if (!found) {
    found = sources();
    drawn.set(frames, found);
  }
  return found;
}

/** How many different frames there are. */
export function frameCount(frames: Frames): number {
  if (Array.isArray(frames.sources)) return frames.sources.length;
  if (frames.sources) return sourcesOf(frames).length;
  return frames.glows?.length ?? 1;
}

/** How many beats a round has: one a frame, or one an entry of `order`. */
function beatsOf(frames: Frames): number {
  return frames.order?.length ?? frameCount(frames);
}

/** Which frame shows `ms` on the clock, `phase` ms along its own round. */
export function frameAt(frames: Frames, ms: number, phase = 0): number {
  const beats = beatsOf(frames);
  const t = (((ms + phase) % frames.period) + frames.period) % frames.period;
  const beat = Math.min(beats - 1, Math.floor((t / frames.period) * beats));
  return frames.order ? frames.order[beat]! : beat;
}

/**
 * An order for a flicker: `beats` beats steady on frame 0, with the frames in `dips` at the beats
 * they're keyed by. `flicker(20, { 7: 1, 9: 2 })` dips twice in a round of twenty.
 */
export function flicker(beats: number, dips: Readonly<Record<number, number>>): number[] {
  return Array.from({ length: beats }, (_, i) => dips[i] ?? 0);
}
