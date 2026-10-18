import type { ActivityId, Motion } from '../data/activities';
import {
  ACCENT,
  ACCENT_TWO,
  darkOf,
  DOOR,
  fillOf,
  finish,
  INK,
  lightOf,
  ROOF,
  shadeOf,
  STONE,
  TRIM,
  WALL,
  WHITE,
} from './buildings';
import {
  DUCK_POND_PALETTE,
  HOOK_A_GHOST_PALETTE,
  RING_TOSS_PALETTE,
  STRENGTH_BELL_PALETTE,
} from './fairground';
import { slab } from './furnish';
import { Sketch } from './sketch';
import type { Palette, SpriteSource } from './sprite';

/*
 * The fairground's games up close (V1's R6b, decision 315), for the little stage in each game's
 * sheet: the inside of its stall at the same 32-to-a-tile pixels, painted in its stall's own
 * palette (`fairground.ts`), and the moving things on it as pieces the view lays over it each frame
 * at whole pixels. Never the world's drawing: only `render/fairGames.ts` puts these together.
 */

/** The stage's size, in the art's own pixels. */
export const STAGE_W = 96;
export const STAGE_H = 56;

/** Where things stand on it: the shelf the bottles stand on, the water's line, the bell's pole. */
export const SHELF_Y = 46;
export const WATER_Y = 40;
export const POLE = { x: 46, top: 10, foot: 48 };

/** A booth's back: planks in shade under a beam, the skirt in its colours below. */
function booth(s: Sketch): void {
  s.rect(0, 0, STAGE_W, STAGE_H, shadeOf(WALL));
  for (let x = 4; x < STAGE_W; x += 8) s.rect(x, 4, 1, STAGE_H - 4, darkOf(WALL));
  slab(s, 0, 0, STAGE_W, 4, TRIM);
}

/** The striped skirt along the bottom, from `y`. */
function skirt(s: Sketch, y: number): void {
  s.rect(0, y, STAGE_W, STAGE_H - y, fillOf(ACCENT));
  for (let x = 0; x < STAGE_W; x += 10) s.rect(x, y, 5, STAGE_H - y, fillOf(ACCENT_TWO));
  s.rect(0, y, STAGE_W, 1, darkOf(TRIM));
}

/** A tub of water across the stage, from `y` down, its rim in stone. */
function tub(s: Sketch, y: number): void {
  s.rect(0, y, STAGE_W, STAGE_H - y, fillOf(ROOF));
  for (let x = 3; x < STAGE_W; x += 9) s.rect(x, y + 3 + (x % 2), 4, 1, lightOf(ROOF));
  for (let x = 7; x < STAGE_W; x += 13) s.rect(x, y + 8, 3, 1, shadeOf(ROOF));
  s.rect(0, y, STAGE_W, 1, lightOf(ROOF));
  slab(s, 0, STAGE_H - 5, STAGE_W, 5, STONE);
}

const BACKDROPS: Record<Motion, () => SpriteSource> = {
  swing: () => {
    const s = new Sketch(STAGE_W, STAGE_H);
    booth(s);
    // The rail the ring's trolley runs along.
    s.rect(2, 6, STAGE_W - 4, 1, darkOf(TRIM));
    slab(s, 0, SHELF_Y, STAGE_W, 4, TRIM);
    skirt(s, SHELF_Y + 4);
    return s.toSource();
  },
  bob: () => {
    const s = new Sketch(STAGE_W, STAGE_H);
    booth(s);
    tub(s, WATER_Y);
    return s.toSource();
  },
  ducks: () => {
    const s = new Sketch(STAGE_W, STAGE_H);
    booth(s);
    tub(s, WATER_Y - 4);
    return s.toSource();
  },
  bell: () => {
    const s = new Sketch(STAGE_W, STAGE_H);
    booth(s);
    const { x, top, foot } = POLE;
    s.rect(x, top, 4, foot - top, fillOf(TRIM)).rect(x, top, 1, foot - top, lightOf(TRIM));
    for (let y = foot - 4; y > top + 2; y -= 4) s.rect(x - 1, y, 6, 1, fillOf(ACCENT_TWO));
    // The top rungs, where it's near enough to ring.
    s.rect(x - 2, top + 2, 8, 1, fillOf(DOOR)).rect(x - 2, top + 4, 8, 1, fillOf(DOOR));
    slab(s, x - 10, foot, 24, 3, STONE);
    skirt(s, foot + 3);
    return s.toSource();
  },
};

/** A bottle, standing: 8 wide, 15 tall. */
const BOTTLE = (() => {
  const s = new Sketch(8, 15);
  s.rect(1, 6, 6, 9, fillOf(STONE)).rect(3, 1, 2, 5, fillOf(STONE)).rect(2, 0, 4, 1, fillOf(STONE));
  s.rect(1, 6, 1, 9, lightOf(STONE)).rect(6, 7, 1, 8, shadeOf(STONE));
  s.rect(2, 9, 4, 3, fillOf(DOOR));
  return finish(s);
})();

/** The glint on the bottle she's to aim for: a star of white, never outlined. */
const GLINT = (() => {
  const s = new Sketch(7, 7);
  s.rect(3, 0, 1, 7, WHITE).rect(0, 3, 7, 1, WHITE).set(2, 2, WHITE).set(4, 4, WHITE);
  s.set(4, 2, WHITE).set(2, 4, WHITE);
  return s.toSource();
})();

/** A ring hanging (seen edge on, a hoop) and a ring lying flat. */
const RING = (() => {
  const s = new Sketch(12, 6);
  s.ellipse(6, 3, 6, 3, fillOf(ACCENT_TWO)).ellipse(6, 3, 4, 1.5, '.');
  s.set(2, 1, lightOf(ACCENT_TWO)).set(3, 1, lightOf(ACCENT_TWO));
  return finish(s);
})();

/** The trolley the ring hangs from on its cord. */
const TROLLEY = (() => {
  const s = new Sketch(6, 4);
  s.rect(0, 0, 6, 3, fillOf(TRIM)).rect(2, 3, 2, 1, darkOf(TRIM));
  return finish(s);
})();

/** A little ghost on the water, 10 wide and 11 tall, its loop on top for a hook. */
const GHOST = (() => {
  const s = new Sketch(10, 12);
  s.rect(4, 0, 2, 1, WHITE).set(3, 1, WHITE).set(6, 1, WHITE);
  s.ellipse(5, 6, 4.5, 4, WHITE).rect(1, 6, 9, 4, WHITE);
  s.set(1, 10, WHITE).set(4, 10, WHITE).set(5, 10, WHITE).set(8, 10, WHITE);
  s.set(3, 5, INK).set(6, 5, INK).set(4, 8, INK).set(5, 8, INK);
  return finish(s);
})();

/** The hook on its line, the line drawn by the view. */
const HOOK = (() => {
  const s = new Sketch(6, 8);
  s.rect(2, 0, 1, 6, INK).rect(3, 6, 2, 1, INK).set(5, 5, INK).set(5, 4, INK);
  return s.toSource();
})();

/** A duck on the water, facing right, 12 wide and 9 tall. */
const DUCK = (() => {
  const s = new Sketch(12, 9);
  s.ellipse(5, 6, 5, 2.5, fillOf(STONE)).ellipse(8, 2.5, 2.5, 2.5, fillOf(STONE));
  s.rect(10, 3, 2, 1, fillOf(ACCENT_TWO));
  s.set(8, 2, INK).set(7, 1, lightOf(STONE)).set(1, 4, fillOf(STONE)).set(0, 3, fillOf(STONE));
  s.rect(2, 7, 6, 1, shadeOf(STONE));
  return finish(s);
})();

/** A duck turned over to show what's under it: a plain dot, a star, or a gold crown. */
const DUCK_UNDER = [
  (s: Sketch) => s.rect(6, 4, 2, 2, darkOf(STONE)),
  (s: Sketch) =>
    s.rect(6, 1, 2, 8, fillOf(DOOR)).rect(3, 4, 8, 2, fillOf(DOOR)).rect(5, 3, 4, 4, fillOf(DOOR)),
  (s: Sketch) => {
    s.rect(3, 4, 8, 3, fillOf(ACCENT_TWO)).rect(3, 7, 8, 1, darkOf(ACCENT_TWO));
    for (const x of [3, 6, 7, 10]) s.set(x, x === 6 || x === 7 ? 2 : 3, fillOf(ACCENT_TWO));
    s.set(6, 3, fillOf(ACCENT_TWO)).set(7, 3, fillOf(ACCENT_TWO)).set(6, 5, fillOf(DOOR));
  },
].map((mark) => {
  const s = new Sketch(14, 11);
  s.ellipse(7, 5, 6.5, 4.5, lightOf(STONE)).rect(2, 8, 10, 1, fillOf(STONE));
  mark(s);
  return finish(s);
});

/** The bell at the pole's top, still and ringing (tipped a pixel). */
const BELL = [0, 1].map((tip) => {
  const s = new Sketch(14, 11);
  s.rect(6, 0, 2, 2, darkOf(TRIM));
  s.sphere(
    7 + tip,
    6,
    6,
    5,
    darkOf(ACCENT_TWO) + shadeOf(ACCENT_TWO) + fillOf(ACCENT_TWO) + lightOf(ACCENT_TWO),
  );
  s.rect(1 + tip, 9, 12, 2, fillOf(ACCENT_TWO)).set(7 + tip, 10, darkOf(ACCENT_TWO));
  return finish(s);
});

/** The puck that rides up the pole. */
const PUCK = (() => {
  const s = new Sketch(10, 5);
  s.rect(0, 0, 10, 5, fillOf(DOOR)).rect(0, 0, 10, 1, lightOf(DOOR)).rect(4, 0, 2, 5, darkOf(DOOR));
  return finish(s);
})();

/** A burst where a throw lands, two frames: big then fading. Never outlined: it's light. */
const HIT = [5, 3].map((r) => {
  const s = new Sketch(13, 13);
  for (let k = 0; k < 8; k++) {
    const a = (k / 8) * Math.PI * 2;
    s.set(Math.round(6 + Math.cos(a) * r), Math.round(6 + Math.sin(a) * r), WHITE);
    if (r > 3)
      s.set(
        Math.round(6 + Math.cos(a) * (r - 2)),
        Math.round(6 + Math.sin(a) * (r - 2)),
        fillOf(ACCENT_TWO),
      );
  }
  return s.toSource();
});

/** A splash where a hook or a ring goes wide: a few drops. */
const SPLASH = (() => {
  const s = new Sketch(9, 5);
  s.set(1, 3, WHITE).set(3, 1, WHITE).set(4, 0, WHITE).set(5, 1, WHITE).set(7, 3, WHITE);
  s.set(2, 4, WHITE).set(6, 4, WHITE);
  return s.toSource();
})();

export const GAME_PIECES = {
  bottle: BOTTLE,
  glint: GLINT,
  ring: RING,
  trolley: TROLLEY,
  ghost: GHOST,
  hook: HOOK,
  duck: DUCK,
  duckPlain: DUCK_UNDER[0]!,
  duckStar: DUCK_UNDER[1]!,
  duckCrown: DUCK_UNDER[2]!,
  bell: BELL[0]!,
  bellRinging: BELL[1]!,
  puck: PUCK,
  hit: HIT[0]!,
  hitFading: HIT[1]!,
  splash: SPLASH,
} as const;

export type GamePiece = keyof typeof GAME_PIECES;

/** Each game's backdrop, baked once. */
export const GAME_BACKDROPS: Record<Motion, SpriteSource> = {
  swing: BACKDROPS.swing(),
  bob: BACKDROPS.bob(),
  ducks: BACKDROPS.ducks(),
  bell: BACKDROPS.bell(),
};

/** Each game's palette: its stall's. */
export const GAME_PALETTES: Partial<Record<ActivityId, Palette>> = {
  ringToss: RING_TOSS_PALETTE,
  hookAGhost: HOOK_A_GHOST_PALETTE,
  duckPond: DUCK_POND_PALETTE,
  strengthBell: STRENGTH_BELL_PALETTE,
};
