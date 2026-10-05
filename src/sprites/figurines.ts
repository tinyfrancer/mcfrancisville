import { CARVABLE, carvedKindOf, figurineOf, type CarvedKind } from '../data/figurines';
import type { Carvable, CritterId, FigurineId, FossilId, ItemId } from '../types/ids';
import {
  ACCENT,
  ACCENT_TWO,
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
} from './buildings';
import { CRITTER_ART } from './critters';
import { FOSSIL_ART } from './fossils';
import type { FurnitureArt } from './furniture';
import { ball, palette, slab, WOOD } from './furnish';
import { ITEM_ART } from './items';
import { specimenOf } from './milestones';
import { PALETTE as C } from './palette';
import { CLEAR, Sketch } from './sketch';
import type { Palette, SpriteSource } from './sprite';

// Gourdon's figurines (0.3's C3), at 32: the thing itself, as she sees it (a critter at 24 as it
// is out and about, a fossil at 24 as in its case, a squishy or doll at 16 as in her bag), stood on
// a little turned plinth with a brass plate. Each is made from the thing's own picture, so a
// critter added later has its figurine without a drawing of its own. Never animated: a figure
// stands still, and the bow spider most of all.

/** The row a figure's feet stand on: the plinth's top. */
const STANDS_ON = 24;

/** A little turned plinth: a lip to stand on, a waist with a brass plate, and a wide foot. */
function plinth(s: Sketch): Sketch {
  slab(s, 6, 24, 20, 2, TRIM);
  slab(s, 8, 26, 16, 3, TRIM);
  slab(s, 5, 29, 22, 2, TRIM);
  s.rect(13, 27, 6, 1, fillOf(ACCENT_TWO)).set(13, 27, lightOf(ACCENT_TWO));
  return s;
}

const PLINTH = finish(plinth(new Sketch(32, 32)));

/** What each kind stands on: warm wood for a critter, painted for a squishy or a doll, stone for a fossil. */
const PLINTH_WOOD: Record<CarvedKind, string> = {
  critter: C.wood,
  squishy: C.rose,
  doll: C.lavender,
  fossil: C.stone,
};

/** A thing's own picture, as a figurine copies it. */
function pictureOf(thing: Carvable): { source: SpriteSource; palette: Palette; glow?: Palette } {
  const kind = carvedKindOf(thing);
  if (kind === 'critter') {
    const art = CRITTER_ART[thing as CritterId];
    return { source: art.world[0], palette: art.palette, ...(art.glow ? { glow: art.glow } : {}) };
  }
  if (kind === 'fossil') return FOSSIL_ART[thing as FossilId];
  return ITEM_ART[thing as ItemId];
}

/** A grid with its empty rows and columns trimmed off round it. */
function trimmed(rows: readonly string[], clear: (k: string) => boolean): string[] {
  const painted = (k: string | undefined) => k !== undefined && !clear(k);
  const ys = rows.flatMap((row, y) => ([...row].some(painted) ? [y] : []));
  const width = rows[0]?.length ?? 0;
  const xs = Array.from({ length: width }, (_, x) => x).filter((x) =>
    rows.some((r) => painted(r[x])),
  );
  if (ys.length === 0 || xs.length === 0) return [];
  return rows.slice(ys[0], ys.at(-1)! + 1).map((r) => r.slice(xs[0], xs.at(-1)! + 1));
}

/** A figure laid over the plinth, its bottom row on the plinth's top, in the middle. */
function standing(figure: readonly string[]): SpriteSource {
  const out = PLINTH.rows.map((r) => [...r]);
  const w = figure[0]?.length ?? 0;
  const x = Math.floor((32 - w) / 2);
  const y = STANDS_ON + 1 - figure.length;
  figure.forEach((row, j) =>
    [...row].forEach((k, i) => {
      if (k !== CLEAR && out[y + j]) out[y + j]![x + i] = k;
    }),
  );
  return { rows: out.map((r) => r.join('')) };
}

function figurine(thing: Carvable): FurnitureArt {
  const picture = pictureOf(thing);
  const figure = specimenOf(picture.source, picture.palette, picture.glow);
  const clear = (k: string) =>
    k === CLEAR || figure.palette[k] === null || figure.palette[k] === undefined;
  const rows = trimmed(figure.rows, clear).map((r) =>
    [...r].map((k) => (clear(k) ? CLEAR : k)).join(''),
  );
  const plinth = palette({ ...WOOD, trim: PLINTH_WOOD[carvedKindOf(thing)], accentTwo: C.gold });
  return {
    source: standing(rows),
    palette: { ...plinth, ...figure.palette },
    ...(Object.keys(figure.glow).length > 0 ? { glow: figure.glow } : {}),
  };
}

/**
 * Gourdon by Gourdon (the `figurines` shelf): his pumpkin head with its candlelit grin, a flannel
 * shirt and a leather apron, a hammer in his hand, on the same plinth.
 */
const LITTLE_GOURDON = (() => {
  const s = plinth(new Sketch(32, 32));
  // Boots and trousers.
  s.rect(12, 21, 3, 3, fillOf(DOOR)).rect(17, 21, 3, 3, fillOf(DOOR));
  s.rect(12, 23, 3, 1, shadeOf(DOOR)).rect(17, 23, 3, 1, shadeOf(DOOR));
  // His shirt, his apron over it, and his arms, a hammer in the one on her right.
  s.rect(11, 14, 10, 7, fillOf(ROOF)).rect(11, 14, 10, 1, lightOf(ROOF));
  s.rect(13, 16, 6, 6, fillOf(WALL)).rect(13, 16, 6, 1, lightOf(WALL));
  s.rect(9, 15, 2, 5, fillOf(ROOF)).rect(21, 15, 2, 5, shadeOf(ROOF));
  s.rect(9, 20, 2, 1, fillOf(LEAVES)).rect(21, 20, 2, 1, fillOf(LEAVES));
  s.rect(23, 17, 1, 5, fillOf(TRIM)).rect(22, 16, 3, 2, fillOf(STONE));
  // His head: a pumpkin with its ribs, a stalk, and a grin cut for the candle inside.
  ball(s, 16, 8, 8, 6, ACCENT);
  for (const x of [12, 16, 20]) s.rect(x, 4, 1, 9, shadeOf(ACCENT));
  s.rect(15, 0, 2, 3, fillOf(LEAVES)).set(17, 1, fillOf(LEAVES));
  for (const x of [11, 18]) s.set(x + 1, 6, INK).rect(x, 7, 3, 1, INK);
  s.rect(12, 10, 8, 1, INK).rect(13, 11, 6, 1, INK);
  s.set(14, 10, fillOf(ACCENT)).set(17, 10, fillOf(ACCENT));
  return finish(s);
})();

const FIGURINES = Object.fromEntries(
  CARVABLE.map((thing) => [figurineOf(thing), figurine(thing)]),
) as Record<FigurineId, FurnitureArt>;

export const FIGURINE_ART: Record<FigurineId | 'carvedGourdon', FurnitureArt> = {
  ...FIGURINES,
  carvedGourdon: {
    source: LITTLE_GOURDON,
    palette: palette({
      ...WOOD,
      trim: C.wood,
      accentTwo: C.gold,
      accent: C.pumpkin,
      leaves: C.moss,
      roof: C.scarlet,
      wall: C.bark,
      door: C.denim,
      stone: C.silver,
    }),
    glow: { [INK]: C.candle },
  },
};
