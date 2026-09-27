import type { AccessoryStyle } from '../data/pets';
import { ACCESSORIES } from '../data/pets';
import type { Bubble } from '../systems/pets';
import type { AccessoryId, PetId } from '../types/ids';
import { PALETTE as C } from './palette';
import type { Palette, SpriteSource } from './sprite';

/**
 * Their pets (phase 11), drawn side on and facing right, at her scale: the dogs come up to her
 * waist, the cats to her knee, and Gary is a little bigger than a snail has any right to be. Each
 * has two walking frames (the first is standing), a sit facing her, and Florence's nap under her
 * blanket and Elvira's curl.
 *
 * `o` outline, `f` fur, `s` shade, `l` light, `m` markings, `e` eyes, `p` pink (nose, ears,
 * tongue). What they wear is painted over three keys (decisions.md 69): `n` the band round the
 * neck, `k` a bandana's point on the chest (both fur until something is worn), and `q` a collar's
 * spikes or bell (clear until then).
 */
const CAT_SIDE_0: SpriteSource = {
  rows: [
    '................',
    '..........o...o.',
    '.........opo.opo',
    '.........offfffo',
    '.o.......offefpo',
    '.o.......osffffo',
    '..o.oooooonnnno.',
    '...offfsfffkkfo.',
    '...osffffsffkfo.',
    '...ossffffffsso.',
    '...ofo.....ofo..',
    '...ooo.....ooo..',
  ],
};

const CAT_SIDE_1: SpriteSource = {
  rows: [
    '................',
    '..........o...o.',
    '.........opo.opo',
    '.........offfffo',
    '.o.......offefpo',
    '.o.......osffffo',
    '..o.oooooonnnno.',
    '...offfsfffkkfo.',
    '...osffffsffkfo.',
    '...ossffffffsso.',
    '..ofoofo..ofoofo',
    '..oo..oo..oo..oo',
  ],
};

const CAT_SIT: SpriteSource = {
  rows: [
    '.o.....o.',
    'opo...opo',
    'opooooopo',
    'offfffffo',
    'ofefffefo',
    'offfpfffo',
    '.offfffo.',
    '.onnnnno.',
    '.ofkkkfo.',
    'offfkfffo',
    'offfffffo',
    'osfffffso',
    '.oo.o.oo.',
  ],
};

const FLORENCE_ASLEEP: SpriteSource = {
  rows: [
    '................',
    '................',
    '..........o...o.',
    '...ooooooopo.opo',
    '..obcbbcbofffffo',
    '.obbcbbcbofsfsfo',
    'obbbcbbcboffpffo',
    'obbbcbbcbbcbbbbo',
    'oBbbcbbcbbcbbbBo',
    'oBBBBBBBBBBBBBBo',
    '.oooooooooooooo.',
  ],
};

const SHEPHERD_SIDE_0: SpriteSource = {
  rows: [
    '.............o...o..',
    '............olo.olo.',
    '............offfffo.',
    '...........offfefffo',
    '...........ofsfffffo',
    '..........onnfoooopo',
    '...oooooooqnnffo....',
    '..oflffffflfkkffo...',
    '.offlfffffffkkfffo..',
    '.oflfffffffffkfffo..',
    'oflosfffffffffsfo...',
    'ofo.osffooooofsso...',
    'oo..ofso.....ofso...',
    '....ofo......ofo....',
    '....ooo......ooo....',
  ],
};

const SHEPHERD_SIDE_1: SpriteSource = {
  rows: [
    '.............o...o..',
    '............olo.olo.',
    '............offfffo.',
    '...........offfefffo',
    '...........ofsfffffo',
    '..........onnfoooopo',
    '...oooooooqnnffo....',
    '..oflffffflfkkffo...',
    '.offlfffffffkkfffo..',
    '.oflfffffffffkfffo..',
    'oflosfffffffffsfo...',
    'ofo.osffooooofsso...',
    'oo.ofsoso...ofsofo..',
    '...ofo.ofo..ofo.ofo.',
    '...ooo.ooo..ooo.ooo.',
  ],
};

const SHEPHERD_SIT: SpriteSource = {
  rows: [
    '..o.....o..',
    '.olo...olo.',
    '.offoooffo.',
    '.offfffffo.',
    'ofefffffefo',
    'offflllfffo',
    '.offfsfffo.',
    '..ofopofo..',
    '.oqnnnnnqo.',
    '.oflkkklfo.',
    'offfkkkfffo',
    'offffkffffo',
    'oflfffffflo',
    'osfffffffso',
    '.ooo.o.ooo.',
  ],
};

const POODLE_SIDE_0: SpriteSource = {
  rows: [
    '...........oooo...',
    '..........ollflo..',
    '..........offlffo.',
    '.ooo.....oolfffeo.',
    'olflo...ollofffffo',
    'olllo...olfloffffo',
    '.ofo....olllonnoo.',
    '..oo.oooooolonnnfo',
    '...ofllfllflfkkkfo',
    '...offlfflffffkffo',
    '...ossfffffffsffo.',
    '....osoooooooosfo.',
    '....ofo......ofo..',
    '....ofo......ofo..',
    '...olllo....olllo.',
    '...ooooo....ooooo.',
  ],
};

const POODLE_SIDE_1: SpriteSource = {
  rows: [
    '...........oooo...',
    '..........ollflo..',
    '..........offlffo.',
    '.ooo.....oolfffeo.',
    'olflo...ollofffffo',
    'olllo...olfloffffo',
    '.ofo....olllonnoo.',
    '..oo.oooooolonnnfo',
    '...ofllfllflfkkkfo',
    '...offlfflffffkffo',
    '...ossfffffffsffo.',
    '....osoooooooosfo.',
    '...ofoofo...ofoofo',
    '...ofoofo...ofoofo',
    '..ollllo...ollllo.',
    '..oooooo...oooooo.',
  ],
};

const POODLE_SIT: SpriteSource = {
  rows: [
    '....ooooo....',
    '...olllllo...',
    '..ollfllflo..',
    '..offfffffo..',
    '.oloefffeolo.',
    'olllfffffollo',
    'olllffoffollo',
    'ollloopooolo.',
    '.ooqnnnnnqoo.',
    '..ofkkkkkfo..',
    '..offkkkffo..',
    '.offffkffffo.',
    '.ofllfffllfo.',
    'olllo.o.olllo',
    'ooooo.o.ooooo',
  ],
};

const SNAIL_0: SpriteSource = {
  rows: [
    '.........e.e',
    '.........o.o',
    '...oooo..o.o',
    '..occCCo.ofo',
    '.occCccCoofo',
    '.ocCcCcCcnfo',
    '.ocCcccCcnfo',
    'ooocCCCcoffo',
    'osfooooosffo',
    'ossffffffffo',
    '.oooooooooo.',
  ],
};

const SNAIL_1: SpriteSource = {
  rows: [
    '............',
    '.........e.e',
    '...oooo..o.o',
    '..occCCo.ofo',
    '.occCccCoofo',
    '.ocCcCcCcnfo',
    '.ocCcccCcnfo',
    'ooocCCCcoffo',
    'osfooooosffo',
    'ossfffffffff',
    '.oooooooooo.',
  ],
};

const BAMBINO_SIDE_0: SpriteSource = {
  rows: [
    '................',
    '..........o...o.',
    '.........opo.opo',
    '.........offfffo',
    '.o.......offefpo',
    '.o.......osffffo',
    '..o.oooooonnnno.',
    '...ommmsfffkkfo.',
    '...osmmffsffkfo.',
    '...ossfmmfffsso.',
    '...ooo.....ooo..',
  ],
};

const BAMBINO_SIDE_1: SpriteSource = {
  rows: [
    '................',
    '..........o...o.',
    '.........opo.opo',
    '.........offfffo',
    '.o.......offefpo',
    '.o.......osffffo',
    '..o.oooooonnnno.',
    '...ommmsfffkkfo.',
    '...osmmffsffkfo.',
    '...ossfmmfffsso.',
    '..oo.oo...oo.oo.',
  ],
};

const BAMBINO_SIT: SpriteSource = {
  rows: [
    '.o.....o.',
    'opo...opo',
    'opooooopo',
    'ommoooofo',
    'ofefffefo',
    'offfpfffo',
    '.offfffo.',
    '.onnnnno.',
    '.ofkkkfo.',
    'ommfkffmo',
    'ommfffffo',
    'osfffffso',
    '.oo.o.oo.',
  ],
};

const FLUFFY_SIDE_0: SpriteSource = {
  rows: [
    '................',
    '.oo.......o...o.',
    'ommo.....omo.omo',
    'ommo.....ofhfhfo',
    '.omo.....ofhehpo',
    '.omo....offfhffo',
    '..omoooooonnnno.',
    '...ommmmmmfkkfo.',
    '...ommmmmfffkfo.',
    '...offffffffsso.',
    '...ofo.....ofo..',
    '...ooo.....ooo..',
  ],
};

const FLUFFY_SIDE_1: SpriteSource = {
  rows: [
    '................',
    '.oo.......o...o.',
    'ommo.....omo.omo',
    'ommo.....ofhfhfo',
    '.omo.....ofhehpo',
    '.omo....offfhffo',
    '..omoooooonnnno.',
    '...ommmmmmfkkfo.',
    '...ommmmmfffkfo.',
    '...offffffffsso.',
    '..ofoofo..ofoofo',
    '..oo..oo..oo..oo',
  ],
};

const FLUFFY_SIT: SpriteSource = {
  rows: [
    '.o.....o.',
    'omo...omo',
    'ommoooomo',
    'ommmfhfho',
    'ofeffheho',
    'offfpfhfo',
    '.offfffo.',
    '.onnnnno.',
    '.ofkkkfo.',
    'ommfkfmmo',
    'ommfffmmo',
    'ommfffmmo',
    '.oo.o.oo.',
  ],
};

const ELVIRA_CURLED: SpriteSource = {
  rows: [
    '..........o.o.',
    '...oooooooomom',
    '..ommmmmmofffo',
    '.ommmmmmmofhho',
    'ommmmmmmmffpfo',
    'offmmmmmmmfffo',
    'ommmmmmmmmmmmo',
    '.oooooooooooo.',
  ],
};

/** How a pet is drawn: which grid, for what it's doing. */
export type PetFrame = 'side0' | 'side1' | 'sit' | 'rest';

export interface PetArt {
  side: readonly [SpriteSource, SpriteSource];
  sit: SpriteSource;
  /** Florence asleep under her blanket, or Elvira curled up. */
  rest?: SpriteSource;
  palette: Palette;
  /** A ghost pet's soft glow after dark: every key in one pale colour (decisions.md 17). */
  glow?: Palette;
}

const INK = { '.': null, o: C.ink, q: null } as const;

/** A pet's palette, with its neck and chest keys the fur they're drawn over until it's dressed. */
function coat(colours: Record<string, string>): Palette {
  const f = colours.f!;
  return { ...INK, n: f, k: f, ...colours };
}

/** Every key a ghost pet's grids use, lit in one colour. */
function glowing(palette: Palette, colour: string): Palette {
  return Object.fromEntries(
    Object.entries(palette).map(([key, hex]) => [key, hex === null ? null : colour]),
  );
}

const WYBIE = coat({
  f: C.stoneLight,
  s: C.stone,
  l: C.hairSilver,
  m: C.iron,
  p: C.cheek,
  e: C.orbBlue,
});

const ELVIRA = coat({
  f: C.ghost,
  s: C.skinGhostlyShade,
  m: C.iron,
  h: C.iron,
  p: C.cheek,
  e: C.orbGreen,
});

export const PET_ART: Record<PetId, PetArt> = {
  florence: {
    side: [CAT_SIDE_0, CAT_SIDE_1],
    sit: CAT_SIT,
    rest: FLORENCE_ASLEEP,
    // Her blanket is blue, with cream stripes.
    palette: coat({
      f: C.skin,
      s: C.skinShade,
      p: C.roseLight,
      e: C.eyeGreen,
      b: C.blueFabric,
      B: C.blueFabricShade,
      c: C.cream,
    }),
  },
  fibi: {
    side: [SHEPHERD_SIDE_0, SHEPHERD_SIDE_1],
    sit: SHEPHERD_SIT,
    palette: coat({
      f: C.furBlack,
      s: C.furBlackShade,
      l: C.furBlackLight,
      e: C.gold,
      p: C.roseLight,
    }),
  },
  dolly: {
    side: [POODLE_SIDE_0, POODLE_SIDE_1],
    sit: POODLE_SIT,
    palette: coat({ f: C.furBlack, s: C.furBlackShade, l: C.dusk, e: C.gold, p: C.roseLight }),
  },
  gary: {
    side: [SNAIL_0, SNAIL_1],
    sit: SNAIL_0,
    palette: coat({ f: C.skinMintyShade, s: C.skinMinty, c: C.rope, C: C.wood, e: C.ink }),
  },
  wybie: {
    side: [BAMBINO_SIDE_0, BAMBINO_SIDE_1],
    sit: BAMBINO_SIT,
    palette: WYBIE,
    glow: glowing(WYBIE, C.orbBlueLight),
  },
  elvira: {
    side: [FLUFFY_SIDE_0, FLUFFY_SIDE_1],
    sit: FLUFFY_SIT,
    rest: ELVIRA_CURLED,
    palette: ELVIRA,
    glow: glowing(ELVIRA, C.orbGreenLight),
  },
};

/** The grid a pet is drawn from for a frame; one without a rest pose sits instead. */
export function petSource(id: PetId, frame: PetFrame): SpriteSource {
  const art = PET_ART[id];
  if (frame === 'side0') return art.side[0];
  if (frame === 'side1') return art.side[1];
  if (frame === 'rest') return art.rest ?? art.sit;
  return art.sit;
}

/** Each accessory's colour, and its spikes' or bell's. */
export const ACCESSORY_ART: Record<AccessoryId, { colour: string; bits?: string }> = {
  pinkSpikedCollar: { colour: C.roseLight, bits: C.silver },
  plumSpikedCollar: { colour: C.plumLight, bits: C.silver },
  blueBandana: { colour: C.blueFabric },
  scarletBandana: { colour: C.scarlet },
  lavenderBandana: { colour: C.lavender },
  pumpkinBandana: { colour: C.pumpkin },
  mossBandana: { colour: C.mossLight },
  skyBandana: { colour: C.sky },
  ghostBandana: { colour: C.ghost },
  tealCollar: { colour: C.tealLight },
  roseCollar: { colour: C.rose },
  bellCollar: { colour: C.scarlet, bits: C.gold },
};

/** Which keys an accessory of each style paints. */
const PAINTS: Record<AccessoryStyle, readonly ('n' | 'k' | 'q')[]> = {
  collar: ['n'],
  spiked: ['n', 'q'],
  bell: ['n', 'q'],
  bandana: ['n', 'k'],
};

/** A pet's palette, wearing `accessory`. */
export function petPalette(id: PetId, accessory: AccessoryId | null): Palette {
  const palette = PET_ART[id].palette;
  if (!accessory) return palette;
  const { colour, bits } = ACCESSORY_ART[accessory];
  const worn: Record<string, string> = {};
  for (const key of PAINTS[ACCESSORIES[accessory].style]) {
    worn[key] = key === 'q' ? (bits ?? colour) : colour;
  }
  return { ...palette, ...worn };
}

/** A collar, for the shop and the pet sheet: a ring, with its spikes or bell. */
const COLLAR_ICON: SpriteSource = {
  rows: [
    '................',
    '................',
    '................',
    '.....oqoqoqo....',
    '...oonnnnnnnoo..',
    '..onnoooooooonno',
    '.qno........onq.',
    '..no........on..',
    '.qno........onq.',
    '..onnoooooooonn.',
    '...oonnnnnnnoo..',
    '.....ooooqqoo...',
    '.........oqo....',
    '..........o.....',
    '................',
    '................',
  ],
};

/** A bandana, folded to a point with its knot. */
const BANDANA_ICON: SpriteSource = {
  rows: [
    '................',
    '................',
    '................',
    '..o..........o..',
    '.ono........ono.',
    '..onoooooooono..',
    '...onnnnnnnno...',
    '...okkkkkkkko...',
    '....okkkkkko....',
    '....okkwkkko....',
    '.....okkkko.....',
    '......okko......',
    '......okko......',
    '.......oo.......',
    '................',
    '................',
  ],
};

/** An accessory on its own, as the shop and the pet sheet show it. */
export function accessoryIcon(id: AccessoryId): { source: SpriteSource; palette: Palette } {
  const { colour, bits } = ACCESSORY_ART[id];
  const bandana = ACCESSORIES[id].style === 'bandana';
  const shade = colour === C.ghost ? C.silver : C.ink;
  return {
    source: bandana ? BANDANA_ICON : COLLAR_ICON,
    palette: { '.': null, o: shade, n: colour, k: colour, w: C.white, q: bits ?? shade },
  };
}

/** A little bubble above a pet. `w` is the bubble, `o` its edge and `x` what's in it. */
export interface BubbleArt {
  source: SpriteSource;
  palette: Palette;
}

const BUBBLE_EDGE = { '.': null, o: C.ink, w: C.white } as const;

export const BUBBLE_ART: Record<Bubble, BubbleArt> = {
  // Dolly's bark: a spiky bubble with a "!".
  woof: {
    source: {
      rows: [
        '..o...o...',
        '.owo.owo..',
        'owwwowwwoo',
        '.owwxwwwwo',
        'owwwxwwwo.',
        '.owwwwwwwo',
        'owwwxwwwo.',
        '.oowwwoowo',
        '...owo..o.',
        '....o.....',
      ],
    },
    palette: { ...BUBBLE_EDGE, x: C.scarlet },
  },
  heart: {
    source: {
      rows: [
        '.ooooooo.',
        'owwwwwwwo',
        'owxxwxxwo',
        'owxxxxxwo',
        'owwxxxwwo',
        'owwwxwwwo',
        '.oowoooo.',
        '..oo.....',
      ],
    },
    palette: { ...BUBBLE_EDGE, x: C.roseLight },
  },
  whine: {
    source: {
      rows: [
        '.ooooooo.',
        'owwwwwwwo',
        'owxwwwxwo',
        'owwxwxwxo',
        'owwwxwwwo',
        'owwwwwwwo',
        '.oowoooo.',
        '..oo.....',
      ],
    },
    palette: { ...BUBBLE_EDGE, x: C.plumLight },
  },
  dots: {
    source: {
      rows: [
        '.ooooooo.',
        'owwwwwwwo',
        'owwwwwwwo',
        'owxwxwxwo',
        'owwwwwwwo',
        '.oowoooo.',
        '..oo.....',
      ],
    },
    palette: { ...BUBBLE_EDGE, x: C.ink },
  },
  // Florence's Zs, rising from under her blanket: no bubble, just the Zs.
  zzz: {
    source: {
      rows: ['....xxx', '.....x.', '....xxx', 'xxx....', '.x.....', 'xxx....'],
    },
    palette: { '.': null, x: C.ghost },
  },
};
