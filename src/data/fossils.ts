import type { FossilId, ItemId, MapZoneId } from '../types/ids';
import type { Rarity } from './critters';
import type { ItemRow } from './items';

/*
 * Fossils (0.3's C1, decision 250): a mound a day in each place, dug by walking up to it, with a
 * fossil in it most days and now and then a bead or a little Candy. Each fossil is something in
 * her bag, a case in her Curiosity Cabinet and a nook in Wrapunzel's seventh case. Rows live
 * here and are spread into the tables they belong to.
 */

/** How often a fossil turns up, by the critters' tiers but the legendary (12:5:2). */
export type FossilRarity = Exclude<Rarity, 'legendary'>;

export interface FossilRow {
  name: string;
  rarity: FossilRarity;
  /** The places it's buried in: the commons almost anywhere, the rare ones somewhere particular. */
  where: readonly MapZoneId[];
  /** What Cobweb Corner pays for one. No shop sells a fossil, so it has no price. */
  value: number;
  /** Shown in her bag and the Curiosity Cabinet once she has dug one up. */
  description: string;
  /** What the Cabinet says of one she hasn't found yet, under its shadow. */
  hint: string;
  /** Wrapunzel's label as it goes into the seventh case. */
  label: string;
}

export const FOSSILS: Record<FossilId, FossilRow> = {
  trilobite: {
    name: 'Trilobite',
    rarity: 'common',
    where: [
      'town',
      'whisperwood',
      'lanternShore',
      'castleHill',
      'hiddenClearing',
      'fairground',
      'booAcres',
    ],
    value: 30,
    description:
      'A little stone bug with a lot of legs, curled up for a very long nap. About five hundred ' +
      'million years so far. It looks comfy.',
    hint: 'A common find, curled up under mounds just about everywhere.',
    label: 'The trilobite goes on a velvet cushion. It has earned a lie-in.',
  },
  fernInSlate: {
    name: 'Fern in slate',
    rarity: 'common',
    where: ['town', 'whisperwood', 'hiddenClearing', 'castleHill'],
    value: 30,
    description:
      'A fern frond pressed into slate like a flower in a book, every little leaf still there. ' +
      'Nature keeps a scrapbook too.',
    hint: 'A common find, pressed in slate in town, in the woods and up the castle hill.',
    label:
      'The fern in slate goes in a frame of its own. Wrapunzel calls it "the original pressed flower."',
  },
  ammonite: {
    name: 'Ammonite',
    rarity: 'common',
    where: ['town', 'lanternShore', 'fairground', 'booAcres'],
    value: 30,
    description:
      'A stone shell in a perfect spiral, like a cinnamon roll that has been to the bottom of the ' +
      'sea and back. Do not eat it.',
    hint: 'A common find, spiralled up in town, by the lake, at the fair and on the farm.',
    label: 'The ammonite goes next to the cinnamon rolls at the front, then gets moved. Twice.',
  },
  stoneAcorn: {
    name: 'Stone acorn',
    rarity: 'common',
    where: ['town', 'whisperwood', 'castleHill', 'booAcres'],
    value: 30,
    description:
      'An acorn that took a very long time to decide whether to be a tree, and became a rock ' +
      'instead. Still has its little hat on.',
    hint: 'A common find, wherever old oaks were: in town, the woods, the castle hill, the farm.',
    label: 'The stone acorn sits in a little egg cup. Its hat is at a jaunty angle.',
  },
  batSkull: {
    name: "Bat's skull",
    rarity: 'common',
    where: ['town', 'castleHill', 'fairground', 'hiddenClearing'],
    value: 35,
    description:
      'The tiniest skull, no bigger than a thimble, with two little fangs and a big grin. Barty ' +
      'says it is the friendliest bone he has ever met.',
    hint: 'A common find, smiling up from mounds in town, at the castle, the fair and somewhere hidden.',
    label: "The bat's skull grins at everyone who comes in. Barty visits it on Sundays.",
  },
  boneFish: {
    name: 'Bonefish in slate',
    rarity: 'common',
    where: ['lanternShore', 'whisperwood', 'booAcres'],
    value: 35,
    description:
      'A little fish, all bones, swimming across a slab of slate. It has been swimming for ages ' +
      'and is nearly there.',
    hint: 'A common find, near water: by the lake, the frozen creek and the farm pond.',
    label: 'The bonefish goes up on the wall, still swimming. Wrapunzel says it is nearly there.',
  },
  ghostShell: {
    name: 'Ghost shell',
    rarity: 'uncommon',
    where: ['lanternShore'],
    value: 80,
    description:
      'A seashell so pale you can see the light through it. Hold it to your ear and it whispers ' +
      '"boo," like the sea, but spookier.',
    hint: 'Uncommon, and only ever dug up at Lantern Shore.',
    label:
      'The ghost shell goes in the window, where the light comes through it. It whispers "boo."',
  },
  dragonTooth: {
    name: "Dragon's tooth",
    rarity: 'uncommon',
    where: ['castleHill'],
    value: 80,
    description:
      'A big curved tooth, smooth as a pebble. The dragon it belonged to only ever used it for ' +
      'toast, Agatha says.',
    hint: 'Uncommon, and only ever dug up on the castle hill.',
    label: "The dragon's tooth gets a little sign: \"Please don't tap the glass. It's a tooth.\"",
  },
  fairyLoaf: {
    name: 'Fairy loaf',
    rarity: 'uncommon',
    where: ['hiddenClearing', 'booAcres', 'whisperwood'],
    value: 80,
    description:
      'A round stone sea urchin with a star on top, which the old stories call a fairy loaf. Keep ' +
      'one in the kitchen and you will never run out of bread.',
    hint: 'Uncommon, in the woods, the hidden clearing and the fields at Boo Acres.',
    label:
      'The fairy loaf goes by the bakery oven, for luck. The bread has never been better, Wrapunzel swears.',
  },
  toadstone: {
    name: 'Toadstone',
    rarity: 'uncommon',
    where: ['whisperwood', 'lanternShore', 'fairground'],
    value: 80,
    description:
      "A little round button of a stone that old wives said grew in a toad's head. It did not. " +
      'The toads are very relieved.',
    hint: 'Uncommon, in Whisperwood, by the lake and under the fairground.',
    label: 'The toadstone goes in a ring box. The frogs in the next case look very relieved.',
  },
  mothInAmber: {
    name: 'Moth in amber',
    rarity: 'rare',
    where: ['whisperwood', 'hiddenClearing'],
    value: 200,
    description:
      'A moth asleep in a drop of honey-gold amber, its wings still dusty. Hold it up to a ' +
      'lantern and it glows like a little sunset.',
    hint: 'Rare, and only deep in the woods: Whisperwood, or somewhere hidden there.',
    label:
      'The moth in amber gets the case under the lamp, beside the luna moth. They have a lot to talk about.',
  },
  dragonEgg: {
    name: "Dragon's egg",
    rarity: 'rare',
    where: ['castleHill', 'booAcres'],
    value: 220,
    description:
      'A stone egg, speckled and warm to the touch, with one tiny crack. Something inside is ' +
      'snoring, very softly. Probably.',
    hint: 'Rare, up on the castle hill, or somewhere out in the fields at Boo Acres.',
    label: "The dragon's egg goes on a nest of tea towels, by the oven to keep warm. Just in case.",
  },
};

/** Every fossil, in the order the Curiosity Cabinet and the seventh case keep them. */
export const FOSSIL_IDS = Object.keys(FOSSILS) as FossilId[];

export function isFossil(id: string): id is FossilId {
  return id in FOSSILS;
}

/** Each fossil as something in her bag. */
export const FOSSIL_ITEMS: Record<FossilId, ItemRow> = Object.fromEntries(
  FOSSIL_IDS.map((id) => [
    id,
    { name: FOSSILS[id].name, kind: 'fossil', description: FOSSILS[id].description },
  ]),
) as Record<FossilId, ItemRow>;

/** What Cobweb Corner pays for each. */
export const FOSSIL_VALUES: Record<FossilId, number> = Object.fromEntries(
  FOSSIL_IDS.map((id) => [id, FOSSILS[id].value]),
) as Record<FossilId, number>;

/**
 * What else a mound may hold, now and then: one of the plain beads for her bracelets (never a
 * football or the LOVE beads, which are the shops'), or a little Candy someone buried for later.
 */
export const MOUND_BEADS: readonly ItemId[] = ['heartBead', 'smileyBead', 'batBead', 'ghostBead'];

/** How much Candy is in a mound that has Candy in it. */
export const MOUND_CANDY = 40;

/** Of every sixteen mounds, how many hold a bead and how many Candy; the rest a fossil. */
export const MOUND_ODDS = { bead: 2, candy: 2, of: 16 } as const;

/** What she reads as she digs one up: `{thing}` is the fossil, or the bead, or the Candy. */
export const MOUND_LINES = {
  fossil: 'You dig into the mound and brush off the earth: a {thing}!',
  firstFossil:
    'You dig into the mound and brush off the earth: a {thing}! Your very first of these.',
  bead: 'You dig into the mound and find a {thing}, a little muddy but none the worse.',
  candy: 'You dig into the mound and find a little tin someone buried. {thing} Candy inside!',
} as const;
