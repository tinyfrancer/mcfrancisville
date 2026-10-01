/**
 * What plays when she walks up to it (0.2's G2, decision 190): a `plays` on a furniture or fixture
 * row names its instrument, and each tune here is a row, played in turn. The notes are
 * `audio/pianos.ts`; nothing here makes a sound.
 */
export type Instrument = 'piano' | 'musicBox';

export type TuneId =
  | 'hushUpAndDance'
  | 'moonbiteSonata'
  | 'furElise'
  | 'skeletonRag'
  | 'firstDance'
  // Boothoven's lessons, in the order he teaches them (0.2's L2).
  | 'lanternWaltz'
  | 'cobwebNocturne'
  | 'belfryBoogie'
  | 'phantomGalop'
  | 'foreverOrbs';

export interface TuneRow {
  name: string;
  instrument: Instrument;
  /** What she hears or thinks as it plays. */
  line: string;
  /**
   * Not known from the start (0.2's L2): one Boothoven teaches her at a `lesson`, in turn, or the
   * `duet` they play at the castle hall on her anniversary. Once learnt, every piano plays it.
   */
  learnt?: 'lesson' | 'duet';
  /** What Boothoven says as he teaches it, or as they play it together. `{name}` is her name. */
  taught?: string;
}

/**
 * The tunes, in the order each instrument plays them. Her pick, a tune like "Shut Up and Dance"
 * (personal_touches.md, 32), is first on the piano; the hall's music box plays their first dance.
 */
export const TUNES: Record<TuneId, TuneRow> = {
  hushUpAndDance: {
    name: 'Hush Up and Dance',
    instrument: 'piano',
    line: 'You play "Hush Up and Dance" on the piano, and your feet will not keep still.',
  },
  moonbiteSonata: {
    name: 'Moonbite Sonata',
    instrument: 'piano',
    line: 'You play the "Moonbite Sonata", soft and slow. Somewhere, a bat sighs happily.',
  },
  furElise: {
    name: 'Fur Elise',
    instrument: 'piano',
    line: 'You play "Fur Elise", a werewolf\'s love song. It is very fluffy.',
  },
  skeletonRag: {
    name: 'Skeleton Rag',
    instrument: 'piano',
    line: 'You bang out the "Skeleton Rag". Rattle, rattle, plink!',
  },
  firstDance: {
    name: 'Your first dance',
    instrument: 'musicBox',
    line: 'You lift the lid, and two tiny dancers turn to your first dance. Cody always hums along, a little off.',
  },
  lanternWaltz: {
    name: 'Lantern Waltz',
    instrument: 'piano',
    line: 'You play the "Lantern Waltz", one-two-three, and the candle flames sway along.',
    learnt: 'lesson',
    taught:
      'Sit, sit! Today, a waltz. One, two, three; one, two, three. Your left hand is the floor, {name}, and your right hand dances on it. There! You have it!',
  },
  cobwebNocturne: {
    name: 'Cobweb Nocturne',
    instrument: 'piano',
    line: 'You play the "Cobweb Nocturne", soft as a spider\'s thread. Even the moths hush.',
    learnt: 'lesson',
    taught:
      'A nocturne, {name}: music for the middle of the night. Play it as if the whole house is asleep and you are the only one awake. Gently. Gently. Bellissimo.',
  },
  belfryBoogie: {
    name: 'Belfry Boogie',
    instrument: 'piano',
    line: 'You play the "Belfry Boogie", and somewhere up high a whole belfry of bats starts bopping.',
    learnt: 'lesson',
    taught:
      "Now something with a wiggle! The left hand walks, walks, walks, and the right hand doesn't care where it's going. Boogie, {name}! Ha! The bats are dancing!",
  },
  phantomGalop: {
    name: 'Phantom Galop',
    instrument: 'piano',
    line: 'You gallop through the "Phantom Galop", fast as a ghost train, and finish out of breath.',
    learnt: 'lesson',
    taught:
      "My last lesson, {name}, and my fastest. A galop! Hold on to your hat. Faster! Faster! Oh, bravissimo. There's nothing left I can teach you. Only things to play together.",
  },
  foreverOrbs: {
    name: 'Forever Orbs',
    instrument: 'piano',
    line: 'You play "Forever Orbs", your duet with Boothoven, and it still sounds like the two of you.',
    learnt: 'duet',
    taught:
      'Happy anniversary, {name}. I wrote this for you both: two hands for you, two for me, and it\'s called "Forever Orbs". Ready? One, two…',
  },
};

export const TUNE_IDS = Object.keys(TUNES) as TuneId[];

/** The tunes an instrument plays, in turn: those known from the start, and any she has learnt. */
export function tunesOf(instrument: Instrument, learnt: readonly TuneId[] = []): TuneId[] {
  return TUNE_IDS.filter(
    (id) => TUNES[id].instrument === instrument && (!TUNES[id].learnt || learnt.includes(id)),
  );
}

/** Boothoven's lessons, in the order he teaches them. */
export const LESSONS: readonly TuneId[] = TUNE_IDS.filter((id) => TUNES[id].learnt === 'lesson');

/** The tune they play together at the castle hall on her anniversary. */
export const DUET: TuneId = 'foreverOrbs';
