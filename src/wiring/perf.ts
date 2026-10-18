/**
 * `?perf` (V1's S3): how long her phone's frames take, for `docs/architecture.md`'s measurement
 * on a real iPhone. From her first tap on the town it times 30 s of frames, the gap between one
 * and the next (what she sees: 16.7 ms is 60 fps) and the work in each (the step and the draw),
 * and shows each one's median and 95th percentile in a corner, then stops and keeps the result
 * up to read off. Nothing is measured, and nothing shown, without the query.
 */

/** How long it measures, from her first tap. */
export const PERF_WINDOW_MS = 30_000;

export interface Spread {
  p50: number;
  p95: number;
}

export interface PerfSummary {
  frames: number;
  /** Seconds measured so far. */
  seconds: number;
  /** The gap from one frame to the next, ms. */
  frame: Spread;
  /** The step and the draw inside a frame, ms. */
  work: Spread;
  fps: number;
  done: boolean;
}

/** The value `p` of the way up `values` (nearest rank). */
export function percentile(values: readonly number[], p: number): number {
  if (values.length === 0) return 0;
  const sorted = [...values].sort((a, b) => a - b);
  const rank = Math.min(sorted.length - 1, Math.max(0, Math.ceil(p * sorted.length) - 1));
  return sorted[rank]!;
}

const spread = (values: readonly number[]): Spread => ({
  p50: percentile(values, 0.5),
  p95: percentile(values, 0.95),
});

export class FrameTimes {
  private readonly windowMs: number;
  private readonly gaps: number[] = [];
  private readonly work: number[] = [];
  private started = false;
  private from: number | null = null;
  private last: number | null = null;
  private ended = false;

  constructor(windowMs = PERF_WINDOW_MS) {
    this.windowMs = windowMs;
  }

  /** Starts the clock at the next frame; again does nothing. */
  start(): void {
    this.started = true;
  }

  get done(): boolean {
    return this.ended;
  }

  /** A frame drawn at `now` (the frame's own time), its step and draw taking `workMs`. */
  frame(now: number, workMs: number): void {
    if (!this.started || this.ended) return;
    if (this.from === null || this.last === null) {
      this.from = now;
      this.last = now;
      return;
    }
    this.gaps.push(now - this.last);
    this.work.push(workMs);
    this.last = now;
    if (now - this.from >= this.windowMs) this.ended = true;
  }

  summary(): PerfSummary | null {
    if (this.from === null || this.last === null || this.gaps.length === 0) return null;
    const seconds = (this.last - this.from) / 1000;
    return {
      frames: this.gaps.length,
      seconds,
      frame: spread(this.gaps),
      work: spread(this.work),
      fps: this.gaps.length / Math.max(seconds, 0.001),
      done: this.ended,
    };
  }
}

/** The corner's text. */
export function perfText(summary: PerfSummary | null, windowMs = PERF_WINDOW_MS): string {
  if (!summary) return `perf: tap to walk; it times ${windowMs / 1000} s`;
  const ms = (n: number) => n.toFixed(1);
  return [
    `${summary.done ? 'done' : 'timing'} ${summary.seconds.toFixed(0)}/${windowMs / 1000} s, ` +
      `${summary.frames} frames, ${summary.fps.toFixed(1)} fps`,
    `frame p50 ${ms(summary.frame.p50)} p95 ${ms(summary.frame.p95)} ms`,
    `work p50 ${ms(summary.work.p50)} p95 ${ms(summary.work.p95)} ms`,
  ].join('\n');
}

/** Puts the corner up over the game and keeps it current, twice a second, until it's done. */
export function showPerf(root: HTMLElement, times = new FrameTimes()): FrameTimes {
  const corner = document.createElement('pre');
  corner.className = 'perf-overlay';
  Object.assign(corner.style, {
    position: 'absolute',
    left: 'calc(env(safe-area-inset-left) + 4px)',
    top: 'calc(env(safe-area-inset-top) + 48px)',
    margin: '0',
    padding: '4px 6px',
    font: "11px/1.3 ui-monospace, 'SF Mono', Menlo, monospace",
    color: '#f3e9ff',
    background: 'rgba(20, 14, 31, 0.75)',
    borderRadius: '6px',
    pointerEvents: 'none',
    zIndex: '1000',
  });
  root.append(corner);
  const show = () => {
    corner.textContent = perfText(times.summary());
    if (!times.done) setTimeout(show, 500);
  };
  show();
  return times;
}
