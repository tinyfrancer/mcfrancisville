import type { FossilId } from '../types/ids';
import { mix, PALETTE as C, ramp } from './palette';
import { CLEAR, Sketch } from './sketch';
import type { Palette, SpriteSource } from './sprite';

/*
 * The fossils (0.3's C1), each 24×24 like a critter as she sees it out and about, so one picture
 * is its icon in her bag, its case in the Curiosity Cabinet and its nook in Wrapunzel's seventh
 * case. Every one is lit from the top left in its own stone: `k` shade, `s` stone, `S` lit, `h`
 * a highlight, `o` its soft outline, and a few keys of its own for what's pressed into it.
 */

const SIZE = 24;

/** Outlines everything painted, in `o`, but for the keys in `bare`. */
function outlined(s: Sketch, bare = ''): SpriteSource {
  s.outline((key) => (bare.includes(key) ? null : 'o'));
  return s.toSource();
}

/** A rounded slab of slate, lit along its top and left edges, for something pressed into it. */
function slab(s: Sketch, x: number, y: number, w: number, h: number): Sketch {
  s.rect(x + 1, y, w - 2, h, 's').rect(x, y + 1, w, h - 2, 's');
  s.bevel('s', 'S', 'k');
  return s;
}

/** A little stone bug curled flat: a head shield, a raised middle and ribbed sides. */
function trilobite(): SpriteSource {
  const s = new Sketch(SIZE, SIZE);
  s.ellipse(12, 13, 7.5, 9.5, 's');
  s.ellipse(12, 6.5, 7.5, 4, 's');
  s.bevel('s', 'S', 'k');
  // The raised middle, its ribs, and the ribs across each side.
  s.rect(10, 6, 4, 15, 'S').rect(10, 6, 1, 15, 'h').rect(13, 6, 1, 15, 'k');
  for (let y = 10; y <= 20; y += 2) {
    s.line(5, y, 9, y, 'k');
    s.line(14, y, 18, y, 'k');
  }
  s.rect(7, 5, 2, 2, 'e').rect(15, 5, 2, 2, 'e');
  s.set(7, 5, 'h').set(15, 5, 'h');
  return outlined(s);
}

/** A fern frond pressed into a slab of slate, every leaflet in pairs up its curling stem. */
function fernInSlate(): SpriteSource {
  const s = slab(new Sketch(SIZE, SIZE), 1, 3, 22, 18);
  const stem: [number, number][] = [];
  for (let y = 18; y >= 6; y--)
    stem.push([Math.round(9 + (18 - y) * 0.45 - ((18 - y) / 12) ** 3 * 2), y]);
  stem.forEach(([x, y], i) => {
    s.set(x, y, 'F');
    if (i % 2 === 0 && i < stem.length - 1) {
      const reach = Math.max(1, 4 - Math.floor(i / 4));
      s.line(x - 1, y, x - reach, y - 1, 'f');
      s.line(x + 1, y, x + reach, y - 1, 'f');
    }
  });
  s.set(stem.at(-1)![0] - 1, 5, 'F').set(stem.at(-1)![0] - 1, 4, 'f');
  return outlined(s);
}

/** A stone shell wound into a spiral, with ribs across each turn. */
function ammonite(): SpriteSource {
  const s = new Sketch(SIZE, SIZE);
  s.sphere(12, 12, 10, 10, 'kssSh');
  const turns = 2.6;
  for (let t = 0; t < turns * Math.PI * 2; t += 0.05) {
    const r = 9.5 * (1 - t / (turns * Math.PI * 2 + 0.6));
    s.set(Math.round(12 + Math.cos(t) * r), Math.round(12 + Math.sin(t) * r), 'd');
  }
  for (let a = 0; a < Math.PI * 2; a += Math.PI / 7) {
    const x = 12 + Math.cos(a) * 7.5;
    const y = 12 + Math.sin(a) * 7.5;
    s.set(Math.round(x), Math.round(y), 'k');
  }
  s.ellipse(12, 12, 1.5, 1.5, 'd');
  return outlined(s);
}

/** An acorn turned to stone, its little cap still on and its stalk up. */
function stoneAcorn(): SpriteSource {
  const s = new Sketch(SIZE, SIZE);
  s.sphere(12, 15, 7, 7.5, 'kssSh');
  s.sphere(12, 9, 8.5, 4.5, 'kcCC');
  for (let x = 5; x <= 19; x += 2)
    for (let y = 6; y <= 12; y += 2) {
      if (s.get(x, y) === 'C') s.set(x, y, 'c');
    }
  s.rect(12, 2, 2, 3, 'c').set(14, 2, 'c');
  s.set(12, 21, 'k').set(12, 22, 'k');
  return outlined(s);
}

/** The tiniest bat's skull, round and smiling, with pointed ears and two little fangs. */
function batSkull(): SpriteSource {
  const s = new Sketch(SIZE, SIZE);
  // Its ears, then the round of its head and its snout.
  for (const side of [-1, 1]) {
    for (let k = 0; k < 5; k++)
      s.rect(12 + side * (6 + Math.floor(k / 2)) - (side < 0 ? 1 : 0), 3 + k, 2, 1, 's');
  }
  s.sphere(12, 11, 8, 7.5, 'kssSh');
  s.sphere(12, 15.5, 4.5, 3, 'kssS');
  // Big round sockets, a nose and a grin, and two little fangs below it.
  s.ellipse(8.5, 11, 2.5, 2.5, 'e').ellipse(15.5, 11, 2.5, 2.5, 'e');
  s.set(8, 10, 'E').set(15, 10, 'E');
  s.set(11, 14, 'e').set(13, 14, 'e');
  s.line(9, 16, 10, 17, 'k').rect(11, 17, 3, 1, 'k').line(14, 17, 15, 16, 'k');
  s.rect(10, 18, 1, 2, 'w').rect(14, 18, 1, 2, 'w');
  return outlined(s);
}

/** A little fish all of bones, swimming across a slab of slate. */
function boneFish(): SpriteSource {
  const s = slab(new Sketch(SIZE, SIZE), 0, 4, 24, 16);
  // Its skull, its spine, its ribs and its tail fanned out behind.
  s.ellipse(17.5, 12, 3, 2.5, 'f').set(18, 11, 'k');
  s.line(4, 12, 15, 12, 'f');
  for (let x = 6; x <= 14; x += 2) {
    const r = x < 10 ? 2 : 3;
    s.line(x, 12 - r, x + 1, 11, 'F').line(x, 12 + r, x + 1, 13, 'F');
  }
  s.line(2, 9, 4, 12, 'f').line(2, 15, 4, 12, 'f').line(2, 10, 2, 14, 'F');
  return outlined(s);
}

/** A scallop shell so pale the light comes through it, its ridges fanning from the hinge. */
function ghostShell(): SpriteSource {
  const s = new Sketch(SIZE, SIZE);
  s.sphere(12, 12, 10, 8.5, 'kssSh');
  s.rect(2, 12, 21, 9, CLEAR);
  s.ellipse(12, 12, 10, 4, 's');
  s.rect(2, 16, 21, 6, CLEAR);
  // The ears at the hinge, and the ridges fanning down to it.
  s.rect(8, 16, 8, 3, 's').rect(9, 19, 6, 1, 's');
  s.rect(7, 18, 3, 2, 'S').rect(14, 18, 3, 2, 's');
  for (const a of [-1.15, -0.7, -0.25, 0.2, 0.65, 1.1]) {
    const x0 = 12 + Math.sin(a) * 2;
    const y0 = 17;
    s.line(
      Math.round(x0),
      y0,
      Math.round(12 + Math.sin(a) * 10),
      Math.round(17 - Math.cos(a) * 12),
      'k',
    );
  }
  s.bevel('sSk', 'h', null);
  return outlined(s);
}

/** A big curved tooth, smooth as a pebble, its root darker where it sat in the jaw. */
function dragonTooth(): SpriteSource {
  const s = new Sketch(SIZE, SIZE);
  for (let y = 2; y <= 21; y++) {
    const t = (y - 2) / 19;
    const half = 1 + t * 4.5;
    const centre = 9 + Math.sin(t * 1.6) * 5 - t * 1.5;
    s.rect(Math.round(centre - half), y, Math.round(half * 2), 1, y > 16 ? 'r' : 's');
  }
  s.bevel('s', 'S', 'k');
  s.bevel('r', 'R', 'd');
  s.line(8, 6, 11, 14, 'h');
  return outlined(s);
}

/** A stone sea urchin, domed, with a five-pointed star of dots across its top. */
function fairyLoaf(): SpriteSource {
  const s = new Sketch(SIZE, SIZE);
  s.sphere(12, 13, 10, 8.5, 'kssSh');
  for (let i = 0; i < 5; i++) {
    const a = -Math.PI / 2 + (i * Math.PI * 2) / 5;
    for (let r = 2; r <= 7; r += 1.6) {
      for (const off of [-0.2, 0.2]) {
        s.set(
          Math.round(12 + Math.cos(a + off) * r),
          Math.round(12 + Math.sin(a + off) * r * 0.8),
          'd',
        );
      }
    }
  }
  s.set(12, 12, 'd');
  return outlined(s);
}

/** A little round button of a stone, glossy brown with a paler ring and a shine. */
function toadstone(): SpriteSource {
  const s = new Sketch(SIZE, SIZE);
  s.sphere(12, 13, 9, 7.5, 'kkssSh');
  s.ellipse(12, 13, 5.5, 4.5, 'R');
  s.ellipse(12, 13, 4, 3, 's');
  s.sphere(12, 12.5, 4, 3, 'sSh');
  s.rect(7, 9, 2, 1, 'h').set(8, 8, 'h');
  return outlined(s);
}

/** A moth asleep in a drop of amber, its wings dark through the gold, with a shine on the drop. */
function mothInAmber(): SpriteSource {
  const s = new Sketch(SIZE, SIZE);
  s.sphere(12, 13, 9, 9.5, 'kssSh');
  s.rect(10, 2, 4, 3, 's').rect(11, 1, 2, 1, 's');
  // The moth inside: wings open, a body, little feelers.
  for (const side of [-1, 1]) {
    s.ellipse(12 + side * 3.5, 11, 3, 2.5, 'm').ellipse(12 + side * 2.5, 15, 2, 2, 'm');
    s.set(12 + side * 4, 11, 'M');
  }
  s.rect(12, 9, 1, 8, 'b').line(12, 8, 10, 6, 'b').line(12, 8, 14, 6, 'b');
  s.rect(6, 7, 2, 1, 'h').rect(6, 8, 1, 2, 'h').set(16, 18, 'S');
  return outlined(s);
}

/** A stone egg, speckled, with one small crack where something inside is snoring. */
function dragonEgg(): SpriteSource {
  const s = new Sketch(SIZE, SIZE);
  s.sphere(12, 13, 8, 10, 'kssSh');
  for (const [x, y] of [
    [8, 8],
    [15, 6],
    [10, 14],
    [16, 13],
    [7, 17],
    [13, 19],
    [17, 18],
    [11, 5],
  ] as const) {
    s.set(x, y, 'p').set(x + 1, y, 'p');
  }
  s.line(13, 9, 15, 11, 'c').line(15, 11, 14, 13, 'c').line(14, 13, 16, 15, 'c');
  return outlined(s, '');
}

/** Each fossil's picture, its palette, and what of it glows after dark. */
export interface FossilArt {
  source: SpriteSource;
  palette: Palette;
  glow?: Palette;
}

/** A stone's keys from a base colour: shade, stone, lit, highlight, and its outline. */
function stone(base: string): Palette {
  const [deep, shade, mid, lit, high] = ramp(base);
  return { [CLEAR]: null, o: deep, k: shade, s: mid, S: lit, h: high };
}

const SANDSTONE = C.soilDust;
const SLATE = mix(C.stoneDark, C.teal, 0.2);
const BONE = ramp(C.bone);
const AMBER = C.goldShade;

export const FOSSIL_ART: Record<FossilId, FossilArt> = {
  trilobite: { source: trilobite(), palette: { ...stone(SANDSTONE), e: C.ink } },
  fernInSlate: {
    source: fernInSlate(),
    palette: { ...stone(SLATE), f: C.mossLight, F: ramp(C.mossLight)[3] },
  },
  ammonite: { source: ammonite(), palette: { ...stone(C.creamShade), d: ramp(C.creamShade)[1] } },
  stoneAcorn: {
    source: stoneAcorn(),
    palette: { ...stone(C.stone), c: ramp(C.cliff)[1], C: C.cliff },
  },
  batSkull: {
    source: batSkull(),
    palette: { ...stone(C.bone), e: C.plum, E: C.plumLight, w: C.white },
  },
  boneFish: { source: boneFish(), palette: { ...stone(SLATE), f: BONE[2], F: BONE[1] } },
  ghostShell: {
    source: ghostShell(),
    palette: stone(mix(C.ghost, C.lavender, 0.35)),
    glow: { S: C.ghost, h: C.white },
  },
  dragonTooth: {
    source: dragonTooth(),
    palette: { ...stone(C.cream), r: ramp(C.bark)[2], R: ramp(C.bark)[3], d: ramp(C.bark)[1] },
  },
  fairyLoaf: { source: fairyLoaf(), palette: { ...stone(C.hostaCream), d: ramp(C.cliff)[1] } },
  toadstone: { source: toadstone(), palette: { ...stone(C.wood), R: ramp(C.wood)[3] } },
  mothInAmber: {
    source: mothInAmber(),
    palette: { ...stone(AMBER), m: ramp(C.bark)[2], M: C.bark, b: C.barkDark },
    glow: { s: C.candle, S: C.candleBright, h: C.white },
  },
  dragonEgg: {
    source: dragonEgg(),
    palette: { ...stone(C.hostaBlue), p: C.hostaBlueDark, c: C.candle },
    glow: { c: C.candleBright },
  },
};

/** A fossil all in one colour, for the Curiosity Cabinet to show one still to dig up. */
export function fossilSilhouette(id: FossilId, colour: string = C.plum): Palette {
  return Object.fromEntries(
    Object.entries(FOSSIL_ART[id].palette).map(([k, v]) => [k, v === null ? null : colour]),
  );
}
