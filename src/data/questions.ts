import type { VillagerId } from '../types/ids';
import type { Reply } from './replies';

/**
 * What each neighbour asks her once they're friends (V1's P2, decision 301), and keeps: asked at
 * three hearts, on a talk after their hello, until she answers; the answer saved on their
 * friendship and brought up now and then after (the `answer` topic). Cody's is a husband's
 * question, the rest a friend's.
 */
export interface Answer extends Reply {
  /** What it's kept as, in the save. Never changed once a row is out. */
  id: string;
  /**
   * How they say it later, mid-sentence, after "your" or on its own: "the little red star",
   * "roses". It fills `{answer}` in their `ANSWER_TALK` lines.
   */
  called: string;
}

export interface Question {
  ask: string;
  answers: readonly Answer[];
}

export const QUESTIONS: Record<VillagerId, Question> = {
  cody: {
    ask: 'Settle something for me, mi amor. Perfect night in. What is it?',
    answers: [
      {
        id: 'film',
        say: 'A film on the sofa',
        back: "Correct. I'll make the popcorn. You hold the blanket. I'll steal the blanket.",
        called: 'film nights on the sofa',
      },
      {
        id: 'dancing',
        say: 'Records, and dancing',
        back: "Booby, yes. Kitchen floor, socks on, the good records. I'll even dance badly on purpose.",
        called: 'dancing in the kitchen',
      },
      {
        id: 'games',
        say: 'A board game. I win.',
        back: "You always win. I've accepted it. I've not accepted it. Rematch.",
        called: 'board games',
      },
    ],
  },
  maude: {
    ask: "{name}, I'm choosing you a book. A proper one, from my own shelf. What do you like to read?",
    answers: [
      {
        id: 'mystery',
        say: 'A cozy mystery',
        back: 'Oh, good. A body in the library, but a polite one. I know just the book.',
        called: 'cozy mysteries',
      },
      {
        id: 'ghost',
        say: 'Ghost stories',
        back: "Ha! I'll lend you the ones that are true. They're the gentlest, as it happens.",
        called: 'ghost stories',
      },
      {
        id: 'romance',
        say: 'Something romantic',
        back: "Oh, {name}. I've a shelf of them that sigh. I'll pick the one that sighs the most.",
        called: 'love stories',
      },
    ],
  },
  rufus: {
    ask: "{name}! {name}! Important question! The most important! What's your favourite flower?!",
    answers: [
      {
        id: 'rose',
        say: 'Roses',
        back: "ROSES! Classic! Romantic! A little bit thorny, like me when I've not had a nap!",
        called: 'roses',
      },
      {
        id: 'moonflower',
        say: 'Moonflowers',
        back: "MOONFLOWERS?! They open at NIGHT! Like ME! We're basically the same flower!",
        called: 'moonflowers',
      },
      {
        id: 'sunflower',
        say: 'Sunflowers',
        back: 'SUNFLOWERS! They always face the sun! Like I always face you! I am a sunflower now!',
        called: 'sunflowers',
      },
    ],
  },
  wrapunzel: {
    ask: "Tell me, my darling, so I know what to keep back for you. What's your very favourite bake?",
    answers: [
      {
        id: 'pie',
        say: 'Pumpkin pie',
        back: "A woman of taste. I'll keep a slice under a cloth for you. Rufus won't find it. Probably.",
        called: 'pumpkin pie',
      },
      {
        id: 'cinnamon',
        say: 'Anything with cinnamon',
        back: "Then you've come to the right mummy. I've been wrapped in cinnamon. Long story.",
        called: 'cinnamon buns',
      },
      {
        id: 'cookies',
        say: 'Bat-wing cookies',
        back: "Crisp, chocolatey and shaped like a little bat. You're one of us now, dear.",
        called: 'bat-wing cookies',
      },
    ],
  },
  agatha: {
    ask: 'Hypothetically, {name}. If I brewed you any potion at all, what would you want it to do?',
    answers: [
      {
        id: 'luck',
        say: 'Bring a little luck',
        back: "Sensible. Four-leaf clover, one wish, a pinch of nutmeg. Don't ask about the nutmeg.",
        called: 'a little luck',
      },
      {
        id: 'sleep',
        say: 'A lie-in on Sundays',
        back: "A woman after my own heart. I've been perfecting that one for a century.",
        called: 'a lie-in on Sundays',
      },
      {
        id: 'fly',
        say: 'Help me fly',
        back: "Ha! I can't fly straight myself. We'll wobble about together. It's half the fun.",
        called: 'flying',
      },
    ],
  },
  barty: {
    ask: "Now then, {name}, a gardener's question. If you could only ever grow one thing, what'd it be?",
    answers: [
      {
        id: 'pumpkin',
        say: 'Pumpkins, always',
        back: "Spoken like a true local. Big, round and cheerful. Like Gourdon. Don't tell him.",
        called: 'pumpkins',
      },
      {
        id: 'hosta',
        say: 'Hostas, like you',
        back: "Hostas! Oh, you've gone and made an old skeleton rattle. Best answer there is.",
        called: 'hostas',
      },
      {
        id: 'sunflower',
        say: 'Sunflowers',
        back: 'Good choice. Tall, sunny and always looking up. Bit like you, if you ask me.',
        called: 'sunflowers',
      },
    ],
  },
  ollie: {
    ask: "{name}, I ask everyone on my round this. If you could post a letter anywhere at all, where'd it go?",
    answers: [
      {
        id: 'moon',
        say: 'To the moon',
        back: "The moon! I'll need a very long ladder. And a stamp the size of a door.",
        called: 'the moon',
      },
      {
        id: 'past',
        say: 'To me, years ago',
        back: "Oh, that's a lovely one. You'd tell yourself it all turns out alright, I bet.",
        called: 'yourself, years ago',
      },
      {
        id: 'everyone',
        say: 'To everyone in town',
        back: "Everyone at once? That's my favourite kind of day. Long round. Lots of waving.",
        called: 'everyone in town',
      },
    ],
  },
  nessa: {
    ask: '{name}, can I ask you something silly? If you had a little boat, what would you call it?',
    answers: [
      {
        id: 'biscuit',
        say: 'The Soggy Biscuit',
        back: "The Soggy Biscuit. Oh. That's perfect. I laughed so hard a fish came up to look.",
        called: 'the Soggy Biscuit',
      },
      {
        id: 'lantern',
        say: 'The Lantern Lady',
        back: "The Lantern Lady. I like that. It would glow on the water. I'd light it for you.",
        called: 'the Lantern Lady',
      },
      {
        id: 'nessa',
        say: 'Nessa, after you',
        back: "After… me? Oh. Oh no. I've gone pink right down to the tail.",
        called: 'a boat called Nessa',
      },
    ],
  },
  gourdon: {
    ask: "{name}, if I built you anything at all, what'd it be? I'm asking. I'm not promising.",
    answers: [
      {
        id: 'swing',
        say: 'A porch swing',
        back: 'Good answer. Two seats. Slow swing. For long evenings. I can see it.',
        called: 'a porch swing',
      },
      {
        id: 'bookcase',
        say: 'A bookcase',
        back: 'A bookcase. Floor to ceiling. Maude would move in. Fair warning.',
        called: 'a bookcase',
      },
      {
        id: 'treehouse',
        say: 'A treehouse',
        back: 'A treehouse. Ha. Always wanted to build one. Nobody ever asked. Good answer.',
        called: 'a treehouse',
      },
    ],
  },
  hazel: {
    ask: "{name}, I've been meaning to ask. When you look up at night, which star feels like yours?",
    answers: [
      {
        id: 'red',
        say: 'The little red one',
        back: "The little red one! It's shy, but it's always there. I'll put it on my chart as yours.",
        called: 'the little red star',
      },
      {
        id: 'castle',
        say: 'The one over the castle',
        back: 'Over the castle! It sits right on the tallest tower. Very grand. Very you.',
        called: 'the star over the castle',
      },
      {
        id: 'twinkly',
        say: 'The twinkliest one',
        back: 'The twinkliest! It never sits still. I know just the one. It waves at you.',
        called: 'the twinkliest star',
      },
    ],
  },
  boothoven: {
    ask: "{name}, I am writing a piece and I need your ear. What's your favourite kind of song?",
    answers: [
      {
        id: 'dance',
        say: 'One to dance to',
        back: "A dance! Allegro! I'll write it fast and bouncy, and I'll dance badly to it. On purpose.",
        called: 'songs to dance to',
      },
      {
        id: 'slow',
        say: 'A slow one',
        back: 'Ah, a slow one. Adagio. The kind you hum on a rainy night. My favourite to write.',
        called: 'slow songs',
      },
      {
        id: 'singalong',
        say: 'One we can all sing',
        back: "A sing-along! The whole town in harmony. Rufus will howl. He'll be perfect.",
        called: 'sing-alongs',
      },
    ],
  },
  scarah: {
    ask: "{name}, out here I count the year in seasons. Which one's your favourite?",
    answers: [
      {
        id: 'autumn',
        say: 'Autumn, always',
        back: 'Autumn! Harvest moons and pumpkins and leaves to jump in. I was made for autumn.',
        called: 'autumn',
      },
      {
        id: 'spring',
        say: 'Spring',
        back: 'Spring! Everything waking up at once. Like me, that first night. It sneezes too.',
        called: 'spring',
      },
      {
        id: 'winter',
        say: 'Winter, for the cocoa',
        back: "Winter! Snow on the fields and something warm in a mug. I'll save you the cosiest bale.",
        called: 'winter',
      },
    ],
  },
};

/**
 * What they say after, now and then (the `answer` topic): `{answer}` is what she answered, as
 * `called` says it. Three lines each, one a day in turn, as every topic is.
 */
export const ANSWER_TALK: Record<VillagerId, readonly string[]> = {
  cody: [
    "I've been thinking about {answer}, mi amor. Tonight? Tonight.",
    'Honey bunny, I told Gourdon about your perfect night in. I said {answer}. He nodded.',
    "Babe, you said {answer}. I've been practising. Ask me what I've been practising.",
  ],
  maude: [
    "{name}, I've found three more for you, since you like {answer}. They're on your chair.",
    'I read one of my {answer} again last night, thinking of you. It held up.',
    "You told me you like {answer}. I've started a little shelf with your name on it.",
  ],
  rufus: [
    '{name}! I put {answer} in my window! For you! Because you said! I remembered!',
    'Do you still love {answer}?! I do now! I love them SO much! Because of you!',
    'I told every flower in the shop you love {answer}! The others were a bit jealous!',
  ],
  wrapunzel: [
    "I've a little something under a cloth for you, dear. You said {answer}, and I listened.",
    'Every time I bake {answer}, I think of you. So I bake rather a lot of them.',
    '{name}, you said {answer}. I tried a new way this morning. Be honest. Be kind.',
  ],
  agatha: [
    "I'm still working on that potion, {name}. The one for {answer}. It's nearly the right colour.",
    "You asked for {answer}. Very well. I've a cauldron on it. Don't hurry me.",
    "{name}, I've a page in my book just for your potion now. For {answer}. It smells of nutmeg.",
  ],
  barty: [
    "{name}, I saved you the best of the seeds. You said {answer}, and I don't forget.",
    'Was thinking of you in the beds this morning. All those {answer}. Grows on you.',
    "You know what I like about you, {name}? You said {answer} and meant it. Gardener's honest.",
  ],
  ollie: [
    "{name}, I'm still thinking about your letter. To {answer}. I'd find a way. I always do.",
    "If you ever write it, the letter to {answer}, I'll deliver it. First class. No question.",
    'I told Parcel about your letter to {answer}. She rang her bell. That means yes.',
  ],
  nessa: [
    "I drew {answer} on a lily pad today. It floated off. I think it's sailing somewhere nice.",
    'I keep thinking about {answer}. I said it out loud to the carp. They liked it too.',
    "If I ever get a boat, it'll be {answer}. I've decided. Don't laugh. You can laugh.",
  ],
  gourdon: [
    'Been thinking about {answer}. Measured a few things. Not promising. Still measuring.',
    "Drew up {answer} on the back of an envelope. It's a good envelope.",
    "Picked out the wood for {answer}. In my head. Oak. You'd want oak.",
  ],
  hazel: [
    '{name}, your star was out last night, {answer}. It looked very pleased with itself.',
    'I checked on {answer} for you before bed. All present and twinkling.',
    "{name}, I've drawn {answer} on my chart in gold. Only your star gets gold.",
  ],
  boothoven: [
    "{name}, the piece is coming along! You asked for {answer}, and I've three pages.",
    'I played a few bars last night. All {answer}, as you asked. The candles flickered in time.',
    "I hummed your piece on the walk here. Still {answer}. It's getting very good.",
  ],
  scarah: [
    '{name}, I was thinking about {answer} this morning. The crows agree. Best season.',
    "You said {answer}. I've made a little mark on the barn calendar, so I'll know when to make a fuss.",
    '{name}, I counted the days to {answer}. Well, I tried. Cornelius ate the tally.',
  ],
};
