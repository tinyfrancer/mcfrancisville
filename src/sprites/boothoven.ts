import type { FixtureId, FurnitureId } from '../types/ids';
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
  INK,
  lightOf,
  lightWall,
  ROOF,
  shadeOf,
  step,
  TRIM,
  WALL,
  wall,
  wallLamp,
  WHITE,
  window,
} from './buildings';
import type { FurnitureArt } from './furniture';
import { FIRE, FIRE_LIGHT, FIRE_LIT, frame, palette, slab, WOOD } from './furnish';
import type { FixtureArt } from './interiors';
import { PALETTE as C } from './palette';
import { Sketch } from './sketch';
import type { Palette } from './sprite';

/*
 * Boothoven's (0.2's L1): his tall townhouse east of the square, from the building kit like
 * everyone else's, the grand piano in his parlour, his keepsakes, and the metronome he gives her.
 */

/** Five lines of a stave, `w` long, two pixels apart, with a few notes sat on them. */
function stave(s: Sketch, x: number, y: number, w: number, line: string, note: string): void {
  for (let k = 0; k < 5; k++) s.rect(x, y + k * 2, w, 1, line);
  for (let i = 0; x + 4 + i * 7 < x + w - 2; i++) {
    const nx = x + 4 + i * 7;
    const ny = y + ((i * 3) % 5) * 2;
    s.rect(nx, ny, 2, 2, note).rect(nx + 2, ny - 5, 1, 6, note);
  }
}

// ---- His house --------------------------------------------------------------------------------

/**
 * A tall, narrow townhouse in plum plaster under a steep slate gable: a round window up top, a
 * stave of music painted along its band, a pointed door and window, and a quaver for a weather
 * vane.
 */
function drawHouse(): Drawn {
  const W = 144;
  const H = 172;
  const s = new Sketch(W, H);
  const floor = H - 6;
  const cx = 72;
  chimney(s, 100, 28, 12, 56);
  gableRoof(s, cx, 16, 72, W - 4, 10, 'slate', 'shingles');
  // The quaver on its rod, over the peak.
  s.rect(cx, 2, 1, 15, INK);
  s.rect(cx - 4, 8, 5, 4, fillOf(ACCENT_TWO)).rect(cx, 0, 1, 9, fillOf(ACCENT_TWO));
  s.rect(cx + 1, 0, 3, 1, fillOf(ACCENT_TWO)).rect(cx + 3, 1, 2, 2, fillOf(ACCENT_TWO));
  window(s, cx - 10, 38, 20, 20, { shape: 'round', panes: [2, 2] });
  wall(s, 16, 72, W - 32, floor - 72, 'plaster', undefined, 7);
  lightWall(s, 16, 72, W - 32, floor - 72, 4);
  footing(s, 14, floor - 5, W - 28, 5);
  // The band of music under the eaves.
  s.rect(18, 76, W - 36, 14, fillOf(ACCENT)).rect(18, 76, W - 36, 1, lightOf(ACCENT));
  stave(s, 22, 79, W - 44, darkOf(ACCENT), fillOf(ACCENT_TWO));
  const front = door(s, 56, floor, 30, 56, { shape: 'pointed', knob: 'right' });
  window(s, 90, 96, 24, 36, { shape: 'pointed', panes: [1, 2], sill: true, curtains: true });
  window(s, 22, 98, 12, 26, { shape: 'pointed', panes: [1, 2] });
  wallLamp(s, 76, 100);
  step(s, 56, H, 36, 6);
  return { source: finish(s), door: front };
}

export const BOOTHOVEN_HOUSE: Drawn = drawHouse();

export const BOOTHOVEN_HOUSE_PALETTE: Palette = buildingPalette({
  wall: C.plum,
  roof: C.stoneDark,
  trim: C.cream,
  door: C.navy,
  accent: C.navy,
  accentTwo: C.gold,
  leaves: C.leaf,
});

// ---- His grand piano --------------------------------------------------------------------------

const GRAND_PIANO = (() => {
  const s = new Sketch(96, 84);
  // The lid propped open, the case curving to its tail, the keys at the front, and a candle.
  for (let k = 0; k < 74; k++) {
    const y = 44 - Math.round(k * 0.42);
    s.rect(6 + k, y, 1, 3, fillOf(ROOF)).set(6 + k, y, lightOf(ROOF));
  }
  s.rect(62, 20, 1, 24, lightOf(TRIM));
  s.rect(4, 44, 70, 14, fillOf(ROOF)).ellipse(74, 51, 18, 7, fillOf(ROOF));
  s.rect(4, 44, 84, 1, lightOf(ROOF)).rect(4, 57, 84, 1, darkOf(ROOF));
  s.rect(4, 40, 30, 5, WHITE);
  for (const x of [6, 9, 15, 18, 21, 27, 30]) s.rect(x, 40, 2, 3, INK);
  s.rect(14, 28, 16, 11, WHITE);
  for (let k = 0; k < 4; k++) s.rect(15, 30 + k * 2, 14, 1, shadeOf(WALL));
  for (const x of [8, 44, 80]) slab(s, x, 58, 5, 26, ROOF);
  s.rect(24, 58, 3, 18, fillOf(ACCENT_TWO)).rect(21, 76, 9, 2, fillOf(ACCENT_TWO));
  s.rect(50, 34, 3, 9, WHITE).set(51, 31, FIRE_LIGHT).set(51, 32, FIRE).set(51, 33, FIRE);
  return finish(s);
})();

export const BOOTHOVEN_FIXTURE_ART: Pick<Record<FixtureId, FixtureArt>, 'grandPiano'> = {
  grandPiano: {
    source: GRAND_PIANO,
    palette: palette({ ...WOOD, roof: C.inkFabric, trim: C.gold, accentTwo: C.gold }),
    glow: FIRE_LIT,
    lights: [{ x: 51, y: 32, radius: 22 }],
  },
};

// ---- His pieces -------------------------------------------------------------------------------

const MUSIC_STAND = (() => {
  const s = new Sketch(32, 48);
  // A brass pole on three feet, a slanted desk at the top, and a page open on it.
  s.rect(15, 18, 2, 26, fillOf(ACCENT_TWO)).rect(15, 18, 1, 26, lightOf(ACCENT_TWO));
  for (const dx of [-7, 0, 7]) {
    for (let j = 0; j < 6; j++) s.set(16 + Math.round((dx * j) / 6), 42 + j, fillOf(ACCENT_TWO));
  }
  slab(s, 4, 6, 24, 14, ACCENT_TWO);
  s.rect(6, 4, 20, 13, WHITE);
  stave(s, 7, 7, 18, shadeOf(WALL), INK);
  return finish(s);
})();

const SHEET_MUSIC = (() => {
  const s = new Sketch(32, 32);
  frame(s, 1, 1, 30, 30, TRIM, 3);
  s.rect(4, 4, 24, 24, WHITE);
  stave(s, 5, 8, 22, shadeOf(WALL), INK);
  stave(s, 5, 19, 22, shadeOf(WALL), INK);
  // The note circled three times.
  s.ellipse(19, 21, 4, 4, fillOf(ACCENT));
  s.ellipse(19, 21, 3, 3, WHITE).rect(18, 21, 2, 2, INK);
  return finish(s);
})();

const METRONOME = (() => {
  const s = new Sketch(32, 34);
  // A wooden pyramid, its face cut away to show the arm swung over, with its little weight.
  for (let y = 4; y < 32; y++) {
    const half = 3 + Math.round((y - 4) * 0.36);
    s.rect(16 - half, y, half * 2, 1, fillOf(DOOR));
    s.set(16 - half, y, lightOf(DOOR)).set(15 + half, y, shadeOf(DOOR));
  }
  s.rect(6, 31, 20, 3, darkOf(DOOR));
  for (let y = 10; y < 28; y++) s.rect(14, y, 4, 1, shadeOf(DOOR));
  for (let k = 0; k < 20; k++) s.set(16 + Math.round(k * 0.35), 27 - k, fillOf(ACCENT_TWO));
  s.rect(18, 13, 4, 3, lightOf(ACCENT_TWO));
  return finish(s);
})();

export const BOOTHOVEN_PIECES_ART: Pick<
  Record<FurnitureId, FurnitureArt>,
  'musicStand' | 'sheetMusic' | 'metronome'
> = {
  musicStand: {
    source: MUSIC_STAND,
    palette: palette({ ...WOOD, accentTwo: C.gold }),
  },
  sheetMusic: {
    source: SHEET_MUSIC,
    palette: palette({ ...WOOD, trim: C.gold, accent: C.scarlet }),
  },
  metronome: {
    source: METRONOME,
    palette: palette({ ...WOOD, door: C.wood, accentTwo: C.gold }),
  },
};
