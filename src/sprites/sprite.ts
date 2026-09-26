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
