/**
 * What plays when she walks up to it (0.2's G2, decision 190): a `plays` on a furniture or fixture
 * row names its instrument, and each tune here is a row, played in turn. The notes are
 * `audio/pianos.ts`; nothing here makes a sound.
 */
export type Instrument = 'piano' | 'musicBox';

export type TuneId =
  'hushUpAndDance' | 'moonbiteSonata' | 'furElise' | 'skeletonRag' | 'firstDance';

export interface TuneRow {
  name: string;
  instrument: Instrument;
  /** What she hears or thinks as it plays. */
  line: string;
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
};

export const TUNE_IDS = Object.keys(TUNES) as TuneId[];

/** The tunes an instrument plays, in turn. */
export function tunesOf(instrument: Instrument): TuneId[] {
  return TUNE_IDS.filter((id) => TUNES[id].instrument === instrument);
}
