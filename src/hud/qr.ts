/**
 * A QR code of our own (V1's S2, decision 323), so the cloud key can be shown as one with no
 * package: ISO 18004 at error correction M, versions 1 to 6 (a 41-square code at most, plenty for
 * a key), in the alphanumeric mode when the text fits it and bytes otherwise. It follows the
 * standard's steps in order: the bits, Reed-Solomon over GF(256), the fixed patterns, the
 * zigzag, the mask with the lowest penalty, and the format bits. Drawn as whole squares by
 * `qrPicture`, as the game's glyphs are.
 */

/** Data codewords at level M for versions 1–6, and how they're split into blocks. */
const DATA_CODEWORDS = [16, 28, 44, 64, 86, 108] as const;
const EC_PER_BLOCK = [10, 16, 26, 18, 24, 16] as const;
const BLOCKS = [1, 1, 1, 2, 2, 4] as const;
const ALIGNMENT = [[], [6, 18], [6, 22], [6, 26], [6, 30], [6, 34]] as const;
const ALPHANUMERIC = '0123456789ABCDEFGHIJKLMNOPQRSTUVWXYZ $%*+-./:';

export interface Qr {
  version: number;
  mask: number;
  size: number;
  /** `modules[y][x]`, true where the square is dark. */
  modules: boolean[][];
}

class Bits {
  readonly bits: number[] = [];
  put(value: number, length: number): void {
    for (let i = length - 1; i >= 0; i--) this.bits.push((value >>> i) & 1);
  }
}

function gfMultiply(x: number, y: number): number {
  let z = 0;
  for (let i = 7; i >= 0; i--) {
    z = (z << 1) ^ ((z >>> 7) * 0x11d);
    z ^= ((y >>> i) & 1) * x;
  }
  return z;
}

function rsDivisor(degree: number): number[] {
  const result = new Array<number>(degree).fill(0);
  result[degree - 1] = 1;
  let root = 1;
  for (let i = 0; i < degree; i++) {
    for (let j = 0; j < result.length; j++) {
      result[j] = gfMultiply(result[j]!, root);
      if (j + 1 < result.length) result[j]! ^= result[j + 1]!;
    }
    root = gfMultiply(root, 0x02);
  }
  return result;
}

function rsRemainder(data: readonly number[], divisor: readonly number[]): number[] {
  const result = new Array<number>(divisor.length).fill(0);
  for (const b of data) {
    const factor = b ^ result.shift()!;
    result.push(0);
    divisor.forEach((coef, i) => (result[i]! ^= gfMultiply(coef, factor)));
  }
  return result;
}

/** The text's segment: its mode, how many characters, and the bits after the count. */
function segment(text: string): { mode: number; count: number; countBits: number; data: Bits } {
  const data = new Bits();
  if ([...text].every((c) => ALPHANUMERIC.includes(c))) {
    for (let i = 0; i + 1 < text.length; i += 2) {
      data.put(ALPHANUMERIC.indexOf(text[i]!) * 45 + ALPHANUMERIC.indexOf(text[i + 1]!), 11);
    }
    if (text.length % 2 === 1) data.put(ALPHANUMERIC.indexOf(text[text.length - 1]!), 6);
    return { mode: 0b0010, count: text.length, countBits: 9, data };
  }
  const bytes = new TextEncoder().encode(text);
  for (const b of bytes) data.put(b, 8);
  return { mode: 0b0100, count: bytes.length, countBits: 8, data };
}

/** The codewords for a version: data padded out, then each block's error correction, interleaved. */
function codewords(text: string): { version: number; words: number[] } {
  const seg = segment(text);
  const needed = 4 + seg.countBits + seg.data.bits.length;
  const v = DATA_CODEWORDS.findIndex((n) => needed <= n * 8);
  if (v < 0) throw new Error('too long for a QR code here');
  const capacity = DATA_CODEWORDS[v]! * 8;
  const bits = new Bits();
  bits.put(seg.mode, 4);
  bits.put(seg.count, seg.countBits);
  bits.bits.push(...seg.data.bits);
  bits.put(0, Math.min(4, capacity - bits.bits.length));
  bits.put(0, (8 - (bits.bits.length % 8)) % 8);
  const data: number[] = [];
  for (let i = 0; i < bits.bits.length; i += 8) {
    data.push(bits.bits.slice(i, i + 8).reduce((byte, bit) => (byte << 1) | bit, 0));
  }
  for (let pad = 0xec; data.length < DATA_CODEWORDS[v]!; pad ^= 0xec ^ 0x11) data.push(pad);

  const blocks = BLOCKS[v]!;
  const perBlock = DATA_CODEWORDS[v]! / blocks;
  const divisor = rsDivisor(EC_PER_BLOCK[v]!);
  const dataBlocks: number[][] = [];
  const ecBlocks: number[][] = [];
  for (let b = 0; b < blocks; b++) {
    const block = data.slice(b * perBlock, (b + 1) * perBlock);
    dataBlocks.push(block);
    ecBlocks.push(rsRemainder(block, divisor));
  }
  const words: number[] = [];
  for (let i = 0; i < perBlock; i++) for (const block of dataBlocks) words.push(block[i]!);
  for (let i = 0; i < EC_PER_BLOCK[v]!; i++) for (const block of ecBlocks) words.push(block[i]!);
  return { version: v + 1, words };
}

const MASKS: readonly ((x: number, y: number) => boolean)[] = [
  (x, y) => (x + y) % 2 === 0,
  (_, y) => y % 2 === 0,
  (x) => x % 3 === 0,
  (x, y) => (x + y) % 3 === 0,
  (x, y) => (Math.floor(x / 3) + Math.floor(y / 2)) % 2 === 0,
  (x, y) => ((x * y) % 2) + ((x * y) % 3) === 0,
  (x, y) => (((x * y) % 2) + ((x * y) % 3)) % 2 === 0,
  (x, y) => (((x + y) % 2) + ((x * y) % 3)) % 2 === 0,
];

/** The fixed patterns, the data in its zigzag, unmasked; and which squares are fixed. */
function layout(version: number, words: readonly number[]) {
  const size = version * 4 + 17;
  const modules = Array.from({ length: size }, () => new Array<boolean>(size).fill(false));
  const fixed = Array.from({ length: size }, () => new Array<boolean>(size).fill(false));
  const set = (x: number, y: number, dark: boolean) => {
    if (x < 0 || y < 0 || x >= size || y >= size) return;
    modules[y]![x] = dark;
    fixed[y]![x] = true;
  };
  for (let i = 0; i < size; i++) {
    set(6, i, i % 2 === 0);
    set(i, 6, i % 2 === 0);
  }
  for (const [cx, cy] of [
    [3, 3],
    [size - 4, 3],
    [3, size - 4],
  ] as const) {
    for (let dy = -4; dy <= 4; dy++) {
      for (let dx = -4; dx <= 4; dx++) {
        const d = Math.max(Math.abs(dx), Math.abs(dy));
        set(cx + dx, cy + dy, d !== 2 && d !== 4);
      }
    }
  }
  const at = ALIGNMENT[version - 1]!;
  const last = at.length - 1;
  at.forEach((cx, i) =>
    at.forEach((cy, j) => {
      if ((i === 0 && j === 0) || (i === 0 && j === last) || (i === last && j === 0)) return;
      for (let dy = -2; dy <= 2; dy++) {
        for (let dx = -2; dx <= 2; dx++)
          set(cx + dx, cy + dy, Math.max(Math.abs(dx), Math.abs(dy)) !== 1);
      }
    }),
  );
  // The format bits' places, kept for later, and the one dark square that's always there.
  formatFirst().forEach(([x, y]) => set(x, y, false));
  formatSecond(size).forEach(([x, y]) => set(x, y, false));
  set(8, size - 8, true);

  let i = 0;
  for (let right = size - 1; right >= 1; right -= 2) {
    if (right === 6) right = 5;
    for (let vert = 0; vert < size; vert++) {
      for (let j = 0; j < 2; j++) {
        const x = right - j;
        const upward = ((right + 1) & 2) === 0;
        const y = upward ? size - 1 - vert : vert;
        if (!fixed[y]![x] && i < words.length * 8) {
          modules[y]![x] = ((words[i >>> 3]! >>> (7 - (i & 7))) & 1) === 1;
          i++;
        }
      }
    }
  }
  return { size, modules, fixed };
}

/** The 15 format bits for level M and a mask, BCH-protected and masked as the standard says. */
function formatValue(mask: number): number {
  const data = (0b00 << 3) | mask;
  let rem = data;
  for (let i = 0; i < 10; i++) rem = (rem << 1) ^ ((rem >>> 9) * 0x537);
  return ((data << 10) | rem) ^ 0x5412;
}

/** Where the first copy of the format bits goes, bit by bit (x, y), for a code of any size. */
function formatFirst(): [number, number][] {
  const places: [number, number][] = [];
  for (let i = 0; i <= 5; i++) places.push([8, i]);
  places.push([8, 7], [8, 8], [7, 8]);
  for (let i = 9; i < 15; i++) places.push([14 - i, 8]);
  return places;
}

/** Where the second copy goes, bit by bit. */
function formatSecond(size: number): [number, number][] {
  const places: [number, number][] = [];
  for (let i = 0; i < 8; i++) places.push([size - 1 - i, 8]);
  for (let i = 8; i < 15; i++) places.push([8, size - 15 + i]);
  return places;
}

/** How hard a code is to read (the standard's four rules): lower is better. */
function penalty(m: readonly boolean[][]): number {
  const size = m.length;
  let score = 0;
  const lines: boolean[][] = [];
  for (let y = 0; y < size; y++) lines.push(m[y]!.slice());
  for (let x = 0; x < size; x++) lines.push(m.map((row) => row[x]!));
  const finder = [true, false, true, true, true, false, true];
  for (const line of lines) {
    let run = 1;
    for (let i = 1; i <= size; i++) {
      if (i < size && line[i] === line[i - 1]) run++;
      else {
        if (run >= 5) score += 3 + run - 5;
        run = 1;
      }
    }
    for (let i = 0; i + 7 <= size; i++) {
      if (!finder.every((d, k) => line[i + k] === d)) continue;
      const lightBefore = [1, 2, 3, 4].every((k) => i - k < 0 || !line[i - k]);
      const lightAfter = [0, 1, 2, 3].every((k) => i + 7 + k >= size || !line[i + 7 + k]);
      if (lightBefore || lightAfter) score += 40;
    }
  }
  for (let y = 0; y + 1 < size; y++) {
    for (let x = 0; x + 1 < size; x++) {
      const c = m[y]![x];
      if (c === m[y]![x + 1] && c === m[y + 1]![x] && c === m[y + 1]![x + 1]) score += 3;
    }
  }
  const dark = m.reduce((n, row) => n + row.filter(Boolean).length, 0);
  const total = size * size;
  score += (Math.ceil(Math.abs(dark * 20 - total * 10) / total) - 1) * 10;
  return score;
}

function withMask(
  base: { size: number; modules: boolean[][]; fixed: boolean[][] },
  mask: number,
): boolean[][] {
  const { size, fixed } = base;
  const m = base.modules.map((row, y) =>
    row.map((dark, x) => (fixed[y]![x] ? dark : dark !== MASKS[mask]!(x, y))),
  );
  const bits = formatValue(mask);
  const first = formatFirst();
  const second = formatSecond(size);
  for (let i = 0; i < 15; i++) {
    const dark = ((bits >>> i) & 1) === 1;
    const [x1, y1] = first[i]!;
    const [x2, y2] = second[i]!;
    m[y1]![x1] = dark;
    m[y2]![x2] = dark;
  }
  return m;
}

/** The code for `text`, with the mask of least penalty unless one is named. */
export function qrEncode(text: string, mask?: number): Qr {
  const { version, words } = codewords(text);
  const base = layout(version, words);
  let best = { mask: 0, modules: withMask(base, 0), score: Infinity };
  for (let k = 0; k < 8; k++) {
    if (mask !== undefined && k !== mask) continue;
    const modules = withMask(base, k);
    const score = mask !== undefined ? 0 : penalty(modules);
    if (score < best.score) best = { mask: k, modules, score };
  }
  return { version, mask: best.mask, size: base.size, modules: best.modules };
}

const SVG = 'http://www.w3.org/2000/svg';

/**
 * The code as a picture of whole squares with its quiet zone of four, `scale` CSS pixels a
 * square: dark on white, as a phone's camera reads best.
 */
export function qrPicture(text: string, scale = 5): SVGSVGElement {
  const { size, modules } = qrEncode(text);
  const whole = size + 8;
  const svg = document.createElementNS(SVG, 'svg');
  svg.setAttribute('class', 'hud-qr');
  svg.setAttribute('viewBox', `0 0 ${whole} ${whole}`);
  svg.setAttribute('width', String(whole * scale));
  svg.setAttribute('height', String(whole * scale));
  svg.setAttribute('shape-rendering', 'crispEdges');
  svg.setAttribute('role', 'img');
  svg.setAttribute('aria-label', 'QR code of your cloud code');
  const ground = document.createElementNS(SVG, 'rect');
  ground.setAttribute('width', String(whole));
  ground.setAttribute('height', String(whole));
  ground.setAttribute('fill', '#ffffff');
  const path = document.createElementNS(SVG, 'path');
  let d = '';
  modules.forEach((row, y) =>
    row.forEach((dark, x) => {
      if (dark) d += `M${x + 4} ${y + 4}h1v1h-1z`;
    }),
  );
  path.setAttribute('d', d);
  path.setAttribute('fill', '#140e1f');
  svg.append(ground, path);
  return svg;
}
