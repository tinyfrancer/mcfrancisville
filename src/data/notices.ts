import type { DayWindow } from './windows';
import type { ItemId, VillagerId } from '../types/ids';

/**
 * A note her neighbours pin to the noticeboard by the square (phase N): something they'd like, and
 * how they ask. Three are up each window (decisions.md 81), from three different neighbours; a
 * note nobody answers is simply taken down, never held against her.
 */
export interface NoticeRow {
  from: VillagerId;
  item: ItemId;
  count: number;
  /** The note, in their words. `{what}` is what they want, in a sentence ("3 wood"). */
  note: string;
  /** The windows it goes up in; any, if none are said. A critter's is when it's out. */
  windows?: readonly DayWindow[];
}

export const NOTICES: readonly NoticeRow[] = [
  {
    from: 'maude',
    item: 'ghostDaisy',
    count: 2,
    note: 'WANTED: {what}, for pressing between the pages of a very old book.',
  },
  {
    from: 'maude',
    item: 'wood',
    count: 4,
    note: 'The library has run out of shelf again. {what}, please!',
  },
  {
    from: 'maude',
    item: 'candleMoth',
    count: 1,
    note: 'Seeking {what} to read by. It goes back to the lanterns after, of course.',
    windows: ['evening'],
  },
  {
    from: 'rufus',
    item: 'moonpetal',
    count: 3,
    note: "NEED {what} FOR A BOUQUET!!! It's a surprise!!! Don't tell anyone!!!",
  },
  {
    from: 'rufus',
    item: 'forgetMeBoo',
    count: 2,
    note: 'Does anyone have {what}? I forgot what I need them for.',
  },
  {
    from: 'rufus',
    item: 'pumpkinBat',
    count: 1,
    note: "I want to meet {what}. Just to say hi! I'll be very gentle!",
    windows: ['evening'],
  },
  {
    from: 'wrapunzel',
    item: 'pumpkin',
    count: 1,
    note: "Pie season (it's always pie season). {what}, please, dear.",
  },
  {
    from: 'wrapunzel',
    item: 'candyCorn',
    count: 2,
    note: 'Baking candy corn cookies for the whole town. Could use {what}.',
  },
  {
    from: 'wrapunzel',
    item: 'stone',
    count: 3,
    note: "My oven would like {what} for its hearth. Don't ask why. It's an old oven.",
  },
  {
    from: 'agatha',
    item: 'ghostPepper',
    count: 2,
    note: 'For a potion (a spicy one): {what}. Leave them by the cauldron.',
  },
  {
    from: 'agatha',
    item: 'batWingBean',
    count: 2,
    note: '{what}, please. For soup. It is just soup.',
  },
  {
    from: 'agatha',
    item: 'firefly',
    count: 1,
    note: "Wanted: {what}, to light a little spell. I'll let it go after.",
    windows: ['evening'],
  },
  {
    from: 'barty',
    item: 'wood',
    count: 5,
    note: 'Mending the greenhouse again. Any spare {what}?',
    windows: ['morning', 'afternoon'],
  },
  {
    from: 'barty',
    item: 'stone',
    count: 4,
    note: "Building a rockery. {what} would do nicely. Bones optional, I've plenty.",
  },
  {
    from: 'barty',
    item: 'rose',
    count: 1,
    note: 'Showing my roses at the next fair. Could borrow {what} to compare?',
  },
  {
    from: 'cody',
    item: 'burritoBowl',
    count: 1,
    note: "Babe. {what}. Please. I'm begging. You know the one.",
    windows: ['afternoon', 'evening'],
  },
  {
    from: 'cody',
    item: 'jackOLanternPizza',
    count: 1,
    note: 'Movie night at mine. Bring {what}? You pick the movie. (Not the sad one.)',
    windows: ['evening'],
  },
  {
    from: 'cody',
    item: 'ghostMinnow',
    count: 1,
    note: 'Rufus says there are ghost fish in the pond. I say prove it. {what}, please.',
  },
];

/** How many notes are up at once, each from a different neighbour. */
export const NOTICES_UP = 3;

/** What answering a note brings her in friendship, as well as its Candy. */
export const NOTICE_POINTS = 15;
