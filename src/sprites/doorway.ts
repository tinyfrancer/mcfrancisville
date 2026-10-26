import { PALETTE as C, ramp } from './palette';
import { CLEAR, Sketch } from './sketch';
import type { Palette, SpriteSource } from './sprite';

/*
 * The arch in her back wall through to the room beyond (0.3's H4), at 32: a wooden frame round a
 * round-topped opening, the dusk of the next room inside it and its floorboards catching the
 * light at the bottom. Drawn into the room's wall, its foot on the skirting board, over the tile
 * of floor she walks onto to go through.
 */

/** How far the frame hangs past its tile on each side. */
export const DOORWAY_OVERHANG = 4;

export const DOORWAY_WIDTH = 32 + DOORWAY_OVERHANG * 2;
export const DOORWAY_HEIGHT = 76;

const WOOD = ramp(C.wood);

export interface DoorwayArt {
  source: SpriteSource;
  palette: Palette;
}

export const DOORWAY_ART: DoorwayArt = {
  source: (() => {
    const w = DOORWAY_WIDTH;
    const h = DOORWAY_HEIGHT;
    const s = new Sketch(w, h);
    // The frame: posts and a round head, a keystone at its top.
    s.ellipse(w / 2, 20, 20, 20, 'f').rect(0, 20, w, h - 20, 'f');
    s.bevel('f', 'F', 'd');
    // The opening, the next room's dusk deepening toward the top.
    s.ellipse(w / 2, 22, 14, 15, 'o').rect(6, 22, w - 12, h - 22, 'o');
    s.replace('o', 'k', (_, y) => y < 34);
    s.dither('k', 'o', 0, 30, w, 8);
    // Its floorboards, lit from this side, and a threshold board under the arch.
    s.replace('o', 'b', (_, y) => y >= h - 12);
    for (let x = 9; x < w - 6; x += 7) s.rect(x, h - 12, 1, 9, 'B');
    s.replace('b', 'l', (x, y) => y >= h - 12 && y < h - 10 && x % 2 === 0);
    s.rect(4, h - 3, w - 8, 3, 'd').rect(5, h - 3, w - 10, 1, 'F');
    // A keystone, and the frame's grain.
    s.rect(w / 2 - 3, 0, 6, 6, 'K').rect(w / 2 - 2, 1, 4, 1, 'F');
    for (let y = 26; y < h - 6; y += 9) {
      s.set(2, y, 'd').set(w - 3, y + 4, 'd');
    }
    s.outline({ f: 'd', F: 'd', K: 'd' });
    return s.toSource();
  })(),
  palette: {
    [CLEAR]: null,
    f: WOOD[2],
    F: WOOD[3],
    d: C.barkDark,
    K: C.bark,
    k: C.ink,
    o: C.dusk,
    b: C.bark,
    B: C.barkDark,
    l: C.wood,
  },
};

/*
 * The attic's (1.5's G6), at 32: the ladder up to it, leaning on the back room's wall where an
 * arch would be, into a hole in the ceiling; the hatch in the attic's floor where the mat would
 * be, the ladder's top in it; and the sloped ceiling over the attic's wall, its boards and
 * rafters coming down to the eaves.
 */

/** How far the ladder's feet stand out onto the floor below the wall. */
export const LADDER_FOOT = 22;

/** How tall the ladder is: the whole wall, from the hole in the ceiling to its feet. */
export function ladderHeight(wallHeight: number): number {
  return wallHeight + LADDER_FOOT;
}

const LADDERS = new Map<number, DoorwayArt>();

const LADDER_PALETTE: Palette = {
  [CLEAR]: null,
  k: C.ink,
  o: C.dusk,
  f: WOOD[2],
  F: WOOD[3],
  s: WOOD[1],
  d: C.barkDark,
  b: C.bark,
};

/** The ladder up through a wall `wallHeight` tall, 32 wide like its tile. */
export function ladderArt(wallHeight: number): DoorwayArt {
  const made = LADDERS.get(wallHeight);
  if (made) return made;
  const w = 32;
  const h = ladderHeight(wallHeight);
  const s = new Sketch(w, h);
  // The hole in the ceiling it goes up into, framed in boards, the attic's dusk inside.
  s.rect(1, 0, w - 2, 12, 'b')
    .rect(3, 0, w - 6, 9, 'k')
    .rect(4, 0, w - 8, 4, 'o');
  s.rect(1, 11, w - 2, 1, 'd');
  // Its rungs, lit on top with a shadow under, between two rails lit on their left.
  for (let y = 12; y < h - 4; y += 9) {
    s.rect(8, y, w - 16, 2, 'f')
      .rect(8, y, w - 16, 1, 'F')
      .rect(8, y + 2, w - 16, 1, 's');
  }
  for (const x of [4, w - 8]) {
    s.rect(x, 2, 4, h - 2, 'f')
      .rect(x, 2, 1, h - 2, 'F')
      .rect(x + 3, 2, 1, h - 2, 's');
  }
  // Its feet, darker where they meet the floor.
  s.rect(4, h - 2, 5, 2, 'd').rect(w - 9, h - 2, 5, 2, 'd');
  s.outline({ f: 'd', F: 'd', s: 'd' });
  const art = { source: s.toSource(), palette: LADDER_PALETTE };
  LADDERS.set(wallHeight, art);
  return art;
}

/** The hatch in the attic's floor (1.5's G6): a hole framed in boards, the ladder's top in it. */
export const HATCH_ART: DoorwayArt = {
  source: (() => {
    const s = new Sketch(32, 32);
    s.rect(2, 4, 28, 26, 'b').bevel('b', 'F', 'd');
    s.rect(5, 7, 22, 20, 'k').rect(5, 7, 22, 3, 'o');
    // The ladder going down: its rails, and two rungs before the dark.
    for (const x of [8, 21]) s.rect(x, 7, 3, 20, 'f').rect(x, 7, 1, 20, 'F');
    for (const y of [12, 20]) s.rect(11, y, 10, 2, 'f').rect(11, y, 10, 1, 'F');
    s.replace('f', 's', (_, y) => y > 22);
    // The lid, propped open against the floor behind, its ring in the middle.
    s.rect(4, 0, 24, 4, 'f').rect(4, 0, 24, 1, 'F').rect(15, 1, 2, 2, 'd');
    s.outline({ b: 'd', f: 'd' });
    return s.toSource();
  })(),
  palette: LADDER_PALETTE,
};

/** How far the attic's ceiling comes down its wall: the top row, and the wall plate under it. */
export const EAVES_DEPTH = 36;

/** How far the slope comes down each end of the wall past the wall plate, and how far in. */
const WEDGE = { w: 26, h: 26 };

const EAVES = new Map<number, DoorwayArt>();

/**
 * The sloped ceiling over an attic's wall `width` pixels wide (1.5's G6): boards running along
 * under the roof over the top row, rafters every other tile coming down onto a wall plate at the
 * eaves, and the slope carried a little way down each end, where the side walls lean in.
 */
export function eavesArt(width: number): DoorwayArt {
  const made = EAVES.get(width);
  if (made) return made;
  const h = EAVES_DEPTH + WEDGE.h;
  const s = new Sketch(width, h);
  const plate = EAVES_DEPTH - 7;
  // How far in from each end the slope reaches, a row below the wall plate.
  const reach = (y: number) => Math.round(WEDGE.w * (1 - (y - plate) / (WEDGE.h + 7)));
  // The boards, six pixels each, their seams staggered.
  const board = (x: number, y: number) => {
    const row = Math.floor(y / 6);
    const seam = (x + row * 37) % 53 === 0;
    s.set(x, y, y % 6 === 5 ? 'd' : seam ? 's' : row % 2 === 0 ? 'f' : 'b');
  };
  for (let y = 0; y < plate; y++) for (let x = 0; x < width; x++) board(x, y);
  for (let y = plate; y < h; y++) {
    for (let x = 0; x < reach(y); x++) {
      board(x, y);
      board(width - 1 - x, y);
    }
  }
  // The wall plate the rafters stand on, along the eaves.
  s.rect(0, plate, width, 5, 'f')
    .rect(0, plate, width, 1, 'F')
    .rect(0, plate + 5, width, 1, 's');
  // The rafters: every other tile, and one down each slope at the ends.
  for (let x = 48; x < width - 32; x += 64) {
    s.rect(x, 0, 7, EAVES_DEPTH, 'f').rect(x, 0, 1, EAVES_DEPTH, 'F');
    s.rect(x + 6, 0, 1, EAVES_DEPTH, 's');
  }
  for (let y = plate; y < h - 1; y++) {
    const r = reach(y);
    if (r < 4) continue;
    for (const x of [r - 4, width - r])
      s.rect(x, y, 4, 1, 'f')
        .set(x, y, 'F')
        .set(x + 3, y, 's');
  }
  s.outline({ f: 'd', F: 'd' });
  const art = { source: s.toSource(), palette: LADDER_PALETTE };
  EAVES.set(width, art);
  return art;
}
