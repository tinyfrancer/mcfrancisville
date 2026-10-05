import type { CritterId } from '../types/ids';
import type { CritterArt } from './critters';
import { mix, PALETTE as C, ramp } from './palette';
import { CLEAR, Sketch } from './sketch';
import type { SpriteSource } from './sprite';

/*
 * The creepy-crawlies (0.3's C2), and the farm's mud puppy and crawdad, drawn as the other
 * families are: 16 for her bag and 24 out and about, each shape worked out for either size from
 * the same numbers (`k`), lit from the top left, outlined softly in `o`. Two frames each, a slow
 * wiggle on the ground; the spider keeps perfectly still in her web (`docs/art_style.md`).
 */

type Size = 16 | 24;

/** Outlines everything painted in `o`, but for the keys in `bare` (a glow or a web isn't). */
function outlined(s: Sketch, bare = ''): SpriteSource {
  s.outline((key) => (bare.includes(key) ? null : 'o'));
  return s.toSource();
}

/** A size's pixels from the 24-pixel drawing's. */
const scale = (size: Size) => {
  const k = size / 24;
  return { k, at: (n: number) => Math.round(n * k) };
};

/**
 * A snail side on, facing right (the pumpkin snail and the golden one): a soft foot along the
 * ground (`b`, lit `B`), two eye stalks, a smile, and a round shell lit from the top left
 * (`S` shade, `s`, `l` lit) with a pumpkin's ribs and stalk (`k`) or a spiral and a glint (`g`).
 */
function snail(size: Size, stretch: boolean, kind: 'pumpkin' | 'gold'): SpriteSource {
  const { k, at } = scale(size);
  const s = new Sketch(size, size);
  s.ellipse(12 * k, 19.5 * k, 9 * k, 2.5 * k, 'b');
  s.rect(at(4), at(20), at(16), Math.max(1, at(1)), 'B');
  s.ellipse(18.5 * k, 16.5 * k, 3 * k, 3.5 * k, 'b');
  const reach = stretch ? 1 : 0;
  s.line(at(18), at(14), at(17) - reach, at(9) - reach, 'b');
  s.line(at(20), at(14), at(21) + reach, at(10) - reach, 'b');
  s.set(at(17) - reach, at(9) - reach - 1, 'e').set(at(21) + reach, at(10) - reach - 1, 'e');
  s.set(at(19), at(16), 'e').set(at(21), at(16), 'e');
  if (size === 24) s.set(20, 18, 'm').set(19, 17, 'c').set(22, 17, 'c');
  const cx = 10 * k;
  const cy = 13 * k;
  const r = 6.5 * k;
  s.sphere(cx, cy, r, r * 0.95, 'Ssl');
  if (kind === 'pumpkin') {
    for (const dx of [-2.5, 0, 2.5]) {
      for (let y = Math.ceil(cy - r) + 1; y < cy + r - 1; y++) {
        if (s.get(Math.round(cx + dx * k), y) !== CLEAR) s.set(Math.round(cx + dx * k), y, 'S');
      }
    }
    s.rect(Math.round(cx), Math.round(cy - r) - at(2), Math.max(1, at(1.5)), at(2), 'k');
  } else {
    for (let t = 0; t < Math.PI * 3.4; t += 0.12) {
      const rr = (0.6 + t * 0.42) * k;
      s.set(Math.round(cx + Math.cos(t) * rr), Math.round(cy + Math.sin(t) * rr), 'S');
    }
    s.set(Math.round(cx - r * 0.5), Math.round(cy - r * 0.55), 'g');
  }
  return outlined(s, 'g');
}

/**
 * A slug under a little ghost sheet (`w`, its shade `W`), two eyeholes cut in it and its hem in
 * soft points; the slug's tail (`b`) sticks out behind, and the hem sways between frames.
 */
function booSlug(size: Size, sway: boolean): SpriteSource {
  const { k, at } = scale(size);
  const s = new Sketch(size, size);
  s.ellipse(9 * k, 19.5 * k, 7.5 * k, 2.5 * k, 'b');
  s.rect(at(2), at(20), at(10), Math.max(1, at(1)), 'B');
  const sheet = new Sketch(size, size);
  sheet.sphere(14.5 * k, 13.5 * k, 6.5 * k, 7 * k, 'Www');
  for (let y = at(19); y < size; y++) sheet.rect(0, y, size, 1, CLEAR);
  const hem = at(19);
  for (let x = at(8.5); x <= at(20.5); x++) {
    const point = (x + (sway ? 1 : 0)) % at(3) === 0;
    if (sheet.get(x, hem - 1) !== CLEAR || x === at(8.5) || x === at(20.5))
      sheet.set(x, hem, point ? 'W' : 'w');
    if (point) sheet.set(x, hem + 1, 'W');
  }
  s.stamp(sheet, 0, 0);
  s.rect(at(13), at(11), Math.max(1, at(1.5)), Math.max(1, at(2.5)), 'e');
  s.rect(at(16.5), at(11), Math.max(1, at(1.5)), Math.max(1, at(2.5)), 'e');
  if (size === 24) s.set(15, 15, 'e');
  return outlined(s);
}

/**
 * A worm side on, its head to the right: a row of round segments (`b`, its belly `B`) along a
 * gentle hump, the hump higher in the second frame. A glowworm's last few segments are its
 * lantern (`t`); a wiggle worm has its band (`c`) and a blush.
 */
function worm(size: Size, inch: boolean, kind: 'glow' | 'wiggle'): SpriteSource {
  const { k } = scale(size);
  const s = new Sketch(size, size);
  const segments = 7;
  const centre = (i: number) => {
    const x = (3.5 + i * 2.4) * k;
    const hump =
      kind === 'wiggle'
        ? Math.sin((i / segments) * Math.PI * 2 + (inch ? Math.PI : 0)) * 2
        : -Math.sin((i / (segments - 1)) * Math.PI) * (inch ? 4 : 2);
    return { x, y: (17 + hump) * k };
  };
  for (let i = 0; i < segments; i++) {
    const { x, y } = centre(i);
    const lit = i % 2 === 1;
    const key =
      kind === 'glow' && i < 3
        ? lit
          ? 'T'
          : 't'
        : kind === 'wiggle' && i === 4
          ? 'c'
          : lit
            ? 'B'
            : 'b';
    s.ellipse(x, y, 2.2 * k, 2.4 * k, key);
  }
  const last = centre(segments);
  const hx = last.x + 0.3 * k;
  const hy = last.y - 0.5 * k;
  s.ellipse(hx, hy, 2.8 * k, 2.8 * k, 'b');
  s.set(Math.round(hx), Math.round(hy - k), 'e');
  if (size === 24) {
    s.set(Math.round(hx) + 2, Math.round(hy - k), 'e');
    s.set(Math.round(hx) + 1, Math.round(hy + 1), 'm');
    if (kind === 'wiggle') s.set(Math.round(hx) - 1, Math.round(hy + 1), 'p');
  }
  return outlined(s, 'tT');
}

/**
 * A woolly bear, side on: a row of fuzzy round segments, black at both ends and orange in the
 * middle (`k`, `r`), with fuzz (`f`, `F`) standing up along its back. It inches: the middle
 * humps up in the second frame.
 */
function woollyBear(size: Size, inch: boolean): SpriteSource {
  const { k } = scale(size);
  const s = new Sketch(size, size);
  const segments = 7;
  const at: { x: number; y: number }[] = [];
  for (let i = 0; i < segments; i++) {
    const x = (3.5 + i * 2.5) * k;
    const hump = -Math.sin((i / (segments - 1)) * Math.PI) * (inch ? 3.5 : 1);
    at.push({ x, y: (17.5 + hump) * k });
  }
  const black = (i: number) => i < 2 || i >= segments - 2;
  for (const [i, p] of at.entries()) {
    s.ellipse(p.x, p.y, 2.2 * k, 2.6 * k, black(i) ? (i % 2 ? 'k' : 'K') : i % 2 ? 'r' : 'R');
  }
  // Fuzz stands up all along its back, in tufts.
  for (let x = 0; x < size; x++) {
    let top = -1;
    for (let y = 0; y < size; y++) {
      if (s.get(x, y) !== CLEAR) {
        top = y;
        break;
      }
    }
    if (top < 0) continue;
    const under = s.get(x, top)!;
    const fuzz = under === 'r' || under === 'R' ? 'f' : 'F';
    s.set(x, top - 1, fuzz);
    if (size === 24 && x % 2 === 0) s.set(x, top - 2, fuzz);
  }
  const head = at[segments - 1]!;
  const hx = head.x + 2.8 * k;
  const hy = head.y + 0.5 * k;
  s.ellipse(hx, hy, 2.3 * k, 2.3 * k, 'h');
  s.set(Math.round(hx), Math.round(hy - k), 'e');
  if (size === 24) s.set(Math.round(hx) + 1, Math.round(hy) + 1, 'c');
  return outlined(s, 'fF');
}

/**
 * A spider as the art style asks (`docs/art_style.md`, "Spiders"): round and fuzzy (`b`, lit `B`,
 * a dithered fuzzy edge `f`), two big shiny eyes (`e` with a white glint `w`), a pink bow (`p`,
 * its knot `P`) and short, stubby, bent legs, four a side (`l`), sat in a lacy web (`n`, never
 * outlined). She keeps still, so both frames are the same.
 */
function bowSpider(size: Size): SpriteSource {
  const { k, at } = scale(size);
  const s = new Sketch(size, size);
  const c = { x: 12 * k, y: 13 * k };
  const web = Math.min(11 * k, size / 2 - 0.5);
  for (let a = 0; a < 8; a++) {
    const t = (a / 8) * Math.PI * 2 + Math.PI / 8;
    s.line(
      Math.round(c.x),
      Math.round(c.y),
      Math.round(c.x + Math.cos(t) * web),
      Math.round(c.y + Math.sin(t) * web),
      'n',
    );
  }
  for (const ring of [0.55, 0.95]) {
    for (let t = 0; t < Math.PI * 2; t += 0.08) {
      const sag = 1 - 0.12 * Math.abs(Math.sin(t * 4));
      s.set(
        Math.round(c.x + Math.cos(t) * web * ring * sag),
        Math.round(c.y + Math.sin(t) * web * ring * sag),
        'n',
      );
    }
  }
  const legs = new Sketch(size, size);
  for (const [i, dy] of [-2.5, -0.8, 0.8, 2.5].entries()) {
    const y = c.y + dy * k;
    const out = (6.5 + (i === 0 || i === 3 ? 0 : 1)) * k;
    const knee = { x: c.x - out, y: y - 1.2 * k };
    legs.line(Math.round(c.x - 4 * k), Math.round(y), Math.round(knee.x), Math.round(knee.y), 'l');
    legs.line(
      Math.round(knee.x),
      Math.round(knee.y),
      Math.round(knee.x - k),
      Math.round(knee.y + 2.5 * k),
      'l',
    );
  }
  s.stamp(legs, 0, 0).stamp(legs, 0, 0, { flipX: true });
  s.sphere(c.x, c.y + 0.5 * k, 5 * k, 4.8 * k, 'bbB');
  for (let t = 0; t < Math.PI * 2; t += 0.3) {
    const x = Math.round(c.x + Math.cos(t) * 5.6 * k);
    const y = Math.round(c.y + 0.5 * k + Math.sin(t) * 5.4 * k);
    if ((x + y) % 2 === 0 && s.get(x, y) !== 'b' && s.get(x, y) !== 'B') s.set(x, y, 'f');
  }
  const eye = Math.max(2, at(2.5));
  for (const ex of [c.x - 3 * k, c.x + 0.5 * k]) {
    s.rect(Math.round(ex), Math.round(c.y - k), eye, eye + (size === 24 ? 1 : 0), 'e');
    s.set(Math.round(ex), Math.round(c.y - k), 'w');
  }
  const bx = Math.round(c.x + 2.5 * k);
  const by = Math.round(c.y - 5 * k);
  s.rect(bx - at(2.5), by - at(1), at(2.5), at(2.5), 'p').rect(
    bx + 1,
    by - at(1),
    at(2.5),
    at(2.5),
    'p',
  );
  s.set(bx, by, 'P');
  if (size === 24) s.set(bx, by - 1, 'P');
  return outlined(s, 'nf');
}

/**
 * A cricket or a grasshopper side on, facing right: a body (`b`) with folded wings along its back
 * (`w`), a round head with a big eye (`e`, glint `E`), antennae (`a`), and the big hind leg (`l`,
 * its stripe `L`) that sings: in the second frame it lifts to fiddle. A cricket is rounder and its
 * antennae sweep right back; a grasshopper is longer, with short ones.
 */
function hopper(size: Size, fiddle: boolean, kind: 'cricket' | 'grasshopper'): SpriteSource {
  const { k, at } = scale(size);
  const s = new Sketch(size, size);
  const long = kind === 'grasshopper';
  s.ellipse(11.5 * k, 16 * k, (long ? 7.5 : 6) * k, 3 * k, 'b');
  s.ellipse((long ? 10.5 : 11) * k, 14.5 * k, (long ? 6.5 : 5) * k, 1.6 * k, 'w');
  s.ellipse(18.5 * k, 14.5 * k, 3 * k, 3 * k, 'b');
  for (const x of [13, 16]) s.line(at(x), at(18), at(x + 1), at(21), 'l');
  const lift = fiddle ? 2 : 0;
  s.line(at(12), at(16), at(6), at(10) - lift, 'l').line(at(12), at(17), at(7), at(11) - lift, 'l');
  s.line(at(6), at(10) - lift, at(4), at(20), 'l');
  s.set(at(9), at(13) - lift, 'L');
  if (size === 24) s.set(8, 12 - lift, 'L');
  if (long) {
    s.line(at(20), at(12), at(22), at(8), 'a');
  } else {
    s.line(at(19), at(12), at(15), at(5), 'a').line(at(15), at(5), at(8), at(3), 'a');
    s.line(at(20), at(12), at(21), at(5), 'a');
  }
  s.set(at(19), at(14), 'e');
  if (size === 24) s.set(19, 13, 'E').set(20, 14, 'e').set(19, 15, 'e');
  return outlined(s, 'a');
}

/**
 * A twig knight: a stick insect side on (`b`, its joints `B`), long and thin, with a little
 * acorn-cap helmet (`h`) and a red plume (`p`). In the second frame it salutes with a front leg.
 */
function twigKnight(size: Size, salute: boolean): SpriteSource {
  const { k, at } = scale(size);
  const s = new Sketch(size, size);
  for (const [x0, x1] of [
    [7, 5],
    [11, 11],
    [15, 18],
  ] as const) {
    s.line(at(x0), at(14), at(x1), at(19), 'B');
  }
  for (const [x0, x1] of [
    [6, 3],
    [10, 8],
  ] as const) {
    s.line(at(x0), at(14), at(x1), at(20), 'b');
  }
  if (salute) s.line(at(16), at(13), at(17), at(7), 'b');
  else s.line(at(16), at(14), at(19), at(20), 'b');
  s.rect(at(2), at(13), at(16), Math.max(1, at(1.5)), 'b');
  s.set(at(1), at(12), 'b');
  s.ellipse(19.5 * k, 13.5 * k, 2.2 * k, 1.8 * k, 'b');
  s.line(at(21), at(14), at(23), at(18), 'a');
  s.rect(at(18), at(11), at(4), Math.max(1, at(1.5)), 'h');
  s.line(at(19), at(10), at(18), at(7), 'p');
  if (size === 24) s.set(17, 7, 'p');
  s.set(at(21), at(13), 'e');
  return outlined(s, 'a');
}

/**
 * A roly-poly from above, its head to the right: a lit oval shell (`S`, `s`, `l`) banded into
 * plates, little legs peeping out under it (`f`), a small head (`h`) with two eyes and its
 * antennae (`a`), which twitch between frames.
 */
function rolyPoly(size: Size, twitch: boolean): SpriteSource {
  const { k, at } = scale(size);
  const s = new Sketch(size, size);
  for (const x of [7, 10, 13, 16]) s.rect(at(x), at(18), 1, Math.max(1, at(1.5)), 'f');
  s.sphere(11.5 * k, 14 * k, 7 * k, 4.8 * k, 'Ssl');
  for (const x of [7.5, 10, 12.5, 15]) {
    for (let y = 0; y < size; y++) {
      const key = s.get(at(x), y);
      if (key === 's' || key === 'l') s.set(at(x), y, 'S');
    }
  }
  s.ellipse(19.5 * k, 14.5 * k, 2.2 * k, 2.6 * k, 'h');
  s.set(at(20), at(13), 'e').set(at(20), at(16), 'e');
  const up = twitch ? 1 : 0;
  s.line(at(21), at(13), at(23), at(10) - up, 'a').line(at(21), at(16), at(23), at(19) + up, 'a');
  return outlined(s, 'a');
}

/**
 * A mud puppy side on, facing right: a long speckled body (`b`, its belly `B`, spots `s`) on four
 * short legs, a flat round head with a big grin (`m`), and three frilly red gills (`g`) behind
 * it, which sway between frames.
 */
function mudPuppy(size: Size, sway: boolean): SpriteSource {
  const { k, at } = scale(size);
  const s = new Sketch(size, size);
  const lift = sway ? 1 : 0;
  // Three frilly gills fanned back from behind the head, each a stalk with a frill along it.
  for (const [x1, y1] of [
    [12, 10],
    [11, 13],
    [14, 9],
  ] as const) {
    s.line(at(15), at(14), at(x1), at(y1) - lift, 'g');
  }
  if (size === 24)
    s.set(13, 10 - lift, 'G')
      .set(12, 12 - lift, 'G')
      .set(14, 11 - lift, 'G');
  for (let i = 0; i < 6; i++) {
    s.rect(at(1 + i), at(17.5 - i * 0.25), 1, Math.max(1, at(1 + i * 0.3)), 'b');
  }
  s.ellipse(11 * k, 17.5 * k, 5.5 * k, 2.4 * k, 'b');
  for (const x of [7, 10, 14, 17]) s.rect(at(x), at(19), Math.max(1, at(1.5)), at(2), 'b');
  s.ellipse(18 * k, 15.5 * k, 4.2 * k, 3.4 * k, 'b');
  s.rect(at(7), at(19), at(6), Math.max(1, at(1)), 'B').rect(at(16), at(17), at(5), 1, 'B');
  for (const [x, y] of [
    [8, 17],
    [11, 16],
    [5, 18],
    [17, 14],
  ] as const) {
    s.set(at(x), at(y), 's');
  }
  s.set(at(19), at(14), 'e').set(at(19), at(13), 'E');
  s.line(at(18), at(16), at(21), at(16), 'm');
  if (size === 24) s.set(17, 15, 'm');
  return outlined(s);
}

/**
 * A crawdad from above, facing right: a shell of plates (`f`, `F` lit, `S` plates), a tail fan
 * behind, two big claws held out in front (open in the second frame, a wave), antennae (`a`) and
 * eyes on little stalks (`e`).
 */
function crawdad(size: Size, wave: boolean): SpriteSource {
  const { k, at } = scale(size);
  const s = new Sketch(size, size);
  s.line(at(17), at(10), at(23), at(4), 'a').line(at(17), at(14), at(23), at(20), 'a');
  for (const sign of [-1, 1]) {
    const y = (n: number) => at(12 + sign * n);
    s.line(at(15), y(2), at(18), y(5), 'f').line(at(15), y(3), at(18), y(6), 'f');
    s.ellipse(20 * k, (12 + sign * 6.5) * k, 2.6 * k, 1.8 * k, 'f');
    if (wave) s.set(at(22), y(6.5), CLEAR).set(at(21), y(6.5), CLEAR);
    else s.set(at(22), y(6.5), CLEAR);
  }
  s.sphere(12 * k, 12 * k, 6 * k, 3.2 * k, 'fFF');
  for (const x of [8, 10, 12]) {
    for (let y = 0; y < size; y++) if (s.get(at(x), y) === 'F') s.set(at(x), y, 'S');
  }
  s.rect(at(3), at(10), at(3), at(5), 'f').rect(at(2), at(9), Math.max(1, at(1.5)), at(7), 'f');
  for (const x of [9, 12, 15]) s.set(at(x), at(8), 'f').set(at(x), at(16), 'f');
  s.set(at(17), at(11), 'e').set(at(17), at(13), 'e');
  return outlined(s, 'a');
}

const both = <T>(make: (second: boolean) => T): readonly [T, T] => [make(false), make(true)];

const art = (
  draw: (size: Size, second: boolean) => SpriteSource,
  palette: CritterArt['palette'],
  glow?: CritterArt['glow'],
): CritterArt => ({
  frames: both((second) => draw(16, second)),
  world: both((second) => draw(24, second)),
  palette,
  ...(glow ? { glow } : {}),
});

const darkest = (colour: string) => ramp(colour)[0]!;

/** The creepy-crawlies' art (0.3's C2), and the farm's mud puppy and crawdad. */
export const CRAWLY_ART = {
  pumpkinSnail: art((size, second) => snail(size, second, 'pumpkin'), {
    '.': null,
    o: darkest(C.pumpkin),
    b: C.skinHoney,
    B: C.skinHoneyShade,
    e: C.ink,
    m: C.ink,
    c: C.cheek,
    S: C.pumpkinDark,
    s: C.pumpkin,
    l: C.pumpkinLight,
    k: C.leafDark,
  }),
  booSlug: art(booSlug, {
    '.': null,
    o: C.lavenderShade,
    b: C.lavender,
    B: C.lavenderShade,
    w: C.white,
    W: C.ghost,
    e: C.ink,
  }),
  glowworm: art(
    (size, second) => worm(size, second, 'glow'),
    {
      '.': null,
      o: C.mossDark,
      b: C.moss,
      B: C.mossLight,
      t: C.fireflyGlow,
      T: mix(C.fireflyGlow, C.white, 0.4),
      e: C.ink,
      m: C.mossDark,
    },
    { t: C.fireflyGlow, T: mix(C.fireflyGlow, C.white, 0.4) },
  ),
  woollyBear: art(woollyBear, {
    '.': null,
    o: C.ink,
    k: C.inkFabric,
    K: C.inkFabricShade,
    F: C.iron,
    r: C.pumpkin,
    R: C.pumpkinShade,
    f: C.pumpkinLight,
    h: C.inkFabric,
    e: C.candle,
    c: C.rose,
  }),
  bowSpider: art((size) => bowSpider(size), {
    '.': null,
    o: darkest(C.plum),
    n: mix(C.ghost, C.lavender, 0.3),
    b: C.plumLight,
    B: C.lavender,
    f: C.lavender,
    l: C.plum,
    e: C.ink,
    w: C.white,
    p: C.hairPink,
    P: C.rose,
  }),
  moonCricket: art((size, second) => hopper(size, second, 'cricket'), {
    '.': null,
    o: C.ink,
    b: C.navy,
    w: C.blueFabric,
    l: C.navy,
    L: C.sky,
    a: C.navyShade,
    e: C.ink,
    E: C.white,
  }),
  fiddleHopper: art((size, second) => hopper(size, second, 'grasshopper'), {
    '.': null,
    o: C.leafDark,
    b: C.leaf,
    w: C.leafLight,
    l: C.leaf,
    L: C.leafDark,
    a: C.leafDark,
    e: C.ink,
    E: C.white,
  }),
  twigKnight: art(twigKnight, {
    '.': null,
    o: C.barkDark,
    b: C.bark,
    B: C.barkDark,
    a: C.barkDark,
    h: C.wood,
    p: C.scarlet,
    e: C.ink,
  }),
  rolyPoly: art(rolyPoly, {
    '.': null,
    o: C.stoneDark,
    S: C.stoneDark,
    s: C.stone,
    l: C.stoneLight,
    f: C.stoneDark,
    h: C.stone,
    a: C.stoneDark,
    e: C.ink,
  }),
  wiggleWorm: art((size, second) => worm(size, second, 'wiggle'), {
    '.': null,
    o: darkest(C.rose),
    b: C.roseLight,
    B: mix(C.roseLight, C.white, 0.3),
    c: C.rose,
    e: C.ink,
    m: C.ink,
    p: C.rose,
  }),
  goldenSnail: art((size, second) => snail(size, second, 'gold'), {
    '.': null,
    o: C.goldShade,
    b: C.cream,
    B: C.creamShade,
    e: C.ink,
    m: C.ink,
    c: C.cheek,
    S: C.goldShade,
    s: C.gold,
    l: C.candleBright,
    k: C.goldShade,
    g: C.white,
  }),
  mudPuppy: art(mudPuppy, {
    '.': null,
    o: C.barkDark,
    b: C.hairBrown,
    B: C.hairBlonde,
    s: C.barkDark,
    g: C.scarlet,
    G: C.coral,
    e: C.ink,
    E: C.white,
    m: C.barkDark,
  }),
  crawdad: art(crawdad, {
    '.': null,
    o: C.maroon,
    f: C.scarlet,
    F: C.coral,
    S: C.scarletShade,
    a: C.maroon,
    e: C.ink,
  }),
} satisfies Partial<Record<CritterId, CritterArt>>;
