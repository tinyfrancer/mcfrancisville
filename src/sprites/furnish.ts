import {
  ACCENT,
  ACCENT_TWO,
  buildingPalette,
  darkOf,
  DOOR,
  fillOf,
  INK,
  LEAVES,
  lightOf,
  ROOF,
  shadeOf,
  WHITE,
  type Colours,
  type Material,
} from './buildings';
import { PALETTE as C } from './palette';
import type { Sketch } from './sketch';
import type { Palette } from './sprite';

/*
 * What everything indoors is drawn with at 32 (phases H and J): the building kit's materials, so a
 * piece of furniture or a fixture is a shape and a palette of a few base colours, outlined softly
 * by `finish` as the buildings are.
 */

/** Fire, and its brightest heart: never outlined, and lit after dark. */
export const FIRE = 'O';
export const FIRE_LIGHT = 'N';

/** A palette from the kit, with fire in it. */
export function palette(colours: Colours): Palette {
  return { ...buildingPalette(colours), [FIRE]: C.pumpkin, [FIRE_LIGHT]: C.candle };
}

export const FIRE_LIT: Palette = { [FIRE]: C.candle, [FIRE_LIGHT]: C.candleBright };

/** A material lit up after dark: its shade, fill and light in candlelight. */
export function litUp(m: Material): Palette {
  return {
    [shadeOf(m)]: C.candle,
    [fillOf(m)]: C.candle,
    [lightOf(m)]: C.candleBright,
  };
}

/** The woods and the plums most pieces start from. */
export const WOOD = { wall: C.cream, roof: C.plum, trim: C.bark, door: C.berry } as const;

/** Keys a piece's many small things are painted from, in turn. */
export const TRINKETS: readonly Material[] = [ACCENT, ACCENT_TWO, LEAVES, ROOF, DOOR];

/**
 * A block of a material, lit on its top-left edges and shaded on its bottom-right ones. Unlike
 * `Sketch.bevel`, it touches only its own box, so two blocks of one material stay two.
 */
export function slab(s: Sketch, x: number, y: number, w: number, h: number, m: Material): void {
  s.rect(x, y, w, h, fillOf(m));
  s.rect(x, y, w, 1, lightOf(m)).rect(x, y, 1, h, lightOf(m));
  s.rect(x, y + h - 1, w, 1, shadeOf(m)).rect(x + w - 1, y, 1, h, shadeOf(m));
}

/**
 * `Sketch.bevel` for a material's fill, but only inside a box: its edges against anything else lit
 * on the top left and shaded on the bottom right.
 */
export function bevelIn(s: Sketch, x: number, y: number, w: number, h: number, m: Material): void {
  const inShape = (i: number, j: number) => m.slice(2).includes(s.get(i, j) ?? '.');
  const changes: [number, number, string][] = [];
  for (let j = y; j < y + h; j++) {
    for (let i = x; i < x + w; i++) {
      if (s.get(i, j) !== fillOf(m)) continue;
      if (!inShape(i + 1, j) || !inShape(i, j + 1)) changes.push([i, j, shadeOf(m)]);
      else if (!inShape(i - 1, j) || !inShape(i, j - 1)) changes.push([i, j, lightOf(m)]);
    }
  }
  for (const [i, j, key] of changes) s.set(i, j, key);
}

/** A round thing of a material, lit from the top left in its own tones. */
export function ball(
  s: Sketch,
  cx: number,
  cy: number,
  rx: number,
  ry: number,
  m: Material,
  options: { dither?: boolean } = {},
): void {
  s.sphere(cx, cy, rx, ry, m.slice(1), options);
}

/** A candle of `WHITE` wax with its flame on top, `top` being the flame's tip. */
export function candle(s: Sketch, x: number, top: number, height: number, w = 3): void {
  const mid = x + Math.floor(w / 2);
  s.set(mid, top, FIRE);
  s.rect(mid - 1, top + 1, 3, 2, FIRE)
    .set(mid, top + 1, FIRE_LIGHT)
    .set(mid, top + 2, FIRE_LIGHT);
  s.rect(x, top + 3, w, height, WHITE);
  s.set(mid, top + 3, darkOf(ROOF));
}

/**
 * A frame of a material round a picture `w` by `h`, `thick` pixels deep, with a lit top-left
 * and a shaded bottom-right, and a dark line just inside.
 */
export function frame(
  s: Sketch,
  x: number,
  y: number,
  w: number,
  h: number,
  m: Material,
  thick = 3,
): void {
  slab(s, x, y, w, h, m);
  s.rect(x + thick - 1, y + thick - 1, w - 2 * thick + 2, h - 2 * thick + 2, darkOf(m));
}

/** A flowerpot of a material, its rim a little wider, standing on `bottom`. */
export function pot(
  s: Sketch,
  cx: number,
  bottom: number,
  w: number,
  h: number,
  m: Material,
): void {
  const x = Math.round(cx - w / 2);
  for (let j = 0; j < h - 3; j++) {
    const inset = Math.floor((j * 2) / (h - 3));
    s.rect(x + 1 + inset, bottom - h + 3 + j, w - 2 - 2 * inset, 1, fillOf(m));
  }
  bevelIn(s, x, bottom - h, w, h, m);
  slab(s, x, bottom - h, w, 4, m);
  s.rect(x + 1, bottom - h + 3, w - 2, 1, darkOf(m));
}

/** A shape filled row by row, `widthAt(y)` wide and centred on `cx`. */
export function column(
  s: Sketch,
  cx: number,
  top: number,
  height: number,
  widthAt: (j: number) => number,
  key: string,
): void {
  for (let j = 0; j < height; j++) {
    const w = Math.round(widthAt(j));
    s.rect(Math.round(cx - w / 2), top + j, w, 1, key);
  }
}

/** A little bat, wings out, `INK`, with two white eyes: 15 wide and 7 tall from its top left. */
export function bat(s: Sketch, x: number, y: number): void {
  s.ellipse(x + 7.5, y + 3.5, 2.5, 3, INK);
  s.set(x + 6, y, INK).set(x + 9, y, INK);
  for (const side of [-1, 1]) {
    const wx = side < 0 ? x : x + 9;
    s.rect(wx, y + 2, 6, 2, INK);
    s.rect(side < 0 ? wx : wx + 2, y + 1, 4, 1, INK);
    s.set(side < 0 ? wx : wx + 5, y + 4, INK).set(side < 0 ? wx + 2 : wx + 3, y + 4, INK);
  }
  s.set(x + 6, y + 3, WHITE).set(x + 8, y + 3, WHITE);
}
