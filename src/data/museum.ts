import type { CritterId } from '../types/ids';
import type { Ware } from './shop';

/** What Wrapunzel writes as her museum fills, and what she sends with it. */
export interface MuseumLetter {
  /** How many kinds of critter are on show when it comes. */
  donated: number;
  /** `{name}` is the name she typed. */
  letter: string;
  gift: Ware;
}

/**
 * Wrapunzel's letters from the museum at the back of Crumbs & Curios: one when ten kinds are on
 * show, and one when every case is full, all 74 kinds (since 1.4's G3's winter fish). A letter's id
 * is `museum:<donated>`.
 */
export const MUSEUM_LETTERS: readonly MuseumLetter[] = [
  {
    donated: 10,
    letter:
      'Dear {name},\n\nTen cases full! People come in for a scone and stay an hour at the back. ' +
      'Your luna moth has admirers. So I had a lamp made, in its honour, for you.\n\n' +
      'With floury hugs,\nWrapunzel',
    gift: { furniture: 'lunaMothLamp' },
  },
  {
    donated: 74,
    letter:
      'Dearest {name},\n\nEvery single case is full. Every one! I have never had a museum like it, ' +
      'and I have been around for a very long time. Here is a little cabinet of your own, so you ' +
      'can visit them at home.\n\nYour friend, all wrapped up in gratitude,\nWrapunzel',
    gift: { furniture: 'curiosityCabinet' },
  },
];

/**
 * How many cases every case being full took in earlier versions (34 from phase Q until 0.2's F1, 41
 * until 0.3's C2, 60 until V1's R5, 70 until 1.4's G3), so her letter from then still reads as the
 * one for a full museum and is never lost.
 */
export const MUSEUM_FORMERLY_FULL: readonly number[] = [34, 41, 60, 70];

/** Over the museum's door: what she reads as she walks in. */
export const MUSEUM_GREETING =
  'Fresh bakes at the front, curiosities at the back. Wrapunzel has left a note on the counter: ' +
  '"Donations welcome! Every critter gets its own case, and a very good label."';

/**
 * Wrapunzel's label for a critter as it goes on show; `{critter}` is its name. Most get one of the
 * general ones, dealt by the critter, and a few have their own.
 */
export const MUSEUM_LABELS: readonly string[] = [
  'The {critter}! Wrapunzel will write its label in her very best hand.',
  'A {critter}, in its own glass case. It looks delighted to be here.',
  'The {critter} settles into its case and admires the view.',
  'A {critter} for the museum! Wrapunzel is going to be unbearable about this.',
];

export const MUSEUM_SPECIAL: Partial<Record<CritterId, string>> = {
  lunaMoth:
    'The luna moth gets the best case in the house, under the lamp, where its tails can swish.',
  orbPair:
    'The pair of orbs goes in one case together, of course. Forever orbs. Wrapunzel dabs her eyes.',
  vampireBat:
    'The vampire bat hangs upside down in its case and does a little bow. Cody will want to visit.',
  bowSpider:
    'The bow spider spins a lacy web in the corner of her case at once, and straightens her bow.',
  goldenSnail:
    'The golden snail gets a case lined with velvet. Wrapunzel polishes the glass twice.',
};

/**
 * Wrapunzel's label for a shiny as it goes in its case (1.4's G1), in place of the plain one if
 * there was one; `{critter}` is its name.
 */
export const MUSEUM_SHINY: readonly string[] = [
  'A shiny {critter}! Wrapunzel gasps, then gasps again, and gives it the case by the window.',
  'The shiny {critter} goes in its case, and the whole back room looks a little brighter.',
  'A shiny {critter}, in colours all its own! Wrapunzel is writing the label in gold ink.',
];

/**
 * Gerald (1.6's X6, decision 385): with every fossil on show, Wrapunzel stands them up in the
 * middle of the museum as a little dragon of bones. What his plaque says when she walks up to him.
 */
export const SKELETON_PLAQUE =
  'GERALD. A dragon (probably), assembled from twelve fossils, some wire and a great deal of ' +
  'hope, by Wrapunzel. Donated by {name}. Please do not feed Gerald.';

/** The id of Wrapunzel's letter the day Gerald stands up. */
export const SKELETON_LETTER = 'museum:gerald';

/** Wrapunzel's letter the day every fossil is on show and Gerald stands up. */
export const SKELETON_LETTER_TEXT =
  'Dearest {name},\n\nAssembled at last! With all twelve of your fossils in the case, I simply ' +
  'had to. I stayed up all night with a pot of tea and some wire, and now there is a dragon in ' +
  'the middle of the museum. The fern is his tail. The acorn is his kneecap. I am told that is ' +
  'not how bones work, and I do not care one bit.\n\nI have named him Gerald. Come and say hello. ' +
  'He has a plaque and everything.\n\nYour friend, a little dusty,\nWrapunzel';
