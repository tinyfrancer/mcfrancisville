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
  STONE,
  TRIM,
  WALL,
  WHITE,
} from './buildings';
import { slab } from './furnish';
import { awning, letters, lettersWidth, signBoard } from './buildings';
import { SIGNPOSTS } from '../data/signposts';
import type { MapZoneId } from '../types/ids';
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

/**
 * A wooden signpost (0.2's C1): a post with one board, the place it names lettered on it and its
 * arrow pointing `way`, toward the way there.
 */
function drawSignpost(word: string, way: 'left' | 'right'): SpriteSource {
  const s = new Sketch(64, 56);
  slab(s, 30, 8, 5, 47, TRIM);
  s.rect(29, 6, 7, 3, fillOf(TRIM)).rect(29, 6, 7, 1, lightOf(TRIM));
  const w = lettersWidth(word) + 6;
  const x = way === 'right' ? 28 : 37 - w;
  slab(s, x, 12, w, 9, DOOR);
  for (let j = 0; j < 9; j++) {
    const tip = 4 - Math.abs(j - 4);
    if (tip > 0) s.rect(way === 'right' ? x + w : x - tip, 12 + j, tip, 1, fillOf(DOOR));
  }
  letters(s, word, x + 3, 14, WHITE);
  s.rect(27, 53, 11, 3, fillOf(LEAVES)).rect(28, 52, 8, 1, lightOf(LEAVES));
  return finish(s);
}

const signposts = new Map<string, SpriteSource>();

/** The signpost naming a place, its board pointing `way`. */
export function signpostTo(to: MapZoneId, way: 'left' | 'right'): SpriteSource {
  const key = `${to}:${way}`;
  let art = signposts.get(key);
  if (!art) signposts.set(key, (art = drawSignpost(SIGNPOSTS[to].word, way)));
  return art;
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
 * The noticeboard by the square (phase N): a wooden board under a little slate roof on two posts,
 * with neighbours' notes pinned all over it, and a pumpkin at its foot.
 */
function drawNoticeboard(): SpriteSource {
  const s = new Sketch(64, 60);
  slab(s, 7, 12, 5, 47, TRIM);
  slab(s, 52, 12, 5, 47, TRIM);
  // The roof: a shallow peak of slate shingles in courses, the left slope catching the light and
  // the right in shade (phase V: it was a flat dark band), a lit edge along its eaves.
  for (let y = 2; y < 12; y++) {
    const inset = Math.max(0, 10 - (y - 2) * 2);
    const w = 60 - inset * 2;
    s.rect(2 + inset, y, Math.floor(w / 2), 1, lightOf(STONE));
    s.rect(2 + inset + Math.floor(w / 2), y, Math.ceil(w / 2), 1, fillOf(STONE));
    if ((y - 2) % 3 === 2) s.rect(2 + inset, y, w, 1, shadeOf(STONE));
    else
      for (let x = 2 + inset + ((y * 5) % 6); x < 62 - inset; x += 6) s.set(x, y, shadeOf(STONE));
  }
  s.rect(2, 11, 60, 1, lightOf(STONE)).rect(2, 12, 60, 1, shadeOf(STONE));
  s.rect(29, 0, 6, 2, fillOf(STONE)).rect(29, 0, 3, 1, lightOf(STONE));
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
export const SIGNPOST: SpriteSource = signpostTo('town', 'right');
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

/**
 * The honesty stall outside the farm gate (phase O, decisions.md 82): a wooden counter under a
 * striped awning with its sign, crates on the counter, and the tin she's paid in. Stocked, the
 * crates are heaped with pumpkins and roses; empty, they wait.
 */
function drawHonestyStall(stocked: boolean): SpriteSource {
  const s = new Sketch(64, 64);
  slab(s, 6, 12, 4, 51, TRIM);
  slab(s, 54, 12, 4, 51, TRIM);
  // The sign along the top, and the awning under it.
  signBoard(s, 13, 0, 38, 9);
  letters(s, 'HONESTY', 19, 2, WHITE);
  awning(s, 5, 9, 54, 7, [ACCENT_TWO, WALL], 6);
  // The counter and its boarded front.
  slab(s, 3, 38, 58, 5, DOOR);
  slab(s, 5, 43, 54, 17, TRIM);
  for (const x of [15, 26, 37, 48]) s.rect(x, 44, 1, 15, shadeOf(TRIM));
  // Two crates, and the tin with its slot.
  for (const x of [8, 26]) {
    slab(s, x, 30, 16, 8, TRIM);
    s.rect(x + 2, 30, 12, 2, stocked ? fillOf(LEAVES) : darkOf(TRIM));
  }
  slab(s, 47, 31, 9, 7, ROOF);
  s.rect(49, 32, 5, 1, INK);
  if (stocked) {
    s.sphere(12, 28, 4, 3.5, 'KaAl').sphere(19, 27, 4, 4, 'KaAl');
    s.set(12, 24, fillOf(LEAVES)).set(19, 23, fillOf(LEAVES));
    for (const [x, y] of [
      [28, 27],
      [32, 25],
      [36, 27],
      [30, 29],
      [35, 30],
    ] as const) {
      s.ellipse(x + 1, y + 1, 2, 2, fillOf(ACCENT_TWO)).set(x, y, lightOf(ACCENT_TWO));
    }
  }
  s.rect(0, 60, 12, 3, fillOf(LEAVES)).rect(52, 60, 12, 3, fillOf(LEAVES));
  return finish(s);
}

/** The stall, empty and stocked. */
export const HONESTY_STALL: Record<'empty' | 'stocked', SpriteSource> = {
  empty: drawHonestyStall(false),
  stocked: drawHonestyStall(true),
};

/** Its awning is rose and cream, and so are its roses. */
export const HONESTY_STALL_PALETTE: Palette = buildingPalette({
  ...CLUTTER_COLOURS,
  accentTwo: C.rose,
});

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

// ---- More on the ground (V1's L2) ----------------------------------------------------------------

/** A place in a tile for a little thing, kept clear of its edge by `margin`. */
function spot(rand: () => number, margin = 5): [number, number] {
  return [
    margin + Math.floor(rand() * (32 - margin * 2)),
    margin + Math.floor(rand() * (32 - margin * 2)),
  ];
}

/** Clover: a few three-leafed sprigs low in the grass, and now and then its little white head. */
function clover(s: Sketch, rand: () => number): void {
  for (let i = 0; i < 9; i++) {
    const [x, y] = spot(rand);
    s.rect(x - 1, y - 1, 2, 2, 'v')
      .rect(x + 1, y - 1, 2, 2, 'v')
      .rect(x, y + 1, 2, 2, 'v');
    s.set(x - 1, y - 1, 'V')
      .set(x + 1, y - 1, 'V')
      .set(x, y + 1, 'V');
    s.set(x + 1, y + 3, 'q');
  }
  if (rand() < 0.6) {
    const [x, y] = spot(rand, 7);
    s.rect(x, y, 3, 2, 'F')
      .set(x + 1, y - 1, 'F')
      .set(x + 2, y + 1, 'l')
      .set(x + 1, y + 2, 'q');
  }
}

/** A toadstool a few pixels high: a cap lit on its left over a pale stem. */
function tinyToadstool(s: Sketch, x: number, y: number, cap: 'h' | 'r'): void {
  s.rect(x, y, 1, 2, 'm');
  s.rect(x - 1, y - 1, 3, 1, cap).set(x - 1, y - 1, cap === 'h' ? 'H' : 'R');
  s.set(x, y - 2, cap);
}

/** A ring of little toadstools come up overnight, half round, their caps a warm tan. */
function mushroomRing(s: Sketch, rand: () => number): void {
  const cx = 14 + Math.floor(rand() * 4);
  const cy = 15 + Math.floor(rand() * 3);
  const from = rand() * Math.PI;
  for (let i = 0; i < 6; i++) {
    const a = from + (i / 6) * Math.PI * 1.3;
    tinyToadstool(s, Math.round(cx + Math.cos(a) * 9), Math.round(cy + Math.sin(a) * 7), 'h');
  }
  tinyToadstool(s, cx, cy, 'r');
}

/**
 * Leaves blown into a drift on the open lawn: a heap of them deeper in the middle, in the trees'
 * autumn colours, with a shadow tucked under its front.
 */
function leafDrift(s: Sketch, rand: () => number): void {
  const keys = ['a', 'b', 'c', 'd'];
  const cx = 14 + Math.floor(rand() * 4);
  const cy = 16 + Math.floor(rand() * 3);
  s.ellipse(cx, cy + 3, 10, 2, 'Q');
  for (let i = 0; i < 22; i++) {
    const t = rand() * 2 - 1;
    const x = Math.round(cx + t * 10);
    const y = Math.round(cy + (rand() * 2 - 1) * (4 - Math.abs(t) * 3));
    const key = keys[Math.floor(rand() * keys.length)]!;
    s.rect(x, y, 3, 2, key).set(x + 1, y - 1, key);
    if (rand() < 0.4) s.set(x + 2, y + 1, 'e');
  }
}

/** A muddy puddle left on a track: a brown rim round water holding the sky, a glint on it. */
function puddle(s: Sketch, rand: () => number): void {
  const [x, y] = spot(rand, 10);
  const rx = 6 + Math.floor(rand() * 3);
  s.ellipse(x, y, rx + 1, 3.5, 'x');
  s.ellipse(x, y, rx, 2.5, 'w');
  s.rect(x - rx + 2, y - 1, 3, 1, 'W').set(x + 2, y + 1, 'W');
  s.rect(x - rx, y + 3, rx * 2, 1, 'k');
}

/** Acorns fallen under the oaks: brown nuts in their knobbly caps, one still on its twig. */
function acorns(s: Sketch, rand: () => number): void {
  for (let i = 0; i < 4; i++) {
    const [x, y] = spot(rand);
    s.rect(x, y, 3, 3, 'n')
      .set(x + 1, y + 3, 'n')
      .set(x, y, 'N');
    s.rect(x - 1, y - 1, 5, 1, 'j')
      .rect(x, y - 2, 3, 1, 'j')
      .set(x + 1, y - 3, 't');
  }
}

/** Pinecones under the conifers: each a stack of scales, lit on its left. */
function pinecones(s: Sketch, rand: () => number): void {
  for (let i = 0; i < 3; i++) {
    const [x, y] = spot(rand, 6);
    for (let j = 0; j < 5; j++) {
      const w = j === 0 || j === 4 ? 2 : 3;
      s.rect(x + (j === 4 ? 1 : 0), y + j, w, 1, j % 2 === 0 ? 't' : 'n');
    }
    s.set(x, y + 1, 'N')
      .set(x, y + 3, 'N')
      .set(x + 1, y + 5, 'q')
      .set(x + 2, y + 5, 'q');
  }
}

/** A daisy: white petals round a yellow eye, four pixels across. */
function daisy(s: Sketch, x: number, y: number): void {
  s.set(x, y - 1, 'F')
    .set(x - 1, y, 'F')
    .set(x + 1, y, 'F')
    .set(x, y + 1, 'l');
  s.set(x - 1, y - 1, 'F').set(x + 1, y + 1, 'l');
  s.set(x, y, 'y');
}

/** Daisies in the grass, a few together. */
function daisies(s: Sketch, rand: () => number): void {
  for (let i = 0; i < 7; i++) {
    const [x, y] = spot(rand, 4);
    s.set(x, y + 2, 'v').set(x - 1, y + 3, 'v');
    daisy(s, x, y);
  }
}

/** A molehill: a little mound of fresh crumbly earth, lit on top, its crumbs about it. */
function molehill(s: Sketch, rand: () => number): void {
  const x = 13 + Math.floor(rand() * 6);
  const y = 16 + Math.floor(rand() * 4);
  s.ellipse(x, y + 2, 8, 3.5, 'k');
  s.ellipse(x, y, 7, 4, 'x');
  s.ellipse(x - 1, y - 2, 4, 2, 'X');
  for (let i = 0; i < 6; i++) {
    const a = rand() * Math.PI * 2;
    s.set(Math.round(x + Math.cos(a) * 10), Math.round(y + 2 + Math.sin(a) * 5), 'x');
  }
}

/** Dandelion clocks gone to seed: round white puffs on thin stems, and one still yellow. */
function dandelions(s: Sketch, rand: () => number): void {
  for (let i = 0; i < 3; i++) {
    const [x, y] = spot(rand, 6);
    s.rect(x, y + 2, 1, 4, 'v');
    s.ellipse(x, y, 2.5, 2.5, 'l');
    s.set(x - 1, y - 1, 'F')
      .set(x, y - 2, 'F')
      .set(x - 2, y, 'F')
      .set(x, y, 'F');
    s.set(x + 1, y + 1, 'q').set(x + 1, y - 1, 'F');
  }
  const [x, y] = spot(rand, 6);
  s.rect(x, y + 1, 1, 3, 'v');
  s.rect(x - 1, y - 1, 3, 2, 'y')
    .set(x, y - 2, 'y')
    .set(x - 1, y - 1, 'o');
}

/**
 * A fairy ring: a whole circle of tiny pale toadstools on a ring of darker grass, as if someone
 * danced there in the night.
 */
function fairyRing(s: Sketch, rand: () => number): void {
  const cx = 16;
  const cy = 16;
  for (let a = 0; a < Math.PI * 2; a += 0.05) {
    s.set(Math.round(cx + Math.cos(a) * 11), Math.round(cy + Math.sin(a) * 9), 'Q');
  }
  const from = rand();
  for (let i = 0; i < 9; i++) {
    const a = ((i + from) / 9) * Math.PI * 2;
    const x = Math.round(cx + Math.cos(a) * 11);
    const y = Math.round(cy + Math.sin(a) * 9);
    s.rect(x, y - 1, 1, 2, 'm')
      .rect(x - 1, y - 2, 3, 1, 'l')
      .set(x - 1, y - 2, 'F');
  }
}

/** The ground's ten more (V1's L2), each in two or three looks. */
const MORE_DECAL_ART: Record<
  | 'clover'
  | 'mushroomRing'
  | 'leafDrift'
  | 'puddle'
  | 'acorns'
  | 'pinecones'
  | 'daisies'
  | 'molehill'
  | 'dandelions'
  | 'fairyRing',
  readonly SpriteSource[]
> = {
  clover: [11, 12, 13].map((seed) => decal(clover, seed)),
  mushroomRing: [14, 15].map((seed) => decal(mushroomRing, seed)),
  leafDrift: [16, 17].map((seed) => decal(leafDrift, seed)),
  puddle: [18, 19].map((seed) => decal(puddle, seed)),
  acorns: [20, 21].map((seed) => decal(acorns, seed)),
  pinecones: [22, 23].map((seed) => decal(pinecones, seed)),
  daisies: [24, 25, 26].map((seed) => decal(daisies, seed)),
  molehill: [27, 28].map((seed) => decal(molehill, seed)),
  dandelions: [29, 30].map((seed) => decal(dandelions, seed)),
  fairyRing: [31, 32].map((seed) => decal(fairyRing, seed)),
};

export const DECAL_ART: Record<DecalId, readonly SpriteSource[]> = {
  leaves: [1, 2, 3].map((seed) => decal(fallenLeaves, seed)),
  pebbles: [4, 5].map((seed) => decal(pebbles, seed)),
  lilyPad: [decal((s, r) => lilyPad(s, r, false), 6), decal((s, r) => lilyPad(s, r, true), 7)],
  twigs: [8, 9].map((seed) => decal(twigs, seed)),
  ...MORE_DECAL_ART,
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
  // V1's L2: clover's greens, a toadstool's tan cap and pale stem, a red one, mud and a puddle's
  // water and glint, earth, an acorn's cap, a dandelion's fluff and its gold.
  v: mix(C.leafDark, C.moss, 0.3),
  V: C.leaf,
  h: mix(C.rope, C.wood, 0.4),
  H: C.rope,
  m: C.cream,
  r: C.toadstool,
  R: mix(C.toadstool, C.white, 0.35),
  x: C.soil,
  X: C.soilLight,
  k: C.soilDark,
  w: C.puddle,
  W: C.puddleShine,
  j: ramp(C.wood)[1]!,
  l: C.creamShade,
  o: C.goldShade,
  Q: C.grassShade,
};
