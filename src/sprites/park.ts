import { PALETTE as C, ramp } from './palette';
import { CLEAR, Sketch } from './sketch';
import type { Palette, SpriteSource } from './sprite';

/*
 * The park round the pond (phase F): the fountain in the middle of it, which lights up after dark
 * like the one in a park near them (personal_touches.md, "After phase E").
 */

/**
 * A stone fountain two tiles across, standing in the pond: a round basin with little lamps set in
 * its rim, a bowl on a pedestal, and a jet that falls back into the bowl and spills over its edge.
 * The jets (`j`) and the lamps (`y`) light up after dark.
 */
function drawFountain(beat: number | null = null): SpriteSource {
  const s = new Sketch(64, 76);
  // The basin: a stone rim round a pool, and a ring of ripples (playing, V1's E5, spreading out).
  s.ellipse(32, 64, 31, 11, 's').ellipse(32, 63, 27, 8, 'w');
  const [rx, ry] = beat === null ? [20, 5] : RIPPLES[beat % RIPPLES.length]!;
  s.ellipse(32, 63, rx, ry, 'W').ellipse(32, 63, rx - 2, ry - 1, 'w');
  // The pedestal and the bowl on it.
  s.rect(28, 34, 8, 28, 's').rect(26, 58, 12, 3, 's');
  s.ellipse(32, 32, 15, 5.5, 's').ellipse(32, 31, 12, 3.5, 'w');
  s.bevel('s', 'L', 'S');
  // The jet, and the water it throws up falling back in arcs. Playing, its top surges and settles,
  // and gaps run down the arcs and the spill, so the water is seen to fall.
  const bob = beat === null ? 0 : JET_BOB[beat % JET_BOB.length]!;
  s.rect(31, 6 + bob, 2, 25 - bob, 'j');
  for (const side of [-1, 1]) {
    for (let i = 0; i < 12; i++) {
      if (beat !== null && (i - beat + 8) % 4 === 3) continue;
      const at = (n: number) => [32 + side * (1 + n), Math.round(8 + bob + (n * n) / 7)] as const;
      const [x0, y0] = at(i);
      const [x1, y1] = at(i + 1);
      s.line(x0, y0, x1, y1, 'j');
    }
    // Spilling over the bowl's edge, down into the basin.
    const fall = beat ?? 0;
    for (let y = 34; y < 58; y += 1) if ((y - fall + 5) % 5 !== 0) s.set(32 + side * 15, y, 'j');
  }
  s.rect(30, 4 + bob, 4, 2, 'j');
  // Lamps set round the rim.
  for (const [x, y] of [
    [6, 62],
    [16, 69],
    [32, 72],
    [48, 69],
    [58, 62],
  ] as const) {
    s.rect(x - 1, y, 3, 2, 'y');
  }
  s.outline({ s: 'o', S: 'o', L: 'o', y: 'o' });
  return s.toSource();
}

/** The ring of ripples in the basin as it spreads, a frame each (V1's E5). */
const RIPPLES: readonly (readonly [number, number])[] = [
  [17, 4],
  [20, 5],
  [23, 6],
  [25, 7],
];

/** How far the jet's top dips, a frame each: it surges and settles. */
const JET_BOB: readonly number[] = [0, 1, 2, 1];

export const FOUNTAIN: SpriteSource = drawFountain();

/** The fountain playing (V1's E5): the jet surging, drops running down, ripples spreading. */
export const FOUNTAIN_FRAMES: readonly SpriteSource[] = [0, 1, 2, 3].map((beat) =>
  drawFountain(beat),
);

export const FOUNTAIN_PALETTE: Palette = {
  [CLEAR]: null,
  o: ramp(C.stone)[0],
  S: C.stoneDark,
  s: C.stone,
  L: C.stoneLight,
  w: C.water,
  W: C.waterLight,
  j: ramp(C.waterLight)[3],
  y: C.dusk,
};

/** After dark the jets shine and the lamps round the rim are lit. */
export const FOUNTAIN_GLOW: Palette = { j: C.orbBlueLight, y: C.candle };
