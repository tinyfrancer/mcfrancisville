import { TILE_SIZE } from '../config/world';
import type { Closeness } from '../types/view';

export { TILE_SIZE };

export type { Closeness };

/**
 * About how many tiles show across the short side of the screen at each closeness; everything else
 * follows from this. A whole scale can't hit it exactly, so the fit picks whichever scale comes
 * nearest: on an iPhone, Close is scale 3 (about 12 tiles across, her about 8 mm tall) and Far
 * scale 2 (about 18, the view before V1).
 */
export const TILES_ACROSS: Readonly<Record<Closeness, number>> = { close: 12, far: 16 };

export interface PixelFit {
  /** Device pixels per game pixel. Always a whole number, so no game pixel is ever smeared. */
  scale: number;
  /** The canvas's backing size, in game pixels. Covers the screen, cropping at most one pixel. */
  width: number;
  height: number;
  /** The canvas's CSS size, which is the backing size times `scale`, back in CSS pixels. */
  cssWidth: number;
  cssHeight: number;
}

/**
 * Fits a low-resolution game canvas to a screen at a whole-number scale in *device* pixels.
 *
 * Scaling by a whole number of CSS pixels is not enough: at a devicePixelRatio of 3, a 2x CSS
 * scale is 6 device pixels in one place and a blurred 5-or-7 wherever the layout lands between
 * them, so the art shimmers as the camera moves.
 */
export function fitPixelScale(
  cssWidth: number,
  cssHeight: number,
  dpr: number,
  tilesAcross: number = TILES_ACROSS.close,
): PixelFit {
  const screen = deviceBox(cssWidth, cssHeight, dpr);
  return fitAt(screen, scaleAcross(screen, tilesAcross));
}

/**
 * The fit for a room (decision 290): the whole scale nearest to showing the whole room, so it fills
 * the width rather than floating small in the middle (one a little wider than the screen scrolls by
 * the little it's over), but never farther out than the town at her closeness and never more than
 * one step closer, so she's about her size from place to place. A room far too big for the screen
 * at her closeness scrolls, as before.
 */
export function fitRoom(
  cssWidth: number,
  cssHeight: number,
  dpr: number,
  room: { width: number; height: number },
  tilesAcross: number = TILES_ACROSS.close,
): PixelFit {
  const screen = deviceBox(cssWidth, cssHeight, dpr);
  const outdoors = scaleAcross(screen, tilesAcross);
  const whole = nearestScale(
    Math.min(
      screen.width / (Math.max(1, room.width) * TILE_SIZE),
      screen.height / (Math.max(1, room.height) * TILE_SIZE),
    ),
  );
  return fitAt(screen, Math.min(outdoors + 1, Math.max(outdoors, whole)));
}

interface DeviceBox {
  ratio: number;
  width: number;
  height: number;
}

function deviceBox(cssWidth: number, cssHeight: number, dpr: number): DeviceBox {
  const ratio = dpr > 0 ? dpr : 1;
  return {
    ratio,
    width: Math.max(1, Math.round(cssWidth * ratio)),
    height: Math.max(1, Math.round(cssHeight * ratio)),
  };
}

/** The whole scale that shows nearest `tiles` across the box's short side. */
function scaleAcross(box: DeviceBox, tiles: number): number {
  return nearestScale(Math.min(box.width, box.height) / (tiles * TILE_SIZE));
}

function fitAt(box: DeviceBox, scale: number): PixelFit {
  const { ratio, width: deviceWidth, height: deviceHeight } = box;
  const width = Math.ceil(deviceWidth / scale);
  const height = Math.ceil(deviceHeight / scale);
  return {
    scale,
    width,
    height,
    cssWidth: (width * scale) / ratio,
    cssHeight: (height * scale) / ratio,
  };
}

/**
 * The whole scale nearest `ideal`, judged as a ratio: at 32-pixel tiles one step of scale is a big
 * jump in how much shows, so a phone just short of a step shouldn't drop to the far smaller one.
 */
function nearestScale(ideal: number): number {
  const below = Math.max(1, Math.floor(ideal));
  const above = below + 1;
  // Nearer as a ratio: ideal / below against above / ideal.
  return ideal * ideal > below * above ? above : below;
}

export interface Room {
  /** From the root's corner, in CSS pixels, on a whole device pixel. */
  left: number;
  top: number;
  width: number;
  height: number;
}

/**
 * The world's room between the bars, relative to the root and snapped to whole device pixels: the
 * canvas starts on one, so none of its pixels straddles two of the screen's.
 */
export function placeBetweenBars(
  root: { left: number; top: number },
  view: { left: number; top: number; right: number; bottom: number },
  dpr: number,
): Room {
  const ratio = dpr > 0 ? dpr : 1;
  const snap = (css: number) => Math.round(css * ratio) / ratio;
  const left = snap(view.left - root.left);
  const top = snap(view.top - root.top);
  const right = snap(view.right - root.left);
  const bottom = snap(view.bottom - root.top);
  return { left, top, width: Math.max(0, right - left), height: Math.max(0, bottom - top) };
}
