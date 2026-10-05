import type { FruitId } from '../types/ids';
import type { OrchardDishId } from '../data/orchard';
import { mix, PALETTE as C, ramp } from './palette';
import type { Palette, SpriteSource } from './sprite';

/*
 * Boo Acres' orchard in her bag (0.3's F2): its four fruit and the four dishes cooked from them,
 * 16-pixel icons like every item's (decision 105). Each fruit is lit from the top left, `R` its
 * light side and `d` its shade, with a shine (`W`), its stem (`s`) and a leaf (`L`, `l`).
 */

const APPLE: SpriteSource = {
  rows: [
    '................',
    '........s.Ll....',
    '........sLLl....',
    '........s.......',
    '.....oo.soo.....',
    '...ooRRoorroo...',
    '...oRWRRrrrro...',
    '..oRWRrrrrrrro..',
    '..oRRrrrrrrrro..',
    '..orrrrrrrrrro..',
    '..orrrrrrrrddo..',
    '..orrrrrrrdddo..',
    '...orrrrddddo...',
    '...orrrdddddo...',
    '....oooooooo....',
    '................',
  ],
};

const PEAR: SpriteSource = {
  rows: [
    '................',
    '........slLL....',
    '.......os.......',
    '......oRRo......',
    '.....oRRrro.....',
    '.....oRWrro.....',
    '.....orrrro.....',
    '.....orrrro.....',
    '...oorrrrrroo...',
    '...orrrrrrrdo...',
    '..orrWrrrrdddo..',
    '..orrrrrrddddo..',
    '...orrrrddddo...',
    '...oordddddoo...',
    '.....oooooo.....',
    '................',
  ],
};

const PLUM: SpriteSource = {
  rows: [
    '................',
    '..........L.....',
    '........sLl.....',
    '........s.......',
    '.....oooooo.....',
    '....oRRRRrro....',
    '...oRRRRrrrro...',
    '...oRWrrrrrro...',
    '..oRRWrrrrrrro..',
    '..orrrrrrrrrro..',
    '..orrrrrrrrddo..',
    '...orrrrrrddo...',
    '...orrrrddddo...',
    '....orrddddo....',
    '.....oooooo.....',
    '................',
  ],
};

/** A persimmon, squat and round under its four-leaf cap. */
const PERSIMMON: SpriteSource = {
  rows: [
    '................',
    '................',
    '................',
    '........s.......',
    '.....L..s..l....',
    '.....lLLLLLl....',
    '...ooRRRRrroo...',
    '..oRWRRrrrrrro..',
    '..oRWRrrrrrrro..',
    '.oRRrrrrrrrrrro.',
    '.orrrrrrrrrrddo.',
    '..orrrrrrrdddo..',
    '..orrrrrrddddo..',
    '...oorrddddoo...',
    '.....oooooo.....',
    '................',
  ],
};

/** An apple pie in its tin under a lattice crust: `C` the lattice, `p` the apples, `t` the tin. */
const APPLE_PIE: SpriteSource = {
  rows: [
    '................',
    '................',
    '.....oooooo.....',
    '...ooCCCCCCoo...',
    '..oCpCpCpCpCpo..',
    '.oCCCCCCCCCCCCo.',
    '.oCpCpCpCpCpCpo.',
    '.oCCCCCCCCCCCCo.',
    '.ocpCpCpCpCpCco.',
    '.oocccccccccccoo',
    '.otttttttttttto.',
    '..otTttttttTto..',
    '...oooooooooo...',
    '................',
    '................',
    '................',
  ],
};

/** Plum crumble in a baking dish, the plums bubbling up through it: `c`/`C` crumble, `p`/`P` plum. */
const PLUM_CRUMBLE: SpriteSource = {
  rows: [
    '................',
    '................',
    '......s...s.....',
    '.....s...s......',
    '...oooooooooo...',
    '..oCcCcpCcCcCo..',
    '.oCcCcpPpcCcCco.',
    '.ocCcCcpcCcpCco.',
    '.oCcpcCcCcpPpco.',
    '.otttttttttttto.',
    '.oTttttttttttTo.',
    '.otttttttttttto.',
    '..oooooooooooo..',
    '................',
    '................',
    '................',
  ],
};

/** A big mug of hot cider, steaming, a cinnamon stick in it: `m` the mug, `k` the cider. */
const HOT_CIDER: SpriteSource = {
  rows: [
    '.......s..s.....',
    '......s..s......',
    '.......s..s.....',
    '........c.......',
    '...oooooocooo...',
    '...okKkkkckko...',
    '...oMmmmmmmmoo..',
    '...oMmmmmmmmo.o.',
    '...oMmmmmmmmo.o.',
    '...oMmmmmmmmo.o.',
    '...oMmmmmmmmoo..',
    '...oMmmmmmmmo...',
    '....oooooooo....',
    '................',
    '................',
    '................',
  ],
};

/** A persimmon pudding turned out on a plate, a leaf on top: `r` the pudding, `p` the plate. */
const PERSIMMON_PUDDING: SpriteSource = {
  rows: [
    '................',
    '................',
    '.......Ll.......',
    '......LllL......',
    '.....oooooo.....',
    '....oRRrrrro....',
    '...oRWRrrrrdo...',
    '...oRRrrrrrdo...',
    '..oRrrrrrrrddo..',
    '..orrrrrrrdddo..',
    '..orrrrrrddddo..',
    '.oppppppppppppo.',
    '..oPPPPPPPPPPo..',
    '...oooooooooo...',
    '................',
    '................',
  ],
};

const LEAF = ramp(C.leaf);
const STEAM = { s: C.silver };

/** A fruit's palette from its colour: outline, shade, body, light and shine from its own ramp. */
function fruit(colour: string): Palette {
  const r = ramp(colour);
  return {
    '.': null,
    o: r[0],
    d: r[1],
    r: r[2],
    R: r[3],
    W: r[4],
    s: C.wood,
    L: LEAF[2],
    l: LEAF[1],
  };
}

const CRUST = ramp(C.gold);
const TIN = ramp(C.silver);

export const ORCHARD_ITEM_ART: Record<
  FruitId | OrchardDishId,
  { source: SpriteSource; palette: Palette }
> = {
  apple: { source: APPLE, palette: fruit(C.scarlet) },
  pear: { source: PEAR, palette: fruit(mix(C.gold, C.mossLight, 0.35)) },
  plum: { source: PLUM, palette: fruit(mix(C.plum, C.lavender, 0.45)) },
  persimmon: { source: PERSIMMON, palette: fruit(C.pumpkin) },
  applePie: {
    source: APPLE_PIE,
    palette: {
      '.': null,
      o: C.ink,
      c: CRUST[2],
      C: CRUST[3],
      p: ramp(C.pumpkin)[1],
      t: TIN[1],
      T: TIN[3],
    },
  },
  plumCrumble: {
    source: PLUM_CRUMBLE,
    palette: {
      '.': null,
      ...STEAM,
      o: C.ink,
      c: CRUST[2],
      C: CRUST[3],
      p: mix(C.plum, C.lavender, 0.45),
      P: C.plum,
      t: C.cream,
      T: C.white,
    },
  },
  hotCider: {
    source: HOT_CIDER,
    palette: {
      '.': null,
      ...STEAM,
      o: C.ink,
      c: C.wood,
      k: ramp(C.pumpkin)[1],
      K: C.pumpkin,
      m: C.scarlet,
      M: ramp(C.scarlet)[3],
    },
  },
  persimmonPudding: {
    source: PERSIMMON_PUDDING,
    palette: { ...fruit(C.pumpkin), o: C.ink, p: C.cream, P: C.creamShade },
  },
};
