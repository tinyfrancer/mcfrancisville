import type { CritterId } from '../types/ids';
import type { CritterArt } from './critters';
import { mix, PALETTE as C } from './palette';
import { CLEAR, Sketch } from './sketch';
import type { SpriteSource } from './sprite';

/*
 * The jumping spiders (V1's R5, decision 275), drawn to the spider rules (`docs/art_style.md`):
 * face on, round and fuzzy, two great big shiny eyes in front and a little one each side, short
 * stubby bent legs four a side, and no fangs, hairs or pincers. Their second frame is a little
 * hop on the spot, legs straightened under them, never toward her; the peacock jumper lifts its
 * fan instead. 16 for her bag and 24 out and about, from the same numbers, as the crawlies are.
 */

type Size = 16 | 24;
type Kind = 'zebra' | 'bold' | 'peacock';

const scale = (size: Size) => {
  const k = size / 24;
  return { k, at: (n: number) => Math.round(n * k) };
};

/**
 * A jumping spider face on. `a`/`A` its round back (lit `A`), `b`/`B` its face (lit `B`), a
 * dithered fuzzy edge `f`, eyes `e` with a white glint `w`, rosy cheeks `c`, legs `l`. A zebra's back is striped
 * (`z`), a bold one's spotted (`z`) with a shy green smile (`g`), and a peacock's carries its fan
 * (`p`, `q`, `r`), folded flat or, in the second frame, lifted up behind it.
 */
function jumper(size: Size, second: boolean, kind: Kind): SpriteSource {
  const { k, at } = scale(size);
  const s = new Sketch(size, size);
  const hop = second && kind !== 'peacock' ? Math.max(1, at(2)) : 0;
  const ground = at(21);
  const c = { x: 12 * k, y: 14 * k - hop };
  // The fan goes up behind everything else, lifted in the second frame.
  if (kind === 'peacock' && second) {
    s.ellipse(c.x, c.y - 4.5 * k, 8 * k, 6 * k, 'p');
    s.ellipse(c.x, c.y - 4.5 * k, 6 * k, 4.5 * k, 'q');
    s.ellipse(c.x, c.y - 4.5 * k, 3.5 * k, 2.6 * k, 'r');
    for (let x = 0; x < size; x++)
      for (let y = Math.round(c.y - 2 * k); y < size; y++) s.set(x, y, CLEAR);
  }
  const legs = new Sketch(size, size);
  for (const [i, dy] of [-1.5, 0, 1.5, 3].entries()) {
    const y = c.y + dy * k;
    const out = (6.5 + (i === 1 || i === 2 ? 1 : 0)) * k;
    const knee = { x: c.x - out, y: y - 1.4 * k };
    legs.line(Math.round(c.x - 3 * k), Math.round(y), Math.round(knee.x), Math.round(knee.y), 'l');
    const foot = Math.min(ground, Math.round(knee.y + 3 * k) + hop);
    legs.line(Math.round(knee.x), Math.round(knee.y), Math.round(knee.x - k), foot, 'l');
  }
  s.stamp(legs, 0, 0).stamp(legs, 0, 0, { flipX: true });
  // Its round back peeps up behind its face.
  s.sphere(c.x, c.y - 3.5 * k, 5.8 * k, 4.6 * k, 'aaA');
  if (kind === 'zebra') {
    for (const dy of [-6, -4, -2]) {
      const y = Math.round(c.y + dy * k);
      for (let x = 0; x < size; x++) {
        const key = s.get(x, y);
        if (key === 'a' || key === 'A') s.set(x, y, 'z');
      }
    }
  } else if (kind === 'bold') {
    for (const [dx, dy] of [
      [0, -6],
      [-2.5, -4],
      [2.5, -4],
    ] as const) {
      s.rect(Math.round(c.x + dx * k), Math.round(c.y + dy * k), Math.max(1, at(1.5)), 1, 'z');
    }
  } else if (!second) {
    // The peacock's fan lies folded on its back: a band of blue, and orange round it.
    for (let x = 0; x < size; x++) {
      for (let y = 0; y < Math.round(c.y - 1.5 * k); y++) {
        const key = s.get(x, y);
        if (key !== 'a' && key !== 'A') continue;
        const d = Math.abs(x + 0.5 - c.x) / k;
        s.set(x, y, d < 1.6 ? 'r' : d < 3.4 ? 'q' : 'p');
      }
    }
  }
  s.sphere(c.x, c.y + 1.5 * k, 5 * k, 4.2 * k, 'bbB');
  for (let t = 0; t < Math.PI * 2; t += 0.25) {
    const x = Math.round(c.x + Math.cos(t) * 5.7 * k);
    const y = Math.round(c.y + 1.5 * k + Math.sin(t) * 4.9 * k);
    if ((x + y) % 2 === 0 && s.get(x, y) === CLEAR) s.set(x, y, 'f');
  }
  // Two great big shiny eyes in front, and a small one each side.
  const eye = size === 24 ? 4 : 3;
  for (const ex of [c.x - 0.5 - eye, c.x + 0.5]) {
    const x = Math.round(ex);
    const y = Math.round(c.y + 0.5 * k);
    s.rect(x, y, eye, eye, 'e');
    s.set(x, y, 'w');
    if (size === 24) s.set(x + 1, y, 'w').set(x, y + 1, 'w');
  }
  s.set(Math.round(c.x - 4.5 * k), Math.round(c.y), 'e');
  s.set(Math.round(c.x + 4.5 * k) - 1, Math.round(c.y), 'e');
  const below = Math.round(c.y + 0.5 * k) + eye;
  if (size === 24) {
    s.set(Math.round(c.x - 0.5 - eye) - 1, below, 'c').set(Math.round(c.x + 0.5) + eye, below, 'c');
  }
  if (kind === 'bold') s.rect(Math.round(c.x) - 1, below + (size === 24 ? 1 : 0), 2, 1, 'g');
  s.outline((key) => (key === 'f' || key === 'l' ? null : 'o'));
  return s.toSource();
}

const both = <T>(make: (second: boolean) => T): readonly [T, T] => [make(false), make(true)];

const art = (kind: Kind, palette: CritterArt['palette']): CritterArt => ({
  frames: both((second) => jumper(16, second, kind)),
  world: both((second) => jumper(24, second, kind)),
  palette,
});

/** The three jumping spiders' art (V1's R5). */
export const JUMPER_ART = {
  zebraJumper: art('zebra', {
    '.': null,
    o: C.ink,
    a: C.furBlackLight,
    A: C.stoneDark,
    z: C.white,
    b: C.furBlackLight,
    B: C.stoneDark,
    f: C.silver,
    l: C.stoneDark,
    e: C.ink,
    w: C.white,
    c: C.cheek,
  }),
  boldJumper: art('bold', {
    '.': null,
    o: C.ink,
    a: C.furBlack,
    A: C.furBlackLight,
    z: C.white,
    b: C.furBlackLight,
    B: C.stoneDark,
    f: C.stone,
    l: C.furBlackLight,
    e: C.ink,
    w: C.white,
    c: C.cheek,
    g: C.mint,
  }),
  peacockJumper: art('peacock', {
    '.': null,
    o: C.barkDark,
    a: C.bark,
    A: C.hairBrown,
    p: C.pumpkin,
    q: C.sky,
    r: mix(C.navy, C.sky, 0.35),
    b: C.hairBrown,
    B: C.hairBlonde,
    f: C.cream,
    l: C.hairBrown,
    e: C.ink,
    w: C.white,
    c: C.cheek,
  }),
} satisfies Partial<Record<CritterId, CritterArt>>;
