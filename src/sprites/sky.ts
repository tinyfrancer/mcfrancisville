import { PALETTE as C } from './palette';
import { CLEAR, Sketch } from './sketch';
import type { Palette, SpriteSource } from './sprite';

/*
 * What crosses the sky over a place (V1's E5): crows by day and a few bats at dusk, small and
 * friendly, drawn as the art style's critters are, lit from the top left and softly outlined.
 * A crow sits on the scarecrow's arm now and then too.
 */

/** Keys: body, its light, its shade, outline, beak and feet, eye, and its shine. */
const BODY = 'b';
const LIGHT = 'l';
const SHADE = 'd';
const OUTLINE = 'o';
const BEAK = 'k';
const EYE = 'e';
const SHINE = 'w';

/** A crow flying side on, facing right, its wings `up`, level or `down`. */
function crow(wings: 'up' | 'level' | 'down'): SpriteSource {
  const s = new Sketch(18, 13);
  // The body, a round head and a fanned tail.
  s.ellipse(9, 7, 4.5, 2.5, BODY).ellipse(13, 6, 2.5, 2.5, BODY);
  s.rect(2, 6, 3, 2, BODY).set(1, 6, BODY).set(1, 8, BODY);
  s.set(16, 6, BEAK).set(17, 7, BEAK).set(16, 7, BEAK);
  s.set(14, 5, EYE).set(14, 4, SHINE);
  s.rect(7, 6, 4, 1, LIGHT).set(12, 4, LIGHT);
  // The wing, up over its back, out level or down under it.
  if (wings === 'up') s.line(10, 6, 7, 1, SHADE).line(9, 6, 5, 2, SHADE).line(8, 6, 6, 3, BODY);
  if (wings === 'level') s.rect(5, 5, 6, 1, SHADE).rect(4, 4, 5, 1, SHADE);
  if (wings === 'down')
    s.line(10, 8, 7, 12, SHADE).line(9, 8, 5, 11, SHADE).line(8, 8, 6, 10, BODY);
  s.outline((k) => (k === CLEAR || k === BEAK || k === SHINE || k === EYE ? null : OUTLINE));
  return s.toSource();
}

/** A crow sat on something, facing right: head up, or bobbed down for a peck. */
function perched(peck: boolean): SpriteSource {
  const s = new Sketch(14, 14);
  s.ellipse(7, 8, 4, 3.5, BODY).rect(2, 9, 3, 3, BODY).set(1, 12, BODY);
  const hy = peck ? 7 : 4;
  s.ellipse(10, hy, 2.5, 2.5, BODY).set(9, hy - 1, LIGHT);
  s.set(13, hy, BEAK)
    .set(13, hy + 1, BEAK)
    .set(11, hy - 1, EYE)
    .set(11, hy - 2, SHINE);
  s.rect(5, 7, 4, 1, LIGHT).rect(4, 9, 5, 1, SHADE);
  s.set(6, 12, BEAK).set(8, 12, BEAK);
  s.outline((k) => (k === CLEAR || k === BEAK || k === SHINE || k === EYE ? null : OUTLINE));
  return s.toSource();
}

/** A little bat flying, its wings up or down: round, big-eared and smiling. */
function bat(up: boolean): SpriteSource {
  const s = new Sketch(16, 11);
  s.ellipse(8, 6, 2.5, 3, BODY).set(6, 2, BODY).set(10, 2, BODY);
  s.set(7, 5, EYE).set(9, 5, EYE).set(7, 4, SHINE);
  for (const dir of [-1, 1]) {
    const x0 = 8 + dir * 2;
    if (up) {
      s.line(x0, 5, x0 + dir * 5, 1, SHADE).line(x0, 6, x0 + dir * 6, 3, SHADE);
      s.set(x0 + dir * 4, 3, SHADE).set(x0 + dir * 3, 4, SHADE);
    } else {
      s.line(x0, 6, x0 + dir * 5, 9, SHADE).line(x0, 6, x0 + dir * 6, 6, SHADE);
      s.set(x0 + dir * 3, 7, SHADE).set(x0 + dir * 4, 8, SHADE);
    }
  }
  s.outline((k) => (k === CLEAR || k === SHINE || k === EYE ? null : OUTLINE));
  return s.toSource();
}

/** A crow's three wingbeats, up, level and down, flown in that order and back. */
export const CROW_FLYING: readonly SpriteSource[] = [crow('up'), crow('level'), crow('down')];
/** A crow sat on the scarecrow's arm, looking about, and pecking. */
export const CROW_PERCHED: readonly SpriteSource[] = [perched(false), perched(true)];
/** A bat's two wingbeats. */
export const BAT_FLYING: readonly SpriteSource[] = [bat(true), bat(false)];

/** Where a perched crow's feet are in its picture, to stand it on something. */
export const PERCH_FEET = { x: 7, y: 13 };

export const CROW_PALETTE: Palette = {
  [CLEAR]: null,
  [BODY]: C.inkFabric,
  [LIGHT]: C.navy,
  [SHADE]: C.inkFabricShade,
  [OUTLINE]: C.ink,
  [BEAK]: C.gold,
  [EYE]: C.white,
  [SHINE]: C.white,
};

export const BAT_PALETTE: Palette = {
  [CLEAR]: null,
  [BODY]: C.plum,
  [LIGHT]: C.plumLight,
  [SHADE]: C.lavenderShade,
  [OUTLINE]: C.ink,
  [EYE]: C.candle,
  [SHINE]: C.candleBright,
  [BEAK]: C.gold,
};
