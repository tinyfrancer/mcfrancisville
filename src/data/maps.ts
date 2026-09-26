import type { PatchId, PropId, TileId } from '../types/ids';

export interface LegendEntry {
  tile: TileId;
  prop?: PropId;
  /** A solid tile can't be walked on. Props are solid over their whole footprint regardless. */
  solid?: boolean;
  /** Wildflowers growing on the tile, picked by walking onto it. */
  patch?: PatchId;
}

export interface MapSource {
  rows: readonly string[];
  legend: Readonly<Record<string, LegendEntry>>;
  /** Where the player stands on arrival: the tile in front of her door. */
  spawn: { tx: number; ty: number };
  /** Where the night's snack may turn up, one of them each night. */
  snackSpots?: readonly { tx: number; ty: number }[];
}

/** How many tiles a prop stands on. A multi-tile prop is written as a block of its letter. */
export const PROP_FOOTPRINT: Record<PropId, { w: number; h: number }> = {
  tree: { w: 1, h: 1 },
  rock: { w: 1, h: 1 },
  pumpkin: { w: 1, h: 1 },
  lantern: { w: 1, h: 1 },
  gravestone: { w: 1, h: 1 },
  fence: { w: 1, h: 1 },
  fencePost: { w: 1, h: 1 },
  roseBush: { w: 1, h: 1 },
  hosta: { w: 1, h: 1 },
  farmSign: { w: 1, h: 1 },
  well: { w: 2, h: 2 },
  homeHouse: { w: 3, h: 3 },
  shopHouse: { w: 3, h: 3 },
  salonHouse: { w: 3, h: 3 },
};

const LEGEND: Record<string, LegendEntry> = {
  '#': { tile: 'hedge', solid: true },
  '.': { tile: 'grass' },
  ',': { tile: 'grass', patch: 'moonpetals' },
  ';': { tile: 'grass', patch: 'forgetMeBoos' },
  ':': { tile: 'grass', patch: 'ghostDaisies' },
  '=': { tile: 'path' },
  '~': { tile: 'water', solid: true },
  '^': { tile: 'waterEdge', solid: true },
  T: { tile: 'grass', prop: 'tree' },
  R: { tile: 'grass', prop: 'rock' },
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
  x: { tile: 'bed', solid: true },
  B: { tile: 'grass', prop: 'roseBush' },
  h: { tile: 'grass', prop: 'hosta' },
  F: { tile: 'grass', prop: 'farmSign' },
};

/**
 * The town, a first draft (phase 1). Her house is top-left, beside Hosta La Vista Farm: two rows of
 * garden beds (x) with a path all round them, hostas (h) along the top fence, the rose bush (B) in
 * the corner and the sign (F) at the gate. The lantern-lit square with its well is in the middle,
 * the shop (S) and the Muse Hair Salon (M) either side of it, the graveyard garden bottom-left and
 * the pond bottom-right. Wildflowers grow in patches (`,` moonpetals, `;` blue forget-me-boos by
 * her house, `:` ghost daisies in the graveyard), and rocks (R) sit about the edges.
 */
export const TOWN: MapSource = {
  legend: LEGEND,
  spawn: { tx: 4, ty: 6 },
  // Beside her door, at the top of the square, by the well, and down by the pond.
  snackSpots: [
    { tx: 5, ty: 6 },
    { tx: 15, ty: 11 },
    { tx: 12, ty: 21 },
    { tx: 18, ty: 40 },
  ],
  rows: [
    '##############################',
    '###........................###',
    '##.....ffffffffffff..T..T...##',
    '#.THHH.|hhhhhhhhhB|......T.R.#',
    '#..HHH;|..........|..,,......#',
    '#.THHH;|.xxxxxxxx.|...,..,,..#',
    '#...=..|.xxxxxxxx.|..T....;;.#',
    '#...=..|..........|.......T..#',
    '#.p.=.pffffF..fffff..........#',
    '#.==========================.#',
    '#..L........Lp==pL........L..#',
    '#.R...........==.............#',
    '#.:..SSS......==......MMM....#',
    '#.:..SSS......==......MMM..,.#',
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
    '#......,,...R.==.....;.......#',
    '#.........T...==...T..;......#',
    '#.T.........p.==p..........T.#',
    '#....====================....#',
    '#...p..=..p......=.p....p....#',
    '#......=.....T...=.........R.#',
    '#..ffff=ffff.....=.^^^^^^^^..#',
    '#.T|.......|.,...=.~~~~~~~~T.#',
    '#..|.g.g.g.|..,..=.~~~~~~~~..#',
    '#..|p.:::..|.....=.~~~~~~~~..#',
    '#..|..:::.p|.....=.~~~~~~~~..#',
    '#..|.g.p.g.|..T..=.~~~~~~~~T.#',
    '#.T|.......|.....=..~~~~~~...#',
    '#..fffffffff.....=...........#',
    '#...........T...p=........,..#',
    '#...T......=============.....#',
    '#.....R.T...,...........T....#',
    '#....,.........T....,.R......#',
    '#.T........................T.#',
    '##....T...T...T...T....T....##',
    '###........................###',
    '##############################',
  ],
};
