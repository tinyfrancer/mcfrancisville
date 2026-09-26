export const TILE_SIZE = 16;

/** How many tiles fit across the short side of the screen; everything else follows from this. */
export const TILES_ACROSS = 15;

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
  const scale = Math.max(1, Math.floor(shortSide / (TILES_ACROSS * TILE_SIZE)));
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
