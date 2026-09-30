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
 * show, and one when every case is full, all 41 kinds (since 0.2's F1). A letter's id is
 * `museum:<donated>`.
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
    donated: 41,
    letter:
      'Dearest {name},\n\nEvery single case is full. Every one! I have never had a museum like it, ' +
      'and I have been around for a very long time. Here is a little cabinet of your own, so you ' +
      'can visit them at home.\n\nYour friend, all wrapped up in gratitude,\nWrapunzel',
    gift: { furniture: 'curiosityCabinet' },
  },
];

/**
 * How many cases every case being full took in earlier versions (34 from phase Q until 0.2's F1),
 * so her letter from then still reads as the one for a full museum and is never lost.
 */
export const MUSEUM_FORMERLY_FULL: readonly number[] = [34];

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
};
