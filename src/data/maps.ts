import type { MapZoneId, PatchId, PropId, TileId, ZoneId } from '../types/ids';

/** A tile of a map, by column and row. */
export interface Tile {
  tx: number;
  ty: number;
}

export interface LegendEntry {
  tile: TileId;
  prop?: PropId;
  /** A solid tile can't be walked on. Props are solid over their whole footprint regardless. */
  solid?: boolean;
  /** Wildflowers growing on the tile, picked by walking onto it. */
  patch?: PatchId;
}

/**
 * A way out at the edge of a map: a run of open tiles she walks onto to go through to `to`. Coming
 * back, she steps in onto the tile inside the same place (decisions.md 90).
 */
export interface ExitSource {
  to: ZoneId;
  tx: number;
  ty: number;
  /** How many tiles it runs across or down the edge; one if not given. */
  w?: number;
  h?: number;
}

/** A building she walks up to and goes in by, into `to`. She comes back out onto the map's spawn. */
export interface DoorSource {
  prop: PropId;
  to: ZoneId;
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
  /** Its ways out at the edges, into the zones beside it. */
  exits?: readonly ExitSource[];
  /** Places in it with names, where her neighbours are to be found (`SPOTS`). */
  spots?: Readonly<Record<string, Tile>>;
  /** The buildings she goes into from here. */
  doors?: readonly DoorSource[];
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
  // The big willow: its trunk is two tiles across, and its fronds hang well past them.
  willow: { w: 2, h: 1 },
  fountain: { w: 2, h: 2 },
};

export const LEGEND: Record<string, LegendEntry> = {
  '#': { tile: 'hedge', solid: true },
  '.': { tile: 'grass' },
  ',': { tile: 'grass', patch: 'moonpetals' },
  ';': { tile: 'grass', patch: 'forgetMeBoos' },
  ':': { tile: 'grass', patch: 'ghostDaisies' },
  '=': { tile: 'path' },
  '~': { tile: 'water', solid: true },
  // The far bank of a pond, from before the ground drew its own banks: plain water now.
  '^': { tile: 'water', solid: true },
  '%': { tile: 'cliff', solid: true },
  '+': { tile: 'steps' },
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
  Y: { tile: 'grass', prop: 'willow' },
  O: { tile: 'water', prop: 'fountain' },
};

/**
 * Where things happen in the town, by name: where her neighbours stand, and where everyone gathers
 * round the well on her birthday. A schedule names a spot rather than a tile, so moving a building
 * moves one line here (decisions.md 93).
 */
export const TOWN_SPOTS = {
  // Her house and garden.
  herPath: { tx: 6, ty: 10 },
  byHerHouse: { tx: 7, ty: 8 },
  farmHostas: { tx: 12, ty: 5 },
  farmNorth: { tx: 15, ty: 2 },
  farmGate: { tx: 16, ty: 12 },
  lookout: { tx: 30, ty: 3 },
  // The square, and the shops round it.
  squareNorth: { tx: 21, ty: 19 },
  squareEast: { tx: 23, ty: 20 },
  squareWest: { tx: 16, ty: 23 },
  squareSouth: { tx: 18, ty: 25 },
  byTheWell: { tx: 21, ty: 24 },
  shopFront: { tx: 9, ty: 23 },
  shopSide: { tx: 11, ty: 21 },
  salonFront: { tx: 29, ty: 23 },
  bakeryFront: { tx: 29, ty: 30 },
  bakeryField: { tx: 37, ty: 26 },
  avenue: { tx: 21, ty: 30 },
  westMeadow: { tx: 6, ty: 27 },
  eastMeadow: { tx: 36, ty: 24 },
  // The graveyard garden.
  graveyardGate: { tx: 7, ty: 35 },
  graves: { tx: 8, ty: 40 },
  gravesWest: { tx: 3, ty: 41 },
  gravesEast: { tx: 11, ty: 43 },
  gravesSouth: { tx: 8, ty: 45 },
  // The park.
  pondWest: { tx: 19, ty: 42 },
  pondEast: { tx: 33, ty: 41 },
  willow: { tx: 20, ty: 37 },
  parkSouth: { tx: 26, ty: 47 },
  // All round the well, for her birthday party.
  wellNorthWest: { tx: 18, ty: 20 },
  wellNorthEast: { tx: 21, ty: 20 },
  wellWest: { tx: 18, ty: 22 },
  wellEast: { tx: 21, ty: 22 },
  wellSouthWest: { tx: 18, ty: 23 },
  wellSouthEast: { tx: 21, ty: 23 },
} as const satisfies Record<string, Tile>;

/**
 * The town, re-laid as the hub (phase F). Her house is top-left (H), with her mailbox (m) by the
 * door, beside Hosta La Vista Farm: two rows of garden beds (x) inside a path and a fence, hostas
 * (h) along the top, the rose bush (B) in the corner and the sign (F) at the gate. Up the cliff
 * (%) by the steps (+) is the lookout, where the way to the castle hill will be. The main road
 * runs east out to Whisperwood. The lantern-lit square with its well is in the middle, Cobweb
 * Corner (S) to the west, the Muse Hair Salon (M) to the east and Crumbs & Curios (b), Wrapunzel's
 * bakery with its museum at the back, below it. The graveyard garden is bottom-left, and the park
 * bottom-right, round the pond with its fountain (O) lit at night and the big willow (Y) on its
 * bank (personal_touches.md, "After phase E"). Each building stands in room for the bigger one
 * phase G draws. Wildflowers grow in patches (`,` moonpetals, `;` blue forget-me-boos by her
 * house, `:` ghost daisies in the graveyard), and rocks (R) sit about the edges.
 */
export const TOWN: MapSource = {
  legend: LEGEND,
  neighbours: true,
  spawn: { tx: 4, ty: 9 },
  spots: TOWN_SPOTS,
  // The main road runs east out of town into Whisperwood; her front door goes home.
  exits: [{ to: 'whisperwood', tx: 39, ty: 14, h: 2 }],
  doors: [{ prop: 'homeHouse', to: 'home' }],
  // Beside her door, at the top of the square, below the well, and by the willow.
  snackSpots: [
    { tx: 5, ty: 9 },
    { tx: 19, ty: 17 },
    { tx: 22, ty: 25 },
    { tx: 24, ty: 37 },
  ],
  // The west meadow, the corner of the square, by the south road, the meadow below the lookout,
  // below the bakery, and past the pond.
  popUpLots: [
    { tx: 3, ty: 25 },
    { tx: 15, ty: 19 },
    { tx: 4, ty: 30 },
    { tx: 31, ty: 9 },
    { tx: 35, ty: 31 },
    { tx: 36, ty: 42 },
  ],
  // West of the square, in the field by the bakery, the south meadow, and out east.
  peddlerSpots: [
    { tx: 10, ty: 17 },
    { tx: 27, ty: 31 },
    { tx: 9, ty: 31 },
    { tx: 37, ty: 17 },
  ],
  rows: [
    '########################################',
    '###...................%....L==L.....%###',
    '##...................T%..T..==.,....%###',
    '#......T.ffffffffffff.%.....==...T..%T.#',
    '#T.......|hhhhhhhhhB|.%.,.R.==..R...%..#',
    '#........|==========|.%.....==......%..#',
    '#..HHH...|=xxxxxxxx=|.%%%%%%++%%%%%%%..#',
    '#..HHH...|=xxxxxxxx=|.%%%%%%++%%%%%%%.T#',
    '#..HHH...|==========|.......==.........#',
    '#...=.m..|..........|.......==.....,...#',
    '#.;p=....|..p....p..|...T...==.......R.#',
    '#;..=.;..ffffF==fffff.......==...T.....#',
    '#.;.=.........==......:.....==.........#',
    '#..L=...p..L..==..p...L...p.==...L.....#',
    '#.======================================',
    '#.======================================',
    '#..................==..................#',
    '#...T........p.....==.....p............#',
    '#.............l==========l.............#',
    '#.....SSS.....============.....MMM.....#',
    '#.....SSS.p.T.============.....MMM.T...#',
    '#.:...SSS.....=====WW=====.....MMM.....#',
    '#......============WW============......#',
    '#.............============.............#',
    '#..T..........============.R...........#',
    '#..........,..============.........,...#',
    '#.........;...l==========l.....bbb.....#',
    '#T.......T...p.....==.....=....bbb.,...#',
    '#..................==.....=....bbb..,..#',
    '#.R........T.......==...T.=======....T.#',
    '#..................==..................#',
    '#................L.==.L................#',
    '#..................==..................#',
    '#T..=================================..#',
    '#...=================================..#',
    '#......==..........==..................#',
    '#......==........==================....#',
    '#.fffff==fffff...=.........,.....L=....#',
    '#.|..........|...=YY..~~~~~~~.....=.T..#',
    '#.|.g.g...g..|...=...~~~~~~~~~~...=....#',
    '#.|.........p|.T.=..~~~~~~~~~~~~..=....#',
    '#.|...::::...|...=..~~~~~OO~~~~~..=R...#',
    '#.|.g.::::.g.|...=..~~~~~OO~~~~~~.=....#',
    '#.|.....:....|...=..~~~~~~~~~~~~..=....#',
    '#.|p..g...g.p|.T.=...~~~~~~~~~~~;.=....#',
    '#.|..........|...=....~~~~~~~~~...=....#',
    '#.ffffffffffff...=......~~~~~.....=..T.#',
    '##............T..=L...,..........L=...##',
    '###..............==================..###',
    '########################################',
  ],
};

/**
 * Whisperwood, a first draft (phase E): old trees close together, a path winding in from the
 * town's east road and down to the frozen creek, on the far side of which is Lantern Shore. Phase I
 * gives it its mushrooms, its critters and its hidden clearing.
 */
export const WHISPERWOOD_SPOTS = {
  // Where Rufus picks wildflowers in the morning, and Agatha gathers herbs by moonlight.
  wildflowers: { tx: 6, ty: 5 },
  herbs: { tx: 12, ty: 5 },
} as const satisfies Record<string, Tile>;

export const WHISPERWOOD: MapSource = {
  legend: LEGEND,
  spots: WHISPERWOOD_SPOTS,
  spawn: { tx: 1, ty: 17 },
  exits: [
    { to: 'town', tx: 0, ty: 17, h: 2 },
    { to: 'lanternShore', tx: 18, ty: 35, w: 2 },
  ],
  rows: [
    '########################',
    '#.T.T..T.TTTT..TT.....T#',
    '#.,....T.TT.........TTT#',
    '#T.....T.T....T.......T#',
    '#TR.T............T:T..T#',
    '#.........T...T.T,.....#',
    '#...T......T.TTTT.TTTT.#',
    '#T..TT..T....TT.R.TT..T#',
    '#.T....R.T....T......T.#',
    '#.TT;T......TT.....T...#',
    '#.T..T...T....TT.T.....#',
    '#..T.T..T.T.T.TT.....T.#',
    '#......TT.....TT.TT....#',
    '#.TTTT.T.T...T:......T.#',
    '#..TT=======T..T..T....#',
    '#.T..=======T...T...TRT#',
    '#.RT.=.TT..=TT..T...T.T#',
    '======RT.TT=TT...:.R..T#',
    '======.....=..TTT..T...#',
    '#T...T.....=TTRT....T.T#',
    '#T.T:T.TRT.=====.......#',
    '#TT..T.....=====.....TT#',
    '#T.T......T....=T.TTR.T#',
    '#.........TTT..=TTR...:#',
    '#;.T.T..T....RT=T.T..T.#',
    '#...T..TT...T..=T..T...#',
    '#;T..T...,.,TR.=.......#',
    '#..T....,..T.;.=====.TT#',
    '#T..T...TTT.TTT=====...#',
    '#T;T...TRT.....TT.==.T.#',
    '#....TTT........T.==..T#',
    '#T..TT...T.T......==...#',
    '#T...T..TT...T...T==.TT#',
    '#.:.TT...T.T.TTT..==...#',
    '#T..T....TT;......==T.T#',
    '##################==####',
  ],
};

/**
 * Lantern Shore, a first draft (phase E): the lake, with a pier out into it, reached across the
 * frozen creek from Whisperwood. Phase I lights its lanterns and stocks it for fishing.
 */
export const LANTERN_SHORE: MapSource = {
  legend: LEGEND,
  spawn: { tx: 18, ty: 1 },
  exits: [{ to: 'whisperwood', tx: 18, ty: 0, w: 2 }],
  rows: [
    '##################==####',
    '#..........T.T..T.==..T#',
    '#.T..T............==..T#',
    '#......T.....T...T=..T.#',
    '#TT......R.T......=....#',
    '#T......TT........=.,..#',
    '#........TT.......=.T..#',
    '#.....T..T...R....=.,..#',
    '#..T.TT.,T........=....#',
    '#......T.........T=T...#',
    '#...=================..#',
    '#..;=.TT..T.==......=..#',
    '#...=L...L..==.TT..L=..#',
    '#...=T......==......=.T#',
    '#...=.^^^^^^==^^^^^.=T.#',
    '#T..=.~~~~~~==~~~~~.=..#',
    '#...=.~~~~~~==~~~~~.=T.#',
    '#...=.~~~~~~==~~~~~.=..#',
    '#R.T=.~~~~~~==~~~~~.=..#',
    '#...=.~~~~~~==~~~~~.=T.#',
    '#..R=.~~~~~~==~~~~~.=..#',
    '#,T.=.~~~~~~~~~~~~~.=..#',
    '#..T=.~~~~~~~~~~~~~.=R.#',
    '#...=.~~~~~~~~~~~~~.=..#',
    '#.T.=..~~~~~~~~~~~..=..#',
    '#...=..~~~~~~~~~~~..=.T#',
    '#...=...............=,.#',
    '#T..=T.R............=..#',
    '#...=.........TT...T=TT#',
    '#...=================..#',
    '#.....T.TT.....T..T....#',
    '#;................T.T..#',
    '#....:.....T......T..TT#',
    '#..T.:..........;......#',
    '#............:.........#',
    '########################',
  ],
};

/** Every place's named spots, so a schedule can only name a spot in the place it's in. */
export const SPOTS = {
  town: TOWN_SPOTS,
  whisperwood: WHISPERWOOD_SPOTS,
  lanternShore: {},
} as const satisfies Record<MapZoneId, Readonly<Record<string, Tile>>>;

/** The names of the spots in a place. */
export type SpotName<Z extends MapZoneId> = keyof (typeof SPOTS)[Z] & string;

/** Where a named spot is. */
export function spotOf<Z extends MapZoneId>(zone: Z, name: SpotName<Z>): Tile {
  return spotIn(zone, name);
}

/** `spotOf` for a name already checked against its place, as a `Stop`'s is by its type. */
export function spotIn(zone: MapZoneId, name: string): Tile {
  const spot = (SPOTS[zone] as Readonly<Record<string, Tile>>)[name];
  if (!spot) throw new Error(`no spot '${name}' in ${zone}`);
  return spot;
}
