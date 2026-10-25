import type { ProjectId, PropId } from '../types/ids';
import {
  ACCENT,
  ACCENT_TWO,
  buildingPalette,
  darkOf,
  DOOR,
  fillOf,
  finish,
  GLASS,
  GLASS_DARK,
  GLINT,
  LAMP,
  LEAVES,
  lightOf,
  ROOF,
  shadeOf,
  STONE,
  TRIM,
  wall,
  WALL,
  WHITE,
  WINDOWS_LIT,
  door,
  gableRoof,
  wallLamp,
  window,
  type DoorRect,
} from './buildings';
import { slab } from './furnish';
import { mix, PALETTE as C } from './palette';
import { Sketch } from './sketch';
import type { Palette, SpriteSource } from './sprite';
import type { PropArt } from './props';

/*
 * The town's projects going up (V1's R4), drawn at 32 in the building kit's materials: a post at
 * each corner of a site with a ribbon tied round it, each project's frame of bare timber, and what's
 * built: the bandstand on the square with its bunting in the breeze, the castle garden's raised
 * beds and bench, the footbridge's rails over Whisperwood's creek (its deck is the ground's boards),
 * and her little glasshouse behind her house, whose planters are beds in front of it.
 */

/** Timber is `TRIM` in bark; planks `DOOR` in wood; rails `WALL` in cream; the roof plum. */
const PROJECT_COLOURS = {
  wall: C.cream,
  roof: C.plum,
  trim: C.bark,
  door: C.wood,
  stone: C.stone,
  accent: C.pumpkin,
  accentTwo: C.gold,
  leaves: C.moss,
  glass: mix(C.tealLight, C.skyDay, 0.4),
} as const;

export const PROJECT_PALETTE: Palette = buildingPalette(PROJECT_COLOURS);

/** The castle garden's flowers: roses in the accent, marigolds in the second. */
const GARDEN_PALETTE: Palette = buildingPalette({
  ...PROJECT_COLOURS,
  accent: C.scarlet,
  accentTwo: C.pumpkin,
  leaves: C.leaf,
});

// ---- The posts ------------------------------------------------------------------------------------

/** A post driven in at a site's corner: a pointed stake with a pumpkin ribbon tied round it. */
function drawPost(): SpriteSource {
  const s = new Sketch(32, 40);
  slab(s, 14, 12, 5, 27, TRIM);
  s.rect(15, 10, 3, 2, fillOf(TRIM)).set(16, 9, fillOf(TRIM));
  s.set(15, 10, lightOf(TRIM));
  // The ribbon, a bow and two tails, one fluttering off.
  s.rect(13, 16, 7, 3, fillOf(ACCENT)).rect(13, 16, 7, 1, lightOf(ACCENT));
  s.rect(19, 18, 3, 2, fillOf(ACCENT)).rect(21, 20, 3, 2, shadeOf(ACCENT));
  s.rect(11, 18, 2, 4, shadeOf(ACCENT));
  return finish(s);
}

// ---- The bandstand ------------------------------------------------------------------------------

const BAND_W = 96;
const BAND_H = 100;
/** Where the bandstand's floor is, its posts, and its eaves. */
const DECK = 78;
const POSTS = [10, 36, 58, 84] as const;
const EAVE = 40;

/** The stone base and its wooden floor, with steps up the middle of its front. */
function bandstandBase(s: Sketch): void {
  wall(s, 4, DECK + 4, BAND_W - 8, BAND_H - DECK - 6, 'stone', STONE, 7);
  slab(s, 2, DECK, BAND_W - 4, 5, DOOR);
  for (const [y, inset] of [
    [BAND_H - 12, 34],
    [BAND_H - 7, 30],
  ] as const) {
    slab(s, inset, y, BAND_W - inset * 2, 5, STONE);
  }
}

/** The bandstand going up: its base laid and bare timber posts, a ring beam and the rafters. */
function drawBandstandFrame(): SpriteSource {
  const s = new Sketch(BAND_W, BAND_H);
  bandstandBase(s);
  for (const x of POSTS) slab(s, x - 2, EAVE - 2, 4, DECK - EAVE + 2, TRIM);
  slab(s, 4, EAVE - 4, BAND_W - 8, 4, TRIM);
  // Rafters meeting at the top.
  for (const x of [6, 30, 66, 90]) s.line(x, EAVE - 5, 48, 8, fillOf(TRIM));
  for (const x of [7, 31, 65, 89]) s.line(x, EAVE - 5, 48, 9, shadeOf(TRIM));
  s.rect(46, 6, 4, 4, fillOf(TRIM));
  // A plank or two and a pot of nails waiting on the floor.
  slab(s, 16, DECK - 4, 22, 3, DOOR);
  slab(s, 20, DECK - 7, 18, 3, DOOR);
  s.rect(66, DECK - 6, 6, 6, fillOf(ROOF)).rect(66, DECK - 6, 6, 1, lightOf(ROOF));
  return finish(s);
}

/** The roof: plum tiles from a point down to the eaves, scalloped along its edge. */
function bandstandRoof(s: Sketch): void {
  for (let y = 8; y < EAVE; y++) {
    const t = (y - 8) / (EAVE - 9);
    const half = Math.round(4 + (BAND_W / 2 - 1 - 4) * t ** 0.85);
    s.rect(48 - half, y, half * 2, 1, fillOf(ROOF));
    s.set(48 - half, y, lightOf(ROOF)).set(48 + half - 1, y, shadeOf(ROOF));
  }
  for (let y = 14; y < EAVE; y += 6) {
    for (let x = 0; x < BAND_W; x++) if (s.get(x, y) === fillOf(ROOF)) s.set(x, y, shadeOf(ROOF));
  }
  for (let x = 2; x < BAND_W - 2; x += 6) s.ellipse(x + 3, EAVE, 3, 2, fillOf(ROOF));
  s.rect(47, 2, 2, 7, fillOf(ACCENT_TWO)).ellipse(48, 3, 2, 2, lightOf(ACCENT_TWO));
}

/** Bunting under the eaves, triangles in turn, their tips blown along by `blow` pixels. */
function bunting(s: Sketch, blow: number): void {
  const y = EAVE + 3;
  for (let x = 6; x < BAND_W - 8; x += 7) {
    const m = (x / 7) % 2 === 0 ? ACCENT : ACCENT_TWO;
    for (let j = 0; j < 6; j++) {
      const half = Math.max(0, 3 - Math.floor(j / 2));
      const shift = Math.round((blow * j) / 5);
      s.rect(x + 3 - half + shift, y + j, half * 2 + 1, 1, j === 0 ? lightOf(m) : fillOf(m));
    }
  }
  s.line(4, y, BAND_W - 5, y, fillOf(WALL));
}

/** The bandstand, its bunting blown `blow` pixels. */
function bandstand(blow: number): SpriteSource {
  const s = new Sketch(BAND_W, BAND_H);
  bandstandBase(s);
  for (const x of POSTS) {
    slab(s, x - 2, EAVE, 4, DECK - EAVE, WALL);
    s.rect(x - 3, DECK - 3, 6, 3, fillOf(WALL));
  }
  // The rails between the posts, but for the gap at the steps.
  for (const [from, to] of [
    [POSTS[0], POSTS[1]],
    [POSTS[2], POSTS[3]],
  ] as const) {
    s.rect(from + 2, DECK - 14, to - from - 4, 2, fillOf(WALL)).rect(
      from + 2,
      DECK - 14,
      to - from - 4,
      1,
      lightOf(WALL),
    );
    for (let x = from + 5; x < to - 2; x += 4) s.rect(x, DECK - 12, 1, 12, shadeOf(WALL));
  }
  bandstandRoof(s);
  bunting(s, blow);
  // A lantern hung from the middle of the roof, lit after dark.
  s.rect(47, EAVE + 2, 1, 6, darkOf(ROOF));
  s.rect(45, EAVE + 8, 5, 6, LAMP).rect(44, EAVE + 7, 7, 1, fillOf(ROOF));
  s.rect(44, EAVE + 14, 7, 1, fillOf(ROOF));
  return finish(s);
}

const BANDSTAND = bandstand(0);

// ---- The castle garden --------------------------------------------------------------------------

/** A raised bed's wooden frame, with fresh earth in it waiting for its flowers. */
function drawBedFrame(): SpriteSource {
  const s = new Sketch(64, 28);
  slab(s, 3, 8, 58, 18, DOOR);
  s.rect(6, 11, 52, 12, fillOf(TRIM));
  for (let x = 8; x < 56; x += 5) s.rect(x, 13 + (x % 3), 2, 1, shadeOf(TRIM));
  s.rect(6, 11, 52, 1, darkOf(TRIM));
  for (const x of [3, 59]) s.rect(x, 6, 2, 20, fillOf(TRIM));
  return finish(s);
}

/** Planks stacked for the bench, and a few stones beside them. */
function drawPlanks(): SpriteSource {
  const s = new Sketch(64, 28);
  for (const [y, x, w] of [
    [20, 6, 42],
    [15, 8, 40],
    [10, 11, 34],
  ] as const) {
    slab(s, x, y, w, 5, DOOR);
    s.rect(x + 3, y + 2, w - 8, 1, shadeOf(DOOR));
  }
  for (const [x, y] of [
    [50, 19],
    [55, 20],
    [52, 14],
  ] as const) {
    s.ellipse(x + 3, y + 3, 4, 3, fillOf(STONE)).set(x + 1, y + 1, lightOf(STONE));
  }
  return finish(s);
}

/** A raised bed of stone, roses at the back and marigolds along the front. */
function drawFlowerBed(): SpriteSource {
  const s = new Sketch(64, 36);
  wall(s, 2, 18, 60, 16, 'stone', STONE, 11);
  s.rect(2, 16, 60, 3, fillOf(STONE)).rect(2, 16, 60, 1, lightOf(STONE));
  // Leaves heaped above the stone.
  for (let x = 4; x < 60; x++) {
    const h = 9 + Math.round(3 * Math.sin(x * 0.55) + 2 * Math.sin(x * 0.21));
    for (let y = 17 - h; y < 17; y++) {
      s.set(
        x,
        y,
        y < 18 - h ? lightOf(LEAVES) : (x * 3 + y) % 7 === 0 ? shadeOf(LEAVES) : fillOf(LEAVES),
      );
    }
  }
  for (const x of [8, 18, 29, 40, 51]) {
    s.ellipse(x + 2, 7, 3, 3, fillOf(ACCENT)).set(x + 1, 5, lightOf(ACCENT));
    s.set(x + 2, 7, shadeOf(ACCENT));
  }
  for (const x of [5, 13, 23, 34, 45, 55]) {
    s.ellipse(x + 2, 13, 2, 2, fillOf(ACCENT_TWO)).set(x + 1, 12, lightOf(ACCENT_TWO));
  }
  return finish(s);
}

/** A garden bench of stone and wood, a rose carved in its back, for sitting and looking. */
function drawGardenSeat(): SpriteSource {
  const s = new Sketch(64, 40);
  for (const y of [7, 12]) slab(s, 8, y, 48, 4, DOOR);
  slab(s, 4, 22, 56, 4, DOOR);
  slab(s, 4, 26, 56, 3, DOOR);
  for (const x of [4, 52]) {
    slab(s, x, 4, 8, 18, STONE);
    slab(s, x + 1, 29, 6, 10, STONE);
  }
  s.ellipse(32, 9, 3, 3, fillOf(ACCENT)).set(31, 8, lightOf(ACCENT));
  s.rect(28, 10, 3, 2, fillOf(LEAVES)).rect(34, 10, 3, 2, fillOf(LEAVES));
  return finish(s);
}

// ---- The footbridge -----------------------------------------------------------------------------

const BRIDGE_W = 64;
const BRIDGE_H = 74;
/** How far the bridge's rails rise above its deck's top edge. */
const RISE = 10;

/** Piles driven into the ice at the corners, and two beams along them, bare. */
function drawBridgeFrame(): SpriteSource {
  const s = new Sketch(BRIDGE_W, BRIDGE_H);
  for (const x of [4, 54]) {
    slab(s, x - 1, RISE - 6, 8, BRIDGE_H - RISE + 4, TRIM);
  }
  // Joists across, where the deck will lie.
  for (let y = RISE + 4; y < BRIDGE_H - 6; y += 9) slab(s, 8, y, BRIDGE_W - 16, 4, DOOR);
  for (const y of [RISE - 2, BRIDGE_H - 8]) {
    for (const x of [2, 52]) slab(s, x, y, 10, 6, TRIM);
  }
  return finish(s);
}

/** The bridge's rails, along both sides of its deck: posts, a handrail and a ribbon at each end. */
function drawRails(): SpriteSource {
  const s = new Sketch(BRIDGE_W, BRIDGE_H);
  for (const x of [1, BRIDGE_W - 6]) {
    for (const y of [0, (BRIDGE_H - 14) / 2, BRIDGE_H - 14]) slab(s, x, y, 5, 14, TRIM);
    slab(s, x, 2, 5, 3, DOOR);
    s.rect(x + 1, 4, 3, BRIDGE_H - 8, fillOf(DOOR)).rect(x + 1, 4, 1, BRIDGE_H - 8, lightOf(DOOR));
    s.rect(x + 3, 4, 1, BRIDGE_H - 8, shadeOf(DOOR));
    s.rect(x, 0, 5, 2, fillOf(ACCENT_TWO)).set(x, 0, lightOf(ACCENT_TWO));
  }
  return finish(s);
}

// ---- Her greenhouse -----------------------------------------------------------------------------

const GLASS_W = 96;

/** The greenhouse's frame going up: a low brick wall, bare uprights and rafters, no glass yet. */
function drawGreenhouseFrame(): SpriteSource {
  const s = new Sketch(GLASS_W, 88);
  wall(s, 6, 74, GLASS_W - 12, 12, 'brick', STONE, 3);
  s.rect(4, 72, GLASS_W - 8, 3, fillOf(STONE)).rect(4, 72, GLASS_W - 8, 1, lightOf(STONE));
  for (let x = 6; x <= GLASS_W - 10; x += 21) slab(s, x, 26, 4, 46, TRIM);
  slab(s, 4, 22, GLASS_W - 8, 4, TRIM);
  for (let x = 6; x <= GLASS_W - 10; x += 21) s.line(x + 2, 22, x + 10, 6, fillOf(TRIM));
  slab(s, 10, 4, GLASS_W - 20, 4, TRIM);
  // A pane waiting, propped against the wall.
  s.rect(60, 58, 14, 14, GLASS).rect(60, 58, 14, 1, GLINT).rect(60, 58, 1, 14, fillOf(WALL));
  return finish(s);
}

/** Her greenhouse, a little glasshouse in white frames, pots on its shelves behind the glass. */
function drawHerGreenhouse(): SpriteSource {
  const s = new Sketch(GLASS_W, 64);
  const sill = 50;
  // The glass, a sloping roof down to the walls.
  for (let y = 4; y < 22; y++) {
    const inset = Math.round(14 - ((y - 4) * 10) / 17);
    s.rect(inset, y, GLASS_W - inset * 2, 1, GLASS);
  }
  s.rect(4, 22, GLASS_W - 8, sill - 22, GLASS);
  for (let y = 4; y < 22; y++) {
    for (let x = 0; x < GLASS_W; x++) {
      if (s.get(x, y) === GLASS && s.get(x, y - 1) !== GLASS) s.set(x, y, GLASS_DARK);
    }
  }
  // A shelf of pots and seedlings inside, and something tall climbing a cane.
  s.rect(8, 38, GLASS_W - 16, 2, fillOf(DOOR));
  for (let x = 12; x < GLASS_W - 14; x += 11) {
    s.rect(x, 33, 6, 5, fillOf(ACCENT)).rect(x, 33, 6, 1, lightOf(ACCENT));
    s.rect(x + 1, 29, 4, 4, fillOf(LEAVES)).set(x + 2, 28, lightOf(LEAVES));
  }
  for (let y = 24; y < 38; y++) s.set(80 + (y % 3 === 0 ? 1 : 0), y, fillOf(LEAVES));
  // The white frames: ridge, eaves, uprights and glazing bars.
  const t = fillOf(WALL);
  s.rect(14, 3, GLASS_W - 28, 2, t);
  s.rect(3, 21, GLASS_W - 6, 2, t);
  for (let x = 4; x < GLASS_W - 4; x += 18) {
    s.rect(x, 22, 2, sill - 22, t);
    s.line(x + 1, 21, Math.round(14 + ((x - 4) * (GLASS_W - 28)) / (GLASS_W - 8)), 4, t);
  }
  s.rect(GLASS_W - 6, 22, 2, sill - 22, t);
  for (let x = 7; x < GLASS_W - 12; x += 18) {
    for (let k = 0; k < 6; k++) if (s.get(x + k, 32 - k) === GLASS) s.set(x + k, 32 - k, GLINT);
  }
  wall(s, 4, sill, GLASS_W - 8, 64 - sill - 1, 'brick', STONE, 9);
  s.rect(2, sill - 2, GLASS_W - 4, 3, fillOf(STONE)).rect(
    2,
    sill - 2,
    GLASS_W - 4,
    1,
    lightOf(STONE),
  );
  s.set(GLASS_W / 2, 10, WHITE);
  return finish(s);
}

// ---- The ice hut (1.4's G3) ---------------------------------------------------------------------

const HUT_W = 64;
const HUT_H = 100;
/** Where the hut's walls meet its roof, and its floor. */
const HUT_EAVE = 34;
const HUT_FLOOR = 94;

/** The ice hut's own colours: raspberry boards, cream trim, a plum roof, an iron stovepipe. */
const HUT_PALETTE: Palette = buildingPalette({
  wall: C.berryLight,
  roof: C.plum,
  trim: C.cream,
  door: C.wood,
  stone: C.iron,
  accent: C.pumpkin,
  accentTwo: C.candle,
  leaves: C.moss,
});

/** The runners it sits on, so it could be slid out onto the ice, and the floor along them. */
function hutRunners(s: Sketch): void {
  slab(s, 2, HUT_FLOOR, HUT_W - 4, 4, TRIM);
  for (const x of [1, HUT_W - 7]) {
    s.rect(x, HUT_FLOOR + 3, 6, 2, darkOf(TRIM)).set(x, HUT_FLOOR + 2, darkOf(TRIM));
  }
}

/**
 * The ice hut going up (1.4's G3): its runners and floor down, four bare studs and a ridge beam,
 * the gable's rafters, and its stovepipe waiting on the boards.
 */
function drawIceHutFrame(): SpriteSource {
  const s = new Sketch(HUT_W, HUT_H);
  hutRunners(s);
  for (const x of [5, 27, 36, HUT_W - 9]) slab(s, x, HUT_EAVE, 4, HUT_FLOOR - HUT_EAVE, TRIM);
  slab(s, 3, HUT_EAVE - 3, HUT_W - 6, 4, TRIM);
  s.line(4, HUT_EAVE - 3, 32, 10, fillOf(TRIM)).line(5, HUT_EAVE - 3, 32, 11, shadeOf(TRIM));
  s.line(HUT_W - 5, HUT_EAVE - 3, 32, 10, fillOf(TRIM));
  s.line(HUT_W - 6, HUT_EAVE - 3, 32, 11, shadeOf(TRIM));
  s.rect(30, 8, 4, 4, fillOf(TRIM));
  // The stovepipe, lying on the floor, and a plank or two.
  s.rect(10, HUT_FLOOR - 4, 16, 4, fillOf(STONE)).rect(10, HUT_FLOOR - 4, 16, 1, lightOf(STONE));
  slab(s, 40, HUT_FLOOR - 3, 18, 3, DOOR);
  return finish(s);
}

/**
 * The ice hut (1.4's G3), Gourdon's, on the pond's bank: a little raspberry shanty on runners, a
 * plum gable with a stovepipe puffing on it, a round window lit after dark, its door on the right
 * with a lamp beside it, and an auger and a bucket leaning by the wall.
 */
function drawIceHut(): { source: SpriteSource; door: DoorRect } {
  const s = new Sketch(HUT_W, HUT_H);
  // The stovepipe first, so the roof's edge stands in front of its foot.
  s.rect(13, 2, 5, 22, fillOf(STONE)).rect(13, 2, 1, 22, lightOf(STONE));
  s.rect(17, 2, 1, 22, shadeOf(STONE)).rect(11, 0, 9, 3, darkOf(STONE));
  s.rect(12, 0, 7, 1, fillOf(STONE));
  wall(s, 5, HUT_EAVE, HUT_W - 10, HUT_FLOOR - HUT_EAVE, 'boards', WALL, 4);
  gableRoof(s, 32, 8, HUT_EAVE, HUT_W, 6, 'shingles', 'boards');
  // Corner boards in the trim, so it reads as a little building and not a crate.
  for (const x of [5, HUT_W - 8]) slab(s, x, HUT_EAVE, 3, HUT_FLOOR - HUT_EAVE, TRIM);
  window(s, 10, 54, 14, 14, { shape: 'round', panes: [2, 2] });
  const front = door(s, 44, HUT_FLOOR, 28, 52, { light: true, knob: 'left' });
  wallLamp(s, 26, 44);
  // A fish on a little board over the door, so it's plain what the hut is for.
  slab(s, 37, HUT_EAVE + 1, 14, 6, TRIM);
  s.rect(40, HUT_EAVE + 3, 6, 2, fillOf(ACCENT)).set(46, HUT_EAVE + 3, fillOf(ACCENT));
  s.set(39, HUT_EAVE + 2, fillOf(ACCENT)).set(39, HUT_EAVE + 5, fillOf(ACCENT));
  s.set(44, HUT_EAVE + 3, 'o');
  hutRunners(s);
  // The auger leaning on the wall, and a bucket by it.
  s.line(4, HUT_FLOOR - 2, 9, HUT_FLOOR - 30, darkOf(STONE));
  s.rect(6, HUT_FLOOR - 32, 7, 2, fillOf(DOOR));
  s.rect(2, HUT_FLOOR - 9, 7, 8, fillOf(ACCENT_TWO)).rect(
    2,
    HUT_FLOOR - 9,
    7,
    1,
    lightOf(ACCENT_TWO),
  );
  s.rect(8, HUT_FLOOR - 9, 1, 8, shadeOf(ACCENT_TWO));
  return { source: finish(s), door: front };
}

const ICE_HUT = drawIceHut();

// ---- The art --------------------------------------------------------------------------------------

const FOOTBRIDGE = drawFootbridge();

/** The bandstand's bunting, blown one way and back, slowly. */
const BUNTING = {
  sources: () => [0, 2, -2].map(bandstand),
  period: 2400,
  order: [0, 1, 0, 2],
} as const;

export const PROJECT_ART: Record<
  Extract<
    PropId,
    | 'sitePost'
    | 'bandstandFrame'
    | 'bandstand'
    | 'bedFrame'
    | 'planks'
    | 'flowerBed'
    | 'gardenSeat'
    | 'bridgeFrame'
    | 'footbridge'
    | 'greenhouseFrame'
    | 'herGreenhouse'
    | 'iceHutFrame'
    | 'iceHut'
  >,
  PropArt
> = {
  sitePost: { source: drawPost(), palette: PROJECT_PALETTE, shadow: { w: 12, h: 4 } },
  bandstandFrame: {
    source: drawBandstandFrame(),
    palette: PROJECT_PALETTE,
    shadow: { w: 92, h: 10 },
  },
  bandstand: {
    source: BANDSTAND,
    palette: PROJECT_PALETTE,
    glow: WINDOWS_LIT,
    lights: [{ x: 47, y: 52, radius: 40 }],
    frames: BUNTING,
    shadow: { w: 92, h: 10 },
  },
  bedFrame: { source: drawBedFrame(), palette: PROJECT_PALETTE, shadow: { w: 58, h: 6 } },
  planks: { source: drawPlanks(), palette: PROJECT_PALETTE, shadow: { w: 52, h: 6 } },
  flowerBed: { source: drawFlowerBed(), palette: GARDEN_PALETTE, shadow: { w: 60, h: 6 } },
  gardenSeat: { source: drawGardenSeat(), palette: GARDEN_PALETTE, shadow: { w: 60, h: 8 } },
  bridgeFrame: { source: drawBridgeFrame(), palette: PROJECT_PALETTE, shadow: { w: 0, h: 0 } },
  footbridge: { source: FOOTBRIDGE, palette: PROJECT_PALETTE, shadow: { w: 0, h: 0 } },
  greenhouseFrame: {
    source: drawGreenhouseFrame(),
    palette: PROJECT_PALETTE,
    shadow: { w: 90, h: 10 },
  },
  herGreenhouse: {
    source: drawHerGreenhouse(),
    palette: PROJECT_PALETTE,
    glow: WINDOWS_LIT,
    lights: [{ x: 48, y: 34, radius: 40 }],
    noEaves: true,
    shadow: { w: 90, h: 10 },
  },
  iceHutFrame: { source: drawIceHutFrame(), palette: PROJECT_PALETTE, shadow: { w: 60, h: 8 } },
  iceHut: {
    source: ICE_HUT.source,
    palette: HUT_PALETTE,
    glow: WINDOWS_LIT,
    lights: [
      { x: 17, y: 61, radius: 26 },
      { x: 28, y: 50, radius: 20 },
    ],
    door: ICE_HUT.door,
    smoke: [{ x: 15, y: 0 }],
    shadow: { w: 60, h: 8 },
  },
};

// ---- The noticeboard's pictures ----------------------------------------------------------------

/**
 * The footbridge: a deck of planks across the creek, its rails along both sides. Walked on, so
 * the view draws it under anyone on it.
 */
function drawFootbridge(): SpriteSource {
  const s = new Sketch(BRIDGE_W, BRIDGE_H);
  for (let y = RISE; y < BRIDGE_H - 2; y += 6) {
    slab(s, 4, y, BRIDGE_W - 8, 6, DOOR);
  }
  const deck = finish(s);
  return new Sketch(BRIDGE_W, BRIDGE_H).stamp(deck, 0, 0).stamp(drawRails(), 0, 0).toSource();
}

/** Her greenhouse as the noticeboard shows it: the glasshouse and its three planters before it. */
function greenhousePicture(): SpriteSource {
  const planters = new Sketch(GLASS_W, 96);
  for (let i = 0; i < 3; i++) {
    const x = i * 32 + 2;
    slab(planters, x, 68, 28, 24, DOOR);
    planters.rect(x + 3, 71, 22, 14, fillOf(TRIM));
    planters.rect(x + 8, 66, 3, 6, fillOf(LEAVES)).rect(x + 16, 64, 4, 8, fillOf(LEAVES));
  }
  const beds = finish(planters);
  return new Sketch(GLASS_W, 96).stamp(drawHerGreenhouse(), 0, 0).stamp(beds, 0, 0).toSource();
}

/** The castle garden as the noticeboard shows it: two beds and the bench between them. */
function gardenPicture(): SpriteSource {
  const s = new Sketch(192, 40);
  s.stamp(drawFlowerBed(), 0, 4).stamp(drawGardenSeat(), 64, 0).stamp(drawFlowerBed(), 128, 4);
  return s.toSource();
}

/** What each project looks like built, for its card on the noticeboard. */
export const PROJECT_PICTURES: Record<ProjectId, { source: SpriteSource; palette: Palette }> = {
  bandstand: { source: BANDSTAND, palette: PROJECT_PALETTE },
  castleGarden: { source: gardenPicture(), palette: GARDEN_PALETTE },
  footbridge: { source: FOOTBRIDGE, palette: PROJECT_PALETTE },
  greenhouse: { source: greenhousePicture(), palette: PROJECT_PALETTE },
  iceHut: { source: ICE_HUT.source, palette: HUT_PALETTE },
};
