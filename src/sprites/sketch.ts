import type { SpriteSource } from './sprite';

/** The key a sketch leaves see-through. */
export const CLEAR = '.';

/**
 * Where the light comes from: the top left, a little in front (`docs/art_style.md`). Unit length.
 */
const LIGHT = normalise([-0.55, -0.7, 0.9]);

/** A 4×4 ordered-dither threshold, for a ramp that steps through its tones without banding. */
const BAYER = [0, 8, 2, 10, 12, 4, 14, 6, 3, 11, 1, 9, 15, 7, 13, 5].map((n) => (n + 0.5) / 16);

function normalise(v: readonly [number, number, number]): [number, number, number] {
  const length = Math.hypot(...v);
  return [v[0] / length, v[1] / length, v[2] / length];
}

/**
 * A grid of semantic keys being drawn, for art too big to type out a pixel at a time (decision 79).
 * Each call paints keys, never colours, so what comes out is an ordinary `SpriteSource` and still
 * recolours by palette swap (decision 2). Everything outside the grid is quietly ignored, so a
 * shape can hang off an edge.
 */
export class Sketch {
  readonly width: number;
  readonly height: number;
  private readonly cells: string[];

  constructor(width: number, height: number, fill = CLEAR) {
    if (fill.length !== 1) throw new Error(`a key is one character: '${fill}'`);
    this.width = width;
    this.height = height;
    this.cells = Array.from({ length: width * height }, () => fill);
  }

  /** A sketch to draw over, starting from a grid. */
  static from(source: SpriteSource): Sketch {
    const width = source.rows[0]?.length ?? 0;
    const sketch = new Sketch(width, source.rows.length);
    source.rows.forEach((row, y) => [...row].forEach((key, x) => sketch.set(x, y, key)));
    return sketch;
  }

  /** The key at a pixel, or undefined off the grid. */
  get(x: number, y: number): string | undefined {
    if (!this.inside(x, y)) return undefined;
    return this.cells[y * this.width + x];
  }

  set(x: number, y: number, key: string): this {
    if (key.length !== 1) throw new Error(`a key is one character: '${key}'`);
    if (this.inside(x, y)) this.cells[y * this.width + x] = key;
    return this;
  }

  /** Whether a pixel is painted: on the grid and not clear. */
  filled(x: number, y: number): boolean {
    const key = this.get(x, y);
    return key !== undefined && key !== CLEAR;
  }

  rect(x: number, y: number, w: number, h: number, key: string): this {
    for (let j = y; j < y + h; j++) for (let i = x; i < x + w; i++) this.set(i, j, key);
    return this;
  }

  /**
   * A filled ellipse. The centre and radii are measured between pixels, so `ellipse(8, 8, 4, 4)`
   * is 8 pixels across, centred on the corner between pixels 7 and 8; a half-pixel centre gives
   * an odd width with a middle column.
   */
  ellipse(cx: number, cy: number, rx: number, ry: number, key: string): this {
    this.eachInEllipse(cx, cy, rx, ry, (x, y) => this.set(x, y, key));
    return this;
  }

  /** A line one pixel thick from one pixel to another (Bresenham's). */
  line(x0: number, y0: number, x1: number, y1: number, key: string): this {
    const dx = Math.abs(x1 - x0);
    const dy = -Math.abs(y1 - y0);
    const sx = x0 < x1 ? 1 : -1;
    const sy = y0 < y1 ? 1 : -1;
    let err = dx + dy;
    let x = x0;
    let y = y0;
    for (;;) {
      this.set(x, y, key);
      if (x === x1 && y === y1) return this;
      const e2 = 2 * err;
      if (e2 >= dy) {
        err += dy;
        x += sx;
      }
      if (e2 <= dx) {
        err += dx;
        y += sy;
      }
    }
  }

  /**
   * A round thing lit from the top left: an ellipse filled from `ramp`, a string of keys from the
   * darkest tone to the lightest. `dither` blends each step into the next with an ordered
   * pattern instead of a hard band, which suits big soft shapes (a canopy, a pumpkin).
   */
  sphere(
    cx: number,
    cy: number,
    rx: number,
    ry: number,
    ramp: string,
    options: { dither?: boolean } = {},
  ): this {
    this.eachInEllipse(cx, cy, rx, ry, (x, y) => {
      const nx = (x + 0.5 - cx) / rx;
      const ny = (y + 0.5 - cy) / ry;
      const nz = Math.sqrt(Math.max(0, 1 - nx * nx - ny * ny));
      const lit = Math.max(0, nx * LIGHT[0] + ny * LIGHT[1] + nz * LIGHT[2]);
      const at = lit * (ramp.length - 1);
      const step = options.dither
        ? Math.floor(at) + (at % 1 > BAYER[(y % 4) * 4 + (x % 4)]! ? 1 : 0)
        : Math.round(at);
      this.set(x, y, ramp[Math.min(ramp.length - 1, step)]!);
    });
    return this;
  }

  /**
   * Copies another grid's painted pixels onto this one with its top left at (x, y), leaving
   * this one's showing through the other's clear ones.
   */
  stamp(top: SpriteSource | Sketch, x: number, y: number, options: { flipX?: boolean } = {}): this {
    top.rows.forEach((row, j) => {
      for (let i = 0; i < row.length; i++) {
        const key = row[options.flipX ? row.length - 1 - i : i]!;
        if (key !== CLEAR) this.set(x + i, y + j, key);
      }
    });
    return this;
  }

  /** Swaps one key for another, everywhere or only where `where` says. */
  replace(from: string, to: string, where?: (x: number, y: number) => boolean): this {
    this.each((x, y, key) => {
      if (key === from && (!where || where(x, y))) this.set(x, y, to);
    });
    return this;
  }

  /**
   * Checkers `from` with `to` inside a rectangle: every other pixel, for a soft transition between
   * two tones. Use it sparingly (`docs/art_style.md`).
   */
  dither(from: string, to: string, x: number, y: number, w: number, h: number, phase = 0): this {
    return this.replace(
      from,
      to,
      (i, j) => i >= x && i < x + w && j >= y && j < y + h && (i + j + phase) % 2 === 0,
    );
  }

  /** Reflects the left half onto the right, for something symmetrical drawn once. */
  mirrorX(): this {
    const half = Math.floor(this.width / 2);
    for (let y = 0; y < this.height; y++) {
      for (let x = 0; x < half; x++) this.set(this.width - 1 - x, y, this.get(x, y)!);
    }
    return this;
  }

  /**
   * Light from the top left, on a flat shape made of `keys`: a pixel whose neighbour above or to
   * the left isn't part of the shape takes `light`, and one whose neighbour below or to the right
   * isn't takes `shade`. Shade wins where both apply, so a thin stroke reads as in shadow.
   */
  bevel(keys: string, light: string | null, shade: string | null): this {
    const inShape = (x: number, y: number) => keys.includes(this.get(x, y) ?? CLEAR);
    const changes: [number, number, string][] = [];
    this.each((x, y, key) => {
      if (!keys.includes(key)) return;
      if (shade && (!inShape(x + 1, y) || !inShape(x, y + 1))) changes.push([x, y, shade]);
      else if (light && (!inShape(x - 1, y) || !inShape(x, y - 1))) changes.push([x, y, light]);
    });
    for (const [x, y, key] of changes) this.set(x, y, key);
    return this;
  }

  /**
   * An outline drawn from the mask of everything painted: each clear pixel touching a painted one
   * (above, below or to the side) takes the outline of the key it touches, from `outlineOf`. A
   * soft outline is the darkest tone of what it wraps rather than black (`docs/art_style.md`), so
   * `outlineOf` usually maps a fill to its own ramp's bottom. A key it gives null for gets none.
   * Where a pixel touches several, the one below it wins, then the sides, then above, so the
   * ground-side edge (where the dark sits) is the one kept.
   */
  outline(outlineOf: Readonly<Record<string, string | null>> | ((key: string) => string | null)) {
    const of = typeof outlineOf === 'function' ? outlineOf : (k: string) => outlineOf[k] ?? null;
    const changes: [number, number, string][] = [];
    this.each((x, y, key) => {
      if (key !== CLEAR) return;
      for (const [dx, dy] of [
        [0, 1],
        [-1, 0],
        [1, 0],
        [0, -1],
      ] as const) {
        const next = this.get(x + dx, y + dy);
        if (next === undefined || next === CLEAR) continue;
        const line = of(next);
        if (line) {
          changes.push([x, y, line]);
          break;
        }
      }
    });
    for (const [x, y, key] of changes) this.set(x, y, key);
    return this;
  }

  get rows(): string[] {
    return Array.from({ length: this.height }, (_, y) =>
      this.cells.slice(y * this.width, (y + 1) * this.width).join(''),
    );
  }

  toSource(): SpriteSource {
    return { rows: this.rows };
  }

  private inside(x: number, y: number): boolean {
    return (
      Number.isInteger(x) &&
      Number.isInteger(y) &&
      x >= 0 &&
      y >= 0 &&
      x < this.width &&
      y < this.height
    );
  }

  private each(visit: (x: number, y: number, key: string) => void): void {
    for (let y = 0; y < this.height; y++) {
      for (let x = 0; x < this.width; x++) visit(x, y, this.cells[y * this.width + x]!);
    }
  }

  private eachInEllipse(
    cx: number,
    cy: number,
    rx: number,
    ry: number,
    visit: (x: number, y: number) => void,
  ): void {
    for (let y = Math.floor(cy - ry); y < Math.ceil(cy + ry); y++) {
      for (let x = Math.floor(cx - rx); x < Math.ceil(cx + rx); x++) {
        const nx = (x + 0.5 - cx) / rx;
        const ny = (y + 0.5 - cy) / ry;
        if (nx * nx + ny * ny <= 1) visit(x, y);
      }
    }
  }
}
