import { describe, expect, it } from 'vitest';
import { cameraOrigin, screenToWorld, worldToScreen } from '../../src/render/camera';
import { fitPixelScale } from '../../src/render/pixelScale';

const MAP = { width: 480, height: 768 };
const VIEW = { width: 293, height: 633 };

describe('cameraOrigin', () => {
  it('centres on the player in the middle of the map, on whole pixels', () => {
    const cam = cameraOrigin({ x: 240.4, y: 384.6 }, VIEW, MAP);
    expect(cam).toEqual({ x: Math.round(240.4 - 146.5), y: Math.round(384.6 - 316.5) });
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
