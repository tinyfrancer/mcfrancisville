export interface Point {
  x: number;
  y: number;
}

export interface Size {
  width: number;
  height: number;
}

/**
 * The world pixel at the view's top-left. It centres on `focus` but stops at the map's edges so
 * the hedge is the end of the world rather than a void, and it lands on whole game pixels so sprites
 * never straddle two screen pixels. A map smaller than the view is centred in it instead.
 *
 * The focus is rounded before the half view is taken off, never after: on a view an odd number of
 * pixels wide, rounding `x - 146.5` and `x` apart puts her 146 pixels in on one frame and 147 on
 * the next, which was the shimmer.
 */
export function cameraOrigin(focus: Point, view: Size, map: Size): Point {
  const axis = (centre: number, viewLen: number, mapLen: number): number => {
    if (mapLen <= viewLen) return Math.round((mapLen - viewLen) / 2);
    const ideal = Math.round(centre) - Math.floor(viewLen / 2);
    return Math.min(Math.max(ideal, 0), mapLen - viewLen);
  };
  return {
    x: axis(focus.x, view.width, map.width),
    y: axis(focus.y, view.height, map.height),
  };
}

/** How long the eased camera takes to close most of the way to her: 63% in this, 95% in 3×. */
export const CAMERA_EASE_MS = 150;

/** Farther than she could walk in a step: she went through a door, so the camera cuts. */
const CUT_DISTANCE = 48;

/** How far the eased lag must drift from the pixels kept before they follow: no knife edge at .5. */
const LAG_HYSTERESIS = 0.75;

/** One axis of the camera: the eased focus, and her drawn pixel's whole-pixel lag ahead of it. */
interface Axis {
  focus: number;
  /** Her drawn pixel less the camera's; the view centres on her pixel minus this. */
  lead: number;
  /** Her drawn pixel at the last step. */
  pixel: number;
}

/**
 * A camera that eases after her, so it drifts on as she stops rather than halting dead, but that
 * never moves the ground a pixel back the way it came. The ease is a smooth focus trailing her;
 * what the view uses is how far she leads it, in whole pixels, and that changes one pixel at a
 * time and only on a step where the change can't send the camera backwards: widening as she steps
 * (the camera holds while she draws ahead), narrowing as she steps or while she's still on that
 * axis (the camera comes on toward her). While it keeps pace, she and the ground move by exactly
 * the same pixels.
 */
export class FollowCamera {
  private axes: { x: Axis; y: Axis } | null = null;

  /** Eases toward her for one step of the simulation. */
  follow(her: Point, deltaMs: number): void {
    const a = this.axes;
    if (!a || Math.hypot(her.x - a.x.focus, her.y - a.y.focus) > CUT_DISTANCE) {
      this.axes = { x: settled(her.x), y: settled(her.y) };
      return;
    }
    const k = 1 - Math.exp(-deltaMs / CAMERA_EASE_MS);
    stepAxis(a.x, her.x, k);
    stepAxis(a.y, her.y, k);
  }

  /** The view's top-left, centred on her drawn pixel less her lead. */
  origin(her: Point, view: Size, map: Size): Point {
    const a = this.axes;
    const focus = a
      ? { x: Math.round(her.x) - a.x.lead, y: Math.round(her.y) - a.y.lead }
      : { x: Math.round(her.x), y: Math.round(her.y) };
    return cameraOrigin(focus, view, map);
  }
}

function settled(at: number): Axis {
  return { focus: at, lead: 0, pixel: Math.round(at) };
}

function stepAxis(axis: Axis, at: number, k: number): void {
  axis.focus += (at - axis.focus) * k;
  const pixel = Math.round(at);
  const stepped = Math.sign(pixel - axis.pixel);
  axis.pixel = pixel;
  const drift = at - axis.focus - axis.lead;
  if (Math.abs(drift) <= LAG_HYSTERESIS) return;
  const change = Math.sign(drift);
  const narrows = Math.abs(axis.lead + change) < Math.abs(axis.lead);
  if (change === stepped || (stepped === 0 && narrows)) axis.lead += change;
}

export interface Rect {
  left: number;
  top: number;
  width: number;
  height: number;
}

/** A point on the page (a tap) to a world pixel, through the canvas's on-screen box and backing size. */
export function screenToWorld(
  clientX: number,
  clientY: number,
  canvasRect: Rect,
  backing: Size,
  camera: Point,
): Point {
  return {
    x: ((clientX - canvasRect.left) * backing.width) / canvasRect.width + camera.x,
    y: ((clientY - canvasRect.top) * backing.height) / canvasRect.height + camera.y,
  };
}

/** The inverse of `screenToWorld`: where on the page a world pixel is drawn. */
export function worldToScreen(world: Point, canvasRect: Rect, backing: Size, camera: Point): Point {
  return {
    x: ((world.x - camera.x) * canvasRect.width) / backing.width + canvasRect.left,
    y: ((world.y - camera.y) * canvasRect.height) / backing.height + canvasRect.top,
  };
}
