import {
  ACCENT,
  buildingPalette,
  darkOf,
  fillOf,
  finish,
  GLASS,
  GLINT,
  LAMP,
  lightOf,
  ROOF,
  shadeOf,
  STONE,
} from './buildings';
import { PALETTE as C } from './palette';
import { Sketch } from './sketch';
import type { Palette, SpriteSource } from './sprite';

/*
 * What drives across Cody's greeting now and then (phase O): the little red Tesla, for their
 * game on the road (personal_touches.md, "Version 0.1"). Drawn at 1×, side on, facing right.
 */

function drawRedOne(): SpriteSource {
  const s = new Sketch(48, 18);
  // The body: long and low, rounded at the nose and the tail.
  s.rect(3, 8, 42, 6, fillOf(ACCENT));
  s.rect(2, 9, 1, 4, fillOf(ACCENT)).rect(45, 9, 1, 4, fillOf(ACCENT));
  // The cabin: one smooth curve from the bonnet over the roof to the tail.
  for (let y = 2; y < 8; y++) {
    const back = Math.round(14 - (y - 2) * 1.6);
    const front = Math.round(29 + (y - 2) * 2);
    s.rect(back, y, front - back, 1, fillOf(ACCENT));
  }
  // The windows, split by a pillar, with a glint.
  for (let y = 3; y < 8; y++) {
    const back = Math.round(15 - (y - 2) * 1.6) + 1;
    const front = Math.round(29 + (y - 2) * 2) - 2;
    s.rect(back, y, front - back, 1, GLASS);
  }
  s.rect(23, 3, 2, 5, fillOf(ACCENT)).set(26, 3, GLINT).set(27, 3, GLINT);
  s.bevel(fillOf(ACCENT), lightOf(ACCENT), shadeOf(ACCENT));
  s.rect(3, 12, 42, 1, darkOf(ACCENT));
  s.rect(24, 9, 1, 3, shadeOf(ACCENT)).rect(27, 10, 2, 1, lightOf(ACCENT));
  // The lamps: a white headlight at the nose, a red one at the tail.
  s.rect(43, 9, 2, 1, LAMP).rect(3, 9, 2, 1, lightOf(ACCENT));
  // The wheels, with their silver hubs.
  for (const x of [12, 36]) {
    s.ellipse(x, 14, 3.5, 3.5, fillOf(ROOF));
    s.ellipse(x, 14, 1.5, 1.5, fillOf(STONE)).set(x - 1, 13, lightOf(STONE));
  }
  return finish(s);
}

export const RED_ONE: SpriteSource = drawRedOne();

export const RED_ONE_PALETTE: Palette = buildingPalette({
  wall: C.cream,
  roof: C.ink,
  trim: C.iron,
  door: C.iron,
  stone: C.silver,
  accent: C.scarlet,
  glass: C.night,
});
