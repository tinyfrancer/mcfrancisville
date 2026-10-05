import type { DollId, MilestoneId, VillagerId } from '../types/ids';
import type { Family } from './critters';
import type { Ware } from './shop';

/** The year's four seasons, by the months they begin in: a critter is a season's own by its first month. */
export type SeasonId = 'autumn' | 'winter' | 'spring' | 'summer';

export const SEASON_MONTHS: Record<SeasonId, readonly number[]> = {
  autumn: [9, 10, 11],
  winter: [12, 1, 2],
  spring: [3, 4, 5],
  summer: [6, 7, 8],
};

/**
 * What a shelf is (0.2's F2): every critter of a family she has caught, every critter that comes
 * out first in a season, every critter of a family on show at the museum (its wing), or every one
 * of a kind of thing she collects that she has ever had.
 */
export type Shelf =
  | { caught: Family }
  | { season: SeasonId }
  | { wing: Family | 'fossil' }
  | { had: 'squishy' | 'doll' | 'fossil' };

export interface MilestoneRow {
  shelf: Shelf;
  /** What the Curiosity Cabinet calls it. */
  name: string;
  from: VillagerId;
  /** `{name}` is the name she typed. */
  letter: string;
  gift: Ware;
}

const doll = (id: DollId): Ware => ({ item: id });

const SIGNED = '\n\nWith floury hugs,\nWrapunzel';

/**
 * Every shelf to finish, and the letter and gift that come when she does (0.2's F2). A whole
 * family caught sends a framed one for her wall (the framed moth was her answer, question 63),
 * a season's own a monster doll, a wing of the museum a little glass dome, and her squishies and
 * dolls a place to keep them. A letter's id is `shelf:<id>`; one is posted once, and never taken
 * back.
 */
export const MILESTONES: Record<MilestoneId, MilestoneRow> = {
  moths: {
    shelf: { caught: 'moth' },
    name: 'Every moth and butterfly',
    from: 'wrapunzel',
    letter:
      'Dear {name},\n\nEvery moth and butterfly in McFrancisVille, caught! I heard it from the ' +
      'luna moths themselves. I had one framed for you, the prettiest I could find, so your wall ' +
      'can have a little midnight in June too.' +
      SIGNED,
    gift: { furniture: 'framedMoth' },
  },
  bats: {
    shelf: { caught: 'bat' },
    name: 'Every bat',
    from: 'wrapunzel',
    letter:
      "Dear {name},\n\nEvery bat in town, caught! Cody is beside himself. He says it's a family " +
      'thing. Here is a framed vampire bat for your wall. He is only pretending to be asleep.' +
      SIGNED,
    gift: { furniture: 'framedBat' },
  },
  frogs: {
    shelf: { caught: 'frog' },
    name: 'Every frog and toad',
    from: 'wrapunzel',
    letter:
      'Dear {name},\n\nEvery frog and toad, caught, and the axolotl too, who insists he counts. ' +
      'I had him framed for you. He smiles at everybody, so he will smile at your guests.' +
      SIGNED,
    gift: { furniture: 'framedFrog' },
  },
  orbs: {
    shelf: { caught: 'orb' },
    name: 'Every orb',
    from: 'wrapunzel',
    letter:
      'Dear {name},\n\nEvery orb, caught, even the pair! I have framed a little wisp for you. ' +
      'It glows a bit after dark, so it doubles as a night-light. Very practical, for a ghost.' +
      SIGNED,
    gift: { furniture: 'framedOrb' },
  },
  beetles: {
    shelf: { caught: 'beetle' },
    name: 'Every beetle',
    from: 'wrapunzel',
    letter:
      'Dear {name},\n\nEvery beetle, caught, the Hercules beetle and all! I had him framed for ' +
      'you. He is very proud of his horn. Please tell him it is magnificent now and then.' +
      SIGNED,
    gift: { furniture: 'framedBeetle' },
  },
  fish: {
    shelf: { caught: 'fish' },
    name: 'Every fish',
    from: 'wrapunzel',
    letter:
      'Dear {name},\n\nEvery fish in every water, caught! You must have the patience of a ' +
      'mummy. Here is a blue moonfish, mounted and framed, for over your fireplace or wherever ' +
      'you like. It does not smell of fish. I checked.' +
      SIGNED,
    gift: { furniture: 'framedFish' },
  },
  autumn: {
    shelf: { season: 'autumn' },
    name: "Autumn's own",
    from: 'wrapunzel',
    letter:
      "Dear {name},\n\nYou've caught every critter that comes out with the autumn leaves! " +
      'Here is a little witch to celebrate. Her name is Hexanne. She hovers. Barely.' +
      SIGNED,
    gift: doll('witchDoll'),
  },
  winter: {
    shelf: { season: 'winter' },
    name: "Winter's own",
    from: 'wrapunzel',
    letter:
      "Dear {name},\n\nYou've caught every critter that comes out with the frost! For you, a " +
      'shy little ghost called Boolinda, to keep you company on the long nights.' +
      SIGNED,
    gift: doll('ghostDoll'),
  },
  spring: {
    shelf: { season: 'spring' },
    name: "Spring's own",
    from: 'wrapunzel',
    letter:
      "Dear {name},\n\nYou've caught every critter that comes out with the spring rain! Here " +
      'is Patchwork Polly, sewn together from the cutest bits, like spring itself.' +
      SIGNED,
    gift: doll('stitchDoll'),
  },
  summer: {
    shelf: { season: 'summer' },
    name: "Summer's own",
    from: 'wrapunzel',
    letter:
      "Dear {name},\n\nYou've caught every critter of the summer nights, fireflies and all! " +
      'Here is Marina Ghoulsby, fresh from the seaside, with her shell purse.' +
      SIGNED,
    gift: doll('seaDoll'),
  },
  mothWing: {
    shelf: { wing: 'moth' },
    name: 'The moth wing',
    from: 'wrapunzel',
    letter:
      'Dear {name},\n\nThe moth wing is full! I cut the ribbon myself, with my best scissors. ' +
      'Here is a wishing moth under a little glass dome, for your home. Make a wish on it.' +
      SIGNED,
    gift: { furniture: 'mothDome' },
  },
  batWing: {
    shelf: { wing: 'bat' },
    name: 'The bat wing',
    from: 'wrapunzel',
    letter:
      'Dear {name},\n\nThe bat wing is full! It is the only wing that hangs upside down. Here ' +
      'is a lantern bat under a glass dome for you, the right way up, mostly.' +
      SIGNED,
    gift: { furniture: 'batDome' },
  },
  frogWing: {
    shelf: { wing: 'frog' },
    name: 'The frog wing',
    from: 'wrapunzel',
    letter:
      'Dear {name},\n\nThe frog wing is full, and it sings every evening! Here is a glow toad ' +
      'under a glass dome for your home. It sings too, but only very quietly.' +
      SIGNED,
    gift: { furniture: 'frogDome' },
  },
  orbWing: {
    shelf: { wing: 'orb' },
    name: 'The orb wing',
    from: 'wrapunzel',
    letter:
      'Dear {name},\n\nThe orb wing is full, and it lights itself! No more candles. Here is a ' +
      'green orb in a glass dome for you. It would like to be near a window.' +
      SIGNED,
    gift: { furniture: 'orbDome' },
  },
  beetleWing: {
    shelf: { wing: 'beetle' },
    name: 'The beetle wing',
    from: 'wrapunzel',
    letter:
      'Dear {name},\n\nThe beetle wing is full! It glitters like a jewellery box. Here is a ' +
      'jewel beetle under a glass dome, for your own little jewellery box of a home.' +
      SIGNED,
    gift: { furniture: 'beetleDome' },
  },
  fishWing: {
    shelf: { wing: 'fish' },
    name: 'The fish wing',
    from: 'wrapunzel',
    letter:
      'Dear {name},\n\nThe fish wing is full! People press their noses to the glass all day. ' +
      'Here is a boo koi in a little glass bowl-dome for you. It blows bubbles at visitors.' +
      SIGNED,
    gift: { furniture: 'fishDome' },
  },
  squishies: {
    shelf: { had: 'squishy' },
    name: 'Every squishy',
    from: 'cody',
    letter:
      "Babe.\n\nYou've had every squishy Cobweb Corner sells. Every one. I've never been more " +
      'proud, or more jealous. I built you a shelf for them, so they can all squish together. ' +
      'Can I borrow the bat gyoza? Asking for me.\n\nYours, squishily,\nCody',
    gift: { furniture: 'squishyShelf' },
  },
  dolls: {
    shelf: { had: 'doll' },
    name: 'Every monster doll',
    from: 'agatha',
    letter:
      'Dear {name},\n\nThe whole set of monster dolls! Hexanne told me. Yes, she talks. I may have ' +
      'charmed her a little. Here is a house for them all, so they can visit each other after ' +
      'dark. Leave the door open; they like a party.\n\nYours, with a cackle,\nAgatha',
    gift: { furniture: 'dollHouse' },
  },
  // The fossils (0.3's C1): the seventh case at the museum, and every one she has dug up.
  fossilWing: {
    shelf: { wing: 'fossil' },
    name: 'The fossil case',
    from: 'wrapunzel',
    letter:
      'Dear {name},\n\nThe seventh case is full! Twelve fossils, every one of them dug up by you, ' +
      "and a queue at the back to see the dragon's egg. I had the moth in amber copied under a " +
      "little glass dome for you. It glows when the lamp's on, like a tiny sunset." +
      SIGNED,
    gift: { furniture: 'amberDome' },
  },
  fossils: {
    shelf: { had: 'fossil' },
    name: 'Every fossil',
    from: 'barty',
    letter:
      "G'day {name}!\n\nYou've dug up every fossil there is. Every single one! Old bones are the " +
      "best bones, I always say, so I've built you a shelf for them, a little ledge each. I " +
      'dusted it twice. Give the bat skull a wave from me.\n\nYour mate,\nBarty',
    gift: { furniture: 'fossilShelf' },
  },
};

export const MILESTONE_IDS = Object.keys(MILESTONES) as MilestoneId[];
