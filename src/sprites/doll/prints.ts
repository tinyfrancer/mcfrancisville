import type { OutfitId } from '../../types/ids';
import type { Worn } from '../../types/look';
import { FABRIC_TONES, type Tone } from '../lookColours';
import { PALETTE as C, ramp } from '../palette';
import type { Palette } from '../sprite';
import type { Grid } from './body';

/*
 * What's on a piece beyond its cut (prints, pendants, patterns, accents), and its colours.
 */

/** What is drawn on a piece beyond its cut: a band tee's print, a pendant, a dress's pattern. */
export interface OutfitArt {
  /** Centred on her chest from the front. */
  print?: Grid;
  /** Centred between her shoulder blades from behind. */
  backPrint?: Grid;
  /** Across the front of a dress's skirt, which is wider than her chest. */
  skirtPrint?: Grid;
  /** Hung from a chain, centred under her chin. */
  pendant?: Grid;
  /** Over the piece's main colour: little flowers, checks, dots, or glitter for shoes. */
  pattern?: 'floral' | 'gingham' | 'dots' | 'glitter' | 'patchwork' | 'stripes' | 'bats' | 'tartan';
  /** Colours of `x` and `y` in the art, when they aren't white and black. */
  accents?: { x?: string; y?: string };
}

const NUMBER_49: Grid = ['x.xxxx', 'x.xx.x', 'xxxxxx', '..x..x', '..xxxx'];

/** A bone, for Bone Jovi. The records are sleeved in the same prints as the tees. */
export const BONE: Grid = ['x....x', '.xxxx.', 'x....x'];

export const OUTFIT_ART: Record<OutfitId, OutfitArt> = {
  // A butterfly, for Dolly's.
  teeGhoulyParton: {
    print: ['xx..xx', 'xxyyxx', '.x..x.'],
    accents: { x: C.candle, y: C.inkFabric },
  },
  // A lightning bolt, a crescent moon and a heart.
  teeLadyGhoulga: { print: ['..xx', '.xx.', 'xx..'], accents: { x: C.candle } },
  teeFleetwoodMacabre: { print: ['.xx.', 'x...', '.xx.'], accents: { x: C.candleBright } },
  teeScreamDion: { print: ['.x..x.', 'xxxxxx', '.xxxx.', '..xx..'], accents: { x: C.rose } },
  cozyTee: {},
  jerseyTigers: { print: NUMBER_49, backPrint: NUMBER_49, accents: { x: C.white, y: C.inkFabric } },
  sundressFloral: { pattern: 'floral' },
  sundressGingham: { pattern: 'gingham' },
  wednesdayDress: {},
  jeans: {},
  cutoffs: {},
  pleatedSkirt: {},
  sneakers: {},
  stompyBoots: {},
  maryJanes: {},
  pumpkinBeanie: { accents: { x: C.mossLight } },
  // A little bat, wings out, and a crescent moon.
  batPendant: { pendant: ['m.m.m', 'mmmmm', '.m.m.'] },
  moonLocket: { pendant: ['.mm', 'm..', 'm..', '.mm'] },
  pearlStrand: {},
  roundGlasses: {},
  catEyeGlasses: {},
  teeBoneJovi: { print: BONE },
  jerseyScarlet: { accents: { y: C.silver } },
  sundressDots: { pattern: 'dots' },
  glitterHeels: { pattern: 'glitter' },
  velvetPumps: {},
  // White soles under a strap, for a bit of height.
  platformMaryJanes: {},
  batBowFlats: { accents: { x: C.inkFabric } },
  rhinestoneBoots: { pattern: 'glitter' },
  kneeHighBoots: {},
  moonbeamSandals: { accents: { x: C.candleBright } },
  witchHat: { accents: { x: C.candle } },
  catEars: { accents: { x: C.roseLight } },
  // A ribcage, down the front.
  skeletonTee: { print: ['..xx..', 'xx..xx', '..xx..', 'xx..xx', '..xx..'] },
  jackOLanternDress: { skirtPrint: ['.yy..yy.', '.yy..yy.', 'y......y', '.yyyyyy.'] },
  // An open book, and a cupcake.
  bookwormTee: { print: ['xx.xx', 'xxyxx', 'xxyxx'] },
  flowerCrown: { accents: { x: C.candle, y: C.leaf } },
  crumbsTee: { print: ['.xx.', 'xxxx', 'yyyy', '.yy.'], accents: { x: C.roseLight, y: C.wood } },
  starryDress: { pattern: 'glitter', accents: { x: C.candleBright } },
  strawSunHat: { accents: { y: C.rose } },
  maroonTee: {},
  manyColoursCoat: { pattern: 'patchwork', accents: { x: C.candle, y: C.roseLight } },
  // An envelope, sealed with a heart; bubbles; a check, like any good flannel; a moon and a star.
  postieTee: {
    print: ['xxxxxxx', 'xyx.xyx', 'x.yyy.x', 'xxxxxxx'],
    accents: { x: C.white, y: C.scarlet },
  },
  bubbleDress: { pattern: 'dots', accents: { x: C.iceLight } },
  flannelShirt: { pattern: 'gingham', accents: { x: C.inkFabric } },
  nightSkyTee: {
    print: ['.xx....', 'x....y.', 'x...yyy', 'x....y.', '.xx....'],
    accents: { x: C.candleBright, y: C.candle },
  }, // The Halloween shelf's costumes (0.2's J2): two pockets, a monarch's white spots and black
  // veins, a ringmaster's gold and black, the mane's inner ears.
  bugCatcherHat: { accents: { x: C.bark } },
  bugCatcherShirt: { print: ['xx..xx', 'xx..xx'], accents: { x: C.creamShade } },
  butterflyAntennae: { accents: { x: C.candle } },
  butterflyWings: { accents: { x: C.white, y: C.inkFabric } },
  ringmasterHat: { accents: { x: C.gold } },
  ringmasterCoat: { accents: { x: C.gold, y: C.inkFabric } },
  lionMane: { accents: { x: C.roseLight } },
  clueTurtleneck: {},
  clueGlasses: {},
  scaredyTee: {},
  // The fuller closet (0.2's W2): white drawstrings, a cream vest and moth-gold buttons, white
  // stripes, brass buttons on the bib, a white bobble and a white frill at the gloves' cuffs.
  cozyHoodie: {},
  comfyShirt: {},
  mothCardigan: { accents: { x: C.cream, y: C.candle } },
  stripyTee: { pattern: 'stripes' },
  leggings: {},
  overalls: { accents: { x: C.candle } },
  skaterSkirt: {},
  joggers: {},
  sweatpants: {},
  rainBoots: {},
  bobbleBeanie: {},
  hairBow: {},
  gardenGloves: {},
  // Cooler clothes to buy (0.2's W3): the record's dancing tombstone in its gold, white lace and
  // laces, little bats, silver studs and zip, brass and gold buttons, sparkle, a control panel's
  // lights, a jewel, and the cape's maroon lining.
  walkTheTombHoodie: { print: ['.xx.', 'xxxx', 'x..x'], accents: { x: C.candleBright } },
  corsetTop: { accents: { x: C.cream } },
  tulleSkirt: {},
  batSkirt: { pattern: 'bats', accents: { x: C.lavender } },
  fishnets: {},
  stripyTights: { pattern: 'stripes', accents: { x: C.cream } },
  motoJacket: { accents: { x: C.silver } },
  denimJacket: { accents: { x: C.candle } },
  velvetDress: {},
  operaCoat: { accents: { x: C.gold } },
  ballGown: { accents: { x: C.candleBright } },
  tiara: { accents: { x: C.roseLight } },
  spaceSuit: { accents: { x: C.scarlet, y: C.inkFabric } },
  spaceHelmet: { accents: { x: C.white } },
  platformBoots: { accents: { x: C.silver, y: C.inkFabric } },
  vampireCape: { accents: { y: C.maroon } },
  batWings: {},
  mummyWraps: {},
  devilHorns: {},
  // A gingham patch on the crown and a scarlet band (0.3's F3).
  scarahHat: { accents: { x: C.rose, y: C.scarlet } },
  mayorHat: { accents: { x: C.gold } },
  // The winter wardrobe (1.4's G2): wooden toggles, cream stripes and fringe, a snowflake on each
  // mitten, a hat's band of snowflakes, white and scarlet hearts and diamonds on the jumper, tartan
  // and its piping, a fluffy gown's lighter belt, the onesie's pale tummy, and pompoms.
  duffelCoat: { accents: { x: C.wood, y: C.barkDark } },
  pufferJacket: { accents: { x: C.silver } },
  longScarf: { pattern: 'stripes', accents: { x: C.cream } },
  mittens: { accents: { x: C.white, y: C.cream } },
  snowflakeHat: { accents: { x: C.white, y: C.scarlet } },
  earmuffs: { accents: { x: C.silver } },
  cableTights: {},
  snowBoots: { accents: { x: C.cream, y: C.inkFabric } },
  fairIsleJumper: { accents: { x: C.white, y: C.scarlet } },
  chunkyCardigan: { accents: { x: C.wood } },
  pyjamaTop: { pattern: 'tartan', accents: { x: C.cream, y: C.inkFabric } },
  pyjamaBottoms: { pattern: 'tartan', accents: { x: C.cream, y: C.inkFabric } },
  dressingGown: { accents: { x: C.white } },
  batOnesie: { accents: { x: C.cream, y: C.white } },
  batHood: { accents: { x: C.roseLight, y: C.white } },
  fluffySlippers: { accents: { x: C.white } },
};

const PATCHES = ['m', 'x', 'y', 'M'] as const;

export function withPattern(rows: string[], pattern: OutfitArt['pattern']): string[] {
  if (!pattern) return rows;
  return rows.map((line, r) =>
    [...line]
      .map((ch, c) => {
        if (ch !== 'm') return ch;
        // Little flowers in staggered rows, like a print on cotton.
        if (pattern === 'floral')
          return r % 3 === 1 && (c + (r % 6 === 1 ? 0 : 2)) % 4 === 1 ? 'x' : ch;
        if (pattern === 'dots')
          return r % 2 === 0 && (c + (r % 4 === 0 ? 0 : 2)) % 4 === 1 ? 'x' : ch;
        // A sparkle here and there, dense enough that even a pair of heels catches one.
        if (pattern === 'glitter') return (r * 5 + c * 3) % 7 === 0 ? 'x' : ch;
        // Squares of three colours and the fabric's shade, like a quilt.
        if (pattern === 'patchwork')
          return PATCHES[(Math.floor(r / 3) + 2 * Math.floor(c / 3)) % 4]!;
        // Bold stripes, a pixel of the accent every other pair of rows.
        if (pattern === 'stripes') return r % 3 === 0 ? 'x' : ch;
        // Little bats, wings up, in staggered rows: a V of three pixels.
        if (pattern === 'bats') {
          const col = (c + (r % 8 < 4 ? 0 : 3)) % 6;
          if (r % 4 === 1) return col === 0 || col === 2 ? 'x' : ch;
          return r % 4 === 2 && col === 1 ? 'x' : ch;
        }
        // A tartan (1.4's G2): bands of shade crossing, darker where they meet, and a fine light
        // line down between every other pair, so piping in its accent still stands out.
        if (pattern === 'tartan') {
          const across = r % 4 === 1;
          const down = c % 4 === 1;
          if (across && down) return 'y';
          if (across || down) return 'M';
          return c % 8 === 3 ? 'L' : ch;
        }
        return ((r >> 1) + (c >> 1)) % 2 === 0 ? 'x' : ch;
      })
      .join(''),
  );
}

/** A finished layer's outline, shade, colour and light, from its colour's ramp. */
function toneKeys(main: string): Record<string, string> {
  const r = ramp(main);
  return { O: r[0], M: r[1], m: main, L: r[3] };
}

/**
 * Everything a piece of clothing's layer can use, from its fabric (or a colour of its own, for a
 * neighbour's clothes) and its accents.
 */
export function wornPalette(worn: Worn, tone: Tone = FABRIC_TONES[worn.fabric]): Palette {
  const accents = OUTFIT_ART[worn.id].accents;
  return {
    '.': null,
    ...toneKeys(tone.main),
    x: accents?.x ?? C.white,
    y: accents?.y ?? C.inkFabric,
  };
}
