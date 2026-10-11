import { afterAll, beforeAll, describe, expect, it, vi } from 'vitest';
import { CLUTTER } from '../../src/data/clutter';
import { TOWN } from '../../src/data/maps';
import { Ground } from '../../src/render/ground';
import { parseMap } from '../../src/systems/grid';

/**
 * The ground's chunks through the seasons (V1's L4): jsdom has no canvas, so each context is a
 * stand-in that takes every call and draws nothing, which is all the bookkeeping needs.
 */
function stubContext(): CanvasRenderingContext2D {
  const ctx = new Proxy(
    {},
    {
      get: (_target, name) =>
        name === 'getImageData'
          ? (_x: number, _y: number, w: number, h: number) => ({
              data: new Uint8ClampedArray(w * h * 4),
            })
          : () => undefined,
      set: () => true,
    },
  );
  return ctx as CanvasRenderingContext2D;
}

describe('the ground through the seasons', () => {
  const restore: (() => void)[] = [];
  beforeAll(() => {
    const spy = vi
      .spyOn(HTMLCanvasElement.prototype, 'getContext')
      .mockImplementation(() => stubContext() as never);
    restore.push(() => spy.mockRestore());
    if (typeof globalThis.ImageData === 'undefined') {
      class FakeImageData {
        data: Uint8ClampedArray;
        width: number;
        height: number;
        constructor(data: Uint8ClampedArray, width: number, height: number) {
          this.data = data;
          this.width = width;
          this.height = height;
        }
      }
      (globalThis as { ImageData?: unknown }).ImageData = FakeImageData;
      restore.push(() => delete (globalThis as { ImageData?: unknown }).ImageData);
    }
  });
  afterAll(() => restore.forEach((r) => r()));

  const view = { width: 400, height: 700 };

  it('bakes October as it always was, and lets every chunk go when the season turns', () => {
    const ground = new Ground(parseMap(TOWN), CLUTTER.town);
    expect(ground.looks).toBe('autumn');
    ground.draw(stubContext(), { x: 0, y: 0 }, view);
    const baked = ground.memory.chunks;
    expect(baked).toBeGreaterThan(0);

    // The same look again changes nothing: nothing is baked afresh.
    ground.look('autumn');
    expect(ground.memory.chunks).toBe(baked);

    ground.look('winter');
    expect(ground.looks).toBe('winter');
    expect(ground.memory.chunks).toBe(0);
    ground.draw(stubContext(), { x: 0, y: 0 }, view);
    expect(ground.memory.chunks).toBe(baked);

    // A day later it's still winter: the chunks are kept.
    ground.look('winter');
    expect(ground.memory.chunks).toBe(baked);
  });

  it('bakes a chunk once a season, never a frame', () => {
    const ground = new Ground(parseMap(TOWN), CLUTTER.town);
    ground.look('spring');
    const made = vi.mocked(HTMLCanvasElement.prototype.getContext).mock.calls.length;
    ground.draw(stubContext(), { x: 0, y: 0 }, view);
    const afterFirst = vi.mocked(HTMLCanvasElement.prototype.getContext).mock.calls.length;
    expect(afterFirst).toBeGreaterThan(made);
    for (let i = 0; i < 5; i++) ground.draw(stubContext(), { x: 0, y: 0 }, view);
    expect(vi.mocked(HTMLCanvasElement.prototype.getContext).mock.calls.length).toBe(afterFirst);
  });
});
