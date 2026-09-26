import type { PropId, TileId } from '../types/ids';

export interface LegendEntry {
  tile: TileId;
  prop?: PropId;
  /** A solid tile can't be walked on. Props are solid over their whole footprint regardless. */
  solid?: boolean;
}

export interface MapSource {
  rows: readonly string[];
  legend: Readonly<Record<string, LegendEntry>>;
  /** Where the player stands on arrival: the tile in front of her door. */
  spawn: { tx: number; ty: number };
}

/** How many tiles a prop stands on. A multi-tile prop is written as a block of its letter. */
export const PROP_FOOTPRINT: Record<PropId, { w: number; h: number }> = {
  tree: { w: 1, h: 1 },
  pumpkin: { w: 1, h: 1 },
  lantern: { w: 1, h: 1 },
  gravestone: { w: 1, h: 1 },
  fence: { w: 1, h: 1 },
  fencePost: { w: 1, h: 1 },
  well: { w: 2, h: 2 },
  homeHouse: { w: 3, h: 3 },
  shopHouse: { w: 3, h: 3 },
  salonHouse: { w: 3, h: 3 },
};

const LEGEND: Record<string, LegendEntry> = {
  '#': { tile: 'hedge', solid: true },
  '.': { tile: 'grass' },
  ',': { tile: 'flowers' },
  '=': { tile: 'path' },
  '~': { tile: 'water', solid: true },
  '^': { tile: 'waterEdge', solid: true },
  T: { tile: 'grass', prop: 'tree' },
  p: { tile: 'grass', prop: 'pumpkin' },
  L: { tile: 'grass', prop: 'lantern' },
  l: { tile: 'path', prop: 'lantern' },
  g: { tile: 'grass', prop: 'gravestone' },
  f: { tile: 'grass', prop: 'fence' },
  '|': { tile: 'grass', prop: 'fencePost' },
  W: { tile: 'path', prop: 'well' },
  H: { tile: 'grass', prop: 'homeHouse' },
  S: { tile: 'grass', prop: 'shopHouse' },
  M: { tile: 'grass', prop: 'salonHouse' },
};

/**
 * The town, a first draft (phase 1). Her house and the fenced farm plot are top-left, the lantern-lit
 * square with its well in the middle, the shop (S) and the Muse Hair Salon (M) either side of it,
 * the graveyard garden bottom-left and the pond bottom-right.
 */
export const TOWN: MapSource = {
  legend: LEGEND,
  spawn: { tx: 4, ty: 6 },
  rows: [
    '##############################',
    '###........................###',
    '##..............T..T..T.....##',
    '#.THHH..ffffff...........T...#',
    '#..HHH,,|....|..,,...........#',
    '#.THHH,.|....|...,...,,....T.#',
    '#...=...|....|......T....,,..#',
    '#...=...ff..ff..........T....#',
    '#.p.=.p...==.................#',
    '#.==========================.#',
    '#..L........Lp==pL........L..#',
    '#.............==.............#',
    '#.,..SSS......==......MMM....#',
    '#.,..SSS......==......MMM..,.#',
    '#....SSS......==......MMM....#',
    '#.T...=.p.....==.....p.=..T..#',
    '#....====================....#',
    '#....====================..T.#',
    '#...T....l==========l........#',
    '#........============........#',
    '#.T......=====WW=====.....,..#',
    '#..,.....=====WW=====...T..,.#',
    '#.,...T..============........#',
    '#........============........#',
    '#........l==========l.T....T.#',
    '#..T..........==.............#',
    '#......,,.....==.....,.......#',
    '#.........T...==...T..,......#',
    '#.T.........p.==p..........T.#',
    '#....====================....#',
    '#...p..=..p......=.p....p....#',
    '#......=.....T...=...........#',
    '#..ffff=ffff.....=.^^^^^^^^..#',
    '#.T|.......|.,...=.~~~~~~~~T.#',
    '#..|.g.g.g.|..,..=.~~~~~~~~..#',
    '#..|p.,,,..|.....=.~~~~~~~~..#',
    '#..|..,,,.p|.....=.~~~~~~~~..#',
    '#..|.g.p.g.|..T..=.~~~~~~~~T.#',
    '#.T|.......|.....=..~~~~~~...#',
    '#..fffffffff.....=...........#',
    '#...........T...p=........,..#',
    '#...T......=============.....#',
    '#.......T...,...........T....#',
    '#....,.........T....,........#',
    '#.T........................T.#',
    '##....T...T...T...T....T....##',
    '###........................###',
    '##############################',
  ],
};
