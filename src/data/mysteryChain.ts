import type { PropId } from '../types/ids';
import type { ClueId, ClueRow } from './mystery';

/**
 * The mystery, chapter by chapter (V1's P3a, decision 302): after the mayor's second letter, a
 * letter or a clue about a week apart, each a week from the day she read or found the one before,
 * building toward a mayor who is a ghost, and shy, not sinister. The last is the mayor's promise
 * to say hello, which leaves one pin on her corkboard for the unmasking (P3b's).
 */
export type ChainClueId =
  'wobblyLetter' | 'sash' | 'goodEnvelopes' | 'stamp' | 'assistant' | 'typing' | 'promise';

export const CHAIN_CLUES: Record<ChainClueId, ClueRow> = {
  wobblyLetter: {
    title: "The mayor's wobbly letter",
    note:
      'The mayor admits to being shy. Shy! The ink wobbles all the way down the page, as if ' +
      'their hand was shaking. Or as if their hand was a tiny bit see-through?',
    hint: 'Wait for the mayor to write again.',
  },
  sash: {
    title: 'A sash on the noticeboard',
    note:
      "Pinned up in the square: 'FOUND by the well, one sash.' It says MAYOR in gold letters, " +
      "and it's cold to the touch, as if it was last worn by someone made of fog.",
    hint: 'Have a look at the noticeboard in the square.',
  },
  goodEnvelopes: {
    title: 'The Moon Pie Man, cleared',
    note:
      'The mayor vouches for him: he only sells them their envelopes, and has never been mayor ' +
      "of anything. One suspect down. He's so relieved he's been humming all week.",
    hint: 'Wait for the mayor to write again.',
    clears: 'moonPieMan',
  },
  stamp: {
    title: 'A rubber stamp',
    note:
      "Skelly is holding a rubber stamp in his bony fingers, and won't say where he got it. " +
      '(He never says anything.) It reads APPROVED, R.B., MAYOR. R.B.! Rufus and Barty both ' +
      "say it wasn't them.",
    hint: 'Say hello to Skelly by your door.',
  },
  assistant: {
    title: "Wes, the mayor's assistant",
    note:
      'The mayor says Wes has been checking the town is ready for a surprise. All that lurking ' +
      'was assisting! Wes, cleared. (He says he will keep lurking. It is a habit now.)',
    hint: 'Wait for the mayor to write again.',
    clears: 'wes',
  },
  typing: {
    title: 'Typing by the well',
    note:
      "Click-clack, ding! Typing, from somewhere by the well, though there's nobody there. Then " +
      "a tiny 'oh no, not the W again', and a sigh like a draught under a door.",
    hint: 'Listen by the well in the square.',
  },
  promise: {
    title: "The mayor's promise",
    note:
      'The mayor is going to say hello, in person, with everyone there. Soon. They promised. ' +
      'One pin left on the board.',
    hint: 'Wait for the mayor to write again.',
  },
};

/** A step of the chain: a mayor's letter, which pins its clue as she reads it, or a clue to find. */
export type ChainStep = { clue: ChainClueId; letter: string } | { clue: ChainClueId; at: PropId };

/** The clue the chain follows on from: the mayor's second letter, read. */
export const CHAIN_AFTER: ClueId = 'typewriter';

/** Days from reading or finding one step to the next coming. */
export const CHAIN_DAYS = 7;

/** In order. `{name}` in a letter is her name. */
export const CHAIN: readonly ChainStep[] = [
  {
    clue: 'wobblyLetter',
    letter:
      'Dear {name},\n\nI have been meaning to write for weeks. I started this letter four ' +
      'times. The first three are in the bin, and the bin is now very well informed.\n\nThe ' +
      'truth is, I am a little shy. Not mysterious-shy. Just shy-shy. Whenever I think of ' +
      'knocking on your door, my knees go wobbly. Wobblier than usual, I mean.\n\nI am working ' +
      'on it. I have a book about it.\n\nWarmly, and wobbly,\nThe Mayor\n\nP.S. Has anyone ' +
      'handed in a sash?',
  },
  {
    clue: 'sash',
    at: 'noticeboard',
  },
  {
    clue: 'goodEnvelopes',
    letter:
      'Dear {name},\n\nMy sash came home in the post, folded very nicely. Thank you! I hear ' +
      'it was pinned up in the square for everyone to see. Everyone. I had to have a little ' +
      'lie down.\n\nAlso, I understand there are envelopes behind the moon pies, and that ' +
      'people have wondered. The Moon Pie Man sells me my envelopes. He is a lovely man and ' +
      'an excellent supplier of envelopes, and he has never been mayor of anything. He would ' +
      'hate it. He told me so.\n\nWarmly,\nThe Mayor',
  },
  {
    clue: 'stamp',
    at: 'skelly',
  },
  {
    clue: 'assistant',
    letter:
      'Dear {name},\n\nI believe you have met Wes. Or nearly met him. Or seen his hat go ' +
      'behind a tree.\n\nWes is my assistant. I asked him to make sure the town was ready for ' +
      "something. I can't say what. It's a surprise, and I'm not ready, and he says I'm the " +
      "one who isn't ready. He is very good at checking and very bad at hiding. I have told " +
      "him so, kindly.\n\nPlease don't be cross with him. He knitted me a scarf once.\n\n" +
      'Warmly,\nThe Mayor\n\nP.S. The W on my typewriter sticks. I know. I have always known.',
  },
  {
    clue: 'typing',
    at: 'well',
  },
  {
    clue: 'promise',
    letter:
      'Dear {name},\n\nI have decided. I am going to say hello. Properly, in person, with ' +
      'everyone there, before I can change my mind.\n\nWes is pressing my sash. The castle ' +
      'has been told. I have practised my wave in the mirror. (Very little of me shows up in ' +
      "the mirror. That's another thing I'll explain.)\n\nSoon. I promise. Please don't make " +
      'a fuss. Or make a small one. A small fuss would be lovely.\n\nWarmly, and nearly ' +
      'ready,\nThe Mayor',
  },
];

/** The last clue of the chain: once it's pinned, the mayor is ready to be met (P3b). */
export const CHAIN_LAST: ChainClueId = 'promise';

/**
 * The one pin left on her corkboard once the chain is done, for the unmasking (P3b replaces it
 * with the clue it pins).
 */
export const LAST_PIN = {
  title: '???',
  waiting: 'One pin left. Whoever the mayor is, they belong right here.',
  ready: 'One pin left. The mayor has promised to say hello, in person, soon.',
};
