import type { ItemId } from '../types/ids';
import { hits, line, repeat, transpose, type Note, type Tune } from './tune';

/*
 * A tune for each of her records, original, in the style of the band it's named for
 * (personal_touches.md, "The finishing touches"): a country pluck, a dance-pop synth, a soft-rock
 * groove, a sweeping ballad, arena rock, calypso, and the indie dance-pop she dances to. No real
 * melody, lyric or sample is copied; only the styles are borrowed.
 */

export type RecordId = Extract<
  ItemId,
  | 'recordGhoulyParton'
  | 'recordLadyGhoulga'
  | 'recordFleetwoodMacabre'
  | 'recordScreamDion'
  | 'recordBoneJovi'
  | 'recordBoolafonte'
  | 'recordWalkTheTomb'
>;

/** Bars of four, one chord a bar: what each line below is built over. */
function bars(pattern: (chord: string) => string, chords: readonly string[]): Note[] {
  return chords.flatMap((chord, i) => line(pattern(chord), i * 4));
}

const drums = (kick: number[], snare: number[], hat: number[], count: number, loud = 1) => [
  { wave: 'kick' as const, notes: hits(kick, count), gain: 0.5 * loud },
  { wave: 'snare' as const, notes: hits(snare, count), gain: 0.22 * loud },
  { wave: 'hat' as const, notes: hits(hat, count), gain: 0.07 * loud },
];

// ---- Ghouly Parton: a bright country pluck, boom-chick bass, G major ----

const COUNTRY_CHORDS = [
  'G',
  'G',
  'C',
  'G',
  'G',
  'G',
  'D',
  'D',
  'G',
  'G',
  'C',
  'G',
  'C',
  'D',
  'G',
  'G',
];
const COUNTRY_ROOTS: Record<string, [string, string]> = {
  G: ['G2', 'D3'],
  C: ['C3', 'G2'],
  D: ['D3', 'A2'],
};
const COUNTRY_STRUM: Record<string, string> = { G: 'G3+B3+D4', C: 'G3+C4+E4', D: 'F#3+A3+D4' };

const GHOULY_PARTON: Tune = {
  bpm: 120,
  beats: 64,
  parts: [
    {
      wave: 'triangle',
      pluck: true,
      gain: 0.36,
      notes: line(
        'D4:.5 G4:.5 A4:.5 B4:1.5 A4:.5 G4:.5 B4:1 D5:1 B4:1 A4:1 ' +
          'G4:.5 E4:.5 G4:1 A4:1 G4:1 D4:2 -:2 ' +
          'D4:.5 G4:.5 A4:.5 B4:1.5 D5:.5 E5:.5 D5:2 B4:1 A4:1 ' +
          'A4:.5 B4:.5 A4:1 F#4:1 E4:1 D4:2 -:2 ' +
          'G4:1 B4:1 D5:1.5 B4:.5 D5:1 E5:1 D5:2 ' +
          'E5:1 D5:.5 C5:.5 B4:1 G4:1 B4:2 -:2 ' +
          'C5:1 E5:1 D5:1 C5:1 B4:1 A4:1 F#4:1 A4:1 ' +
          'G4:1 B4:.5 A4:.5 G4:1 D4:1 G4:3 -:1',
      ),
    },
    {
      wave: 'triangle',
      gain: 0.32,
      pluck: true,
      notes: bars(
        (c) => `${COUNTRY_ROOTS[c]![0]}:1 -:1 ${COUNTRY_ROOTS[c]![1]}:1 -:1`,
        COUNTRY_CHORDS,
      ),
    },
    {
      wave: 'square',
      gain: 0.05,
      pluck: true,
      notes: bars(
        (c) => `-:1 ${COUNTRY_STRUM[c]}:.5 -:1.5 ${COUNTRY_STRUM[c]}:.5 -:.5`,
        COUNTRY_CHORDS,
      ),
    },
    { wave: 'hat', notes: hits([1, 3], 16), gain: 0.05 },
  ],
};

// ---- Lady Ghoul-ga: four-on-the-floor dance-pop, a staccato synth hook, A minor ----

const POP_CHORDS = ['Am', 'F', 'C', 'G'];
const POP_BASS: Record<string, string> = { Am: 'A1', F: 'F1', C: 'C2', G: 'G1' };
const POP_PAD: Record<string, string> = {
  Am: 'A3+C4+E4',
  F: 'A3+C4+F4',
  C: 'G3+C4+E4',
  G: 'G3+B3+D4',
};
const octaveUp = (name: string) => name.replace(/\d$/, (d) => String(Number(d) + 1));

const LADY_GHOULGA: Tune = {
  bpm: 120,
  beats: 64,
  parts: [
    {
      wave: 'square',
      gain: 0.1,
      pluck: true,
      notes: repeat(
        line(
          'A4:.5 -:.5 A4:.5 C5:.5 -:.5 E5:.5 D5:.5 C5:.5 ' +
            '-:.5 C5:.5 -:.5 A4:1 G4:.5 A4:1 ' +
            'G4:.5 -:.5 G4:.5 C5:.5 -:.5 E5:.5 G5:.5 E5:.5 ' +
            'D5:1 B4:.5 G4:.5 D5:1.5 -:.5',
        ),
        4,
        16,
      ),
    },
    {
      wave: 'sawtooth',
      gain: 0.1,
      pluck: true,
      notes: repeat(
        bars((c) => `${POP_BASS[c]}:.5 ${octaveUp(POP_BASS[c]!)}:.5 `.repeat(4), POP_CHORDS),
        4,
        16,
      ),
    },
    {
      wave: 'sawtooth',
      gain: 0.035,
      attack: 0.05,
      release: 0.2,
      chorus: 12,
      notes: repeat(
        bars((c) => `${POP_PAD[c]}:4`, POP_CHORDS),
        4,
        16,
      ),
    },
    ...drums([0, 1, 2, 3], [1, 3], [0.5, 1.5, 2.5, 3.5], 16),
  ],
};

// ---- Fleetwood Mac-abre: a mellow soft-rock groove, driving eighth-note bass, D mixolydian ----

const SOFT_CHORDS = ['D', 'C', 'G', 'D'];
const SOFT_BASS: Record<string, string> = { D: 'D2', C: 'C2', G: 'G2' };
const SOFT_KEYS: Record<string, string> = { D: 'F#3+A3+D4', C: 'E3+G3+C4', G: 'D3+G3+B3' };

const FLEETWOOD_MACABRE: Tune = {
  bpm: 100,
  beats: 64,
  parts: [
    {
      wave: 'sine',
      gain: 0.17,
      attack: 0.03,
      release: 0.25,
      notes: repeat(
        line(
          'A4:1.5 F#4:.5 A4:1 B4:1 G4:2 E4:2 D4:1 G4:1 B4:1.5 A4:.5 F#4:4 ' +
            'A4:1 A4:.5 B4:.5 D5:1 B4:1 C5:1.5 B4:.5 G4:2 B4:1 A4:1 G4:1 E4:1 D4:4',
        ),
        2,
        32,
      ),
    },
    {
      wave: 'triangle',
      gain: 0.22,
      pluck: true,
      notes: repeat(
        bars((c) => `${SOFT_BASS[c]}:.5 `.repeat(8), SOFT_CHORDS),
        4,
        16,
      ),
    },
    {
      wave: 'triangle',
      gain: 0.06,
      attack: 0.02,
      release: 0.3,
      notes: repeat(
        bars((c) => `${SOFT_KEYS[c]}:2 ${SOFT_KEYS[c]}:2`, SOFT_CHORDS),
        4,
        16,
      ),
    },
    ...drums([0, 1.5, 2], [1, 3], [0, 0.5, 1, 1.5, 2, 2.5, 3, 3.5], 16, 0.8),
  ],
};

// ---- Scream Dion: a big sweeping ballad, piano and strings, and the key change ----

const BALLAD_CHORDS = ['C', 'Am', 'F', 'G', 'C', 'Am', 'F', 'G'];
const BALLAD_ARP: Record<string, string> = {
  C: 'C3 G3 C4 E4 G4 E4 C4 G3',
  Am: 'A2 E3 A3 C4 E4 C4 A3 E3',
  F: 'F2 C3 F3 A3 C4 A3 F3 C3',
  G: 'G2 D3 G3 B3 D4 B3 G3 D3',
};
const BALLAD_PAD: Record<string, string> = {
  C: 'C4+E4+G4',
  Am: 'A3+C4+E4',
  F: 'A3+C4+F4',
  G: 'B3+D4+G4',
};
const arp = (c: string) =>
  BALLAD_ARP[c]!.split(' ')
    .map((n, i) => `${n}${i === 0 ? ':.5' : ''}`)
    .join(' ');
const BALLAD_TUNE =
  'E4:1 G4:1 C5:1.5 B4:.5 A4:3 E4:1 F4:1 A4:1 C5:1 D5:1 D5:2 B4:2 ' +
  'E5:1.5 D5:.5 C5:1 G4:1 A4:1 C5:1 E5:2 F5:1.5 E5:.5 D5:1 C5:1 D5:3 -:1';
const BALLAD_LIFT = 'E5:1.5 D5:.5 C5:1 G4:1 A4:1 C5:1 E5:2 F5:1.5 E5:.5 D5:1 E5:1 C5:4';

const SCREAM_DION: Tune = {
  bpm: 66,
  beats: 48,
  parts: [
    {
      wave: 'sine',
      gain: 0.2,
      attack: 0.04,
      release: 0.4,
      notes: [...line(BALLAD_TUNE), ...transpose(line(BALLAD_LIFT, 32), 1)],
    },
    {
      wave: 'triangle',
      gain: 0.09,
      pluck: true,
      notes: [
        ...bars(arp, BALLAD_CHORDS),
        ...transpose(bars(arp, BALLAD_CHORDS.slice(0, 4)), 1).map((n) => ({ ...n, at: n.at + 32 })),
      ],
    },
    {
      wave: 'sawtooth',
      gain: 0.03,
      attack: 0.5,
      release: 0.8,
      chorus: 10,
      notes: [
        ...bars((c) => `${BALLAD_PAD[c]}:4`, BALLAD_CHORDS),
        ...transpose(
          bars((c) => `${BALLAD_PAD[c]}:4`, BALLAD_CHORDS.slice(0, 4)),
          1,
        ).map((n) => ({
          ...n,
          at: n.at + 32,
        })),
      ],
    },
    // The drums come in for the key change.
    { wave: 'kick', notes: hits([0, 2.5], 4).map((n) => ({ ...n, at: n.at + 32 })), gain: 0.4 },
    { wave: 'snare', notes: hits([1, 3], 4).map((n) => ({ ...n, at: n.at + 32 })), gain: 0.18 },
  ],
};

// ---- Bone Jovi: arena rock, chugging bass, big snare, and a lift into E major ----

const ROCK_CHORDS = [
  'Em',
  'C',
  'D',
  'Em',
  'Em',
  'C',
  'D',
  'Em',
  'C',
  'D',
  'Em',
  'Em',
  'C',
  'D',
  'E',
  'E',
];
const ROCK_ROOT: Record<string, string> = { Em: 'E2', E: 'E2', C: 'C2', D: 'D2' };
const ROCK_STAB: Record<string, string> = {
  Em: 'E3+G3+B3',
  E: 'E3+G#3+B3',
  C: 'E3+G3+C4',
  D: 'F#3+A3+D4',
};
const ROCK_HOOK =
  'E4:.5 G4:.5 A4:.5 B4:1.5 A4:.5 G4:.5 G4:1 E4:1 -:1 E4:.5 G4:.5 A4:1 F#4:1 D4:1 F#4:1 E4:3 -:1';

const BONE_JOVI: Tune = {
  bpm: 124,
  beats: 64,
  parts: [
    {
      wave: 'sawtooth',
      gain: 0.1,
      attack: 0.01,
      release: 0.12,
      notes: [
        ...repeat(line(ROCK_HOOK), 2, 16),
        ...line(
          'E5:1 D5:1 C5:1 B4:1 A4:1 B4:1 C5:1 D5:1 E5:2 B4:2 -:4 ' +
            'G4:1 C5:1 E5:1 G5:1 F#5:1 E5:1 D5:1 A4:1 G#4:1 B4:1 E5:2 E5:4',
          32,
        ),
      ],
    },
    {
      wave: 'square',
      gain: 0.06,
      pluck: true,
      notes: bars((c) => `${ROCK_ROOT[c]}:.5 `.repeat(8), ROCK_CHORDS),
    },
    {
      wave: 'square',
      gain: 0.04,
      chorus: 14,
      release: 0.15,
      notes: bars((c) => `${ROCK_STAB[c]}:1 -:3`, ROCK_CHORDS),
    },
    ...drums([0, 1.5, 2], [1, 3], [0, 0.5, 1, 1.5, 2, 2.5, 3, 3.5], 16, 1.1),
  ],
};

// ---- Boolafonte: calypso, a steel-drum lead over a skipping bass, F major ----

const CALYPSO_CHORDS = ['F', 'C', 'C', 'F', 'F', 'Bb', 'C', 'F'];
const CALYPSO_BASS: Record<string, [string, string]> = {
  F: ['F2', 'C3'],
  C: ['C2', 'G2'],
  Bb: ['Bb1', 'F2'],
};
const CALYPSO_STRUM: Record<string, string> = { F: 'A3+C4+F4', C: 'G3+C4+E4', Bb: 'Bb3+D4+F4' };

const BOOLAFONTE: Tune = {
  bpm: 112,
  beats: 64,
  parts: [
    {
      wave: 'sine',
      gain: 0.28,
      pluck: true,
      chorus: 7,
      notes: repeat(
        line(
          'C5:.5 A4:.5 C5:.5 F5:1 E5:.5 D5:.5 C5:.5 E5:1 C5:.5 G4:1 C5:1.5 ' +
            'D5:.5 E5:.5 D5:.5 C5:.5 Bb4:1 G4:1 A4:1.5 C5:.5 F4:2 ' +
            'A4:.5 C5:.5 F5:.5 A5:1 G5:.5 F5:1 D5:1 F5:.5 D5:1 Bb4:1.5 ' +
            'C5:.5 E5:.5 G5:1 E5:.5 C5:.5 G4:1 F5:2 -:2',
        ),
        2,
        32,
      ),
    },
    {
      wave: 'triangle',
      gain: 0.22,
      pluck: true,
      notes: repeat(
        bars((c) => {
          const [r, f] = CALYPSO_BASS[c]!;
          return `${r}:1.5 ${r}:.5 ${f}:1 ${r}:1`;
        }, CALYPSO_CHORDS),
        2,
        32,
      ),
    },
    {
      wave: 'triangle',
      gain: 0.05,
      pluck: true,
      notes: repeat(
        bars((c) => `-:.5 ${CALYPSO_STRUM[c]}:.5 `.repeat(4), CALYPSO_CHORDS),
        2,
        32,
      ),
    },
    { wave: 'hat', notes: hits([0, 1.5, 3], 16), gain: 0.09 },
    { wave: 'hat', notes: hits([0.5, 1, 2, 2.5, 3.5], 16), gain: 0.03 },
  ],
};

// ---- Walk the Tomb: bouncy indie dance-pop, claps and an octave bass. She dances to this one. ----

const DANCE_CHORDS = ['E', 'B', 'C#m', 'A'];
const DANCE_BASS: Record<string, string> = { E: 'E2', B: 'B1', 'C#m': 'C#2', A: 'A1' };
const DANCE_PAD: Record<string, string> = {
  E: 'G#3+B3+E4',
  B: 'F#3+B3+D#4',
  'C#m': 'G#3+C#4+E4',
  A: 'A3+C#4+E4',
};

const WALK_THE_TOMB: Tune = {
  bpm: 144,
  beats: 64,
  parts: [
    {
      wave: 'square',
      gain: 0.1,
      pluck: true,
      notes: repeat(
        line(
          'B4:.5 B4:.5 G#4:.5 B4:.5 -:.5 C#5:.5 B4:1 ' +
            'F#4:.5 F#4:.5 D#4:.5 F#4:.5 -:.5 G#4:.5 F#4:1 ' +
            'E4:.5 G#4:.5 C#5:.5 E5:1 C#5:.5 B4:.5 G#4:.5 ' +
            'A4:1 C#5:1 B4:1.5 -:.5',
        ),
        4,
        16,
      ),
    },
    {
      wave: 'square',
      gain: 0.07,
      pluck: true,
      notes: repeat(
        bars((c) => {
          const low = DANCE_BASS[c]!;
          return `${low}:.5 ${octaveUp(low)}:.5 `.repeat(4);
        }, DANCE_CHORDS),
        4,
        16,
      ),
    },
    {
      wave: 'sawtooth',
      gain: 0.03,
      attack: 0.05,
      release: 0.2,
      chorus: 12,
      notes: repeat(
        bars((c) => `${DANCE_PAD[c]}:2 ${DANCE_PAD[c]}:2`, DANCE_CHORDS),
        4,
        16,
      ).filter((n) => n.at >= 32),
    },
    ...drums([0, 1, 2, 3], [1, 3], [0.5, 1.5, 2.5, 3.5], 16, 1.1),
  ],
};

export const RECORD_TUNES: Record<RecordId, Tune> = {
  recordGhoulyParton: GHOULY_PARTON,
  recordLadyGhoulga: LADY_GHOULGA,
  recordFleetwoodMacabre: FLEETWOOD_MACABRE,
  recordScreamDion: SCREAM_DION,
  recordBoneJovi: BONE_JOVI,
  recordBoolafonte: BOOLAFONTE,
  recordWalkTheTomb: WALK_THE_TOMB,
};

export function isRecord(id: ItemId): id is RecordId {
  return id in RECORD_TUNES;
}
