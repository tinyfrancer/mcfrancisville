import type { Facing, FixtureId, RobBooPiece } from '../types/ids';
import {
  ACCENT,
  ACCENT_TWO,
  buildingPalette,
  darkOf,
  DOOR,
  door,
  type Drawn,
  fillOf,
  finish,
  footing,
  gableRoof,
  INK,
  letters,
  lettersWidth,
  lightOf,
  lightWall,
  ROOF,
  shadeOf,
  signBoard,
  step,
  STONE,
  TRIM,
  wall,
  wallLamp,
  WHITE,
  window,
} from './buildings';
import { DOLL_HEIGHT, DOLL_WIDTH, measureOf, type Grid, type View } from './doll';
import type { FurnitureArt } from './furniture';
import { ball, palette, slab, WOOD } from './furnish';
import type { FixtureArt } from './interiors';
import { PALETTE as C } from './palette';
import { Sketch } from './sketch';
import type { Palette } from './sprite';

/*
 * Rob Boo's (V1's P3b): the town hall by the square, from the building kit like every house, his
 * desk, his keepsakes (the ballot box with his one vote in it, and his hat stand), the typewriter
 * he teaches her to make and the key to the town; and his touches on the doll: the MAYOR sash
 * across him and the pink he goes when he's pleased.
 */

// ---- The town hall ----------------------------------------------------------------------------

/**
 * A little civic hall in cream stone under a slate pediment, a clock in its gable, a bell tower
 * on the ridge with a plum flag, two pale columns either side of an arched double door, a sign
 * over it, tall arched windows and wide steps. Its door is centred, over the middle of its three
 * tiles.
 */
function drawTownHall(): Drawn {
  const W = 112;
  const H = 184;
  const s = new Sketch(W, H);
  const cx = W / 2;
  const floor = H - 6;
  // The bell tower on the ridge: a little stone box with an arched opening, its bell inside, a
  // pointed cap, and a flagpole with the town's plum flag.
  s.rect(cx, 0, 1, 18, INK);
  s.rect(cx + 1, 1, 12, 7, fillOf(ACCENT_TWO)).rect(cx + 1, 1, 12, 1, lightOf(ACCENT_TWO));
  s.rect(cx + 1, 7, 12, 1, shadeOf(ACCENT_TWO));
  for (let j = 0; j < 12; j++) s.rect(cx - 1 - j, 16 + j, 2 + j * 2, 1, fillOf(ROOF));
  for (let j = 0; j < 12; j++) s.set(cx - 1 - j, 16 + j, lightOf(ROOF));
  s.rect(cx - 13, 28, 26, 2, darkOf(ROOF));
  wall(s, cx - 10, 30, 20, 26, 'stone', STONE, 5);
  window(s, cx - 5, 34, 10, 16, { shape: 'arch', panes: [1, 1] });
  ball(s, cx, 46, 3, 3, ACCENT);
  s.rect(cx - 1, 49, 2, 1, darkOf(ACCENT));
  // The pediment, its clock, and the walls under it.
  gableRoof(s, cx, 50, 90, W - 2, 8, 'slate', 'plaster');
  s.ellipse(cx, 76, 8, 8, darkOf(TRIM));
  s.ellipse(cx, 76, 7, 7, WHITE);
  for (const [dx, dy] of [
    [0, -5],
    [5, 0],
    [0, 5],
    [-5, 0],
  ] as const) {
    s.set(cx + dx, 76 + dy, INK);
  }
  s.rect(cx, 72, 1, 5, INK).rect(cx, 76, 4, 1, INK);
  wall(s, 8, 92, W - 16, floor - 92, 'stone', undefined, 11);
  lightWall(s, 8, 92, W - 16, floor - 92, 4);
  footing(s, 6, floor - 6, W - 12, 6);
  // A band of gold under the eaves.
  s.rect(8, 92, W - 16, 4, fillOf(ACCENT)).rect(8, 92, W - 16, 1, lightOf(ACCENT));
  s.rect(8, 95, W - 16, 1, darkOf(ACCENT));
  // Tall arched windows either side, with plum curtains.
  window(s, 14, 108, 16, 36, { shape: 'arch', panes: [2, 3], sill: true, curtains: true });
  window(s, W - 30, 108, 16, 36, { shape: 'arch', panes: [2, 3], sill: true, curtains: true });
  // Two columns, a capital on top and a base below.
  for (const x of [36, W - 42]) {
    s.rect(x, 104, 6, floor - 110, fillOf(TRIM));
    s.rect(x, 104, 1, floor - 110, lightOf(TRIM)).rect(x + 5, 104, 1, floor - 110, shadeOf(TRIM));
    for (let j = 108; j < floor - 8; j += 3) s.set(x + 3, j, shadeOf(TRIM));
    slab(s, x - 2, 100, 10, 4, TRIM);
    slab(s, x - 2, floor - 10, 10, 4, TRIM);
  }
  // The sign over the door.
  const word = 'TOWN HALL';
  const sw = lettersWidth(word) + 8;
  signBoard(s, Math.round(cx - sw / 2), 99, sw, 11);
  letters(s, word, Math.round(cx - sw / 2) + 4, 102, INK);
  const front = door(s, cx, floor, 30, 56, { shape: 'arch', knob: 'right', light: true });
  s.rect(cx, floor - 50, 1, 50, darkOf(DOOR));
  wallLamp(s, cx - 22, 120);
  wallLamp(s, cx + 17, 120);
  step(s, cx, H, 52, 6);
  step(s, cx, H - 3, 40, 3);
  return { source: finish(s), door: front };
}

export const TOWN_HALL: Drawn = drawTownHall();

export const TOWN_HALL_PALETTE: Palette = buildingPalette({
  wall: C.cream,
  roof: C.stoneDark,
  trim: C.white,
  door: C.plum,
  stone: C.stone,
  accent: C.gold,
  accentTwo: C.plum,
});

// ---- His desk ---------------------------------------------------------------------------------

/**
 * A great desk three tiles wide: drawers either end, letters stacked high in a wire tray, his
 * typewriter in the middle with a page in it, an inkpot, and the rubber stamp on its pad.
 */
const MAYORS_DESK = (() => {
  const s = new Sketch(96, 56);
  slab(s, 0, 22, 96, 6, TRIM);
  for (const x of [2, 66]) {
    slab(s, x, 28, 28, 28, TRIM);
    for (const y of [31, 40, 49]) {
      s.rect(x + 3, y, 22, 6, darkOf(TRIM)).rect(x + 4, y + 1, 20, 4, fillOf(TRIM));
      s.rect(x + 12, y + 2, 4, 2, fillOf(ACCENT_TWO));
    }
  }
  s.rect(30, 28, 36, 4, darkOf(TRIM));
  // The typewriter, its page, and its round keys.
  slab(s, 36, 10, 24, 12, ROOF);
  s.rect(40, 0, 16, 12, WHITE);
  for (let k = 0; k < 4; k++) s.rect(42, 2 + k * 2, 12, 1, shadeOf(STONE));
  s.rect(34, 10, 28, 2, darkOf(ROOF));
  for (let k = 0; k < 5; k++) s.set(39 + k * 4, 16, WHITE).set(41 + k * 4, 19, WHITE);
  // Letters piled in a tray.
  s.rect(6, 12, 22, 10, darkOf(STONE));
  for (let k = 0; k < 4; k++) s.rect(7, 13 + k * 2, 20, 2, k % 2 ? WHITE : fillOf(STONE));
  // The inkpot with its quill, and the stamp on its pad.
  ball(s, 70, 18, 4, 3, ROOF);
  s.rect(71, 6, 1, 10, WHITE).rect(72, 5, 2, 4, WHITE);
  slab(s, 80, 18, 12, 4, ACCENT);
  slab(s, 83, 10, 6, 8, DOOR);
  ball(s, 86, 9, 3, 2, DOOR);
  return finish(s);
})();

export const ROB_BOO_FIXTURE_ART: Pick<Record<FixtureId, FixtureArt>, 'mayorsDesk'> = {
  mayorsDesk: {
    source: MAYORS_DESK,
    palette: palette({
      ...WOOD,
      trim: C.wood,
      roof: C.inkFabric,
      stone: C.stone,
      accent: C.scarlet,
      accentTwo: C.gold,
      door: C.bark,
    }),
  },
};

// ---- His pieces -------------------------------------------------------------------------------

/** A little wooden ballot box with a brass slot on top, a padlock on its front, and a ribbon. */
const BALLOT_BOX = (() => {
  const s = new Sketch(32, 30);
  slab(s, 4, 8, 24, 20, DOOR);
  s.rect(4, 8, 24, 3, fillOf(TRIM)).rect(4, 8, 24, 1, lightOf(TRIM));
  s.rect(10, 9, 12, 1, INK);
  for (let j = 14; j < 26; j += 4) s.rect(5, j, 22, 1, shadeOf(DOOR));
  s.rect(14, 15, 4, 4, fillOf(ACCENT_TWO)).rect(15, 13, 2, 2, darkOf(ACCENT_TWO));
  s.set(15, 17, INK);
  // The one vote, peeking out of the slot.
  s.rect(13, 3, 6, 6, WHITE).set(14, 5, INK).set(16, 5, INK).set(15, 6, INK);
  return finish(s);
})();

/** A tall hat stand with three top hats hung on it, each a size too big, and a sash over the top. */
const HAT_STAND = (() => {
  const s = new Sketch(32, 52);
  s.rect(15, 8, 2, 40, fillOf(DOOR)).rect(15, 8, 1, 40, lightOf(DOOR));
  slab(s, 8, 47, 16, 3, DOOR);
  ball(s, 16, 7, 3, 3, ACCENT_TWO);
  const hat = (x: number, y: number) => {
    s.rect(x, y, 10, 8, fillOf(ROOF)).rect(x, y, 1, 8, lightOf(ROOF));
    s.rect(x, y + 5, 10, 2, fillOf(ACCENT_TWO));
    s.rect(x - 2, y + 8, 14, 2, darkOf(ROOF));
  };
  hat(3, 14);
  hat(19, 18);
  hat(11, 26);
  // The spare sash over the top, gold with MAYOR stitched on.
  for (let k = 0; k < 9; k++) s.rect(12 + k, 9 + k, 3, 1, fillOf(ACCENT));
  s.set(14, 10, darkOf(ACCENT)).set(17, 13, darkOf(ACCENT));
  return finish(s);
})();

/** An old black typewriter with round keys, a little bell, and a page in it. */
const STICKY_TYPEWRITER = (() => {
  const s = new Sketch(32, 28);
  s.rect(9, 0, 14, 12, WHITE);
  for (let k = 0; k < 4; k++) s.rect(11, 2 + k * 2, 10, 1, shadeOf(STONE));
  // The W, darker than the rest.
  s.rect(12, 4, 3, 1, INK);
  slab(s, 3, 11, 26, 4, ROOF);
  for (let j = 0; j < 12; j++)
    s.rect(4 - Math.floor(j / 4), 15 + j, 24 + Math.floor(j / 2), 1, fillOf(ROOF));
  bevelBox(s);
  for (let row = 0; row < 3; row++) {
    for (let k = 0; k < 6; k++) s.set(7 + k * 3 + (row % 2), 18 + row * 3, WHITE);
  }
  ball(s, 28, 12, 2, 2, ACCENT_TWO);
  return finish(s);
})();

/** The typewriter's body, lit along its top and shaded down its right. */
function bevelBox(s: Sketch): void {
  for (let j = 15; j < 27; j++) {
    for (let i = 0; i < 32; i++) {
      if (s.get(i, j) !== fillOf(ROOF)) continue;
      if (s.get(i + 1, j) !== fillOf(ROOF)) s.set(i, j, shadeOf(ROOF));
      else if (s.get(i - 1, j) !== fillOf(ROOF)) s.set(i, j, lightOf(ROOF));
    }
  }
}

/** A great gold key on a plum velvet cushion with tassels, its bow a bat with a ribbon. */
const KEY_TO_TOWN = (() => {
  const s = new Sketch(32, 26);
  ball(s, 16, 18, 14, 7, ROOF);
  for (const x of [2, 29]) s.rect(x, 18, 2, 6, fillOf(ACCENT)).set(x, 24, darkOf(ACCENT));
  // The key: a round bow with a bat cut through it, a long shank and two bits.
  ball(s, 8, 12, 5, 5, ACCENT);
  s.ellipse(8, 12, 2, 2, fillOf(ROOF));
  s.rect(12, 11, 16, 3, fillOf(ACCENT)).rect(12, 11, 16, 1, lightOf(ACCENT));
  s.rect(22, 14, 2, 4, fillOf(ACCENT)).rect(26, 14, 2, 3, fillOf(ACCENT));
  s.rect(5, 4, 6, 2, fillOf(ACCENT_TWO)).rect(9, 2, 4, 3, fillOf(ACCENT_TWO));
  return finish(s);
})();

export const ROB_BOO_PIECES_ART: Record<RobBooPiece, FurnitureArt> = {
  ballotBox: {
    source: BALLOT_BOX,
    palette: palette({ ...WOOD, door: C.wood, trim: C.bark, accentTwo: C.gold }),
  },
  topHatStand: {
    source: HAT_STAND,
    palette: palette({
      ...WOOD,
      door: C.bark,
      roof: C.inkFabric,
      accent: C.gold,
      accentTwo: C.gold,
    }),
  },
  stickyTypewriter: {
    source: STICKY_TYPEWRITER,
    palette: palette({ ...WOOD, roof: C.inkFabric, stone: C.stone, accentTwo: C.gold }),
  },
  keyToTown: {
    source: KEY_TO_TOWN,
    palette: palette({ ...WOOD, roof: C.plum, accent: C.gold, accentTwo: C.rose }),
  },
};

// ---- His touches on the doll ------------------------------------------------------------------

/** A touch of his own, drawn for one view, as `sprites/villagers.ts`'s are. */
export type RobTouch = (
  view: View,
  body: Grid,
  facing: Facing,
) => { rows: readonly string[]; palette: Palette } | null;

const doll = () => new Sketch(DOLL_WIDTH, DOLL_HEIGHT);

/**
 * His sash, gold with a darker edge, from his right shoulder across to his left hip in front, the
 * other way behind, and a band down his chest from the side; a little rosette where it crosses.
 */
export const MAYOR_SASH: RobTouch = (view, body) => {
  const s = doll();
  // Across his chest from edge to edge however wide it is (1.1's A5b).
  const { left, right, front } = measureOf(body);
  if (view === 'side') {
    s.rect(front - 5, 24, 3, 9, 'g').rect(front - 3, 24, 1, 9, 'G');
  } else {
    const back = view === 'back';
    const run = right - left - 2;
    for (let k = 0; k < 10; k++) {
      const step = Math.round((k * run) / 9);
      const x = back ? right - 2 - step : left + 1 + step;
      s.rect(x, 24 + k, 3, 1, 'g').set(back ? x : x + 2, 24 + k, 'G');
    }
    if (!back) s.rect(right - 2, 32, 3, 3, 'r').set(right - 1, 33, 'R');
  }
  return {
    rows: s.rows,
    palette: { '.': null, g: C.gold, G: C.goldShade, r: C.scarlet, R: C.scarletShade },
  };
};

/** The pink he goes when he's pleased, which is most of the time: a dot on each cheek. */
export const MAYOR_BLUSH: RobTouch = (view) => {
  if (view === 'back') return null;
  const s = doll();
  if (view === 'front') s.rect(11, 18, 2, 1, 'p').rect(19, 18, 2, 1, 'p');
  else s.rect(19, 18, 2, 1, 'p');
  return { rows: s.rows, palette: { '.': null, p: C.rose } };
};

/** How high he floats, as a ghost should, in whole pixels: a little less than Maude. */
export const MAYOR_LIFT = 4;

/**
 * How far his portrait drops down his sprite: past most of the room his top hat takes, so his
 * face is all in the frame with the hat's brim and band over it.
 */
export const MAYOR_PORTRAIT_DROP = 9;
