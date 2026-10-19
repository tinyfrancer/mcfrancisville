import { mix, PALETTE as C, ramp } from './palette';
import { CLEAR, Sketch } from './sketch';
import type { Palette, SpriteSource } from './sprite';

/*
 * What stands in the places beyond the town (phase I), drawn at 32: Whisperwood's toadstools,
 * Lantern Shore's floating lanterns, reeds and rowboat, the mound in the hidden clearing, and the
 * stone posts of the castle hill's gate, with the gate that hangs between them.
 */

// ---- Toadstools --------------------------------------------------------------------------------

/** Where each toadstool in a clump stands: its foot, its cap's half-width, and its height. */
const TOADSTOOLS: readonly (readonly [number, number, number, number])[] = [
  [11, 30, 9, 16],
  [24, 31, 6, 11],
  [27, 19, 4, 7],
];

/**
 * A clump of toadstools: round caps lit from the top left, pale spots on them (which glow after
 * dark, so a trail of them can be followed by night), on cream stems with a frill.
 */
function drawToadstools(): SpriteSource {
  const s = new Sketch(32, 32);
  for (const [x, foot, r, h] of TOADSTOOLS) {
    const capY = foot - h;
    s.rect(x - Math.ceil(r / 3), capY + 2, Math.ceil(r / 3) * 2, h - 2, 't');
    s.rect(x - Math.ceil(r / 3) - 1, foot - 1, Math.ceil(r / 3) * 2 + 2, 1, 't');
    s.set(x - Math.ceil(r / 3), capY + 2, 'T');
    s.rect(x - Math.ceil(r / 3) - 1, capY + Math.round(h / 2), Math.ceil(r / 3) * 2 + 2, 1, 'f');
  }
  for (const [x, foot, r, h] of TOADSTOOLS) {
    const capY = foot - h;
    const cap = new Sketch(32, 32);
    cap.sphere(x, capY + 2, r, r * 0.8, 'rcCL');
    for (let y = capY + 2; y < 32; y++) for (let i = 0; i < 32; i++) cap.set(i, y, CLEAR);
    cap.rect(x - r + 1, capY + 2, r * 2 - 2, 1, 'r');
    s.stamp(cap, 0, 0);
    s.set(x - Math.round(r / 2), capY - 1, 's').set(x + Math.round(r / 3), capY - 2, 's');
    if (r > 4) s.set(x + Math.round(r / 2) + 1, capY, 's').set(x - 1, capY - 3, 's');
  }
  s.outline({ r: 'o', c: 'o', C: 'o', L: 'o', t: 'u', T: 'u', f: 'u', s: 'o' });
  return s.toSource();
}

/** A clump once it's been picked for the day: little stubs, grown back by tomorrow. */
function drawStubs(): SpriteSource {
  const s = new Sketch(32, 32);
  for (const [x, foot] of TOADSTOOLS) s.rect(x - 1, foot - 3, 3, 3, 't').set(x - 1, foot - 3, 'T');
  s.outline({ t: 'u', T: 'u' });
  return s.toSource();
}

export const TOADSTOOLS_ART: SpriteSource = drawToadstools();
export const TOADSTOOL_STUBS: SpriteSource = drawStubs();

function toadstoolPalette(cap: string): Palette {
  const [o, r, c, C2, L] = ramp(cap);
  return {
    [CLEAR]: null,
    o: o!,
    r: r!,
    c: c!,
    C: C2!,
    L: L!,
    s: C.white,
    t: C.cream,
    T: C.white,
    f: C.creamShade,
    u: ramp(C.creamShade)[0]!,
  };
}

/** Red caps, and here and there a dusky plum clump. */
export const TOADSTOOL_VARIANTS: readonly Palette[] = [
  toadstoolPalette(C.toadstool),
  toadstoolPalette(C.plumLight),
];

/** The spots glow a soft green by night. */
export const TOADSTOOL_GLOW: Palette = { s: C.orbGreenLight };

// ---- Lantern Shore ------------------------------------------------------------------------------

/**
 * A paper lantern afloat on a lily pad, bobbing on the lake: plum paper in ribs, a candle inside
 * that lights it after dark, a little handle on top.
 */
function drawFloatLantern(): SpriteSource {
  const s = new Sketch(32, 32);
  s.ellipse(16, 26, 12, 4.5, 'g').ellipse(16, 25, 10, 3, 'G');
  s.line(16, 26, 23, 24, 'd');
  s.sphere(16, 15, 7, 8, 'PpyY');
  for (const x of [12, 16, 20])
    for (let y = 8; y < 23; y++)
      if (s.get(x, y) !== undefined && s.get(x, y) !== CLEAR) s.set(x, y, 'r');
  s.rect(12, 6, 9, 2, 'k').rect(12, 22, 9, 2, 'k');
  s.line(14, 5, 16, 3, 'k').line(16, 3, 18, 5, 'k');
  s.outline({ P: 'o', p: 'o', y: 'o', Y: 'o', r: 'o', k: 'o', g: 'D', G: 'D' });
  return s.toSource();
}

export const FLOAT_LANTERN: SpriteSource = drawFloatLantern();

export const FLOAT_LANTERN_PALETTE: Palette = {
  [CLEAR]: null,
  o: C.ink,
  P: ramp(C.plum)[1]!,
  p: C.plum,
  y: C.plumLight,
  Y: ramp(C.plumLight)[3]!,
  r: ramp(C.plum)[0]!,
  k: C.iron,
  g: C.leafDark,
  G: C.leaf,
  d: ramp(C.leafDark)[0]!,
  D: ramp(C.leafDark)[0]!,
};

export const FLOAT_LANTERN_GLOW: Palette = {
  P: C.pumpkin,
  p: C.candle,
  y: C.candleBright,
  Y: C.white,
};

/** Cattails at the water's edge: a few tall blades and brown cat's-tail heads. */
function drawReeds(): SpriteSource {
  const s = new Sketch(32, 48);
  const stems: readonly (readonly [number, number, number])[] = [
    [7, 20, -1],
    [12, 10, 0],
    [17, 16, 1],
    [22, 8, 0],
    [26, 22, 1],
  ];
  for (const [x, top, lean] of stems) {
    s.line(x, 46, x + lean, top, 'l');
    s.rect(x + lean - 1, top, 3, 7, 'b').set(x + lean - 1, top, 'B');
    s.line(x + lean, top - 1, x + lean, top - 3, 'l');
  }
  for (const [x0, x1, top] of [
    [4, 1, 28],
    [10, 8, 24],
    [15, 18, 26],
    [24, 29, 30],
    [20, 21, 20],
  ] as const) {
    s.line(x0 + 2, 46, x1, top, 'L').line(x0 + 3, 46, x1 + 1, top + 2, 'l');
  }
  s.outline({ l: 'o', L: 'o', b: 'k', B: 'k' });
  return s.toSource();
}

export const REEDS: SpriteSource = drawReeds();

export const REEDS_PALETTE: Palette = {
  [CLEAR]: null,
  o: ramp(C.leafDark)[0]!,
  l: C.leafDark,
  L: C.leaf,
  b: C.bark,
  B: ramp(C.bark)[3]!,
  k: C.barkDark,
};

/**
 * A rowboat tied up by the pier, side on: a plum-painted hull with a light gunwale, two seats, and
 * an oar resting across it. Two and a bit tiles long and near a tile deep, big enough for two
 * (V1's L6: at two tiles it read as a toy beside the pier); it reaches off its footprint to the
 * right, never left over the pier it's tied to.
 */
function drawRowboat(): SpriteSource {
  const s = new Sketch(80, 40);
  const cx = 43;
  // The hull, from above and a little in front: an elongated bowl.
  s.ellipse(cx, 22, 34, 12, 'h');
  s.ellipse(cx, 19, 29, 8, 'i');
  s.rect(cx - 34, 22, 69, 1, 'H');
  s.sphere(cx, 28, 34, 7, 'qhh');
  for (let y = 0; y < 40; y++)
    for (let x = 0; x < 80; x++) if (y < 22 && s.get(x, y) === 'q') s.set(x, y, 'h');
  s.ellipse(cx, 19, 29, 8, 'i');
  s.rect(cx - 15, 13, 5, 12, 'w').rect(cx + 10, 13, 5, 12, 'w');
  s.rect(cx - 15, 13, 5, 1, 'W').rect(cx + 10, 13, 5, 1, 'W');
  s.line(cx - 26, 12, cx + 24, 25, 'w').line(cx - 26, 13, cx + 24, 26, 'W');
  s.ellipse(cx + 26, 26, 4, 2, 'w');
  s.bevel('h', 'H', null);
  s.outline({ h: 'o', H: 'o', q: 'o', i: 'o', w: 'k', W: 'k' });
  // The water lapping at its waterline.
  for (let x = cx - 30; x < cx + 30; x += 5) s.set(x, 35, 'l').set(x + 1, 35, 'l');
  return s.toSource();
}

export const ROWBOAT: SpriteSource = drawRowboat();

export const ROWBOAT_PALETTE: Palette = {
  [CLEAR]: null,
  o: ramp(C.plum)[0]!,
  q: ramp(C.plum)[1]!,
  h: C.plum,
  H: C.plumLight,
  i: C.barkDark,
  w: C.wood,
  W: ramp(C.wood)[3]!,
  k: C.barkDark,
  l: ramp(C.water)[3]!,
};

// ---- The hidden clearing --------------------------------------------------------------------------

/**
 * A mound of fresh earth with something glinting in it: where a thing is buried. Pebbles round
 * its foot, a tuft on top, and a star of light winking from the soil.
 */
function drawMound(): SpriteSource {
  const s = new Sketch(32, 32);
  s.sphere(16, 25, 13, 7, 'kedE');
  s.rect(3, 25, 27, 4, 'e').ellipse(16, 27, 13, 3, 'e');
  s.sphere(16, 24, 11, 6, 'kedE');
  for (const [x, y] of [
    [5, 28],
    [26, 27],
    [9, 29],
  ] as const) {
    s.ellipse(x, y, 1.5, 1.2, 'p').set(x - 1, y - 1, 'P');
  }
  s.set(15, 17, 'g').set(16, 16, 'G').set(17, 17, 'g').set(14, 16, 'G');
  s.set(20, 22, 'y').set(21, 22, 'Y').set(21, 21, 'y').set(22, 22, 'y').set(21, 23, 'y');
  s.outline({ k: 'o', e: 'o', d: 'o', E: 'o', p: 'o', P: 'o' });
  return s.toSource();
}

/** The same spot once it's been dug: a little hole with the earth piled beside it. */
function drawDug(): SpriteSource {
  const s = new Sketch(32, 32);
  s.sphere(22, 26, 7, 4, 'kedE');
  s.ellipse(12, 26, 7, 3.5, 'k').ellipse(12, 27, 5, 2, 'o');
  s.outline({ k: 'o', e: 'o', d: 'o', E: 'o' });
  return s.toSource();
}

export const MOUND: SpriteSource = drawMound();
export const DUG: SpriteSource = drawDug();

export const MOUND_PALETTE: Palette = {
  [CLEAR]: null,
  o: ramp(C.soilDark)[0]!,
  k: C.soilDark,
  e: C.soil,
  d: C.soilLight,
  E: ramp(C.soilLight)[3]!,
  p: C.stone,
  P: C.stoneLight,
  g: C.leafDark,
  G: C.leafLight,
  y: C.candle,
  Y: C.candleBright,
};

/** Its glint twinkles gold after dark. */
export const MOUND_GLOW: Palette = { y: C.candle, Y: C.candleBright };

// ---- The castle hill's gate -------------------------------------------------------------------------

/** A gatepost of grey stone blocks, capped, with an iron monarch butterfly on top. */
function drawGatePost(): SpriteSource {
  const s = new Sketch(32, 72);
  s.rect(7, 24, 18, 46, 's');
  for (let y = 24; y < 70; y += 8) {
    s.rect(7, y + 7, 18, 1, 'k');
    const off = (y / 8) % 2 === 0 ? 13 : 18;
    s.rect(off, y, 1, 7, 'k');
  }
  s.bevel('s', 'S', 'd');
  s.rect(4, 18, 24, 6, 'c').rect(4, 18, 24, 1, 'C').rect(4, 23, 24, 1, 'd');
  // The butterfly on its cap, wings up.
  s.ellipse(12, 10, 4, 5, 'm').ellipse(20, 10, 4, 5, 'm');
  s.ellipse(13, 15, 3, 2.5, 'm').ellipse(19, 15, 3, 2.5, 'm');
  s.rect(15, 8, 2, 10, 'i');
  s.set(11, 9, 'M').set(21, 9, 'M').set(12, 14, 'M').set(20, 14, 'M');
  s.outline({ s: 'o', S: 'o', d: 'o', k: 'o', c: 'o', C: 'o', m: 'i', M: 'i', i: 'o' });
  return s.toSource();
}

export const GATE_POST: SpriteSource = drawGatePost();

export const GATE_POST_PALETTE: Palette = {
  [CLEAR]: null,
  o: ramp(C.stone)[0]!,
  d: C.stoneDark,
  k: C.stoneDark,
  s: C.stone,
  S: C.stoneLight,
  c: C.stoneLight,
  C: ramp(C.stoneLight)[4]!,
  i: C.iron,
  m: C.monarch,
  M: C.ink,
};

/**
 * The iron gate between the posts, two tiles wide: shut, two leaves of bars with a scroll along
 * the top and a padlock where they meet; open, the leaves swung back against the posts.
 */
function drawGate(open: boolean): SpriteSource {
  const s = new Sketch(64, 64);
  if (open) {
    for (const x0 of [0, 58]) {
      s.rect(x0, 18, 6, 44, 'i');
      for (let y = 22; y < 60; y += 6) s.rect(x0 + 1, y, 4, 1, 'I');
    }
  } else {
    for (let x = 2; x < 62; x += 6) s.rect(x, 20, 2, 42, 'i').set(x, 20, 'I');
    s.rect(0, 24, 64, 2, 'i').rect(0, 52, 64, 2, 'i');
    for (let x = 0; x < 64; x += 8)
      s.ellipse(x + 4, 22, 3, 3, 'i').ellipse(x + 4, 22, 1.5, 1.5, CLEAR);
    // The padlock, and the monarch on the middle of the scroll.
    s.rect(29, 34, 6, 7, 'y').rect(30, 31, 4, 3, 'i').rect(31, 32, 2, 2, CLEAR).set(29, 34, 'Y');
    s.ellipse(29, 14, 4, 5, 'm').ellipse(35, 14, 4, 5, 'm').rect(31, 12, 2, 9, 'i');
    s.set(28, 13, 'M').set(36, 13, 'M');
  }
  s.outline({ i: 'o', I: 'o', y: 'o', Y: 'o', m: 'o', M: 'o' });
  return s.toSource();
}

export const GATE_SHUT: SpriteSource = drawGate(false);
export const GATE_OPEN: SpriteSource = drawGate(true);

export const GATE_PALETTE: Palette = {
  [CLEAR]: null,
  o: ramp(C.iron)[0]!,
  i: C.iron,
  I: mix(C.iron, C.stoneLight, 0.4),
  y: C.gold,
  Y: ramp(C.gold)[4]!,
  m: C.monarch,
  M: C.ink,
};
