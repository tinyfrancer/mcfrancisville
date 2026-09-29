import { PALETTE as C } from './palette';
import { CLEAR, Sketch } from './sketch';
import type { Palette, SpriteSource } from './sprite';
import {
  ACCENT,
  ACCENT_TWO,
  buildingPalette,
  chimney,
  darkOf,
  DOOR,
  door,
  type Drawn,
  fillOf,
  finish,
  footing,
  gableRoof,
  GLASS,
  GLASS_DARK,
  GLINT,
  INK,
  LAMP,
  LEAVES,
  letters,
  lettersWidth,
  lightOf,
  lightWall,
  ROOF,
  shadeOf,
  signBoard,
  STONE,
  step,
  TRIM,
  WALL,
  wall,
  wallLamp,
  window,
} from './buildings';

/*
 * The newcomers' houses (phase T), from the building kit like everyone else's, each after its
 * owner: Ollie's little red post cottage, Nessa's boathouse, Gourdon's pumpkin and Hazel's
 * observatory. They stand on their lots only once their owners move in; until then a sign does.
 */

function sign(s: Sketch, text: string, cx: number, y: number, key: string): void {
  letters(s, text, Math.round(cx - lettersWidth(text) / 2), y, key);
}

// ---- Ollie's cottage --------------------------------------------------------------------------

/**
 * Ollie's cottage, the post office: little and red, in clapboard under a navy gable, with a round
 * window in the gable, a sign over the door, a letter box in it, and a red pillar box by the step.
 */
function drawOllie(): Drawn {
  const W = 144;
  const H = 150;
  const s = new Sketch(W, H);
  const floor = H - 6;
  chimney(s, 100, 20, 12, 60);
  gableRoof(s, 72, 12, 66, W - 4, 10, 'slate', 'boards');
  wall(s, 16, 66, W - 32, floor - 66, 'boards', undefined, 5);
  lightWall(s, 16, 66, W - 32, floor - 66, 4);
  footing(s, 14, floor - 5, W - 28, 5);
  window(s, 64, 34, 16, 16, { shape: 'round', panes: [2, 2] });
  signBoard(s, 34, 72, 44, 11);
  sign(s, 'POST', 56, 75, darkOf(TRIM));
  const front = door(s, 56, floor, 30, 54, { light: true, knob: 'right' });
  // The letter box, brass, across the middle of the door.
  s.rect(49, floor - 26, 14, 3, darkOf(TRIM)).rect(50, floor - 25, 12, 1, LAMP);
  window(s, 90, 90, 24, 24, { panes: [2, 2], box: true, curtains: true });
  // A red pillar box by the step, with its slot and a little cap.
  const px = 24;
  s.rect(px, floor - 28, 12, 28, fillOf(ACCENT)).ellipse(px + 6, floor - 28, 6, 4, fillOf(ACCENT));
  s.rect(px, floor - 28, 2, 28, lightOf(ACCENT)).rect(px + 10, floor - 28, 2, 28, shadeOf(ACCENT));
  s.rect(px + 2, floor - 22, 8, 2, INK).rect(px + 1, floor - 4, 10, 4, darkOf(ACCENT));
  wallLamp(s, 76, 92);
  step(s, 56, H, 38, 6);
  return { source: finish(s), door: front };
}

export const OLLIE_HOUSE: Drawn = drawOllie();

export const OLLIE_HOUSE_PALETTE: Palette = buildingPalette({
  wall: C.berry,
  roof: C.navy,
  trim: C.cream,
  door: C.navy,
  accent: C.scarlet,
  accentTwo: C.cream,
  leaves: C.leaf,
});

// ---- Nessa's boathouse ------------------------------------------------------------------------

/**
 * Nessa's boathouse on the shore: teal boards on stone piers under a steep mossy gable, a round
 * porthole up top, lanterns either side of the door, and an oar leaning by it.
 */
function drawNessa(): Drawn {
  const W = 144;
  const H = 156;
  const s = new Sketch(W, H);
  const floor = H - 8;
  gableRoof(s, 72, 4, 70, W - 2, 11, 'shingles', 'boards');
  wall(s, 14, 70, W - 28, floor - 70, 'boards', undefined, 7);
  lightWall(s, 14, 70, W - 28, floor - 70, 5);
  // Stone piers under the boards, as though the lake might come up to visit.
  for (const x of [14, 62, 114]) s.rect(x, floor - 6, 16, 6, fillOf(STONE));
  footing(s, 14, floor - 6, W - 28, 2);
  window(s, 62, 30, 20, 20, { shape: 'round', panes: [1, 1] });
  signBoard(s, 88, 76, 42, 11);
  sign(s, 'LAMPS', 109, 79, darkOf(TRIM));
  const front = door(s, 56, floor, 30, 56, { shape: 'arch', knob: 'right' });
  window(s, 92, 98, 22, 24, { panes: [1, 2], sill: true });
  wallLamp(s, 30, 92);
  wallLamp(s, 78, 92);
  // An oar leaning on the wall, blade down.
  for (let j = 0; j < 48; j++) s.set(22 + Math.floor(j / 8), floor - 50 + j, fillOf(TRIM));
  s.ellipse(29, floor - 6, 3, 7, fillOf(ACCENT));
  step(s, 56, H, 36, 8);
  return { source: finish(s), door: front };
}

export const NESSA_HOUSE: Drawn = drawNessa();

export const NESSA_HOUSE_PALETTE: Palette = buildingPalette({
  wall: C.teal,
  roof: C.moss,
  trim: C.cream,
  door: C.navy,
  accent: C.tealLight,
  accentTwo: C.gold,
  leaves: C.leaf,
});

// ---- Gourdon's pumpkin ------------------------------------------------------------------------

/**
 * Gourdon's house is a pumpkin: a great ribbed round one, its stem for a chimney with a leaf
 * curling off it, two carved triangle eyes for windows, a grin carved above a round door, and a
 * little stone step. The eyes and the grin glow after dark, like its owner.
 */
function drawGourdon(): Drawn {
  const W = 176;
  const H = 158;
  const s = new Sketch(W, H);
  const floor = H - 6;
  const cx = 88;
  // The ribs, a lobe at a time from the back ones in, each its own sphere.
  const lobes: [number, number][] = [
    [-52, 26],
    [52, 26],
    [-30, 32],
    [30, 32],
    [0, 36],
  ];
  const ramp = `${shadeOf(ROOF)}${fillOf(ROOF)}${lightOf(ROOF)}`;
  for (const [dx, rx] of lobes) s.sphere(cx + dx, 94, rx, 56, ramp);
  // Grooves between the lobes, darker where they tuck under.
  for (const dx of [-42, -16, 16, 42]) {
    for (let j = 44; j < 146; j++) {
      const bow = Math.round(Math.sin(((j - 44) / 102) * Math.PI) * (dx > 0 ? 4 : -4));
      if (s.get(cx + dx + bow, j) !== CLEAR) s.set(cx + dx + bow, j, darkOf(ROOF));
    }
  }
  // The stem, with a curling leaf, and a stovepipe beside it for the smoke.
  s.rect(cx - 6, 20, 12, 22, fillOf(LEAVES)).rect(cx - 6, 20, 3, 22, lightOf(LEAVES));
  s.rect(cx + 3, 20, 3, 22, shadeOf(LEAVES)).rect(cx - 8, 18, 16, 4, fillOf(LEAVES));
  s.ellipse(cx - 20, 34, 12, 6, fillOf(LEAVES)).ellipse(cx - 20, 33, 8, 2, lightOf(LEAVES));
  s.rect(cx + 18, 22, 8, 26, fillOf(STONE)).rect(cx + 16, 20, 12, 3, darkOf(STONE));
  // Carved eyes for windows: triangles of candlelit glass.
  for (const ex of [cx - 36, cx + 36]) {
    for (let j = 0; j < 18; j++) {
      const half = Math.round((j / 17) * 11);
      s.rect(ex - half, 68 + j, half * 2 + 1, 1, j === 0 ? GLASS_DARK : GLASS);
    }
    s.set(ex, 72, GLINT).set(ex - 1, 73, GLINT);
  }
  // A wide carved grin, curling up at its ends, with the door in the middle of it and two teeth
  // left standing either side.
  for (let i = -50; i <= 50; i++) {
    const t = (i / 50) ** 2;
    const y = 96 + Math.round((1 - t) * 14);
    const tooth = Math.abs(Math.abs(i) - 28) <= 2;
    s.rect(cx + i, y - (tooth ? 0 : 2), 1, tooth ? 3 : 7 - Math.round(t * 3), GLASS);
  }
  const front = door(s, cx, floor, 30, 54, { shape: 'arch', knob: 'left' });
  footing(s, 34, floor - 4, W - 68, 4);
  step(s, cx, H, 38, 6);
  return { source: finish(s), door: front };
}

export const GOURDON_HOUSE: Drawn = drawGourdon();

export const GOURDON_HOUSE_PALETTE: Palette = buildingPalette({
  wall: C.pumpkin,
  roof: C.pumpkin,
  trim: C.bark,
  door: C.bark,
  leaves: C.leafDark,
  glass: C.pumpkinDark,
});

// ---- Hazel's observatory ----------------------------------------------------------------------

/**
 * Hazel's observatory in the woods: a round stone cottage under a silver dome, its shutter open on
 * a telescope pointed up at the sky, gold stars painted round the band, and a moon on the door.
 */
function drawHazel(): Drawn {
  const W = 144;
  const H = 164;
  const s = new Sketch(W, H);
  const floor = H - 6;
  const cx = 72;
  // The telescope first, so the dome sits over its foot.
  for (let k = 0; k < 40; k++) {
    const x = cx + 10 + k;
    const y = 44 - Math.round(k * 0.8);
    s.rect(x, y, 2, 7, fillOf(ACCENT_TWO));
    s.set(x, y, lightOf(ACCENT_TWO));
  }
  s.rect(cx + 46, 6, 7, 9, darkOf(ACCENT_TWO));
  s.sphere(cx, 64, 58, 50, `${shadeOf(ROOF)}${fillOf(ROOF)}${lightOf(ROOF)}`);
  s.rect(0, 64, W, 60, CLEAR);
  // The shutter's slot, open to the sky.
  s.rect(cx + 6, 20, 10, 44, darkOf(ROOF));
  s.rect(10, 62, W - 20, 8, fillOf(ACCENT)).rect(10, 62, W - 20, 1, lightOf(ACCENT));
  for (let x = 20; x < W - 20; x += 16) s.set(x, 65, fillOf(ACCENT_TWO)).set(x + 1, 66, LAMP);
  wall(s, 18, 70, W - 36, floor - 70, 'stone', undefined, 9);
  lightWall(s, 18, 70, W - 36, floor - 70, 5);
  footing(s, 16, floor - 5, W - 32, 5);
  const front = door(s, 56, floor, 30, 56, { shape: 'arch', knob: 'right' });
  // A crescent moon on the door.
  s.ellipse(56, floor - 38, 5, 5, fillOf(ACCENT_TWO)).ellipse(58, floor - 39, 4, 4, fillOf(DOOR));
  window(s, 90, 86, 22, 28, { shape: 'arch', panes: [1, 2], sill: true });
  // Stars on the stone, as though some fell off the sky and stuck.
  for (const [x, y] of [
    [30, 82],
    [98, 128],
    [118, 80],
  ] as const) {
    s.set(x, y, fillOf(ACCENT_TWO))
      .set(x - 1, y + 1, fillOf(ACCENT_TWO))
      .set(x + 1, y + 1, fillOf(ACCENT_TWO))
      .set(x, y + 1, lightOf(ACCENT_TWO))
      .set(x, y + 2, fillOf(ACCENT_TWO));
  }
  wallLamp(s, 76, 96);
  step(s, 56, H, 36, 6);
  return { source: finish(s), door: front };
}

export const HAZEL_HOUSE: Drawn = drawHazel();

export const HAZEL_HOUSE_PALETTE: Palette = buildingPalette({
  wall: C.stoneLight,
  roof: C.silver,
  trim: C.bark,
  door: C.navy,
  accent: C.navy,
  accentTwo: C.gold,
  leaves: C.leaf,
});

// ---- The lot, until someone moves in ------------------------------------------------------------

/** A board on a post, saying what's to come of the lot, and a little house painted on it. */
function drawLotSign(word: string, sold: boolean): SpriteSource {
  const s = new Sketch(32, 40);
  s.rect(14, 20, 4, 20, fillOf(TRIM)).rect(14, 20, 1, 20, lightOf(TRIM));
  signBoard(s, 2, 4, 28, 20);
  // A little house: a roof and a door.
  for (let j = 0; j < 4; j++) s.rect(12 - j, 7 + j, 8 + j * 2, 1, fillOf(ROOF));
  s.rect(11, 11, 10, 4, fillOf(WALL)).rect(15, 12, 2, 3, fillOf(DOOR));
  sign(s, word, 16, 17, darkOf(TRIM));
  if (sold) {
    // A red ribbon across the corner.
    for (let k = 0; k < 10; k++) s.rect(20 + k, 4 + k, 3, 1, fillOf(ACCENT));
  }
  return finish(s);
}

export const LOT_SIGN = drawLotSign('SOON', false);
export const SOLD_SIGN = drawLotSign('SOLD', true);

/** Moving day: boxes stacked by the door, taped up, one of them a bit open. */
function drawBoxes(): SpriteSource {
  const s = new Sketch(32, 34);
  const box = (x: number, y: number, w: number, h: number) => {
    s.rect(x, y, w, h, fillOf(TRIM))
      .rect(x, y, w, 1, lightOf(TRIM))
      .rect(x, y, 1, h, lightOf(TRIM));
    s.rect(x + w - 1, y, 1, h, shadeOf(TRIM));
    s.rect(x + Math.floor(w / 2) - 1, y, 2, h, fillOf(ACCENT_TWO));
  };
  box(1, 16, 16, 18);
  box(16, 20, 15, 14);
  box(5, 2, 14, 14);
  // The top box's flaps, a little open.
  s.rect(4, 1, 5, 2, lightOf(TRIM)).rect(15, 1, 5, 2, lightOf(TRIM));
  return finish(s);
}

export const MOVING_BOXES = drawBoxes();

export const LOT_PALETTE: Palette = buildingPalette({
  wall: C.cream,
  roof: C.plum,
  trim: C.wood,
  door: C.berry,
  accent: C.scarlet,
  accentTwo: C.rope,
});

/** The keys of Gourdon's carved face, which glow like a jack-o'-lantern after dark. */
export const GOURDON_GLOW: Palette = { [GLASS]: C.candle, [GLASS_DARK]: C.pumpkinLight };
