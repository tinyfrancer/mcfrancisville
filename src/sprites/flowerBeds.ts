import type { PatchId } from '../types/ids';
import { PATCH_ART, SHOOTS, SHOOTS_PALETTE } from './nature';
import { PALETTE as C, ramp } from './palette';
import { CLEAR, Sketch } from './sketch';
import type { Palette, SpriteSource } from './sprite';

/*
 * Flower beds (V1's L6, decision 292). A run of flower patches side by side, the castle garden's
 * milkweed or the graveyard's ghost daisies, was the same scatter of blooms on bare lawn in every
 * tile: a grid of dots. Here a patch with more of its kind beside it is a bed: low leaves lit as
 * one mass that runs on into its neighbours, rounding off where the bed ends, and heads of blooms
 * in one of a few layouts, so no two tiles side by side are the same. A patch on its own keeps its
 * scatter.
 */

const TILE = 32;

/** The sides of a patch the same flowers carry on from: north, east, south and west. */
export const BED_N = 1;
export const BED_E = 2;
export const BED_S = 4;
export const BED_W = 8;

interface Placed {
  id: PatchId;
  tx: number;
  ty: number;
}

/** Which sides of a patch the same flowers run on into, as `BED_N` and the rest. */
export function bedSides(patches: readonly Placed[], patch: Placed): number {
  const same = (dx: number, dy: number) =>
    patches.some((p) => p.id === patch.id && p.tx === patch.tx + dx && p.ty === patch.ty + dy);
  return (
    (same(0, -1) ? BED_N : 0) |
    (same(1, 0) ? BED_E : 0) |
    (same(0, 1) ? BED_S : 0) |
    (same(-1, 0) ? BED_W : 0)
  );
}

/** Leaves in a 32-pixel repeat, each (x, y) a little leaf lit on its top, shaded under. */
const LEAVES_AT: readonly (readonly [number, number])[] = [
  [3, 2],
  [12, 4],
  [22, 1],
  [28, 7],
  [7, 9],
  [17, 10],
  [25, 14],
  [2, 15],
  [11, 17],
  [20, 20],
  [29, 22],
  [6, 23],
  [15, 26],
  [24, 28],
  [1, 30],
];

/** Where a tile's heads of blooms sit, a few layouts, each (x, y, big). */
const HEADS: readonly (readonly (readonly [number, number, boolean])[])[] = [
  [
    [7, 7, true],
    [21, 5, false],
    [15, 15, true],
    [27, 18, false],
    [5, 22, false],
    [22, 25, true],
    [11, 28, false],
  ],
  [
    [11, 5, false],
    [24, 8, true],
    [5, 13, true],
    [17, 19, false],
    [27, 25, false],
    [10, 25, true],
    [20, 29, false],
  ],
  [
    [5, 5, false],
    [16, 8, true],
    [27, 4, false],
    [8, 18, true],
    [24, 17, true],
    [16, 27, false],
    [4, 28, false],
  ],
];

/** How many layouts a bed's tiles are dealt from. */
export const BED_FORMS = HEADS.length;

/** A big head of blooms: a little dome lit on its top left, as (dx, dy, key). */
const BIG_HEAD: readonly (readonly [number, number, string])[] = [
  [-1, -2, 'F'],
  [0, -2, 'F'],
  [1, -2, 'f'],
  [-2, -1, 'F'],
  [-1, -1, 'F'],
  [0, -1, 'f'],
  [1, -1, 'f'],
  [2, -1, 'f'],
  [-2, 0, 'f'],
  [-1, 0, 'f'],
  [0, 0, 'c'],
  [1, 0, 'f'],
  [2, 0, 's'],
  [-1, 1, 's'],
  [0, 1, 's'],
  [1, 1, 's'],
];

/** A small head: a flower of four petals round its middle. */
const SMALL_HEAD: readonly (readonly [number, number, string])[] = [
  [0, -1, 'F'],
  [-1, 0, 'F'],
  [0, 0, 'c'],
  [1, 0, 'f'],
  [0, 1, 's'],
];

/** How far in from an open side the bed's edge comes, bobbing along it so it isn't ruled. */
function inset(along: number): number {
  return 2 + Math.round((1 - Math.cos(((along % 11) / 11) * Math.PI * 2)) / 2);
}

/** A tile of a bed: its leaves, and its blooms when it's in flower. */
function drawBed(sides: number, form: number, inBloom: boolean): SpriteSource {
  const s = new Sketch(TILE, TILE, 'm');
  for (const [x, y] of LEAVES_AT) {
    s.set(x, y, 'h')
      .set((x + 1) % TILE, y, 'h')
      .set((x + 2) % TILE, (y + 1) % TILE, 'l');
    s.set(x, (y + 1) % TILE, 'l');
  }
  // Cut back where the bed ends, rounding the corners where two ends meet.
  const open = (side: number) => (sides & side) === 0;
  for (let y = 0; y < TILE; y++) {
    for (let x = 0; x < TILE; x++) {
      let out = false;
      if (open(BED_N) && y < inset(x)) out = true;
      if (open(BED_S) && y > TILE - 1 - inset(x + 5)) out = true;
      if (open(BED_W) && x < inset(y + 3)) out = true;
      if (open(BED_E) && x > TILE - 1 - inset(y + 7)) out = true;
      const corner = (cx: number, cy: number) => Math.hypot(x + 0.5 - cx, y + 0.5 - cy) > 7;
      if (open(BED_N) && open(BED_W) && x < 9 && y < 9 && corner(9, 9)) out = true;
      if (open(BED_N) && open(BED_E) && x > 22 && y < 9 && corner(23, 9)) out = true;
      if (open(BED_S) && open(BED_W) && x < 9 && y > 22 && corner(9, 23)) out = true;
      if (open(BED_S) && open(BED_E) && x > 22 && y > 22 && corner(23, 23)) out = true;
      if (out) s.set(x, y, CLEAR);
    }
  }
  // The light catches the top of the bed where it ends, and its front falls into shade.
  for (let y = 0; y < TILE; y++) {
    for (let x = 0; x < TILE; x++) {
      if (s.get(x, y) === CLEAR) continue;
      const above = y > 0 ? s.get(x, y - 1) : open(BED_N) ? CLEAR : 'm';
      const below = (k: number) => (y + k < TILE ? s.get(x, y + k) : open(BED_S) ? CLEAR : 'm');
      if (above === CLEAR) s.set(x, y, 'h');
      else if (below(1) === CLEAR || below(2) === CLEAR) s.set(x, y, 'l');
    }
  }
  s.outline(() => 'o');
  const inside = (x: number, y: number) =>
    x >= 0 && y >= 0 && x < TILE && y < TILE && s.get(x, y) !== CLEAR && s.get(x, y) !== 'o';
  for (const [x, y, big] of HEADS[form % HEADS.length]!) {
    if (!inBloom) {
      if (inside(x, y) && inside(x + 1, y - 1)) s.set(x, y, 'h').set(x + 1, y - 1, 'h');
      continue;
    }
    const head = big ? BIG_HEAD : SMALL_HEAD;
    if (!head.every(([dx, dy]) => inside(x + dx, y + dy))) continue;
    // A shadow under the head on the leaves, then the head.
    for (const [dx, dy] of head)
      if (inside(x + dx + 1, y + dy + 1)) s.set(x + dx + 1, y + dy + 1, 'l');
    for (const [dx, dy, key] of head) s.set(x + dx, y + dy, key);
  }
  return s.toSource();
}

const LEAVES: Palette = {
  [CLEAR]: null,
  o: ramp(C.leafDark)[0],
  l: ramp(C.leafDark)[1],
  m: C.leafDark,
  h: C.leaf,
};

const beds = new Map<string, SpriteSource>();

/** What a patch looks like, from the patches round it: its key, grid and palette. */
export function patchLook(
  patches: readonly Placed[],
  patch: Placed,
  inBloom: boolean,
  form: number,
): { key: string; source: SpriteSource; palette: Palette } {
  const art = PATCH_ART[patch.id];
  const sides = bedSides(patches, patch);
  if (sides === 0) {
    return inBloom
      ? { key: `patch:${patch.id}`, source: art.source, palette: art.palette }
      : { key: 'patch:shoots', source: SHOOTS, palette: SHOOTS_PALETTE };
  }
  const look = `${sides}:${form % BED_FORMS}:${inBloom ? 1 : 0}`;
  let source = beds.get(look);
  if (!source) beds.set(look, (source = drawBed(sides, form, inBloom)));
  return {
    key: `bed:${patch.id}:${look}`,
    source,
    palette: { ...LEAVES, f: art.palette.f!, F: art.palette.F!, s: art.palette.s!, c: C.candle },
  };
}
