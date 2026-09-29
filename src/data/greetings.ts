import type { HolidayId, TownEventId } from './calendar';
import type { DayWindow } from './windows';
import { CODY_NICKNAME } from './villagers';

/**
 * What Cody says when she opens the game (decisions.md 24, 114). `{days}` is how long she's been
 * away, written out ("3 days"), and `{name}` her name. Each list is picked from by the window, so
 * a line stays put while she comes and goes within one.
 */
export const WELCOMES = {
  /** His hello to a brand-new neighbour. */
  first:
    `Hey, you made it. I'm Cody, your neighbour. Everyone calls me ${CODY_NICKNAME}; I've given ` +
    'up fighting it. Welcome to McFrancisVille, babe. The babies are all waiting for you at ' +
    'home. Gary too, probably.',
  /** Back within a quarter of an hour. */
  minutes: [
    "Back already, babe? Couldn't stay away. I get it.",
    'That was quick. Did you forget something? Was it me? It was me.',
    "Oh hey. I kept your spot warm. It's been, what, a minute?",
  ],
  /** Back later in the same window. */
  hours: [
    "Oh, there you are. I didn't miss you. I definitely didn't count the minutes.",
    'Welcome back, babe. Nothing happened. I mean, Gary moved. A little.',
    "There she is. The whole town perked right up. I'm the whole town, in this sentence.",
  ],
  /** Back in a new window, today or since yesterday. */
  window: {
    morning: [
      "Morning, babe. The coffee's on. It's in a cauldron, but it's on.",
      "Good morning! The trees grew back overnight. So did my hair. Don't look at it.",
      'Rise and shine, babe. The whole town is up. Well. Maude never went to bed.',
      'Welcome back, babe. The town got boring without you. I got boring without you.',
    ],
    afternoon: [
      "Afternoon, babe. You've missed nothing, except me. Missing me counts.",
      "Oh good, you're here. Lunch is over and the afternoon is all yours.",
      "Afternoon! Cobweb Corner has a new special. I didn't buy it. I thought about it.",
    ],
    evening: [
      'Evening, babe. The lanterns are coming on. I lit one for you. Rufus lit the rest.',
      "There you are. Evenings are better with you in them. Don't tell anyone I said that.",
      'Good evening! Perfect night for a walk. Or a snack. Or a snack on a walk.',
    ],
  } satisfies Record<DayWindow, readonly string[]>,
  /** Away a few days. */
  days: [
    'There she is. {days}, babe. Rufus asked about you every hour. So did I. Mostly me.',
    "{days}! I've been keeping everyone out of trouble, babe. Mostly Gary.",
  ],
  /** Away most of a week or more. */
  week: [
    'Babe! {days}! I thought the Moon Pie Man had kidnapped you. Agatha has a whole theory.',
    'Babe! {days}! Agatha read your tea leaves. They said you would be back. Show-off.',
  ],
  /** Away a fortnight or more. */
  weeks: [
    "You're back! It's been {days}, babe. Nothing wilted, don't worry. Nothing ever does. I " +
      'kept everyone in line. Mostly.',
  ],
} as const;

/** Cody's hello on the first visit of a holiday or a town event's day. */
export const HOLIDAY_GREETINGS: Record<HolidayId | TownEventId, string> = {
  newYear: 'Happy New Year, babe! I stayed up till midnight. Then I stayed up some more. Vampire.',
  valentines: "Happy Valentine's Day, babe. Be mine? You already are. I'm asking anyway.",
  stPatricks:
    "Happy St Patrick's Day! I'm wearing green somewhere. Don't pinch me. Okay, one pinch.",
  easter: 'Happy Easter, babe! Barty hid eggs all over town. Then he forgot where. Good luck.',
  fourthOfJuly: 'Happy Fourth, babe! Fireworks tonight. The bats are not thrilled.',
  halloween: "Happy Halloween, babe! It's Halloween every day here, but today it's official.",
  thanksgiving: "Happy Thanksgiving, babe. I'm thankful for you. And pie. You first, then pie.",
  christmasEve: "It's Christmas Eve, babe! Skelly wants to know if he's on the nice list. He is.",
  christmas: "Merry Christmas, babe! You're the best present. The wrapped ones are a close second.",
  newYearsEve: 'Last day of the year, babe. It was a good one. You were in it.',
  marketDay:
    "It's market day, babe! Cobweb Corner put a table out. I've been asked to stop touching things.",
  fullMoon: 'Full moon tonight, babe. Rufus is being very normal about it. Very, very normal.',
  luckyFriday:
    'Friday the 13th! Luckiest day there is. Beads everywhere. I found three in my shoe.',
};

/**
 * The red Tesla (personal_touches.md, "Version 0.1"): whoever spots a red one first taps the
 * other's arm. It drives across his greeting, and she always gets him first.
 */
export const RED_ONE = {
  lines: [
    'Hey babe, did you see the— wait. Wait. Is that a—',
    'Babe, look at the road. No, the road. Is that—',
    "Nice day for a drive, huh? Nothing on the road but— hold on. Don't you dare—",
  ],
  reply: 'Red one! 👊',
  after: 'Got him first! Cody demands a rematch.',
};

/** Now and then Cody reminds her to feed her Pokémon (personal_touches.md, "Version 0.1"). */
export const POKEMON = {
  lines: [
    "Babe. Babe. Did you feed your Pokémon today? They're looking at me like it's my job.",
    "Quick reminder from your favourite vampire: feed your Pokémon. I'd do it, but I only " +
      'know how to feed bats.',
    "Daily check-in: Pokémon fed? Eggs hatched? I'm not nagging. I'm caring. Loudly.",
  ],
  reply: 'On it!',
};

/** In a hundred first visits of a day, about how many are the red Tesla, and the Pokémon. */
export const EASTER_EGG_ODDS = { redOne: 8, pokemon: 10 };

/** How she answers him, most days. */
export const HELLO_REPLY = 'Hi, Cody!';

/**
 * His dedication to her, shown after the title screen the first time she opens the game and on the
 * title every time after, in his words (personal_touches.md, "After phase V").
 */
export const DEDICATION = {
  line: 'To my beautiful perfect angel baby wife, who is my whole world.',
  signed: 'Love, Cody',
  reply: '♥',
};
