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
function drawFountain(): SpriteSource {
  const s = new Sketch(64, 76);
  // The basin: a stone rim round a pool.
  s.ellipse(32, 64, 31, 11, 's').ellipse(32, 63, 27, 8, 'w');
  s.ellipse(32, 63, 20, 5, 'W').ellipse(32, 63, 18, 4, 'w');
  // The pedestal and the bowl on it.
  s.rect(28, 34, 8, 28, 's').rect(26, 58, 12, 3, 's');
  s.ellipse(32, 32, 15, 5.5, 's').ellipse(32, 31, 12, 3.5, 'w');
  s.bevel('s', 'L', 'S');
  // The jet, and the water it throws up falling back in arcs.
  s.rect(31, 6, 2, 25, 'j');
  for (const side of [-1, 1]) {
    for (let i = 0; i < 12; i++) {
      const at = (n: number) => [32 + side * (1 + n), Math.round(8 + (n * n) / 7)] as const;
      const [x0, y0] = at(i);
      const [x1, y1] = at(i + 1);
      s.line(x0, y0, x1, y1, 'j');
    }
    // Spilling over the bowl's edge, down into the basin.
    for (let y = 34; y < 58; y += 1) if (y % 5 !== 0) s.set(32 + side * 15, y, 'j');
  }
  s.rect(30, 4, 4, 2, 'j');
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

export const FOUNTAIN: SpriteSource = drawFountain();

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
