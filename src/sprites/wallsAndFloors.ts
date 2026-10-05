import type { SetFlooringId, WindowPaperId } from '../types/ids';
import type { WindowSky } from '../data/wallsAndFloors';
import {
  ACCENT,
  ACCENT_TWO,
  darkOf,
  fillOf,
  finish,
  GLINT,
  LEAVES,
  lightOf,
  shadeOf,
  STONE,
  TRIM,
  WHITE,
  type Colours,
} from './buildings';
import { palette } from './furnish';
import { mix, PALETTE as C } from './palette';
import { heart } from './sets';
import { Sketch } from './sketch';
import type { Palette, SpriteSource } from './sprite';
import type { SurfaceArt } from './surfaces';
import { halfDrop, SIZE, tile } from './tiling';

/*
 * The walls and floors that came with the second four sets (0.3's S4). A window wallpaper is a
 * calm paper, a tile repeated like any other, and a window hung on it every few tiles
 * (`windowsAlong`), drawn here for each look of the sky (`WindowSky`): the view through its glass
 * is a sky in three bands stepping into each other, hills along the bottom with a cottage on them,
 * and whatever the hour and the weather put there (clouds, the moon and stars, rain). The room's
 * light washes over it as over everything, so nothing in it is painted dark by hand but the night.
 */

// ---- The view through a window ------------------------------------------------------------------

/** The keys a view is painted in: three bands of sky, then what's in it, then the land. */
const SKY_TOP = '1';
const SKY_MID = '2';
const SKY_LOW = '3';
const STARS = '4';
const MOON = '5';
const CLOUD = '6';
const RAIN = '7';
const HILLS = '8';
const COTTAGE = '9';
const LIT = '0';

/** Each look's colours for those keys. */
const SKIES: Record<WindowSky, Palette> = {
  dawn: {
    1: C.lavender,
    2: C.roseLight,
    3: C.pumpkinLight,
    5: C.ghost,
    6: C.snapLight,
    8: C.moss,
    9: C.plum,
    0: C.candle,
  },
  day: {
    1: C.skyShade,
    2: C.sky,
    3: mix(C.sky, C.white, 0.45),
    6: C.white,
    8: C.leaf,
    9: C.berryLight,
    0: C.cream,
  },
  golden: {
    1: C.sky,
    2: C.pumpkinLight,
    3: C.candle,
    6: C.candleBright,
    8: C.moss,
    9: C.berry,
    0: C.candleBright,
  },
  dusk: {
    1: C.plum,
    2: C.rose,
    3: C.pumpkin,
    4: C.candleBright,
    6: C.roseLight,
    8: C.hedge,
    9: C.dusk,
    0: C.candle,
  },
  night: {
    1: C.night,
    2: C.dusk,
    3: C.navy,
    4: C.candleBright,
    5: C.ghost,
    8: C.hedgeDark,
    9: C.ink,
    0: C.candle,
  },
  rain: {
    1: C.stoneDark,
    2: C.stone,
    3: C.stoneLight,
    6: C.stoneLight,
    7: C.rain,
    8: C.mossDark,
    9: C.stoneDark,
    0: C.candle,
  },
  fog: {
    1: C.stoneLight,
    2: C.fog,
    3: C.white,
    6: C.white,
    8: C.stoneLight,
    9: C.stone,
    0: C.candleBright,
  },
  rainyNight: {
    1: C.night,
    2: C.dusk,
    3: C.navyShade,
    7: C.waterLight,
    8: C.hedgeDark,
    9: C.ink,
    0: C.candle,
  },
};

/** What each look has in its sky. */
const HAS: Record<WindowSky, { stars?: true; moon?: true; clouds?: true; rain?: true }> = {
  dawn: { moon: true, clouds: true },
  day: { clouds: true },
  golden: { clouds: true },
  dusk: { stars: true, clouds: true },
  night: { stars: true, moon: true },
  rain: { clouds: true, rain: true },
  fog: { clouds: true },
  rainyNight: { rain: true },
};

/** A box of glass: where the view is painted, and the test of whether a pixel is glass. */
interface Glass {
  x: number;
  y: number;
  w: number;
  h: number;
  inside: (i: number, j: number) => boolean;
}

/** Paints the view through `glass` as `sky` shows it. */
function view(s: Sketch, glass: Glass, sky: WindowSky): void {
  const { x, y, w, h, inside } = glass;
  const has = HAS[sky];
  const horizon = y + Math.round(h * 0.8);
  const hill = (i: number) =>
    horizon + Math.round(Math.sin((i - x) * 0.32) * 1.5 + Math.sin((i - x) * 0.11 + 1) * 1.5);
  const paint = (i: number, j: number, key: string) => {
    if (inside(i, j)) s.set(i, j, key);
  };
  for (let j = y; j < y + h; j++) {
    for (let i = x; i < x + w; i++) {
      const t = (j - y) / h;
      // Three bands, each stepping into the next over a dithered row.
      const first = t < 0.38 || (t < 0.42 && (i + j) % 2 === 0);
      const second = t < 0.64 || (t < 0.68 && (i + j) % 2 === 0);
      paint(i, j, first ? SKY_TOP : second ? SKY_MID : SKY_LOW);
    }
  }
  if (has.clouds) {
    for (const [cx, cy, rx] of [
      [0.3, 0.32, 0.22],
      [0.72, 0.5, 0.18],
    ] as const) {
      const px = x + w * cx;
      const py = y + h * cy;
      const r = Math.max(2, w * rx);
      for (let j = Math.floor(py - 2); j <= py + 1; j++) {
        for (let i = Math.floor(px - r); i <= px + r; i++) {
          const nx = (i + 0.5 - px) / r;
          const ny = (j + 0.5 - py) / 2;
          const puff = Math.abs(Math.sin((i - px) * 0.8)) * 0.6 + 0.5;
          if (nx * nx + (ny < 0 ? (ny / puff) ** 2 : ny * ny) <= 1) paint(i, j, CLOUD);
        }
      }
    }
  }
  if (has.stars) {
    for (let k = 0; k < Math.max(3, Math.round((w * h) / 90)); k++) {
      const i = x + ((k * 11 + 3) % w);
      const j = y + 1 + ((k * 7 + Math.floor(k / 3)) % Math.max(2, Math.round(h * 0.45)));
      paint(i, j, STARS);
      if (k % 4 === 1) {
        paint(i - 1, j, STARS);
        paint(i + 1, j, STARS);
        paint(i, j - 1, STARS);
        paint(i, j + 1, STARS);
      }
    }
  }
  if (has.moon) {
    const mx = x + Math.round(w * 0.7);
    const my = y + Math.max(3, Math.round(h * 0.18));
    for (let j = my - 3; j <= my + 3; j++) {
      for (let i = mx - 3; i <= mx + 3; i++) {
        const lit = (i + 0.5 - mx) ** 2 + (j + 0.5 - my) ** 2 <= 9;
        const bitten = (i + 0.5 - mx - 1.6) ** 2 + (j + 0.5 - my + 1) ** 2 <= 6;
        if (lit && !bitten) paint(i, j, MOON);
      }
    }
  }
  // The hills, and a cottage on them with its window.
  for (let i = x; i < x + w; i++) for (let j = hill(i); j < y + h; j++) paint(i, j, HILLS);
  if (w >= 14) {
    const cx = x + Math.round(w * 0.62);
    const base = hill(cx) + 1;
    for (let k = 0; k < 3; k++)
      for (let i = cx - k; i <= cx + 1 + k; i++) paint(i, base - 6 + k, COTTAGE);
    for (let j = base - 3; j < base + 1; j++)
      for (let i = cx - 2; i <= cx + 3; i++) paint(i, j, COTTAGE);
    paint(cx, base - 2, LIT);
    paint(cx + 1, base - 2, LIT);
  }
  if (has.rain) {
    for (let j = y; j < y + h; j++) {
      for (let i = x; i < x + w; i++) {
        // One across for four down, in broken streaks.
        if ((i * 4 + j) % 11 === 0 && (j + i) % 7 < 4) paint(i, j, RAIN);
      }
    }
  }
}

// ---- Window shapes ------------------------------------------------------------------------------

type Shape = 'square' | 'arch' | 'pointed' | 'round';

/** Inside a window's shape, `inset` pixels in: the building kit's, for glass with a view in it. */
function inShape(shape: Shape, x: number, y: number, w: number, h: number, inset: number) {
  return (i: number, j: number) => {
    if (i < x + inset || i >= x + w - inset || j < y + inset || j >= y + h - inset) return false;
    if (shape === 'square') return true;
    const rx = w / 2 - inset;
    const cx = x + w / 2;
    if (shape === 'round') {
      const ry = h / 2 - inset;
      const nx = (i + 0.5 - cx) / rx;
      const ny = (j + 0.5 - (y + h / 2)) / ry;
      return nx * nx + ny * ny <= 1;
    }
    if (shape === 'pointed') {
      const span = rx * 2;
      const spring = y + inset + Math.round(span * 0.87);
      if (j >= spring) return true;
      const dy = j + 0.5 - spring;
      const left = i + 0.5 - (cx - rx);
      const right = i + 0.5 - (cx + rx);
      return left * left + dy * dy <= span * span && right * right + dy * dy <= span * span;
    }
    const cy = y + w / 2;
    if (j >= cy) return true;
    const nx = (i + 0.5 - cx) / rx;
    const ny = (j + 0.5 - cy) / (w / 2 - inset);
    return nx * nx + ny * ny <= 1;
  };
}

interface Pane {
  shape: Shape;
  x: number;
  y: number;
  w: number;
  h: number;
  /** How thick the frame is round the glass. */
  frame: number;
  /** Panes across and down, divided by bars of the frame. */
  panes: [number, number];
}

/** A window's frame in `TRIM` and the view in its glass; returns the glass, for dressing it. */
function framed(s: Sketch, p: Pane, sky: WindowSky): Glass {
  const outer = inShape(p.shape, p.x, p.y, p.w, p.h, 0);
  const inner = inShape(p.shape, p.x, p.y, p.w, p.h, p.frame);
  for (let j = p.y; j < p.y + p.h; j++) {
    for (let i = p.x; i < p.x + p.w; i++) if (outer(i, j)) s.set(i, j, fillOf(TRIM));
  }
  const glass: Glass = {
    x: p.x + p.frame,
    y: p.y + p.frame,
    w: p.w - 2 * p.frame,
    h: p.h - 2 * p.frame,
    inside: inner,
  };
  view(s, glass, sky);
  // The frame lit on its top left, shaded on its bottom right, and the bars between the panes.
  for (let j = p.y; j < p.y + p.h; j++) {
    for (let i = p.x; i < p.x + p.w; i++) {
      if (!outer(i, j) || inner(i, j)) continue;
      if (!outer(i - 1, j) || !outer(i, j - 1)) s.set(i, j, lightOf(TRIM));
      else if (!outer(i + 1, j) || !outer(i, j + 1)) s.set(i, j, shadeOf(TRIM));
      else if (inner(i + 1, j) || inner(i, j + 1)) s.set(i, j, shadeOf(TRIM));
    }
  }
  const [across, down] = p.panes;
  for (let a = 1; a < across; a++) {
    const i = glass.x + Math.round((glass.w * a) / across) - 1;
    for (let j = glass.y; j < glass.y + glass.h; j++) if (inner(i, j)) s.set(i, j, fillOf(TRIM));
  }
  for (let d = 1; d < down; d++) {
    const j = glass.y + Math.round((glass.h * d) / down) - 1;
    for (let i = glass.x; i < glass.x + glass.w; i++) if (inner(i, j)) s.set(i, j, fillOf(TRIM));
  }
  // A glint across the top-left pane, so it reads as glass at any hour.
  for (let k = 0; k < 3; k++) {
    const i = glass.x + 2 + k;
    const j = glass.y + 4 - k + (p.shape === 'square' ? 0 : 3);
    if (inner(i, j) && s.get(i, j) !== fillOf(TRIM)) s.set(i, j, GLINT);
  }
  return glass;
}

/** A sill under a window, `w` wide, its top at `y`. */
function sill(s: Sketch, x: number, y: number, w: number): void {
  s.rect(x, y, w, 3, fillOf(TRIM)).rect(x, y, w, 1, lightOf(TRIM));
  s.rect(x + 1, y + 3, w - 2, 1, darkOf(TRIM));
}

// ---- The six windows ----------------------------------------------------------------------------

/** A window as it hangs: drawn for a sky, its bottom row this far down the wall. */
interface WindowShape {
  width: number;
  height: number;
  /** The row of the wall its bottom row is on, counted down from the top of the wall. */
  foot: number;
  draw: (s: Sketch, sky: WindowSky) => void;
}

/** A tall arched window in white, two panes across, a sill under it. */
const ARCH: WindowShape = {
  width: 32,
  height: 56,
  foot: 76,
  draw: (s, sky) => {
    framed(s, { shape: 'arch', x: 4, y: 1, w: 24, h: 50, frame: 2, panes: [2, 3] }, sky);
    sill(s, 2, 51, 28);
  },
};

/** A round porthole of a window in a brass ring, with rivets. */
const ROUND: WindowShape = {
  width: 34,
  height: 34,
  foot: 62,
  draw: (s, sky) => {
    framed(s, { shape: 'round', x: 1, y: 1, w: 32, h: 32, frame: 4, panes: [2, 2] }, sky);
    for (let k = 0; k < 8; k++) {
      const a = (k / 8) * Math.PI * 2 + Math.PI / 8;
      s.set(
        Math.round(16.5 + Math.cos(a) * 14 - 0.5),
        Math.round(16.5 + Math.sin(a) * 14 - 0.5),
        WHITE,
      );
    }
  },
};

/** A cottage window of leaded diamonds, gingham curtains tied back either side. */
const LATTICE: WindowShape = {
  width: 44,
  height: 50,
  foot: 74,
  draw: (s, sky) => {
    const glass = framed(
      s,
      { shape: 'square', x: 9, y: 5, w: 26, h: 38, frame: 2, panes: [1, 1] },
      sky,
    );
    // Lead in diamonds across the glass.
    for (let j = glass.y; j < glass.y + glass.h; j++) {
      for (let i = glass.x; i < glass.x + glass.w; i++) {
        const u = (i - glass.x + j - glass.y) % 7;
        const v = (i - glass.x - (j - glass.y) + 70) % 7;
        if (u === 0 || v === 0) s.set(i, j, darkOf(STONE));
      }
    }
    sill(s, 7, 43, 30);
    // The rod, and a gingham curtain either side, tied back at the middle.
    s.rect(2, 2, 40, 2, fillOf(ACCENT_TWO)).rect(2, 2, 40, 1, lightOf(ACCENT_TWO));
    for (const side of [0, 1]) {
      for (let j = 4; j < 48; j++) {
        const tied = j > 24 && j < 28;
        const w = tied ? 4 : j < 26 ? 9 - Math.floor((j - 4) / 5) : 4 + Math.floor((j - 28) / 5);
        for (let k = 0; k < w; k++) {
          const i = side === 0 ? 3 + k : 40 - k;
          const dark = Math.floor(i / 2) % 2 === 0;
          const band = Math.floor(j / 2) % 2 === 0;
          s.set(
            i,
            j,
            dark && band ? shadeOf(ACCENT) : dark || band ? fillOf(ACCENT) : lightOf(ACCENT),
          );
        }
      }
      const x = side === 0 ? 3 : 37;
      s.rect(x, 25, 4, 2, fillOf(ACCENT_TWO));
    }
  },
};

/** A pointed gothic window of dark wood, a round of tracery in its head. */
const GOTHIC: WindowShape = {
  width: 32,
  height: 60,
  foot: 76,
  draw: (s, sky) => {
    const glass = framed(
      s,
      { shape: 'pointed', x: 5, y: 1, w: 22, h: 56, frame: 3, panes: [2, 1] },
      sky,
    );
    // The rose in the head: a ring of frame with four petals of glass round it.
    const cx = 16;
    const cy = glass.y + 12;
    for (let j = cy - 5; j <= cy + 5; j++) {
      for (let i = cx - 5; i <= cx + 5; i++) {
        const d = Math.hypot(i + 0.5 - cx - 0.5, j + 0.5 - cy - 0.5);
        if (d >= 3.6 && d <= 5 && glass.inside(i, j)) s.set(i, j, fillOf(TRIM));
      }
    }
    for (let j = glass.y; j < cy + 5; j++)
      if (glass.inside(cx - 1, j)) s.set(cx - 1, j, s.get(cx - 2, j)!);
    s.set(cx, cy, fillOf(TRIM)).set(cx - 1, cy, fillOf(TRIM));
    for (const j of [glass.y + 28, glass.y + 42]) {
      for (let i = glass.x; i < glass.x + glass.w; i++)
        if (glass.inside(i, j)) s.set(i, j, fillOf(TRIM));
    }
    sill(s, 3, 56, 26);
  },
};

/** A sash window in white, lace curtains drawn back, under a scalloped pelmet. */
const LACE: WindowShape = {
  width: 36,
  height: 50,
  foot: 74,
  draw: (s, sky) => {
    const glass = framed(
      s,
      { shape: 'square', x: 6, y: 5, w: 24, h: 40, frame: 2, panes: [2, 2] },
      sky,
    );
    // The lace, a net with the view through its holes, swagged back to either side.
    for (let j = glass.y; j < glass.y + glass.h; j++) {
      const k = j - glass.y;
      const reach = Math.max(2, Math.round(9 - Math.abs(k - 22) / 2.6));
      for (let r = 0; r < reach; r++) {
        for (const i of [glass.x + r, glass.x + glass.w - 1 - r]) {
          const edge = r === reach - 1;
          if (edge || (i + j) % 2 === 0 || r < 1) s.set(i, j, WHITE);
        }
      }
    }
    // The pelmet, scalloped, and the sill.
    s.rect(3, 1, 30, 5, fillOf(ACCENT)).rect(3, 1, 30, 1, lightOf(ACCENT));
    for (let x = 3; x < 33; x += 5)
      s.rect(x + 1, 6, 3, 1, fillOf(ACCENT)).set(x + 2, 7, fillOf(ACCENT));
    s.rect(3, 5, 30, 1, shadeOf(ACCENT));
    sill(s, 4, 45, 28);
  },
};

/** A wide window of many small panes, ivy climbing round its frame. */
const IVY: WindowShape = {
  width: 44,
  height: 52,
  foot: 76,
  draw: (s, sky) => {
    framed(s, { shape: 'square', x: 5, y: 6, w: 34, h: 40, frame: 2, panes: [3, 3] }, sky);
    sill(s, 3, 46, 38);
    // The ivy: a vine up the left side, over the top and a little way down the right.
    const path: [number, number][] = [];
    for (let j = 50; j > 6; j--) path.push([4 + Math.round(Math.sin(j * 0.4) * 1.5), j]);
    for (let i = 4; i < 40; i++) path.push([i, 5 + Math.round(Math.sin(i * 0.5) * 1.5)]);
    for (let j = 6; j < 24; j++) path.push([39 + Math.round(Math.sin(j * 0.45)), j]);
    path.forEach(([i, j], k) => {
      s.set(i, j, darkOf(LEAVES));
      if (k % 4 !== 0) return;
      const dx = k % 8 === 0 ? -1 : 1;
      s.rect(i + dx, j - 1, 2, 2, fillOf(LEAVES)).set(i + dx, j - 1, lightOf(LEAVES));
      s.set(i + dx * 2, j, fillOf(LEAVES));
    });
  },
};

/** How each window wallpaper's paper is coloured, and its window. */
interface WindowPaper {
  paper: SurfaceArt;
  window: WindowShape;
  colours: Colours;
}

const CREAM_STRIPE = tile('a', (s) => {
  s.rect(SIZE + 4, SIZE, 2, SIZE, 'b').rect(SIZE + 20, SIZE, 1, SIZE, 'b');
  halfDrop(12, 6, (x, y) => s.set(x, y, 'c'));
});

const TEAL_DOTS = tile('a', (s) => {
  halfDrop(7, 7, (x, y) => {
    s.set(x, y - 1, 'b')
      .set(x - 1, y, 'b')
      .set(x + 1, y, 'b')
      .set(x, y + 1, 'b');
    s.set(x, y, 'c');
  });
});

const SAGE_SPRIG = tile('a', (s) => {
  halfDrop(6, 4, (x, y) => {
    s.line(x, y + 7, x + 3, y, 'b');
    s.set(x + 1, y + 3, 'b')
      .set(x, y + 3, 'b')
      .set(x + 3, y + 4, 'b')
      .set(x + 4, y + 4, 'b');
    s.set(x + 3, y - 1, 'c')
      .set(x + 4, y, 'c')
      .set(x + 2, y, 'c');
  });
});

const PLUM_STONE = tile('a', (s) => {
  for (let row = 0; row < 4; row++) {
    const y = SIZE + row * 8;
    s.rect(SIZE, y + 7, SIZE, 1, 'b');
    s.rect(SIZE, y, SIZE, 1, 'c');
    const off = row % 2 === 0 ? 0 : 8;
    for (const x of [off, off + 16]) s.rect(SIZE + x, y, 1, 7, 'b');
  }
});

const ROSE_HEARTS = tile('a', (s) => {
  halfDrop(5, 5, (x, y) => heart(s, x, y, 5, 4, 'b'));
});

const WHITE_BRICK = tile('a', (s) => {
  for (let row = 0; row < 8; row++) {
    const y = SIZE + row * 4;
    s.rect(SIZE, y + 3, SIZE, 1, 'b');
    const off = row % 2 === 0 ? 0 : 5;
    for (let x = off; x < SIZE; x += 10) s.rect(SIZE + x, y, 1, 3, 'b');
    if (row % 3 === 1) s.rect(SIZE + off + 1, y, 9, 3, 'c');
  }
});

const PAPERS: Record<WindowPaperId, WindowPaper> = {
  archWindow: {
    paper: { source: CREAM_STRIPE, palette: { a: C.cream, b: C.creamShade, c: C.rose } },
    window: ARCH,
    colours: { wall: C.cream, roof: C.plum, trim: C.white, door: C.berry },
  },
  roundWindow: {
    paper: { source: TEAL_DOTS, palette: { a: C.teal, b: C.tealLight, c: C.gold } },
    window: ROUND,
    colours: { wall: C.cream, roof: C.plum, trim: C.gold, door: C.berry },
  },
  latticeWindow: {
    paper: {
      source: SAGE_SPRIG,
      palette: { a: mix(C.sage, C.cream, 0.35), b: C.mossLight, c: C.cream },
    },
    window: LATTICE,
    colours: {
      wall: C.cream,
      roof: C.plum,
      trim: C.cream,
      door: C.berry,
      stone: C.stone,
      accent: C.rose,
      accentTwo: C.wood,
    },
  },
  gothicWindow: {
    paper: { source: PLUM_STONE, palette: { a: C.plum, b: C.dusk, c: C.plumLight } },
    window: GOTHIC,
    colours: { wall: C.cream, roof: C.plum, trim: C.barkDark, door: C.berry },
  },
  laceWindow: {
    paper: {
      source: ROSE_HEARTS,
      palette: { a: mix(C.rose, C.cream, 0.5), b: mix(C.rose, C.cream, 0.25) },
    },
    window: LACE,
    colours: { wall: C.cream, roof: C.plum, trim: C.white, door: C.berry, accent: C.berryLight },
  },
  ivyWindow: {
    paper: {
      source: WHITE_BRICK,
      palette: { a: C.cream, b: C.creamShade, c: mix(C.cream, C.rose, 0.2) },
    },
    window: IVY,
    colours: { wall: C.cream, roof: C.plum, trim: C.white, door: C.berry, leaves: C.leaf },
  },
};

/** The paper behind each window wallpaper's windows, spread into `WALLPAPER_ART`. */
export const WINDOW_PAPER_ART = Object.fromEntries(
  Object.entries(PAPERS).map(([id, p]) => [id, p.paper]),
) as Record<WindowPaperId, SurfaceArt>;

/** A window as drawn for one look of the sky: its picture, and where on the wall it hangs. */
export interface WindowArt {
  source: SpriteSource;
  palette: Palette;
  /** The row of the wall its bottom row is on, counted down from the top of the wall. */
  foot: number;
}

const drawn = new Map<string, WindowArt>();

/** A window wallpaper's window, as the sky through it looks. */
export function windowArt(id: WindowPaperId, sky: WindowSky): WindowArt {
  const key = `${id}:${sky}`;
  const made = drawn.get(key);
  if (made) return made;
  const { window, colours } = PAPERS[id];
  const s = new Sketch(window.width, window.height);
  window.draw(s, sky);
  const art: WindowArt = {
    source: finish(s),
    palette: { ...palette(colours), [GLINT]: C.ghost, ...SKIES[sky] },
    foot: window.foot,
  };
  drawn.set(key, art);
  return art;
}

// ---- Floors -------------------------------------------------------------------------------------

/** Little round mint tiles in white grout, a white one here and there. */
const PENNY_TILES = tile('b', (s) => {
  for (let row = 0; row < 4; row++) {
    for (let col = 0; col < 4; col++) {
      const x = SIZE + col * 8 + (row % 2) * 4 + 4;
      const y = SIZE + row * 8 + 4;
      const key = (row * 3 + col) % 7 === 2 ? 'c' : 'a';
      s.ellipse(x, y, 3.5, 3.5, key);
      s.set(x - 2, y - 2, key === 'a' ? 'd' : 'c');
    }
  }
});

/** Square terracotta tiles in cream grout, each a shade of its own. */
const TERRACOTTA = tile('c', (s) => {
  for (const [x, y, key] of [
    [0, 0, 'a'],
    [16, 0, 'b'],
    [0, 16, 'b'],
    [16, 16, 'a'],
  ] as const) {
    s.rect(SIZE + x, SIZE + y, 15, 15, key);
    s.rect(SIZE + x, SIZE + y, 15, 1, 'd').rect(SIZE + x + 14, SIZE + y + 1, 1, 14, 'e');
  }
  s.set(SIZE + 5, SIZE + 9, 'e')
    .set(SIZE + 24, SIZE + 22, 'e')
    .set(SIZE + 10, SIZE + 27, 'd');
});

/** A deep plum carpet scattered with little gold stars, like a theatre's. */
const STAR_CARPET = tile('a', (s) => {
  halfDrop(6, 6, (x, y) => {
    s.set(x, y - 1, 'b')
      .set(x - 1, y, 'b')
      .set(x + 1, y, 'b')
      .set(x, y + 1, 'b')
      .set(x, y, 'c');
  });
  for (const [x, y] of [
    [20, 3],
    [3, 20],
    [27, 13],
    [12, 28],
  ] as const) {
    s.set(SIZE + x, SIZE + y, 'd');
  }
});

/** Oak blocks laid in a chevron, each column's slanting the other way, with dark seams. */
const CHEVRON = tile('a', (s) => {
  for (let y = 0; y < SIZE; y++) {
    for (let x = 0; x < SIZE; x++) {
      const col = Math.floor(x / 8);
      const lean = col % 2 === 0 ? x % 8 : 7 - (x % 8);
      const stripe = Math.floor((y + lean) / 4);
      const seam = (y + lean) % 4 === 0 || x % 8 === 0;
      const key = seam ? 'c' : (stripe + col) % 3 === 0 ? 'b' : (y + lean) % 4 === 1 ? 'd' : 'a';
      s.set(SIZE + x, SIZE + y, key);
    }
  }
});

export const SET_FLOORING_ART: Record<SetFlooringId, SurfaceArt> = {
  pennyTiles: {
    source: PENNY_TILES,
    palette: { a: C.mint, b: C.white, c: C.ghost, d: mix(C.mint, C.white, 0.5) },
  },
  terracotta: {
    source: TERRACOTTA,
    palette: {
      a: C.terracotta,
      b: mix(C.terracotta, C.copper, 0.5),
      c: C.creamShade,
      d: mix(C.terracotta, C.cream, 0.3),
      e: mix(C.terracotta, C.berry, 0.4),
    },
  },
  starCarpet: {
    source: STAR_CARPET,
    palette: { a: C.plum, b: C.goldShade, c: C.gold, d: C.plumLight },
  },
  chevron: {
    source: CHEVRON,
    palette: { a: C.wood, b: C.bark, c: C.barkDark, d: mix(C.wood, C.cream, 0.2) },
  },
};
