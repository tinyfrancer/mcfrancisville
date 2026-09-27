import { describe, expect, it } from 'vitest';
import { cameraOrigin, FollowCamera, screenToWorld, worldToScreen } from '../../src/render/camera';
import { fitPixelScale } from '../../src/render/pixelScale';

const MAP = { width: 480, height: 768 };
const VIEW = { width: 293, height: 633 };

describe('cameraOrigin', () => {
  it('centres on the player in the middle of the map, on whole pixels', () => {
    const cam = cameraOrigin({ x: 240.4, y: 384.6 }, VIEW, MAP);
    expect(cam).toEqual({ x: 240 - 146, y: 385 - 316 });
  });

  it('keeps her the same whole pixels in from the edge of an odd-sized view as she moves', () => {
    for (let x = 200; x < 202; x += 0.1) {
      const cam = cameraOrigin({ x, y: 384 }, VIEW, MAP);
      expect(Math.round(x) - cam.x).toBe(146);
    }
  });

  it('stops at every edge of the map', () => {
    expect(cameraOrigin({ x: 0, y: 0 }, VIEW, MAP)).toEqual({ x: 0, y: 0 });
    expect(cameraOrigin({ x: 480, y: 768 }, VIEW, MAP)).toEqual({
      x: MAP.width - VIEW.width,
      y: MAP.height - VIEW.height,
    });
  });

  it('centres a map smaller than the view', () => {
    const cam = cameraOrigin({ x: 0, y: 0 }, { width: 600, height: 900 }, MAP);
    expect(cam).toEqual({ x: -60, y: -66 });
  });
});

describe('screenToWorld', () => {
  it('round-trips with worldToScreen at the iPhone fit', () => {
    const fit = fitPixelScale(390, 844, 3);
    const rect = { left: 0, top: 0, width: fit.cssWidth, height: fit.cssHeight };
    const camera = { x: 100, y: 200 };
    const world = { x: 180, y: 400 };
    const screen = worldToScreen(world, rect, fit, camera);
    const back = screenToWorld(screen.x, screen.y, rect, fit, camera);
    expect(back.x).toBeCloseTo(world.x);
    expect(back.y).toBeCloseTo(world.y);
  });

  it('maps the top-left of the canvas to the camera origin', () => {
    const rect = { left: 10, top: 20, width: 300, height: 600 };
    expect(screenToWorld(10, 20, rect, { width: 100, height: 200 }, { x: 5, y: 7 })).toEqual({
      x: 5,
      y: 7,
    });
  });
});

describe('FollowCamera', () => {
  /** Walks her along x at `speed` px a second in 120Hz steps, drawing every other one. */
  function walk(camera: FollowCamera, from: number, speed: number, ms: number) {
    const frames: { cam: number; her: number }[] = [];
    let x = from;
    for (let t = 0; t < ms; t += 1000 / 120) {
      x += speed / 120;
      camera.follow({ x, y: 384 }, 1000 / 120);
      frames.push({ cam: camera.origin({ x, y: 384 }, VIEW, MAP).x, her: Math.round(x) });
    }
    return { frames: frames.filter((_, i) => i % 2 === 1), x };
  }

  it('starts on her, and cuts to her when she jumps through a door', () => {
    const camera = new FollowCamera();
    camera.follow({ x: 240, y: 384 }, 8);
    expect(camera.origin({ x: 240, y: 384 }, VIEW, MAP)).toEqual(
      cameraOrigin({ x: 240, y: 384 }, VIEW, MAP),
    );
    camera.follow({ x: 100, y: 300 }, 8);
    expect(camera.origin({ x: 100, y: 300 }, VIEW, MAP)).toEqual(
      cameraOrigin({ x: 100, y: 300 }, VIEW, MAP),
    );
  });

  it('trails behind her as she walks, then settles on her once she stops', () => {
    const camera = new FollowCamera();
    camera.follow({ x: 150, y: 384 }, 8);
    const { frames, x } = walk(camera, 150, 64, 2000);
    const last = frames.at(-1)!;
    expect(last.her - last.cam).toBeGreaterThan(146);
    const settled = walk(camera, x, 0, 1500).frames.at(-1)!;
    expect(settled.her - settled.cam).toBe(146);
  });

  it('never moves the camera back, or her on the screen back and forth, on a steady walk', () => {
    const camera = new FollowCamera();
    camera.follow({ x: 150, y: 384 }, 8);
    const { frames, x } = walk(camera, 150, 64, 2000);
    frames.push(...walk(camera, x, 0, 1500).frames);
    for (let i = 1; i < frames.length; i++) {
      expect(frames[i]!.cam).toBeGreaterThanOrEqual(frames[i - 1]!.cam);
    }
    // On the screen she draws ahead, holds, then comes back to the middle: each at most once.
    const screen = frames.map((f) => f.her - f.cam);
    const turns = screen
      .map((s, i) => Math.sign(s - (screen[i - 1] ?? s)))
      .filter((d) => d !== 0)
      .filter((d, i, all) => i > 0 && d !== all[i - 1]);
    expect(turns.length).toBeLessThanOrEqual(1);
  });

  it('keeps her on the same screen pixel while it keeps pace', () => {
    const camera = new FollowCamera();
    camera.follow({ x: 150, y: 384 }, 8);
    const { frames } = walk(camera, 150, 60, 3000);
    const steady = frames.slice(-60).map((f) => f.her - f.cam);
    expect(new Set(steady).size).toBe(1);
  });
});
