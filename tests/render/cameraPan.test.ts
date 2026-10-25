import { describe, expect, it } from 'vitest';
import { FollowCamera } from '../../src/render/camera';

describe("the photo mode's look about (1.5's G5)", () => {
  const view = { width: 384, height: 700 };
  const map = { width: 1280, height: 1600 };

  it('looks away from her by what her finger moved, and stops at the edges', () => {
    const cam = new FollowCamera();
    const her = { x: 144, y: 304 };
    cam.follow(her, 16);
    const at = cam.origin(her, view, map);
    expect(at).toEqual({ x: 0, y: 0 });
    cam.pan({ x: 200, y: 100 });
    const looked = cam.origin(her, view, map);
    expect(looked.x).toBeGreaterThan(0);
    expect(looked.y).toBeGreaterThan(0);
    cam.pan({ x: -10_000, y: -10_000 });
    expect(cam.origin(her, view, map)).toEqual({ x: 0, y: 0 });
    // Pinned at the edge, dragging back comes back at once.
    cam.pan({ x: 30, y: 0 });
    expect(cam.origin(her, view, map).x).toBeGreaterThan(0);
    cam.pan(null);
    expect(cam.origin(her, view, map)).toEqual(at);
  });
});
