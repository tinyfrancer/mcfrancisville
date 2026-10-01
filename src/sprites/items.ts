import type { CritterId, ItemId } from '../types/ids';
import { FIRST_BROOM } from '../data/broom';
import { BRACELET_BEADS } from './bracelets';
import { broomIconArt } from './broom';
import { CRITTER_ART } from './critters';
import { DOLL_ART } from './dolls';
import { BONE, OUTFIT_ART } from './doll';
import { PALETTE as C, ramp } from './palette';
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

/** The pick of the pumpkin patch (0.2's J3): a big round one, its vine and leaf, and a rosette. */
const PATCH_PUMPKIN: SpriteSource = {
  rows: [
    '................',
    '.......ss.......',
    '......ss.LL.....',
    '.....s.sLLl.....',
    '..ooooossoooo...',
    '.oppPpppppPppo..',
    'oppPpppppppPppo.',
    'opPpppppppppPpo.',
    'opPpppppppppPpo.',
    'opPppppppppPppo.',
    'opPpppppppPpbbb.',
    'oppPpppppppbBBb.',
    '.oppPppppPpbbbb.',
    '..ooooooooobbb..',
    '...........r.r..',
    '...........r.r..',
  ],
};

/** Film night's popcorn (0.2's J3): a striped paper tub, heaped over the top. */
const POPCORN: SpriteSource = {
  rows: [
    '................',
    '....c.cC.c......',
    '...cCccCcCc.....',
    '..cCcCccCcCc....',
    '..ccCcCcccCc....',
    '..orrwwrrwwro...',
    '..orrwwrrwwro...',
    '...orwwrrwwo....',
    '...orwwrrwwo....',
    '...orwwrrwwo....',
    '...orwwrrwwo....',
    '....orwrrwo.....',
    '....orwrrwo.....',
    '....oooooo......',
    '................',
    '................',
  ],
};

/** A bowl of the party's white chicken chili (0.2's J4), a spoon standing in it. */
const CHILI_BOWL: SpriteSource = {
  rows: [
    '................',
    '................',
    '................',
    '.....l..........',
    '......l.........',
    '..oooooloooooo..',
    '.okkkgkkklkkkko.',
    '.okrkkkkkgkkkko.',
    '..owwwwwwwwwwo..',
    '..obbbbbbbbbbo..',
    '...obbbbbbbbo...',
    '....obbbbbbo....',
    '.....oooooo.....',
    '................',
    '................',
    '................',
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

/** A little tombstone under a moon, for the song they danced to. */
const TOMB: readonly string[] = ['.xx..', 'xxxx.', 'xxxx.', 'xxxx.'];
/** A quaver, for Boothoven's sonata (0.2's L1). */
const QUAVER: readonly string[] = ['..xx', '..x.x', '..x..', 'xxx..', 'xx...'];

/** A bowl of rice and beans, heaped with guac. */
const BURRITO_BOWL: SpriteSource = {
  rows: [
    '................',
    '................',
    '................',
    '................',
    '.....gggg.......',
    '...ggGGggrr.....',
    '..rwwgGgwbbrr...',
    '.orwwwwbbwwwrro.',
    '.oooooooooooooo.',
    '.obbbbbbbbbbbbo.',
    '..obBbbbbbbBbo..',
    '..obbbbbbbbbbo..',
    '...obbbbbbbbo...',
    '....oooooooo....',
    '................',
    '................',
  ],
};

/** Two chocolate biscuits with a pink-and-green filling, and a banana-yellow middle. */
/** One of Fibi's bones, a classic dog bone with knobbly ends. `b` bone, `s` its shade. */
export const DOG_BONE: SpriteSource = {
  rows: [
    '................',
    '................',
    '................',
    '................',
    '..oo........oo..',
    '.obbo......obbo.',
    '.obbboooooobbbo.',
    '..obbbbbbbbbbo..',
    '..obbbbbbbbbso..',
    '.obbsooooooobso.',
    '.obso......obso.',
    '..oo........oo..',
    '................',
    '................',
    '................',
    '................',
  ],
};

/**
 * A candy sapling (0.2's E1): a little minty crown on a candy-cane stem, a sweet hanging from it,
 * its roots in a twist of burlap. `l`/`L` leaves, `w`/`y` the stem, `p` the sweet, `b`/`B` burlap.
 */
const CANDY_SAPLING_ICON: SpriteSource = {
  rows: [
    '................',
    '.....oooooo.....',
    '....oLLlLLlo....',
    '...oLllllLllo...',
    '...olllLlllloo..',
    '...ollllllllo...',
    '....oollwlloo...',
    '......oyo.op....',
    '......owo.oppo..',
    '......oyo..pp...',
    '.....oowoo......',
    '....obbbbbbo....',
    '...obBbbBbbbo...',
    '...obbbbbbBbo...',
    '....obbbbbbo....',
    '.....oooooo.....',
  ],
};

const MOON_PIE: SpriteSource = {
  rows: [
    '................',
    '................',
    '................',
    '....oooooooo....',
    '..ooccCccccccoo.',
    '.occcccccCccccco',
    '.occCcccccccccco',
    '.oppppppppppppo.',
    '.oyyyyyyyyyyyyo.',
    '.ogggggggggggggo',
    '.occcccccccCcco.',
    '.occcCccccccccco',
    '..ooccccccCcoo..',
    '....oooooooo....',
    '................',
    '................',
  ],
};

/** A paper bag, rolled over at the top, with a moon on it. */
const PAPER_BAG: SpriteSource = {
  rows: [
    '................',
    '................',
    '.....oooooo.....',
    '....oBBBBBBo....',
    '....oooooooo....',
    '...obbbbbbbbo...',
    '...obbbbbbbbo...',
    '...obbbyybbbo...',
    '...obbyybbbbo...',
    '...obbyybbbbo...',
    '...obbbyybbbo...',
    '...obbbbbbbbo...',
    '...obbbbbbbBo...',
    '...oooooooooo...',
    '................',
    '................',
  ],
};

const printOf = (id: keyof typeof OUTFIT_ART) => OUTFIT_ART[id].print ?? [];
const accentsOf = (id: keyof typeof OUTFIT_ART) => OUTFIT_ART[id].accents;

/** Every item as it's shown in the bag, 16×16. The night's snack is drawn on the ground with it too. */
// Beads and bracelets (phase 8). A bead has its string running through it.
const HEART_BEAD: SpriteSource = {
  rows: [
    '................',
    '................',
    '................',
    '................',
    '....ooo..ooo....',
    '...oRRRooRRRo...',
    '...oWRRRRRRRo...',
    'rrroRRRRRRRRorrr',
    '....oRRRRRRo....',
    '.....oRRRRo.....',
    '......oRRo......',
    '.......oo.......',
    '................',
    '................',
    '................',
    '................',
  ],
};

const LOVE_BEADS: SpriteSource = {
  rows: [
    '................',
    '.oooooo..oooooo.',
    '.okwwwo..owkkwo.',
    'rokwwworrokwwkor',
    '.okwwwo..okwwko.',
    '.okkkwo..owkkwo.',
    '.oooooo..oooooo.',
    '................',
    '.oooooo..oooooo.',
    '.okwwko..okkkwo.',
    'rokwwkorrokkwwor',
    '.owkkwo..okwwwo.',
    '.owkkwo..okkkwo.',
    '.oooooo..oooooo.',
    '................',
    '................',
  ],
};

const SMILEY_BEAD: SpriteSource = {
  rows: [
    '................',
    '................',
    '................',
    '.....oooooo.....',
    '....oyyyyyyo....',
    '...oyYyyyyyyo...',
    '...oyykyykyyo...',
    'rrroyykyykyyorrr',
    '...oyyyyyyyyo...',
    '...oykyyyykyo...',
    '...oyykkkkyyo...',
    '....oyyyyyyo....',
    '.....oooooo.....',
    '................',
    '................',
    '................',
  ],
};

const FOOTBALL_BEAD: SpriteSource = {
  rows: [
    '................',
    '................',
    '................',
    '................',
    '................',
    '.....oooooo.....',
    '...ooPPPPPPoo...',
    '..oPkPPwwPPkPo..',
    'rroPkPwwwwPkPorr',
    '..oPkPPwwPPkPo..',
    '...ooPPPPPPoo...',
    '.....oooooo.....',
    '................',
    '................',
    '................',
    '................',
  ],
};

const BAT_BEAD: SpriteSource = {
  rows: [
    '................',
    '................',
    '................',
    '................',
    '....o......o....',
    '....oo....oo....',
    '....oboooobo....',
    '...obbbbbbbbo...',
    'rrrobebbbbeborrr',
    '...obbbbbbbbo...',
    '...obbbbbbbbo...',
    '....obbbbbbo....',
    '.....oooooo.....',
    '................',
    '................',
    '................',
  ],
};

const GHOST_BEAD: SpriteSource = {
  rows: [
    '................',
    '................',
    '................',
    '................',
    '.....oooooo.....',
    '....oggggggo....',
    '...oggggggggo...',
    '...ogkggggkgo...',
    'rrroggggggggorrr',
    '...oggggggggo...',
    '...oggggggggo...',
    '...oggoggoggo...',
    '...ogo.oo.ogo...',
    '................',
    '................',
    '................',
  ],
};

/** A house drawn on blue paper: an extension to her home, before it is built. */
export const BLUEPRINT: SpriteSource = {
  rows: [
    '................',
    '.oooooooooooooo.',
    '.obbbbbbbbbbbbo.',
    '.obbbbbwwbbbbbo.',
    '.obbbbwbbwbbbbo.',
    '.obbbwbbbbwbbbo.',
    '.obbwbbbbbbwbbo.',
    '.obbwwwwwwwwbbo.',
    '.obbwbbbbbbwbbo.',
    '.obbwbwwbbbwbbo.',
    '.obbwbwwbwbwbbo.',
    '.obbwbbbbwbwbbo.',
    '.obbwwwwwwwwbbo.',
    '.obbbbbbbbbbbbo.',
    '.oooooooooooooo.',
    '................',
  ],
};

const BRACELET_TWO: SpriteSource = {
  rows: [
    '................',
    '................',
    '................',
    '.....oooooo.....',
    '...oooobaoooo...',
    '..oobbbbaabboo..',
    '.oobbo....obboo.',
    'ooabo......obboo',
    'ooao........oboo',
    'oobo........oaoo',
    'oobbo......obaoo',
    '.oobbo....obboo.',
    '..oobbaabbbboo..',
    '...ooooaboooo...',
    '.....oooooo.....',
    '................',
  ],
};

const BRACELET_FOUR: SpriteSource = {
  rows: [
    '................',
    '................',
    '................',
    '.....oooooo.....',
    '...oooobcoooo...',
    '..oobbbbccccoo..',
    '.ooaao....oddoo.',
    'ooaao......oddoo',
    'ooao........odoo',
    'oodo........oaoo',
    'ooddo......oaaoo',
    '.ooddo....oaaoo.',
    '..ooccccbbbboo..',
    '...oooocboooo...',
    '.....oooooo.....',
    '................',
  ],
};

const BRACELET_THREE: SpriteSource = {
  rows: [
    '................',
    '................',
    '................',
    '.....oooooo.....',
    '...ooooaaoooo...',
    '..oobbaaaabboo..',
    '.ooaao....oaaoo.',
    'ooaao......oaaoo',
    'ooao........oaoo',
    'oobo........oboo',
    'oobao......ocboo',
    '.ooaao....occoo.',
    '..ooaabbaaaaoo..',
    '...oooobaoooo...',
    '.....oooooo.....',
    '................',
  ],
};

const STRING = { '.': null, o: C.ink, r: C.rope } as const;

function footballBead(ball: string, stripe: string): ItemArt {
  return { source: FOOTBALL_BEAD, palette: { ...STRING, P: ball, k: stripe, w: C.white } };
}

function bracelet(source: SpriteSource, ...beads: string[]): ItemArt {
  const keys = Object.fromEntries(beads.map((colour, i) => ['abcd'[i]!, colour]));
  return { source, palette: { '.': null, o: C.ink, ...keys } };
}

export const BLUEPRINT_PALETTE: Palette = { '.': null, o: C.navy, b: C.blueFabric, w: C.white };

/** Her first-date ice skate: a white boot laced in pink, on a silver blade. */
/** A red toadstool with white spots, on a cream stem. */
const TOADSTOOL: SpriteSource = {
  rows: [
    '................',
    '................',
    '.....oooooo.....',
    '...ooRRWRRRoo...',
    '..oRRRRRRWRRro..',
    '..oRWRRRRRRRro..',
    '.oRRRRRWRRRRrro.',
    '.orrrrrrrrrrrro.',
    '..oooocccooooo..',
    '......occco.....',
    '......oCcco.....',
    '......oCcco.....',
    '.....oCcccco....',
    '.....ooooooo....',
    '................',
    '................',
  ],
};

/** A spray of milkweed: soft pink clusters on a green stem. */
const MILKWEED: SpriteSource = {
  rows: [
    '................',
    '....ooo..ooo....',
    '...oPpPooPpPo...',
    '...opPpoopPpo...',
    '....ooPooPoo....',
    '......ogoo......',
    '..ooo..og..ooo..',
    '.oPpPo.og.oPpPo.',
    '.opPpoogggopPpo.',
    '..ooPo.og.oPoo..',
    '.......og.......',
    '.....ooog.......',
    '....oggooog.....',
    '.......og.......',
    '.......oo.......',
    '................',
  ],
};

/** An old iron key with a butterfly for its bow. */
const CASTLE_KEY: SpriteSource = {
  rows: [
    '................',
    '..ooo...ooo.....',
    '.oMMMo.oMMMo....',
    '.oMkMMoMMkMo....',
    '.oMMMMkMMMMo....',
    '..oMMokoMMo.....',
    '..oMoiiioMo.....',
    '...o.oio.o......',
    '......oio.......',
    '......oio.......',
    '......oio.......',
    '......oiooo.....',
    '......oiiIo.....',
    '......oiooo.....',
    '......oiiIo.....',
    '.......ooo......',
  ],
};

const ICE_SKATE: SpriteSource = {
  rows: [
    '................',
    '................',
    '...oooo.........',
    '...oWWWo........',
    '...oWPWo........',
    '...oWWWo........',
    '...oWPWo........',
    '...oWWWWooo.....',
    '...oWWWWWWWo....',
    '...owwwwwwwwo...',
    '....oooooooo....',
    '.....o....o.....',
    '..oSSSSSSSSSSo..',
    '...oooooooooo...',
    '................',
    '................',
  ],
};

/** Her sprinkler (phase P): a brass head with bat ears on an iron stake, spraying. */
const SPRINKLER_ICON: SpriteSource = {
  rows: [
    '................',
    '.w............w.',
    '..w..o....o..w..',
    '.w..oGo..oGo..w.',
    '....oGGooGGo....',
    '...oGGGGGGGGo...',
    '..oGGkGGGGkGGo..',
    '..oGGGGGGGGGGo..',
    '...oggggggggo...',
    '....oooooooo....',
    '.......oIo......',
    '.......oIo......',
    '.......oIo......',
    '......oIIIo.....',
    '.......oIo......',
    '........o.......',
  ],
};

/**
 * A steaming bowl (phase R): `f` what's in it, `F` its shine, `x` bits in it, `b`/`B` the bowl, `s`
 * steam curling up in three wisps, each paler at its tip (`S`, 0.2's K2).
 */
const BOWL_DISH: SpriteSource = {
  rows: [
    '........S.......',
    '.....S...s......',
    '....s....s..S...',
    '....s...s...s...',
    '.....s..s..s....',
    '..oooooooooooo..',
    '.offfFffxfffFfo.',
    '.oxffffxffffxffo',
    '.oooooooooooooo.',
    '..obBbbbbbbbbo..',
    '..obbbbbbbbbbo..',
    '...obbbbbbbbo...',
    '....oooooooo....',
    '................',
    '................',
    '................',
  ],
};

/** A layer cake on a plate, a glowing petal on top: `i` icing, `l` sponge, `c` cream, `p` the petal, `d` the plate. */
const CAKE_DISH: SpriteSource = {
  rows: [
    '................',
    '................',
    '.......pp.......',
    '......pPPp......',
    '...oooooooooo...',
    '..oiiiiiiiiiio..',
    '..oiIiiiiiiIio..',
    '..ollllllllllo..',
    '..occcccccccco..',
    '..ollllllllllo..',
    '..oLllllllllLo..',
    '.oooooooooooooo.',
    '.oddddddddddddo.',
    '..oooooooooooo..',
    '................',
    '................',
  ],
};

/** Midnight snackies on a plate: a slice of pizza, a bat-wing cookie and a mallow. `d` the plate. */
const PLATE_DISH: SpriteSource = {
  rows: [
    '................',
    '................',
    '................',
    '................',
    '.......oo.......',
    '......oyyo......',
    '.....oyryyo.....',
    '..oo.oyyryo.oo..',
    '.occooyyyyooMmo.',
    '.oCcco.oo..omMo.',
    '.occo.......oo..',
    'oddddddddddddddo',
    '.oDddddddddddDo.',
    '..oooooooooooo..',
    '................',
    '................',
  ],
};

/**
 * A pie in its tin, a bat cut out of its crust, ears, wings and all (0.2's K2): `c` crust, `p`
 * filling, `k` the bat, `t` the tin.
 */
const PIE_DISH: SpriteSource = {
  rows: [
    '................',
    '................',
    '.....oooooo.....',
    '...oocccccccoo..',
    '..ocpppppppppco.',
    '.ocpkppkpkppkpco',
    '.ocpkkpkkkpkkpco',
    '.occpkkkkkkkpcco',
    '.ocppppkpkppppco',
    '.oocccccccccccoo',
    '.otttttttttttto.',
    '..otTttttttTto..',
    '...oooooooooo...',
    '................',
    '................',
    '................',
  ],
};

/** A jar of jam under a gingham lid, a rose petal in it: `g`/`G` the lid, `j` the jam, `w` the glass's shine. */
const JAR_DISH: SpriteSource = {
  rows: [
    '................',
    '................',
    '.....gGgGgg.....',
    '....gGgGgGgg....',
    '.....oooooo.....',
    '....owjjjjjo....',
    '...owjjjjjjjo...',
    '...owjjrrjjjo...',
    '...ojjrRrjjjo...',
    '...ojjjrjjjjo...',
    '...oJjjjjjjJo...',
    '....ojjjjjjo....',
    '.....oooooo.....',
    '................',
    '................',
    '................',
  ],
};

/** A teacup on its saucer, steaming: `t` the tea, `c` the cup, `d` the saucer, `s` steam. */
const CUP_DISH: SpriteSource = {
  rows: [
    '.......S........',
    '......s...S.....',
    '......s..s......',
    '.......s.s......',
    '................',
    '...oooooooooo...',
    '...otTttttttoo..',
    '...occcccccco.o.',
    '...occcccccco.o.',
    '....occccccooo..',
    '.....oooooo.....',
    '..oddddddddddo..',
    '...oooooooooo...',
    '................',
    '................',
    '................',
  ],
};

// ---- The holidays (phase U) ----------------------------------------------------------------

/** A chocolate egg in bright foil, a band round its middle. */
const FOIL_EGG: SpriteSource = {
  rows: [
    '................',
    '................',
    '......oooo......',
    '.....oFFffo.....',
    '....oFFffffo....',
    '....oFffffko....',
    '...oFffffffko...',
    '...oBBBBBBBBo...',
    '...obbbbbbbbo...',
    '...oFffffffko...',
    '...offffffkko...',
    '....offfffko....',
    '....okkkkkko....',
    '.....oooooo.....',
    '................',
    '................',
  ],
};

/** A heart of chocolate in pink foil, with a little nibble out of its corner. */
const FOIL_HEART: SpriteSource = {
  rows: [
    '................',
    '................',
    '................',
    '..ooo....oooo...',
    '.oFFfo..oFFfo...',
    'oFFfffooFffffo..',
    'oFfffffffffffo..',
    'oFfffffffffffko.',
    '.offfffffffffko.',
    '.offfffffffkko..',
    '..offfffffkko...',
    '...offfffkko....',
    '....offfkko.....',
    '.....offko......',
    '......oo........',
    '................',
  ],
};

/** A three-leaf clover on its stalk. */
const SHAMROCK: SpriteSource = {
  rows: [
    '................',
    '................',
    '.....oo..oo.....',
    '....oLLooLLo....',
    '....oLgLLgLo....',
    '.....oLggLo.....',
    '..oooooggooooo..',
    '.oLLLggggggLLLo.',
    '.oLgggggggggggo.',
    '..oggggooggggo..',
    '...oooo.soooo...',
    '.........s......',
    '.........s......',
    '........s.......',
    '.......s........',
    '................',
  ],
};

/** An ice pop in three stripes on its stick, one drip escaping. */
const ICE_POP: SpriteSource = {
  rows: [
    '................',
    '.....oooooo.....',
    '....oRRRRrro....',
    '....oRRRRrro....',
    '....oRRRRrro....',
    '....oWWWWwwo....',
    '....oWWWWwwo....',
    '....oWWWWwwo....',
    '....oBBBBbbo....',
    '....oBBBBbbo....',
    '....oBBBBbbo....',
    '.....oobBoo.....',
    '.......oso..b...',
    '.......oso......',
    '.......oso......',
    '........o.......',
  ],
};

/** A gingerbread bat, wings out, with white icing eyes and fangs. */
const GINGER_BAT: SpriteSource = {
  rows: [
    '................',
    '................',
    '................',
    '.....o......o...',
    '....ogo....ogo..',
    'o..oggooooooggo.',
    'oo.ogggggggggo.o',
    'ogooggWggWggoogo',
    'oggggggggggggggo',
    '.ogggggWWggggggo',
    '..ogggWggWgggo..',
    '...oggggggggo...',
    '....ooggggoo....',
    '......oooo......',
    '................',
    '................',
  ],
};

/** A gummy cluster: a soft lumpy heart rolled in rainbow sprinkles. */
const GUMMY_CLUSTER: SpriteSource = {
  rows: [
    '................',
    '................',
    '................',
    '...ooo...ooo....',
    '..oGGgo.oGagoo..',
    '.oGaGggoGgggbgo.',
    '.oGggcggggdgggo.',
    '.ogbgggggggcggo.',
    '.ogggegggaggggo.',
    '..ogggggbgggeo..',
    '..ogdggggggggo..',
    '...ogggcgggko...',
    '....oggggkko....',
    '.....ogkko......',
    '......ooo.......',
    '................',
  ],
};

/** A little box of chewy dots, its flap open, gumdrops showing. */
const DOTS_BOX: SpriteSource = {
  rows: [
    '................',
    '................',
    '.....oooooo.....',
    '....oWWWWWwo....',
    '...ooooooooo....',
    '...oaobocoeo....',
    '...ooooooooo....',
    '...oWWWWWWwo....',
    '...oWaWWbWwo....',
    '...oWWWWWWwo....',
    '...oWcWWeWwo....',
    '...oWWWWWWwo....',
    '...oWbWWaWwo....',
    '...oWWWWWWwo....',
    '...ooooooooo....',
    '................',
  ],
};

/** A little bag of sour ghouls, two peeking out of the top. */
const SOUR_BAG: SpriteSource = {
  rows: [
    '................',
    '.....oo..oo.....',
    '....oGGooaao....',
    '....oGeGoaeo....',
    '...ooGGGoaaoo...',
    '...oPPPPPPPpo...',
    '...opPPPPPPpo...',
    '...oPPPPPPPpo...',
    '...oPPoooPPpo...',
    '...oPoGGGoPpo...',
    '...oPoGeGoPpo...',
    '...oPoGGGoPpo...',
    '...oPPoooPPpo...',
    '...oPPPPPPPpo...',
    '...ooooooooo....',
    '................',
  ],
};

/** A little brass key with a heart for its bow. */
const HEART_KEY: SpriteSource = {
  rows: [
    '................',
    '..oo...oo.......',
    '.oHHo.oHHo......',
    'oHhHHoHHHHo.....',
    'oHHHHHHHHko.....',
    '.oHHHHHHko......',
    '..oHHHHko.......',
    '...oHHko........',
    '....oio.........',
    '....oio.........',
    '....oio.........',
    '....oiooo.......',
    '....oiiIo.......',
    '....oiooo.......',
    '....oiiIo.......',
    '.....ooo........',
  ],
};

/*
 * More to plant (0.2's N2): what the new crops give, and the dishes made from them.
 */

const TOMATO: SpriteSource = {
  rows: [
    '................',
    '.......s........',
    '.....s.s.s......',
    '......sss.......',
    '....oooooooo....',
    '...orrRRrrrro...',
    '..orRhRrrrrrro..',
    '..orRRrrrrrrro..',
    '..orRrrrrrrrro..',
    '..orrrrrrrrrdo..',
    '..orrrrrrrrrdo..',
    '...orrrrrrrddo..',
    '....odddddddo...',
    '.....oooooooo...',
    '................',
    '................',
  ],
};

const GARLIC: SpriteSource = {
  rows: [
    '.......ss.......',
    '.......ss.......',
    '......owwo......',
    '......owwo......',
    '.....owwwwo.....',
    '....owhwWwwo....',
    '...owhwwWwwwo...',
    '..owhwwwWwwwWo..',
    '..owwwwwWwwwWo..',
    '..owwWwwWwwwWo..',
    '..owwWwwwWwwWo..',
    '...owWwwwWwWo...',
    '....oWWWWWWo....',
    '.....oooooo.....',
    '.....r.r.r......',
    '................',
  ],
};

const BASIL: SpriteSource = {
  rows: [
    '................',
    '.......oo.......',
    '......oBbo......',
    '...oo.oBbo.oo...',
    '..oBbooBbooBbo..',
    '..oBbbobbobbbo..',
    '...obbbsbbbbo...',
    '....oobsbboo....',
    '..oooBbsboooo...',
    '.oBbbbbsbbbbbo..',
    '.oBbbbbsbbbbdo..',
    '..obbbbsbbbdo...',
    '...ooodsdooo....',
    '.......s........',
    '.......s........',
    '................',
  ],
};

/** An avocado cut in half, its stone in the middle. */
const AVOCADO: SpriteSource = {
  rows: [
    '................',
    '.......ooo......',
    '......oaaao.....',
    '.....oaggGao....',
    '.....oagGGao....',
    '....oagggGGao...',
    '....oaggggGao...',
    '...oagggggggao..',
    '...oaggpppggao..',
    '..oaggpPpppggao.',
    '..oaggpppppggao.',
    '..oagggpppgggao.',
    '...oagggggggao..',
    '....oaaaaaaao...',
    '.....ooooooo....',
    '................',
  ],
};

/** A little bottle gourd, glowing: `G` its shine, `h` the brightest. */
const GLOW_GOURD: SpriteSource = {
  rows: [
    '.......ss.......',
    '........s.......',
    '......oooo......',
    '.....ohGgo......',
    '.....oGggo......',
    '......oggo......',
    '.....oGggo......',
    '....oGgggggo....',
    '...ohGggggggo...',
    '...oGgggggggo...',
    '...oggggggggo...',
    '...oggggggqgo...',
    '....oggggqqo....',
    '.....oooooo.....',
    '................',
    '................',
  ],
};

const TULIP: SpriteSource = {
  rows: [
    '................',
    '.....o.oo.o.....',
    '....oto.otto....',
    '....otTotTto....',
    '....oTtttTto....',
    '....oTttttto....',
    '....otttttto....',
    '.....otttto.....',
    '......oooo......',
    '.......s........',
    '....ooss........',
    '...oLls.........',
    '....ols.........',
    '.......s........',
    '.......s........',
    '................',
  ],
};

const IRIS: SpriteSource = {
  rows: [
    '................',
    '.......oo.......',
    '......obBo......',
    '......obBo......',
    '..oo..obbo..oo..',
    '.obBo.obbo.oBbo.',
    '.obbBoobboobbbo.',
    '..obbbbybbbbbo..',
    '...obbbybbbbo...',
    '....oobybboo....',
    '......oooo......',
    '.......s........',
    '.......s........',
    '.......s........',
    '.......s........',
    '................',
  ],
};

/** Spaghetti on a plate, twirled, with tomato sauce and a basil leaf. */
const SPAGHETTI: SpriteSource = {
  rows: [
    '................',
    '................',
    '................',
    '.....oooooo.....',
    '...ooyYyyYyoo...',
    '..oyYyrrryyYyo..',
    '..oyyrrRrrryyo..',
    '..oyYrrrrgryYo..',
    '..oyyyrrrryyyo..',
    '.ooyYyyyyyyYyoo.',
    'oddooooooooooddo',
    'oddddddddddddddo',
    '.oDddddddddddDo.',
    '..oooooooooooo..',
    '................',
    '................',
  ],
};

/** A bowl of guacamole with corn chips stood up in it. */
const GUAC: SpriteSource = {
  rows: [
    '................',
    '....o.....o.....',
    '...oco...oCo....',
    '...occo.occo.o..',
    '..occco.oCcooco.',
    '.oooooooooooooo.',
    '.oggGgggrgggGgo.',
    '.ogrggGggggwggo.',
    '.oooooooooooooo.',
    '..obBbbbbbbbbo..',
    '..obbbbbbbbbbo..',
    '...obbbbbbbbo...',
    '....oooooooo....',
    '................',
    '................',
    '................',
  ],
};

/** A slice of the roast glow gourd on a plate, still glowing a little. */
const ROAST_GOURD: SpriteSource = {
  rows: [
    '................',
    '................',
    '................',
    '......oooo......',
    '.....oGhGgo.....',
    '....oGggggro....',
    '...oGgggggrgo...',
    '...ogggrrgggo...',
    '...oggggggggo...',
    '....orggggro....',
    '.ooooooooooooo..',
    'oddddddddddddddo',
    '.oDddddddddddDo.',
    '..oooooooooooo..',
    '................',
    '................',
  ],
};

/** Three pieces of shortbread, lavender flecked through them. */
const SHORTBREAD: SpriteSource = {
  rows: [
    '................',
    '................',
    '................',
    '....oooo........',
    '...occCco.......',
    '...ocvccoooo....',
    '...occccoCcco...',
    '...ocCvcocvcco..',
    '....oooooccvco..',
    '..oooooooccCco..',
    '.occCccvcoooo...',
    '.ocvccccCco.....',
    '.occccvccco.....',
    '..oooooooo......',
    '................',
    '................',
  ],
};

/** A bowl's colours: what's in it, its shine, the bits in it, and the bowl. */
function bowl(food: string, shine: string, bits: string, dish: string, dishLight: string): Palette {
  return {
    '.': null,
    o: C.ink,
    f: food,
    F: shine,
    x: bits,
    b: dish,
    B: dishLight,
    s: C.ghost,
    S: C.white,
  };
}

export const ITEM_ART: Record<ItemId, ItemArt> = {
  ...DOLL_ART,
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
  whiteChickenChili: {
    source: CHILI_BOWL,
    palette: {
      '.': null,
      o: C.pumpkinDark,
      k: C.cream,
      g: C.leaf,
      r: C.scarlet,
      l: C.stone,
      w: C.pumpkinLight,
      b: C.pumpkin,
    },
  },
  popcorn: {
    source: POPCORN,
    palette: {
      '.': null,
      o: C.berry,
      r: C.scarlet,
      w: C.white,
      c: C.cream,
      C: C.candle,
    },
  },
  patchPumpkin: {
    source: PATCH_PUMPKIN,
    palette: {
      '.': null,
      o: C.pumpkinDark,
      p: C.pumpkin,
      P: C.pumpkinLight,
      s: C.leafDark,
      L: C.leaf,
      l: C.leafDark,
      b: C.sky,
      B: C.gold,
      r: C.sky,
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
  tomato: {
    source: TOMATO,
    palette: {
      '.': null,
      o: ramp(C.scarlet)[0],
      r: C.scarlet,
      R: ramp(C.scarlet)[3],
      h: ramp(C.scarlet)[4],
      d: C.scarletShade,
      s: C.leafDark,
    },
  },
  garlic: {
    source: GARLIC,
    palette: {
      '.': null,
      o: ramp(C.creamShade)[0],
      w: C.cream,
      W: C.creamShade,
      h: C.white,
      s: C.leafDark,
      r: C.bark,
    },
  },
  basil: {
    source: BASIL,
    palette: {
      '.': null,
      o: C.leafDark,
      b: C.mossLight,
      B: ramp(C.mossLight)[4],
      d: C.moss,
      s: C.moss,
    },
  },
  avocado: {
    source: AVOCADO,
    palette: {
      '.': null,
      o: C.ink,
      a: C.mossDark,
      g: C.guac,
      G: ramp(C.guac)[4],
      p: C.bark,
      P: C.wood,
    },
  },
  sweetcorn: {
    source: CANDY_CORN,
    palette: { '.': null, o: C.ink, w: C.wood, p: C.gold, y: C.candle, ...LEAVES },
  },
  glowGourd: {
    source: GLOW_GOURD,
    palette: {
      '.': null,
      o: C.orbGreenDark,
      g: C.orbGreen,
      G: C.orbGreenLight,
      h: C.ghost,
      q: ramp(C.orbGreen)[1],
      s: C.bark,
    },
  },
  sunflower: {
    source: FLOWER,
    palette: { '.': null, o: C.ink, f: C.gold, F: C.barkDark, c: C.bark, e: C.mossLight },
  },
  blackTulip: {
    source: TULIP,
    palette: { '.': null, o: C.ink, t: ramp(C.plum)[1], T: C.plum, ...LEAVES },
  },
  lavender: {
    source: SNAPDRAGON,
    palette: { '.': null, o: C.ink, p: C.lavenderShade, P: C.lavender, ...LEAVES },
  },
  marigold: flower(C.monarch, C.pumpkinDark),
  christmasRose: {
    source: FLOWER,
    palette: { '.': null, o: C.ink, f: C.white, F: C.roseLight, c: C.gold, e: C.mossLight },
  },
  iris: {
    source: IRIS,
    palette: { '.': null, o: C.ink, b: C.blueFabric, B: C.sky, y: C.gold, s: C.leafDark },
  },
  tomatoSeed: packet(C.moss, C.scarlet, ramp(C.scarlet)[3]),
  garlicClove: packet(C.plum, C.cream, C.white),
  basilSeed: packet(C.teal, C.mossLight, C.leafLight),
  avocadoPit: packet(C.bark, C.guac, C.bark),
  sweetcornSeed: packet(C.moss, C.gold, C.candle),
  glowGourdSeed: packet(C.navy, C.orbGreen, C.orbGreenLight),
  sunflowerSeed: packet(C.teal, C.gold, C.barkDark),
  tulipBulb: packet(C.lavender, ramp(C.plum)[1], C.plum),
  lavenderSeed: packet(C.moss, C.lavender, C.lavenderShade),
  marigoldSeed: packet(C.plum, C.monarch, C.gold),
  christmasRoseSeed: packet(C.navy, C.white, C.roseLight),
  irisBulb: packet(C.ink, C.blueFabric, C.sky),
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
  recordWalkTheTomb: record(C.sky, C.skyShade, C.candleBright, TOMB, { x: C.silver }),
  recordBoonlightSonata: record(C.navy, C.navyShade, C.ghost, QUAVER, { x: C.candleBright }),
  burritoBowl: {
    source: BURRITO_BOWL,
    palette: {
      '.': null,
      o: C.ink,
      b: C.teal,
      B: C.tealLight,
      w: C.white,
      g: C.guac,
      G: C.leafDark,
      r: C.bark,
    },
  },
  moonPie: {
    source: MOON_PIE,
    palette: {
      '.': null,
      o: C.ink,
      c: C.bark,
      C: C.wood,
      p: C.roseLight,
      y: C.candle,
      g: C.leafLight,
    },
  },
  moonPieMini: {
    source: PAPER_BAG,
    palette: { '.': null, o: C.ink, b: C.rope, B: C.wood, y: C.candleBright },
  },
  heartBead: { source: HEART_BEAD, palette: { ...STRING, R: C.roseLight, W: C.white } },
  loveBeads: { source: LOVE_BEADS, palette: { ...STRING, k: C.rose, w: C.white } },
  smileyBead: {
    source: SMILEY_BEAD,
    palette: { ...STRING, y: C.gold, Y: C.candleBright, k: C.ink },
  },
  tigerFootballBead: footballBead(C.pumpkin, C.ink),
  scarletFootballBead: footballBead(C.scarlet, C.silver),
  batBead: { source: BAT_BEAD, palette: { ...STRING, b: C.inkFabric, e: C.candle } },
  ghostBead: { source: GHOST_BEAD, palette: { ...STRING, g: C.ghost, k: C.ink } },
  loveBracelet: bracelet(BRACELET_TWO, ...BRACELET_BEADS.loveBracelet),
  smileyBracelet: bracelet(BRACELET_TWO, ...BRACELET_BEADS.smileyBracelet),
  friendshipBracelet: bracelet(BRACELET_FOUR, ...BRACELET_BEADS.friendshipBracelet),
  tigersBracelet: bracelet(BRACELET_THREE, ...BRACELET_BEADS.tigersBracelet),
  scarletBracelet: bracelet(BRACELET_THREE, ...BRACELET_BEADS.scarletBracelet),
  spookyBracelet: bracelet(BRACELET_TWO, ...BRACELET_BEADS.spookyBracelet),
  fibisBone: { source: DOG_BONE, palette: { '.': null, o: C.ink, b: C.bone, s: C.boneShade } },
  broom: broomIconArt(FIRST_BROOM),
  candySapling: {
    source: CANDY_SAPLING_ICON,
    palette: {
      '.': null,
      o: C.ink,
      l: C.teal,
      L: C.tealLight,
      w: C.white,
      y: C.rose,
      p: C.roseLight,
      b: C.soilLight,
      B: C.soilDust,
    },
  },
  iceSkates: {
    source: ICE_SKATE,
    palette: { '.': null, o: C.ink, W: C.white, w: C.silverShade, P: C.roseLight, S: C.silver },
  },
  toadstool: {
    source: TOADSTOOL,
    palette: {
      '.': null,
      o: C.ink,
      R: C.toadstool,
      r: ramp(C.toadstool)[1]!,
      W: C.white,
      c: C.cream,
      C: C.white,
    },
  },
  milkweed: {
    source: MILKWEED,
    palette: { '.': null, o: C.leafDark, P: C.roseLight, p: C.snapLight, g: C.leaf },
  },
  sprinkler: {
    source: SPRINKLER_ICON,
    palette: {
      '.': null,
      o: C.ink,
      G: C.gold,
      g: C.goldShade,
      k: C.ink,
      I: C.iron,
      w: C.waterLight,
    },
  },
  castleKey: {
    source: CASTLE_KEY,
    palette: { '.': null, o: C.ink, M: C.monarch, k: C.ink, i: C.iron, I: C.stoneLight },
  },
  // The holidays (phase U).
  chocolateEgg: {
    source: FOIL_EGG,
    palette: {
      '.': null,
      o: C.ink,
      F: C.snapLight,
      f: C.snap,
      k: C.rose,
      B: C.gold,
      b: C.goldShade,
    },
  },
  chocolateHeart: {
    source: FOIL_HEART,
    palette: { '.': null, o: C.ink, F: C.roseLight, f: C.rose, k: C.berry },
  },
  shamrock: {
    source: SHAMROCK,
    palette: { '.': null, o: C.leafDark, L: C.leafLight, g: C.leaf, s: C.leafDark },
  },
  icePop: {
    source: ICE_POP,
    palette: {
      '.': null,
      o: C.ink,
      R: C.scarlet,
      r: C.scarletShade,
      W: C.white,
      w: C.silver,
      B: C.blueFabric,
      b: C.blueFabricShade,
      s: C.wood,
    },
  },
  gingerbreadBat: {
    source: GINGER_BAT,
    palette: { '.': null, o: C.barkDark, g: C.wood, W: C.white },
  },
  hallKey: {
    source: HEART_KEY,
    palette: {
      '.': null,
      o: C.ink,
      H: C.gold,
      h: C.candleBright,
      k: C.goldShade,
      i: C.goldShade,
      I: C.gold,
    },
  },
  // October's sweets (0.2's J2).
  gummyCluster: {
    source: GUMMY_CLUSTER,
    palette: {
      '.': null,
      o: C.berry,
      G: C.roseLight,
      g: C.rose,
      k: C.berry,
      a: C.sky,
      b: C.gold,
      c: C.lavender,
      d: C.leafLight,
      e: C.white,
    },
  },
  chewyDots: {
    source: DOTS_BOX,
    palette: {
      '.': null,
      o: C.ink,
      W: C.white,
      w: C.silver,
      a: C.scarlet,
      b: C.gold,
      c: C.leafLight,
      e: C.lavender,
    },
  },
  sourGhouls: {
    source: SOUR_BAG,
    palette: {
      '.': null,
      o: C.ink,
      P: C.leafLight,
      p: C.leaf,
      G: C.ghost,
      a: C.pumpkinLight,
      e: C.ink,
    },
  },
  // Phase R's dishes, each in its dish.
  pumpkinSoup: {
    source: BOWL_DISH,
    palette: bowl(C.pumpkin, C.pumpkinLight, C.white, C.plum, C.plumLight),
  },
  fishChowder: {
    source: BOWL_DISH,
    palette: bowl(C.cream, C.white, C.pumpkinLight, C.teal, C.tealLight),
  },
  ghostChili: {
    source: BOWL_DISH,
    palette: bowl(C.scarlet, C.pumpkin, C.white, C.bark, C.wood),
  },
  toadstoolStew: {
    source: BOWL_DISH,
    palette: bowl(C.bark, C.wood, C.toadstool, C.stone, C.stoneLight),
  },
  moonpetalCake: {
    source: CAKE_DISH,
    palette: {
      '.': null,
      o: C.ink,
      i: C.white,
      I: C.ghost,
      l: C.lavender,
      L: C.lavenderShade,
      c: C.cream,
      p: C.lavender,
      P: C.white,
      d: C.silver,
    },
  },
  midnightPlate: {
    source: PLATE_DISH,
    palette: {
      '.': null,
      o: C.ink,
      y: C.candle,
      r: C.rose,
      c: C.bark,
      C: C.wood,
      m: C.white,
      M: C.goldShade,
      d: C.silver,
      D: C.silverShade,
    },
  },
  pumpkinPie: {
    source: PIE_DISH,
    palette: {
      '.': null,
      o: C.ink,
      c: C.wood,
      p: C.pumpkin,
      k: C.ink,
      t: C.silver,
      T: C.white,
    },
  },
  roseJam: {
    source: JAR_DISH,
    palette: {
      '.': null,
      o: C.ink,
      g: C.white,
      G: C.rose,
      j: C.roseLight,
      J: C.rose,
      r: C.rose,
      R: C.scarlet,
      w: C.white,
    },
  },
  moonflowerTea: {
    source: CUP_DISH,
    palette: {
      '.': null,
      o: C.ink,
      s: C.ghost,
      S: C.white,
      t: C.lavender,
      T: C.white,
      c: C.cream,
      d: C.creamShade,
    },
  },
  spaghetti: {
    source: SPAGHETTI,
    palette: {
      '.': null,
      o: C.ink,
      y: C.candle,
      Y: C.gold,
      r: C.scarlet,
      R: ramp(C.scarlet)[3],
      g: C.leaf,
      d: C.white,
      D: C.silver,
    },
  },
  chipsAndGuac: {
    source: GUAC,
    palette: {
      '.': null,
      o: C.ink,
      c: C.gold,
      C: C.candle,
      g: C.guac,
      G: ramp(C.guac)[4],
      r: C.scarlet,
      w: C.white,
      b: C.teal,
      B: C.tealLight,
    },
  },
  roastGourd: {
    source: ROAST_GOURD,
    palette: {
      '.': null,
      o: C.ink,
      g: C.orbGreen,
      G: C.orbGreenLight,
      h: C.ghost,
      r: C.goldShade,
      d: C.white,
      D: C.silver,
    },
  },
  lavenderShortbread: {
    source: SHORTBREAD,
    palette: { '.': null, o: C.bark, c: C.cream, C: C.white, v: C.lavender },
  },
  ...critterItemArt(),
};

/**
 * A critter in her bag is its first frame as she sees it out and about, at 24 (phase M): the HUD
 * draws every icon at the largest whole scale that fits, so it needn't be 16 like the rest.
 */
function critterItemArt(): Record<CritterId, ItemArt> {
  const art = {} as Record<CritterId, ItemArt>;
  for (const [id, c] of Object.entries(CRITTER_ART) as [
    CritterId,
    (typeof CRITTER_ART)[CritterId],
  ][]) {
    art[id] = { source: c.world[0], palette: c.palette };
  }
  return art;
}
