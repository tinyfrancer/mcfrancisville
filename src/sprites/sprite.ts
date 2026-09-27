/**
 * A sprite is a picture written as text: one string per row, one character per pixel. The
 * characters are *semantic* keys (`s` skin, `h` hair, `r` roof…), not colours, so one grid drawn
 * once is every colourway of itself — a palette swap is a recolour (decisions.md 2).
 */
export interface SpriteSource {
  rows: readonly string[];
}

/** Key to CSS hex colour. `null` is transparent. */
export type Palette = Readonly<Record<string, string | null>>;

export interface RasterOptions {
  flipX?: boolean;
  /** How many pixels a side each cell of the grid becomes, for art drawn at an older density. */
  scale?: number;
}

export interface Raster {
  width: number;
  height: number;
  /** RGBA, row-major, the layout ImageData takes. */
  data: Uint8ClampedArray<ArrayBuffer>;
}

export function spriteSize(source: SpriteSource): { width: number; height: number } {
  return { width: source.rows[0]?.length ?? 0, height: source.rows.length };
}

function parseHex(hex: string): [number, number, number] {
  const match = /^#([0-9a-f]{6})$/i.exec(hex);
  if (!match) throw new Error(`not a #rrggbb colour: ${hex}`);
  const n = parseInt(match[1]!, 16);
  return [(n >> 16) & 0xff, (n >> 8) & 0xff, n & 0xff];
}

export function rasterize(
  source: SpriteSource,
  palette: Palette,
  options: RasterOptions = {},
): Raster {
  const { width, height } = spriteSize(source);
  if (options.scale && options.scale !== 1) {
    return enlarge(rasterize(source, palette, { ...options, scale: 1 }), options.scale);
  }
  const data = new Uint8ClampedArray(width * height * 4);
  const colours = new Map<string, [number, number, number] | null>();
  source.rows.forEach((row, y) => {
    if (row.length !== width) {
      throw new Error(`row ${y} is ${row.length} wide, expected ${width}`);
    }
    for (let x = 0; x < width; x++) {
      const key = row[x]!;
      if (!colours.has(key)) {
        if (!(key in palette)) throw new Error(`key '${key}' is not in the palette`);
        const hex = palette[key];
        colours.set(key, hex ? parseHex(hex) : null);
      }
      const rgb = colours.get(key);
      if (!rgb) continue;
      const dx = options.flipX ? width - 1 - x : x;
      const at = (y * width + dx) * 4;
      data[at] = rgb[0];
      data[at + 1] = rgb[1];
      data[at + 2] = rgb[2];
      data[at + 3] = 255;
    }
  });
  return { width, height, data };
}

/** A sprite and the palette it is drawn in: one layer of a paper doll, or a whole prop. */
export interface Layer {
  source: SpriteSource;
  palette: Palette;
}

/**
 * Rasterizes layers bottom first into one picture, each opaque pixel covering what is below it.
 * Every layer must be the size of the first.
 */
export function rasterizeLayers(layers: readonly Layer[], options: RasterOptions = {}): Raster {
  const first = layers[0];
  if (!first) throw new Error('no layers');
  if (options.scale && options.scale !== 1) {
    return enlarge(rasterizeLayers(layers, { ...options, scale: 1 }), options.scale);
  }
  const { width, height } = spriteSize(first.source);
  const data = new Uint8ClampedArray(width * height * 4);
  layers.forEach((layer, i) => {
    const size = spriteSize(layer.source);
    if (size.width !== width || size.height !== height) {
      throw new Error(`layer ${i} is ${size.width}x${size.height}, expected ${width}x${height}`);
    }
    const raster = rasterize(layer.source, layer.palette, options);
    for (let at = 0; at < data.length; at += 4) {
      if (raster.data[at + 3] === 0) continue;
      data.set(raster.data.subarray(at, at + 4), at);
    }
  });
  return { width, height, data };
}

/** A raster made `scale` times bigger each way, every pixel a crisp square of itself. */
export function enlarge(raster: Raster, scale: number): Raster {
  if (!Number.isInteger(scale) || scale < 1) throw new Error(`not a whole scale: ${scale}`);
  const width = raster.width * scale;
  const height = raster.height * scale;
  const data = new Uint8ClampedArray(width * height * 4);
  for (let y = 0; y < height; y++) {
    const from = Math.floor(y / scale) * raster.width;
    for (let x = 0; x < width; x++) {
      const at = (from + Math.floor(x / scale)) * 4;
      data.set(raster.data.subarray(at, at + 4), (y * width + x) * 4);
    }
  }
  return { width, height, data };
}
