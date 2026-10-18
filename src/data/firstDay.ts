import type { FirstDayStepId } from '../types/ids';
import type { FurnitureRow } from './furniture';
import type { Glyph } from './glyphs';
import type { VisitGift } from './visits';

/**
 * Cody's thread over her first day in a new town (V1's R1, decision 311): a few things to try,
 * any order, none a lock, each with his line before and after and a little something for doing
 * it. Worked out in `systems/firstDay.ts` from what the town already keeps, kept by
 * `world.firstDay`, shown on `hud/FirstDayCard.ts`. Personal touches parked (decision 177): his
 * lines are the warmest default in his voice, married to her from the start.
 */
export interface FirstDayStep {
  /** On the card: what to do. */
  title: string;
  glyph: Glyph;
  /** His line while it's still to do: how. */
  before: string;
  /** His line once it's done, told as it is. */
  after: string;
  /** What doing it brings. */
  reward: VisitGift;
}

/** How many neighbours make "meet three" (Cody, already hers, isn't one of them). */
export const MEET_NEIGHBOURS = 3;

/** The steps, in the order the card lists them. */
export const FIRST_DAY_IDS: readonly FirstDayStepId[] = [
  'shake',
  'plant',
  'stall',
  'notice',
  'meet',
  'eat',
];

export const FIRST_DAY_STEPS: Record<FirstDayStepId, FirstDayStep> = {
  shake: {
    title: 'Shake the candy tree',
    glyph: 'tree',
    before:
      "See the tree by our door that looks like it raided a sweet shop? Walk up and give it a shake, babe. It's ours.",
    after:
      'Candy! It fills up a little every morning, afternoon and evening, so shake it whenever you pass.',
    reward: { item: 'moonPieMini', count: 1 },
  },
  plant: {
    title: 'Plant a seed',
    glyph: { item: 'pumpkinSeed' },
    before:
      'Our garden is right beside the house. Tap a bed to dig it over, then pick a seed. Pumpkins are quickest, mi amor.',
    after:
      "Look at you, farmer. The rain waters it, and nothing here ever wilts. I checked twice. Scarah's cart at Boo Acres has every seed there is.",
    reward: { item: 'sunflowerSeed', count: 2 },
  },
  stall: {
    title: 'Put something on the stall',
    glyph: { item: 'pumpkin' },
    before:
      "The honesty stall at the farm gate sells what you leave on it while you're out. Once your first crop is in, or you've made something, put a few on it.",
    after:
      "Open for business! The Candy waits in its tin till you come by. I'll guard it. From the porch.",
    reward: { candy: 50 },
  },
  notice: {
    title: 'Answer a note on the board',
    glyph: 'pin',
    before:
      'The noticeboard by the square has notes from the neighbours, asking for little things. Bring one what it asks for, booby.',
    after:
      "You answered a note! They'll talk about it all week. New notes go up every morning, afternoon and evening.",
    reward: { candy: 40 },
  },
  meet: {
    title: 'Meet three neighbours',
    glyph: 'neighbours',
    before:
      'Go say hi to the neighbours, honey bunny. Tap anyone and you walk right over. Three is plenty for one day.',
    after:
      "Three new friends! They're all a bit odd, in the best way. Say hi every day and they'll warm right up.",
    reward: { item: 'heartBead', count: 1 },
  },
  eat: {
    title: 'Eat something from the bag',
    glyph: 'yum',
    before:
      "Don't forget to eat, babe. Open the bag, tap a snack, then Eat. It puts a spring in your step.",
    after:
      "There's that spring in your step! Wrapunzel's bakery has more, and so do I, if you ask nicely.",
    reward: { item: 'ghostMallow', count: 2 },
  },
};

/** The card's words, and his line once every step is done, with the keepsake for her home. */
export const FIRST_DAY = {
  title: 'Your first day',
  line: 'A little list from Cody',
  intro:
    "A few things to try today. Any order, no rush. Nothing's going anywhere, and neither am I.",
  /** Under a step still to do, before what it brings. */
  forYou: 'For you:',
  /** Under a step done. */
  gotIt: 'Done! You got',
  /** On the button. */
  reply: 'Got it',
  finished:
    "That's your whole first day, mi amor, and you did all of it. I made you something for the house. It's in the storage chest. Don't look too closely at the stitches.",
  keepsake: 'welcomeSampler',
} as const;

/** His keepsake for her first day: a sampler he stitched himself, art in `sprites/firstDay.ts`. */
export const FIRST_DAY_FURNITURE: Record<'welcomeSampler', FurnitureRow> = {
  welcomeSampler: {
    name: 'Welcome-home sampler',
    description:
      'A cross-stitch in a little wooden hoop: our house, a heart and a bat, stitched by Cody. The bat is mostly a guess. The heart he went over twice.',
    layer: 'wall',
    size: { w: 1, h: 1 },
    says: 'You straighten the sampler. The heart is the neatest bit. It always will be.',
  },
};
