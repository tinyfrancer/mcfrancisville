/**
 * Renders sprites from the catalogue (`src/sprites/catalogue.ts`) to PNGs, for looking at art
 * without a browser: `npm run sprite -- scale:*` writes the scale sheet to `.sprites/`.
 *
 *   npm run sprite                       the scale sheet
 *   npm run sprite -- prop:house doll:*  sprites by name, `*` matching anything
 *   npm run sprite -- --list [pattern]   the names, without drawing them
 *   --zoom=4                             pixels a side for each of the sprite's (default 4)
 *   --out=dir                            where the PNGs go (default .sprites)
 *   --sheet                              everything matched on one PNG, in rows, as well
 *
 * The catalogue is TypeScript written for Vite, so it is loaded through Vite's module runner
 * rather than by Node directly.
 */
import { mkdirSync, writeFileSync } from 'node:fs';
import { join } from 'node:path';
import { crc32, deflateSync } from 'node:zlib';
import { runnerImport } from 'vite';

const args = process.argv.slice(2);
const flag = (/** @type {string} */ name) =>
  args.find((a) => a.startsWith(`--${name}=`))?.split('=')[1];
const zoom = Number(flag('zoom') ?? 4);
const out = flag('out') ?? '.sprites';
const listing = args.includes('--list');
const sheet = args.includes('--sheet');
const patterns = args.filter((a) => !a.startsWith('--'));
if (!Number.isInteger(zoom) || zoom < 1) throw new Error(`--zoom must be a whole number: ${zoom}`);

/** @typedef {{ width: number, height: number, data: Uint8ClampedArray }} Raster */
/** @typedef {{ name: string, draw: () => Raster }} Entry */

const { module } = /** @type {{ module: { catalogue: () => Entry[] } }} */ (
  await runnerImport('/src/sprites/catalogue.ts', { logLevel: 'silent' })
);

/** @param {string} pattern */
function matcher(pattern) {
  const escaped = pattern.replace(/[.+?^${}()|[\]\\]/g, '\\$&').replace(/\*/g, '.*');
  return new RegExp(`^${escaped}$`);
}

const wanted = (patterns.length > 0 ? patterns : listing ? ['*'] : ['scale:*']).map(matcher);
const entries = module.catalogue().filter((e) => wanted.some((re) => re.test(e.name)));
if (entries.length === 0) {
  console.error(`no sprite matches ${patterns.join(' ')}; try --list`);
  process.exit(1);
}

if (listing) {
  for (const e of entries) console.log(e.name);
  process.exit(0);
}

mkdirSync(out, { recursive: true });
/** @type {Raster[]} */
const drawn = [];
for (const entry of entries) {
  const raster = entry.draw();
  drawn.push(raster);
  const file = join(out, `${entry.name.replace(/[:/]/g, '-')}.png`);
  writeFileSync(file, png(raster, zoom));
  console.log(`${file}  ${raster.width}×${raster.height}`);
}
if (sheet) {
  const file = join(out, 'sheet.png');
  writeFileSync(file, png(arrange(drawn), zoom));
  console.log(`${file}  (${drawn.length} sprites)`);
}

/**
 * Lays rasters out left to right in rows about 512 pixels wide, a few pixels apart, on the dusk
 * the gallery shows them on.
 * @param {Raster[]} rasters
 * @returns {Raster}
 */
function arrange(rasters) {
  const GAP = 4;
  const ROW = 512;
  /** @type {{ r: Raster, x: number, y: number }[]} */
  const placed = [];
  let x = GAP;
  let y = GAP;
  let rowHeight = 0;
  let width = 0;
  for (const r of rasters) {
    if (x > GAP && x + r.width > ROW) {
      x = GAP;
      y += rowHeight + GAP;
      rowHeight = 0;
    }
    placed.push({ r, x, y });
    x += r.width + GAP;
    width = Math.max(width, x);
    rowHeight = Math.max(rowHeight, r.height);
  }
  const height = y + rowHeight + GAP;
  const data = new Uint8ClampedArray(width * height * 4);
  for (let i = 0; i < data.length; i += 4) data.set([0x3b, 0x2c, 0x55, 255], i);
  for (const { r, x: px, y: py } of placed) {
    for (let j = 0; j < r.height; j++) {
      for (let i = 0; i < r.width; i++) {
        const from = (j * r.width + i) * 4;
        if (r.data[from + 3] === 0) continue;
        data.set(r.data.subarray(from, from + 4), ((py + j) * width + px + i) * 4);
      }
    }
  }
  return { width, height, data };
}

/**
 * An RGBA PNG of a raster, each pixel a `zoom`-sided square.
 * @param {Raster} raster
 * @param {number} zoom
 */
function png(raster, zoom) {
  const width = raster.width * zoom;
  const height = raster.height * zoom;
  const rows = [];
  for (let y = 0; y < height; y++) {
    const row = Buffer.alloc(1 + width * 4);
    const sy = Math.floor(y / zoom);
    for (let x = 0; x < width; x++) {
      const at = (sy * raster.width + Math.floor(x / zoom)) * 4;
      for (let c = 0; c < 4; c++) row[1 + x * 4 + c] = raster.data[at + c] ?? 0;
    }
    rows.push(row);
  }
  const header = Buffer.alloc(13);
  header.writeUInt32BE(width, 0);
  header.writeUInt32BE(height, 4);
  header[8] = 8; // bit depth
  header[9] = 6; // RGBA
  return Buffer.concat([
    Buffer.from([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a]),
    chunk('IHDR', header),
    chunk('IDAT', deflateSync(Buffer.concat(rows))),
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
