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
  /**
   * Where the pop-up shop may stand, by the top-left of its three-by-two footprint. Each is open
   * ground, and its door opens onto the tile below the middle of it.
   */
  popUpLots?: readonly { tx: number; ty: number }[];
  /**
   * Where the Moon Pie Man may set up his cart, by the top-left of its two-by-two footprint: open
   * ground, clear of every pop-up lot.
   */
  peddlerSpots?: readonly { tx: number; ty: number }[];
  /** Whether her neighbours live here; their schedules (`data/villagers.ts`) are in its tiles. */
  neighbours?: boolean;
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
  // Never written in a map: it stands on one of the map's `popUpLots` on the days it's in town.
  popUpShop: { w: 3, h: 2 },
  // Never written in a map either: it stands in the corner of her room (`data/home.ts`).
  storageChest: { w: 1, h: 1 },
  mailbox: { w: 1, h: 1 },
  bakery: { w: 3, h: 3 },
  // Never written in a map: it stands on one of the map's `peddlerSpots` on the days he's in town.
  moonPieCart: { w: 2, h: 2 },
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
  m: { tile: 'grass', prop: 'mailbox' },
  b: { tile: 'grass', prop: 'bakery' },
};

/**
 * The town, a first draft (phase 1). Her house is top-left, beside Hosta La Vista Farm: two rows of
 * garden beds (x) with a path all round them, hostas (h) along the top fence, the rose bush (B) in
 * the corner and the sign (F) at the gate. The lantern-lit square with its well is in the middle,
 * the shop (S) and the Muse Hair Salon (M) either side of it, the graveyard garden bottom-left and
 * the pond bottom-right. Her mailbox (m) stands by her door, and Crumbs & Curios (b), Wrapunzel's
 * bakery with its museum at the back, is east of the square's southern field. Wildflowers grow in patches (`,` moonpetals, `;` blue forget-me-boos by
 * her house, `:` ghost daisies in the graveyard), and rocks (R) sit about the edges.
 */
export const TOWN: MapSource = {
  legend: LEGEND,
  neighbours: true,
  spawn: { tx: 4, ty: 6 },
  // Beside her door, at the top of the square, by the well, and down by the pond.
  snackSpots: [
    { tx: 5, ty: 6 },
    { tx: 15, ty: 11 },
    { tx: 12, ty: 21 },
    { tx: 18, ty: 40 },
  ],
  // An empty lot in the west meadow, beside the well, among the graves, improbably at the edge of
  // the pond, in the meadow by the farm, and in the field below the square.
  popUpLots: [
    { tx: 4, ty: 26 },
    { tx: 17, ty: 20 },
    { tx: 8, ty: 34 },
    { tx: 20, ty: 39 },
    { tx: 22, ty: 7 },
    { tx: 14, ty: 30 },
  ],
  // West of the square, in the field by the bakery, down in the south meadow, and by the far hedge.
  peddlerSpots: [
    { tx: 10, ty: 11 },
    { tx: 17, ty: 25 },
    { tx: 9, ty: 41 },
    { tx: 25, ty: 43 },
  ],
  rows: [
    '##############################',
    '###........................###',
    '##.....ffffffffffff..T..T...##',
    '#.THHH.|hhhhhhhhhB|......T.R.#',
    '#..HHH;|..........|..,,......#',
    '#.THHH;|.xxxxxxxx.|...,..,,..#',
    '#...=.m|.xxxxxxxx.|..T....;;.#',
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
    '#..T..........==........bbb..#',
    '#......,,...R.==.....;..bbb..#',
    '#.........T...==...T..;.bbb..#',
    '#.T.........p.==p..........T.#',
    '#....====================....#',
    '#...p..=..p......=.p....p....#',
    '#......=.....T...=.........R.#',
    '#..ffff=ffff.....=.^^^^^^^^..#',
    '#.T|.g.....|.,...=.~~~~~~~~T.#',
    '#..|.......|..,..=.~~~~~~~~..#',
    '#..|p:::...|.....=.~~~~~~~~..#',
    '#..|.:::..p|.....=.~~~~~~~~..#',
    '#..|.g.p.g.|..T..=.~~~~~~~~T.#',
    '#.T|...g...|.....=..~~~~~~...#',
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
