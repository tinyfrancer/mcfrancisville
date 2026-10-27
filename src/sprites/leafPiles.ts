import type { ItemArt } from './items';
import { PALETTE as C, ramp } from './palette';
import type { PropArt } from './props';
import { Sketch } from './sketch';
import type { Palette, SpriteSource } from './sprite';

/*
 * A pile of autumn leaves at a tree's foot (1.7's Y2, decision 389): a low heap of overlapping
 * leaves in the autumn's colours (the falling leaves' pumpkin, gold and red, and a few brown),
 * lit as one mass from the top left: a leaf on the lit side shows its light edge, one round the
 * shaded side is in its own shade, and the gaps between them are the heap's dark. Leaves at its
 * top stand proud of it, so its edge is ragged, with a soft outline from its own darkest brown.
 * Once she has jumped in it, it lies flat, a scatter of leaves, till the window turns.
 *
 * Keys: each colour's light, body and shade (`P p q` pumpkin, `Y y z` gold, `R r s` red, `B b k`
 * brown), `a` the dark between leaves, `t` a stalk, `o` the outline.
 */

/** A leaf's colours, lightest first: mostly pumpkin and gold, now and then red or brown. */
const COLOURS = ['Ppq', 'Ppq', 'Yyz', 'Yyz', 'Rrs', 'Pqb', 'Bbk'] as const;

/** A steady little random number from a seed, so the heap is drawn the same every time. */
function rng(seed: number): () => number {
  let h = seed >>> 0;
  return () => {
    h = (Math.imul(h ^ (h >>> 15), 2246822519) + 0x9e3779b9) >>> 0;
    h ^= h >>> 13;
    return (h >>> 0) / 4294967296;
  };
}

/**
 * A leaf five across and three down, its tip one way or the other: a light edge along its top
 * where the light reaches it, its body, its underside in shade, and its stalk at the end.
 */
function leaf(s: Sketch, x: number, y: number, colour: string, light: number, flip: boolean) {
  const [hi, mid, lo] = [...colour] as [string, string, string];
  // On the shaded side of the heap a leaf's light edge is its body, and its body its shade.
  const top = light > 0.25 ? hi : light > -0.35 ? mid : lo;
  const body = light > -0.35 ? mid : lo;
  const rows = ['.TT..', 'TBBBt', '.BBL.'];
  rows.forEach((row, j) => {
    for (let i = 0; i < row.length; i++) {
      const c = row[i]!;
      if (c === '.') continue;
      const key = c === 'T' ? top : c === 'B' ? body : c === 'L' ? lo : 't';
      s.set(flip ? x + 4 - i : x + i, y + j, key);
    }
  });
}

/** Clears the rows from the foot down, where the grass is. */
function clearBelow(s: Sketch, foot: number): void {
  for (let x = 0; x < 32; x++) for (let y = foot; y < 32; y++) s.set(x, y, '.');
}

function drawPile(): SpriteSource {
  const s = new Sketch(32, 32);
  const cx = 16;
  const foot = 29;
  // The heap's dark, a low dome sat flat on the grass, that the leaves are laid over.
  s.ellipse(cx, foot, 13.5, 9, 'a');
  clearBelow(s, foot);
  const r = rng(11);
  // Leaves from the back of the heap to its front, so the nearer overlap the further; the top
  // row stands a little proud of the dome, so its edge is leaves.
  for (let y = 18; y <= foot - 2; y += 2) {
    const half = Math.max(3, Math.sqrt(Math.max(0, 1 - ((foot - 1 - y) / 10) ** 2)) * 13);
    for (let x = cx - half - 2; x <= cx + half - 3; x += 2 + Math.floor(r() * 2)) {
      const lx = Math.round(x + r() * 2);
      const ly = y + Math.floor(r() * 2);
      const nx = (lx + 2 - cx) / 13;
      const ny = (ly + 1 - foot) / 9;
      const light = -nx * 0.7 - ny * 0.9 - 0.1;
      const colour = COLOURS[Math.floor(r() * COLOURS.length)]!;
      leaf(s, lx, ly, colour, light, r() < 0.5);
    }
  }
  clearBelow(s, foot);
  // A few loose at its foot, blown off it.
  leaf(s, 0, foot - 2, COLOURS[4], 0.1, false);
  leaf(s, 27, foot - 2, COLOURS[2], -0.2, true);
  s.outline(() => 'o');
  return s.toSource();
}

function drawFlattened(): SpriteSource {
  const s = new Sketch(32, 32);
  const foot = 29;
  s.ellipse(16, foot - 1, 13, 2.5, 'a');
  const r = rng(29);
  for (let y = foot - 4; y <= foot - 2; y += 1) {
    for (let x = 1 + Math.floor(r() * 3); x < 28; x += 4 + Math.floor(r() * 3)) {
      const colour = COLOURS[Math.floor(r() * COLOURS.length)]!;
      leaf(s, x, y, colour, 0.1 - (y - foot + 4) * 0.2, r() < 0.5);
    }
  }
  clearBelow(s, foot);
  s.outline(() => 'o');
  return s.toSource();
}

export const LEAF_PILE: SpriteSource = drawPile();
export const LEAF_PILE_FLAT: SpriteSource = drawFlattened();

export const LEAF_PILE_PALETTE: Palette = {
  '.': null,
  o: ramp(C.pumpkinDark)[0]!,
  a: ramp(C.pumpkinDark)[1]!,
  P: C.pumpkinLight,
  p: C.pumpkin,
  q: C.pumpkinShade,
  Y: C.gold,
  y: C.goldShade,
  z: ramp(C.goldShade)[1]!,
  R: ramp(C.scarlet)[3]!,
  r: C.scarlet,
  s: C.scarletShade,
  B: ramp(C.pumpkinDark)[3]!,
  b: C.pumpkinDark,
  k: ramp(C.pumpkinDark)[1]!,
  t: C.barkDark,
};

/** Drawn by the leaf piles' pass (`render/leaves.ts`), heaped or, once jumped in, flat. */
export const LEAF_PILE_ART: PropArt = {
  source: LEAF_PILE,
  palette: LEAF_PILE_PALETTE,
  spent: LEAF_PILE_FLAT,
  shadow: { w: 0, h: 0 },
};

/** The golden leaf she keeps from her first jump: a leaf all gold, its veins and its stalk. */
export const GOLDEN_LEAF_ART: ItemArt = (() => {
  const s = new Sketch(16, 16);
  // A maple leaf: five points, its stalk curling off below.
  const rows = [
    '................',
    '.......g........',
    '......ggg.......',
    '..g...ggg...g...',
    '..gg.ggggg.gg...',
    '...ggggggggg....',
    '.g.ggggggggg.g..',
    '.ggggggggggggg..',
    '..ggggggggggg...',
    '...ggggggggg....',
    '....ggggggg.....',
    '...gg..g..gg....',
  ];
  rows.forEach((row, y) => [...row].forEach((c, x) => c === 'g' && s.set(x, y, 'g')));
  s.bevel('g', 'G', 'a');
  s.line(7, 11, 7, 3, 'v').line(7, 9, 3, 6, 'v').line(7, 9, 11, 6, 'v');
  s.set(6, 2, 'w').set(4, 5, 'w');
  s.line(7, 12, 7, 13, 's').set(8, 14, 's');
  s.outline({ g: 'o', G: 'o', a: 'o', v: 'o', s: 'o', w: 'o' });
  return {
    source: s.toSource(),
    palette: {
      '.': null,
      o: C.pumpkinDark,
      a: C.goldShade,
      g: C.gold,
      G: C.candleBright,
      v: C.goldShade,
      w: C.white,
      s: C.barkDark,
    },
  };
})();
