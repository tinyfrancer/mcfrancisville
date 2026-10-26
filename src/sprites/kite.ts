import type { KiteId } from '../types/ids';
import type { ItemArt } from './items';
import { PALETTE as C, ramp } from './palette';
import { Sketch } from './sketch';
import type { Palette, SpriteSource } from './sprite';
import type { ToolArt } from './tools';

/*
 * Her kites (1.6's X6, decision 385): each one's icon at 16, folded in her hand at 1× (the doll's
 * own density, as `HELD_ART` is), and up in the sky at 24, in two frames that flap, billow and
 * flutter. The tail and the string are drawn by the `kite` pass, streaming on the wind, in the
 * kite's `tail` colour, so they bend however the wind takes them.
 *
 * Keys: `a` the kite's shade, `b` its fill, `c` its light, `w` white, `o` ink, `g` gold, `p` a
 * blush, `s` the spar (wood), each outlined in its own ramp's dark (`O`, `S`).
 */

const OUTLINE: Record<string, string> = { a: 'O', b: 'O', c: 'O', w: 'O', s: 'S', g: 'O' };

/** A kite's colours from its base: the shade, fill and light of its ramp, and its outline. */
function kitePalette(base: string, extra: Partial<Record<string, string>> = {}): Palette {
  const r = ramp(base);
  return {
    '.': null,
    O: r[0]!,
    a: r[1]!,
    b: r[2]!,
    c: r[3]!,
    w: C.white,
    o: C.ink,
    g: C.gold,
    p: C.cheek,
    s: C.wood,
    S: C.barkDark,
    ...extra,
  };
}

export const KITE_PALETTES: Record<KiteId, Palette> = {
  batKite: kitePalette(C.plumLight),
  ghostKite: kitePalette(C.ghost, { a: C.snowShade, b: C.snow, c: C.white, O: C.lavenderShade }),
  mothKite: kitePalette(C.luna, {
    a: C.lunaShade,
    b: C.luna,
    c: C.white,
    O: ramp(C.lunaShade)[0]!,
  }),
};

/** The colour of each kite's tail: bat bows, ghost ribbons, moth leaves. */
export const KITE_TAIL: Record<KiteId, { bow: string; knot: string }> = {
  batKite: { bow: C.lavender, knot: C.plum },
  ghostKite: { bow: C.white, knot: C.lavender },
  mothKite: { bow: C.lunaShade, knot: C.gold },
};

// ---- Up in the sky, at 24 ----------------------------------------------------------------------

/** The bat: a round body and head with ears, and scalloped wings on finger bones, out wide. */
function batAloft(flap: number): SpriteSource {
  const s = new Sketch(24, 20);
  for (let x = 0; x < 24; x++) {
    const d = Math.abs(x - 11.5);
    if (d < 2) continue;
    const lift = d > 7 ? flap : 0;
    const top = Math.round(7 - d * 0.42) - lift;
    const scallop = Math.round(d) % 4 < 2 ? 2 : 0;
    const bottom = Math.round(14 - d * 0.3) - scallop - lift;
    for (let y = top; y <= bottom; y++) s.set(x, y, 'b');
  }
  s.line(11, 7, 1, 3 - flap, 'a').line(12, 7, 22, 3 - flap, 'a');
  s.line(11, 8, 4, 10, 'a').line(12, 8, 19, 10, 'a');
  s.ellipse(11.5, 10, 2.6, 5, 'a');
  s.ellipse(11.5, 5, 2.8, 2.6, 'a');
  s.set(9, 2, 'a').set(10, 2, 'a').set(9, 1, 'a').set(13, 2, 'a').set(14, 2, 'a').set(14, 1, 'a');
  s.set(10, 5, 'w').set(13, 5, 'w').set(11, 7, 'p').set(12, 7, 'p');
  s.outline(OUTLINE);
  return s.toSource();
}

/** The ghost: a round white sheet with a wavy hem, a surprised face and rosy cheeks. */
function ghostAloft(wave: number): SpriteSource {
  const s = new Sketch(20, 22);
  s.ellipse(9.5, 8, 7.5, 7.5, 'b');
  s.rect(2, 8, 16, 9, 'b');
  for (let x = 2; x < 18; x++) {
    if (Math.floor((x + wave) / 3) % 2 === 0) s.set(x, 17, 'b').set(x, 18, 'b');
  }
  s.rect(15, 6, 2, 11, 'a').rect(4, 3, 3, 2, 'c').set(3, 5, 'c');
  s.rect(6, 7, 2, 3, 'o').rect(11, 7, 2, 3, 'o');
  s.set(6, 7, 'w').set(11, 7, 'w');
  s.rect(9, 12, 2, 2, 'o');
  s.set(4, 11, 'p').set(5, 11, 'p').set(14, 11, 'p').set(15, 11, 'p');
  s.outline(OUTLINE);
  return s.toSource();
}

/** The luna moth: pale green wings, an eyespot on each, and two long swallowtails. */
function mothAloft(flutter: number): SpriteSource {
  const s = new Sketch(24, 24);
  const rx = 6 - flutter;
  s.ellipse(11.5 - rx + 1, 8, rx, 5, 'b').ellipse(12.5 + rx - 1, 8, rx, 5, 'b');
  s.ellipse(8, 14, 3.6 - flutter / 2, 3.6, 'b').ellipse(16, 14, 3.6 - flutter / 2, 3.6, 'b');
  s.line(7, 17, 5, 22, 'b').line(8, 17, 6, 22, 'b');
  s.line(16, 17, 18, 22, 'b').line(17, 17, 19, 22, 'b');
  s.line(12 - rx, 4, 10, 4, 'a').line(14, 4, 12 + rx, 4, 'a');
  s.ellipse(12 - rx + 1, 8, 1.4, 1.4, 'g').ellipse(12 + rx - 2, 8, 1.4, 1.4, 'g');
  s.set(12 - rx + 1, 8, 'o').set(12 + rx - 2, 8, 'o');
  s.rect(11, 4, 2, 13, 'c');
  s.line(11, 3, 9, 0, 'a').line(12, 3, 14, 0, 'a');
  s.outline(OUTLINE);
  return s.toSource();
}

/** Each kite up in the sky, in its two frames. */
export const KITE_ALOFT: Record<KiteId, readonly SpriteSource[]> = {
  batKite: [batAloft(0), batAloft(1)],
  ghostKite: [ghostAloft(0), ghostAloft(1)],
  mothKite: [mothAloft(0), mothAloft(1)],
};

/** Where on each kite the string is tied and the tail hangs from: the bottom of its middle. */
export const KITE_KNOT: Record<KiteId, { x: number; y: number }> = {
  batKite: { x: 12, y: 15 },
  ghostKite: { x: 10, y: 19 },
  mothKite: { x: 12, y: 18 },
};

// ---- In her hand, at 1× --------------------------------------------------------------------------

/** A kite folded along its spar, its tail wound round it, held by the bottom of the spar. */
function folded(id: KiteId): SpriteSource {
  const s = new Sketch(10, 18);
  s.line(5, 0, 5, 16, 's');
  if (id === 'ghostKite') s.ellipse(5, 6, 3, 4.5, 'b').set(4, 4, 'c').set(6, 6, 'o');
  else if (id === 'batKite') s.ellipse(5, 6, 3, 5, 'b').set(4, 3, 'c').line(6, 2, 6, 9, 'a');
  else s.ellipse(5, 6, 3, 5, 'b').set(4, 4, 'c').set(6, 6, 'g');
  s.rect(4, 11, 3, 2, 'c').set(3, 12, 'a').set(7, 12, 'a');
  s.outline(OUTLINE);
  return s.toSource();
}

/** Each kite folded in her hand, held by its spar. */
export const KITE_HELD: Record<KiteId, ToolArt> = {
  batKite: { source: folded('batKite'), palette: KITE_PALETTES.batKite, grip: { x: 5, y: 15 } },
  ghostKite: {
    source: folded('ghostKite'),
    palette: KITE_PALETTES.ghostKite,
    grip: { x: 5, y: 15 },
  },
  mothKite: { source: folded('mothKite'), palette: KITE_PALETTES.mothKite, grip: { x: 5, y: 15 } },
};

// ---- Icons, at 16 --------------------------------------------------------------------------------

/** A kite's icon: its picture shrunk to the top right, its tail curling down to the bottom left. */
function icon(id: KiteId): SpriteSource {
  const s = new Sketch(16, 16);
  // The tail first, a bow at a time down to the corner.
  for (const [x, y] of [
    [7, 9],
    [5, 11],
    [4, 13],
    [2, 14],
  ] as const) {
    s.set(x, y, 'a').set(x + 1, y, 'a');
  }
  if (id === 'batKite') {
    for (let x = 4; x < 16; x++) {
      const d = Math.abs(x - 10);
      const top = Math.round(4 - d * 0.3);
      const bottom = Math.round(8 - d * 0.25) - (d % 3 === 2 ? 1 : 0);
      for (let y = top; y <= bottom; y++) s.set(x, y, 'b');
    }
    s.ellipse(10, 5, 1.6, 3, 'a').ellipse(10, 2, 1.6, 1.6, 'a').set(9, 2, 'w').set(11, 2, 'w');
  } else if (id === 'ghostKite') {
    s.ellipse(10.5, 4.5, 4.5, 4.5, 'b').rect(6, 4, 10, 5, 'b');
    for (let x = 6; x < 16; x += 2) s.set(x, 9, 'b');
    s.set(9, 4, 'o').set(12, 4, 'o').set(9, 5, 'o').set(12, 5, 'o').set(10, 7, 'o');
    s.rect(14, 3, 1, 5, 'a');
  } else {
    s.ellipse(8, 4, 3, 3, 'b').ellipse(13, 4, 3, 3, 'b');
    s.ellipse(9, 8, 2, 2, 'b').ellipse(12, 8, 2, 2, 'b');
    s.set(8, 11, 'b').set(13, 11, 'b').set(8, 10, 'b').set(13, 10, 'b');
    s.rect(10, 2, 2, 8, 'c').set(8, 4, 'g').set(13, 4, 'g');
  }
  s.outline(OUTLINE);
  return s.toSource();
}

export const KITE_ICON_ART: Record<KiteId | 'skyOnAString', ItemArt> = {
  batKite: { source: icon('batKite'), palette: KITE_PALETTES.batKite },
  ghostKite: { source: icon('ghostKite'), palette: KITE_PALETTES.ghostKite },
  mothKite: { source: icon('mothKite'), palette: KITE_PALETTES.mothKite },
  // A wooden spool wound with string, and a wisp of sky-blue coming off it.
  skyOnAString: (() => {
    const s = new Sketch(16, 16);
    s.rect(3, 4, 10, 2, 's').rect(3, 12, 10, 2, 's');
    s.rect(4, 6, 8, 6, 'b');
    for (let y = 6; y < 12; y += 2) s.rect(4, y, 8, 1, 'c');
    s.set(12, 8, 'b').set(13, 7, 'b').set(14, 5, 'b').set(14, 4, 'c').set(15, 2, 'c');
    s.set(2, 1, 'w').set(5, 2, 'w').set(1, 3, 'w');
    s.outline(OUTLINE);
    return { source: s.toSource(), palette: kitePalette(C.sky) };
  })(),
};
