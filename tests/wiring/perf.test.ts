import { describe, expect, it } from 'vitest';
import { FrameTimes, percentile, perfText, showPerf } from '../../src/wiring/perf';

describe("the ?perf corner (V1's S3)", () => {
  it('reads the median and the 95th percentile by nearest rank', () => {
    const values = Array.from({ length: 100 }, (_, i) => i + 1);
    expect(percentile(values, 0.5)).toBe(50);
    expect(percentile(values, 0.95)).toBe(95);
    expect(percentile([7], 0.95)).toBe(7);
    expect(percentile([], 0.5)).toBe(0);
  });

  it('times nothing until her first tap, then 30 s of frames, and stops', () => {
    const times = new FrameTimes(30_000);
    times.frame(0, 5);
    expect(times.summary()).toBeNull();
    times.start();
    let now = 1000;
    // At 60 fps, with a slow frame in every ten.
    for (let i = 0; i < 2400; i++) {
      now += i % 10 === 9 ? 33.4 : 16.7;
      times.frame(now, i % 10 === 9 ? 20 : 8);
    }
    const summary = times.summary()!;
    expect(times.done).toBe(true);
    expect(summary.seconds).toBeGreaterThanOrEqual(30);
    expect(summary.seconds).toBeLessThan(30.1);
    expect(summary.frame.p50).toBeCloseTo(16.7);
    expect(summary.frame.p95).toBeCloseTo(33.4);
    expect(summary.work).toEqual({ p50: 8, p95: 20 });
    expect(summary.fps).toBeGreaterThan(50);
    expect(summary.fps).toBeLessThan(60);
  });

  it('says what it found, and how to start it', () => {
    expect(perfText(null)).toMatch(/tap/);
    const times = new FrameTimes(1000);
    times.start();
    for (let t = 0; t <= 1100; t += 20) times.frame(t, 4);
    expect(perfText(times.summary(), 1000)).toMatch(
      /^done 1\/1 s, 50 frames, 50\.0 fps\nframe p50 20\.0 p95 20\.0 ms\nwork p50 4\.0 p95 4\.0 ms$/,
    );
  });

  it('shows in a corner that takes no taps', () => {
    const root = document.createElement('div');
    showPerf(root);
    const corner = root.querySelector<HTMLElement>('.perf-overlay');
    expect(corner?.style.pointerEvents).toBe('none');
    expect(corner?.textContent).toMatch(/tap/);
  });
});
