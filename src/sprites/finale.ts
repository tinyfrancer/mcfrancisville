import { letters, lettersWidth } from './buildings';
import { CAT_LANTERN, CRAFTED_ART } from './crafted';
import type { FurnitureArt } from './furniture';
import { PALETTE as C, ramp } from './palette';
import type { PropArt } from './props';
import { Sketch } from './sketch';
import type { Palette, SpriteSource } from './sprite';

/*
 * The Halloween Festival's finale (0.2's J4): the costume contest's stage on the avenue, the
 * table of white chicken chili at the party, her cat-o'-lantern lit round the square with the
 * town's, and the photo Cody has framed for her the next morning.
 */

// ---- The contest's stage -------------------------------------------------------------------------

/**
 * A backdrop on two posts under a plum valance lettered COSTUME CONTEST: a starry cloth between
 * curtains drawn back and tied with gold. Everyone lines up before it, facing the judge.
 */
function drawStage(): SpriteSource {
  const s = new Sketch(128, 88);
  for (const x of [6, 118]) {
    s.rect(x, 8, 4, 78, 'w')
      .rect(x, 8, 1, 78, 'W')
      .rect(x + 3, 8, 1, 78, 'b');
    s.rect(x - 4, 84, 12, 4, 'w').rect(x - 4, 84, 12, 1, 'W');
  }
  s.rect(10, 14, 108, 58, 'n');
  for (const [x, y] of [
    [30, 24],
    [52, 36],
    [70, 22],
    [88, 40],
    [98, 26],
    [42, 52],
    [80, 58],
  ] as const) {
    s.set(x, y, 'y')
      .set(x - 1, y, 'Y')
      .set(x + 1, y, 'Y')
      .set(x, y - 1, 'Y')
      .set(x, y + 1, 'Y');
  }
  s.ellipse(64, 30, 7, 7, 'y').ellipse(66, 28, 6, 6, 'n');
  // The curtains, drawn back, their folds, and a gold tie round each.
  for (const [x, dir] of [
    [10, 1],
    [118, -1],
  ] as const) {
    for (let y = 14; y < 72; y++) {
      const bulge = y < 40 ? Math.round(16 - (y - 14) * 0.35) : Math.round(7 + (y - 40) * 0.35);
      const from = dir === 1 ? x : x - bulge;
      s.rect(from, y, bulge, 1, 'c');
      for (let f = 3; f < bulge; f += 4) s.set(dir === 1 ? x + f : x - f - 1, y, 'C');
    }
    const tie = dir === 1 ? x : x - 9;
    s.rect(tie, 40, 9, 2, 'y');
  }
  s.rect(4, 4, 120, 10, 'p').rect(4, 4, 120, 1, 'P').rect(4, 13, 120, 1, 'q');
  for (let x = 6; x < 122; x += 8) {
    s.rect(x, 14, 5, 1, 'o')
      .rect(x + 1, 15, 3, 1, 'o')
      .set(x + 2, 16, 'o');
  }
  const words = 'COSTUME CONTEST';
  letters(s, words, Math.round((128 - lettersWidth(words)) / 2), 6, 'y');
  s.outline({ w: 'b', W: 'b', p: 'q', P: 'q', o: 'q', c: 'm', C: 'm', n: null, y: null });
  return s.toSource();
}

export const CONTEST_STAGE: SpriteSource = drawStage();

export const CONTEST_STAGE_PALETTE: Palette = {
  '.': null,
  w: C.wood,
  W: C.rope,
  b: C.bark,
  n: ramp(C.plum)[0]!,
  y: C.gold,
  Y: C.goldShade,
  c: C.maroon,
  C: C.maroonShade,
  m: ramp(C.maroonShade)[0]!,
  p: C.plum,
  P: ramp(C.plum)[3]!,
  q: ramp(C.plum)[0]!,
  o: C.pumpkin,
};

// ---- The chili table -----------------------------------------------------------------------------

/**
 * A table in a checked cloth with Cody's big pot of white chicken chili on it (question 76),
 * a ladle in it, and a stack of bowls beside.
 */
function drawChiliTable(): SpriteSource {
  const s = new Sketch(64, 48);
  for (const x of [8, 52]) s.rect(x, 32, 4, 16, 'w').rect(x, 32, 1, 16, 'W');
  s.rect(3, 26, 58, 10, 'c');
  for (let i = 0; i < 58; i += 4) {
    for (let j = 0; j < 10; j += 4) s.rect(3 + i + ((j / 4) % 2) * 2, 26 + j, 2, 2, 'o');
  }
  s.rect(3, 26, 58, 1, 'C');
  // The pot: iron, round, handles either side, full to the brim.
  s.sphere(22, 20, 13, 9, 'iIJ').rect(9, 16, 26, 4, 'i');
  s.rect(6, 17, 3, 3, 'i').rect(35, 17, 3, 3, 'i');
  s.ellipse(22, 14, 12, 3.5, 'k');
  for (const [x, y] of [
    [16, 14],
    [21, 13],
    [26, 15],
    [19, 16],
    [29, 13],
  ] as const) {
    s.set(x, y, 'g');
  }
  s.set(24, 14, 'r');
  s.line(28, 13, 34, 4, 'l').set(35, 3, 'l').set(34, 3, 'l');
  // The bowls, stacked.
  for (let i = 0; i < 3; i++) {
    const y = 24 - i * 3;
    s.rect(44, y, 12, 2, 'x')
      .rect(45, y + 2, 10, 1, 'x')
      .rect(44, y, 12, 1, 'X');
  }
  s.outline({
    w: 'b',
    W: 'b',
    c: 'q',
    o: 'q',
    C: 'q',
    i: 'e',
    I: 'e',
    J: 'e',
    k: 'e',
    l: 'e',
    x: 'B',
    X: 'B',
  });
  return s.toSource();
}

export const CHILI_TABLE: SpriteSource = drawChiliTable();

export const CHILI_TABLE_PALETTE: Palette = {
  '.': null,
  w: C.wood,
  W: C.rope,
  b: C.bark,
  c: C.cream,
  C: C.white,
  o: C.plum,
  q: ramp(C.plum)[0]!,
  i: C.iron,
  I: C.stoneDark,
  J: ramp(C.stoneDark)[3]!,
  e: C.ink,
  k: C.cream,
  g: C.leaf,
  r: C.scarlet,
  l: C.stone,
  x: C.pumpkin,
  X: C.pumpkinLight,
  B: C.pumpkinDark,
};

// ---- Her cat-o'-lantern, round the square ---------------------------------------------------------

/** Her carving out in the square on the 31st, as it stands at home, lit after dark. */
export const CAT_PUMPKIN_ART: PropArt = {
  source: CAT_LANTERN,
  palette: CRAFTED_ART.catLantern.palette,
  glow: CRAFTED_ART.catLantern.glow!,
  lights: CRAFTED_ART.catLantern.lights!,
  shadow: { w: 26, h: 6 },
};

// ---- Their photo, framed ---------------------------------------------------------------------------

/**
 * The photo Cody has framed (question 75): in a gold frame, a polaroid of the two of them at the
 * party by lamplight, a bug catcher in her hat with her net, and a butterfly with orange wings.
 */
function drawPhoto(): SpriteSource {
  const s = new Sketch(32, 32);
  s.rect(3, 2, 26, 28, 'f').rect(3, 2, 26, 1, 'F').rect(3, 29, 26, 1, 'g');
  s.rect(5, 4, 22, 24, 'x');
  s.rect(6, 5, 20, 17, 'n');
  s.rect(6, 19, 20, 3, 'd');
  s.set(9, 7, 'y').set(22, 8, 'y').set(15, 6, 'y');
  // Her, a bug catcher: a round hat, pink hair, a green shirt, and her net over her shoulder.
  s.rect(9, 10, 5, 2, 'h').rect(8, 12, 7, 1, 'h');
  s.rect(9, 13, 5, 3, 'k').rect(8, 13, 1, 4, 'p').rect(14, 13, 1, 4, 'p');
  s.set(10, 14, 'e').set(12, 14, 'e');
  s.rect(9, 16, 5, 4, 'm').rect(10, 20, 1, 2, 'e').rect(12, 20, 1, 2, 'e');
  s.line(14, 17, 17, 9, 'w');
  s.rect(16, 7, 3, 3, 'W');
  // Him, a butterfly: dark hair, orange wings either side, antennae.
  s.rect(19, 12, 4, 4, 'k').rect(19, 11, 4, 1, 'H');
  s.set(19, 10, 'e').set(22, 10, 'e').set(18, 9, 'e').set(23, 9, 'e');
  s.set(20, 13, 'e').set(22, 13, 'e');
  s.rect(17, 15, 3, 5, 'o').rect(23, 15, 3, 5, 'o').set(18, 17, 'e').set(24, 17, 'e');
  s.rect(20, 16, 2, 4, 'e').rect(20, 20, 1, 2, 'e').rect(22, 20, 1, 2, 'e');
  s.rect(21, 16, 1, 4, 'e');
  s.rect(7, 23, 18, 1, 'd');
  s.rect(9, 25, 14, 1, 'v');
  s.outline({ f: 'g', F: 'g' });
  return s.toSource();
}

export const HALLOWEEN_PHOTO_ART: FurnitureArt = {
  source: drawPhoto(),
  palette: {
    '.': null,
    f: C.gold,
    F: C.candle,
    g: C.goldShade,
    x: C.white,
    n: ramp(C.lavender)[0]!,
    d: ramp(C.moss)[0]!,
    y: C.candle,
    h: C.cream,
    k: C.skin,
    p: C.hairPink,
    e: C.ink,
    m: C.moss,
    w: C.wood,
    W: C.ghost,
    H: C.ink,
    o: C.monarch,
    v: C.stone,
  },
};
