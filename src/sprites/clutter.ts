import { seeded } from '../systems/random';
import type { DecalId } from '../data/clutter';
import {
  ACCENT,
  ACCENT_TWO,
  buildingPalette,
  darkOf,
  DOOR,
  fillOf,
  finish,
  INK,
  LEAVES,
  lightOf,
  ROOF,
  shadeOf,
  TRIM,
  WALL,
  WHITE,
} from './buildings';
import { slab } from './furnish';
import { mix, PALETTE as C, ramp } from './palette';
import { CLEAR, Sketch } from './sketch';
import type { Palette, SpriteSource } from './sprite';

/*
 * The clutter that makes a place look lived in (phase L), drawn at 32 in the building kit's
 * materials: stumps and fallen logs in the woods, benches by the water, signposts at the forks,
 * barrels by the shops, and on the farm a hay bale and a friendly scarecrow. And the flat things
 * the ground is baked with: fallen leaves, pebbles, lily pads and twigs.
 */

/** Wood is `TRIM`, in bark; moss and leaves are `LEAVES`; iron is `ROOF`. */
const CLUTTER_COLOURS = {
  wall: C.cream,
  roof: C.iron,
  trim: C.bark,
  door: C.wood,
  stone: C.stone,
  accent: C.pumpkin,
  accentTwo: C.rope,
  leaves: C.moss,
} as const;

export const CLUTTER_PALETTE: Palette = buildingPalette(CLUTTER_COLOURS);

// ---- In the woods ---------------------------------------------------------------------------------

/** Rings on a cut end: the wood's light face with a darker ring or two and a dot at the heart. */
function rings(s: Sketch, cx: number, cy: number, rx: number, ry: number): void {
  s.ellipse(cx, cy, rx, ry, lightOf(DOOR));
  s.ellipse(cx, cy, rx - 1, ry - 1, fillOf(DOOR));
  s.ellipse(cx, cy, rx * 0.55, ry * 0.55, lightOf(DOOR));
  s.ellipse(cx, cy, rx * 0.3, ry * 0.3, fillOf(DOOR));
}

/** A little toadstool growing out of the wood, cap and stem. */
function toadstool(s: Sketch, x: number, y: number): void {
  s.rect(x, y, 2, 3, WHITE);
  s.ellipse(x + 1, y, 3, 2, fillOf(ACCENT))
    .set(x - 1, y - 1, lightOf(ACCENT))
    .set(x + 1, y - 1, WHITE);
}

/** A tree stump: bark round a cut top with rings, roots spreading at its foot, and moss. */
function drawStump(): SpriteSource {
  const s = new Sketch(32, 32);
  s.rect(6, 12, 20, 16, fillOf(TRIM));
  s.ellipse(16, 28, 12, 3, fillOf(TRIM));
  for (const [x, w] of [
    [3, 5],
    [24, 5],
  ] as const) {
    s.rect(x, 25, w, 4, fillOf(TRIM));
  }
  for (const x of [9, 13, 18, 22]) s.rect(x, 15, 1, 11, shadeOf(TRIM));
  s.rect(6, 12, 2, 16, lightOf(TRIM)).rect(24, 12, 2, 16, shadeOf(TRIM));
  rings(s, 16, 12, 10, 4);
  s.rect(6, 21, 5, 2, fillOf(LEAVES)).rect(7, 20, 3, 1, lightOf(LEAVES));
  toadstool(s, 23, 20);
  return finish(s);
}

/** A fallen log along the ground, two tiles long: its cut end to the left, moss along its top. */
function drawLog(): SpriteSource {
  const s = new Sketch(64, 32);
  s.rect(8, 12, 52, 16, fillOf(TRIM)).ellipse(59, 20, 3, 8, fillOf(TRIM));
  s.rect(8, 12, 52, 2, lightOf(TRIM)).rect(8, 25, 52, 3, shadeOf(TRIM));
  for (const [x, y, w] of [
    [16, 17, 14],
    [34, 21, 12],
    [48, 16, 8],
  ] as const) {
    s.rect(x, y, w, 1, darkOf(TRIM));
  }
  rings(s, 8, 20, 6, 8);
  for (let x = 16; x < 56; x += 1) if ((x * 7) % 11 < 6) s.set(x, 12, fillOf(LEAVES));
  s.rect(22, 11, 12, 2, fillOf(LEAVES)).rect(24, 10, 7, 1, lightOf(LEAVES));
  s.rect(44, 11, 6, 1, fillOf(LEAVES));
  toadstool(s, 38, 7);
  toadstool(s, 42, 9);
  return finish(s);
}

export const STUMP: SpriteSource = drawStump();
export const LOG: SpriteSource = drawLog();

// ---- In town and by the water ---------------------------------------------------------------------

/**
 * A park bench, two tiles long: wooden slats for its seat and back on curly iron ends. Seen from
 * the front, a little from above.
 */
function drawBench(): SpriteSource {
  const s = new Sketch(64, 40);
  // The back, three slats, and the seat, two.
  for (const y of [6, 11, 16]) slab(s, 6, y, 52, 4, DOOR);
  slab(s, 4, 22, 56, 4, DOOR);
  slab(s, 4, 26, 56, 3, DOOR);
  // The iron ends: a leg, an arm curling over, and feet.
  for (const x of [5, 55]) {
    s.rect(x, 4, 4, 34, fillOf(ROOF)).rect(x, 4, 1, 34, lightOf(ROOF));
    s.rect(x - 2, 20, 8, 2, fillOf(ROOF))
      .set(x - 2, 19, lightOf(ROOF))
      .set(x + 5, 19, fillOf(ROOF));
    s.rect(x - 1, 37, 6, 2, fillOf(ROOF));
  }
  s.rect(10, 29, 1, 9, fillOf(ROOF)).rect(53, 29, 1, 9, fillOf(ROOF));
  return finish(s);
}

/** A wooden signpost: a post with two arrow boards pointing different ways, and a lantern hook. */
function drawSignpost(): SpriteSource {
  const s = new Sketch(32, 56);
  slab(s, 14, 8, 5, 47, TRIM);
  s.rect(13, 6, 7, 3, fillOf(TRIM)).rect(13, 6, 7, 1, lightOf(TRIM));
  const board = (y: number, right: boolean) => {
    const x = right ? 10 : 2;
    slab(s, x, y, 20, 7, DOOR);
    const tip = right ? x + 20 : x - 1;
    for (let j = 0; j < 4; j++) {
      const w = 4 - j;
      s.rect(right ? tip : tip - w + 1, y + j, w, 1, fillOf(DOOR));
      s.rect(right ? tip : tip - w + 1, y + 6 - j, w, 1, fillOf(DOOR));
    }
    s.rect(x + 3, y + 3, 14, 1, darkOf(DOOR));
  };
  board(12, true);
  board(22, false);
  s.rect(10, 42, 12, 3, fillOf(LEAVES)).rect(12, 41, 7, 1, lightOf(LEAVES));
  return finish(s);
}

/** A wooden barrel with iron hoops and a lid, as a shop keeps by its door. */
function barrel(pumpkins: boolean): SpriteSource {
  const s = new Sketch(32, 36);
  for (let y = 10; y < 34; y++) {
    const bulge = Math.round(Math.sin(((y - 10) / 23) * Math.PI) * 2);
    s.rect(7 - bulge, y, 18 + bulge * 2, 1, fillOf(DOOR));
  }
  for (const x of [11, 16, 21]) s.rect(x, 11, 1, 22, shadeOf(DOOR));
  s.bevel(fillOf(DOOR) + shadeOf(DOOR), lightOf(DOOR), darkOf(DOOR));
  for (const y of [14, 28]) {
    for (let x = 0; x < 32; x++)
      if (s.filled(x, y)) s.set(x, y, fillOf(ROOF)).set(x, y + 1, fillOf(ROOF));
  }
  s.ellipse(16, 10, 9, 3, lightOf(DOOR)).ellipse(16, 10, 7, 2, fillOf(DOOR));
  if (pumpkins) {
    s.sphere(12, 7, 4, 3.5, 'KaAl').sphere(20, 6, 4, 4, 'KaAl');
    s.set(12, 3, fillOf(LEAVES)).set(20, 2, fillOf(LEAVES));
  }
  return finish(s);
}

/**
 * The noticeboard by the square (phase N): a wooden board under a little iron roof on two posts,
 * with neighbours' notes pinned all over it, and a pumpkin at its foot.
 */
function drawNoticeboard(): SpriteSource {
  const s = new Sketch(64, 60);
  slab(s, 7, 12, 5, 47, TRIM);
  slab(s, 52, 12, 5, 47, TRIM);
  // The roof: a shallow peak of iron with a lit edge along its eaves.
  for (let y = 3; y < 12; y++) {
    const inset = Math.max(0, 8 - (y - 3) * 2);
    s.rect(2 + inset, y, 60 - inset * 2, 1, fillOf(ROOF));
  }
  s.rect(2, 11, 60, 1, lightOf(ROOF)).rect(2, 12, 60, 1, shadeOf(ROOF));
  s.rect(28, 1, 8, 2, fillOf(ROOF));
  // The board, framed.
  slab(s, 9, 14, 46, 30, TRIM);
  s.rect(11, 16, 42, 26, fillOf(DOOR));
  for (const y of [22, 30, 37]) s.rect(11, y, 42, 1, shadeOf(DOOR));
  // The notes, each pinned at the top.
  const note = (
    x: number,
    y: number,
    w: number,
    h: number,
    paper: typeof WALL,
    pin: typeof ACCENT,
  ) => {
    s.rect(x, y, w, h, fillOf(paper));
    s.rect(x, y, w, 1, lightOf(paper)).rect(x + w - 1, y + 1, 1, h - 1, shadeOf(paper));
    for (let line = y + 3; line < y + h - 1; line += 2) {
      s.rect(x + 2, line, w - 4 - ((line * 3) % 4), 1, shadeOf(paper));
    }
    s.set(x + Math.floor(w / 2), y + 1, fillOf(pin)).set(x + Math.floor(w / 2), y, lightOf(pin));
  };
  note(13, 17, 11, 13, WALL, ACCENT);
  note(27, 19, 12, 10, ACCENT_TWO, ACCENT);
  note(42, 16, 9, 12, WALL, LEAVES);
  note(17, 31, 10, 9, WALL, ACCENT_TWO);
  note(33, 30, 14, 10, WALL, ACCENT);
  // A pumpkin at its foot, and grass round the posts.
  s.sphere(47, 55, 5, 4, 'KaAl');
  s.set(47, 50, fillOf(LEAVES)).set(48, 50, fillOf(LEAVES));
  s.rect(4, 57, 10, 2, fillOf(LEAVES)).rect(50, 57, 10, 2, fillOf(LEAVES));
  return finish(s);
}

export const BENCH: SpriteSource = drawBench();
export const NOTICEBOARD: SpriteSource = drawNoticeboard();
export const SIGNPOST: SpriteSource = drawSignpost();
export const BARREL_FORMS: readonly SpriteSource[] = [barrel(false), barrel(true)];

// ---- On the farm ----------------------------------------------------------------------------------

/** A bale of hay tied with twine, a little pumpkin sat on top. */
function drawHayBale(): SpriteSource {
  const s = new Sketch(32, 32);
  slab(s, 3, 13, 26, 17, ACCENT_TWO);
  const rand = seeded(5);
  for (let i = 0; i < 26; i++) {
    const x = 5 + Math.floor(rand() * 22);
    const y = 15 + Math.floor(rand() * 13);
    s.rect(x, y, 2, 1, rand() < 0.5 ? shadeOf(ACCENT_TWO) : lightOf(ACCENT_TWO));
  }
  s.rect(9, 13, 2, 17, darkOf(TRIM)).rect(21, 13, 2, 17, darkOf(TRIM));
  s.sphere(16, 9, 6, 5, 'KaAl');
  s.rect(15, 3, 2, 2, fillOf(LEAVES)).set(17, 3, lightOf(LEAVES));
  return finish(s);
}

/**
 * The farm's scarecrow, as friendly as a scarecrow gets: a jack-o'-lantern head under a floppy
 * straw hat, a patched plaid shirt on a cross-post with straw at the cuffs, and a crow-shaped
 * friend on its arm who is clearly not scared at all.
 */
function drawScarecrow(): SpriteSource {
  const s = new Sketch(48, 72);
  // The post and the cross-bar.
  slab(s, 22, 30, 4, 41, TRIM);
  slab(s, 4, 32, 40, 4, TRIM);
  // The shirt: a body and sleeves, in red plaid.
  s.rect(15, 30, 18, 20, fillOf(WALL));
  s.rect(6, 31, 36, 7, fillOf(WALL));
  for (const x of [10, 18, 26, 34]) s.rect(x, 31, 1, 19, shadeOf(WALL));
  for (const y of [34, 42]) s.rect(6, y, 36, 1, shadeOf(WALL));
  for (let y = 30; y < 50; y++)
    for (let x = 0; x < 48; x++) if (x < 6 || x > 41) s.set(x, y, CLEAR);
  s.rect(21, 40, 6, 5, fillOf(ACCENT_TWO)).rect(21, 40, 6, 1, lightOf(ACCENT_TWO));
  // Straw at the cuffs and the hem.
  for (const [x, y] of [
    [3, 32],
    [3, 35],
    [42, 32],
    [42, 35],
    [16, 50],
    [20, 51],
    [27, 51],
    [31, 50],
  ] as const) {
    s.rect(x, y, 3, 1, fillOf(ACCENT_TWO)).rect(x, y + 1, 2, 1, lightOf(ACCENT_TWO));
  }
  // The head: a pumpkin with a stitched smile and button eyes.
  s.sphere(24, 21, 9, 8, 'KaAl');
  s.rect(20, 18, 3, 3, INK).rect(27, 18, 3, 3, INK).set(20, 18, WHITE).set(27, 18, WHITE);
  s.rect(20, 24, 10, 1, INK).set(19, 23, INK).set(30, 23, INK);
  for (const x of [21, 24, 27]) s.set(x, 25, INK).set(x, 23, INK);
  s.rect(17, 22, 2, 1, lightOf(ACCENT)).rect(31, 22, 1, 1, lightOf(ACCENT));
  // The hat: a floppy brim and a crown with a band.
  s.ellipse(24, 12, 15, 3, fillOf(ACCENT_TWO));
  s.rect(17, 3, 14, 9, fillOf(ACCENT_TWO)).ellipse(24, 3, 7, 2, fillOf(ACCENT_TWO));
  s.rect(17, 9, 14, 2, fillOf(ACCENT)).rect(17, 9, 14, 1, lightOf(ACCENT));
  s.rect(17, 3, 2, 6, lightOf(ACCENT_TWO)).rect(29, 3, 2, 6, shadeOf(ACCENT_TWO));
  // The crow, perched on its left arm, looking pleased.
  s.ellipse(9, 28, 4, 3, fillOf(ROOF)).ellipse(12, 25, 2.5, 2.5, fillOf(ROOF));
  s.set(12, 24, WHITE).rect(14, 25, 2, 1, fillOf(ACCENT)).rect(5, 28, 2, 2, fillOf(ROOF));
  return finish(s);
}

export const HAY_BALE: SpriteSource = drawHayBale();
export const SCARECROW: SpriteSource = drawScarecrow();

/** The scarecrow's shirt is red plaid, and its hat straw. */
export const SCARECROW_PALETTE: Palette = buildingPalette({
  ...CLUTTER_COLOURS,
  wall: C.scarlet,
  accentTwo: C.gold,
});

// ---- On the ground --------------------------------------------------------------------------------

/**
 * Flat things lying on a tile, baked into the ground: each a few shapes scattered by a seed, so the
 * variants differ, and never touching the tile's edge.
 */
function decal(draw: (s: Sketch, rand: () => number) => void, seed: number): SpriteSource {
  const s = new Sketch(32, 32);
  draw(s, seeded(seed));
  return s.toSource();
}

/** Fallen leaves, in the autumn colours the trees wear. */
function fallenLeaves(s: Sketch, rand: () => number): void {
  const keys = ['a', 'b', 'c', 'd'];
  for (let i = 0; i < 6; i++) {
    const x = 4 + Math.floor(rand() * 23);
    const y = 4 + Math.floor(rand() * 23);
    const key = keys[Math.floor(rand() * keys.length)]!;
    s.rect(x, y, 3, 2, key)
      .set(x + 1, y + 2, key)
      .set(x + 1, y - 1, key);
    s.set(x + 2, y + 2, 'e');
  }
}

function pebbles(s: Sketch, rand: () => number): void {
  for (let i = 0; i < 4; i++) {
    const x = 5 + Math.floor(rand() * 21);
    const y = 5 + Math.floor(rand() * 21);
    const w = 2 + Math.floor(rand() * 2);
    s.rect(x, y, w, 2, 'p')
      .set(x, y, 'P')
      .rect(x, y + 2, w, 1, 'q');
  }
}

function lilyPad(s: Sketch, rand: () => number, flower: boolean): void {
  const x = 10 + Math.floor(rand() * 10);
  const y = 10 + Math.floor(rand() * 10);
  s.ellipse(x, y, 6, 3.5, 'g').ellipse(x - 1, y - 1, 4, 2, 'G');
  s.line(x, y, x + 5, y - 2, 'D').line(x + 1, y, x + 5, y - 1, 'D');
  s.outline({ g: 'D', G: 'D' });
  if (flower)
    s.rect(x - 2, y - 3, 3, 2, 'f')
      .set(x - 1, y - 4, 'F')
      .set(x - 1, y - 2, 'y');
}

function twigs(s: Sketch, rand: () => number): void {
  for (let i = 0; i < 2; i++) {
    const x = 5 + Math.floor(rand() * 18);
    const y = 6 + Math.floor(rand() * 18);
    s.line(x, y, x + 7, y + 2, 't')
      .set(x + 3, y, 't')
      .set(x + 2, y - 1, 't');
  }
  const x = 8 + Math.floor(rand() * 16);
  const y = 8 + Math.floor(rand() * 16);
  s.rect(x, y, 3, 2, 'n')
    .rect(x, y - 1, 3, 1, 'N')
    .set(x + 1, y - 2, 't');
}

export const DECAL_ART: Record<DecalId, readonly SpriteSource[]> = {
  leaves: [1, 2, 3].map((seed) => decal(fallenLeaves, seed)),
  pebbles: [4, 5].map((seed) => decal(pebbles, seed)),
  lilyPad: [decal((s, r) => lilyPad(s, r, false), 6), decal((s, r) => lilyPad(s, r, true), 7)],
  twigs: [8, 9].map((seed) => decal(twigs, seed)),
};

/** The colours every decal is painted from; each uses a few. */
export const DECAL_PALETTE: Palette = {
  [CLEAR]: null,
  a: C.pumpkin,
  b: mix(C.pumpkinShade, C.berry, 0.4),
  c: C.plumLight,
  d: C.gold,
  e: ramp(C.moss)[0]!,
  p: C.stone,
  P: C.stoneLight,
  q: ramp(C.moss)[0]!,
  g: C.leaf,
  G: C.leafLight,
  D: ramp(C.leafDark)[0]!,
  f: C.snapLight,
  F: C.white,
  y: C.candle,
  t: C.bark,
  n: C.wood,
  N: ramp(C.wood)[3]!,
};
