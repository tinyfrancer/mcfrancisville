import type { DayWindow } from './windows';
import type { FestivalId } from './calendar';
import type { FixtureId, ItemId, PropId } from '../types/ids';

/**
 * The Hollow Fairground's things to do (0.2's M2, decision 201): each a stall she walks up to (or
 * the fortune tent's table), what a go costs, when it's open, and what it does. A game of taps
 * always gives something (decision 11); the fortune is a line for the day and a critter to look
 * for; a snack stall sells what it fries, and the night's snack by day.
 */
export type ActivityId = 'ringToss' | 'hookAGhost' | 'fortune' | 'cornDogs' | 'toffeeApples';

/** When it's open: these windows, on every day or only at weekends, and all day in a festival. */
export interface Hours {
  windows: readonly DayWindow[];
  weekends?: true;
  festival?: FestivalId;
}

/**
 * A game of taps: `throws` goes at a row of `targets`, one of which glints each throw. Thrown at
 * the glinting one, it lands; at another, it lands `chance` in a hundred. What she wins is by how
 * many landed, from none up: there's always a prize.
 */
export interface Game {
  game: {
    throws: number;
    targets: number;
    chance: number;
    /** What she throws, and at what: "ring", "bottle". */
    thrown: string;
    at: string;
    /** By how many landed, from none to every one. The last is the one to win. */
    prizes: readonly ItemId[];
  };
}

/** A fortune: a line for the day and a critter to look for, once a day. */
export interface Fortune {
  fortune: true;
}

/** A snack stall: what it sells, and whether tonight's snack is on it too. */
export interface Snacks {
  sells: readonly ItemId[];
  tonight?: true;
}

export type Does = Game | Fortune | Snacks;

export interface ActivityRow {
  name: string;
  /** What she walks up to: a stall at the fairground, or something in the fortune tent. */
  at: { prop: PropId } | { fixture: FixtureId };
  /** What a go costs in Candy; a snack stall's prices are its snacks'. */
  cost: number;
  hours: Hours;
  does: Does;
  /** The stall-keeper's hello, at the top of its sheet. */
  line: string;
}

export const ACTIVITIES: Record<ActivityId, ActivityRow> = {
  ringToss: {
    name: 'Ring toss',
    at: { prop: 'ringTossStall' },
    cost: 20,
    hours: { windows: ['afternoon', 'evening'], festival: 'halloweenFestival' },
    does: {
      game: {
        throws: 3,
        targets: 5,
        chance: 40,
        thrown: 'ring',
        at: 'bottle',
        prizes: ['chewyDots', 'smileyBead', 'loveBeads', 'ringTossRosette'],
      },
    },
    line: 'Three rings a go! Watch for the bottle that winks. Everybody wins something, love.',
  },
  hookAGhost: {
    name: 'Hook-a-ghost',
    at: { prop: 'hookAGhostStall' },
    cost: 20,
    hours: { windows: ['afternoon', 'evening'], weekends: true, festival: 'halloweenFestival' },
    does: {
      game: {
        throws: 3,
        targets: 4,
        chance: 40,
        thrown: 'hook',
        at: 'ghost',
        prizes: ['sourGhouls', 'heartBead', 'popcorn', 'plushGhost'],
      },
    },
    line: 'Hook a ghost, any ghost! The one that glows is feeling friendly. Three hooks a go.',
  },
  fortune: {
    name: 'Your fortune',
    at: { fixture: 'fortuneTable' },
    cost: 10,
    hours: { windows: ['morning', 'afternoon', 'evening'] },
    does: { fortune: true },
    line: 'Cross the ball with a little Candy, and it will show you your day.',
  },
  cornDogs: {
    name: 'Corn dogs',
    at: { prop: 'cornDogStall' },
    cost: 0,
    hours: { windows: ['morning', 'afternoon', 'evening'] },
    does: { sells: ['cornDog', 'friedPickles', 'vinegarFries'], tonight: true },
    line: "Corn dogs, fried pickles, vinegar fries! And tonight's snack, if you can't wait.",
  },
  toffeeApples: {
    name: 'Toffee apples',
    at: { prop: 'toffeeAppleStall' },
    cost: 0,
    hours: { windows: ['afternoon', 'evening'], festival: 'halloweenFestival' },
    does: { sells: ['toffeeApple', 'popcorn'] },
    line: 'Toffee apples, still warm, and popcorn by the tub. Mind your teeth!',
  },
};

export const ACTIVITY_IDS = Object.keys(ACTIVITIES) as ActivityId[];

/** The day's fortunes, one dealt a day. Warm, and a little silly. */
export const FORTUNES: readonly string[] = [
  'A small kindness you do today will come back to you with a bow on it.',
  'Something you lost is closer than you think. Check your pockets. No, the other pocket.',
  'Today favours snacks eaten outdoors, and naps taken indoors.',
  'A friend is thinking of you right now, and smiling about it.',
  'The moon approves of your outfit. It told me so.',
  'You will hear a song today that sticks to you like toffee. Let it.',
  'Your garden is growing whether you watch it or not. It likes when you watch, though.',
  'A door you walk past every day has a little surprise behind it. Or a draught. One of those.',
  'Good luck finds the patient, and the ones holding a net. Ideally both.',
  'Someone in this town would love to hear from you. Go and say hello.',
  'Today is a lucky day for wearing something orange. Every day is, really.',
  'You will be very cosy later. The ball is quite sure of this one.',
];

/** Agatha's way into a reading, when she's behind the ball. `{name}` is her name. */
export const AGATHA_READS =
  "Agatha leans over the ball. 'Ooh, {name}, it's swirling for you! Let me see…'";

/** The ball's own, when Agatha's out. */
export const BALL_READS = 'The crystal ball swirls lilac, and words float up in it…';
