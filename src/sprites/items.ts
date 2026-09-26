import type { ItemId, PatchId } from '../types/ids';
import { BONE, OUTFIT_ART } from './doll';
import { PALETTE as C } from './palette';
import type { Palette, SpriteSource } from './sprite';

export interface ItemArt {
  source: SpriteSource;
  palette: Palette;
}

/** A jack-o'-lantern; with its face in the skin's own colour, it's a pumpkin fresh from the bed. */
export const PUMPKIN: SpriteSource = {
  rows: [
    '................',
    '................',
    '................',
    '........ss......',
    '.......ss.......',
    '...ooooossoooo..',
    '..oppPppppPpppo.',
    '.oppPppppppPpppo',
    '.opPpffppffpPppo',
    '.opPpffppffpPppo',
    '.opPppppppppPppo',
    '.opPpfppppfpPppo',
    '.opPppffffppPppo',
    '.oppPppppppPpppo',
    '..oppPppppPpppo.',
    '...oooooooooo...',
  ],
};

/** A rock, which is also what a handful of stone looks like in the bag. */
export const ROCK: SpriteSource = {
  rows: [
    '................',
    '................',
    '................',
    '................',
    '................',
    '.....oooo.......',
    '...ooAAaaoo.....',
    '..oAAaaaaaao....',
    '..oAaaaaaaakoo..',
    '.oAaaaaaakaaaao.',
    '.oaaaaakaaaaaao.',
    '.oaaaaaaaaaakko.',
    '.okaaaaaaaaakko.',
    '..okkkkkkkkkko..',
    '...oooooooooo...',
    '................',
  ],
};

/** A rock once it's been chipped for the day: a couple of pebbles, whole again tomorrow. */
export const PEBBLES: SpriteSource = {
  rows: [
    '................',
    '................',
    '................',
    '................',
    '................',
    '................',
    '................',
    '................',
    '................',
    '................',
    '................',
    '....ooo...oo....',
    '...oAako.oAko...',
    '...okkko.okko...',
    '....ooo...oo....',
    '................',
  ],
};

export const STONE_PALETTE: Palette = {
  '.': null,
  o: C.ink,
  a: C.stone,
  A: C.stoneLight,
  k: C.stoneDark,
};

const WOOD: SpriteSource = {
  rows: [
    '................',
    '................',
    '................',
    '................',
    '..ooooooooooooo.',
    '.oTTTTTTTTToRRo.',
    '.otttttttttoRro.',
    '.otttttttttorRo.',
    '.odddddddddoRRo.',
    '..ooooooooooooo.',
    '................',
    '................',
    '................',
    '................',
    '................',
    '................',
  ],
};

const FLOWER: SpriteSource = {
  rows: [
    '................',
    '......ooo.......',
    '.....offfo......',
    '...ooofffooo....',
    '..offfoFofffo...',
    '..offfFcFfffo...',
    '..offfoFofffo...',
    '...ooofffooo....',
    '.....offfo......',
    '......ooo.......',
    '.......e........',
    '....ee.e........',
    '.....eee........',
    '.......e.ee.....',
    '.......eee......',
    '.......e........',
  ],
};

const PURSE_BUTTER: SpriteSource = {
  rows: [
    '................',
    '................',
    '................',
    '................',
    '................',
    '..oooooooooooo..',
    '..oGGGGGGGGGGo..',
    '..oGggggggggGo..',
    '..oGgSSSSSSgGo..',
    '..oGgSSSSSSgGo..',
    '..oGggggggggGo..',
    '..oGGGGGGGGGGo..',
    '..oooooooooooo..',
    '................',
    '................',
    '................',
  ],
};

const PIZZA: SpriteSource = {
  rows: [
    '................',
    '................',
    '..oooooooooooo..',
    '..oCCCCCCCCCCo..',
    '..oyyryyyyryyo..',
    '...oyyyyryyyo...',
    '...oyryyyyyyo...',
    '....oyyyryyo....',
    '....oyyyyyyo....',
    '.....oyryyo.....',
    '.....oyyyyo.....',
    '......oyyo......',
    '......oyyo......',
    '.......oo.......',
    '................',
    '................',
  ],
};

const BAT_COOKIE: SpriteSource = {
  rows: [
    '................',
    '................',
    '................',
    '................',
    '................',
    'oo....oooo....oo',
    'obo..obbbbo..obo',
    'obbooobbbbooobbo',
    'obbbbbcbbcbbbbbo',
    '.obbbbbbbbbbbbo.',
    '..oobbcbbbbboo..',
    '....obbbbbbo....',
    '.....oooooo.....',
    '................',
    '................',
    '................',
  ],
};

const PUDDING: SpriteSource = {
  rows: [
    '................',
    '................',
    '.......oo.......',
    '......oWWo......',
    '.....okWWko.....',
    '....oWWWWWWo....',
    '..oooooooooooo..',
    '..oppppppppppo..',
    '..occcccccccco..',
    '...occcccccco...',
    '...oCccccccCo...',
    '....occcccco....',
    '....oooooooo....',
    '................',
    '................',
    '................',
  ],
};

const GHOST_MALLOW: SpriteSource = {
  rows: [
    '................',
    '................',
    '.....oooooo.....',
    '....oGGGGGGo....',
    '....oWkWWkWo....',
    '....oWWWWWWo....',
    '....oWWuuWWo....',
    '....oGGGGGGo....',
    '.....oooooo.....',
    '.......ss.......',
    '.......ss.......',
    '.......ss.......',
    '.......ss.......',
    '.......ss.......',
    '................',
    '................',
  ],
};

const GHOST_PEPPER: SpriteSource = {
  rows: [
    '................',
    '.......ss.......',
    '......ss........',
    '.....oWWo.......',
    '....oWWWWo......',
    '...oWWWWWWo.....',
    '...oWoWWoWo.....',
    '...oWWWWWWo.....',
    '...oWWWuWwo.....',
    '....oWWWWwo.....',
    '....oWWWwo......',
    '.....oWWwo......',
    '.....oWwo.......',
    '......oo........',
    '................',
    '................',
  ],
};

const CANDY_CORN: SpriteSource = {
  rows: [
    '................',
    '.......oo.......',
    '......owwo......',
    '.....owwwwo.....',
    '.....owwwwo.....',
    '....oppppppo....',
    '....oppppppo....',
    '....oppppppo....',
    '....oyyyyyyo....',
    '...LoyyyyyyoL...',
    '..LLoyyyyyyoLL..',
    '..lLLoyyyyoLLl..',
    '...llLooooLll...',
    '....lllLLlll....',
    '......llll......',
    '................',
  ],
};

const BEAN: SpriteSource = {
  rows: [
    '................',
    '........ss......',
    '.......ss.......',
    '......obbo......',
    '.....obbbbo.....',
    '....obbBbbbo....',
    '...obbBbbbbbo...',
    '..obbBbbbbbbbo..',
    '..obBbbbbbbbbo..',
    '.obbbbbbbbbbbbo.',
    '.obbbobbbobbbbo.',
    '.obbo.obo.obbo..',
    '..oo...o...oo...',
    '................',
    '................',
    '................',
  ],
};

const ROSE: SpriteSource = {
  rows: [
    '................',
    '.....oooooo.....',
    '....orrRRrro....',
    '...orRRrrRRro...',
    '...orRrrrrRro...',
    '...orrRRrRrro...',
    '....orrrrrro....',
    '.....oooooo.....',
    '.......ss.......',
    '...oo..ss.......',
    '..oLlo.ss.......',
    '...ollsss.......',
    '.......ss.......',
    '.......ss.......',
    '.......ss.......',
    '................',
  ],
};

const SNAPDRAGON: SpriteSource = {
  rows: [
    '.......oo.......',
    '......oPpo......',
    '......oppo......',
    '.....oPpPpo.....',
    '.....opppPo.....',
    '......oPpo......',
    '.....opPppo.....',
    '.....oppPpo.....',
    '......oPpo......',
    '.....oPpppo.....',
    '......oooo......',
    '.......ss.......',
    '....oo.ss.......',
    '...oLlosss......',
    '....oo.ss.......',
    '.......ss.......',
  ],
};

const SPIDER_LILY: SpriteSource = {
  rows: [
    '................',
    '..r...r..r...r..',
    '...r..r..r..r...',
    '.r..r.rrrr.r..r.',
    '..rr.rrRRrr.rr..',
    '....rrRRRRrr....',
    '..rr.rrRRrr.rr..',
    '.r..r.rrrr.r..r.',
    '...r...ss...r...',
    '.......ss.......',
    '.......ss.......',
    '.......ss.......',
    '.......ss.......',
    '.......ss.......',
    '.......ss.......',
    '................',
  ],
};

const HOSTA_LEAF: SpriteSource = {
  rows: [
    '................',
    '.......oo.......',
    '......oLLo......',
    '.....oLllLo.....',
    '....oLlldlLo....',
    '...oLlldldlLo...',
    '...oLldlldlLo...',
    '..oLlldlldllLo..',
    '..oLlldlldllLo..',
    '..oLldlllldlLo..',
    '...oLldlldlLo...',
    '....oLLddLLo....',
    '.....oooooo.....',
    '.......ss.......',
    '.......ss.......',
    '................',
  ],
};

const BAT_FLOWER: SpriteSource = {
  rows: [
    '................',
    '.B............B.',
    '.bB..........Bb.',
    '.bbB...kk...Bbb.',
    '.bbbB.kkkk.Bbbb.',
    '..bbbbkkkkbbbb..',
    '...bbbbkkbbbb...',
    '....bbbbbbbb....',
    '.....w.ss.w.....',
    '....w..ss..w....',
    '...w...ss...w...',
    '.......ss.......',
    '....oo.ss.......',
    '...oLlosss......',
    '....oo.ss.......',
    '.......ss.......',
  ],
};

/** One packet for every seed, its band and picture in the colours of what it grows. */
const SEED_PACKET: SpriteSource = {
  rows: [
    '................',
    '...oooooooooo...',
    '...oPPPPPPPPo...',
    '...oooooooooo...',
    '...oppppppppo...',
    '...occcccccco...',
    '...occffffcco...',
    '...ocfFffffco...',
    '...ocffffffco...',
    '...occffffcco...',
    '...occcccccco...',
    '...oppppppppo...',
    '...opttttttpo...',
    '...opttttpppo...',
    '...oooooooooo...',
    '................',
  ],
};

function packet(band: string, fruit: string, fruitLight: string): ItemArt {
  return {
    source: SEED_PACKET,
    palette: {
      '.': null,
      o: C.ink,
      P: C.creamShade,
      p: C.cream,
      t: C.stoneDark,
      c: band,
      f: fruit,
      F: fruitLight,
    },
  };
}

const LEAVES = { L: C.leafLight, l: C.leaf, d: C.leafDark, s: C.leafDark } as const;

function rose(petal: string, light: string): ItemArt {
  return { source: ROSE, palette: { '.': null, o: C.ink, r: petal, R: light, ...LEAVES } };
}

function flower(petal: string, shade: string): ItemArt {
  return {
    source: FLOWER,
    palette: { '.': null, o: C.ink, f: petal, F: shade, c: C.candle, e: C.mossLight },
  };
}

/** A whole pizza, with a jack-o'-lantern face in pepperoni. */
const WHOLE_PIZZA: SpriteSource = {
  rows: [
    '................',
    '.....oooooo.....',
    '...ooCCCCCCoo...',
    '..oCCyyyyyyCCo..',
    '.oCyyyyyyyyyyCo.',
    '.oCyrryyyyrryCo.',
    'oCyyrryyyyrryyCo',
    'oCyyyyyyyyyyyyCo',
    'oCyryyyyyyyyryCo',
    'oCyyrryyyyrryyCo',
    'oCyyyrrrrrryyyCo',
    '.oCyyyyyyyyyyCo.',
    '..oCCyyyyyyCCo..',
    '...ooCCCCCCoo...',
    '.....oooooo.....',
    '................',
  ],
};

/** A squeeze ball of gummy goo with a little face. */
const GOO_BALL: SpriteSource = {
  rows: [
    '................',
    '................',
    '................',
    '.....oooooo.....',
    '...ooGGggggoo...',
    '..oGGggggggggo..',
    '.oGggggggggggdo.',
    '.ogggeggggeggdo.',
    'oggggeggggegggdo',
    'ogggggguuggggddo',
    'oggggggggggggddo',
    '.ogggggggggdddo.',
    '..oggggggggddo..',
    '...ooddddddoo...',
    '.....oooooo.....',
    '................',
  ],
};

/** The goo ball with glitter swirled through it, where the goo catches the light. */
const GLITTER_GOO_BALL: SpriteSource = {
  rows: GOO_BALL.rows.map((row, r) =>
    [...row].map((ch, c) => (ch === 'g' && (r * 5 + c * 3) % 7 === 0 ? 'x' : ch)).join(''),
  ),
};

const EYEBALL: SpriteSource = {
  rows: [
    '................',
    '................',
    '................',
    '.....oooooo.....',
    '...ooWWwwwwoo...',
    '..oWWwwwwwwwwo..',
    '.oWwwwiiiiwwwso.',
    'oWwwwiiWpiiwwwso',
    'owwwwiippiiwwwso',
    'owrwwwiiiiwwwsso',
    'owwrwwwwwwwwrsso',
    '.owwwwwwwwwwsso.',
    '..owwwwwwwwsso..',
    '...oossssssoo...',
    '.....oooooo.....',
    '................',
  ],
};

/** A steamed bun with a twist of pleats on top, and a sleepy face. */
const BAO: SpriteSource = {
  rows: [
    '................',
    '................',
    '................',
    '.......oo.......',
    '.....ooPPoo.....',
    '...ooppPPppoo...',
    '..oppppPPppppo..',
    '.oppppppppppppo.',
    '.opppeppppeppso.',
    'oppppeppppepppso',
    'oppppppuupppppso',
    'oppcppppppppcsso',
    'opppppppppppssso',
    '.oppppppppppsso.',
    '..oooooooooooo..',
    '................',
  ],
};

/** A crimped dumpling with little bat wings. */
const GYOZA: SpriteSource = {
  rows: [
    '................',
    '................',
    '................',
    '................',
    '................',
    '.....oooooo.....',
    '...ooPpPpPpoo...',
    'o.oppppppppppo.o',
    'owoppeppppeppowo',
    'owwopppuupppowwo',
    '.o.oppppppppo.o.',
    '....oooooooo....',
    '................',
    '................',
    '................',
    '................',
  ],
};

/** A record half out of its sleeve; the sleeve carries the band's print. */
const RECORD: readonly string[] = [
  '................',
  '.....oooooo.....',
  '...ooddddddoo...',
  '..odgddLLddgdo..',
  '.oddgdLLLLdgddo.',
  '.oooooooooooooo.',
  '.oSSSSSSSSSSSSo.',
  '.osssssssssssSo.',
  '.osssssssssssSo.',
  '.osssssssssssSo.',
  '.osssssssssssSo.',
  '.osssssssssssSo.',
  '.osssssssssssSo.',
  '.osssssssssssSo.',
  '.oooooooooooooo.',
  '................',
];

/** A banana, for the calypso record that gets a whole dinner party dancing. */
const BANANA: readonly string[] = ['.....x', 'x...xx', '.xxxx.'];

function record(
  sleeve: string,
  sleeveShade: string,
  label: string,
  print: readonly string[],
  accents: { x?: string; y?: string } = {},
): ItemArt {
  const top = 7 + Math.floor((7 - print.length) / 2);
  const left = 2 + Math.floor((11 - (print[0]?.length ?? 0)) / 2);
  const rows = RECORD.map((row, r) =>
    [...row]
      .map((ch, c) => {
        const mark = print[r - top]?.[c - left];
        return mark && mark !== '.' ? mark : ch;
      })
      .join(''),
  );
  return {
    source: { rows },
    palette: {
      '.': null,
      o: C.ink,
      d: C.inkFabric,
      g: C.dusk,
      L: label,
      s: sleeve,
      S: sleeveShade,
      x: accents.x ?? C.white,
      y: accents.y ?? C.inkFabric,
    },
  };
}

function gooBall(main: string, light: string, shade: string, source = GOO_BALL): ItemArt {
  return {
    source,
    palette: {
      '.': null,
      o: C.ink,
      g: main,
      G: light,
      d: shade,
      e: C.ink,
      u: C.ink,
      x: C.white,
    },
  };
}

function bao(main: string, pleat: string, shade: string): ItemArt {
  return {
    source: BAO,
    palette: {
      '.': null,
      o: C.ink,
      p: main,
      P: pleat,
      s: shade,
      e: C.ink,
      u: C.rose,
      c: C.cheek,
    },
  };
}

const printOf = (id: keyof typeof OUTFIT_ART) => OUTFIT_ART[id].print ?? [];
const accentsOf = (id: keyof typeof OUTFIT_ART) => OUTFIT_ART[id].accents;

/** Every item as it's shown in the bag, 16×16. The night's snack is drawn on the ground with it too. */
export const ITEM_ART: Record<ItemId, ItemArt> = {
  wood: {
    source: WOOD,
    palette: { '.': null, o: C.ink, T: C.wood, t: C.bark, d: C.barkDark, R: C.rope, r: C.wood },
  },
  stone: { source: ROCK, palette: STONE_PALETTE },
  moonpetal: flower(C.lavender, C.lavenderShade),
  forgetMeBoo: flower(C.sky, C.blueFabric),
  ghostDaisy: flower(C.white, C.silver),
  purseButter: {
    source: PURSE_BUTTER,
    palette: { '.': null, o: C.ink, G: C.teal, g: C.tealLight, S: C.silver },
  },
  midnightPizza: {
    source: PIZZA,
    palette: { '.': null, o: C.ink, C: C.goldShade, y: C.candle, r: C.rose },
  },
  batWingCookie: {
    source: BAT_COOKIE,
    palette: { '.': null, o: C.ink, b: C.bark, c: C.cream },
  },
  pumpkinPudding: {
    source: PUDDING,
    palette: {
      '.': null,
      o: C.ink,
      W: C.white,
      k: C.ink,
      p: C.pumpkin,
      c: C.silver,
      C: C.silverShade,
    },
  },
  ghostMallow: {
    source: GHOST_MALLOW,
    palette: { '.': null, o: C.ink, G: C.goldShade, W: C.white, k: C.ink, u: C.rose, s: C.wood },
  },
  pumpkin: {
    source: PUMPKIN,
    palette: {
      '.': null,
      o: C.pumpkinDark,
      p: C.pumpkin,
      P: C.pumpkinLight,
      s: C.leafDark,
      f: C.pumpkin,
    },
  },
  ghostPepper: {
    source: GHOST_PEPPER,
    palette: { '.': null, o: C.ink, W: C.ghost, w: C.silver, u: C.cheek, s: C.leafDark },
  },
  candyCorn: {
    source: CANDY_CORN,
    palette: { '.': null, o: C.ink, w: C.white, p: C.pumpkin, y: C.gold, ...LEAVES },
  },
  batWingBean: {
    source: BEAN,
    palette: { '.': null, o: C.ink, b: C.plum, B: C.plumLight, s: C.leafDark },
  },
  rose: rose(C.rose, C.roseLight),
  blueRose: rose(C.blueFabric, C.sky),
  moonflower: flower(C.ghost, C.silver),
  snapdragon: {
    source: SNAPDRAGON,
    palette: { '.': null, o: C.ink, p: C.snap, P: C.snapLight, ...LEAVES },
  },
  spiderLily: {
    source: SPIDER_LILY,
    palette: { '.': null, r: C.lily, R: C.lilyLight, s: C.leafDark },
  },
  hosta: {
    source: HOSTA_LEAF,
    palette: {
      '.': null,
      o: C.ink,
      L: C.hostaBlueLight,
      l: C.hostaBlue,
      d: C.hostaBlueDark,
      s: C.leafDark,
    },
  },
  batFlower: {
    source: BAT_FLOWER,
    palette: {
      '.': null,
      o: C.ink,
      b: C.plum,
      B: C.plumLight,
      k: C.ink,
      w: C.stoneLight,
      ...LEAVES,
    },
  },
  pumpkinSeed: packet(C.moss, C.pumpkin, C.pumpkinLight),
  ghostPepperSeed: packet(C.plum, C.ghost, C.white),
  candyCornSeed: packet(C.teal, C.gold, C.pumpkin),
  batWingBeanSeed: packet(C.moss, C.plum, C.plumLight),
  roseSeed: packet(C.plum, C.rose, C.roseLight),
  moonflowerSeed: packet(C.navy, C.ghost, C.candle),
  snapdragonSeed: packet(C.teal, C.snap, C.snapLight),
  spiderLilyBulb: packet(C.ink, C.lily, C.lilyLight),
  hostaDivision: packet(C.moss, C.hostaBlue, C.hostaBlueLight),
  batFlowerSeed: packet(C.lavender, C.plum, C.plumLight),
  jackOLanternPizza: {
    source: WHOLE_PIZZA,
    palette: { '.': null, o: C.ink, C: C.goldShade, y: C.candle, r: C.scarlet },
  },
  ghostGooBall: gooBall(C.ghost, C.white, C.lavender),
  pumpkinGooBall: gooBall(C.pumpkin, C.pumpkinLight, C.pumpkinShade),
  blueMoonGooBall: gooBall(C.blueFabric, C.sky, C.navy, GLITTER_GOO_BALL),
  swampGooBall: gooBall(C.leafLight, C.mossLight, C.leafDark),
  eyeballSquish: {
    source: EYEBALL,
    palette: {
      '.': null,
      o: C.ink,
      w: C.ghost,
      W: C.white,
      s: C.silver,
      i: C.eyeBlue,
      p: C.ink,
      r: C.roseLight,
    },
  },
  booBao: bao(C.ghost, C.silver, C.lavender),
  xiaoLongBoo: bao(C.cream, C.creamShade, C.creamShade),
  batGyoza: {
    source: GYOZA,
    palette: {
      '.': null,
      o: C.ink,
      p: C.cream,
      P: C.creamShade,
      w: C.plum,
      e: C.ink,
      u: C.rose,
    },
  },
  recordGhoulyParton: record(
    C.rose,
    C.berryLight,
    C.candle,
    printOf('teeGhoulyParton'),
    accentsOf('teeGhoulyParton'),
  ),
  recordLadyGhoulga: record(
    C.inkFabric,
    C.iron,
    C.candle,
    printOf('teeLadyGhoulga'),
    accentsOf('teeLadyGhoulga'),
  ),
  recordFleetwoodMacabre: record(
    C.teal,
    C.tealShade,
    C.ghost,
    printOf('teeFleetwoodMacabre'),
    accentsOf('teeFleetwoodMacabre'),
  ),
  recordScreamDion: record(
    C.blueFabric,
    C.blueFabricShade,
    C.sky,
    printOf('teeScreamDion'),
    accentsOf('teeScreamDion'),
  ),
  recordBoneJovi: record(C.plumLight, C.plum, C.white, BONE),
  recordBoolafonte: record(C.mossLight, C.moss, C.gold, BANANA, { x: C.gold }),
};

const BLOOMS: SpriteSource = {
  rows: [
    '................',
    '................',
    '..f.............',
    '.fcf............',
    '..f.............',
    '..e........f....',
    '..e.......fcf...',
    '...........f....',
    '...........e....',
    '...........e....',
    '.......f........',
    '......fcf.......',
    '.......f........',
    '.......e........',
    '.......e........',
    '................',
  ],
};

/** What's left of a patch once it's been picked: sprouts, in bloom again tomorrow. */
export const SPROUTS: SpriteSource = {
  rows: [
    '................',
    '................',
    '................',
    '................',
    '.e.e............',
    '..e.............',
    '..........e.e...',
    '...........e....',
    '................',
    '................',
    '................',
    '......e.e.......',
    '.......e........',
    '................',
    '................',
    '................',
  ],
};

export const SPROUTS_PALETTE: Palette = { '.': null, e: C.mossLight };

export interface PatchArt extends ItemArt {
  /** Blooms that glow after dark, as moonpetals do. */
  glows?: true;
}

function blooms(petal: string, glows?: true): PatchArt {
  const art: PatchArt = {
    source: BLOOMS,
    palette: { '.': null, f: petal, c: C.candle, e: C.mossLight },
  };
  if (glows) art.glows = true;
  return art;
}

export const PATCH_ART: Record<PatchId, PatchArt> = {
  moonpetals: blooms(C.lavender, true),
  forgetMeBoos: blooms(C.sky),
  ghostDaisies: blooms(C.white),
};
