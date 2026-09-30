/**
 * The case of the mayor nobody has met (decisions.md 19): the mayor's letters, the clues she pins to
 * her corkboard, and who they point at. v0 ships the first few clues; the reveal is later work.
 */

export type ClueId = 'welcome' | 'rumour' | 'button' | 'visitorBook' | 'wrapper' | 'typewriter';

export type SuspectId = 'wes' | 'moonPieMan';

export interface ClueRow {
  /** On its card. */
  title: string;
  /** What she noticed. Silly, never sinister. */
  note: string;
  /** Where to look, while it's still a question mark on the board. */
  hint: string;
  /** Who it points at, if anyone. */
  points?: SuspectId;
}

/** In the order they're pinned up, which is roughly the order she finds them. */
export const CLUES: Record<ClueId, ClueRow> = {
  welcome: {
    title: "The mayor's letter",
    note: "Typed on an old typewriter and signed only 'The Mayor'. Nobody in town has ever met them.",
    hint: 'Read your first letter.',
  },
  rumour: {
    title: 'A name: Wes',
    note:
      'A neighbour leaned in close: a man called Wes is always lurking about. Trench coat, hat ' +
      'pulled low. Nobody knows where he lives.',
    hint: 'Get to know a neighbour.',
    points: 'wes',
  },
  button: {
    title: 'A trench-coat button',
    note: "Found right where Wes was lurking, a moment after he wasn't. Big, brown, and very suspicious.",
    hint: "Catch Wes lurking. He's very bad at hiding.",
    points: 'wes',
  },
  visitorBook: {
    title: "The museum's visitor book",
    note:
      "One entry, dated the middle of the night: 'Lovely critters. —M.' M for Mayor? M for Moon " +
      'Pie Man? M for… Maude? (Maude says no.)',
    hint: 'Catch five kinds of critter.',
  },
  wrapper: {
    title: 'A stack of envelopes',
    note:
      "Tucked behind the moon pies on his cart: envelopes exactly like the mayor's. He says he " +
      'just likes envelopes.',
    hint: 'Buy something from the Moon Pie Man.',
    points: 'moonPieMan',
  },
  typewriter: {
    title: "The mayor's second letter",
    note:
      'The same typewriter, and its W sticks: every W is a little darker than the rest. W… for ' +
      'Wes?',
    hint: 'Wait for the mayor to write again.',
    points: 'wes',
  },
};

export const CLUE_IDS = Object.keys(CLUES) as ClueId[];

export interface SuspectRow {
  name: string;
  note: string;
}

export const SUSPECTS: Record<SuspectId, SuspectRow> = {
  wes: {
    name: 'Wes',
    note: 'Always lurking. Always sneaking. Extremely bad at it.',
  },
  moonPieMan: {
    name: 'The Moon Pie Man',
    note: 'Turns up on random days with his cart. Where does he go the rest of the time?',
  },
};

/** How many kinds of critter she has caught when the visitor book turns up. */
export const VISITOR_BOOK_CRITTERS = 5;

/** How many days after the mayor's first letter the second one comes. */
export const SECOND_LETTER_DAYS = 7;

/**
 * The mayor's letters, by their number in the letter id (`mayor:0`, `mayor:1`), each pinning a
 * clue when she reads it.
 */
export const MAYOR_LETTERS: readonly { letter: string; clue: ClueId }[] = [
  {
    letter:
      'Dear {name},\n\nWelcome to McFrancisVille! The house with the bat on the door is yours, and ' +
      'everything in it. The neighbours are lovely, the pumpkins are enormous, and nothing here ' +
      "ever wilts.\n\nI'm so sorry I couldn't be there to meet you. Being mayor keeps me terribly " +
      'busy. We will meet soon. Probably.\n\nWarmly,\nThe Mayor\n\nP.S. If you see a man in a ' +
      "trench coat behind a tree, don't mind him.",
    clue: 'welcome',
  },
  {
    letter:
      'Dear {name},\n\nA whole week! Everyone says you are settling in beautifully. I hear ' +
      "everything. It's a mayor thing.\n\nI still can't come by, I'm afraid. Mayoral business. " +
      'Very important. Very secret.\n\nWarmly, as ever,\nThe Mayor\n\nP.S. Wonderful weather ' +
      "we're having. A little spooky. Just how I like it.",
    clue: 'typewriter',
  },
];

/**
 * What she finds where Wes was a moment ago, after the first time, when his button is already on
 * her board.
 */
export const WES_GONE: readonly string[] = [
  'Wes was right here a second ago! Now there is only a tree, looking very innocent.',
  'Gone again! Nobody behind the tree but a beetle. Wes is getting quicker.',
  'The leaves rustle, and the tip of a hat ducks out of sight. Wes, is that you?',
  'Wes has scarpered. Somewhere nearby, someone trips over a root and says "oof".',
];
