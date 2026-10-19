import { CLEAR, Sketch } from './sketch';
import type { SpriteSource } from './sprite';

/*
 * The critters redrawn where they read wrong at phone size (V1's L6, decision 292): the frog, a
 * box with dots for eyes, is a squat frog with shiny eyes, folded legs and a smile; the mist newt
 * is a newt, not a frog in lavender; the firefly is a beetle with a glowing tail rather than a bar
 * and a bulb; the Hercules beetle's horn curves up out of a glossy shield instead of standing like
 * a bottle's neck; the fog eel is a ribbon with a face. The mourning cloak, the tombstone toad and
 * the reed frog, palettes on their family's shapes, get the markings that make each itself. Each
 * is a grid in the family's own keys, so its palette still says its colours.
 */

const WORLD = 24;

/** Outlines everything painted in `o`, but for the keys in `bare` (a glow isn't outlined). */
function outlined(s: Sketch, bare = ''): SpriteSource {
  s.outline((key) => (bare.includes(key) ? null : 'o'));
  return s.toSource();
}

/** A grid with some of its pixels changed: `touch` says each pixel's new key, or keeps its own. */
function touched(
  source: SpriteSource,
  touch: (x: number, y: number, key: string) => string,
): SpriteSource {
  return { rows: source.rows.map((row, y) => [...row].map((key, x) => touch(x, y, key)).join('')) };
}

/**
 * A frog sat squat, face on, at 24: a round body under two eye bumps, shiny eyes (`e`, a glint
 * `E`), a smile (`m`), a pale tummy (`G`), back legs folded at its sides and two little hands in
 * front, and a few spots (`s`) on its back.
 */
export function frogFace(): SpriteSource {
  const s = new Sketch(WORLD, WORLD);
  // The back legs folded up at its sides, behind it.
  s.ellipse(4.5, 17.5, 3, 3, 'g').ellipse(19.5, 17.5, 3, 3, 'g');
  s.rect(1, 20, 5, 1, 'g').rect(18, 20, 5, 1, 'g');
  s.outline(() => 'o');
  s.ellipse(12, 15.5, 8, 5.5, 'g');
  s.ellipse(7.5, 10.5, 3, 3, 'g').ellipse(16.5, 10.5, 3, 3, 'g');
  s.ellipse(12, 17.5, 4.5, 3, 'G');
  // Its hands, on the ground in front of its tummy.
  s.rect(8, 20, 2, 1, 'g').rect(14, 20, 2, 1, 'g');
  for (const x of [7, 16]) s.rect(x, 9, 2, 3, 'e').set(x, 9, 'E');
  s.rect(10, 14, 4, 1, 'm').set(9, 13, 'm').set(14, 13, 'm');
  for (const [x, y] of [
    [5, 13],
    [18, 13],
    [11, 11],
    [13, 12],
  ] as const) {
    s.set(x, y, 's');
  }
  s.outline((key) => (key === 'o' ? null : 'o'));
  return s.toSource();
}

/**
 * A newt side on, facing right, 16 or 24 across: a slim body (`b`, its belly `B`) low on four
 * splayed legs, a long tail curling up at its tip, a round head with a shiny eye (`e`, `E`) and a
 * smile (`m`), and glowing spots (`s`) down its back. Its tail swishes between frames.
 */
export function newt(size: 16 | 24, swish: boolean): SpriteSource {
  const k = size / WORLD;
  const at = (n: number) => Math.round(n * k);
  const s = new Sketch(size, size);
  for (const [x, y] of [
    [8, 19],
    [6, 19],
    [15, 19],
    [17, 19],
  ] as const) {
    s.rect(at(x), at(y - 1), Math.max(1, at(1)), Math.max(1, at(2)), 'b');
  }
  s.ellipse(11.5 * k, 16.5 * k, 6.5 * k, 2.8 * k, 'b');
  // The tail, thinning back to a tip that curls up, and over the other way on the swish.
  const tip = swish ? -1 : 1;
  for (let i = 0; i < 6; i++) {
    const x = at(5.5 - i);
    const y = at(16.5 - (i > 2 ? (i - 2) * 0.9 * tip : 0));
    s.rect(x, y - (i < 3 ? 1 : 0), 1, i < 3 ? 2 : 1, 'b');
  }
  s.ellipse(18.5 * k, 15 * k, 4 * k, 3.2 * k, 'b');
  s.rect(at(8), at(18), at(9), 1, 'B');
  s.set(at(19), at(14), 'e');
  if (size === 24) s.set(19, 13, 'E').set(20, 14, 'e');
  s.line(at(18), at(16), at(21), at(16), 'm');
  for (const x of [7, 10, 13, 16]) s.set(at(x), at(15), 's');
  return outlined(s, 's');
}

/**
 * A firefly from above, at 24: its feelers (`a`), a dark head, a rosy shield with a dark mark
 * (`p`), wing cases lit down their left edges (`b`, `w`), and its tail aglow (`t`, bright `T`).
 * On its second frame its wings are open, pale and see-through-looking (`W`), mid-flutter.
 */
export function fireflyFrame(open: boolean): SpriteSource {
  const s = new Sketch(WORLD, WORLD);
  if (open) {
    s.ellipse(6.5, 11, 4, 2.5, 'W').ellipse(17.5, 11, 4, 2.5, 'W');
  }
  s.ellipse(12, 13.5, 4, 4.5, 'b');
  s.rect(11, 10, 2, 8, 'k');
  s.line(9, 11, 9, 16, 'w');
  s.ellipse(12, 8.5, 3, 1.8, 'p');
  s.rect(11, 8, 2, 1, 'k');
  s.ellipse(12, 6, 1.6, 1.2, 'k');
  s.line(11, 5, 9, 2, 'a').line(12, 5, 14, 2, 'a');
  s.outline((key) => (key === 'a' ? null : 'o'));
  s.ellipse(12, 19, 2.6, 2.4, 't');
  s.rect(11, 18, 2, 2, 'T');
  return s.toSource();
}

/**
 * A Hercules beetle from above, 16 or 24 across: a broad olive-gold back split down the middle
 * (`W`, `w`) with dark spots (`s`), six legs bent out from under it, a glossy black shield (`h`,
 * lit `H`), and its long horn curving up from the shield to a point, a tooth along its side.
 */
export function hercules(size: 16 | 24): SpriteSource {
  const k = size / WORLD;
  const at = (n: number) => Math.round(n * k);
  const s = new Sketch(size, size);
  for (const [x0, y0, x1, y1] of [
    [8, 13, 3, 10],
    [7, 16, 2, 17],
    [8, 19, 4, 23],
  ] as const) {
    s.line(at(x0), at(y0), at(x1), at(y1), 'o');
    s.line(at(WORLD - 1 - x0), at(y0), at(WORLD - 1 - x1), at(y1), 'o');
  }
  s.ellipse(12 * k, 16.5 * k, 6.5 * k, 6 * k, 'W');
  s.rect(at(12) - 1, at(11), 2, at(11), 'w');
  s.ellipse(12 * k, 9.5 * k, 4 * k, 3 * k, 'h');
  // Two horns making a pincer: the long one from the shield, its tip hooked right, and the short
  // one from the head under it, bent left.
  for (const [x, y, w] of [
    [12, 6, 2],
    [12, 5, 2],
    [12, 4, 2],
    [12, 3, 1],
    [12, 2, 1],
    [13, 1, 1],
    [14, 1, 1],
    [10, 6, 1],
    [10, 5, 1],
    [9, 4, 1],
    [8, 3, 1],
  ] as const) {
    if (size === 16 && y < 3) continue;
    s.rect(at(x), at(y), Math.max(1, at(w)), 1, 'h');
  }
  if (size === 24) s.set(12, 5, 'H').set(12, 4, 'H');
  s.set(at(10), at(8), 'H').set(at(11), at(8), 'H');
  for (const [x, y] of [
    [9, 15],
    [15, 18],
    [14, 13],
    [9, 20],
  ] as const) {
    s.set(at(x), at(y), 's');
  }
  return outlined(s, 'o');
}

/**
 * A fog eel, 16 or 24 across: a soft ribbon (`f`) swaying one way or the other, a fin along its
 * back (`s`), thinning to its tail, and a round head with an eye (`e`) and a little smile (`m`).
 */
export function eel(size: 16 | 24, flick: boolean): SpriteSource {
  const k = size / WORLD;
  const at = (n: number) => Math.round(n * k);
  const s = new Sketch(size, size);
  const phase = flick ? Math.PI : 0;
  const mid = (x: number) => 12 * k + Math.sin(x / (3.2 * k) + phase) * 2.2 * k;
  const end = at(18);
  for (let x = at(1); x < end; x++) {
    const thick = x < at(5) ? 1 : x < at(9) ? 2 : 3;
    const top = Math.round(mid(x) - thick / 2);
    s.rect(x, top, 1, thick, 'f');
    if (thick > 1 && x % 2 === 0) s.set(x, top - 1, 's');
  }
  const hy = Math.round(mid(end));
  s.ellipse(end + 1.5 * k, hy, 3 * k, 2.5 * k, 'f');
  s.set(end + at(2), hy - 1, 'e');
  if (size === 24) s.set(end + 3, hy + 1, 'm').set(end + 2, hy + 1, 'm');
  return outlined(s, 's');
}

/**
 * The mourning cloak's own wings: a cream border round their outer edges (`p`) with a row of blue
 * dots inside it (`q`), over the moth's shape.
 */
export function cloaked(source: SpriteSource): SpriteSource {
  const width = source.rows[0]!.length;
  const at = (x: number, y: number) => source.rows[y]?.[x] ?? '.';
  const wing = (key: string) => key === 'W' || key === 'w';
  const edge = (x: number, y: number) =>
    [
      [0, -1],
      [1, 0],
      [0, 1],
      [-1, 0],
    ].some(([dx, dy]) => {
      const key = at(x + dx!, y + dy!);
      return key === 'o' || key === '.' || key === CLEAR;
    });
  const outer = (x: number) => Math.abs(x + 0.5 - width / 2) > width / 8;
  const bordered = touched(source, (x, y, key) =>
    wing(key) && outer(x) && edge(x, y) ? 'p' : key,
  );
  return touched(bordered, (x, y, key) => {
    if (!wing(key) || !outer(x)) return key;
    const byBorder = [
      [0, -1],
      [1, 0],
      [0, 1],
      [-1, 0],
    ].some(([dx, dy]) => bordered.rows[y + dy!]?.[x + dx!] === 'p');
    return byBorder && (x + y) % 3 === 0 ? 'q' : key;
  });
}

/** The tombstone toad's markings: a pale cross on its brow (`c`) and dark warts (`k`). */
export function tombstoned(source: SpriteSource): SpriteSource {
  const cross = new Set(['12,11', '12,12', '12,13', '11,12', '13,12']);
  const warts = new Set(['6,15', '17,16', '9,12', '15,12', '4,17', '20,17']);
  return touched(source, (x, y, key) => {
    if (key !== 'g' && key !== 's') return key;
    if (cross.has(`${x},${y}`)) return 'c';
    return warts.has(`${x},${y}`) ? 'k' : key;
  });
}

/** The reed frog's own stripe, pale down each flank from behind its eye (`c`). */
export function striped(source: SpriteSource): SpriteSource {
  const stripe = new Set([
    '5,12',
    '5,13',
    '6,14',
    '6,15',
    '18,12',
    '18,13',
    '17,14',
    '17,15',
    '4,11',
    '19,11',
  ]);
  return touched(source, (x, y, key) =>
    (key === 'g' || key === 's') && stripe.has(`${x},${y}`) ? 'c' : key,
  );
}
