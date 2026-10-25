import type { ConstellationId, FurnitureId, StarPiece } from '../types/ids';
import type { FurnitureRow } from './furniture';
import type { DecorId } from './holidays';
import type { ItemRow } from './items';

/*
 * The night sky (1.5's G4, decision 373): a constellation for each month, spooky-cute shapes she
 * traces through the telescope at the castle lookout on a clear night, and three that come out
 * while a holiday's decorations are up. Each traced one goes on her star chart (`Cabinet.stars`).
 */

/** Where a star sits, in the sky's own pixels: a box `SKY_BOX` wide and tall. */
export interface Star {
  x: number;
  y: number;
}

/** A shape's box in the sky, in pixels: every constellation's stars sit inside it. */
export const SKY_BOX = { w: 60, h: 40 } as const;

export interface ConstellationRow {
  /** "the Bat": as she'd say it in a sentence, the capital kept for the shape's own name. */
  name: string;
  /** The month it's up (1 is January), or the holiday whose decorations bring it out. */
  when: { month: number } | { holiday: DecorId };
  /** Two lines about it, for the chart. */
  about: string;
  /** Its stars in the order she traces them: each after the first joins one lit before it. */
  stars: readonly Star[];
  /** The lines between its stars, by their places in `stars`. */
  lines: readonly (readonly [number, number])[];
}

const s = (x: number, y: number): Star => ({ x, y });

/** Lines round a loop of stars in order: 0–1, 1–2… and back to the first. */
const loop = (n: number): [number, number][] =>
  Array.from({ length: n }, (_, i) => [i, (i + 1) % n] as [number, number]);

export const CONSTELLATIONS: Record<ConstellationId, ConstellationRow> = {
  snowflake: {
    name: 'the Snowflake',
    when: { month: 1 },
    about:
      'Six arms of frost, as if the sky had breathed on a window. It melts by February, every year, and every year it comes back.',
    stars: [s(30, 3), s(30, 20), s(30, 37), s(15, 11), s(45, 29), s(45, 11), s(15, 29)],
    lines: [
      [0, 1],
      [1, 2],
      [1, 3],
      [1, 4],
      [1, 5],
      [1, 6],
    ],
  },
  candle: {
    name: 'the Candle',
    when: { month: 2 },
    about:
      'A tall candle with its flame lit, for the longest, coldest nights. Agatha says it never once blew out.',
    stars: [s(30, 2), s(30, 10), s(23, 14), s(23, 37), s(37, 37), s(37, 14)],
    lines: [
      [0, 1],
      [1, 2],
      [2, 3],
      [3, 4],
      [4, 5],
      [5, 1],
    ],
  },
  toadstool: {
    name: 'the Toadstool',
    when: { month: 3 },
    about:
      'A round cap on a stout stem, come up in the sky after the spring rain, as they do in Whisperwood.',
    stars: [
      s(9, 21),
      s(17, 8),
      s(30, 3),
      s(43, 8),
      s(51, 21),
      s(36, 21),
      s(37, 37),
      s(23, 37),
      s(24, 21),
    ],
    lines: [
      [0, 1],
      [1, 2],
      [2, 3],
      [3, 4],
      [4, 5],
      [5, 6],
      [6, 7],
      [7, 8],
      [8, 0],
      [8, 5],
    ],
  },
  moth: {
    name: 'the Moth',
    when: { month: 4 },
    about:
      'A big soft moth, wings wide open, flying for the moon. On April nights the real ones follow it.',
    stars: [s(30, 7), s(9, 6), s(14, 30), s(30, 34), s(51, 6), s(46, 30), s(24, 1), s(36, 1)],
    lines: [
      [0, 1],
      [1, 2],
      [2, 3],
      [3, 0],
      [0, 4],
      [4, 5],
      [5, 3],
      [0, 6],
      [0, 7],
    ],
  },
  broom: {
    name: 'the Broom',
    when: { month: 5 },
    about:
      'A witch’s broom on its way somewhere, bristles first. Nobody knows where. Somewhere nice.',
    stars: [s(5, 3), s(20, 14), s(33, 24), s(36, 38), s(47, 35), s(52, 25)],
    lines: [
      [0, 1],
      [1, 2],
      [2, 3],
      [2, 4],
      [2, 5],
      [3, 4],
      [4, 5],
    ],
  },
  lantern: {
    name: 'the Lantern',
    when: { month: 6 },
    about: 'A lantern hung up high for the shortest nights, so nobody walks home in the dark.',
    stars: [s(30, 1), s(30, 9), s(20, 13), s(40, 13), s(40, 31), s(20, 31), s(30, 38)],
    lines: [
      [0, 1],
      [1, 2],
      [1, 3],
      [3, 4],
      [4, 5],
      [5, 2],
      [4, 6],
      [5, 6],
    ],
  },
  key: {
    name: 'the Key',
    when: { month: 7 },
    about:
      'An old iron key with a fancy bow. Hazel thinks it opens the moon. Agatha thinks it opens the castle. Rob Boo isn’t saying.',
    stars: [s(7, 14), s(15, 6), s(23, 14), s(15, 22), s(39, 14), s(53, 14), s(53, 23), s(45, 21)],
    lines: [
      [0, 1],
      [1, 2],
      [2, 3],
      [3, 0],
      [2, 4],
      [4, 5],
      [5, 6],
      [4, 7],
    ],
  },
  cat: {
    name: 'the Cat',
    when: { month: 8 },
    about:
      'A black cat sat up tall with its tail curled round. It turned up one warm August and simply stayed, as cats do.',
    stars: [s(17, 3), s(32, 3), s(34, 14), s(44, 29), s(56, 19), s(40, 38), s(15, 38), s(16, 14)],
    lines: [
      [0, 1],
      [1, 2],
      [2, 3],
      [3, 4],
      [3, 5],
      [5, 6],
      [6, 7],
      [7, 0],
    ],
  },
  cauldron: {
    name: 'the Cauldron',
    when: { month: 9 },
    about:
      'A big round pot with its spoon still in. Whatever is in it smells of apples and cinnamon, all September.',
    stars: [s(7, 12), s(30, 12), s(53, 12), s(50, 30), s(42, 38), s(18, 38), s(10, 30), s(41, 1)],
    lines: [
      [0, 1],
      [1, 2],
      [2, 3],
      [3, 4],
      [4, 5],
      [5, 6],
      [6, 0],
      [1, 7],
    ],
  },
  bat: {
    name: 'the Bat',
    when: { month: 10 },
    about:
      'A little bat with its wings spread over the castle, upside down to nobody but itself. October’s, of course.',
    stars: [
      s(30, 12),
      s(26, 5),
      s(34, 5),
      s(30, 25),
      s(3, 8),
      s(16, 25),
      s(57, 8),
      s(44, 25),
      s(30, 33),
    ],
    lines: [
      [0, 1],
      [0, 2],
      [0, 3],
      [0, 4],
      [4, 5],
      [5, 3],
      [0, 6],
      [6, 7],
      [7, 3],
      [3, 8],
    ],
  },
  pumpkin: {
    name: 'the Pumpkin',
    when: { month: 11 },
    about:
      'A fat round pumpkin with a curly stem, left up there after the harvest. Gourdon is very proud of it.',
    stars: [s(31, 2), s(30, 10), s(44, 12), s(52, 25), s(42, 37), s(18, 37), s(8, 25), s(16, 12)],
    lines: [
      [0, 1],
      [1, 2],
      [2, 3],
      [3, 4],
      [4, 5],
      [5, 6],
      [6, 7],
      [7, 1],
    ],
  },
  ghost: {
    name: 'the Ghost',
    when: { month: 12 },
    about:
      'A friendly ghost with a wavy hem, out for the winter. It visits a different chimney every night of December.',
    stars: [s(30, 3), s(42, 12), s(45, 36), s(37, 31), s(30, 37), s(23, 31), s(15, 36), s(18, 12)],
    lines: loop(8),
  },
  heart: {
    name: 'the Sweetheart',
    when: { holiday: 'valentines' },
    about:
      'A heart, out for the week of Valentine’s Day only. Cody says he put it there. He did not put it there.',
    stars: [s(30, 37), s(9, 16), s(18, 4), s(30, 11), s(42, 4), s(51, 16)],
    lines: loop(6),
  },
  egg: {
    name: 'the Egg',
    when: { holiday: 'easter' },
    about:
      'A painted egg, out the week of Easter. Nobody has ever found where it’s hidden in the daytime.',
    stars: [s(30, 2), s(40, 9), s(45, 24), s(30, 38), s(15, 24), s(20, 9)],
    lines: loop(6),
  },
  christmasStar: {
    name: 'the Christmas Star',
    when: { holiday: 'christmas' },
    about:
      'A five-pointed star, up while the tree is up in the square. Trace it in one go and make a wish.',
    stars: [s(30, 2), s(44, 38), s(7, 15), s(53, 15), s(16, 38)],
    lines: loop(5),
  },
};

export const CONSTELLATION_IDS = Object.keys(CONSTELLATIONS) as ConstellationId[];

/** The constellation up in each month, January first. */
export const MONTHLY: readonly ConstellationId[] = CONSTELLATION_IDS.filter(
  (id) => 'month' in CONSTELLATIONS[id].when,
).sort((a, b) => monthOf(a) - monthOf(b));

function monthOf(id: ConstellationId): number {
  const when = CONSTELLATIONS[id].when;
  return 'month' in when ? when.month : 0;
}

/** How many months back a month's constellation is still findable: this month's and two before. */
export const FINDABLE_MONTHS = 3;

/** The furniture pieces that look at the sky after dark, as the castle's telescope does. */
export const STARGAZERS: readonly FurnitureId[] = ['brassTelescope', 'telescope'];

/** The id of Hazel's letter the first time she traces one. */
export const FIRST_STARS = 'stars:first';

/** Hazel's letter the first time she traces one, with her star map in it. */
export const FIRST_STARS_LETTER = {
  from: 'hazel',
  text:
    '{name}!\n\nYou found one! Through the big telescope on the castle hill, all by yourself! I ' +
    'saw the lookout light up from my window and I knew. I have been keeping this for whoever ' +
    'found the first one: my very first star map, from when I was small. My handwriting is ' +
    'terrible. The stars are not.\n\nOne a month, and the last two months’ still up if ' +
    'you missed them. Look up!\n\nHazel',
} as const;

/** What the star chart's two shelves send her (1.5's G4), from Hazel. */
export const STAR_FURNITURE: Record<StarPiece, FurnitureRow> = {
  framedConstellation: {
    name: 'Framed Bat',
    description:
      'The Bat in gold stars on a midnight mount, in a gilt frame, for half the sky on your star chart.',
    layer: 'wall',
    size: { w: 1, h: 1 },
    says: 'The Bat in its frame. Its stars catch the candlelight and twinkle back.',
  },
  skyDome: {
    name: 'Sky under glass',
    description:
      'A little night sky under a glass dome, every star in it, for the whole sky on your star chart.',
    layer: 'floor',
    size: { w: 1, h: 1 },
    says: 'The whole sky, under glass. If you look very close, the Bat waves.',
  },
};

/** Hazel's star map, the first time she traces a constellation: hers to keep, never sold. */
export const STAR_ITEMS = {
  starMap: {
    name: "Hazel's star map",
    kind: 'keepsake',
    description:
      "Hazel's very first star map, drawn when she was small, in wobbly gold pen. Every star is in the right place.",
  },
} as const satisfies Record<'starMap', ItemRow>;

export const STAR_VALUES = { starMap: 0 } as const;
