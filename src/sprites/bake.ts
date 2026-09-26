import {
  rasterize,
  rasterizeLayers,
  type Layer,
  type Palette,
  type Raster,
  type RasterOptions,
  type SpriteSource,
} from './sprite';

const cache = new Map<string, HTMLCanvasElement>();

/**
 * Draws a sprite once and hands back the same canvas every time after. The key names the
 * combination (sprite, palette, flip), since two palettes of one grid are two different pictures.
 */
export function bake(
  key: string,
  source: SpriteSource,
  palette: Palette,
  options: RasterOptions = {},
): HTMLCanvasElement {
  return cached(key, () => rasterize(source, palette, options));
}

/** `bake` for a stack of layers, such as the paper doll. The key must name every layer. */
export function bakeLayers(
  key: string,
  layers: () => readonly Layer[],
  options: RasterOptions = {},
): HTMLCanvasElement {
  return cached(key, () => rasterizeLayers(layers(), options));
}

function cached(key: string, draw: () => Raster): HTMLCanvasElement {
  const hit = cache.get(key);
  if (hit) return hit;
  const raster = draw();
  const canvas = document.createElement('canvas');
  canvas.width = raster.width;
  canvas.height = raster.height;
  const ctx = canvas.getContext('2d');
  if (!ctx) throw new Error('no 2d context');
  ctx.putImageData(new ImageData(raster.data, raster.width, raster.height), 0, 0);
  cache.set(key, canvas);
  return canvas;
}
