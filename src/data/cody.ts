import type { Glyph } from './glyphs';
import type { VillagerId } from '../types/ids';

/*
 * Cody, married (V1's P5, decision 305): her husband from the first day. His rows here: the lines
 * a husband adds to his own, the hours he spends at hers of an evening, his "how was your day?"
 * and what he says to each answer, what only he brings up, the three scenes from their story he
 * tells over her first weeks, and what they do together at night. Every word is the warmest
 * default in his voice as his rows have it (decision 177): sarcastic but loving, and "babe" about
 * one line in four among mi amor, booby and honey bunny.
 */

/** Who she's married to. Nobody else is ever in his band. */
export const HUSBAND: VillagerId = 'cody';

/**
 * Lines a husband says, beside his `friend` and `close` lines, which are all his from the start
 * (`tierOf`'s `married`). `{years}` is how long they've been married.
 */
export const MARRIED_LINES: readonly string[] = [
  'Mi amor. Sit with me a minute. The town can wait. The town is mostly bats anyway.',
  'Being married to you is my favourite thing I have ever done. Second is the cape. Distant second.',
  "I told Barty we've been married {years} years. He said 'only?' I said 'forever, actually.'",
  'Booby, you have something on your face. It is a smile. Gross. Keep it.',
  'I keep the manor for my records and my dramatic pacing. Home is wherever you are, honey bunny.',
  "Babe. Remind me to tell you something later. It's 'I love you'. I'm saying it now so I don't forget.",
  "Honey bunny, if anyone asks, I'm at yours tonight. If nobody asks, I'm still at yours tonight.",
  'You know my favourite sound, mi amor? Your front door. Specifically me walking through it.',
];

/**
 * His evenings at hers (decision 269: more often than chance): from seven until his walk home,
 * ten on a weeknight and eleven at the weekend, as his schedule has him on her path after; six
 * nights in seven, the seventh at the manor with his records. A happening of his comes first.
 */
export const EVENINGS_AT_HERS = {
  from: 19,
  until: { weekday: 22, weekend: 23 },
  /** One night in this many, by the day key, he stays at the manor. */
  manorEvery: 7,
} as const;

/** What she can say to "how was your day?", by the id it's kept as. Never change an id once out. */
export type HerDayAnswer = 'good' | 'long' | 'later';

export const HER_DAY_ANSWERS: readonly HerDayAnswer[] = ['good', 'long', 'later'];

/**
 * How he asks, of an evening, when there's nothing she did today he knows of: one a day in
 * turn, seven, so a week never asks the same way twice.
 */
export const ASKS: readonly string[] = [
  "So, mi amor. How was your day? Leave nothing out. Or leave most of it out. I'm easy.",
  'Come here, honey bunny. Sit. How was your day? The real version.',
  'Okay, booby, debrief. How was today?',
  "I've been waiting all day to ask. How was your day, babe?",
  'Shoes off, feet up. How was your day, mi amor?',
  'Tell me everything. Or one thing. How was your day, honey bunny?',
  'Before you ask: my day was fine, I napped in a coffin. How was yours, booby?',
];

/**
 * How he asks when he knows something she did today, the first of these she did: two ways each,
 * a day each. `{catch}` and `{donated}` come with their "a", `{harvest}` and `{piece}` without.
 */
export const ASKS_ABOUT = {
  caught: [
    'I heard you caught {catch} today. The whole town heard. I may have told them. How was the rest of your day, mi amor?',
    'You caught {catch} today, booby. Show-off. How was the rest of it?',
  ],
  harvested: [
    'You picked your {harvest} today. Farmer of my dreams. How was your day, honey bunny?',
    'Somebody was out picking {harvest} today, and it was you. How was the rest of your day, babe?',
  ],
  donated: [
    "Wrapunzel says you gave the museum {donated} today. She's still squealing. How was your day, mi amor?",
    'You gave {donated} to a museum? Today? So generous. How was the rest of your day, booby?',
  ],
  placed: [
    'You put out the {piece} today. Very fancy. How was the rest of your day, mi amor?',
    'The {piece} is new. I noticed, honey bunny. I notice everything. So, how was today?',
  ],
} as const;

/** Her chips, in `HER_DAY_ANSWERS`' order. */
export const HER_DAY_SAYS: Readonly<Record<HerDayAnswer, string>> = {
  good: 'It was good!',
  long: 'Long day…',
  later: 'Tell you later',
};

/** What he says back to each, seven a chip, one a day in turn: none comes round inside a week. */
export const HER_DAY_BACKS: Readonly<Record<HerDayAnswer, readonly string[]>> = {
  good: [
    "Good? Good! I knew it. I'll be taking some of the credit.",
    "A good day. Write it down, mi amor. We'll frame it.",
    'Good days look great on you, honey bunny. Most things do.',
    'Good. Then my work here is done. My work was sitting here. Nailed it.',
    'Love that for you, babe. Tell me the best bit tomorrow.',
    'A good one! The bats owe me a fiver. I said you would say good.',
    'Good days are the best days. That is science, booby. Vampire science.',
  ],
  long: [
    'Come here. Long days get a cape hug. House rules.',
    'Then the rest of tonight is ours, mi amor. Nothing long allowed.',
    "Long day? Feet up. I'll do the snacks. I'll do all of the snacks.",
    "I'm sorry, babe. Tomorrow will be shorter. I've had a word with it.",
    'Long ones are the worst. You are the best. It evens out, honey bunny.',
    'Okay. No more long. Just the couch, me, and something with cheese on it.',
    'Long day, short evening? Not on my watch, booby. Stay up with me.',
  ],
  later: [
    "Later it is. I'll be right here. Being patient. Very patiently.",
    "Deal. I'll save you a spot, and the good blanket.",
    'Ooh, a cliffhanger. I love a cliffhanger, mi amor.',
    "Tell me later, then. I'll tell you mine now: I missed you.",
    "Later's fine, honey bunny. I've got all the time in the world. Literally. Vampire.",
    "Okay, babe. Whenever you're ready. I'm not going anywhere.",
    "Later. Got it. I'll just be here, wondering. Dramatically.",
  ],
};

/** What he says first the day after, by what she said: three, a day's in turn. */
export const YESTERDAY: Readonly<Record<HerDayAnswer, readonly string[]>> = {
  good: [
    "Still thinking about your good day yesterday, mi amor. Let's do that again.",
    "Yesterday was a good one, you said. Today's got big shoes to fill, honey bunny.",
    "You had a good day yesterday. I've decided I was the reason. Don't fact-check me.",
  ],
  long: [
    "Yesterday was a long one. Today's going to be easier. I've told it to behave, babe.",
    'How are you after yesterday, booby? Long days deserve a soft morning.',
    "After yesterday you're allowed to do nothing at all today. I'll supervise, mi amor.",
  ],
  later: [
    "You said you'd tell me later. It's later, mi amor. I'm all ears. And fangs.",
    "So? Yesterday? You promised me a later, honey bunny. I've been patient for hours.",
    "I'm still waiting to hear about yesterday, booby. No rush. Some rush.",
  ],
};

/** What only he brings up (decision 269): her look, her newest piece, her pets, her yard. */
export type HusbandTopic = 'look' | 'newest' | 'pets' | 'yard';

export const HUSBAND_TOPICS: readonly string[] = ['look', 'newest', 'pets', 'yard'];

/**
 * His lines on each, three a topic, one a day in turn. `{wearing}` and `{with}` are two pieces
 * she has on, `{piece}` the newest she put out, `{pet}` one of hers, `{yard}` a piece out front,
 * each said as it's said mid-sentence.
 */
export const HUSBAND_TALK: Readonly<Record<HusbandTopic, readonly string[]>> = {
  look: [
    'The {wearing} with the {with}? Mi amor. Who let you be this cute in public?',
    'I like the {wearing} today, honey bunny. And the {with}. And you in them, mostly.',
    'Booby. The {wearing}. The {with}. I am going to need a minute.',
  ],
  newest: [
    "The {piece} looks good there, mi amor. I'd have moved it twice. But it looks good.",
    "I sat by the {piece} while you were out. We're friends now, honey bunny.",
    'Babe, the {piece}. Very you. Which means very good.',
  ],
  pets: [
    "I gave {pet} a treat. Then another one. Don't tell anyone, mi amor.",
    "Honey bunny, {pet} sat on my cape again. I've decided it's an honour.",
    "Booby, {pet} looked at me like I owe them money. I might. I really don't remember.",
  ],
  yard: [
    "I like the {yard} out front, mi amor. The neighbours are jealous. I'm the neighbours.",
    "I waved at your {yard} on the way in, honey bunny. It didn't wave back. Rude.",
    'Babe, the {yard} out in the yard. You made our place look like a postcard.',
  ],
};

/** How long her newest piece is worth his saying so, in days. */
export const NEWEST_FOR_DAYS = 14;

/**
 * Three scenes from their story (decision 269: anniversary-shaped, not heart moments), told one a
 * day on a talk after his hello, each from the day she has lived here that many days. The last
 * ends on her chips. Ids are kept in the save (`lately.told`): never change one once out.
 */
export interface StoryScene {
  id: 'ice' | 'castle' | 'moon';
  /** From the day she has come to town this many times (`Visits.count`). */
  days: number;
  lines: readonly string[];
  replies?: readonly { say: string; back: string }[];
}

export const OUR_STORY: readonly StoryScene[] = [
  {
    id: 'ice',
    days: 3,
    lines: [
      'Hey. Do you remember our very first date, mi amor?',
      'Ice skating. You were so good at it. I held on to the wall like it owed me money.',
      "Then you took my hand so I wouldn't fall. I fell anyway. Just not on the ice.",
      "That's why your skates are always in your bag, honey bunny. Every time you skate the creek, that's us.",
    ],
  },
  {
    id: 'castle',
    days: 7,
    lines: [
      'I walked up to the castle today, booby. Just to stand there a bit.',
      "Monarchs everywhere. Orange and black, all over it. That's how I remember it too.",
      "You walked in and I forgot every word I'd practised. All of them. Even 'hi'.",
      "Then the music started, and we danced like we knew what we were doing. We didn't. Best day ever.",
    ],
  },
  {
    id: 'moon',
    days: 14,
    lines: [
      "Mi amor, can I say something soppy? You can't stop me. I've already started.",
      'I love you to the moon and back.',
      "I checked. The moon's really far. And then you have to come all the way back. Still worth it.",
      'Forever orbs, {name}.',
    ],
    replies: [
      { say: 'To the moon and back.', back: "…and back. I'm holding you to it, honey bunny." },
      { say: 'Forever orbs.', back: "Forever orbs. That's not a line, babe. That's a promise." },
      {
        say: "You're getting on mah nerves.",
        back: "And you're getting on mine. Forever. It's the best.",
      },
    ],
  },
];

/** What they do together at hers of an evening (decision 269), each once a night. */
export type TogetherId = 'snackRun' | 'stargazing' | 'ourSong';

export interface Together {
  /** On the button. */
  label: string;
  /** Beside it on the button (V1's L5). */
  glyph: Glyph;
  /** Said one after another. `{snack}` is tonight's snack, with its "a". */
  lines: readonly string[];
  /** Only after dark (from eight), when the night's snack is out and the stars are. */
  night: boolean;
  /** Only on a clear night. */
  clear?: true;
  /** What she does as the last line shows: holds it up, or waves up at the sky. */
  does: 'show' | 'greet';
}

export const TOGETHER: Readonly<Record<TogetherId, Together>> = {
  snackRun: {
    label: 'Snack run',
    glyph: { item: 'midnightPizza' },
    lines: [
      "Snack run? Snack run. I'll get my cape.",
      'Back! Rufus tried to follow me. I outran a werewolf for you, honey bunny.',
      "Here. Tonight's snack, {snack}. You pick first. You always pick first.",
    ],
    night: true,
    does: 'show',
  },
  stargazing: {
    label: 'Stargazing',
    glyph: 'telescope',
    lines: [
      "It's clear out. Come on, mi amor. Yard. Now. Bring the blanket.",
      "That one's the Big Ladle. Hazel says it's called something else. Hazel is wrong.",
      "And the little one right by the moon? That's ours. I named it Orb. Don't tell Hazel, booby.",
    ],
    night: true,
    clear: true,
    does: 'greet',
  },
  ourSong: {
    label: 'Our song',
    glyph: { item: 'recordWalkTheTomb' },
    lines: ['Babe. Our song is on. Come here. Mind the cape.'],
    night: false,
    does: 'show',
  },
};

export const TOGETHER_IDS: readonly TogetherId[] = ['snackRun', 'stargazing', 'ourSong'];

/** What the neighbours sheet calls his band (decision 269): never "getting to know you". */
export const MARRIED_BAND = 'Married';
