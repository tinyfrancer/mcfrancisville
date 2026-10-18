import type { Glyph, GlyphId } from '../data/glyphs';
import { CALENDAR_MARKS, NEIGHBOUR_CAKE } from './calendarMarks';
import { CANDY_POP, PARCEL_POP } from './effects';
import { ITEM_ART, type ItemArt } from './items';
import { PALETTE as C } from './palette';
import { CLEAR, Sketch } from './sketch';
import type { SpriteSource } from './sprite';
import { svgOf, svgUrl } from './svg';
import { TOOL_ART } from './tools';
import { BAT_FLYING, BAT_PALETTE } from './sky';

/*
 * The HUD's own pictures (V1's L5, decision 295): a 16-pixel drawing for each mark the chrome
 * used to borrow from the phone's emoji, drawn as the calendar's marks are (decision 181), a few
 * keys of the palette outlined in ink, lit from the top left. On the bars' plum buttons the ink
 * edge is what keeps each one apart from the button.
 */

const INK = 'o';

/** Outlined in ink round everything but the keys that glow or float free. */
function mark(draw: (s: Sketch) => void, palette: Record<string, string>, loose = ''): ItemArt {
  const s = new Sketch(16, 16);
  draw(s);
  s.outline((key) => (loose.includes(key) || key === INK ? null : INK));
  return { source: s.toSource(), palette: { '.': null, [INK]: C.ink, ...palette } };
}

/** A grid typed out, its outline already in it. */
function typed(rows: readonly string[], palette: Record<string, string>): ItemArt {
  return { source: { rows }, palette: { '.': null, [INK]: C.ink, ...palette } };
}

/**
 * Paints `draw` only where nothing is yet, with an ink line wherever it meets what's there: a
 * shape tucked behind another, kept apart from it.
 */
function behind(s: Sketch, draw: (t: Sketch) => void): void {
  const t = new Sketch(s.width, s.height);
  draw(t);
  const changes: [number, number, string][] = [];
  for (let y = 0; y < s.height; y++) {
    for (let x = 0; x < s.width; x++) {
      const key = t.get(x, y)!;
      if (key === CLEAR || s.filled(x, y)) continue;
      const touches = [
        [1, 0],
        [-1, 0],
        [0, 1],
        [0, -1],
      ].some(([dx, dy]) => s.filled(x + dx!, y + dy!));
      changes.push([x, y, touches ? INK : key]);
    }
  }
  for (const [x, y, key] of changes) s.set(x, y, key);
}

/** A grid turned a quarter clockwise. */
function turned(source: SpriteSource): SpriteSource {
  const h = source.rows.length;
  const w = source.rows[0]!.length;
  return {
    rows: Array.from({ length: w }, (_, y) =>
      Array.from({ length: h }, (_, x) => source.rows[h - 1 - x]![y]).join(''),
    ),
  };
}

const HEART = [
  '..ooo...ooo..',
  '.orrro.orrro.',
  'orRRrrorrrrro',
  'orRrrrrrrrrro',
  'orrrrrrrrrrro',
  'orrrrrrrrrrso',
  '.orrrrrrrrso.',
  '..orrrrrrso..',
  '...orrrrso...',
  '....orrso....',
  '.....oso.....',
  '......o......',
];

const ARROW = [
  '.....oo.....',
  '....owwo....',
  '...owwwwo...',
  '..owwwwwwo..',
  '.owwwwwwwwo.',
  'ooooowwooooo',
  '....owwo....',
  '....owwo....',
  '....owwo....',
  '....owwo....',
  '....oooo....',
];
const NORTH: SpriteSource = { rows: ARROW };
const EAST = turned(NORTH);
const SOUTH = turned(EAST);
const WEST = turned(SOUTH);
const ARROW_PALETTE = { w: C.ghost };

const LITTLE_ARROW = [
  '..oo..',
  '.owwo.',
  'owwwwo',
  'oowwoo',
  '.owwo.',
  '.owwo.',
  '.owwo.',
  '.oooo.',
];

/** A bare footprint, toes and all. */
const FOOT = ['..f.f', '.f...', '.....', '.fff.', 'fffff', 'ffff.', '.fff.', '.ff..'];

const STAR = [
  '......o......',
  '.....oyo.....',
  '.....oyo.....',
  '....oYyyo....',
  'ooooyyyyyoooo',
  'oyyyyyyyyyyyo',
  '.oyyyyyyyyyo.',
  '..oyyyyyyyo..',
  '..oyyyyyyyo..',
  '.oyyyyoyyyyo.',
  '.oyyoo.ooyyo.',
  '.ooo.....ooo.',
];

/** A puff of cloud with its top at `top`, lit from above. */
function cloud(s: Sketch, top: number): void {
  s.ellipse(5, top + 4, 3, 3, 'c')
    .ellipse(9, top + 3.5, 4, 3.5, 'c')
    .ellipse(12, top + 5, 2.5, 2.5, 'c');
  s.rect(3, top + 5, 11, 3, 'c');
  s.bevel('c', 'C', 'd');
}

/** A drop of water, five across. */
const DROP = new Sketch(5, 7);
DROP.rect(2, 0, 1, 2, 'w').rect(1, 2, 3, 2, 'w').rect(0, 4, 5, 2, 'w').rect(1, 6, 3, 1, 'w');
DROP.set(1, 4, 'W');

export const GLYPHS: Record<GlyphId, ItemArt> = {
  candy: CANDY_POP,
  // Two friends side by side, a ghost peeping over a pal's shoulder.
  neighbours: mark(
    (s) => {
      s.ellipse(5.5, 7, 3.5, 3.5, 'f').ellipse(5.5, 15, 5, 4.5, 'f');
      s.set(4, 7, 'o').set(7, 7, 'o').set(3, 9, 'p').set(8, 9, 'p');
      behind(s, (t) => t.ellipse(11, 5, 3, 3, 'b').ellipse(11, 13, 4, 5, 'b'));
      s.set(10, 4, 'o').set(12, 4, 'o');
      s.rect(0, 15, 16, 1, '.');
    },
    { f: C.cream, b: C.lavender, p: C.roseLight },
  ),
  settings: mark(
    (s) => {
      s.ellipse(8, 8, 5, 5, 'g');
      s.rect(7, 1, 2, 3, 'g').rect(7, 12, 2, 3, 'g').rect(1, 7, 3, 2, 'g').rect(12, 7, 3, 2, 'g');
      s.rect(3, 3, 2, 2, 'g').rect(11, 3, 2, 2, 'g').rect(3, 11, 2, 2, 'g').rect(11, 11, 2, 2, 'g');
      s.ellipse(8, 8, 2, 2, '.');
      s.bevel('g', 'G', 'd');
    },
    { g: C.silver, G: C.ghost, d: C.silverShade },
  ),
  // A wing chair in teal, its arms a shade apart from its back.
  decorate: mark(
    (s) => {
      s.rect(3, 2, 10, 8, 'a').set(3, 2, '.').set(12, 2, '.');
      s.rect(4, 9, 8, 3, 'c').rect(4, 12, 8, 1, 'a');
      s.rect(1, 6, 3, 7, 'b').rect(12, 6, 3, 7, 'b').set(1, 6, '.').set(14, 6, '.');
      s.rect(2, 13, 1, 2, 'l').rect(13, 13, 1, 2, 'l');
      s.bevel('a', 'A', 'D').bevel('b', 'A', 'D').bevel('c', null, 'a');
    },
    { a: C.teal, b: C.teal, A: C.tealLight, D: C.tealShade, c: C.tealLight, l: C.wood },
  ),
  // Her satchel, buckled.
  bag: mark(
    (s) => {
      s.rect(5, 1, 6, 1, 's').rect(4, 2, 1, 3, 's').rect(11, 2, 1, 3, 's');
      s.rect(2, 5, 12, 9, 'b').set(2, 13, '.').set(13, 13, '.');
      s.rect(2, 5, 12, 4, 'f').rect(3, 9, 10, 1, 'f');
      s.bevel('f', 'F', null).bevel('b', null, 'B');
      s.rect(7, 8, 2, 3, 'k').set(7, 8, 'K');
    },
    {
      s: C.wood,
      b: C.pumpkinShade,
      B: C.pumpkinDark,
      f: C.pumpkin,
      F: C.pumpkinLight,
      k: C.gold,
      K: C.candleBright,
    },
  ),
  // A frock on a hanger.
  closet: mark(
    (s) => {
      s.rect(6, 5, 4, 3, 'd').set(6, 4, 'd').set(9, 4, 'd');
      for (const [y, half] of [
        [9, 3],
        [10, 4],
        [11, 4],
        [12, 5],
        [13, 6],
        [14, 6],
      ] as const)
        s.rect(8 - half, y, half * 2, 1, 'd');
      s.bevel('d', 'D', 'e');
      s.rect(6, 8, 4, 1, 'r');
      s.line(3, 4, 7, 2, 'h').line(8, 2, 12, 4, 'h').set(8, 1, 'h').set(9, 1, 'h');
    },
    { d: C.lavender, D: C.ghost, e: C.lavenderShade, r: C.rose, h: C.gold },
    'h',
  ),
  // The Curiosity Cabinet's book, a moth on its cover.
  book: mark(
    (s) => {
      s.rect(2, 1, 12, 14, 'c').rect(2, 1, 2, 14, 's').rect(13, 2, 1, 12, 'p');
      s.rect(2, 3, 2, 1, 'g').rect(2, 12, 2, 1, 'g');
      s.rect(8, 6, 1, 4, 'g').ellipse(6.5, 7, 1.5, 1.5, 'g').ellipse(10.5, 7, 1.5, 1.5, 'g');
      s.set(7, 9, 'g').set(9, 9, 'g');
    },
    { c: C.maroon, s: C.maroonShade, p: C.cream, g: C.gold },
  ),
  map: mark(
    (s) => {
      s.rect(1, 3, 5, 10, 'a').rect(6, 2, 4, 10, 'b').rect(10, 3, 5, 10, 'a');
      s.ellipse(3.5, 5.5, 1.5, 1, 'g').ellipse(8, 10, 1, 1, 'g');
      for (const [x, y] of [
        [3, 10],
        [4, 9],
        [6, 8],
        [8, 7],
        [10, 6],
      ] as const)
        s.set(x, y, 'r');
      s.set(11, 4, 'r').set(13, 4, 'r').set(12, 5, 'r').set(11, 6, 'r').set(13, 6, 'r');
    },
    { a: C.cream, b: C.creamShade, g: C.leaf, r: C.scarlet },
  ),
  plant: mark(
    (s) => {
      s.ellipse(8, 5.5, 2, 4.5, 'l')
        .ellipse(4.5, 6.5, 2.5, 1.5, 'l')
        .ellipse(11.5, 6.5, 2.5, 1.5, 'l');
      s.bevel('l', 'L', 'd');
      s.rect(5, 10, 6, 4, 'p').set(5, 13, '.').set(10, 13, '.').bevel('p', null, 'P');
      s.rect(4, 9, 8, 2, 'r');
    },
    {
      l: C.leaf,
      L: C.leafLight,
      d: C.leafDark,
      p: C.terracotta,
      P: C.pumpkinDark,
      r: C.pumpkinLight,
    },
  ),
  more: mark(
    (s) => {
      for (const y of [3, 7, 11]) s.rect(3, y, 10, 2, 'w');
    },
    { w: C.ghost },
    'w',
  ),
  heart: typed(HEART, { r: C.scarlet, R: C.roseLight, s: C.scarletShade }),
  heartEmpty: typed(HEART, { o: C.plumLight, r: C.dusk, R: C.dusk, s: C.dusk }),
  // The sun coming up over the hills.
  morning: mark(
    (s) => {
      s.ellipse(8, 11, 5, 5, 's').rect(0, 11, 16, 5, '.');
      s.rect(7, 2, 2, 2, 's').set(3, 5, 's').set(4, 6, 's').set(12, 5, 's').set(11, 6, 's');
      s.bevel('s', 'S', null);
      s.rect(1, 11, 14, 2, 'h').rect(3, 13, 10, 1, 'H');
    },
    { s: C.candle, S: C.candleBright, h: C.pumpkin, H: C.rose },
  ),
  afternoon: mark(
    (s) => {
      s.ellipse(8, 8, 4, 4, 's');
      s.rect(7, 1, 2, 2, 's').rect(7, 13, 2, 2, 's').rect(1, 7, 2, 2, 's').rect(13, 7, 2, 2, 's');
      s.set(3, 3, 's').set(12, 3, 's').set(3, 12, 's').set(12, 12, 's');
      s.bevel('s', 'S', null);
    },
    { s: C.candle, S: C.candleBright },
  ),
  evening: mark(
    (s) => {
      s.ellipse(8, 8, 6, 6, 'm').ellipse(11, 6, 5, 5, '.');
      s.bevel('m', 'M', 'n');
      s.set(13, 12, 'y').set(12, 2, 'y');
    },
    { m: C.cream, M: C.white, n: C.creamShade, y: C.candleBright },
    'y',
  ),
  // Skelly, smiling.
  skull: mark(
    (s) => {
      s.ellipse(8, 7, 6, 5.5, 'b').rect(5, 11, 6, 3, 'b');
      s.bevel('b', null, 'n');
      s.ellipse(5.5, 7.5, 1.5, 1.5, 'o').ellipse(10.5, 7.5, 1.5, 1.5, 'o');
      s.set(4, 6, 'b').set(6, 6, 'b').set(9, 6, 'b').set(11, 6, 'b');
      s.set(5, 7, 'w').set(10, 7, 'w');
      s.set(7, 10, 'o').set(8, 10, 'o');
      s.set(6, 12, 'n').set(8, 12, 'n').set(10, 12, 'n');
    },
    { b: C.bone, n: C.boneShade, w: C.white },
  ),
  castle: mark(
    (s) => {
      s.rect(1, 5, 4, 9, 's').rect(4, 7, 4, 7, 's');
      s.rect(2, 1, 2, 2, 'r').rect(1, 3, 4, 2, 'r');
      s.set(5, 6, 's').set(7, 6, 's');
      s.rect(2, 8, 1, 2, 'w');
      s.mirrorX();
      s.rect(7, 10, 2, 4, 'd');
      s.bevel('s', null, 'S');
      s.rect(8, 2, 1, 4, 'k').rect(9, 2, 2, 2, 'f');
    },
    {
      s: C.stoneLight,
      S: C.stone,
      r: C.teal,
      w: C.candle,
      d: C.barkDark,
      k: C.iron,
      f: C.scarlet,
    },
  ),
  signpost: mark(
    (s) => {
      s.rect(6, 7, 2, 8, 'p');
      s.rect(1, 2, 12, 5, 'b').rect(13, 3, 1, 3, 'b').set(14, 4, 'b');
      s.bevel('b', 'B', null);
      s.rect(3, 4, 7, 1, 'd');
    },
    { b: C.wood, B: C.rope, p: C.bark, d: C.barkDark },
  ),
  // Her plum house, its windows lit.
  house: mark(
    (s) => {
      s.rect(11, 2, 2, 3, 'k');
      for (let y = 1; y <= 6; y++) s.rect(7 - y, y, (y + 1) * 2, 1, 'r');
      s.bevel('r', 'R', null);
      s.rect(3, 7, 10, 7, 'c').bevel('c', null, 'C');
      s.rect(7, 10, 2, 4, 'd').rect(4, 9, 2, 2, 'y').rect(10, 9, 2, 2, 'y');
    },
    {
      k: C.stone,
      r: C.plum,
      R: C.plumLight,
      c: C.cream,
      C: C.creamShade,
      d: C.maroon,
      y: C.candle,
    },
  ),
  // Two houses on a street.
  town: mark(
    (s) => {
      s.rect(3, 5, 3, 1, 'r').rect(2, 6, 5, 1, 'r').rect(1, 7, 7, 1, 'r');
      s.rect(2, 8, 5, 6, 'c').rect(4, 11, 1, 3, 'd').set(3, 9, 'y').set(5, 9, 'y');
      behind(s, (t) => {
        t.rect(10, 1, 3, 1, 't').rect(9, 2, 5, 1, 't').rect(8, 3, 7, 1, 't');
        t.rect(9, 4, 5, 10, 'v');
        t.rect(10, 6, 1, 2, 'y').rect(12, 6, 1, 2, 'y').rect(11, 11, 1, 3, 'd');
      });
      s.bevel('c', null, 'C').bevel('v', null, 'V');
    },
    {
      r: C.pumpkin,
      c: C.cream,
      C: C.creamShade,
      t: C.teal,
      v: C.lavender,
      V: C.lavenderShade,
      d: C.maroon,
      y: C.candle,
    },
  ),
  door: mark(
    (s) => {
      s.rect(3, 2, 10, 13, 'f').set(3, 2, '.').set(4, 2, '.').set(11, 2, '.').set(12, 2, '.');
      s.set(3, 3, '.').set(12, 3, '.');
      s.rect(4, 3, 8, 12, 'd').set(4, 3, 'f').set(5, 3, 'f').set(10, 3, 'f').set(11, 3, 'f');
      s.set(4, 4, 'f').set(11, 4, 'f');
      s.rect(6, 4, 1, 11, 'D').rect(9, 4, 1, 11, 'D').set(10, 9, 'g');
    },
    { f: C.stoneLight, d: C.maroon, D: C.maroonShade, g: C.gold },
  ),
  sparkle: mark(
    (s) => {
      s.rect(6, 2, 1, 11, 'y').rect(1, 7, 11, 1, 'y').rect(5, 6, 3, 3, 'y').set(6, 7, 'w');
      s.rect(12, 1, 1, 5, 'y').rect(10, 3, 5, 1, 'y').set(12, 3, 'w');
      s.set(12, 11, 'y').set(11, 12, 'y').set(12, 12, 'w').set(13, 12, 'y').set(12, 13, 'y');
    },
    { y: C.candle, w: C.white },
    'yw',
  ),
  // A happy face, licking its lips.
  yum: mark(
    (s) => {
      s.ellipse(8, 8, 6, 6, 'f').bevel('f', null, 'F');
      s.set(4, 7, 'o').set(5, 6, 'o').set(6, 7, 'o').set(9, 7, 'o').set(10, 6, 'o').set(11, 7, 'o');
      s.set(5, 9, 'o').rect(6, 10, 4, 1, 'o').set(10, 9, 'o').rect(8, 11, 2, 1, 't');
      s.set(3, 9, 'c').set(12, 9, 'c');
    },
    { f: C.candle, F: C.gold, t: C.rose, c: C.roseLight },
  ),
  drops: mark(
    (s) => {
      s.stamp(DROP, 2, 7).stamp(DROP, 9, 2).stamp(DROP, 10, 9);
    },
    { w: C.waterLight, W: C.white },
  ),
  piano: mark(
    (s) => {
      s.rect(1, 3, 14, 3, 'c').rect(1, 6, 14, 6, 'w');
      for (const x of [3, 6, 9, 12]) s.rect(x, 6, 1, 6, 'g');
      for (const x of [2, 5, 11]) s.rect(x, 6, 2, 3, 'k');
      s.rect(2, 12, 1, 2, 'c').rect(13, 12, 1, 2, 'c');
    },
    { c: C.inkFabric, w: C.white, g: C.silver, k: C.ink },
  ),
  // A pink envelope sealed in red wax.
  letter: mark(
    (s) => {
      s.rect(1, 4, 14, 9, 'e').line(1, 4, 7, 9, 'E').line(14, 4, 8, 9, 'E');
      s.ellipse(8, 9.5, 2, 2, 'r').set(7, 8, 'R');
    },
    { e: C.roseLight, E: C.rose, r: C.scarlet, R: C.roseLight },
  ),
  letterOpen: mark(
    (s) => {
      s.rect(7, 1, 2, 1, 'F').rect(5, 2, 6, 1, 'F').rect(3, 3, 10, 1, 'F').rect(1, 4, 14, 1, 'F');
      s.rect(1, 5, 14, 8, 'e').line(1, 12, 7, 8, 'E').line(14, 12, 8, 8, 'E');
    },
    { e: C.cream, E: C.creamShade, F: C.creamShade },
  ),
  pin: mark(
    (s) => {
      s.line(6, 9, 2, 13, 'n');
      s.ellipse(9.5, 5.5, 3.5, 3.5, 'r').bevel('r', null, 's').set(8, 4, 'R').set(9, 3, 'R');
    },
    { n: C.silver, r: C.scarlet, s: C.scarletShade, R: C.roseLight },
  ),
  lookingGlass: mark(
    (s) => {
      for (let k = 0; k < 4; k++) s.rect(10 + k, 10 + k, 2, 2, 'h');
      s.ellipse(6.5, 6.5, 5.5, 5.5, 'g').ellipse(6.5, 6.5, 3.5, 3.5, 'l');
      s.set(5, 4, 'w').set(4, 5, 'w');
    },
    { h: C.wood, g: C.gold, l: C.sky, w: C.white },
  ),
  scroll: mark(
    (s) => {
      s.rect(3, 3, 10, 10, 'p');
      s.rect(2, 1, 12, 3, 'r').rect(2, 12, 12, 3, 'r').bevel('r', null, 'R');
      s.rect(5, 6, 6, 1, 'l').rect(5, 8, 5, 1, 'l').rect(5, 10, 6, 1, 'l');
    },
    { p: C.cream, r: C.creamShade, R: C.rope, l: C.stone },
  ),
  storm: mark(
    (s) => {
      cloud(s, 1);
      s.rect(8, 9, 2, 1, 'y').rect(7, 10, 2, 1, 'y').rect(6, 11, 4, 1, 'y');
      s.rect(8, 12, 2, 1, 'y').rect(7, 13, 2, 1, 'y').set(7, 14, 'y');
    },
    { c: C.stone, C: C.stoneLight, d: C.stoneDark, y: C.candle },
  ),
  rain: mark(
    (s) => {
      cloud(s, 1);
      for (const x of [5, 9, 13])
        s.set(x, 11, 'w')
          .set(x, 12, 'w')
          .set(x - 1, 13, 'w')
          .set(x - 1, 14, 'w');
    },
    { c: C.stoneLight, C: C.ghost, d: C.stone, w: C.waterLight },
    'w',
  ),
  fog: mark(
    (s) => {
      s.rect(4, 3, 9, 2, 'f').rect(1, 7, 11, 2, 'f').rect(5, 11, 10, 2, 'f');
      for (const [x, y] of [
        [4, 3],
        [12, 4],
        [1, 7],
        [11, 8],
        [5, 11],
        [14, 12],
      ] as const)
        s.set(x, y, '.');
    },
    { f: C.fog },
    'f',
  ),
  question: mark(
    (s) => {
      s.ellipse(8, 5, 4, 4, 'w').ellipse(8, 5, 2, 2, '.').rect(4, 5, 4, 4, '.');
      s.rect(7, 8, 3, 1, 'w').rect(7, 9, 2, 2, 'w').rect(7, 12, 2, 2, 'w');
    },
    { w: C.ghost },
  ),
  north: { source: NORTH, palette: { '.': null, o: C.ink, ...ARROW_PALETTE } },
  east: { source: EAST, palette: { '.': null, o: C.ink, ...ARROW_PALETTE } },
  south: { source: SOUTH, palette: { '.': null, o: C.ink, ...ARROW_PALETTE } },
  west: { source: WEST, palette: { '.': null, o: C.ink, ...ARROW_PALETTE } },
  // A map's pin: you are here.
  here: mark(
    (s) => {
      s.ellipse(8, 6, 5, 5, 'r').rect(5, 10, 6, 1, 'r').rect(6, 11, 4, 1, 'r');
      s.rect(7, 12, 2, 2, 'r');
      s.bevel('r', null, 's').ellipse(8, 6, 2, 2, 'w');
    },
    { r: C.scarlet, s: C.scarletShade, w: C.white },
  ),
  footprints: mark(
    (s) => {
      s.stamp({ rows: FOOT }, 1, 7).stamp(
        { rows: FOOT.map((r) => [...r].reverse().join('')) },
        9,
        1,
      );
    },
    { f: C.lavender },
  ),
  camera: mark(
    (s) => {
      s.rect(1, 5, 14, 8, 'b').rect(4, 3, 4, 2, 'b').rect(11, 3, 2, 2, 'w');
      s.bevel('b', null, 'B');
      s.ellipse(8, 9, 3.5, 3.5, 'r').ellipse(8, 9, 2, 2, 'l').set(7, 8, 'w');
    },
    { b: C.rose, B: C.coralShade, r: C.silver, l: C.navy, w: C.white },
  ),
  crown: mark(
    (s) => {
      s.rect(2, 9, 12, 4, 'g').rect(2, 4, 2, 5, 'g').rect(7, 3, 2, 6, 'g').rect(12, 4, 2, 5, 'g');
      s.rect(4, 7, 3, 2, 'g').rect(9, 7, 3, 2, 'g');
      s.bevel('g', 'G', 'd');
      s.rect(4, 10, 2, 2, 'j').rect(10, 10, 2, 2, 'j').rect(7, 10, 2, 2, 'J');
    },
    { g: C.gold, G: C.candleBright, d: C.goldShade, j: C.scarlet, J: C.teal },
  ),
  sort: (() => {
    const s = new Sketch(16, 16);
    s.stamp({ rows: LITTLE_ARROW }, 2, 2).stamp({ rows: [...LITTLE_ARROW].reverse() }, 8, 6);
    return { source: s.toSource(), palette: { '.': null, o: C.ink, w: C.ghost } };
  })(),
  parcel: PARCEL_POP,
  neighbourCake: NEIGHBOUR_CAKE,
  tree: mark(
    (s) => {
      s.rect(7, 12, 2, 3, 'k');
      const tier = (key: string, top: number, rows: number, from: number) => {
        for (let i = 0; i < rows; i++) {
          const half = from + Math.round(i * 0.75);
          s.rect(8 - half, top + i, half * 2, 1, key);
        }
        s.bevel(key, 'T', 'd');
      };
      tier('t', 1, 4, 1);
      tier('u', 4, 4, 2);
      tier('v', 7, 5, 3);
    },
    { k: C.bark, t: C.hedge, u: C.hedge, v: C.hedge, T: C.hedgeLight, d: C.hedgeDark },
  ),
  // A paper lantern, lit.
  lantern: mark(
    (s) => {
      s.ellipse(8, 8, 5, 5, 'l').ellipse(8, 8, 2, 3, 'g');
      s.replace('l', 'r', (x) => x === 5 || x === 10);
      s.rect(6, 2, 4, 2, 'c').rect(6, 13, 4, 2, 'c').set(8, 1, 'c');
    },
    { l: C.scarlet, r: C.scarletShade, g: C.pumpkinLight, c: C.gold },
  ),
  // The fairground's big wheel.
  wheel: mark(
    (s) => {
      s.line(8, 7, 4, 14, 'k').line(8, 7, 12, 14, 'k');
      s.ellipse(8, 7, 6, 6, 'w').ellipse(8, 7, 5, 5, '.');
      s.line(3, 7, 13, 7, 'k')
        .line(8, 2, 8, 12, 'k')
        .line(4, 3, 12, 11, 'k')
        .line(4, 11, 12, 3, 'k');
      s.rect(7, 6, 2, 2, 'h');
      s.rect(7, 0, 2, 2, 'c').rect(1, 6, 2, 2, 'C').rect(13, 6, 2, 2, 'C').rect(7, 12, 2, 2, 'c');
    },
    { k: C.silver, w: C.candle, h: C.gold, c: C.rose, C: C.teal },
  ),
  // Waves rolling in: three rows of crests.
  wave: mark(
    (s) => {
      for (const [top, key] of [
        [2, 'f'],
        [7, 'w'],
        [12, 'd'],
      ] as const) {
        for (let x = 1; x < 15; x++) {
          const y = top + (Math.sin(((x - 1) * Math.PI) / 3.5) > 0.2 ? 0 : 1);
          s.rect(x, y, 1, 2, key);
        }
      }
    },
    { f: C.white, w: C.waterLight, d: C.water },
    'fwd',
  ),
  topHat: mark(
    (s) => {
      s.rect(4, 3, 8, 9, 'h').rect(1, 12, 14, 2, 'h').rect(4, 9, 8, 2, 'b').rect(5, 4, 1, 5, 'H');
    },
    { h: C.inkFabric, H: C.plumLight, b: C.scarlet },
  ),
  telescope: mark(
    (s) => {
      s.line(7, 8, 4, 14, 'k').line(7, 8, 10, 14, 'k').line(7, 8, 7, 14, 'k');
      for (let k = 0; k <= 8; k++) s.rect(3 + k, 9 - Math.round((k * 6) / 8), 2, 2, 'b');
      s.bevel('b', null, 'B');
      s.rect(11, 2, 2, 2, 'g');
    },
    { k: C.wood, b: C.gold, B: C.goldShade, g: C.sky },
  ),
  hammer: mark(
    (s) => {
      s.line(10, 6, 3, 13, 'h').line(11, 6, 4, 13, 'h');
      s.rect(7, 2, 8, 4, 's').bevel('s', null, 'S');
    },
    { h: C.wood, s: C.stoneLight, S: C.stone },
  ),
  bottle: mark(
    (s) => {
      s.rect(7, 1, 2, 4, 'g').rect(6, 5, 4, 1, 'g').rect(5, 6, 6, 8, 'g');
      s.rect(5, 8, 6, 3, 'l').rect(7, 1, 2, 1, 'k').rect(6, 6, 1, 2, 'G').rect(6, 11, 1, 2, 'G');
    },
    { g: C.leaf, G: C.leafLight, l: C.cream, k: C.wood },
  ),
  star: typed(STAR, { y: C.candle, Y: C.white }),
  tallyHit: mark(
    (s) => {
      s.ellipse(8, 8, 5, 5, 'p').ellipse(8, 8, 2, 2, '.').bevel('p', 'P', null);
    },
    { p: C.lavender, P: C.ghost },
  ),
  tallyMiss: mark(
    (s) => {
      s.ellipse(8, 8, 5, 5, 'g').ellipse(8, 8, 4, 4, '.');
    },
    { g: C.stoneLight },
  ),
  tallyLeft: mark(
    (s) => {
      s.ellipse(8, 8, 5, 5, 'q').ellipse(8, 8, 4, 4, '.');
      s.replace('q', '.', (x, y) => (x + y) % 2 === 1);
    },
    { q: C.plumLight },
    'q',
  ),
  snowflake: mark(
    (s) => {
      s.line(7, 1, 7, 13, 'w').line(2, 4, 12, 10, 'w').line(2, 10, 12, 4, 'w');
      s.set(6, 2, 'w').set(8, 2, 'w').set(6, 12, 'w').set(8, 12, 'w').set(7, 7, 'W');
    },
    { w: C.iceLight, W: C.white },
    'wW',
  ),
  blossom: mark(
    (s) => {
      for (let k = 0; k < 5; k++) {
        const a = -Math.PI / 2 + (k * 2 * Math.PI) / 5;
        s.ellipse(8 + Math.cos(a) * 3.5, 8 + Math.sin(a) * 3.5, 2.5, 2.5, 'p');
      }
      s.bevel('p', 'P', null).ellipse(8, 8, 1.5, 1.5, 'c');
    },
    { p: C.blossom, P: C.blossomLight, c: C.gold },
  ),
  watermelon: mark(
    (s) => {
      s.ellipse(8, 3, 7, 10, 'g').ellipse(8, 3, 6, 9, 'w').ellipse(8, 3, 5, 8, 'r');
      s.rect(0, 0, 16, 4, '.');
      s.set(6, 6, 'k').set(9, 6, 'k').set(8, 8, 'k').set(5, 8, 'k').set(11, 8, 'k');
    },
    { g: C.leaf, w: C.cream, r: C.rose, k: C.ink },
  ),
  shell: mark(
    (s) => {
      s.ellipse(8, 9, 6, 6, 's')
        .rect(0, 11, 16, 5, '.')
        .rect(6, 11, 4, 2, 's')
        .rect(5, 13, 6, 1, 's');
      s.line(8, 12, 3, 5, 'S')
        .line(8, 12, 6, 3, 'S')
        .line(8, 12, 10, 3, 'S')
        .line(8, 12, 13, 5, 'S');
    },
    { s: C.coral, S: C.coralShade },
  ),
  leaf: mark(
    (s) => {
      s.ellipse(8.5, 7, 5, 5, 'l').set(4, 3, 'l').set(13, 3, 'l').set(13, 11, 'l');
      s.bevel('l', 'L', null).line(5, 10, 11, 4, 'v').line(5, 10, 2, 13, 's');
    },
    { l: C.pumpkin, L: C.pumpkinLight, v: C.pumpkinDark, s: C.bark },
  ),
};

/** The grid and colours a glyph is drawn from. */
export function glyphArt(glyph: Glyph): ItemArt {
  if (typeof glyph === 'string') return GLYPHS[glyph];
  if ('item' in glyph) return ITEM_ART[glyph.item];
  if ('mark' in glyph) return CALENDAR_MARKS[glyph.mark];
  return TOOL_ART[glyph.tool];
}

/** What names a glyph, for caching and the gallery. */
export function glyphKey(glyph: Glyph): string {
  if (typeof glyph === 'string') return `ui:${glyph}`;
  if ('item' in glyph) return `item:${glyph.item}`;
  if ('mark' in glyph) return `mark:${glyph.mark}`;
  return `tool:${glyph.tool}`;
}

const urls = new Map<string, string>();

/** A glyph as a URL an `<img>` takes: an SVG of its pixels, made once. */
export function glyphUrl(glyph: Glyph): string {
  const key = glyphKey(glyph);
  let url = urls.get(key);
  if (!url) {
    const art = glyphArt(glyph);
    url = svgUrl(svgOf(art.source, art.palette));
    urls.set(key, url);
  }
  return url;
}

let bats: string[] | undefined;

/** A bat's two wingbeats (`BAT_FLYING`), as URLs, for the title's sky (V1's L5). */
export function batFrames(): readonly string[] {
  bats ??= BAT_FLYING.map((frame) => svgUrl(svgOf(frame, BAT_PALETTE, 0)));
  return bats;
}
