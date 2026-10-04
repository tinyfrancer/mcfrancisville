import type { DisplayPiece, ItemId, SetPiece } from '../types/ids';
import {
  ACCENT_TWO,
  darkOf,
  DOOR,
  fillOf,
  finish,
  GLASS,
  GLINT,
  LAMP,
  LEAVES,
  lightOf,
  outlineOf,
  ROOF,
  shadeOf,
  STONE,
  TRIM,
  WALL,
  WHITE,
} from './buildings';
import type { FurnitureArt } from './furniture';
import { ball, frame, palette, slab, WOOD } from './furnish';
import { ITEM_ART } from './items';
import { PALETTE as C } from './palette';
import { CLEAR, Sketch } from './sketch';
import type { Layer, Palette, SpriteSource } from './sprite';

// What shows off what she has (0.3's H2), at 32. Each piece is drawn in two halves, what's behind
// the things it shows and what's in front of them (a jar's glass, a crate's front, a vase's
// neck), and the things themselves are their own bag icons, laid in between at 1×, or halved
// for a piece that holds many small ones, so whatever is added to a set later shows without a
// drawing of its own.

/** Where a thing goes in a piece: a box it's trimmed to fit, standing on its bottom row. */
export interface Slot {
  x: number;
  y: number;
  w: number;
  h: number;
}

export interface ShowcaseArt {
  /** The piece behind what it shows, and in front of it. */
  back: SpriteSource;
  front?: SpriteSource;
  palette: Palette;
  /** Where each thing goes, in the order a set fills them: the first is the first she has. */
  slots: readonly Slot[];
  /** Halves what it shows, for a piece of many small things: a shelf of squishies, a jar of beads. */
  mini?: true;
  /** Centres what it shows up and down rather than standing it on the bottom: a frame. */
  middle?: true;
  glow?: Palette;
  lights?: FurnitureArt['lights'];
}

/** A grid of nothing, to draw only some of a piece on. */
const blank = (w: number, h: number) => new Sketch(w, h);

// ---- The sets ---------------------------------------------------------------------------------

/** Cody's squishy shelf: a little bookcase, three shelves of three. */
const SQUISHY_SHELF = (() => {
  const s = new Sketch(32, 46);
  slab(s, 2, 2, 28, 42, TRIM);
  for (const y of [5, 19, 33]) s.rect(4, y, 24, 9, darkOf(TRIM));
  for (const y of [14, 28]) s.rect(3, y, 26, 2, lightOf(TRIM));
  s.rect(4, 44, 3, 2, darkOf(TRIM)).rect(25, 44, 3, 2, darkOf(TRIM));
  return finish(s);
})();

const SQUISHY_SLOTS: Slot[] = [5, 19, 33].flatMap((y) =>
  [4, 12, 20].map((x) => ({ x, y, w: 8, h: 9 })),
);

/**
 * Agatha's haunted dollhouse, its front open as a dollhouse's is: a crooked roof with a light on
 * in the attic, and two floors of four little rooms for her dolls.
 */
const DOLL_HOUSE = (() => {
  const s = new Sketch(32, 48);
  for (let j = 0; j < 16; j++) {
    const half = Math.floor(j * 0.95) + 1;
    s.rect(16 - half, 2 + j, half * 2, 1, j % 3 === 2 ? shadeOf(ROOF) : fillOf(ROOF));
  }
  s.rect(22, 3, 3, 7, fillOf(STONE)).rect(22, 3, 1, 7, lightOf(STONE));
  // The attic's round window, lit.
  s.ellipse(15.5, 10.5, 2.5, 2.5, fillOf(TRIM)).ellipse(15.5, 10.5, 1.5, 1.5, GLASS);
  slab(s, 2, 18, 28, 26, WALL);
  s.rect(1, 17, 30, 2, darkOf(ROOF));
  // Two floors of rooms, papered, each with its floorboards and a wall between them.
  for (const y of [20, 32]) {
    s.rect(4, y, 24, 11, shadeOf(DOOR));
    s.rect(4, y, 24, 1, darkOf(DOOR));
    s.rect(4, y + 10, 24, 1, fillOf(TRIM));
    s.rect(15, y, 2, 11, fillOf(WALL)).set(15, y, lightOf(WALL));
  }
  s.rect(0, 44, 32, 3, fillOf(TRIM)).rect(0, 44, 32, 1, lightOf(TRIM));
  return finish(s);
})();

const DOLL_SLOTS: Slot[] = [20, 32].flatMap((y) =>
  [4, 9, 17, 22].map((x) => ({ x, y: y + 1, w: 6, h: 9 })),
);

/** A low wooden rack of records, two tiers of sleeves facing out, as a record shop shows them. */
const RECORD_RACK_BACK = (() => {
  const s = new Sketch(32, 34);
  slab(s, 1, 4, 30, 28, TRIM);
  for (const y of [6, 18]) s.rect(3, y, 26, 11, darkOf(TRIM));
  // The shadow under each tier's top.
  s.rect(3, 6, 26, 1, outlineOf(TRIM)).rect(3, 18, 26, 1, outlineOf(TRIM));
  s.rect(3, 32, 3, 2, darkOf(TRIM)).rect(26, 32, 3, 2, darkOf(TRIM));
  return finish(s);
})();

/** The rails along the front of each tier, which the sleeves lean back against. */
const RECORD_RACK_FRONT = (() => {
  const s = blank(32, 34);
  for (const y of [15, 27]) {
    s.rect(2, y, 28, 2, fillOf(TRIM)).rect(2, y, 28, 1, lightOf(TRIM));
    s.rect(2, y + 2, 28, 1, shadeOf(TRIM));
  }
  return s.toSource();
})();

const RECORD_SLOTS: Slot[] = [6, 18].flatMap((y) =>
  [3, 9, 16, 22].map((x) => ({ x, y: y + 1, w: 7, h: 9 })),
);

/** A glass jar with a cork in it, for one of every bead. */
const BEAD_JAR_BACK = (() => {
  const s = new Sketch(32, 34);
  s.rect(11, 9, 10, 5, fillOf(TRIM)).rect(11, 9, 10, 1, lightOf(TRIM));
  s.rect(11, 13, 10, 1, shadeOf(TRIM));
  return finish(s);
})();

/** The jar's glass, in front of the beads: its sides, its shoulders and its shine. */
const BEAD_JAR_FRONT = (() => {
  const s = blank(32, 34);
  s.rect(10, 14, 12, 1, GLASS).rect(9, 15, 1, 1, GLASS).rect(22, 15, 1, 1, GLASS);
  s.rect(8, 16, 1, 15, GLASS).rect(23, 16, 1, 15, GLASS);
  s.rect(9, 31, 14, 1, GLASS);
  s.line(10, 18, 10, 23, GLINT).set(11, 17, GLINT).set(21, 28, GLINT);
  return s.toSource();
})();

/** A heap of beads, the first at the bottom, two to a row. */
const BEAD_SLOTS: Slot[] = [30, 26, 22, 18].flatMap((bottom, row) =>
  [9, 16].map((x) => ({ x: x + (row % 2), y: bottom - 4, w: 7, h: 5 })),
);

/** A velvet board on the wall, two tiles wide, with pegs for her bracelets in two rows. */
const BRACELET_BOARD = (() => {
  const s = new Sketch(64, 32);
  frame(s, 1, 1, 62, 30, TRIM, 2);
  s.rect(3, 3, 58, 26, fillOf(ROOF));
  s.rect(3, 3, 58, 1, darkOf(ROOF)).rect(3, 3, 1, 26, darkOf(ROOF));
  return finish(s);
})();

const BRACELET_PEGS = [13, 32, 51];

const BRACELET_FRONT = (() => {
  const s = blank(64, 32);
  for (const y of [4, 17]) {
    for (const x of BRACELET_PEGS) s.rect(x - 1, y, 2, 2, LAMP).set(x - 1, y, GLINT);
  }
  return s.toSource();
})();

const BRACELET_SLOTS: Slot[] = [4, 17].flatMap((y) =>
  BRACELET_PEGS.map((x) => ({ x: x - 9, y: y + 1, w: 18, h: 12 })),
);

// ---- The display pieces -----------------------------------------------------------------------

/** A glass bell on a round wooden stand, its knob on top. */
const BELL_JAR_BACK = (() => {
  const s = new Sketch(32, 42);
  slab(s, 3, 33, 26, 5, TRIM);
  s.rect(5, 38, 22, 3, darkOf(TRIM)).rect(2, 32, 28, 2, lightOf(TRIM));
  return finish(s);
})();

const BELL_JAR_FRONT = (() => {
  const s = blank(32, 42);
  const inside = (i: number, j: number) => ((i - 15.5) / 13) ** 2 + ((j - 20) / 19) ** 2 <= 1;
  for (let j = 2; j < 32; j++) {
    for (let i = 2; i < 30; i++) {
      const rim = inside(i, j) && (!inside(i - 1, j) || !inside(i + 1, j) || !inside(i, j - 1));
      if (rim) s.set(i, j, GLASS);
    }
  }
  s.rect(4, 31, 24, 1, GLASS);
  s.line(7, 11, 5, 18, GLINT).line(8, 8, 10, 6, GLINT).set(6, 21, GLINT);
  s.rect(14, 0, 4, 2, LAMP).set(14, 0, GLINT);
  return s.toSource();
})();

/** A deep frame with a velvet back, for the wall. */
const SHADOW_BOX = (() => {
  const s = new Sketch(32, 32);
  frame(s, 1, 1, 30, 30, ACCENT_TWO, 3);
  s.rect(4, 4, 24, 24, fillOf(DOOR));
  s.rect(4, 4, 24, 2, darkOf(DOOR)).rect(4, 4, 2, 24, darkOf(DOOR));
  return finish(s);
})();

const SHADOW_BOX_FRONT = (() => {
  const s = blank(32, 32);
  s.line(24, 5, 26, 7, GLINT).set(26, 5, GLINT);
  return s.toSource();
})();

/** A little marble plinth: a top to stand things on, a fluted shaft and a base. */
const PLINTH = (() => {
  const s = new Sketch(32, 46);
  slab(s, 3, 41, 26, 5, STONE);
  slab(s, 7, 25, 18, 16, STONE);
  for (const x of [10, 14, 18, 21]) s.rect(x, 27, 1, 13, shadeOf(STONE));
  slab(s, 4, 21, 24, 4, STONE);
  return finish(s);
})();

/** A glass house on a wooden base, moss and pebbles inside. */
const TERRARIUM_BACK = (() => {
  const s = new Sketch(32, 34);
  slab(s, 2, 28, 28, 5, TRIM);
  s.rect(4, 22, 24, 6, fillOf(LEAVES));
  for (let i = 4; i < 28; i += 3) s.set(i, 22, lightOf(LEAVES)).set(i + 1, 23, shadeOf(LEAVES));
  s.rect(7, 26, 2, 1, fillOf(STONE)).rect(20, 25, 3, 2, fillOf(STONE)).set(20, 25, lightOf(STONE));
  return finish(s);
})();

const TERRARIUM_FRONT = (() => {
  const s = blank(32, 34);
  // A brass frame of posts and a peaked top, the glass between them.
  for (const x of [3, 28]) s.rect(x, 8, 1, 20, LAMP);
  s.rect(3, 8, 26, 1, LAMP);
  for (let i = 0; i < 6; i++) s.set(16 - i - 1, 3 + i, LAMP).set(16 + i, 3 + i, LAMP);
  s.rect(15, 2, 2, 1, LAMP);
  s.line(5, 10, 5, 16, GLINT).set(6, 10, GLINT).set(26, 25, GLINT);
  return s.toSource();
})();

/** A slim glazed vase, standing in front of the stem of what's in it. */
const BUD_VASE_FRONT = (() => {
  const s = new Sketch(32, 34);
  s.rect(14, 16, 4, 4, fillOf(ROOF)).rect(13, 15, 6, 2, fillOf(ROOF));
  ball(s, 15.5, 26, 6, 7, ROOF);
  s.rect(12, 32, 8, 2, darkOf(ROOF));
  s.set(13, 23, WHITE).set(13, 24, lightOf(ROOF));
  return finish(s);
})();

// ---- Every piece ------------------------------------------------------------------------------

const SHELF_COLOURS = palette({ ...WOOD, trim: C.wood });

export const SHOWCASE_ART: Record<SetPiece | DisplayPiece, ShowcaseArt> = {
  squishyShelf: { back: SQUISHY_SHELF, palette: SHELF_COLOURS, slots: SQUISHY_SLOTS, mini: true },
  dollHouse: {
    back: DOLL_HOUSE,
    palette: palette({
      ...WOOD,
      wall: C.lavender,
      roof: C.plum,
      trim: C.ink,
      door: C.rose,
      glass: C.dusk,
    }),
    slots: DOLL_SLOTS,
    mini: true,
    glow: { [GLASS]: C.candle },
    lights: [{ x: 15, y: 10, radius: 18 }],
  },
  recordRack: {
    back: RECORD_RACK_BACK,
    front: RECORD_RACK_FRONT,
    palette: SHELF_COLOURS,
    slots: RECORD_SLOTS,
    mini: true,
  },
  beadJar: {
    back: BEAD_JAR_BACK,
    front: BEAD_JAR_FRONT,
    palette: palette({ ...WOOD, trim: C.wood, glass: C.ghost }),
    slots: BEAD_SLOTS,
    mini: true,
  },
  braceletWall: {
    back: BRACELET_BOARD,
    front: BRACELET_FRONT,
    palette: palette({ ...WOOD, roof: C.navy }),
    slots: BRACELET_SLOTS,
  },
  bellJar: {
    back: BELL_JAR_BACK,
    front: BELL_JAR_FRONT,
    palette: palette({ ...WOOD, trim: C.bark, glass: C.ghost }),
    slots: [{ x: 4, y: 9, w: 24, h: 23 }],
  },
  displayFrame: {
    back: SHADOW_BOX,
    front: SHADOW_BOX_FRONT,
    palette: palette({ ...WOOD, accentTwo: C.gold, door: C.navy, glass: C.ghost }),
    slots: [{ x: 4, y: 4, w: 24, h: 24 }],
    middle: true,
  },
  plinth: {
    back: PLINTH,
    palette: palette({ ...WOOD, stone: C.silver }),
    slots: [{ x: 4, y: 0, w: 24, h: 21 }],
  },
  terrarium: {
    back: TERRARIUM_BACK,
    front: TERRARIUM_FRONT,
    palette: palette({ ...WOOD, trim: C.bark, leaves: C.moss, glass: C.ghost }),
    slots: [{ x: 5, y: 9, w: 22, h: 16 }],
  },
  budVase: {
    back: blank(32, 34).toSource(),
    front: BUD_VASE_FRONT,
    palette: palette({ ...WOOD, roof: C.teal }),
    slots: [{ x: 8, y: 0, w: 16, h: 20 }],
  },
};

/** Each piece as the shop, the chest and the gallery show it: empty, its front over its back. */
export const SHOWCASE_FURNITURE_ART = Object.fromEntries(
  Object.entries(SHOWCASE_ART).map(([id, art]) => {
    const piece: FurnitureArt = { source: over(art.back, art.front), palette: art.palette };
    if (art.glow) piece.glow = art.glow;
    if (art.lights) piece.lights = art.lights;
    return [id, piece];
  }),
) as Record<SetPiece | DisplayPiece, FurnitureArt>;

function over(back: SpriteSource, front: SpriteSource | undefined): SpriteSource {
  if (!front) return back;
  return {
    rows: back.rows.map((row, j) =>
      [...row]
        .map((k, i) => ((front.rows[j]?.[i] ?? CLEAR) !== CLEAR ? front.rows[j]![i]! : k))
        .join(''),
    ),
  };
}

// ---- What's on show ---------------------------------------------------------------------------

/** A grid's painted part, trimmed of empty rows and columns round it. */
function trimmed(rows: readonly string[], clear: (k: string) => boolean): string[] {
  const painted = (k: string | undefined) => k !== undefined && !clear(k);
  const ys = rows.flatMap((row, y) => ([...row].some(painted) ? [y] : []));
  const xs = rows[0]
    ? [...rows[0]].flatMap((_, x) => (rows.some((r) => painted(r[x])) ? [x] : []))
    : [];
  if (ys.length === 0 || xs.length === 0) return [];
  const [x0, x1] = [xs[0]!, xs[xs.length - 1]!];
  return rows.slice(ys[0], ys[ys.length - 1]! + 1).map((r) => r.slice(x0, x1 + 1));
}

/**
 * A grid at half its size: each two-by-two block the key most of it is, or clear where at most
 * one of its four is painted. Ties go to the first, from the top left, which is its outline.
 */
export function halved(rows: readonly string[], clear: (k: string) => boolean): string[] {
  const out: string[] = [];
  for (let y = 0; y + 1 < rows.length; y += 2) {
    let line = '';
    for (let x = 0; x + 1 < (rows[0]?.length ?? 0); x += 2) {
      const keys = [rows[y]![x]!, rows[y]![x + 1]!, rows[y + 1]![x]!, rows[y + 1]![x + 1]!].filter(
        (k) => !clear(k),
      );
      if (keys.length < 2) {
        line += CLEAR;
        continue;
      }
      const counts = new Map<string, number>();
      for (const k of keys) counts.set(k, (counts.get(k) ?? 0) + 1);
      line += [...counts].reduce((a, b) => (b[1] > a[1] ? b : a))[0];
    }
    out.push(line);
  }
  return out;
}

/** A thing as it goes in a slot: its icon trimmed, halved if the piece is for small things or it won't fit. */
export function fitted(id: ItemId, slot: Slot, mini: boolean): string[] {
  const art = ITEM_ART[id];
  const clear = (k: string) => art.palette[k] === null || art.palette[k] === undefined;
  let rows = trimmed(art.source.rows, clear);
  const big = () => (rows[0]?.length ?? 0) > slot.w || rows.length > slot.h;
  if (mini || big()) rows = trimmed(halved(art.source.rows, clear), clear);
  // Still too big (a slot smaller than its half): its top middle, never past the slot's edges.
  if (big()) {
    const w = Math.min(slot.w, rows[0]?.length ?? 0);
    const left = Math.floor(((rows[0]?.length ?? 0) - w) / 2);
    rows = rows.slice(0, slot.h).map((r) => r.slice(left, left + w));
  }
  return rows;
}

/**
 * The layers a piece is drawn in with what it shows: behind, each thing in its slot (the frontmost
 * slot last), then in front. `contents` fill the slots in order; any past the last slot aren't shown.
 */
export function showcaseLayers(id: SetPiece | DisplayPiece, contents: readonly ItemId[]): Layer[] {
  const art = SHOWCASE_ART[id];
  const width = art.back.rows[0]?.length ?? 0;
  const height = art.back.rows.length;
  const things = contents.slice(0, art.slots.length).map((item, i) => {
    const slot = art.slots[i]!;
    const rows = fitted(item, slot, art.mini === true);
    const w = rows[0]?.length ?? 0;
    const x = slot.x + Math.floor((slot.w - w) / 2);
    const y = art.middle
      ? slot.y + Math.floor((slot.h - rows.length) / 2)
      : slot.y + slot.h - rows.length;
    const grid = Array.from({ length: height }, () => CLEAR.repeat(width).split(''));
    rows.forEach((row, j) =>
      [...row].forEach((k, i2) => {
        const line = grid[y + j];
        if (k !== CLEAR && line && x + i2 >= 0 && x + i2 < width) line[x + i2] = k;
      }),
    );
    const layer: Layer = {
      source: { rows: grid.map((r) => r.join('')) },
      palette: { ...ITEM_ART[item].palette, [CLEAR]: null },
    };
    return { layer, foot: slot.y + slot.h };
  });
  // What's further back (higher up) goes first, so the front of a crate's sleeves is on top.
  things.sort((a, b) => a.foot - b.foot);
  const layers: Layer[] = [{ source: art.back, palette: art.palette }];
  layers.push(...things.map((t) => t.layer));
  if (art.front) layers.push({ source: art.front, palette: art.palette });
  return layers;
}
