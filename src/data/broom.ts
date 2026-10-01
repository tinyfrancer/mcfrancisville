import type { Ware } from './shop';

/**
 * Her broom (0.2's P1, question 50): a tap on the quick bar swoops her home, and the stand by her
 * mat flies her out again. Its ribbon and bristles are hers to colour (question 57).
 */

export type RibbonId = 'plum' | 'rose' | 'gold' | 'teal' | 'pumpkin' | 'sky' | 'ink' | 'ghost';
export type BristlesId = 'straw' | 'hazel' | 'ink' | 'lavender' | 'pumpkin' | 'moss';

export const RIBBONS: Record<RibbonId, string> = {
  plum: 'Plum',
  rose: 'Rose',
  gold: 'Gold',
  teal: 'Teal',
  pumpkin: 'Pumpkin',
  sky: 'Sky blue',
  ink: 'Midnight',
  ghost: 'Ghostly white',
};

export const BRISTLES: Record<BristlesId, string> = {
  straw: 'Straw',
  hazel: 'Hazel',
  ink: 'Midnight',
  lavender: 'Lavender',
  pumpkin: 'Pumpkin',
  moss: 'Moss',
};

export const RIBBON_IDS = Object.keys(RIBBONS) as RibbonId[];
export const BRISTLES_IDS = Object.keys(BRISTLES) as BristlesId[];

export interface BroomLook {
  ribbon: RibbonId;
  bristles: BristlesId;
}

/** How it comes out of Agatha's letter. */
export const FIRST_BROOM: BroomLook = { ribbon: 'plum', bristles: 'straw' };

/**
 * What she calls out as she hops on, one a flight. Most are plain; now and then it's one of hers
 * from _Hocus Pocus_ (question 56), in her own voice.
 */
export const BROOM_CALLS: readonly { line: string; weight: number }[] = [
  { line: 'Home we go!', weight: 3 },
  { line: 'Wheee!', weight: 3 },
  { line: 'Hold on to your hat!', weight: 2 },
  { line: 'Sistaaaaaaahs!', weight: 1 },
  { line: 'Booooook!', weight: 1 },
];

/** Agatha's letter with the broom, the day after she first comes to town (`broom:1`). */
export const BROOM_LETTER: { text: string; gift: Ware } = {
  text:
    "Dear {name},\n\nA little witch's secret: the quickest way home is by broom. This one is " +
    'yours now. Hop on from anywhere outside and it will swoop you straight to your door, and ' +
    'the stand by your mat will fly you out again, wherever you like, even back to exactly ' +
    'where you left. Tie a ribbon on it; brooms like to feel pretty.\n\nFly safe,\nAgatha',
  gift: { item: 'broom' },
};

/** She has come to town on this many days when Agatha writes: her first (decision 211). */
export const BROOM_AFTER_DAYS = 1;
