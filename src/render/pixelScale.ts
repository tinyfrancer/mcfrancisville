import { TILE_SIZE } from '../config/world';

export { TILE_SIZE };

/**
 * About how many tiles show across the short side of the screen; everything else follows from
 * this. A whole scale can't hit it exactly, so the fit picks whichever scale comes nearest.
 */
export const TILES_ACROSS = 16;

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
export function fitPixelScale(cssWidth: number, cssHeight: number, dpr: number): PixelFit {
  const ratio = dpr > 0 ? dpr : 1;
  const deviceWidth = Math.max(1, Math.round(cssWidth * ratio));
  const deviceHeight = Math.max(1, Math.round(cssHeight * ratio));
  const shortSide = Math.min(deviceWidth, deviceHeight);
  const scale = nearestScale(shortSide / (TILES_ACROSS * TILE_SIZE));
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
