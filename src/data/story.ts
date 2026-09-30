import type { FestivalId } from './calendar';

/**
 * The mayor's spooky story (0.2's J3, decision 156): four chapters over the Halloween Festival,
 * one a week. The first three come in the post; the last Wes drops as he scarpers, typed on the
 * mayor's typewriter, which is a step of the mystery. Each nods to one of her films
 * (personal_touches.md, question 46) in the game's own words: a stranded couple at a castle on a
 * stormy night with a dance everyone knows, a fuzzy little critter with rules, a mysterious phone
 * call answered with a giggle, and a film night to end on (question 31).
 */

/** The festival the story is told over. */
export const STORY_FESTIVAL: FestivalId = 'halloweenFestival';

export interface ChapterRow {
  /** The festival's day it's due on, from 1: a week apart. */
  day: number;
  /** Whether Wes drops it rather than the post bringing it. */
  wes?: true;
  /** The letter, `{name}` her name. */
  letter: string;
}

export const CHAPTERS: readonly ChapterRow[] = [
  {
    day: 1,
    letter:
      'Dear {name},\n\nIt is October, and in October the mayor tells a story. One chapter a week. ' +
      'Get cosy.\n\nA VERY SPOOKY STORY\nChapter One: The Castle on the Hill\n\nIt was a dark ' +
      'and stormy night, and two newlyweds (very much in love; you may know the type) had a flat ' +
      'tyre at the bottom of a hill. At the top of the hill was a castle with every window lit.\n\n' +
      '"We\'ll just ask to use the phone," they said.\n\nThe door was opened by a very tall ' +
      'butler holding a very small candle. Inside, the whole castle was dancing. Everybody knew ' +
      'the steps: a hop, a hop, a shuffle, a wiggle, and then all of it again, only louder. The ' +
      'newlyweds did not know the steps.\n\nBy the fourth time round, they did.\n\nTo be ' +
      'continued!\n\nWarmly,\nThe Mayor',
  },
  {
    day: 8,
    letter:
      'Dear {name},\n\nChapter Two: Three Rules\n\nIn the morning the storm had blown over, and ' +
      'the newlyweds found a little curio shop at the bottom of the hill. In its window sat the ' +
      'fuzziest critter they had ever seen, with enormous ears and a hum like a kettle. His name ' +
      'was Nibbles.\n\n"He\'s yours," said the shopkeeper, "but there are three rules. No bright ' +
      'lights. No water. And never, ever feed him after midnight."\n\nThey promised. They meant ' +
      'it.\n\nAt five to midnight they found Nibbles sitting by the biscuit tin, looking at a ' +
      'biscuit. The biscuit looked back. Somewhere, a clock began to strike.\n\nTo be continued!' +
      '\n\nWarmly,\nThe Mayor',
  },
  {
    day: 15,
    letter:
      "Dear {name},\n\nChapter Three: The Call\n\nThat night the castle's telephone rang. It " +
      'rang and rang, the old kind with a bell, until one of the newlyweds picked it up.\n\n' +
      'A voice, very low: "What\'s your favourite scary movie?"\n\nThe newlyweds looked at each ' +
      'other. "Oh, that\'s easy," said one. "The one with the friendly ghost."\n\nThere was a ' +
      'long pause on the line. Then the most enormous giggle.\n\n"Mine too," said the voice, and ' +
      'hung up.\n\nWho was it? To be continued!\n\nWarmly,\nThe Mayor',
  },
  {
    day: 22,
    wes: true,
    letter:
      "Dear {name},\n\nChapter Four: The Friendly Ghost\n\nIt was Nibbles on the phone.\n\nHe'd " +
      'had the biscuit (just the one, and it was a very small biscuit), and instead of anything ' +
      'dreadful he had gone all giggly and wanted a film night. So the castle hung a sheet ' +
      'between two towers, the butler made popcorn, and everybody (the newlyweds, Nibbles, and ' +
      'the whole dancing castle) watched the friendly ghost film together, and did the dance in ' +
      'the interval.\n\nThe End.\n\nHappy Halloween, {name}.\n\nWarmly,\nThe Mayor\n\nP.S. My ' +
      "typewriter's W is sticking again. Wonder why.",
  },
];

/** She finds the last chapter where Wes was a moment ago. */
export const WES_DROPPED =
  'Wes scarpers, and drops something as he goes: typed pages tied up with string. "Chapter ' +
  'Four." You tuck them in with your letters to read.';
