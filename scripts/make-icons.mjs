/**
 * Draws the app icons from a pixel grid and writes them as PNGs into public/icons/.
 *
 * The icons are the one place the game needs image files (iOS will not take a canvas as a
 * home-screen icon), so they are generated from code like every other sprite (decisions.md 2) and
 * committed. Rerun with `npm run icons` after changing the grid.
 */
import { mkdirSync, writeFileSync } from 'node:fs';
import { crc32, deflateSync } from 'node:zlib';

/** @type {Record<string, [number, number, number]>} */
const COLORS = {
  '.': [0x2a, 0x1f, 0x3d],
  o: [0x7a, 0x3b, 0x12],
  p: [0xf2, 0x8c, 0x28],
  P: [0xff, 0xb3, 0x5c],
  s: [0x4f, 0x6b, 0x4a],
  f: [0xff, 0xd3, 0x7a],
};

const PUMPKIN = [
  '................',
  '........ss......',
  '.......ss.......',
  '...ooooossoooo..',
  '..oppPppppPpppo.',
  '.oppPppppppPpppo',
  '.opPpffppffpPppo',
  '.opPpffppffpPppo',
  '.opPppppppppPppo',
  '.opPpfppppfpPppo',
  '.opPppffffppPppo',
  '.oppPppppppPpppo',
  '..oppPppppPpppo.',
  '...oooooooooo...',
  '................',
  '................',
];

// Two cells of background on every side keeps the pumpkin inside the circle a maskable icon is
// cropped to.
const PAD = 2;
const GRID = PUMPKIN.length + PAD * 2;

/** @param {number} gx @param {number} gy */
function colorAt(gx, gy) {
  const row = PUMPKIN[gy - PAD];
  const key = row?.[gx - PAD] ?? '.';
  const color = COLORS[key];
  if (!color) throw new Error(`no colour for '${key}'`);
  return color;
}

/** @param {number} size */
function png(size) {
  const rows = [];
  for (let y = 0; y < size; y++) {
    const row = Buffer.alloc(1 + size * 3);
    for (let x = 0; x < size; x++) {
      const [r, g, b] = colorAt(Math.floor((x * GRID) / size), Math.floor((y * GRID) / size));
      row.set([r, g, b], 1 + x * 3);
    }
    rows.push(row);
  }
  const header = Buffer.alloc(13);
  header.writeUInt32BE(size, 0);
  header.writeUInt32BE(size, 4);
  header.set([8, 2, 0, 0, 0], 8); // 8-bit RGB, no interlace
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

const out = new URL('../public/icons/', import.meta.url);
mkdirSync(out, { recursive: true });
for (const [name, size] of /** @type {const} */ ([
  ['icon-192.png', 192],
  ['icon-512.png', 512],
  ['apple-touch-icon.png', 180],
])) {
  writeFileSync(new URL(name, out), png(size));
  console.log(`wrote public/icons/${name}`);
}
