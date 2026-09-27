import { describe, expect, it } from 'vitest';
import { FixedStep, STEP_MS } from '../src/loop';

const run = (frames: number[]) => {
  const loop = new FixedStep();
  return frames.map((ms) => loop.advance(ms, () => {}));
};

describe('FixedStep', () => {
  it('takes two steps every frame at 60Hz, and one at 120Hz', () => {
    expect(run(Array(120).fill(1000 / 60)).every((n) => n === 2)).toBe(true);
    expect(run(Array(120).fill(1000 / 120)).every((n) => n === 1)).toBe(true);
  });

  it('keeps two steps a frame through a browser wobbling around 60Hz', () => {
    const wobble = Array.from({ length: 240 }, (_, i) => 1000 / 60 + (i % 2 ? 0.4 : -0.4));
    expect(run(wobble).every((n) => n === 2)).toBe(true);
  });

  it('steps by the same amount however long the frame', () => {
    const loop = new FixedStep();
    const seen: number[] = [];
    loop.advance(50, (ms) => seen.push(ms));
    expect(seen.length).toBe(6);
    expect(seen.every((ms) => ms === STEP_MS)).toBe(true);
  });

  it('carries what a short frame leaves over into the next', () => {
    expect(run([3, 3, 3, 3, 3, 3])).toEqual([0, 0, 1, 0, 0, 1]);
  });

  it('never runs more than a tenth of a second at once, however far behind', () => {
    expect(run([5000])[0]).toBe(12);
  });
});
