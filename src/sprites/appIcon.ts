import { letters, lettersWidth } from './buildings';
import { PALETTE as C } from './palette';
import { Sketch } from './sketch';
import { rasterize, type Palette, type Raster } from './sprite';

/*
 * The app's icon and its splash (V1's L5, decision 295): her plum house at night, windows lit,
 * a jack-o'-lantern on the lawn and the moon up, drawn at 64 pixels so it's 8 to a pixel at 512,
 * 3 at 192, and the middle 60 three to a pixel at 180. What matters stays inside the middle 80%,
 * the circle a maskable icon is cut to. `npm run icons` writes the PNGs from it.
 */

export const ICON_GRID = 64;

const PALETTE: Palette = {
  '.': null,
  o: C.ink,
  a: C.ink,
  b: C.night,
  c: C.dusk,
  d: C.plum,
  s: C.candleBright,
  t: C.lavender,
  m: C.cream,
  M: C.creamShade,
  g: C.hedge,
  G: C.hedgeDark,
  h: C.hedgeLight,
  w: C.cream,
  W: C.creamShade,
  r: C.plum,
  R: C.plumLight,
  e: C.night,
  k: C.stone,
  K: C.stoneDark,
  n: C.maroon,
  N: C.maroonShade,
  y: C.candle,
  Y: C.candleBright,
  p: C.pumpkin,
  P: C.pumpkinLight,
  q: C.pumpkinDark,
  l: C.leafDark,
  v: C.plum,
  V: C.plumLight,
};

/** The icon's picture, 64 pixels square, full-bleed. */
export function iconSketch(): Sketch {
  const n = ICON_GRID;
  const s = new Sketch(n, n, 'a');
  // The sky, darkest at the top, dithered between its bands.
  const bands = ['a', 'b', 'c', 'd'];
  for (let y = 0; y < n; y++) {
    const at = y / 14;
    const band = Math.min(bands.length - 1, Math.floor(at));
    const near = at - band > 0.75 && band < bands.length - 1;
    for (let x = 0; x < n; x++) {
      s.set(x, y, bands[near && (x + y) % 2 === 0 ? band + 1 : band]!);
    }
  }
  for (const [x, y, big] of [
    [8, 9, true],
    [17, 4, false],
    [26, 11, false],
    [56, 30, false],
    [5, 22, false],
    [58, 4, true],
    [36, 6, false],
  ] as const) {
    s.set(x, y, 's');
    if (big)
      s.set(x - 1, y, 't')
        .set(x + 1, y, 't')
        .set(x, y - 1, 't')
        .set(x, y + 1, 't');
  }
  // The moon, a fat crescent up on the right.
  const moon = new Sketch(n, n);
  moon.ellipse(51, 11, 6, 6, 'm').ellipse(54, 9, 5, 5, '.').set(47, 12, 'M').set(49, 15, 'M');
  s.stamp(moon, 0, 0);
  // The lawn, a low hill the house sits on.
  s.ellipse(32, 72, 46, 22, 'g').bevel('g', 'h', null);
  s.ellipse(32, 74, 40, 18, 'G');
  // Her house: plum roof, cream boards, lit windows, a maroon door.
  const house = new Sketch(n, n);
  house.rect(40, 15, 4, 9, 'k').rect(40, 15, 4, 1, 'K');
  for (let y = 14; y <= 30; y++) {
    const half = Math.round(((y - 14) / 16) * 19) + 1;
    house.rect(32 - half, y, half * 2, 1, 'r');
  }
  house.bevel('r', 'R', null);
  for (let y = 18; y <= 30; y += 3) house.replace('r', 'e', (x, yy) => yy === y && x % 2 === 0);
  house.rect(17, 31, 30, 19, 'w');
  for (let y = 33; y < 50; y += 3) house.rect(17, y, 30, 1, 'W');
  house.rect(14, 30, 36, 1, 'R');
  house.ellipse(32, 23, 3, 3, 'y').set(31, 22, 'Y').rect(32, 20, 1, 6, 'n').rect(29, 23, 6, 1, 'n');
  for (const x of [20, 38]) {
    house
      .rect(x, 34, 7, 7, 'y')
      .rect(x + 3, 34, 1, 7, 'n')
      .rect(x, 37, 7, 1, 'n');
    house.set(x + 1, 35, 'Y').set(x + 4, 35, 'Y');
    house.rect(x - 1, 41, 9, 1, 'k');
  }
  house.rect(29, 39, 7, 11, 'n').rect(30, 38, 5, 1, 'n').set(34, 44, 'y');
  house.rect(31, 39, 1, 11, 'N');
  house.rect(27, 50, 11, 1, 'k');
  house.outline((key) => (key === 'y' || key === 'Y' ? null : 'o'));
  s.stamp(house, 0, 0);
  // A jack-o'-lantern on the lawn, lit.
  const pumpkin = new Sketch(n, n);
  pumpkin.ellipse(14, 53, 5, 4, 'p').bevel('p', 'P', 'q').rect(13, 48, 2, 2, 'l');
  pumpkin.set(12, 52, 'y').set(16, 52, 'y').rect(12, 55, 5, 1, 'y').set(14, 54, 'Y');
  pumpkin.outline(() => 'o');
  s.stamp(pumpkin, 0, 0);
  return s;
}

/** The icon's pixels. */
export function appIcon(): Raster {
  return rasterize(iconSketch().toSource(), PALETTE);
}

/**
 * A launch screen (`apple-touch-startup-image`) of a phone's size in device pixels: the night,
 * the icon's picture at the biggest whole scale that leaves room, and the town's name under it
 * in the signs' lettering.
 */
export function splash(width: number, height: number): Raster {
  const icon = iconSketch();
  const scale = Math.max(1, Math.floor(Math.min(width * 0.55, height * 0.3) / ICON_GRID));
  const name = 'MCFRANCISVILLE';
  const word = new Sketch(lettersWidth(name), 5);
  letters(word, name, 0, 0, 's');
  const wordScale = Math.max(1, Math.floor((ICON_GRID * scale * 0.9) / word.width));
  const data = new Uint8ClampedArray(width * height * 4);
  const fill = hex(C.night);
  for (let i = 0; i < width * height; i++) data.set([...fill, 255], i * 4);
  const top = Math.round(height * 0.42 - (ICON_GRID * scale) / 2);
  const blit = (sketch: Sketch, k: number, left: number, at: number) => {
    const r = rasterize(sketch.toSource(), PALETTE);
    for (let y = 0; y < r.height * k; y++) {
      for (let x = 0; x < r.width * k; x++) {
        const from = (Math.floor(y / k) * r.width + Math.floor(x / k)) * 4;
        if (r.data[from + 3] === 0) continue;
        const px = left + x;
        const py = at + y;
        if (px < 0 || py < 0 || px >= width || py >= height) continue;
        data.set(r.data.subarray(from, from + 4), (py * width + px) * 4);
      }
    }
  };
  blit(icon, scale, Math.round((width - ICON_GRID * scale) / 2), top);
  const wordTop = top + ICON_GRID * scale + Math.round(scale * 6);
  blit(word, wordScale, Math.round((width - word.width * wordScale) / 2), wordTop);
  return { width, height, data };
}

function hex(colour: string): [number, number, number] {
  const n = parseInt(colour.slice(1), 16);
  return [(n >> 16) & 0xff, (n >> 8) & 0xff, n & 0xff];
}
