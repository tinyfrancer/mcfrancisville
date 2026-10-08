import { PALETTE as C } from './palette';
import type { Palette, SpriteSource } from './sprite';

/**
 * The effects layer's art (V1's E1, decision 280): the bubbles that pop up over her and her
 * neighbours, the little bits that fly off what she does, and the pictures a pop shows when
 * what she got has no icon of its own. All 16-pixel grids, as the item icons and the pets'
 * bubbles are (decision 105), baked at 2× in the world by `bakeIcon`.
 */

/** A grid and its colours. */
export interface EffectArt {
  source: SpriteSource;
  palette: Palette;
}

const EDGE = { '.': null, o: C.ink, w: C.white } as const;

/**
 * The emotes she and her neighbours show that the "!" and "?" didn't cover: a heart, a note
 * and a pause. Drawn as `NEIGHBOUR_BUBBLES` are, with the tail at the same corner, so all five
 * are one set of bubbles.
 */
export const EMOTE_BUBBLES: Record<'♥' | '♪' | '…', EffectArt> = {
  '♥': {
    source: {
      rows: [
        '.ooooooo.',
        'owwwwwwwo',
        'owxxwxxwo',
        'owxxxxxwo',
        'owwxxxwwo',
        'owwwxwwwo',
        'owwwwwwwo',
        '.oowoooo.',
        '..oo.....',
      ],
    },
    palette: { ...EDGE, x: C.rose },
  },
  '♪': {
    source: {
      rows: [
        '.ooooooo.',
        'owwwxxwwo',
        'owwwxwxwo',
        'owwwxwwwo',
        'owwwxwwwo',
        'owxxxwwwo',
        'owxxwwwwo',
        '.oowoooo.',
        '..oo.....',
      ],
    },
    palette: { ...EDGE, x: C.plum },
  },
  '…': {
    source: {
      rows: [
        '.ooooooo.',
        'owwwwwwwo',
        'owwwwwwwo',
        'owwwwwwwo',
        'owxwxwxwo',
        'owwwwwwwo',
        'owwwwwwwo',
        '.oowoooo.',
        '..oo.....',
      ],
    },
    palette: { ...EDGE, x: C.ink },
  },
};

/** The kinds of little bits that fly off a moment: each a grid or two, in a colour or a few. */
export type ParticleKind = 'leaf' | 'dust' | 'splash' | 'sparkle' | 'heart' | 'confetti' | 'coin';

/**
 * Each kind's frames (most have one; a sparkle twinkles between two) and the palettes a burst
 * deals out among its bits, so a handful of leaves isn't one green.
 */
export const PARTICLE_ART: Record<
  ParticleKind,
  { frames: readonly SpriteSource[]; palettes: readonly Palette[] }
> = {
  leaf: {
    frames: [{ rows: ['.ab', 'ab.'] }],
    palettes: [
      { '.': null, a: C.leaf, b: C.leafDark },
      { '.': null, a: C.leafLight, b: C.leaf },
      { '.': null, a: C.canopyLight, b: C.canopy },
    ],
  },
  dust: {
    frames: [{ rows: ['.d.', 'ddd', '.d.'] }],
    palettes: [
      { '.': null, d: C.soilDust },
      { '.': null, d: C.stoneLight },
    ],
  },
  splash: {
    frames: [{ rows: ['w', 'b'] }],
    palettes: [
      { '.': null, w: C.white, b: C.waterLight },
      { '.': null, w: C.waterLight, b: C.water },
    ],
  },
  sparkle: {
    frames: [{ rows: ['.c.', 'cCc', '.c.'] }, { rows: ['c.c', '.C.', 'c.c'] }],
    palettes: [{ '.': null, c: C.candle, C: C.candleBright }],
  },
  heart: {
    frames: [{ rows: ['.r.r.', 'rRrrr', 'rrrrr', '.rrr.', '..r..'] }],
    palettes: [
      { '.': null, r: C.rose, R: C.white },
      { '.': null, r: C.roseLight, R: C.white },
    ],
  },
  confetti: {
    frames: [{ rows: ['xx'] }, { rows: ['x', 'x'] }],
    palettes: [{ x: C.rose }, { x: C.candle }, { x: C.teal }, { x: C.plumLight }, { x: C.pumpkin }],
  },
  coin: {
    frames: [{ rows: ['.y.', 'yYy', '.y.'] }],
    palettes: [{ '.': null, y: C.gold, Y: C.candleBright }],
  },
};

/** A wrapped sweet: Candy, which has no item of its own, flying to her purse. */
export const CANDY_POP: EffectArt = {
  source: {
    rows: [
      'oo...oooo...oo',
      'oxo.owwrro.oxo',
      'oxxowwrrwwoxxo',
      'oxxorrwwrroxxo',
      'oxxowwrrwwoxxo',
      'oxxorrwwrroxxo',
      'oxo.orrwwo.oxo',
      'oo...oooo...oo',
    ],
  },
  palette: { '.': null, o: C.ink, x: C.candle, w: C.white, r: C.scarlet },
};

/** A little parcel, tied with a ribbon: anything that isn't an item (a chair, a frock, a recipe). */
export const PARCEL_POP: EffectArt = {
  source: {
    rows: [
      '..oo....oo..',
      '.oyyo..oyyo.',
      '..ooyooyoo..',
      'oooooyyooooo',
      'oppppyyppppo',
      'oyyyyyyyyyyo',
      'oppppyyppppo',
      'oPPPPyyPPPPo',
      'oPPPPyyPPPPo',
      'oooooooooooo',
    ],
  },
  palette: { '.': null, o: C.ink, y: C.candle, p: C.plumLight, P: C.plum },
};

/** A number's glyphs, three by five, for the "+n" beside a pop. */
const GLYPHS: Record<string, readonly string[]> = {
  '0': ['xxx', 'x.x', 'x.x', 'x.x', 'xxx'],
  '1': ['.x.', 'xx.', '.x.', '.x.', 'xxx'],
  '2': ['xxx', '..x', 'xxx', 'x..', 'xxx'],
  '3': ['xxx', '..x', '.xx', '..x', 'xxx'],
  '4': ['x.x', 'x.x', 'xxx', '..x', '..x'],
  '5': ['xxx', 'x..', 'xxx', '..x', 'xxx'],
  '6': ['xxx', 'x..', 'xxx', 'x.x', 'xxx'],
  '7': ['xxx', '..x', '.x.', '.x.', '.x.'],
  '8': ['xxx', 'x.x', 'xxx', 'x.x', 'xxx'],
  '9': ['xxx', 'x.x', 'xxx', '..x', 'xxx'],
  '+': ['...', '.x.', 'xxx', '.x.', '...'],
};

/** "+n" in white, outlined in ink so it reads over grass and night alike. */
export function countArt(count: number): EffectArt {
  const glyphs = `+${Math.max(0, Math.floor(count))}`.split('').map((c) => GLYPHS[c]!);
  const inner = Array.from({ length: 5 }, (_, y) => glyphs.map((g) => g[y]!).join('.'));
  const width = inner[0]!.length + 2;
  const padded = ['.'.repeat(width), ...inner.map((r) => `.${r}.`), '.'.repeat(width)];
  const at = (x: number, y: number) => padded[y]?.[x] === 'x';
  const rows = padded.map((row, y) =>
    [...row]
      .map((c, x) => {
        if (c === 'x') return 'x';
        for (let dy = -1; dy <= 1; dy++) {
          for (let dx = -1; dx <= 1; dx++) if (at(x + dx, y + dy)) return 'o';
        }
        return '.';
      })
      .join(''),
  );
  return { source: { rows }, palette: { '.': null, o: C.ink, x: C.white } };
}
