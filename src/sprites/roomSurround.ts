import { mix, PALETTE as C } from './palette';
import {
  buildingPalette,
  chimney,
  darkOf,
  fillOf,
  finish,
  footing,
  lightOf,
  shadeOf,
  slopedRoof,
  STONE,
  TRIM,
} from './buildings';
import { CLEAR, Sketch } from './sketch';
import type { Palette, SpriteSource } from './sprite';

/*
 * What a room stands in instead of a black void (decision 290): the house cut open like a
 * dollhouse on a dark wood shelf. Her room (or the shop's) is the box; a shingled roof sits on
 * its top, timber posts stand at its sides, a stone footing runs under it with a step at the
 * door, and dark panelling fills whatever of the screen is left. Built from the town's building
 * kit, so it's the same wood, shingles and stone as the houses outside.
 */

/** How far the roof reaches past the room's walls on each side. */
export const SURROUND_EAVES = 16;
/** The timber posts either side of the room. */
export const SURROUND_POST = 8;
/** The roof, fascia and chimney above the room's top. */
export const SURROUND_ROOF = 60;
/** The stone footing under the room's front edge. */
export const SURROUND_FOOTING = 14;

export interface SurroundArt {
  source: SpriteSource;
  palette: Palette;
}

/** The house's materials: plum shingles like her own roof, wood, and the town's stone. */
const HOUSE: Palette = buildingPalette({
  wall: C.barkDark,
  roof: C.plum,
  trim: C.wood,
  door: C.bark,
  stone: C.stone,
});

/** The shelf's panelling, a tile of it, repeated under everything. */
export const SURROUND_PANEL: SurroundArt = {
  source: (() => {
    const s = new Sketch(32, 32, 'p');
    // Two boards a tile, each with a groove at its right and a dull sheen down its left.
    for (const x of [0, 16]) {
      s.rect(x + 15, 0, 1, 32, 'g');
      s.rect(x, 0, 1, 32, 'l');
    }
    // A rail across, and here and there a knot.
    s.rect(0, 26, 32, 1, 'l').rect(0, 27, 32, 2, 'g');
    s.rect(5, 9, 2, 1, 'g').set(6, 10, 'g');
    s.rect(24, 17, 2, 1, 'g').set(24, 18, 'g');
    return s.toSource();
  })(),
  palette: {
    [CLEAR]: null,
    p: mix(C.barkDark, C.ink, 0.15),
    g: mix(C.barkDark, C.ink, 0.55),
    l: mix(C.barkDark, C.bark, 0.35),
  },
};

/** The roof on a room `roomWidth` pixels wide: a shingled slope with a chimney at one end. */
export function surroundRoof(roomWidth: number): SurroundArt {
  const span = roomWidth + SURROUND_EAVES * 2;
  const s = new Sketch(span, SURROUND_ROOF);
  const eave = SURROUND_ROOF - 3;
  const top = 12;
  chimney(s, Math.round(span * 0.72), 0, 12, eave - 8);
  const run = Math.round((eave - top) * 1.4);
  slopedRoof(s, span / 2, top, eave, Math.max(24, span - run * 2), span, 'shingles');
  return { source: finish(s), palette: HOUSE };
}

/** A post at a side of a room `height` pixels tall: a squared timber lit on its left. */
export function surroundPost(height: number): SurroundArt {
  const s = new Sketch(SURROUND_POST, height);
  s.rect(0, 0, SURROUND_POST, height, fillOf(TRIM));
  s.rect(0, 0, 1, height, lightOf(TRIM));
  s.rect(SURROUND_POST - 2, 0, 2, height, shadeOf(TRIM));
  // Pegs where the beams meet it, every two tiles.
  for (let y = 12; y < height - 4; y += 64) s.rect(3, y, 2, 2, darkOf(TRIM));
  return { source: s.toSource(), palette: HOUSE };
}

/**
 * The footing under a room `roomWidth` pixels wide and its posts, with a worn step out where the
 * mat is, `matX` pixels in from the room's left.
 */
export function surroundFooting(roomWidth: number, matX: number): SurroundArt {
  const width = roomWidth + SURROUND_POST * 2;
  const s = new Sketch(width, SURROUND_FOOTING);
  footing(s, 0, 0, width, SURROUND_FOOTING);
  const x = SURROUND_POST + matX;
  s.rect(x + 3, 0, 26, SURROUND_FOOTING - 2, fillOf(STONE));
  s.rect(x + 3, 0, 26, 2, lightOf(STONE));
  s.rect(x + 3, SURROUND_FOOTING - 3, 26, 1, shadeOf(STONE));
  return { source: finish(s), palette: HOUSE };
}
