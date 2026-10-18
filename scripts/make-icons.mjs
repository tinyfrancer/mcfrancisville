/**
 * Draws the app icons and the launch screens and writes them as PNGs into public/.
 *
 * The icons are the one place the game needs image files (iOS will not take a canvas as a
 * home-screen icon or a splash), so they are generated from code like every other sprite
 * (decisions.md 2) and committed. The picture is `src/sprites/appIcon.ts` (V1's L5, decision
 * 295), a 64-pixel grid, loaded through Vite's module runner as `npm run sprite` loads the
 * catalogue. Rerun with `npm run icons` after changing it.
 */
import { mkdirSync, writeFileSync } from 'node:fs';
import { crc32, deflateSync } from 'node:zlib';
import { runnerImport } from 'vite';

/** @typedef {{ width: number, height: number, data: Uint8ClampedArray }} Raster */

const { module } = /** @type {{ module: {
  appIcon: () => Raster,
  splash: (width: number, height: number) => Raster,
  ICON_GRID: number,
} }} */ (await runnerImport('/src/sprites/appIcon.ts', { logLevel: 'silent' }));

/**
 * The launch screens, a phone each by its screen in CSS pixels and its pixel ratio, upright:
 * every iPhone since the X, and the SE. `index.html` names each with its media query.
 * @type {[number, number, number][]}
 */
export const SPLASHES = [
  [440, 956, 3],
  [402, 874, 3],
  [430, 932, 3],
  [393, 852, 3],
  [428, 926, 3],
  [390, 844, 3],
  [375, 812, 3],
  [414, 896, 3],
  [414, 896, 2],
  [375, 667, 2],
];

/**
 * A raster as a PNG, `scale` device pixels to each of its pixels, cropped by `crop` of its own
 * pixels on every side.
 * @param {Raster} r @param {number} scale @param {number} [crop]
 */
function png(r, scale, crop = 0) {
  const width = (r.width - crop * 2) * scale;
  const height = (r.height - crop * 2) * scale;
  const rows = [];
  for (let y = 0; y < height; y++) {
    const row = Buffer.alloc(1 + width * 3);
    for (let x = 0; x < width; x++) {
      const at = ((Math.floor(y / scale) + crop) * r.width + Math.floor(x / scale) + crop) * 4;
      row.set([r.data[at] ?? 0, r.data[at + 1] ?? 0, r.data[at + 2] ?? 0], 1 + x * 3);
    }
    rows.push(row);
  }
  const header = Buffer.alloc(13);
  header.writeUInt32BE(width, 0);
  header.writeUInt32BE(height, 4);
  header.set([8, 2, 0, 0, 0], 8); // 8-bit RGB, no interlace
  return Buffer.concat([
    Buffer.from([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a]),
    chunk('IHDR', header),
    chunk('IDAT', deflateSync(Buffer.concat(rows), { level: 9 })),
    chunk('IEND', Buffer.alloc(0)),
  ]);
}

/** @param {string} type @param {Buffer} data */
function chunk(type, data) {
  const length = Buffer.alloc(4);
  length.writeUInt32BE(data.length);
  const body = Buffer.concat([Buffer.from(type, 'ascii'), data]);
  const crc = Buffer.alloc(4);
  crc.writeUInt32BE(crc32(body));
  return Buffer.concat([length, body, crc]);
}

const icons = new URL('../public/icons/', import.meta.url);
mkdirSync(icons, { recursive: true });
const icon = module.appIcon();
const grid = module.ICON_GRID;
for (const [name, scale, crop] of /** @type {const} */ ([
  ['icon-192.png', 192 / grid, 0],
  ['icon-512.png', 512 / grid, 0],
  // 180 isn't a whole number of 64s: the middle 60 at three each, the sky's edge let go.
  ['apple-touch-icon.png', 3, 2],
])) {
  writeFileSync(new URL(name, icons), png(icon, scale, crop));
  console.log(`wrote public/icons/${name}`);
}

const splashes = new URL('../public/splash/', import.meta.url);
mkdirSync(splashes, { recursive: true });
for (const [w, h, ratio] of SPLASHES) {
  const name = `${w * ratio}x${h * ratio}.png`;
  writeFileSync(new URL(name, splashes), png(module.splash(w * ratio, h * ratio), 1));
  console.log(`wrote public/splash/${name}`);
}
