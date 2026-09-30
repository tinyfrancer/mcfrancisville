import { letters, lettersWidth } from './buildings';
import { PALETTE as C, ramp } from './palette';
import { Sketch } from './sketch';
import type { Palette, SpriteSource } from './sprite';

/*
 * Film night on the avenue (0.2's J3): a screen on two posts under a plum valance lettered
 * FILM NIGHT, and a table of popcorn beside the seats. While the film is on, the screen shows the
 * friendly ghost bobbing over a moonlit hill, and glows.
 */

const SCREEN_W = 128;
const SCREEN_H = 88;
/** The screen's picture, inside its frame. */
const PICTURE = { x: 13, y: 17, w: 102, h: 46 };

function frame(): Sketch {
  const s = new Sketch(SCREEN_W, SCREEN_H);
  for (const x of [6, 118]) {
    s.rect(x, 8, 4, 78, 'w')
      .rect(x, 8, 1, 78, 'W')
      .rect(x + 3, 8, 1, 78, 'b');
    s.rect(x - 4, 84, 12, 4, 'w').rect(x - 4, 84, 12, 1, 'W');
  }
  s.rect(10, 15, 108, 50, 'k');
  s.rect(PICTURE.x, PICTURE.y, PICTURE.w, PICTURE.h, 'S');
  s.rect(PICTURE.x, PICTURE.y, PICTURE.w, 1, 's');
  s.rect(4, 4, 120, 10, 'p').rect(4, 4, 120, 1, 'P').rect(4, 13, 120, 1, 'q');
  for (let x = 6; x < 122; x += 8) {
    s.rect(x, 14, 5, 1, 'o')
      .rect(x + 1, 15, 3, 1, 'o')
      .set(x + 2, 16, 'o');
  }
  const words = 'FILM NIGHT';
  letters(s, words, Math.round((SCREEN_W - lettersWidth(words)) / 2), 6, 'y');
  return s;
}

export const FILM_SCREEN: SpriteSource = finishScreen(frame());

function finishScreen(s: Sketch): SpriteSource {
  s.outline({ w: 'b', W: 'b', p: 'q', P: 'q', o: 'q', k: null, S: null });
  return s.toSource();
}

/** The film, a frame of it: the friendly ghost bobbing `bob` pixels over a moonlit hill. */
function showing(bob: number): SpriteSource {
  const s = frame();
  const { x, y, w, h } = PICTURE;
  s.rect(x, y, w, h, 'n');
  s.ellipse(x + 84, y + 11, 6, 6, 'm').ellipse(x + 86, y + 9, 5, 5, 'n');
  for (const [sx, sy] of [
    [x + 10, y + 6],
    [x + 26, y + 14],
    [x + 70, y + 5],
    [x + 96, y + 22],
  ] as const) {
    s.set(sx, sy, 'm');
  }
  const hill = (cx: number, cy: number, rx: number, ry: number) => {
    for (let j = y; j < y + h; j++) {
      for (let i = x; i < x + w; i++) {
        if (((i + 0.5 - cx) / rx) ** 2 + ((j + 0.5 - cy) / ry) ** 2 <= 1) s.set(i, j, 'h');
      }
    }
  };
  hill(x + 30, y + h + 6, 40, 14);
  hill(x + 82, y + h + 8, 34, 13);
  // The ghost: a round head, a body that tapers to a wavy hem, a friendly face and a wave.
  const gx = x + 51;
  const gy = y + 13 + bob;
  s.ellipse(gx, gy + 6, 9, 9, 'g').rect(gx - 9, gy + 6, 18, 12, 'g');
  for (let i = 0; i < 6; i++) s.rect(gx - 9 + i * 3 + (i % 2), gy + 18, 2, 1, 'g');
  s.ellipse(gx + 10, gy + 11, 3, 2, 'g');
  s.rect(gx - 5, gy + 5, 2, 3, 'e').rect(gx + 3, gy + 5, 2, 3, 'e');
  s.set(gx - 5, gy + 5, 'g').set(gx + 3, gy + 5, 'g');
  s.rect(gx - 1, gy + 10, 2, 1, 'e');
  s.set(gx - 7, gy + 9, 'r').set(gx + 6, gy + 9, 'r');
  return finishScreen(s);
}

/** The film's frames, one a beat: the ghost bobs up and down a pixel at a time. */
export const FILM_SHOWING: readonly SpriteSource[] = [0, 1, 2, 1].map(showing);

export const FILM_PALETTE: Palette = {
  '.': null,
  w: C.wood,
  W: C.rope,
  b: C.bark,
  k: C.ink,
  S: C.white,
  s: C.cream,
  p: C.plum,
  P: ramp(C.plum)[3]!,
  q: ramp(C.plum)[0]!,
  o: C.pumpkin,
  y: C.gold,
  n: ramp(C.lavender)[0]!,
  m: C.candleBright,
  h: ramp(C.moss)[0]!,
  g: C.ghost,
  e: C.ink,
  r: C.cheek,
};

/** The picture's light after dark: the film is what's bright on the avenue. */
export const FILM_GLOW: Palette = {
  S: C.candleBright,
  n: ramp(C.lavender)[1]!,
  m: C.candleBright,
  h: ramp(C.moss)[1]!,
  g: C.white,
  e: C.ink,
  r: C.cheek,
};

/**
 * The popcorn table: a little table in a checked cloth, with two striped tubs heaped high and a
 * bowl between them (question 71).
 */
function drawTable(): SpriteSource {
  const s = new Sketch(64, 44);
  for (const x of [8, 52]) s.rect(x, 28, 4, 16, 'w').rect(x, 28, 1, 16, 'W');
  s.rect(3, 22, 58, 10, 'c');
  for (let i = 0; i < 58; i += 4) {
    for (let j = 0; j < 10; j += 4) s.rect(3 + i + ((j / 4) % 2) * 2, 22 + j, 2, 2, 'o');
  }
  s.rect(3, 22, 58, 1, 'C');
  const tub = (tx: number) => {
    s.rect(tx, 10, 12, 13, 'x');
    for (let i = 1; i < 12; i += 4) s.rect(tx + i, 10, 2, 13, 'r');
    s.ellipse(tx + 6, 9, 7, 5, 'k')
      .set(tx + 3, 6, 'K')
      .set(tx + 8, 5, 'K')
      .set(tx + 10, 8, 'K');
    s.set(tx + 5, 8, 'K').set(tx + 1, 9, 'K');
  };
  tub(8);
  tub(44);
  s.ellipse(32, 19, 10, 4, 'B').rect(22, 19, 20, 3, 'B');
  s.ellipse(32, 17, 8, 3, 'k').set(29, 16, 'K').set(34, 15, 'K').set(31, 17, 'K');
  s.outline({ w: 'b', W: 'b', c: 'q', o: 'q', C: 'q', x: 'R', r: 'R', k: 'G', K: 'G', B: 'b' });
  return s.toSource();
}

export const POPCORN_TABLE: SpriteSource = drawTable();

export const POPCORN_TABLE_PALETTE: Palette = {
  '.': null,
  w: C.wood,
  W: C.rope,
  b: C.bark,
  c: C.cream,
  C: C.white,
  o: C.pumpkin,
  q: C.pumpkinDark,
  x: C.white,
  r: C.scarlet,
  R: C.berry,
  k: C.cream,
  K: C.candle,
  G: C.goldShade,
  B: C.plum,
};
