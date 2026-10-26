import type { DayWindow } from './windows';
import { RIDE_COST } from './fairRide';
import type { FestivalId } from './calendar';
import type { FixtureId, ItemId, PropId } from '../types/ids';

/**
 * The Hollow Fairground's things to do (0.2's M2, decision 201): each a stall she walks up to (or
 * the fortune tent's table), what a go costs, when it's open, and what it does. A game of taps
 * always gives something (decision 11); the fortune is a line for the day and a critter to look
 * for; a snack stall sells what it fries, and the night's snack by day.
 */
export type ActivityId =
  | 'ringToss'
  | 'hookAGhost'
  | 'duckPond'
  | 'strengthBell'
  | 'fortune'
  | 'cornDogs'
  | 'toffeeApples'
  | 'bigWheel';

/** When it's open: these windows, on every day or only at weekends, and all day in a festival. */
export interface Hours {
  windows: readonly DayWindow[];
  weekends?: true;
  festival?: FestivalId;
}

/**
 * How a game's go moves, and so what a tap is scored on (V1's R6b, decision 315): a ring swung
 * across the bottles and dropped over the glinting one, ghosts bobbing past a hook, ducks drifting
 * round a pond to be picked, or a bell's puck pumped up its pole while she holds and let go.
 */
export type Motion = 'swing' | 'bob' | 'ducks' | 'bell';

/**
 * A game of taps in time: `throws` goes, each one a moving thing she taps (or holds and lets go)
 * in its window, scored on how near she was. What she wins is by how well the whole go went,
 * from the floor every go wins to the best for a near-perfect one: there's always a prize.
 */
export interface Game {
  game: {
    throws: number;
    motion: Motion;
    /** How many there are to aim at: bottles in a row, ghosts in the tub, ducks on the pond. */
    targets: number;
    /** What she throws, and at what: "ring", "bottle". */
    thrown: string;
    at: string;
    /** By how well the go went, from the floor (every go) to the best. The last is the one to win. */
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

/**
 * A ride: once round the big wheel (1.6's X2, decision 381), with whoever she knows at the fair,
 * the day's first free and the rest at `cost`; how it goes is `data/fairRide.ts`.
 */
export interface Ride {
  ride: true;
}

export type Does = Game | Fortune | Snacks | Ride;

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
        motion: 'swing',
        targets: 5,
        thrown: 'ring',
        at: 'bottle',
        prizes: ['chewyDots', 'smileyBead', 'loveBeads', 'ringTossRosette'],
      },
    },
    line: 'Three rings a go! Let it drop as it swings over the bottle that winks. Everybody wins something, love.',
  },
  hookAGhost: {
    name: 'Hook-a-ghost',
    at: { prop: 'hookAGhostStall' },
    cost: 20,
    hours: { windows: ['afternoon', 'evening'], weekends: true, festival: 'halloweenFestival' },
    does: {
      game: {
        throws: 3,
        motion: 'bob',
        targets: 4,
        thrown: 'hook',
        at: 'ghost',
        prizes: ['sourGhouls', 'heartBead', 'popcorn', 'plushGhost'],
      },
    },
    line: 'Hook a ghost, any ghost! Tap as one bobs right under the hook. Three hooks a go.',
  },
  // The two stalls that came with R6b (decision 315), at the ring's south.
  duckPond: {
    name: 'Duck pond',
    at: { prop: 'duckPondStall' },
    cost: 20,
    hours: { windows: ['morning', 'afternoon', 'evening'] },
    does: {
      game: {
        throws: 1,
        motion: 'ducks',
        targets: 6,
        thrown: 'duck',
        at: 'duck',
        prizes: ['chewyDots', 'loveBeads', 'luckyDuckSquish'],
      },
    },
    line: "Pick a duck, any duck! Every duck wins, and there's a little crown under a lucky few.",
  },
  strengthBell: {
    name: 'Strength bell',
    at: { prop: 'strengthBellStall' },
    cost: 20,
    hours: { windows: ['afternoon', 'evening'], festival: 'halloweenFestival' },
    does: {
      game: {
        throws: 1,
        motion: 'bell',
        targets: 1,
        thrown: 'swing',
        at: 'bell',
        prizes: ['sourGhouls', 'popcorn', 'luckyDuckSquish'],
      },
    },
    line: 'Hold the mallet to wind up, let go at the top, and ring the bell! Nobody leaves empty-handed.',
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
  // A ride on the big wheel (1.6's X2), turning all day, its bulbs lit after dark.
  bigWheel: {
    name: 'The big wheel',
    at: { prop: 'ferrisWheel' },
    cost: RIDE_COST,
    hours: { windows: ['morning', 'afternoon', 'evening'] },
    does: { ride: true },
    line: 'Once round, nice and slow, with a stop at the very top. Your first ride today is on the house, love.',
  },
};

export const ACTIVITY_IDS = Object.keys(ACTIVITIES) as ActivityId[];

/**
 * The fortune pointing her to the stall whose first go is free today (V1's R6b), one day in
 * `FAIR_TIP_ONE_IN`; `{stall}` is its name.
 */
export const FAIR_TIPS: readonly string[] = [
  'The ball shows a little striped awning… your first go at the {stall} is on the house today.',
  "Something wants to be won at the {stall}, and the first go there today won't cost a sweet.",
  'Lucky hands today! The {stall} will let you have your first go for nothing.',
];

export const FAIR_TIP_ONE_IN = 3;

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

/** How a game's go is played, said under its stage while she's on one (V1's R6b). */
export const HOW_TO: Record<Motion, string> = {
  swing: 'Tap to let the ring drop as it swings over the bottle that winks.',
  bob: 'Tap as a ghost bobs right under the hook.',
  ducks: 'Tap a duck to pick it. Every duck wins!',
  bell: 'Hold to wind up, and let go as the puck reaches the top.',
};

/** What each throw says, by how it went: wide (still a prize's worth), good, near perfect. */
export const THROWN_LINES: Record<Motion, readonly [string, string, string]> = {
  swing: [
    'It skittered off along the shelf. That still counts for something!',
    'Clink! It caught the bottle.',
    'A ringer! Right over the winking bottle.',
  ],
  bob: [
    'Splash! The ghosts giggle at you, kindly.',
    'Got one, by the very edge of its loop!',
    'Hooked it clean! The ghost looks delighted.',
  ],
  ducks: [
    'A plain little duck underneath. Every duck wins!',
    'A star underneath! That one wins a bit more.',
    'A crown underneath! The lucky duck!',
  ],
  bell: ['Bonk! A good honest swing.', 'So high! Nearly to the top.', 'DING! You rang the bell!'],
};

/** What a game's prizes are won for, by how many prizes it has: the floor first. */
export const PRIZE_FOR: Record<3 | 4, readonly string[]> = {
  3: ['Every go wins this.', 'For a good go.', 'For a near-perfect go.'],
  4: ['Every go wins this.', 'For a fair go.', 'For a good go.', 'For a near-perfect go.'],
};
