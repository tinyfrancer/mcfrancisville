import type { BraceletId, Facing } from '../../types/ids';
import type { Look } from '../../types/look';
import { BRACELET_BEADS } from '../bracelets';
import { PALETTE as C, mix } from '../palette';
import { CLEAR } from '../sketch';
import type { Palette } from '../sprite';
import { ARM, DOLL_WIDTH, EMPTY, type Grid, SHOULDER, viewOf } from './body';
import { centred, paint, remember, stamp } from './paint';

/*
 * What she wears on her skin: her tattoos laid along each arm (decisions 152 and 153) and her
 * bracelets stacked up her left wrist (0.2's W1, decision 164).
 */

/**
 * Her tattoos under her clothes (0.2's K3, personal_touches.md), all black and white: on one arm
 * a Beetlejuice sleeve, in the game's own art (the stripes, a sandworm winding down); on the other
 * an evenstar and a black-eyed Susan; she picks which arm the stripes go on
 * (`stripesArm`, her right as it really is). With either, the rose in the middle of her chest,
 * which a scooped neckline shows. Scattered is a few pieces of them.
 */
export function tattooRows(
  tattoos: NonNullable<Look['tattoos']>,
  stripesArm: Look['stripesArm'],
  body: Grid,
  facing: Facing,
): readonly string[] {
  return remember(body, `tattoos:${tattoos}:${stripesArm}:${facing}`, () =>
    drawTattoos(tattoos, stripesArm, body, facing),
  );
}

/**
 * Each arm's ink as it would be laid on her, shoulder first and wrist last, four across from the
 * outside of her arm in. A narrower part of her arm shows the first of them; a sleeve covers what
 * it covers.
 */
const SLEEVES: Record<'stripes' | 'stars', Record<NonNullable<Look['tattoos']>, Grid>> = {
  stripes: {
    sleeves: ['kWk.', 'kWkW', 'kWkW', 'gKKg', 'gkWg', 'Wkg.', 'gWk.', 'gkW.'],
    scattered: ['....', '....', '....', '....', '.KK.', '.kW.', '.Wk.', '....'],
  },
  stars: {
    sleeves: ['.k..', 'kSk.', '.k..', 'vyy.', 'yYYy', '.yyv', '....', '....'],
    scattered: ['....', '....', '....', '.yy.', 'yYYy', '.yy.', '....', '....'],
  },
};

const AROUND: readonly (readonly [number, number])[] = [-1, 0, 1].flatMap((dy) =>
  [-1, 0, 1].flatMap((dx) => (dx === 0 && dy === 0 ? [] : [[dx, dy] as const])),
);

/** A rose with its leaves, big in the middle of her chest, just under her collarbones. */
const ROSE: Grid = ['.RKK..', 'RKqKK.', 'vKKqKv', '.vKKv.'];

/** One step up an arm from the hand: its pixels, outside first, and whose arm it is. */
interface ArmBand {
  step: number;
  arm: 'left' | 'right';
  pixels: [number, number][];
}

/**
 * Each arm in bands across it, by how far each pixel is from her hand walking up the arm, so a
 * tattoo or a bracelet follows her arm wherever a pose puts it.
 */
function armBands(body: Grid, facing: Facing): ArmBand[] {
  const view = viewOf(facing);
  const onArm = (x: number, y: number) => ARM.includes(body[y]?.[x] ?? CLEAR);
  const fromHand = new Map<string, number>();
  let wave: [number, number][] = [];
  for (let y = 0; y < body.length; y++) {
    for (let x = 0; x < DOLL_WIDTH; x++) if (body[y]![x] === 'A') wave.push([x, y]);
  }
  for (const [x, y] of wave) fromHand.set(`${x},${y}`, 0);
  for (let step = 1; wave.length > 0; step++) {
    const next: [number, number][] = [];
    for (const [x, y] of wave) {
      // Diagonal steps count as one, so a row across a straight arm is all one distance.
      for (const [nx, ny] of AROUND.map(([dx, dy]) => [x + dx, y + dy] as const)) {
        if (!onArm(nx, ny) || fromHand.has(`${nx},${ny}`)) continue;
        fromHand.set(`${nx},${ny}`, step);
        next.push([nx, ny]);
      }
    }
    wave = next;
  }
  // Which of her arms each side of the picture is: from the front her right is on our left.
  const armAt = (x: number): 'left' | 'right' => {
    if (view === 'side') return facing === 'right' ? 'right' : 'left';
    return x < 16 === (view === 'front') ? 'right' : 'left';
  };
  const groups = new Map<string, [number, number][]>();
  for (const [key, step] of fromHand) {
    if (step === 0) continue;
    const [x, y] = key.split(',').map(Number) as [number, number];
    const side = view === 'side' ? 'near' : x < 16 ? 'l' : 'r';
    const group = `${side}:${step}`;
    groups.set(group, [...(groups.get(group) ?? []), [x, y]]);
  }
  return [...groups.values()].map((pixels) => {
    const [x, y] = pixels[0]!;
    // Outside of her arm first.
    const outward = x < 16 ? 1 : -1;
    pixels.sort((p, q) => (p[0] - q[0]) * outward || p[1] - q[1]);
    return { step: fromHand.get(`${x},${y}`)!, arm: armAt(x), pixels };
  });
}

function drawTattoos(
  tattoos: NonNullable<Look['tattoos']>,
  stripesArm: Look['stripesArm'],
  body: Grid,
  facing: Facing,
): string[] {
  const view = viewOf(facing);
  const ink = new Map<string, string>();
  for (const { step, arm, pixels } of armBands(body, facing)) {
    const grid = SLEEVES[arm === stripesArm ? 'stripes' : 'stars'][tattoos];
    const row = grid[grid.length - step];
    if (!row) continue;
    // From behind, the other side of her arm shows.
    pixels.forEach(([x, y], rank) => {
      let col = Math.floor((rank * 4) / pixels.length);
      if (view === 'back') col = 3 - col;
      const key = row[col];
      if (key && key !== '.') ink.set(`${x},${y}`, key);
    });
  }
  let rows = paint(body, (k, r, c) => (ARM.includes(k) ? (ink.get(`${c},${r}`) ?? null) : null));
  if (view === 'front') {
    const rose = stamp(EMPTY, ROSE, SHOULDER, centred(ROSE));
    rows = stamp(
      rows,
      rose.map((line, r) => [...line].map((ch, c) => (body[r]?.[c] === 'b' ? ch : CLEAR)).join('')),
      0,
    );
  }
  return rows;
}

/** Which wrist her stack goes on: her left, leaving her right for her phone and her net. */
export const WRIST_ARM = 'left';

/**
 * The keys a bracelet is drawn in, five to a bracelet, nearest her hand first: up to four beads,
 * then its rim, where it stands out past the line round her arm.
 */
const BEAD_KEYS = 'abcdefghijklmno';

const RIM = 4;

/**
 * Her bracelets (0.2's W1), a band each round her left wrist, stacked up her arm from her hand,
 * their beads strung in turn round it. Where her wrist is out of sight (from the side, facing
 * away from it) none shows.
 */
export function wristRows(
  wrist: readonly BraceletId[],
  body: Grid,
  facing: Facing,
): readonly string[] {
  return remember(body, `wrist:${wrist.join(',')}:${facing}`, () => {
    const beads = new Map<string, string>();
    for (const { step, arm, pixels } of armBands(body, facing)) {
      const id = wrist[step - 1];
      if (arm !== WRIST_ARM || !id) continue;
      const strung = BRACELET_BEADS[id].length;
      const first = (step - 1) * 5;
      for (const [x, y] of pixels) {
        for (const [nx, ny] of [
          [x - 1, y],
          [x + 1, y],
          [x, y - 1],
          [x, y + 1],
        ] as const) {
          if (body[ny]?.[nx] === 'o') beads.set(`${nx},${ny}`, BEAD_KEYS[first + RIM]!);
        }
      }
      pixels.forEach(([x, y], rank) =>
        beads.set(`${x},${y}`, BEAD_KEYS[first + ((rank + step - 1) % strung)]!),
      );
    }
    return paint(body, (_, r, c) => beads.get(`${c},${r}`) ?? null);
  });
}

export function wristPalette(wrist: readonly BraceletId[]): Palette {
  const palette: Record<string, string | null> = { '.': null };
  wrist.forEach((id, i) => {
    const beads = BRACELET_BEADS[id];
    beads.forEach((colour, j) => {
      palette[BEAD_KEYS[i * 5 + j]!] = colour;
    });
    palette[BEAD_KEYS[i * 5 + RIM]!] = mix(beads[0]!, C.ink, 0.45);
  });
  return palette;
}

/** Black and white, as all of hers are: each key a grey, so the pieces still read apart. */
export const TATTOO_PALETTE: Palette = {
  '.': null,
  k: C.tattooInk,
  W: C.tattooWhite,
  g: C.tattooMid,
  K: C.tattooDark,
  R: C.tattooLight,
  q: C.tattooInk,
  v: C.tattooDark,
  y: C.tattooLight,
  Y: C.tattooDark,
  S: C.tattooWhite,
};
