import type { TuneId } from '../data/instruments';
import { musicBox, THEMES } from './music';
import { line, type Note, type Part, type Tune } from './tune';

/*
 * What her piano plays, and the hall's music box (0.2's G2, decision 190). Every melody is the
 * game's own: "Hush Up and Dance" is in the style of the indie dance-pop she picked (question 32),
 * the sonata, the waltz and the rag in the styles they're named for. No real melody is copied.
 */

/** One chord a bar: the left hand's pattern for each, laid end to end. */
function bars(pattern: (chord: string) => string, chords: readonly string[], metre = 4): Note[] {
  return chords.flatMap((chord, i) => line(pattern(chord), i * metre));
}

/** A piano: a bright pluck in the right hand, an octave's shimmer over it, a rounder left hand. */
function piano(bpm: number, beats: number, right: Note[], left: Note[], comp?: Note[]): Tune {
  const parts: Part[] = [
    { wave: 'triangle', notes: right, gain: 0.32, pluck: true, release: 0.3 },
    {
      wave: 'sine',
      notes: right.map((n) => ({ ...n, pitch: n.pitch + 12 })),
      gain: 0.05,
      pluck: true,
    },
    { wave: 'triangle', notes: left, gain: 0.24, pluck: true, release: 0.25 },
  ];
  if (comp) parts.push({ wave: 'triangle', notes: comp, gain: 0.08, pluck: true });
  return { bpm, beats, parts };
}

// ---- Hush Up and Dance: indie dance-pop, pumping octaves, D major ----

const DANCE_CHORDS = ['D', 'A', 'Bm', 'G', 'D', 'A', 'Bm', 'G'];
const DANCE_ROOTS: Record<string, [string, string]> = {
  D: ['D2', 'D3'],
  A: ['A1', 'A2'],
  Bm: ['B1', 'B2'],
  G: ['G1', 'G2'],
};
const DANCE_STAB: Record<string, string> = {
  D: 'D4+F#4+A4',
  A: 'C#4+E4+A4',
  Bm: 'D4+F#4+B4',
  G: 'D4+G4+B4',
};
const DANCE_MELODY =
  'F#5:.5 F#5 E5 D5 -:.5 A4 D5:1 ' +
  'E5:.5 E5 C#5 A4 -:.5 E5 C#5:1 ' +
  'D5:.5 D5 B4 F#4 -:.5 B4 D5 F#5 ' +
  'G5:1 F#5:.5 E5 D5:1 -:1 ' +
  'A5:.5 A5 F#5 D5 -:.5 F#5 A5:1 ' +
  'A5:.5 G5 E5 C#5 -:.5 C#5 E5:1 ' +
  'F#5:.5 E5 D5 B4 D5 E5 F#5:1 ' +
  'G5:1 E5:1 D5:2';

const HUSH_UP_AND_DANCE = piano(
  128,
  64,
  [...line(DANCE_MELODY), ...line(DANCE_MELODY, 32)],
  bars(
    (c) => `${DANCE_ROOTS[c]![0]}:.5 ${DANCE_ROOTS[c]![1]}:.5 `.repeat(4),
    [...DANCE_CHORDS, ...DANCE_CHORDS],
  ),
  bars(
    (c) => `-:1 ${DANCE_STAB[c]}:.5 -:1.5 ${DANCE_STAB[c]}:.5 -:.5`,
    [...DANCE_CHORDS, ...DANCE_CHORDS],
  ),
);

// ---- The Moonbite Sonata: slow and soft, rolling eighths under a long line, A minor ----

const SONATA_CHORDS = ['Am', 'F', 'Dm', 'E', 'Am', 'F', 'E', 'Am'];
const SONATA_ROLL: Record<string, [string, string, string]> = {
  Am: ['A3', 'C4', 'E4'],
  F: ['A3', 'C4', 'F4'],
  Dm: ['A3', 'D4', 'F4'],
  E: ['G#3', 'B3', 'E4'],
};
const SONATA_BASS: Record<string, string> = { Am: 'A2', F: 'F2', Dm: 'D2', E: 'E2' };

const MOONBITE_SONATA = piano(
  72,
  32,
  line(
    'E5:3 C5:1 C5:2 A4:2 D5:1.5 E5:.5 F5:2 E5:3 -:1 ' +
      'A5:2 G5:1 E5:1 F5:2 E5:1 D5:1 B4:2 D5:1 G#4:1 A4:4',
  ),
  bars((c) => `${SONATA_BASS[c]}:4`, SONATA_CHORDS),
  bars((c) => {
    const [low, mid, high] = SONATA_ROLL[c]!;
    return `${low}:.5 ${mid} ${high} ${mid} `.repeat(2);
  }, SONATA_CHORDS),
);

// ---- Fur Elise: a fluffy waltz, root and two chords a bar, G major ----

const WALTZ_CHORDS = [
  'G',
  'Em',
  'C',
  'D',
  'G',
  'Em',
  'Am',
  'D',
  'C',
  'G',
  'Am',
  'D',
  'G',
  'Em',
  'D',
  'G',
];
const WALTZ_ROOT: Record<string, string> = { G: 'G2', Em: 'E2', C: 'C3', D: 'D3', Am: 'A2' };
const WALTZ_CHORD: Record<string, string> = {
  G: 'G3+B3+D4',
  Em: 'G3+B3+E4',
  C: 'G3+C4+E4',
  D: 'F#3+A3+D4',
  Am: 'A3+C4+E4',
};

const FUR_ELISE = piano(
  132,
  48,
  line(
    'B4:1 D5 G5 F#5:1.5 E5:.5 B4:1 C5 E5 G5 F#5:2 D5:1 ' +
      'B4 D5 G5 A5:1.5 G5:.5 E5:1 C5 E5 A5 G5 F#5 D5 ' +
      'E5 G5 C6 B5:1.5 A5:.5 G5:1 A5 E5 C5 D5:2 F#5:1 ' +
      'G5 B5 D6 B5 G5 E5 F#5 A5 F#5 G5:3',
  ),
  bars((c) => `${WALTZ_ROOT[c]}:1 ${WALTZ_CHORD[c]} ${WALTZ_CHORD[c]}`, WALTZ_CHORDS, 3),
);

// ---- The Skeleton Rag: a stride left hand under a syncopated tune, C major ----

const RAG_CHORDS = [
  'C',
  'C',
  'G7',
  'G7',
  'C',
  'C7',
  'F',
  'F',
  'C',
  'A7',
  'D7',
  'G7',
  'C',
  'G7',
  'C',
  'C',
];
const RAG_BASS: Record<string, [string, string]> = {
  C: ['C2', 'G2'],
  G7: ['G1', 'D2'],
  C7: ['C2', 'G2'],
  F: ['F2', 'C2'],
  A7: ['A1', 'E2'],
  D7: ['D2', 'A2'],
};
const RAG_CHORD: Record<string, string> = {
  C: 'E3+G3+C4',
  G7: 'F3+B3+D4',
  C7: 'E3+Bb3+C4',
  F: 'F3+A3+C4',
  A7: 'E3+G3+C#4',
  D7: 'F#3+A3+C4',
};

const SKELETON_RAG = piano(
  132,
  64,
  line(
    'E5:.5 G5 -:.5 E5 G5 A5 G5:1 E5:.5 C5 -:.5 C5 D5 E5 C5:1 ' +
      'D5:.5 F5 -:.5 D5 F5 G5 F5:1 D5:.5 B4 -:.5 B4 C5 D5 B4:1 ' +
      'E5:.5 G5 -:.5 E5 G5 C6 G5:1 Bb5:.5 G5 -:.5 E5 G5 Bb5 G5:1 ' +
      'A5:.5 F5 -:.5 C5 F5 A5 C6:1 A5:1 G5 F5:2 ' +
      'E5:.5 G5 -:.5 C6 G5 E5 C5:1 C#5:.5 E5 -:.5 A5 G5 E5 C#5:1 ' +
      'D5:.5 F#5 -:.5 A5 C6 A5 F#5:1 G5:.5 F5 D5 B4 G4:1 -:1 ' +
      'E5:.5 G5 -:.5 E5 G5 A5 G5:1 F5:.5 D5 -:.5 B4 D5 F5 D5:1 ' +
      'C5:.5 E5 G5 C6 -:.5 G5 C6:1 C6:1 G5:.5 E5 C5:1 -:1',
  ),
  bars((c) => {
    const [root, fifth] = RAG_BASS[c]!;
    return `${root}:1 ${RAG_CHORD[c]} ${fifth} ${RAG_CHORD[c]}`;
  }, RAG_CHORDS),
);

/** Each tune's notes. The music box plays their first dance, the hall's own tune, on its tines. */
export const PIANO_TUNES: Record<TuneId, Tune> = {
  hushUpAndDance: HUSH_UP_AND_DANCE,
  moonbiteSonata: MOONBITE_SONATA,
  furElise: FUR_ELISE,
  skeletonRag: SKELETON_RAG,
  firstDance: musicBox(THEMES.castleHall),
};
