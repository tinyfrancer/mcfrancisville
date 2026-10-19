import type { AccessoryStyle } from '../data/pets';
import { ACCESSORIES } from '../data/pets';
import type { Bubble } from '../systems/pets';
import type { AccessoryId, PetId } from '../types/ids';
import { PALETTE as C, ramp } from './palette';
import { CLEAR, Sketch } from './sketch';
import type { Palette, SpriteSource } from './sprite';

/**
 * Their pets (phase 11), drawn side on and facing right, at her scale (decisions.md 79): the dogs
 * come up past her knees, the cats a little lower, and Gary is a little bigger than a snail has
 * any right to be. Each has two walking frames (the first is standing), a sit facing her, and
 * Florence's nap under her blanket and Elvira's curl. They're sketched from round shapes, lit
 * from the top left and outlined, like everything at 32 pixels a tile.
 *
 * `o` outline, `f` fur, `s` shade, `l` light, `m` markings, `e` eyes, `w` their shine, `p` pink
 * (nose, ears, tongue). What they wear is painted over three keys (decisions.md 69): `n` the band
 * round the neck, `k` a bandana's point on the chest (both fur until something is worn), and `q`
 * a collar's spikes or bell, just outside the band (clear until then).
 */

/** Keys that are the pet itself, for its light and shade. */
const BODY_KEYS = 'fmnkpl';

/**
 * Light from the top left on a pet's fur (`f` only, so markings and eyes keep their colours), an
 * outline round all of it, and the spikes' or bell's place just outside its neck band.
 */
function finishPet(s: Sketch): SpriteSource {
  const inPet = (x: number, y: number) => BODY_KEYS.includes(s.get(x, y) ?? CLEAR);
  const changes: [number, number, string][] = [];
  for (let y = 0; y < s.height; y++) {
    for (let x = 0; x < s.width; x++) {
      if (s.get(x, y) !== 'f') continue;
      if (!inPet(x + 1, y) || !inPet(x, y + 1)) changes.push([x, y, 's']);
      else if (!inPet(x - 1, y) || !inPet(x, y - 1)) changes.push([x, y, 'l']);
    }
  }
  for (const [x, y, key] of changes) s.set(x, y, key);
  s.outline(() => 'o');
  // Spikes or a bell hang just outside the outline wherever the band meets it.
  const band = (x: number, y: number) => s.get(x, y) === 'n';
  const spots: [number, number][] = [];
  for (let y = 0; y < s.height; y++) {
    for (let x = 0; x < s.width; x++) {
      if (s.get(x, y) !== CLEAR) continue;
      const edge = [
        [x + 1, y],
        [x - 1, y],
        [x, y + 1],
        [x, y - 1],
      ].some(([ex, ey]) => {
        if (s.get(ex!, ey!) !== 'o') return false;
        return band(ex! + 1, ey!) || band(ex! - 1, ey!) || band(ex!, ey! + 1) || band(ex!, ey! - 1);
      });
      if (edge && (x + y) % 2 === 0) spots.push([x, y]);
    }
  }
  for (const [x, y] of spots) s.set(x, y, 'q');
  return s.toSource();
}

/** A leg from `top` down to the ground at `ground`, `w` wide, with a paw a shade lighter. */
function leg(s: Sketch, x: number, top: number, ground: number, w = 3, key = 'f'): void {
  s.rect(x, top, w, ground - top + 1, key);
}

/** Turns the fur inside `within` to its band and bandana, where a collar or bandana goes. */
function neckwear(s: Sketch, band: (x: number, y: number) => boolean, point: [number, number][]) {
  for (let y = 0; y < s.height; y++) {
    for (let x = 0; x < s.width; x++) if (band(x, y) && s.get(x, y) === 'f') s.set(x, y, 'n');
  }
  for (const [x, y] of point) if (s.get(x, y) === 'f') s.set(x, y, 'k');
}

/** A pointed ear, `h` tall, its tip at (x, top), pink inside. */
function ear(s: Sketch, x: number, top: number, h: number, inside = true): void {
  for (let i = 0; i < h; i++) {
    const half = Math.floor(i / 2);
    s.rect(x - half, top + i, half * 2 + 1, 1, 'f');
  }
  if (inside && h >= 4) s.rect(x, top + 2, 1, h - 2, 'p');
}

/** An eye: a dark-ish iris two tall with a shine above. */
function eye(s: Sketch, x: number, y: number): void {
  s.set(x, y, 'w')
    .set(x, y + 1, 'e')
    .set(x + 1, y, 'e')
    .set(x + 1, y + 1, 'e');
}

type Cat = 'sphynx' | 'bambino' | 'fluffy';

/** A cat side on, facing right: a sphynx, a short-legged bambino, or a fluffy one. */
function catSide(kind: Cat, frame: 0 | 1): SpriteSource {
  const s = new Sketch(30, 22);
  const ground = 20;
  const legTop = kind === 'bambino' ? 16 : 14;
  const body = kind === 'bambino' ? 15 : 13;
  // The tail first, so the body covers its root: thin, or a plume.
  const tail = kind === 'fluffy' ? 3 : 2;
  for (const [x, y] of [
    [5, body - 1],
    [4, body - 2],
    [3, body - 3],
    [2, body - 4],
    [2, body - 5],
    [1, body - 6],
    [1, body - 7],
    [2, body - 8],
  ] as const) {
    s.rect(x - (tail - 2), Math.round(y), tail, tail, 'f');
  }
  const legs = frame === 0 ? [6, 9, 17, 20] : [4, 10, 15, 21];
  for (const x of legs) leg(s, x, legTop, ground, 3);
  s.ellipse(13, body, 9, kind === 'fluffy' ? 4.5 : 3.5, 'f');
  s.ellipse(22.5, body - 5.5, 5.5, 5, 'f');
  const top = Math.round(body - 6);
  ear(s, 20, top - 8, 6);
  ear(s, 25, top - 8, 6);
  eye(s, 24, top);
  s.set(27, top + 2, 'p');
  if (kind === 'sphynx')
    s.set(21, top - 3, 's')
      .set(22, top - 2, 's')
      .set(23, top - 3, 's');
  if (kind === 'fluffy') {
    // A tuxedo: dark over her back and head, white at her chest, paws and face.
    for (let y = 0; y < s.height; y++) {
      for (let x = 0; x < s.width; x++) {
        if (s.get(x, y) !== 'f') continue;
        const chest = x >= 20 && y >= top + 2;
        const face = x >= 22 && y >= top + 1;
        if (!chest && !face && y < body + 1 && x > 3) s.set(x, y, 'm');
      }
    }
    for (const x of [3, 9, 15]) s.set(x, top + 2, 'l');
  }
  neckwear(s, (x, y) => (x === 18 || x === 19) && y >= top && y <= top + 7, [
    [20, top + 7],
    [21, top + 7],
    [20, top + 8],
  ]);
  return finishPet(s);
}

/** A cat sitting, facing her. */
function catSit(kind: Cat): SpriteSource {
  const s = new Sketch(20, 24);
  s.rect(15, 16, 3, 2, 'f').rect(16, 13, 2, 3, 'f');
  s.ellipse(10, 17, 7, kind === 'bambino' ? 5 : 6, 'f');
  s.ellipse(10, 8.5, 6.5, 5.5, 'f');
  ear(s, 5, 0, 5);
  ear(s, 14, 0, 5);
  eye(s, 6, 7);
  eye(s, 12, 7);
  s.set(9, 10, 'p').set(10, 10, 'p');
  s.rect(6, 21, 3, 2, 'f').rect(11, 21, 3, 2, 'f');
  if (kind === 'fluffy') {
    for (let y = 0; y < 14; y++) {
      for (let x = 0; x < s.width; x++) {
        const face = x >= 7 && x <= 12 && y >= 8;
        if (s.get(x, y) === 'f' && !face) s.set(x, y, 'm');
      }
    }
  }
  if (kind === 'sphynx') s.set(9, 4, 's').set(10, 5, 's').set(11, 4, 's');
  neckwear(s, (_x, y) => y === 13 || y === 14, [
    [9, 15],
    [10, 15],
    [9, 16],
    [10, 16],
    [9, 17],
  ]);
  return finishPet(s);
}

/** Fibi, side on: a big black shepherd, ears up, a bushy tail down. */
function shepherdSide(frame: 0 | 1): SpriteSource {
  const s = new Sketch(38, 28);
  const ground = 26;
  for (let i = 0; i < 9; i++) s.rect(4 - Math.round(i / 3), 12 + i, 3, 2, 'f');
  const legs = frame === 0 ? [7, 10, 25, 28] : [5, 12, 23, 30];
  for (const x of legs) leg(s, x, 18, ground, 3);
  s.ellipse(17, 15, 12, 5.5, 'f');
  s.ellipse(29, 8, 5.5, 5, 'f');
  s.rect(32, 8, 4, 4, 'f').set(35, 8, CLEAR);
  ear(s, 27, 0, 5);
  ear(s, 31, 0, 5);
  eye(s, 30, 6);
  s.set(36, 9, 'm').set(35, 9, 'm');
  s.set(33, 12, 'p').set(34, 12, 'p');
  neckwear(s, (x, y) => (x === 25 || x === 26) && y >= 6 && y <= 16, [
    [27, 15],
    [28, 15],
    [27, 16],
    [28, 16],
    [27, 17],
  ]);
  return finishPet(s);
}

function shepherdSit(): SpriteSource {
  const s = new Sketch(24, 28);
  s.ellipse(12, 19, 8, 8, 'f');
  s.ellipse(12, 9, 6.5, 6, 'f');
  s.ellipse(12, 13, 3.5, 2.5, 'f');
  ear(s, 7, 0, 6);
  ear(s, 17, 0, 6);
  eye(s, 8, 8);
  eye(s, 14, 8);
  s.rect(11, 12, 2, 1, 'm');
  s.rect(11, 14, 2, 2, 'p');
  s.rect(7, 25, 4, 2, 'f').rect(13, 25, 4, 2, 'f');
  neckwear(s, (_x, y) => y === 15 || y === 16, [
    [11, 17],
    [12, 17],
    [11, 18],
    [12, 18],
    [11, 19],
    [12, 19],
  ]);
  return finishPet(s);
}

/** Curls through a poodle's coat: a little light here and there. */
function curls(s: Sketch): void {
  for (let y = 0; y < s.height; y++) {
    for (let x = 0; x < s.width; x++) {
      if (s.get(x, y) === 'f' && (x * 3 + y * 5) % 7 === 0) s.set(x, y, 'l');
    }
  }
}

/** Dolly, side on: a standard poodle, pom-poms and all, her ears down. */
function poodleSide(frame: 0 | 1): SpriteSource {
  const s = new Sketch(36, 30);
  const ground = 28;
  s.rect(6, 9, 2, 6, 'f').ellipse(6, 7, 3, 3, 'f');
  const legs = frame === 0 ? [8, 11, 23, 26] : [6, 13, 21, 28];
  for (const x of legs) {
    leg(s, x, 17, ground, 2);
    s.ellipse(x + 1, ground - 1, 2.5, 2, 'f');
  }
  s.ellipse(14, 15, 7.5, 4.5, 'f');
  s.ellipse(22, 13, 6, 6, 'f');
  s.ellipse(27, 6, 5, 5, 'f');
  s.ellipse(27, 2.5, 4, 2.5, 'f');
  s.rect(30, 6, 5, 3, 'f');
  eye(s, 28, 4);
  s.set(35, 6, 'm');
  curls(s);
  s.ellipse(24, 8, 2.5, 4.5, 'm');
  neckwear(s, (x, y) => (x === 23 || x === 24) && y >= 9 && y <= 16, [
    [25, 16],
    [26, 16],
    [25, 17],
    [26, 17],
    [25, 18],
  ]);
  return finishPet(s);
}

function poodleSit(): SpriteSource {
  const s = new Sketch(24, 30);
  s.ellipse(12, 21, 8, 8, 'f');
  s.ellipse(12, 9, 6, 6, 'f');
  s.ellipse(12, 3.5, 5, 3.5, 'f');
  s.ellipse(12, 13, 3, 2.5, 'f');
  curls(s);
  s.ellipse(5, 11, 2.5, 5, 'm').ellipse(19, 11, 2.5, 5, 'm');
  eye(s, 8, 8);
  eye(s, 14, 8);
  s.rect(11, 12, 2, 1, 'm');
  s.rect(6, 27, 4, 2, 'f').rect(14, 27, 4, 2, 'f');
  neckwear(s, (_x, y) => y === 16 || y === 17, [
    [11, 18],
    [12, 18],
    [11, 19],
    [12, 19],
    [11, 20],
    [12, 20],
  ]);
  return finishPet(s);
}

/** Gary: a long soft body, a spiral shell, and his eyes up on their stalks. */
function snail(frame: 0 | 1): SpriteSource {
  const s = new Sketch(28, 18);
  const stretch = frame === 1 ? 1 : 0;
  s.ellipse(13, 14.5, 12 + stretch, 2.5, 'f');
  s.ellipse(22 + stretch, 11, 3.5, 4.5, 'f');
  s.rect(21 + stretch, 2, 1, 6, 'f').rect(24 + stretch, 3, 1, 5, 'f');
  s.set(21 + stretch, 1, 'e').set(24 + stretch, 2, 'e');
  neckwear(s, (x, y) => (x === 19 + stretch || x === 20 + stretch) && y >= 8 && y <= 16, [
    [21 + stretch, 15],
  ]);
  // The shell over his back, and its spiral.
  const shell = new Sketch(28, 18).sphere(10, 8.5, 7.5, 7, 'CCcc');
  s.stamp(shell, 0, 0);
  for (const [x, y] of [
    [10, 8],
    [11, 8],
    [11, 9],
    [10, 10],
    [9, 10],
    [8, 9],
    [8, 8],
    [8, 7],
    [9, 6],
    [11, 6],
    [12, 7],
    [13, 8],
    [13, 10],
    [12, 11],
  ] as const) {
    s.set(x, y, 'C');
  }
  const out = finishPet(s);
  return out;
}

/** Florence asleep under her blue blanket, just her head poking out. */
function florenceAsleep(): SpriteSource {
  const s = new Sketch(32, 18);
  s.ellipse(24, 10, 5.5, 5, 'f');
  ear(s, 21, 2, 5);
  ear(s, 26, 2, 5);
  s.rect(22, 10, 2, 1, 's').rect(26, 10, 2, 1, 's').set(28, 12, 'p');
  s.ellipse(11, 11, 11, 6, 'b').rect(1, 11, 21, 5, 'b');
  for (const x of [5, 10, 15])
    for (let y = 5; y < 16; y++) if (s.get(x, y) === 'b') s.set(x, y, 'c');
  s.bevel('bc', null, 'B');
  neckwear(s, () => false, [[20, 13]]);
  return finishPet(s);
}

/** Elvira curled up in a ball, her plume of a tail round her nose. */
function elviraCurled(): SpriteSource {
  const s = new Sketch(30, 16);
  s.ellipse(13, 9.5, 12, 5.5, 'm');
  s.ellipse(22, 9, 5, 4.5, 'f');
  ear(s, 20, 1, 5, false);
  ear(s, 25, 1, 5, false);
  s.set(20, 2, 'm').set(25, 2, 'm');
  s.rect(21, 9, 2, 1, 'h').rect(24, 9, 2, 1, 'h').set(26, 11, 'p');
  s.ellipse(15, 13, 9, 2, 'f');
  neckwear(s, (x, y) => x === 18 && y >= 7 && y <= 12, [[19, 13]]);
  return finishPet(s);
}

/**
 * A cat sitting with its back to her (V1's R6c): watching the fire, or looking up at her when
 * she's further up the room. Its ears from behind, its tail round its paws on the ground.
 */
function catBack(kind: Cat): SpriteSource {
  const s = new Sketch(20, 24);
  s.ellipse(10, 17, 7, kind === 'bambino' ? 5 : 6, 'f');
  s.ellipse(10, 8.5, 6.5, 5.5, 'f');
  ear(s, 5, 0, 5, false);
  ear(s, 14, 0, 5, false);
  // The tail curls out from under her, along the floor to the right.
  s.rect(14, 21, 5, 2, 'f').rect(17, 19, 2, 2, 'f');
  if (kind === 'sphynx') s.set(8, 5, 's').set(10, 4, 's').set(12, 5, 's').set(10, 6, 's');
  if (kind === 'fluffy') {
    // All tuxedo from behind, but for the tip of her plume and two white socks.
    for (let y = 0; y < s.height; y++) {
      for (let x = 0; x < s.width; x++) if (s.get(x, y) === 'f' && y < 21) s.set(x, y, 'm');
    }
    s.rect(17, 19, 2, 2, 'f');
  }
  neckwear(s, (_x, y) => y === 13 || y === 14, []);
  return finishPet(s);
}

/** Fibi from behind: her big ears up, her bushy tail down along the floor. */
function shepherdBack(): SpriteSource {
  const s = new Sketch(24, 28);
  s.ellipse(12, 19, 8, 8, 'f');
  s.ellipse(12, 9, 6.5, 6, 'f');
  ear(s, 7, 0, 6, false);
  ear(s, 17, 0, 6, false);
  s.ellipse(17.5, 24.5, 3.5, 2.5, 'f');
  s.rect(11, 8, 2, 8, 'm');
  neckwear(s, (_x, y) => y === 15 || y === 16, []);
  return finishPet(s);
}

/** Dolly from behind: her topknot, her ears down, and the pom-pom of her tail. */
function poodleBack(): SpriteSource {
  const s = new Sketch(24, 30);
  s.ellipse(12, 21, 8, 8, 'f');
  s.ellipse(12, 9, 6, 6, 'f');
  s.ellipse(12, 3.5, 5, 3.5, 'f');
  s.ellipse(12, 24, 3, 3, 'f');
  curls(s);
  s.ellipse(5, 11, 2.5, 5, 'm').ellipse(19, 11, 2.5, 5, 'm');
  s.rect(6, 27, 4, 2, 'f').rect(14, 27, 4, 2, 'f');
  neckwear(s, (_x, y) => y === 16 || y === 17, []);
  return finishPet(s);
}

/** The spiral of Gary's shell, keyed `C` over its `CCcc` sphere, round a centre. */
function spiral(s: Sketch, cx: number, cy: number): void {
  for (const [x, y] of [
    [0, 0],
    [1, 0],
    [1, 1],
    [0, 2],
    [-1, 2],
    [-2, 1],
    [-2, 0],
    [-2, -1],
    [-1, -2],
    [1, -2],
    [2, -1],
    [3, 0],
    [3, 2],
    [2, 3],
  ] as const) {
    s.set(cx + x, cy + y, 'C');
  }
}

/** Gary facing her: his shell up behind him, his face and both eye stalks. */
function snailFront(): SpriteSource {
  const s = new Sketch(22, 20);
  s.ellipse(11, 17, 9, 2.5, 'f');
  const shell = new Sketch(22, 20).sphere(11, 8.5, 7, 7, 'CCcc');
  s.stamp(shell, 0, 0);
  spiral(s, 11, 8);
  s.ellipse(11, 13.5, 4, 3.5, 'f');
  s.rect(8, 4, 1, 7, 'f').rect(14, 4, 1, 7, 'f');
  s.set(8, 3, 'e').set(14, 3, 'e');
  s.set(10, 14, 'e').set(12, 14, 'e');
  neckwear(s, (x, y) => y === 16 && x >= 8 && x <= 14, [[11, 17]]);
  return finishPet(s);
}

/** Gary from behind: all shell, with the tips of his stalks peeping over it. */
function snailBack(): SpriteSource {
  const s = new Sketch(22, 20);
  s.ellipse(11, 17, 9, 2.5, 'f');
  s.rect(8, 1, 1, 5, 'f').rect(14, 1, 1, 5, 'f');
  s.set(8, 0, 'e').set(14, 0, 'e');
  const shell = new Sketch(22, 20).sphere(11, 10, 7.5, 7, 'CCcc');
  s.stamp(shell, 0, 0);
  spiral(s, 11, 10);
  neckwear(s, () => false, [[11, 18]]);
  return finishPet(s);
}

/** Gary tucked into his shell for a nap: his job (V1's R6c). */
function snailTucked(): SpriteSource {
  const s = new Sketch(28, 18);
  s.ellipse(12, 15.5, 7, 1.5, 'f');
  const shell = new Sketch(28, 18).sphere(10, 9.5, 7.5, 7, 'CCcc');
  s.stamp(shell, 0, 0);
  spiral(s, 10, 9);
  neckwear(s, () => false, [[17, 16]]);
  return finishPet(s);
}

/** Gary's trick, at last: stretched up tall, both stalks as high as they'll go. Ta-da. */
function snailTaDa(): SpriteSource {
  const s = new Sketch(28, 24);
  s.ellipse(13, 20.5, 12, 2.5, 'f');
  s.ellipse(22, 15, 3.5, 6, 'f');
  s.rect(20, 2, 1, 10, 'f').rect(24, 1, 1, 11, 'f');
  s.set(20, 1, 'e').set(24, 0, 'e');
  neckwear(s, (x, y) => (x === 19 || x === 20) && y >= 13 && y <= 22, [[21, 21]]);
  const shell = new Sketch(28, 24).sphere(10, 14.5, 7.5, 7, 'CCcc');
  s.stamp(shell, 0, 0);
  spiral(s, 10, 14);
  return finishPet(s);
}

/** Florence on her side, belly to her, paws out, her blanket over her back end: rolling over. */
function florenceRolling(onBack: boolean): SpriteSource {
  const s = new Sketch(32, 20);
  if (onBack) {
    // Belly up, all four paws in the air, her head upside down at the end.
    s.ellipse(15, 13, 10, 4.5, 'f');
    for (const x of [8, 12, 18, 22]) s.rect(x, 4, 3, 6, 'f');
    s.ellipse(26.5, 12, 5, 4.5, 'f');
    // Her ears point down, her head being upside down.
    for (const tip of [24, 29]) {
      for (let i = 0; i < 4; i++) {
        const half = Math.floor(i / 2);
        s.rect(tip - half, 19 - i, half * 2 + 1, 1, 'f');
      }
    }
    s.rect(24, 12, 2, 1, 's').rect(28, 12, 1, 1, 's').set(26, 10, 'p');
    s.ellipse(15, 14.5, 6, 2, 'l');
  } else {
    s.ellipse(15, 13, 10, 4.5, 'f');
    s.rect(9, 16, 4, 2, 'f').rect(19, 16, 4, 2, 'f');
    s.ellipse(26.5, 10, 5, 4.5, 'f');
    ear(s, 24, 3, 5);
    ear(s, 29, 4, 4);
    eye(s, 26, 9);
    s.set(30, 11, 'p');
  }
  // Her blanket, still over her back half, as it always is.
  s.ellipse(8, 13, 7.5, 5, 'b').rect(1, 13, 13, 5, 'b');
  for (const x of [4, 9]) for (let y = 7; y < 18; y++) if (s.get(x, y) === 'b') s.set(x, y, 'c');
  s.bevel('bc', null, 'B');
  neckwear(s, (x, y) => (x === 20 || x === 21) && y >= 9 && y <= 16, [[22, 17]]);
  return finishPet(s);
}

/** Fibi sitting up tall, front paws up, begging: `high` as she bobs. */
function shepherdBeg(high: boolean): SpriteSource {
  const s = new Sketch(24, 30);
  const up = high ? 1 : 0;
  s.ellipse(12, 21, 6.5, 8, 'f');
  s.ellipse(12, 9 - up, 6.5, 6, 'f');
  s.ellipse(12, 13 - up, 3.5, 2.5, 'f');
  ear(s, 7, 0 - up + 1, 6);
  ear(s, 17, 0 - up + 1, 6);
  eye(s, 8, 8 - up);
  eye(s, 14, 8 - up);
  s.rect(11, 12 - up, 2, 1, 'm');
  s.rect(11, 14 - up, 2, 2, 'p');
  // Paws up at her chest, tucked in.
  s.rect(7, 16 - up * 2, 3, 3, 'f').rect(14, 16 - up * 2, 3, 3, 'f');
  s.rect(7, 27, 4, 2, 'f').rect(13, 27, 4, 2, 'f');
  neckwear(s, (_x, y) => y === 15 - up || y === 16 - up, [
    [11, 17 - up],
    [12, 17 - up],
    [11, 18 - up],
    [12, 18 - up],
  ]);
  return finishPet(s);
}

/** Dolly mid-spin, facing her, her ears flung out either side. */
function poodleSpin(): SpriteSource {
  const s = new Sketch(28, 30);
  s.ellipse(14, 21, 8, 8, 'f');
  s.ellipse(14, 9, 6, 6, 'f');
  s.ellipse(14, 3.5, 5, 3.5, 'f');
  s.ellipse(14, 13, 3, 2.5, 'f');
  curls(s);
  s.ellipse(5, 8, 4, 2.5, 'm').ellipse(23, 8, 4, 2.5, 'm');
  eye(s, 10, 8);
  eye(s, 16, 8);
  s.rect(13, 12, 2, 1, 'm');
  s.rect(9, 27, 4, 2, 'f').rect(15, 27, 4, 2, 'f');
  neckwear(s, (_x, y) => y === 16 || y === 17, [
    [13, 18],
    [14, 18],
    [13, 19],
    [14, 19],
  ]);
  return finishPet(s);
}

/** A grid turned a quarter at a time clockwise: Wybie upside down in his loop. */
function turned(source: SpriteSource, quarters: 1 | 2 | 3): SpriteSource {
  let rows = [...source.rows];
  for (let q = 0; q < quarters; q++) {
    const h = rows.length;
    const w = rows[0]!.length;
    const next: string[] = [];
    for (let x = 0; x < w; x++) {
      let row = '';
      for (let y = h - 1; y >= 0; y--) row += rows[y]![x];
      next.push(row);
    }
    rows = next;
  }
  return { rows };
}

/** Elvira, all but gone: a curl of green mist where she was. */
function elviraWisp(): SpriteSource {
  const s = new Sketch(16, 14);
  s.ellipse(8, 10, 5, 2.5, 'f');
  s.ellipse(6, 6.5, 2.5, 2.5, 'f');
  s.ellipse(10, 4, 2, 2, 'f');
  s.set(12, 1, 'f').set(13, 2, 'f');
  s.set(7, 9, 'h').set(9, 9, 'h');
  neckwear(s, () => false, []);
  return finishPet(s);
}

const CAT_SIDE_0 = catSide('sphynx', 0);
const CAT_SIDE_1 = catSide('sphynx', 1);
const CAT_SIT = catSit('sphynx');
const FLORENCE_ASLEEP = florenceAsleep();
const SHEPHERD_SIDE_0 = shepherdSide(0);
const SHEPHERD_SIDE_1 = shepherdSide(1);
const SHEPHERD_SIT = shepherdSit();
const POODLE_SIDE_0 = poodleSide(0);
const POODLE_SIDE_1 = poodleSide(1);
const POODLE_SIT = poodleSit();
const SNAIL_0 = snail(0);
const SNAIL_1 = snail(1);
const BAMBINO_SIDE_0 = catSide('bambino', 0);
const BAMBINO_SIDE_1 = catSide('bambino', 1);
const BAMBINO_SIT = catSit('bambino');
const FLUFFY_SIDE_0 = catSide('fluffy', 0);
const FLUFFY_SIDE_1 = catSide('fluffy', 1);
const FLUFFY_SIT = catSit('fluffy');
const ELVIRA_CURLED = elviraCurled();

/** How a pet is drawn: which grid, for what it's doing. */
export type PetFrame =
  'side0' | 'side1' | 'sitFront' | 'sitBack' | 'rest' | 'trick0' | 'trick1' | 'trick2';

export interface PetArt {
  side: readonly [SpriteSource, SpriteSource];
  /** Sitting facing her, into the room. */
  sitFront: SpriteSource;
  /** Sitting with its back to her (V1's R6c): watching the fire, or looking up the room at her. */
  sitBack: SpriteSource;
  /** Florence asleep under her blanket, Elvira curled up, or Gary tucked into his shell. */
  rest?: SpriteSource;
  /** The frames of its trick (V1's R6c) that it has none of already, one to three. */
  trick: readonly SpriteSource[];
  palette: Palette;
  /** A ghost pet's soft glow after dark: every key in one pale colour (decisions.md 17). */
  glow?: Palette;
}

/**
 * A moment of a trick: from `at` (0 to 1 through it), which frame, turned round (`flip`, against
 * the way it faces), lifted and moved along (in pixels), and how solid it is.
 */
export interface TrickStep {
  at: number;
  frame: PetFrame;
  flip?: boolean;
  lift?: number;
  dx?: number;
  alpha?: number;
}

/**
 * Each trick, beat by beat (V1's R6c): Florence rolls over, Fibi sits up and begs, Dolly spins,
 * Gary… eventually, Wybie loops the loop, Elvira fades away and back.
 */
export const TRICK_STEPS: Record<PetId, readonly TrickStep[]> = {
  florence: [
    { at: 0, frame: 'trick0' },
    { at: 0.3, frame: 'trick1' },
    { at: 0.65, frame: 'trick0', flip: true },
    { at: 0.9, frame: 'rest' },
  ],
  fibi: [
    { at: 0, frame: 'trick0' },
    { at: 0.25, frame: 'trick1' },
    { at: 0.5, frame: 'trick0' },
    { at: 0.75, frame: 'trick1' },
  ],
  dolly: [
    { at: 0, frame: 'side0' },
    { at: 0.125, frame: 'trick0' },
    { at: 0.25, frame: 'side0', flip: true },
    { at: 0.375, frame: 'sitBack' },
    { at: 0.5, frame: 'side0' },
    { at: 0.625, frame: 'trick0' },
    { at: 0.75, frame: 'side0', flip: true },
    { at: 0.875, frame: 'sitFront' },
  ],
  gary: [
    { at: 0, frame: 'rest' },
    { at: 0.55, frame: 'side0' },
    { at: 0.7, frame: 'trick0' },
  ],
  wybie: [
    { at: 0, frame: 'side0', lift: 2, dx: -6 },
    { at: 0.18, frame: 'trick0', lift: 12, dx: 6 },
    { at: 0.4, frame: 'trick1', lift: 22, dx: 0 },
    { at: 0.62, frame: 'trick2', lift: 12, dx: -8 },
    { at: 0.84, frame: 'side0', lift: 2, dx: 0 },
  ],
  elvira: [
    { at: 0, frame: 'sitFront', alpha: 0.7 },
    { at: 0.15, frame: 'sitFront', alpha: 0.35 },
    { at: 0.3, frame: 'trick0', alpha: 0.5 },
    { at: 0.55, frame: 'trick0', alpha: 0.25 },
    { at: 0.7, frame: 'sitFront', alpha: 0.35 },
    { at: 0.85, frame: 'sitFront', alpha: 0.7 },
  ],
};

/** The beat of its trick a pet is at, `done` of the way through it. */
export function trickStep(id: PetId, done: number): TrickStep {
  const steps = TRICK_STEPS[id];
  let step = steps[0]!;
  for (const s of steps) if (done >= s.at) step = s;
  return step;
}

/**
 * A pet's palette, with its neck and chest keys the fur they're drawn over until it's dressed, and
 * a soft outline in its fur's darkest tone.
 */
function coat(colours: Record<string, string>): Palette {
  const f = colours.f!;
  const r = ramp(f);
  return {
    '.': null,
    o: r[0],
    s: r[1],
    l: r[3],
    m: C.inkFabric,
    e: C.ink,
    p: C.roseLight,
    w: C.white,
    q: null,
    n: f,
    k: f,
    ...colours,
  };
}

/** Every key a ghost pet's grids use, lit in one colour. */
function glowing(palette: Palette, colour: string): Palette {
  return Object.fromEntries(
    Object.entries(palette).map(([key, hex]) => [key, hex === null ? null : colour]),
  );
}

const WYBIE = coat({
  f: C.stoneLight,
  s: C.stone,
  l: C.hairSilver,
  m: C.iron,
  p: C.cheek,
  e: C.orbBlue,
});

const ELVIRA = coat({
  f: C.ghost,
  s: C.skinGhostlyShade,
  m: C.iron,
  h: C.iron,
  p: C.cheek,
  e: C.orbGreen,
});

export const PET_ART: Record<PetId, PetArt> = {
  florence: {
    side: [CAT_SIDE_0, CAT_SIDE_1],
    sitFront: CAT_SIT,
    sitBack: catBack('sphynx'),
    rest: FLORENCE_ASLEEP,
    trick: [florenceRolling(false), florenceRolling(true)],
    // Her blanket is blue, with cream stripes.
    palette: coat({
      f: C.skin,
      s: C.skinShade,
      p: C.roseLight,
      e: C.eyeGreen,
      b: C.blueFabric,
      B: C.blueFabricShade,
      c: C.cream,
    }),
  },
  fibi: {
    side: [SHEPHERD_SIDE_0, SHEPHERD_SIDE_1],
    sitFront: SHEPHERD_SIT,
    sitBack: shepherdBack(),
    trick: [shepherdBeg(false), shepherdBeg(true)],
    palette: coat({
      f: C.furBlack,
      s: C.furBlackShade,
      l: C.furBlackLight,
      e: C.gold,
      p: C.roseLight,
    }),
  },
  dolly: {
    side: [POODLE_SIDE_0, POODLE_SIDE_1],
    sitFront: POODLE_SIT,
    sitBack: poodleBack(),
    trick: [poodleSpin()],
    palette: coat({ f: C.furBlack, s: C.furBlackShade, l: C.dusk, e: C.gold, p: C.roseLight }),
  },
  gary: {
    side: [SNAIL_0, SNAIL_1],
    sitFront: snailFront(),
    sitBack: snailBack(),
    rest: snailTucked(),
    trick: [snailTaDa()],
    palette: coat({ f: C.skinMintyShade, s: C.skinMinty, c: C.rope, C: C.wood, e: C.ink }),
  },
  wybie: {
    side: [BAMBINO_SIDE_0, BAMBINO_SIDE_1],
    sitFront: BAMBINO_SIT,
    sitBack: catBack('bambino'),
    // Up, over and down again: nose up, upside down, nose down.
    trick: [turned(BAMBINO_SIDE_0, 3), turned(BAMBINO_SIDE_0, 2), turned(BAMBINO_SIDE_0, 1)],
    palette: WYBIE,
    glow: glowing(WYBIE, C.orbBlueLight),
  },
  elvira: {
    side: [FLUFFY_SIDE_0, FLUFFY_SIDE_1],
    sitFront: FLUFFY_SIT,
    sitBack: catBack('fluffy'),
    rest: ELVIRA_CURLED,
    trick: [elviraWisp()],
    palette: ELVIRA,
    glow: glowing(ELVIRA, C.orbGreenLight),
  },
};

/**
 * The grid a pet is drawn from for a frame; one without a rest pose sits instead, and a trick's
 * frame it hasn't is its first.
 */
export function petSource(id: PetId, frame: PetFrame): SpriteSource {
  const art = PET_ART[id];
  if (frame === 'side0') return art.side[0];
  if (frame === 'side1') return art.side[1];
  if (frame === 'sitBack') return art.sitBack;
  if (frame === 'rest') return art.rest ?? art.sitFront;
  if (frame === 'trick0' || frame === 'trick1' || frame === 'trick2') {
    const i = Number(frame.slice(-1));
    return art.trick[i] ?? art.trick[0] ?? art.sitFront;
  }
  return art.sitFront;
}

/** Each accessory's colour, and its spikes' or bell's. */
export const ACCESSORY_ART: Record<AccessoryId, { colour: string; bits?: string }> = {
  pinkSpikedCollar: { colour: C.roseLight, bits: C.silver },
  plumSpikedCollar: { colour: C.plumLight, bits: C.silver },
  blueBandana: { colour: C.blueFabric },
  scarletBandana: { colour: C.scarlet },
  lavenderBandana: { colour: C.lavender },
  pumpkinBandana: { colour: C.pumpkin },
  mossBandana: { colour: C.mossLight },
  skyBandana: { colour: C.sky },
  ghostBandana: { colour: C.ghost },
  tealCollar: { colour: C.tealLight },
  roseCollar: { colour: C.rose },
  bellCollar: { colour: C.scarlet, bits: C.gold },
};

/** Which keys an accessory of each style paints. */
const PAINTS: Record<AccessoryStyle, readonly ('n' | 'k' | 'q')[]> = {
  collar: ['n'],
  spiked: ['n', 'q'],
  bell: ['n', 'q'],
  bandana: ['n', 'k'],
};

/** A pet's palette, wearing `accessory`. */
export function petPalette(id: PetId, accessory: AccessoryId | null): Palette {
  const palette = PET_ART[id].palette;
  if (!accessory) return palette;
  const { colour, bits } = ACCESSORY_ART[accessory];
  const worn: Record<string, string> = {};
  for (const key of PAINTS[ACCESSORIES[accessory].style]) {
    worn[key] = key === 'q' ? (bits ?? colour) : colour;
  }
  return { ...palette, ...worn };
}

/** A collar, for the shop and the pet sheet: a ring, with its spikes or bell. */
const COLLAR_ICON: SpriteSource = {
  rows: [
    '................',
    '................',
    '................',
    '.....oqoqoqo....',
    '...oonnnnnnnoo..',
    '..onnoooooooonno',
    '.qno........onq.',
    '..no........on..',
    '.qno........onq.',
    '..onnoooooooonn.',
    '...oonnnnnnnoo..',
    '.....ooooqqoo...',
    '.........oqo....',
    '..........o.....',
    '................',
    '................',
  ],
};

/** A bandana, folded to a point with its knot. */
const BANDANA_ICON: SpriteSource = {
  rows: [
    '................',
    '................',
    '................',
    '..o..........o..',
    '.ono........ono.',
    '..onoooooooono..',
    '...onnnnnnnno...',
    '...okkkkkkkko...',
    '....okkkkkko....',
    '....okkwkkko....',
    '.....okkkko.....',
    '......okko......',
    '......okko......',
    '.......oo.......',
    '................',
    '................',
  ],
};

/** An accessory on its own, as the shop and the pet sheet show it. */
export function accessoryIcon(id: AccessoryId): { source: SpriteSource; palette: Palette } {
  const { colour, bits } = ACCESSORY_ART[id];
  const bandana = ACCESSORIES[id].style === 'bandana';
  const shade = colour === C.ghost ? C.silver : C.ink;
  return {
    source: bandana ? BANDANA_ICON : COLLAR_ICON,
    palette: { '.': null, o: shade, n: colour, k: colour, w: C.white, q: bits ?? shade },
  };
}

/** A little bubble above a pet. `w` is the bubble, `o` its edge and `x` what's in it. */
export interface BubbleArt {
  source: SpriteSource;
  palette: Palette;
}

const BUBBLE_EDGE = { '.': null, o: C.ink, w: C.white } as const;

export const BUBBLE_ART: Record<Bubble, BubbleArt> = {
  // Dolly's bark: a spiky bubble with a "!".
  woof: {
    source: {
      rows: [
        '..o...o...',
        '.owo.owo..',
        'owwwowwwoo',
        '.owwxwwwwo',
        'owwwxwwwo.',
        '.owwwwwwwo',
        'owwwxwwwo.',
        '.oowwwoowo',
        '...owo..o.',
        '....o.....',
      ],
    },
    palette: { ...BUBBLE_EDGE, x: C.scarlet },
  },
  heart: {
    source: {
      rows: [
        '.ooooooo.',
        'owwwwwwwo',
        'owxxwxxwo',
        'owxxxxxwo',
        'owwxxxwwo',
        'owwwxwwwo',
        '.oowoooo.',
        '..oo.....',
      ],
    },
    palette: { ...BUBBLE_EDGE, x: C.roseLight },
  },
  whine: {
    source: {
      rows: [
        '.ooooooo.',
        'owwwwwwwo',
        'owxwwwxwo',
        'owwxwxwxo',
        'owwwxwwwo',
        'owwwwwwwo',
        '.oowoooo.',
        '..oo.....',
      ],
    },
    palette: { ...BUBBLE_EDGE, x: C.plumLight },
  },
  dots: {
    source: {
      rows: [
        '.ooooooo.',
        'owwwwwwwo',
        'owwwwwwwo',
        'owxwxwxwo',
        'owwwwwwwo',
        '.oowoooo.',
        '..oo.....',
      ],
    },
    palette: { ...BUBBLE_EDGE, x: C.ink },
  },
  // A nose on the trail (V1's R6c): three little sniffs, in a bubble.
  sniff: {
    source: {
      rows: [
        '.ooooooo.',
        'owwwwwwwo',
        'owxwwwwwo',
        'owwwxwwwo',
        'owwwwwxwo',
        'owwwwwwwo',
        '.oowoooo.',
        '..oo.....',
      ],
    },
    palette: { ...BUBBLE_EDGE, x: C.wood },
  },
  // Found it! A gold "!".
  found: {
    source: {
      rows: [
        '.ooooooo.',
        'owwwxwwwo',
        'owwwxwwwo',
        'owwwxwwwo',
        'owwwwwwwo',
        'owwwxwwwo',
        '.oowoooo.',
        '..oo.....',
      ],
    },
    palette: { ...BUBBLE_EDGE, x: C.gold },
  },
  // Florence's Zs, rising from under her blanket: no bubble, just the Zs.
  zzz: {
    source: {
      rows: ['....xxx', '.....x.', '....xxx', 'xxx....', '.x.....', 'xxx....'],
    },
    palette: { '.': null, x: C.ghost },
  },
};
