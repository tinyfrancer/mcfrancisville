import type { CalendarId } from '../data/calendar';
import type { ItemArt } from './items';
import { PALETTE as C } from './palette';
import { Sketch } from './sketch';
import type { SpriteSource } from './sprite';

/*
 * The marks on the calendar's days (0.2's K2): a 16-pixel picture for each row of the calendar,
 * drawn in the game's own pixels rather than a phone's emoji, so the month looks like the town.
 * Each is a few keys of its own, outlined in ink.
 */

const INK = 'o';

/** Outlined in ink round everything but the keys that glow or float free. */
function inked(s: Sketch, loose = ''): SpriteSource {
  s.outline((key) => (loose.includes(key) ? null : INK));
  return s.toSource();
}

function mark(draw: (s: Sketch) => void, palette: Record<string, string>, loose = ''): ItemArt {
  const s = new Sketch(16, 16);
  draw(s);
  return { source: inked(s, loose), palette: { '.': null, [INK]: C.ink, ...palette } };
}

/** A cake with a candle lit: `c` cake, `i` icing, `k` candle, `f` flame. */
const cake = (cake: string, icing: string) =>
  mark(
    (s) => {
      s.rect(3, 8, 10, 6, 'c').rect(3, 8, 10, 2, 'i').set(5, 10, 'i').set(9, 10, 'i');
      s.rect(7, 4, 2, 4, 'k').set(7, 2, 'f').set(8, 2, 'f').set(7, 3, 'f');
    },
    { c: cake, i: icing, k: C.white, f: C.candle },
  );

export const CALENDAR_MARKS: Record<CalendarId, ItemArt> = {
  // A present with a bow, from Cody before the day itself.
  earlyBirthday: mark(
    (s) => {
      s.rect(2, 6, 12, 8, 'b').rect(7, 6, 2, 8, 'r').rect(2, 9, 12, 2, 'r');
      s.rect(4, 3, 3, 3, 'r').rect(9, 3, 3, 3, 'r').set(5, 4, 'b').set(10, 4, 'b');
    },
    { b: C.teal, r: C.rose },
  ),
  birthday: cake(C.roseLight, C.white),
  anniversary: mark(
    (s) => {
      s.ellipse(8, 10, 5, 4, 'g').ellipse(8, 10, 3, 2, '.');
      s.rect(6, 3, 4, 3, 'd').set(7, 2, 'D').set(8, 2, 'D').set(7, 4, 'D');
    },
    { g: C.gold, d: C.sky, D: C.white },
  ),
  // Two quavers joined, for their song.
  septemberSong: mark(
    (s) => {
      s.rect(5, 3, 8, 2, 'n').rect(5, 3, 1, 9, 'n').rect(12, 3, 1, 8, 'n');
      s.ellipse(4, 12, 2, 2, 'n').ellipse(11, 11, 2, 2, 'n').set(3, 11, 'N').set(10, 10, 'N');
    },
    { n: C.lavender, N: C.white },
  ),
  // A monarch, for Dolly Parton day.
  dollyDay: mark(
    (s) => {
      s.ellipse(5, 5, 3, 3, 'w').ellipse(11, 5, 3, 3, 'w').ellipse(5, 11, 2, 2, 'w');
      s.ellipse(11, 11, 2, 2, 'w').rect(8, 3, 1, 11, 'b').set(7, 2, 'b').set(9, 2, 'b');
      s.set(4, 4, 'y').set(12, 4, 'y').set(5, 11, 'y').set(11, 11, 'y');
    },
    { w: C.pumpkin, b: C.ink, y: C.candle },
  ),
  newYear: burst(C.candle, C.rose),
  valentines: mark(
    (s) => {
      s.ellipse(5, 6, 3, 3, 'h').ellipse(10, 6, 3, 3, 'h');
      for (let y = 7; y < 14; y++) s.rect(2 + (y - 7), y, 12 - 2 * (y - 7), 1, 'h');
      s.set(4, 5, 'H');
      s.line(1, 14, 14, 1, 'a').set(13, 1, 'f').set(14, 2, 'f').set(1, 13, 'f');
    },
    { h: C.scarlet, H: C.roseLight, a: C.wood, f: C.white },
  ),
  stPatricks: mark(
    (s) => {
      s.ellipse(8, 4, 3, 3, 'l').ellipse(4, 9, 3, 3, 'l').ellipse(12, 9, 3, 3, 'l');
      s.line(8, 9, 10, 14, 's').set(7, 3, 'L').set(3, 8, 'L').set(11, 8, 'L');
    },
    { l: C.leaf, L: C.leafLight, s: C.leafDark },
  ),
  easter: mark(
    (s) => {
      s.ellipse(8, 8, 5, 6, 'e').rect(3, 7, 11, 2, 'b').set(5, 11, 'd').set(8, 11, 'd');
      s.set(11, 11, 'd').set(6, 4, 'E');
    },
    { e: C.lavender, E: C.white, b: C.rose, d: C.sky },
  ),
  fourthOfJuly: burst(C.scarlet, C.sky),
  halloween: mark(
    (s) => {
      s.ellipse(8, 9, 6, 5, 'p').rect(7, 2, 2, 3, 's');
      for (const x of [5, 10]) s.set(x, 7, 'f').rect(x - 1, 8, 3, 1, 'f');
      s.rect(5, 11, 6, 1, 'f').set(4, 10, 'f').set(11, 10, 'f').set(7, 11, 'p');
    },
    { p: C.pumpkin, s: C.leafDark, f: C.candle },
  ),
  thanksgiving: mark(
    (s) => {
      s.ellipse(8, 7, 6, 5, 't').ellipse(8, 7, 4, 4, 'T').ellipse(8, 10, 4, 4, 'b');
      s.rect(5, 14, 1, 1, 'k').rect(10, 14, 1, 1, 'k');
      s.ellipse(8, 6, 2, 2, 'b').set(9, 5, 'e').set(10, 7, 'r');
    },
    { t: C.pumpkin, T: C.scarlet, b: C.wood, k: C.candle, e: C.ink, r: C.scarlet },
  ),
  christmasEve: mark(
    (s) => {
      s.rect(6, 6, 4, 8, 'w').set(6, 6, 'W').rect(4, 13, 8, 2, 'h');
      s.set(8, 5, 'k').set(8, 3, 'f').set(8, 4, 'f').set(7, 4, 'f').set(8, 2, 'F');
    },
    { w: C.scarlet, W: C.roseLight, h: C.gold, k: C.ink, f: C.candle, F: C.white },
    'fF',
  ),
  christmas: mark(
    (s) => {
      for (let y = 2; y < 13; y++) {
        const w = 1 + Math.floor(((y - 2) % 4) + (y - 2) / 2);
        s.rect(8 - w, y, w * 2, 1, 't');
      }
      s.rect(7, 13, 2, 2, 'b').set(7, 1, 's').set(8, 1, 's');
      s.set(6, 6, 'r').set(9, 9, 'r').set(5, 11, 'g').set(10, 5, 'g');
    },
    { t: C.leafDark, b: C.wood, s: C.candle, r: C.scarlet, g: C.gold },
  ),
  newYearsEve: mark(
    (s) => {
      s.rect(5, 2, 6, 5, 'c').rect(6, 7, 4, 1, 'c').rect(7, 8, 2, 4, 's').rect(5, 12, 6, 2, 's');
      s.rect(5, 2, 6, 1, 'f').set(6, 4, 'b').set(8, 5, 'b').set(9, 3, 'b');
    },
    { c: C.candle, f: C.white, b: C.white, s: C.ghost },
  ),
  marketDay: mark(
    (s) => {
      s.rect(2, 8, 12, 6, 'w').rect(2, 8, 12, 1, 'W').set(5, 10, 'W').set(9, 10, 'W');
      s.ellipse(8, 7, 5, 4, 'h').ellipse(8, 7, 4, 3, '.');
      s.ellipse(5, 7, 2, 1, 'a').ellipse(10, 7, 2, 1, 'p');
    },
    { w: C.wood, W: C.rope, h: C.bark, a: C.scarlet, p: C.pumpkin },
  ),
  fullMoon: mark(
    (s) => {
      s.ellipse(8, 8, 6, 6, 'm').set(6, 6, 'c').set(7, 6, 'c').set(10, 10, 'c').set(9, 4, 'c');
      s.set(5, 10, 'c').set(4, 5, 'M').set(5, 4, 'M');
    },
    { m: C.cream, M: C.white, c: C.creamShade },
  ),
  luckyFriday: mark(
    (s) => {
      for (const [x, y] of [
        [5, 5],
        [11, 5],
        [5, 10],
        [11, 10],
      ] as const)
        s.ellipse(x, y, 3, 3, 'l');
      s.set(8, 8, 'L').line(9, 9, 12, 14, 's').set(4, 4, 'L').set(10, 4, 'L');
    },
    { l: C.leaf, L: C.leafLight, s: C.leafDark },
  ),
  halloweenFestival: mark(
    (s) => {
      s.ellipse(8, 8, 2, 3, 'b').set(7, 4, 'b').set(9, 4, 'b');
      for (const dir of [-1, 1]) {
        for (let k = 0; k < 6; k++)
          s.rect(8 + dir * (2 + k), 6 + Math.floor(k / 2), 1, 4 - (k % 2), 'b');
      }
      s.set(7, 7, 'e').set(9, 7, 'e');
    },
    { b: C.plum, e: C.candle },
  ),
};

/** Fireworks: rays out from a bright middle, in two colours. */
function burst(one: string, two: string): ItemArt {
  return mark(
    (s) => {
      for (let k = 0; k < 8; k++) {
        const a = (k / 8) * Math.PI * 2;
        const key = k % 2 === 0 ? 'a' : 'b';
        for (let r = 3; r < 7; r++) {
          s.set(Math.round(8 + Math.cos(a) * r), Math.round(8 + Math.sin(a) * r), key);
        }
      }
      s.rect(7, 7, 2, 2, 'c');
    },
    { a: one, b: two, c: C.white },
    'abc',
  );
}

/** A neighbour's birthday (0.2's U4): a cake in lavender, so hers stays her own. */
export const NEIGHBOUR_CAKE: ItemArt = cake(C.lavender, C.white);

/**
 * A page of the calendar with its two rings (0.2's U4): the sheet's picture on a day with nothing
 * else on. `p` page, `r` its red top, `g` the rings, `d` the days.
 */
export const CALENDAR_PAGE: ItemArt = mark(
  (s) => {
    s.rect(2, 3, 12, 11, 'p').rect(2, 3, 12, 3, 'r');
    s.rect(5, 1, 1, 4, 'g').rect(10, 1, 1, 4, 'g');
    for (let y = 7; y < 13; y += 2) for (let x = 4; x < 13; x += 2) s.set(x, y, 'd');
  },
  { p: C.cream, r: C.scarlet, g: C.gold, d: C.creamShade },
);
