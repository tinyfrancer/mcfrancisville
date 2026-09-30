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
  /**
   * An iron gate hangs across it between two posts, shut while the place beyond is and open once
   * it opens (the castle hill's, phase I).
   */
  gate?: true;
}

/**
 * A signpost (`s`) and the place it points to, one of the ways out of its map (0.2's C1): the
 * place's word is on its board, pointing the way, and walking up to it reads its line
 * (`data/signposts.ts`).
 */
export interface SignSource {
  tx: number;
  ty: number;
  to: MapZoneId;
}

/**
 * A building she walks up to and goes in by, into `to`. She comes back out onto the tile in front
 * of its door (`doorStep`).
 */
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
  /**
   * Where a newcomer's house will stand (phase T), by the top-left of its footprint: open ground in
   * the rows until they move in. Whose it is comes from the building's inside (`owner` in
   * `data/interiors.ts`), and its door is in `doors` like any other building's.
   */
  lots?: readonly { prop: PropId; tx: number; ty: number }[];
  /** Its ways out at the edges, into the zones beside it. */
  exits?: readonly ExitSource[];
  /** Its signposts, each by the way to a place and naming it. */
  signs?: readonly SignSource[];
  /** Places in it with names, where her neighbours are to be found (`SPOTS`). */
  spots?: Readonly<Record<string, Tile>>;
  /** The buildings she goes into from here. */
  doors?: readonly DoorSource[];
  /**
   * How many monarch butterflies flutter about it by day, round its flowers and its buildings:
   * something to see, not to catch (the castle hill's, phase I).
   */
  butterflies?: number;
}

/**
 * How many tiles a prop stands on. A multi-tile prop is written as a block of its letter. A
 * building's `door` is the column of its footprint its front door is over, counted from the left.
 */
export const PROP_FOOTPRINT: Record<PropId, { w: number; h: number; door?: number }> = {
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
  homeHouse: { w: 5, h: 4, door: 2 },
  shopHouse: { w: 5, h: 4, door: 2 },
  salonHouse: { w: 5, h: 4, door: 2 },
  // Never written in a map: it stands on one of the map's `popUpLots` on the days it's in town.
  popUpShop: { w: 3, h: 2, door: 1 },
  // Never written in a map either: it stands in the corner of her room (`data/home.ts`).
  storageChest: { w: 1, h: 1 },
  mailbox: { w: 1, h: 1 },
  bakery: { w: 6, h: 4, door: 2 },
  // Never written in a map: it stands on one of the map's `peddlerSpots` on the days he's in town.
  moonPieCart: { w: 2, h: 2 },
  // The big willow: its trunk is two tiles across, and its fronds hang well past them.
  willow: { w: 2, h: 1 },
  fountain: { w: 2, h: 2 },
  // Skelly stands on his two big feet; the rest of him towers over the yard.
  skelly: { w: 2, h: 1 },
  pottedPlant: { w: 1, h: 1 },
  // Her neighbours' houses (phase G), each after its owner.
  maudeHouse: { w: 4, h: 3, door: 2 },
  rufusHouse: { w: 5, h: 3, door: 2 },
  agathaHouse: { w: 4, h: 3, door: 1 },
  bartyHouse: { w: 4, h: 3, door: 1 },
  codyHouse: { w: 5, h: 4, door: 2 },
  // The places beyond the town (phase I).
  toadstools: { w: 1, h: 1 },
  oldTree: { w: 2, h: 2 },
  floatLantern: { w: 1, h: 1 },
  reeds: { w: 1, h: 1 },
  rowboat: { w: 2, h: 1 },
  mound: { w: 1, h: 1 },
  gatePost: { w: 1, h: 1 },
  castle: { w: 9, h: 5, door: 4 },
  weddingArch: { w: 2, h: 1 },
  // Never written in a map: it hangs across a way out with a `gate`, one tile in, while the place
  // beyond is shut, and as wide as the way.
  gate: { w: 2, h: 1 },
  // Clutter (phase L): a bench and a fallen log are two tiles long.
  bush: { w: 1, h: 1 },
  stump: { w: 1, h: 1 },
  log: { w: 2, h: 1 },
  bench: { w: 2, h: 1 },
  signpost: { w: 1, h: 1 },
  // The noticeboard by the square (phase N), where her neighbours pin their requests.
  noticeboard: { w: 2, h: 1 },
  barrel: { w: 1, h: 1 },
  hayBale: { w: 1, h: 1 },
  scarecrow: { w: 1, h: 1 },
  // Passive Candy (phase O): the candy tree in her front yard, the honesty stall at the farm gate.
  candyTree: { w: 1, h: 1 },
  honestyStall: { w: 2, h: 1 },
  // Newcomers' houses (phase T), never written in a map: each stands on its lot (`lots`) once its
  // owner moves in. Until then a sign stands on the lot, at its door, and on moving day their
  // boxes are stacked beside it.
  ollieHouse: { w: 4, h: 3, door: 1 },
  nessaHouse: { w: 4, h: 3, door: 1 },
  gourdonHouse: { w: 5, h: 3, door: 2 },
  hazelHouse: { w: 4, h: 3, door: 1 },
  lotSign: { w: 1, h: 1 },
  soldSign: { w: 1, h: 1 },
  movingBoxes: { w: 1, h: 1 },
  // What stands in the square while a holiday's decorations are up (phase U), never written in a
  // map: `DECOR` in `data/holidays.ts` says where.
  spookyTree: { w: 1, h: 1 },
  heartArch: { w: 2, h: 1 },
  potOfGold: { w: 1, h: 1 },
  eggTree: { w: 1, h: 1 },
  flagPole: { w: 1, h: 1 },
  pumpkinTower: { w: 1, h: 1 },
  harvestTable: { w: 3, h: 1 },
  glitterBall: { w: 1, h: 1 },
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
  k: { tile: 'grass', prop: 'skelly' },
  u: { tile: 'grass', prop: 'pottedPlant' },
  Q: { tile: 'grass', prop: 'maudeHouse' },
  U: { tile: 'grass', prop: 'rufusHouse' },
  A: { tile: 'grass', prop: 'agathaHouse' },
  Z: { tile: 'grass', prop: 'bartyHouse' },
  C: { tile: 'grass', prop: 'codyHouse' },
  // The places beyond the town (phase I). The frozen creek is walked on, and gone along with
  // skates; the pier stands in the lake.
  '-': { tile: 'ice' },
  '"': { tile: 'boards' },
  t: { tile: 'grass', prop: 'toadstools' },
  G: { tile: 'grass', prop: 'oldTree' },
  n: { tile: 'water', prop: 'floatLantern' },
  r: { tile: 'water', prop: 'reeds' },
  w: { tile: 'water', prop: 'rowboat' },
  X: { tile: 'grass', prop: 'mound' },
  P: { tile: 'grass', prop: 'gatePost' },
  K: { tile: 'grass', prop: 'castle' },
  a: { tile: 'grass', prop: 'weddingArch' },
  e: { tile: 'grass', patch: 'milkweed' },
  // Clutter (phase L).
  v: { tile: 'grass', prop: 'bush' },
  q: { tile: 'grass', prop: 'stump' },
  o: { tile: 'grass', prop: 'log' },
  j: { tile: 'grass', prop: 'bench' },
  s: { tile: 'grass', prop: 'signpost' },
  d: { tile: 'grass', prop: 'barrel' },
  y: { tile: 'grass', prop: 'hayBale' },
  c: { tile: 'grass', prop: 'scarecrow' },
  N: { tile: 'grass', prop: 'noticeboard' },
  J: { tile: 'grass', prop: 'candyTree' },
  E: { tile: 'grass', prop: 'honestyStall' },
};

/**
 * Where things happen in the town, by name: where her neighbours stand, and where everyone gathers
 * round the well on her birthday. A schedule names a spot rather than a tile, so moving a building
 * moves one line here (decisions.md 93).
 */
export const TOWN_SPOTS = {
  // Her house and garden.
  herPath: { tx: 6, ty: 10 },
  byHerHouse: { tx: 7, ty: 10 },
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
  westMeadow: { tx: 7, ty: 28 },
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
  // Where the newcomers are to be found (phase T).
  postRound: { tx: 5, ty: 12 },
  byNoticeboard: { tx: 24, ty: 18 },
  southRoad: { tx: 20, ty: 35 },
  pondNorth: { tx: 29, ty: 37 },
  lookoutEast: { tx: 34, ty: 4 },
  eastRoad: { tx: 37, ty: 31 },
  pastTheBakery: { tx: 37, ty: 28 },
  squareCorner: { tx: 25, ty: 23 },
  // All round the well, for her birthday party.
  wellNorthWest: { tx: 18, ty: 20 },
  wellNorthEast: { tx: 21, ty: 20 },
  wellWest: { tx: 18, ty: 22 },
  wellEast: { tx: 21, ty: 22 },
  wellSouthWest: { tx: 18, ty: 23 },
  wellSouthEast: { tx: 21, ty: 23 },
  wellBackLeft: { tx: 19, ty: 20 },
  wellBackRight: { tx: 20, ty: 20 },
  wellFrontLeft: { tx: 19, ty: 23 },
  wellFrontRight: { tx: 20, ty: 23 },
} as const satisfies Record<string, Tile>;

/**
 * The town, re-laid as the hub (phase F), with its buildings drawn bigger in phase G. Her house is
 * top-left (H), with her potted plants (u) either side of the path to her door, her mailbox (m)
 * and Skelly (k) in the front yard, beside Hosta La Vista Farm: two rows of garden beds (x) inside
 * a path and a fence, hostas (h) along the top, the rose bush (B) in the corner and the sign (F)
 * at the gate, with the candy tree (J) in her front yard and the honesty stall (E) outside the
 * gate. Up the cliff (%) by the steps (+) is the lookout, where Maude's library (Q) stands, and
 * the gate between two posts (P) up to the castle hill. Below the cliff, Barty's cottage (Z) and
 * Cody's manor (C) face the main road, which runs east out to Whisperwood. The lantern-lit square with its
 * well is in the middle, Cobweb Corner (S) to the west, the Muse Hair Salon (M) to the east and
 * Crumbs & Curios (b), Wrapunzel's bakery with her museum beside it, below that. Rufus's cottage
 * (U) and Agatha's (A) are in the west meadow. The graveyard garden is bottom-left, and the park
 * bottom-right, round the pond with its fountain (O) lit at night and the big willow (Y) on its
 * bank (personal_touches.md, "After phase E"). Wildflowers grow in patches (`,` moonpetals, `;`
 * blue forget-me-boos by her house, `:` ghost daisies in the graveyard), and rocks (R) sit about
 * the edges.
 */
export const TOWN: MapSource = {
  legend: LEGEND,
  neighbours: true,
  spawn: { tx: 4, ty: 9 },
  spots: TOWN_SPOTS,
  // The main road runs east out of town into Whisperwood; every building's door goes in.
  exits: [
    { to: 'whisperwood', tx: 39, ty: 14, h: 2 },
    { to: 'castleHill', tx: 28, ty: 0, w: 2, gate: true },
  ],
  signs: [
    { tx: 38, ty: 13, to: 'whisperwood' },
    { tx: 30, ty: 2, to: 'castleHill' },
  ],
  doors: [
    { prop: 'homeHouse', to: 'home' },
    { prop: 'shopHouse', to: 'cobwebCorner' },
    { prop: 'salonHouse', to: 'muse' },
    { prop: 'bakery', to: 'crumbs' },
    { prop: 'maudeHouse', to: 'library' },
    { prop: 'rufusHouse', to: 'rufusCabin' },
    { prop: 'agathaHouse', to: 'agathaCottage' },
    { prop: 'bartyHouse', to: 'bartyCottage' },
    { prop: 'codyHouse', to: 'codyManor' },
    { prop: 'ollieHouse', to: 'ollieCottage' },
    { prop: 'gourdonHouse', to: 'gourdonPumpkin' },
  ],
  // Ollie's, below Agatha's in the west meadow, and Gourdon's pumpkin past the bakery.
  lots: [
    { prop: 'ollieHouse', tx: 13, ty: 30 },
    { prop: 'gourdonHouse', tx: 31, ty: 30 },
  ],
  // Beside her door, at the top of the square, below the well, and by the willow.
  snackSpots: [
    { tx: 2, ty: 9 },
    { tx: 19, ty: 17 },
    { tx: 22, ty: 25 },
    { tx: 24, ty: 37 },
  ],
  // The west meadow, the corner of the square, by the south road, the meadow below the lookout,
  // along the south road, and past the pond.
  popUpLots: [
    { tx: 16, ty: 28 },
    { tx: 15, ty: 19 },
    { tx: 5, ty: 30 },
    { tx: 35, ty: 35 },
    { tx: 23, ty: 31 },
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
    '############################==##########',
    '###...................%####P==P.....%###',
    '##.T.................T%QQQQ.==s,....%###',
    '#........ffffffffffff.%QQQQ.==...T..%T.#',
    '#........|hhhhhhhhhB|.%QQQQ.==..R...%..#',
    '#.HHHHH..|==========|.%..=====......%..#',
    '#.HHHHH..|=xxxxxxxx=|.%%%%%%++%%%%%%%..#',
    '#.HHHHH..|=xxxxxxxx=|.%%%%%%++%%%%%%%.T#',
    '#.HHHHH..|==========|.......==.CCCCC...#',
    '#..u=umkk|.....c....|.ZZZZ..==.CCCCC...#',
    '#.;p=....|..p....p.y|.ZZZZ..==.CCCCC.R.#',
    '#;..=.;J.ffffF==fffff.ZZZZ..==.CCCCC...#',
    '#.;.=.......EE==......:=....==...=.....#',
    '#..L=...p..L..==..p...L=..p.==...=.L..s#',
    '#.======================================',
    '#.======================================',
    '#..................==..................#',
    '#vT..........p.....==..NN.pjj..........#',
    '#....SSSSS....l==========l....MMMMM....#',
    '#...dSSSSS....============....MMMMM....#',
    '#...dSSSSS..T.============....MMMMM...T#',
    '#.:..SSSSS....=====WW=====....MMMMM....#',
    '#......============WW============......#',
    '#.............============............v#',
    '#............T============.R...........#',
    '#.UUUUU....,..============....bbbbbb.d.#',
    '#.UUUUU...;...l==========l....bbbbbb...#',
    '#.UUUUU..AAAAp.....==.....=..dbbbbbb.,.#',
    '#...=....AAAA......==.....=...bbbbbb,..#',
    '#.R.=....AAAA......==...T.=======....T.#',
    '#...=.....=........==..................#',
    '#T..=.....=......L.==.L...............v#',
    '#...=.....=........==..................#',
    '#T..=================================..#',
    '#.q.=================================..#',
    '#......==.v.v......==..................#',
    '#......==........==================....#',
    '#.fffff==fffff...=.........,.....L=....#',
    '#.|..........|...=YY..~~~~~~~.....=.T..#',
    '#.|.g.g...g..|.q.=...~~~~~~~~~~...=....#',
    '#.|.........p|.T.=..~~~~~~~~~~~~..=....#',
    '#.|...::::...|...=..~~~~~OO~~~~~..=R.v.#',
    '#.|.g.::::.g.|...=..~~~~~OO~~~~~..=....#',
    '#.|.....:....|...=..~~~~~~~~~~~~..=....#',
    '#.|p..g...g.p|.T.=...~~~~~~~~~~~;.=....#',
    '#.|..........|...=....~~~~~~~~~...=....#',
    '#.ffffffffffff...=..jj..~~~~~jj...=..T.#',
    '##....v.......T..=L...,..........L=...##',
    '###..............==================..###',
    '########################################',
  ],
};

/**
 * Whisperwood (phase I): old trees close together, some very old indeed, with sleepy faces (G);
 * toadstools (t) in clumps; a path winding in from the town's east road, north to the herb glade
 * and south to the frozen creek (-), which she skates down to Lantern Shore. From the herb glade a
 * path lined with toadstools leads east and up to a gap in the thicket at the top, two tiles wide
 * and marked by a lantern (0.2's C1): the hidden way to the clearing, which isn't on her map until
 * she finds it.
 */
export const WHISPERWOOD_SPOTS = {
  // Where Rufus picks wildflowers in the morning, and Agatha gathers herbs by moonlight.
  wildflowers: { tx: 5, ty: 6 },
  herbs: { tx: 12, ty: 7 },
  creekside: { tx: 15, ty: 28 },
  starGlade: { tx: 9, ty: 6 },
} as const satisfies Record<string, Tile>;

export const WHISPERWOOD: MapSource = {
  legend: LEGEND,
  spots: WHISPERWOOD_SPOTS,
  spawn: { tx: 1, ty: 17 },
  exits: [
    { to: 'town', tx: 0, ty: 17, h: 2 },
    { to: 'lanternShore', tx: 17, ty: 37, w: 2 },
    { to: 'hiddenClearing', tx: 21, ty: 0, w: 2 },
  ],
  // By the way in from town, and at the crossroads: up to the clearing, and down to the creek.
  signs: [
    { tx: 2, ty: 16, to: 'town' },
    { tx: 12, ty: 16, to: 'hiddenClearing' },
    { tx: 12, ty: 19, to: 'lanternShore' },
  ],
  doors: [{ prop: 'hazelHouse', to: 'hazelObservatory' }],
  // Hazel's observatory, in the glade at the top of the woods where the trees open to the sky.
  lots: [{ prop: 'hazelHouse', tx: 5, ty: 2 }],
  rows: [
    '#####################==###',
    '####################L==###',
    '#TT.........T..TT..##==#T#',
    '#TGG......T..T.TTT...==.T#',
    '#.GG.....R...........==tT#',
    '#.T.....:..============..#',
    '#.T....,...=..t.t.t.t....#',
    '#...T......=.......v.....#',
    '#TTT.......=............T#',
    '#T..T.t....=.....TTT..TtT#',
    '#T......T..=....TTT.TTTTT#',
    '#TTGGTT..T.=........TTTT.#',
    '#..GGTTT.T.=..GG,..RT..T.#',
    '#T....TtT..=..GG......TT.#',
    '#.......TT.=...t....TTGG.#',
    '#....TTTTT.=..........GG.#',
    '#.s...q....=s.T.....T.T..#',
    '============.....TTT..T..#',
    '============....TT.......#',
    '#.........==sTTTT.TTT.T..#',
    '#..oo.....==......T.TT.T.#',
    '#..;;.....==..T...t.TT...#',
    '#.....v,..==.............#',
    '#....GG...==.T...TT.TTT..#',
    '#....GG...==.T.........v.#',
    '#T.t......==...T.--------#',
    '#.T...T...==.TTT.--------#',
    '#.T..TT...==.T...--......#',
    '#.TTT.TT..==.....--..XTT.#',
    '#..TT..T..=======--...T..#',
    '#..T..TT..=======--.TTT.T#',
    '#T..q............--.TGG.T#',
    '#T.;.....TTT..T..--..GG..#',
    '#...........GG...--ooTT.T#',
    '#T..R...t.TTGG...--.TTT.T#',
    '#........T...T.T.--.TTT..#',
    '#T.TTTTTTTT......--..TT.T#',
    '#################--#######',
  ],
};

/**
 * Lantern Shore (phase I): the frozen creek comes down from Whisperwood into a still lake, with
 * lamps along the shore, reeds in the shallows (r), lanterns afloat on
 * lily pads that light up after dark (n), and a pier (") out into the middle with a rowboat (w)
 * tied beside it. A path runs along the south shore from its foot, and below is a meadow.
 */
export const LANTERN_SHORE_SPOTS = {
  pierEnd: { tx: 12, ty: 14 },
  shoreWest: { tx: 2, ty: 13 },
  meadow: { tx: 9, ty: 29 },
  shoreEast: { tx: 23, ty: 12 },
  lakeSouth: { tx: 17, ty: 23 },
  pierMiddle: { tx: 12, ty: 19 },
} as const satisfies Record<string, Tile>;

export const LANTERN_SHORE: MapSource = {
  legend: LEGEND,
  spots: LANTERN_SHORE_SPOTS,
  spawn: { tx: 14, ty: 6 },
  exits: [{ to: 'whisperwood', tx: 12, ty: 0, w: 2 }],
  signs: [{ tx: 14, ty: 2, to: 'whisperwood' }],
  doors: [{ prop: 'nessaHouse', to: 'nessaBoathouse' }],
  // Nessa's boathouse, on the east bank by the lamp.
  lots: [{ prop: 'nessaHouse', tx: 19, ty: 5 }],
  rows: [
    '############--############',
    '#T....TT.TT.--......T....#',
    '#.T..TT.....--s.......TTT#',
    '#.R.T.......--......T....#',
    '#.T..TT..T..--..TT..T.T..#',
    '#.......L...--...L.......#',
    '#.....jj....--...........#',
    '#...........--...........#',
    '#.......~~~~--~~r........#',
    '#..L..~~~~~~~~~~~~~......#',
    '#....~~~~~~~~~~~~n~~.....#',
    '#....~~~n~~~~~~~~~~~..L..#',
    '#...~r~~~~~~~~~~~~~~~....#',
    '#...~~~~~~~~""~~~~~~~..,.#',
    '#..~~~~~~~~~""~~~~~~~~...#',
    '#..~~~~~~~n~""ww~~~~~~...#',
    '#;.~~~~~~~~~""~~~~~~r~...#',
    '#...~~~~~~~~""~~~~~~~....#',
    '#...~~~n~~~~""~~~~~~~....#',
    '#....~~~~~~~""~~~~n~.....#',
    '#....~~~~~~~""~~~~~r.....#',
    '#...L.r~~~~~""~~~~~......#',
    '#.......~~~~""~~~....L...#',
    '#...........""....jj.....#',
    '#....================....#',
    '#...........==...........#',
    '#.v.........==...........#',
    '#...........==.........TT#',
    '#.TT.================...T#',
    '#T.T..oo.....q.......v...#',
    '#..,.......TT...T..T..T..#',
    '#...,TT..T..T.,..T.;T..TT#',
    '#.TT..TR....T....TT.;..TT#',
    '#....TT.T.:...TT.........#',
    '#..T.TT.T.T......T.TT.R..#',
    '#..T....T..T....T..TTT...#',
    '#.TTTTT..T.TT....TTT...TT#',
    '##########################',
  ],
};

/**
 * The hidden clearing (phase I), up the hidden way from Whisperwood: a ring of toadstools in the
 * moonlight round a mound where something is buried (X), a little pool, and wildflowers, with a
 * worn path down to the way back.
 */
export const HIDDEN_CLEARING: MapSource = {
  legend: LEGEND,
  spawn: { tx: 9, ty: 21 },
  exits: [{ to: 'whisperwood', tx: 9, ty: 23, w: 2 }],
  signs: [{ tx: 8, ty: 22, to: 'whisperwood' }],
  rows: [
    '#########==#######',
    '#TTTTTTTT..TTTTTT#',
    '#TTTTTTTT.TTTTTTT#',
    '#TTGGTT....TTTTTT#',
    '#.TGG...v...~~~TT#',
    '#.T..,.....~~~~.T#',
    '#.T.,.......~~...#',
    '#.T............TT#',
    '#..........,...TT#',
    '#TT....t.t......T#',
    '#.....t...t......#',
    '#T......X......TT#',
    '#TT...t...t......#',
    '#T..;....t.....TT#',
    '#..q..oo.........#',
    '#TT.........:...T#',
    '#TT.,........:...#',
    '#T.............TT#',
    '#........==......#',
    '#TT..TT..==.T...T#',
    '#TT.T.T..==.TT.TT#',
    '#...T.TT.==LTT.TT#',
    '#TT.....s==..T...#',
    '#########==#######',
  ],
};

/**
 * The castle hill (phase I), up through the gate at the town's lookout (P, the posts): a meadow,
 * a cliff with steps up it, then the castle garden, beds of milkweed (e) for the monarchs and
 * rose bushes, hedged, with the wedding arch (a) in a nook, and Castle Mac-A-Boo (K) at the top,
 * whose doors go into its hall (phase U).
 */
export const CASTLE_HILL: MapSource = {
  legend: LEGEND,
  spawn: { tx: 13, ty: 9 },
  exits: [{ to: 'town', tx: 13, ty: 41, w: 2, gate: true }],
  signs: [{ tx: 15, ty: 31, to: 'town' }],
  // The castle's great doors (phase U), into the hall, locked till she has the heart key.
  doors: [{ prop: 'castle', to: 'castleHall' }],
  butterflies: 14,
  rows: [
    '############################',
    '#..........................#',
    '#.T.T..................T.T.#',
    '#.T.T.................TT.TT#',
    '#..T.....KKKKKKKKK.....T...#',
    '#.T.TT...KKKKKKKKK....TT.T.#',
    '#TT..T...KKKKKKKKK......T..#',
    '#..T.....KKKKKKKKK.....TTT.#',
    '#T...T...KKKKKKKKK.......T.#',
    '#..T.T.......==.......T..T.#',
    '#.T.........L==L.........TT#',
    '#TT..........==.....aa.....#',
    '#TT.BeeeeeeB.==.eee.=......#',
    '#.T..eeeeee..==.eee.=......#',
    '#....eeeeee..==.eee.=....T.#',
    '#T......jj...==.....=.....T#',
    '#...p==================p...#',
    '#T...........==..........T.#',
    '#T..BeeeeeeB.==.eeeeeeB....#',
    '#....eeeeee..==.eeeeee.....#',
    '#.T..eeeeee..==.eeeeee....T#',
    '#............==..jj........#',
    '#.T..######..==.######...TT#',
    '#.....v......==......v.....#',
    '#...........L==L...........#',
    '#............==..........T.#',
    '#.......p....==....p.....T.#',
    '#............==..........T.#',
    '#T.....T.....==........T...#',
    '#%%%%%%%%%%%%++%%%%%%%%%%%%#',
    '#%%%%%%%%%%%%++%%%%%%%%%%%%#',
    '#T..T........==s.....TT....#',
    '#..RTTTTTT...==...T....T.T.#',
    '#T.T..T.,...L==L..T..:....T#',
    '#...,...TT...==.....T....TT#',
    '#.....T......==...T..T,T..T#',
    '#..T.T..TTq..==...T.T.....T#',
    '#.T.TT;......==....TT......#',
    '#.......oo..L==L..TT.T..RT.#',
    '#.T...TT.....==...TT...T...#',
    '#.T.T...TT..P==P...T..T..T.#',
    '#############==#############',
  ],
};

/** Every place's named spots, so a schedule can only name a spot in the place it's in. */
export const SPOTS = {
  town: TOWN_SPOTS,
  whisperwood: WHISPERWOOD_SPOTS,
  lanternShore: LANTERN_SHORE_SPOTS,
  castleHill: {},
  hiddenClearing: {},
} as const satisfies Record<MapZoneId, Readonly<Record<string, Tile>>>;

/** The names of the spots in a place. */
export type SpotName<Z extends MapZoneId> = keyof (typeof SPOTS)[Z] & string;

/** The tile in front of a building's front door, where she stands to go in and comes back out. */
export function doorStep(prop: { id: PropId; tx: number; ty: number; h: number }): Tile {
  const door = PROP_FOOTPRINT[prop.id].door ?? 0;
  return { tx: prop.tx + door, ty: prop.ty + prop.h };
}

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
