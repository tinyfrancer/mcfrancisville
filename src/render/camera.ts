export interface Point {
  x: number;
  y: number;
}

export interface Size {
  width: number;
  height: number;
}

/**
 * The world pixel at the view's top-left. It centres on the player but stops at the map's edges so
 * the hedge is the end of the world rather than a void, and it lands on whole game pixels so sprites
 * never straddle two screen pixels. A map smaller than the view is centred in it instead.
 */
export function cameraOrigin(focus: Point, view: Size, map: Size): Point {
  const axis = (centre: number, viewLen: number, mapLen: number): number => {
    if (mapLen <= viewLen) return Math.round((mapLen - viewLen) / 2);
    const ideal = Math.round(centre - viewLen / 2);
    return Math.min(Math.max(ideal, 0), mapLen - viewLen);
  };
  return {
    x: axis(focus.x, view.width, map.width),
    y: axis(focus.y, view.height, map.height),
  };
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
