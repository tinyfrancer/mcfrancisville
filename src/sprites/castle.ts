import { mix, PALETTE as C } from './palette';
import { Sketch } from './sketch';
import type { Palette, SpriteSource } from './sprite';
import {
  ACCENT,
  ACCENT_TWO,
  buildingPalette,
  darkOf,
  door,
  type Drawn,
  fillOf,
  finish,
  footing,
  INK,
  LEAVES,
  lightOf,
  lightWall,
  shadeOf,
  slopedRoof,
  step,
  TRIM,
  wall,
  wallLamp,
  window,
} from './buildings';

/*
 * The castle on the hill (phase I), after the castles they were married at (personal_touches.md,
 * "Places"), with orange and black monarch butterflies everywhere: on its stones, its banners and
 * its garden's arch. Built from the building kit, so its windows light after dark like any other.
 */

/** A monarch at rest on a wall, wings open: orange in `ACCENT`, veined and edged in ink. */
function monarch(s: Sketch, x: number, y: number): void {
  const wing = fillOf(ACCENT);
  s.rect(x, y, 3, 3, wing).rect(x + 4, y, 3, 3, wing);
  s.rect(x + 1, y + 3, 2, 2, wing).rect(x + 4, y + 3, 2, 2, wing);
  s.set(x, y, INK)
    .set(x + 6, y, INK)
    .set(x + 1, y + 1, lightOf(ACCENT))
    .set(x + 5, y + 1, lightOf(ACCENT));
  s.rect(x + 3, y, 1, 5, INK);
}

/** Battlements along a wall's top: square merlons with gaps between, lit on their left. */
function battlements(s: Sketch, x: number, y: number, w: number): void {
  s.rect(x, y + 6, w, 4, fillOf(TRIM)).rect(x, y + 6, w, 1, lightOf(TRIM));
  for (let i = x; i + 8 <= x + w; i += 12) {
    s.rect(i, y, 8, 7, fillOf(TRIM))
      .rect(i, y, 8, 1, lightOf(TRIM))
      .rect(i, y, 1, 7, lightOf(TRIM));
    s.rect(i + 7, y + 1, 1, 6, shadeOf(TRIM));
  }
}

/** A banner hanging from the battlements: orange and black halves, cut into a swallowtail. */
function banner(s: Sketch, cx: number, top: number, h: number, sway = 0): void {
  for (let j = 0; j < h; j++) {
    // In a breeze (V1's E5) its lower half swings a pixel or two, the top held by its pole.
    const dx = Math.round(sway * Math.max(0, (j - h / 2) / (h / 2)) * 2);
    const notch = j > h - 6 ? j - (h - 6) : 0;
    for (let i = -6; i < 6; i++) {
      if (Math.abs(i + 0.5) < notch) continue;
      s.set(cx + i + dx, top + j, i < 0 ? fillOf(ACCENT) : fillOf(ACCENT_TWO));
    }
  }
  s.rect(cx - 7, top - 1, 14, 2, darkOf(TRIM));
  monarch(s, cx - 3, top + 8);
}

/**
 * Castle Mac-A-Boo: a keep of pale stone between two round towers under plum cones, battlements
 * with banners, a great arched door with a rose window over it, ivy up one tower, lamps either
 * side of the door, and monarchs resting all over it. Nine tiles wide, the door in the middle.
 */
function drawCastle(sway = 0): Drawn {
  const W = 288;
  const H = 272;
  const s = new Sketch(W, H);
  const floor = H - 8;
  const cx = W / 2;
  // The towers' cones, then the keep's middle turret behind the battlements.
  slopedRoof(s, 44, 14, 96, 2, 72, 'slate');
  slopedRoof(s, W - 44, 14, 96, 2, 72, 'slate');
  s.rect(43, 4, 2, 12, darkOf(TRIM)).rect(W - 45, 4, 2, 12, darkOf(TRIM));
  s.rect(45, 4, 10, 6, fillOf(ACCENT)).rect(W - 43, 4, 10, 6, fillOf(ACCENT_TWO));
  wall(s, cx - 26, 40, 52, 70, 'stone', undefined, 5);
  lightWall(s, cx - 26, 40, 52, 70, 0);
  battlements(s, cx - 30, 30, 60);
  window(s, cx - 7, 56, 14, 22, { shape: 'pointed', panes: [1, 1] });
  // The keep.
  wall(s, 64, 100, W - 128, floor - 100, 'stone', undefined, 3);
  lightWall(s, 64, 100, W - 128, floor - 100, 0);
  battlements(s, 60, 88, W - 120);
  // The towers.
  for (const x of [8, W - 80]) {
    wall(s, x, 94, 72, floor - 94, 'stone', undefined, x);
    lightWall(s, x, 94, 72, floor - 94, 6);
    s.rect(x - 2, 92, 76, 4, fillOf(TRIM)).rect(x - 2, 92, 76, 1, lightOf(TRIM));
    window(s, x + 26, 118, 20, 34, { shape: 'pointed', panes: [1, 2], sill: true });
    window(s, x + 28, 180, 16, 28, { shape: 'arch', panes: [1, 1] });
  }
  footing(s, 6, floor - 10, W - 12, 10);
  window(s, cx - 13, 108, 26, 26, { shape: 'round', panes: [2, 2] });
  for (const x of [84, W - 116]) {
    window(s, x, 150, 32, 44, { shape: 'arch', panes: [2, 2], sill: true, curtains: true });
  }
  banner(s, 104, 99, 34, sway);
  banner(s, W - 104, 99, 34, sway);
  const front = door(s, cx, floor, 40, 74, { shape: 'arch', knob: 'right' });
  wallLamp(s, cx - 34, 188);
  wallLamp(s, cx + 30, 188);
  // Ivy up the left tower's corner.
  for (let y = 120; y < floor - 8; y++) {
    const x = 70 + Math.round(Math.sin(y / 6) * 3);
    s.set(x, y, fillOf(LEAVES));
    if (y % 5 === 0) s.rect(x - 2, y, 3, 2, fillOf(LEAVES)).set(x - 2, y, lightOf(LEAVES));
    if (y % 9 === 0) s.rect(x + 1, y + 1, 3, 2, shadeOf(LEAVES));
  }
  // Monarchs resting all over the stone.
  for (const [x, y] of [
    [30, 160],
    [50, 222],
    [98, 206],
    [180, 118],
    [200, 214],
    [236, 140],
    [256, 206],
    [126, 70],
    [cx + 26, 150],
    [20, 102],
    [262, 100],
  ] as const) {
    monarch(s, x, y);
  }
  step(s, cx, H, 52, 8);
  return { source: finish(s), door: front };
}

export const CASTLE: Drawn = drawCastle();

/** The castle with its banners swinging in the breeze, one way and the other (V1's E5). */
export const CASTLE_BANNERS = (): readonly SpriteSource[] => [
  CASTLE.source,
  drawCastle(1).source,
  drawCastle(-1).source,
];

export const CASTLE_PALETTE: Palette = buildingPalette({
  wall: mix(C.cream, C.stoneLight, 0.5),
  roof: C.plum,
  trim: C.stoneLight,
  door: C.maroon,
  stone: C.stoneDark,
  accent: C.monarch,
  accentTwo: C.inkFabric,
  leaves: C.leafDark,
});

/**
 * The wedding arch in the castle garden, two tiles wide: an arch of trellis grown over with
 * roses, orange ribbons tied at its feet, and monarchs resting on it.
 */
function drawArch(): SpriteSource {
  const s = new Sketch(64, 104);
  const cx = 32;
  // The arch: two posts and a round top, of white trellis.
  for (let y = 0; y < 104; y++) {
    for (let x = 0; x < 64; x++) {
      const dy = Math.max(0, 40 - y);
      const r = Math.hypot(x + 0.5 - cx, dy);
      const outer = y >= 40 ? Math.abs(x + 0.5 - cx) <= 30 : r <= 30;
      const inner = y >= 40 ? Math.abs(x + 0.5 - cx) <= 23 : r <= 23;
      if (outer && !inner && y < 100) s.set(x, y, (x + y) % 6 === 0 ? 'w' : 'W');
    }
  }
  s.bevel('wW', 'L', 'w');
  // Roses and leaves climbing it.
  for (let i = 0; i < 70; i++) {
    const t = (i / 70) * Math.PI;
    const side = i % 2 === 0 ? 1 : -1;
    const y = i < 35 ? 100 - i * 1.7 : 40 - Math.sin(((i - 35) / 35) * Math.PI) * 10;
    const x = i < 35 ? cx + side * 26 : cx - Math.cos(((i - 35) / 35) * Math.PI) * 26;
    if (i % 3 === 0) s.ellipse(x + Math.sin(t * 5) * 2, y, 3, 2.5, 'g');
    if (i % 5 === 1) s.ellipse(x, y, 2.5, 2.5, 'r').set(Math.round(x) - 1, Math.round(y) - 1, 'R');
  }
  // Ribbons at its feet.
  for (const x of [cx - 27, cx + 27]) {
    s.rect(x - 3, 70, 6, 3, 'm')
      .line(x - 1, 73, x - 4, 84, 'm')
      .line(x + 1, 73, x + 4, 84, 'M');
  }
  for (const [x, y] of [
    [cx - 4, 6],
    [cx + 20, 22],
    [cx - 30, 48],
  ] as const) {
    s.rect(x, y, 3, 3, 'm')
      .rect(x + 4, y, 3, 3, 'm')
      .rect(x + 3, y, 1, 5, 'k');
    s.rect(x + 1, y + 3, 2, 2, 'm').rect(x + 4, y + 3, 2, 2, 'm');
  }
  s.outline({ w: 'o', W: 'o', L: 'o', g: 'G', r: 'q', R: 'q', m: 'k', M: 'k' });
  return s.toSource();
}

export const WEDDING_ARCH: SpriteSource = drawArch();

export const WEDDING_ARCH_PALETTE: Palette = {
  '.': null,
  o: C.stoneDark,
  w: C.creamShade,
  W: C.white,
  L: C.white,
  g: C.leaf,
  G: C.leafDark,
  r: C.rose,
  R: C.roseLight,
  q: C.berry,
  m: C.monarch,
  M: mix(C.monarch, C.pumpkinDark, 0.4),
  k: C.ink,
};
