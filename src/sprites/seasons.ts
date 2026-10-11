import type { SeasonId } from '../data/seasons';
import type { PropId, TileId } from '../types/ids';
import { ROOF } from './buildings';
import { GRASS_TONES, lawnPalette } from './lawn';
import { mix, PALETTE as C, ramp } from './palette';
import { lookOf, PROP_ART, type StandingProp } from './props';
import { CLEAR, Sketch } from './sketch';
import type { Palette, SpriteSource } from './sprite';
import {
  E,
  groundPieces,
  N,
  NE,
  neighbourMask,
  NW,
  S,
  SE,
  SW,
  variantOf,
  W,
  type GroundPiece,
} from './terrain';
import type { LawnField } from './lawn';

/*
 * The town through the seasons (V1's L4, decision 294), all as palette swaps of art that is
 * already drawn: the lawn's tones, the meadow, long grass and hedges, every leafy crown, and in
 * winter the roofs, each baked once a season under a key of its own. Autumn is the town as it
 * always was (October is the heart of it), so autumn changes nothing. Snow on the ground is the
 * lawn's tones in snow, with blades of grass and straw through it; on a track it drifts in along
 * the edges (`snowDust`), baked into the ground's chunks with everything else.
 */

type Tones = typeof GRASS_TONES;

/** Each of the lawn's colours a little of the way toward a season's green. */
function toward(tones: Tones, colour: string, t: number): Tones {
  const out = {} as Record<keyof Tones, Tones[keyof Tones]>;
  for (const [tone, row] of Object.entries(tones) as [keyof Tones, Tones[keyof Tones]][]) {
    out[tone] = {
      fill: mix(row.fill, colour, t),
      blade: mix(row.blade, colour, t),
      tip: mix(row.tip, colour, t),
      under: mix(row.under, colour, t),
    };
  }
  return out as Tones;
}

/**
 * The lawn under snow: soft blue-white in the shade under a crown, whiter out in the open, and
 * slushy where it's trodden by a door, with blades of grass poking through.
 */
const SNOW_TONES: Tones = {
  shade: {
    fill: C.snowShade,
    blade: mix(C.grassCool, C.snowShade, 0.35),
    tip: C.snow,
    under: C.snowDeep,
  },
  dark: {
    fill: mix(C.snow, C.snowShade, 0.45),
    blade: C.snowShade,
    tip: C.snow,
    under: C.snowDeep,
  },
  mid: { fill: C.snow, blade: C.snowShade, tip: C.snowLight, under: mix(C.snowShade, C.snow, 0.4) },
  light: { fill: C.snowLight, blade: C.snow, tip: C.white, under: C.snowShade },
  worn: {
    fill: mix(C.grassWorn, C.snowShade, 0.55),
    blade: C.grassWorn,
    tip: C.snowShade,
    under: mix(C.grassCool, C.snowDeep, 0.4),
  },
};

/** Each season's lawn. */
export const SEASON_TONES: Record<SeasonId, Tones> = {
  autumn: GRASS_TONES,
  spring: toward(GRASS_TONES, C.springGrass, 0.3),
  summer: toward(GRASS_TONES, C.summerGrass, 0.35),
  winter: SNOW_TONES,
};

const LAWNS: Record<SeasonId, Palette> = {
  autumn: lawnPalette(SEASON_TONES.autumn),
  spring: lawnPalette(SEASON_TONES.spring),
  summer: lawnPalette(SEASON_TONES.summer),
  // A tile's little flower is under the snow.
  winter: { ...lawnPalette(SNOW_TONES), f: C.snowLight, y: C.snow },
};

/** Some of a palette's colours a little of the way toward another. */
function shift(keys: string, colour: string, t: number): (p: Palette) => Palette {
  return (p) => {
    const out: Record<string, string | null> = { ...p };
    for (const k of keys) {
      const was = p[k];
      if (was) out[k] = mix(was, colour, t);
    }
    return out;
  };
}

/** Some of a palette's colours swapped outright. */
const swap =
  (to: Record<string, string>) =>
  (p: Palette): Palette => ({ ...p, ...to });

/** Dried seed heads and straw through the snow. */
const STRAW = mix(C.rope, C.snowShade, 0.25);

/**
 * What a season does to the ground laid over the grass, by kind, from the piece's own palette:
 * greener meadows, long grass and hedges in spring and summer; in winter snow on them, on the
 * grass at a cliff's top and along the top of a bank.
 */
const GROUND_SHIFTS: Record<SeasonId, Partial<Record<TileId, (p: Palette) => Palette>>> = {
  autumn: {},
  spring: {
    meadow: shift('mMc', C.springGrass, 0.4),
    longGrass: shift('nNLok', C.springGrass, 0.35),
    hedge: shift('dhHL', C.springGrass, 0.3),
  },
  summer: {
    meadow: shift('mMc', C.summerGrass, 0.3),
    longGrass: shift('nNLok', C.summerGrass, 0.3),
    hedge: shift('dhHL', C.summerGrass, 0.2),
  },
  winter: {
    meadow: swap({
      m: C.snow,
      M: C.snowLight,
      c: C.snowShade,
      w: C.snowLight,
      W: C.snowLight,
      y: STRAW,
      p: STRAW,
      r: STRAW,
      o: mix(C.wood, C.snowShade, 0.3),
    }),
    longGrass: swap({
      n: C.snow,
      k: C.snowShade,
      N: STRAW,
      L: ramp(C.rope)[3],
      o: mix(C.wood, C.rope, 0.4),
    }),
    hedge: (p) => ({ ...p, h: mix(p.h ?? C.hedge, C.snowShade, 0.45), H: C.snow, L: C.snowLight }),
    cliff: swap({ g: C.snow, G: C.snowLight }),
    water: swap({ G: C.snow }),
    ice: swap({ G: C.snow }),
  },
};

const shifted = new Map<string, Palette>();

/** The palette under a key, made once. */
function once(key: string, make: () => Palette): Palette {
  let p = shifted.get(key);
  if (!p) shifted.set(key, (p = make()));
  return p;
}

/** A piece of ground as it is in a season: the same grid, its palette and key the season's. */
export function seasonPiece(piece: GroundPiece, season: SeasonId): GroundPiece {
  if (season === 'autumn') return piece;
  const kind = piece.key.split(':')[1] as TileId;
  if (kind === 'grass') return { ...piece, key: `${piece.key}@${season}`, palette: LAWNS[season] };
  const change = GROUND_SHIFTS[season][kind];
  if (!change) return piece;
  return {
    ...piece,
    key: `${piece.key}@${season}`,
    palette: once(`${kind}@${season}`, () => change(piece.palette)),
  };
}

/** The tracks snow drifts in along in winter: the cobbles, dirt, gravel and a pier's boards. */
const DUSTED: ReadonlySet<TileId | undefined> = new Set(['path', 'dirt', 'gravel', 'boards']);

/** How far in from a track's open edge snow drifts, in pixels, before it thins to flecks. */
const DRIFT = 5;

const BAYER = [0, 8, 2, 10, 12, 4, 14, 6, 3, 11, 1, 9, 15, 7, 13, 5].map((n) => (n + 0.5) / 16);
const bayer = (x: number, y: number) => BAYER[(y % 4) * 4 + (x % 4)]!;

/** A small fixed hash of a pixel, from 0 to 1, for the flecks of snow out on a track. */
function fleck(x: number, y: number, salt: number): number {
  let h = Math.imul(x + 17 + salt * 131, 0x2c1b3c6d) ^ Math.imul(y + 3, 0x297a2d39);
  h = Math.imul(h ^ (h >>> 15), 0x85ebca6b);
  return ((h ^ (h >>> 13)) >>> 0) / 0xffffffff;
}

/**
 * Snow on a track in winter, by which of its sides open onto the snowy lawn (`mask`): drifted in
 * along those edges, thick at the edge and thinning in a dither, and a few flecks out on the
 * track where it hasn't been walked clear. Its shade side is the bottom of a drift, lit on top.
 */
export function snowDust(mask: number, variant: number): SpriteSource {
  const s = new Sketch(32, 32);
  const open = (bit: number) => (mask & bit) === 0;
  for (let y = 0; y < 32; y++) {
    for (let x = 0; x < 32; x++) {
      let d = Infinity;
      if (open(N)) d = Math.min(d, y);
      if (open(S)) d = Math.min(d, 31 - y);
      if (open(W)) d = Math.min(d, x);
      if (open(E)) d = Math.min(d, 31 - x);
      for (const [bit, cx, cy] of [
        [NW, 0, 0],
        [NE, 31, 0],
        [SW, 0, 31],
        [SE, 31, 31],
      ] as const) {
        if (open(bit)) d = Math.min(d, Math.max(Math.abs(x - cx), Math.abs(y - cy)) + 1);
      }
      const drifted = d < DRIFT && bayer(x, y) < (DRIFT - d) / DRIFT;
      if (drifted) s.set(x, y, d < 1.5 ? 'w' : 'W');
      else if (fleck(x, y, variant) < 0.035) s.set(x, y, fleck(y, x, 7) < 0.5 ? 'W' : 's');
    }
  }
  // The near side of each drift in a touch of shade, so it lies on the track rather than over it.
  for (let y = 31; y > 0; y--) {
    for (let x = 0; x < 32; x++) {
      if (s.get(x, y) === CLEAR && s.get(x, y - 1) === 'W') s.set(x, y, 's');
    }
  }
  return s.toSource();
}

const SNOW_DUST_PALETTE: Palette = {
  [CLEAR]: null,
  w: C.snowLight,
  W: C.snow,
  s: C.snowShade,
};

const dusts = new Map<string, SpriteSource>();

/** The snow on a track's tile, drawn once for its shape. */
function dustPiece(mask: number, variant: number): GroundPiece {
  const key = `ground:snow:${mask & 0xff}:${variant}`;
  let source = dusts.get(key);
  if (!source) dusts.set(key, (source = snowDust(mask & 0xff, variant)));
  return { key, source, palette: SNOW_DUST_PALETTE };
}

/**
 * What the ground at (tx, ty) is drawn from in a season, bottom first: the tile's pieces in the
 * season's palettes (`groundPieces`, unchanged in autumn), and with snow lying, the snow drifted
 * onto a track.
 */
export function seasonPieces(
  tileAt: (tx: number, ty: number) => TileId | undefined,
  tx: number,
  ty: number,
  lawn: LawnField | undefined,
  season: SeasonId,
  snow: boolean,
): GroundPiece[] {
  const pieces = groundPieces(tileAt, tx, ty, lawn).map((p) => seasonPiece(p, season));
  if (snow && DUSTED.has(tileAt(tx, ty))) {
    pieces.push(dustPiece(neighbourMask(tileAt, tx, ty), variantOf(tx + 7, ty + 3, 3)));
  }
  return pieces;
}

// ---- What stands in the town ------------------------------------------------------------------

/** A crown's seven keys: its outline, five tones darkest first, and the brightest flecks. */
type Crown = readonly [string, string, string, string, string, string, string];

function crown(c: Crown): Palette {
  return { o: c[0], 0: c[1], 1: c[2], 2: c[3], 3: c[4], 4: c[5], 5: c[6] };
}

/** A crown in fresh leaf, as `leaves` in `sprites/nature.ts` makes one. */
function fresh(base: string, light: string): Palette {
  const dark = ramp(base);
  return crown([
    dark[0],
    dark[1],
    mix(dark[1], base, 0.5),
    base,
    light,
    ramp(light)[3],
    ramp(light)[4],
  ]);
}

/** In blossom: pink over the green leaves showing through the shade, flecked white. */
const PINK_BLOSSOM = crown([
  ramp(C.canopyDark)[0],
  C.canopyDark,
  mix(C.canopy, C.blossom, 0.45),
  C.blossom,
  C.blossomLight,
  mix(C.blossomLight, C.white, 0.6),
  C.white,
]);

/** In white blossom, blushing pink in its shade. */
function whiteBlossom(stem: string): Palette {
  return crown([
    ramp(stem)[0],
    ramp(stem)[1],
    mix(stem, C.blossom, 0.5),
    C.blossomLight,
    C.blossomWhite,
    C.white,
    C.white,
  ]);
}

/** Snow lying along the top of a crown: its own dark leaves underneath, white where it's lit. */
function snowy(base: string): Palette {
  const dark = ramp(base);
  return crown([
    dark[0],
    dark[1],
    base,
    mix(base, C.snowShade, 0.55),
    C.snow,
    C.snowLight,
    C.snowLight,
  ]);
}

/** Bare twigs in winter with the snow along them. */
const BARE = snowy(mix(C.bark, C.wood, 0.3));

/**
 * What each season does to the crowns, by the prop and the colouring it wears (`variants`, in their
 * order): blossom and fresh leaf in spring, the autumn colours gone green in summer, snow along the
 * tops of everything in winter. A null keeps the colouring as it is.
 */
const CROWNS: Record<
  Exclude<SeasonId, 'autumn'>,
  Partial<Record<PropId, readonly (Palette | null)[]>>
> = {
  spring: {
    // The teal trees in pink blossom, the autumn ones in fresh leaf, the plum ones in white.
    tree: [PINK_BLOSSOM, fresh(C.leaf, C.leafLight), whiteBlossom(C.plum)],
    oldTree: [fresh(C.leafDark, C.leaf), fresh(C.canopy, C.canopyLight)],
    willow: [fresh(C.leafLight, mix(C.leafLight, C.candle, 0.3))],
    bush: [fresh(C.leaf, C.leafLight), fresh(C.hedgeLight, C.leaf), PINK_BLOSSOM],
    appleTree: [PINK_BLOSSOM],
    pearTree: [whiteBlossom(C.leafDark)],
    plumTree: [PINK_BLOSSOM],
    persimmonTree: [whiteBlossom(C.moss)],
  },
  summer: {
    // The teal trees in full summer leaf, the autumn ones green; the plum ones stay plum.
    tree: [
      fresh(mix(C.canopy, C.leaf, 0.45), mix(C.canopyLight, C.leafLight, 0.45)),
      fresh(mix(C.leafDark, C.canopy, 0.3), C.leaf),
      null,
    ],
    bush: [fresh(C.leaf, C.leafLight), null, null],
  },
  winter: {
    tree: [snowy(C.canopyDark), BARE, snowy(C.plum)],
    oldTree: [snowy(C.hedge), snowy(C.canopyDark)],
    willow: [snowy(mix(C.rope, C.wood, 0.5))],
    bush: [snowy(C.leafDark), snowy(C.hedge), snowy(C.plum)],
    roseBush: [snowy(C.leafDark)],
    appleTree: [BARE],
    pearTree: [BARE],
    plumTree: [BARE],
    persimmonTree: [BARE],
  },
};

/** An evergreen: a conifer keeps its needles while the other trees blossom or go green. */
const EVERGREEN = fresh(C.canopyDark, C.canopy);

/** Which of the tree's forms is the conifer (`MORE_TREE_FORMS`, after the three round ones). */
const CONIFER = 3;

/** Snow on a roof in winter: its texture and its lit edge white, its eaves still in shade. */
const ROOF_SNOW: Palette = { [ROOF[2]!]: C.snowShade, [ROOF[3]!]: C.snow, [ROOF[4]!]: C.snowLight };

/** What else stands under a roof besides a building with a door: the wells. */
const ROOFED: ReadonlySet<PropId> = new Set(['well', 'farmWell']);

/** Whether a season changes how this prop is drawn. */
export function turnsWithSeasons(id: PropId): boolean {
  const art = PROP_ART[id];
  if ((art.door && !art.noEaves) || ROOFED.has(id)) return true;
  return Object.values(CROWNS).some((c) => c[id] !== undefined);
}

/**
 * How a prop looks in a season (`lookOf`, with the season's palette and a key of its own): its
 * crown in the season's colours, or snow on its roof in winter. Unchanged in autumn.
 */
export function seasonLook(prop: StandingProp, season: SeasonId): ReturnType<typeof lookOf> {
  const base = lookOf(prop);
  if (season === 'autumn' || prop.sign || prop.joins !== undefined) return base;
  const art = PROP_ART[prop.id];
  const v = art.variants ? variantOf(prop.tx, prop.ty, art.variants.length) : 0;
  const leaves = CROWNS[season][prop.id]?.[v];
  const roofed =
    season === 'winter' && !art.noEaves && (art.door !== undefined || ROOFED.has(prop.id));
  const needles = prop.id === 'tree' && base.form === CONIFER && season !== 'winter';
  if (needles) {
    const key = `${base.key}@${season}`;
    return { ...base, key, palette: once(key, () => ({ ...base.palette, ...EVERGREEN })) };
  }
  if (!leaves && !roofed) return base;
  const key = `${base.key}@${season}`;
  const palette = once(key, () => ({
    ...base.palette,
    ...(leaves ?? {}),
    ...(roofed ? ROOF_SNOW : {}),
  }));
  return { ...base, palette, key };
}

// ---- What moves over the ground ---------------------------------------------------------------

/**
 * The swaying tufts' colours in a season (`TUFT_PALETTE`'s keys): greener in spring and summer,
 * and in winter straw standing up out of the snow.
 */
export function tuftColours(season: SeasonId, palette: Palette): Palette {
  if (season === 'spring')
    return once('tuft@spring', () => shift('GLdk', C.springGrass, 0.4)(palette));
  if (season === 'summer')
    return once('tuft@summer', () => shift('GLdk', C.summerGrass, 0.3)(palette));
  if (season === 'winter') {
    return once('tuft@winter', () =>
      swap({ G: STRAW, L: ramp(C.rope)[3], d: mix(C.rope, C.wood, 0.5), k: C.snowShade })(palette),
    );
  }
  return palette;
}
