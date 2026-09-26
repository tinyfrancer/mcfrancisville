import type { TileId } from '../types/ids';
import { PALETTE as C } from './palette';
import type { Palette, SpriteSource } from './sprite';

export interface TileArt {
  source: SpriteSource;
  palette: Palette;
  /** Other looks for the same ground, scattered over the map so it doesn't read as a grid. */
  variants?: readonly SpriteSource[];
}

/** Every look a tile comes in, its plain one first. */
export function tileSources(art: TileArt): readonly SpriteSource[] {
  return [art.source, ...(art.variants ?? [])];
}

const GRASS_PALETTE: Palette = { g: C.moss, G: C.mossLight, d: C.mossDark };

const GRASS: SpriteSource = {
  rows: [
    'gggggggggggggggg',
    'ggggggggggggGgGg',
    'gGgGgggggggggGgg',
    'ggGggggggggggggg',
    'gggggggggggggggg',
    'gggggggggggggggg',
    'ggggggGgGggggggg',
    'gggggggGgggggggg',
    'gggggggggggggggg',
    'gggggggggggggggg',
    'gGgGgggggggggggg',
    'ggGggggggggGgGgg',
    'gggggggggggggGgg',
    'gggggggggggggggg',
    'gggggggggggggggg',
    'gggggggggggggggg',
  ],
};

/** Grass with its tufts in other places, and a few darker blades for depth. */
const GRASS_VARIANTS: SpriteSource[] = [
  {
    rows: [
      'gggggggggggggggg',
      'gggggggggggggggg',
      'ggggggdggggggggg',
      'gggggGdGgggggggg',
      'gggggggggggggggg',
      'gggggggggggggggg',
      'gggggggggggggggg',
      'ggggggggggggdggg',
      'gggggggggggGdGgg',
      'gggggggggggggggg',
      'ggdggggggggggggg',
      'gGdGgggggggggggg',
      'gggggggggggggggg',
      'gggggggggggggggg',
      'gggggggggggggggg',
      'gggggggggggggggg',
    ],
  },
  {
    rows: [
      'gggggggggggggggg',
      'gggggggggggggggg',
      'gggggggggggggggg',
      'ggggggggggGggggg',
      'gggggggggGdGgggg',
      'gggggggggggggggg',
      'gggggggggggggggg',
      'gggGgggggggggggg',
      'ggGdGggggggggggg',
      'gggggggggggggggg',
      'gggggggggggggggg',
      'gggggggggggGgggg',
      'ggggggggggGdGggg',
      'gggggggggggggggg',
      'gggggggggggggggg',
      'gggggggggggggggg',
    ],
  },
  {
    rows: [
      'gggggggggggggggg',
      'ggggggggggggggdg',
      'gggggggggggggggg',
      'gggggggggggggggg',
      'ggggdggggggggggg',
      'gggggggggggggggg',
      'gggggggggggggggg',
      'gggggggggdgggggg',
      'gggggggggggggggg',
      'gggggggggggggggg',
      'gggggggggggggggg',
      'gdgggggggggggggg',
      'gggggggggggggggg',
      'ggggggggggggdggg',
      'gggggggggggggggg',
      'gggggggggggggggg',
    ],
  },
];

const PATH: SpriteSource = {
  rows: [
    'aAaaaaakaAaaaaak',
    'aaaaaaakaaaaaaak',
    'aaaaaaakaaaaaaak',
    'kkkkkkkkkkkkkkkk',
    'aaakaAaaaaakaAaa',
    'aaakaaaaaaakaaaa',
    'aaakaaaaaaakaaaa',
    'kkkkkkkkkkkkkkkk',
    'aAaaaaakaAaaaaak',
    'aaaaaaakaaaaaaak',
    'aaaaaaakaaaaaaak',
    'kkkkkkkkkkkkkkkk',
    'aaakaAaaaaakaAaa',
    'aaakaaaaaaakaaaa',
    'aaakaaaaaaakaaaa',
    'kkkkkkkkkkkkkkkk',
  ],
};

const WATER_ROWS = [
  'wwwwwwwwwwwwwwww',
  'wwWWWwwwwwwwwwww',
  'wwwwwwwwwwwwwwww',
  'wwwwwwwwwWWWwwww',
  'wwwwwwwwwwwwwwww',
  'wwwwwwwwwwwwwwww',
  'wwwwWWWwwwwwwwww',
  'wwwwwwwwwwwwwwww',
  'wwwwwwwwwwwwwWWw',
  'wwwwwwwwwwwwwwww',
  'wWWwwwwwwwwwwwww',
  'wwwwwwwwwwwwwwww',
  'wwwwwwwWWWwwwwww',
  'wwwwwwwwwwwwwwww',
  'wwwwwwwwwwwwwwww',
  'wwwwwwwwwwwwwwww',
];

const WATER: SpriteSource = { rows: WATER_ROWS };

/** Water with its bank along the top, for the row where the pond meets the grass above it. */
const WATER_EDGE: SpriteSource = {
  rows: ['gggggggggggggggg', 'bbbbbbbbbbbbbbbb', 'WwWWwWWWwWWwWWWw', ...WATER_ROWS.slice(3)],
};

const HEDGE: SpriteSource = {
  rows: [
    'khHHhkhHHhkhHHhk',
    'hHhhHhHhhHhHhhHh',
    'hhhhhhhhhhhhhhhh',
    'hhHhhhhhhHhhhhHh',
    'hhhhhhhhhhhhhhhh',
    'hHhhhhHhhhhhHhhh',
    'hhhhhhhhhhhhhhhh',
    'hhhhHhhhhhHhhhhh',
    'hhhhhhhhhhhhhhhh',
    'hHhhhhhHhhhhhhHh',
    'hhhhhhhhhhhhhhhh',
    'hhhHhhhhhhHhhhhh',
    'hhhhhhhhhhhhhhhh',
    'hhhhhhhhhhhhhhhh',
    'khhhkhhhhkhhhhkh',
    'kkkkkkkkkkkkkkkk',
  ],
};

const WATER_PALETTE: Palette = { w: C.water, W: C.waterLight, g: C.moss, b: C.earth };

export const TILE_ART: Record<TileId, TileArt> = {
  grass: { source: GRASS, palette: GRASS_PALETTE, variants: GRASS_VARIANTS },
  path: { source: PATH, palette: { a: C.stone, A: C.stoneLight, k: C.stoneDark } },
  water: { source: WATER, palette: WATER_PALETTE },
  waterEdge: { source: WATER_EDGE, palette: WATER_PALETTE },
  hedge: { source: HEDGE, palette: { h: C.hedge, H: C.hedgeLight, k: C.hedgeDark } },
};
