import type { FestivalId } from '../data/calendar';
import type { SpecialDayId } from '../data/specialDays';
import type { DecorId } from '../data/holidays';
import type { DayWindow } from '../data/windows';
import type { ZoneId } from '../types/ids';
import { hits, line, midi, type Note, type Part, type Tune } from './tune';

/*
 * The music behind everything (0.2's H1): a tune for each place, played three ways by the window
 * of the day. Each is a row here, a melody over a chord a bar and a feel for how the chords go
 * under it; `arrange` writes the parts. Every melody is the game's own; the castle's hall borrows
 * only the strum and the ringing top notes of their first dance, never its tune.
 */

/** Where a tune belongs: each place outdoors, her home, the hall, and the rest indoors. */
export type Place =
  | 'town'
  | 'whisperwood'
  | 'lanternShore'
  | 'castleHill'
  | 'hiddenClearing'
  | 'fairground'
  | 'booAcres'
  | 'home'
  | 'indoors'
  | 'castleHall';

/**
 * The fountain's own tune, and Christmas's in town (0.2's H2); and their song day's, in town on
 * 21 September (0.2's D2).
 */
export type ThemeId = Place | FestivalId | 'fountain' | 'christmas' | 'septemberSong';

/** How a theme is played: as the window's music, or on the fountain's music box (0.2's H2). */
export type Arrangement = DayWindow | 'musicBox';

/** What plays: a theme, in an arrangement. */
export type MusicKey = `${ThemeId}@${Arrangement}`;

/**
 * How the chords go under the melody: the town's waltz, the festival's oom-pah, the woods' rippling
 * arpeggio, the lake's rocking eighths, the castle's lute, the clearing's held bells, and the
 * hall's strum.
 */
type Feel = 'waltz' | 'oompah' | 'ripple' | 'rock' | 'lute' | 'chime' | 'strum' | 'sleigh';

interface Theme {
  bpm: number;
  /** Beats to a bar. */
  metre: 3 | 4;
  /** A chord a bar, each a key in `CHORDS`. */
  chords: readonly string[];
  /** The melody, bar by bar between `|`s, in `line`'s notation. */
  melody: string;
  feel: Feel;
}

/** Each chord's bass note and the notes played above it. */
const CHORDS: Record<string, [bass: string, voicing: string]> = {
  Am: ['A2', 'A3+C4+E4'],
  B: ['B2', 'B3+D#4+F#4'],
  Bb: ['Bb2', 'Bb3+D4+F4'],
  C: ['C3', 'G3+C4+E4'],
  Cmaj7: ['C3', 'G3+B3+E4'],
  D: ['D3', 'F#3+A3+D4'],
  Dm: ['D2', 'A3+D4+F4'],
  E: ['E2', 'G#3+B3+E4'],
  Em: ['E2', 'G3+B3+E4'],
  F: ['F2', 'A3+C4+F4'],
  G: ['G2', 'G3+B3+D4'],
  Gm: ['G2', 'G3+Bb3+D4'],
  A: ['A2', 'A3+C#4+E4'],
  A7: ['A2', 'G3+C#4+E4'],
  D7: ['D3', 'F#3+C4+D4'],
  // The hall's, each with E and A ringing on top, as a strummed guitar's open strings would.
  'F#m7 ring': ['F#2', 'C#4+E4+A4'],
  'A ring': ['A2', 'C#4+E4+A4'],
  'Esus4 ring': ['E2', 'B3+E4+A4'],
  'B7sus4 ring': ['B2', 'F#3+E4+A4'],
};

export const THEMES: Record<ThemeId, Theme> = {
  // The music-box waltz the town has always had.
  town: {
    bpm: 88,
    metre: 3,
    feel: 'waltz',
    chords: ['Am', 'Am', 'F', 'F', 'C', 'C', 'E', 'E', 'Am', 'Am', 'F', 'F', 'C', 'G', 'Am', 'Am'],
    melody:
      'A4:1 C5:1 E5:1 | D5:2 C5:1 | C5:1 A4:1 F4:1 | A4:3 | ' +
      'G4:1 C5:1 E5:1 | F5:1.5 E5:.5 D5:1 | B4:1 D5:1 G#4:1 | B4:3 | ' +
      'A4:1 C5:1 E5:1 | A5:2 G5:1 | F5:1 E5:1 C5:1 | D5:3 | ' +
      'E5:1 D5:1 C5:1 | B4:1 D5:1 G4:1 | A4:2 E4:1 | A4:3',
  },
  // Old trees and a frozen creek: a slow waltz over a rippling arpeggio, like a stream.
  whisperwood: {
    bpm: 76,
    metre: 3,
    feel: 'ripple',
    chords: [
      'Dm',
      'Dm',
      'C',
      'C',
      'Bb',
      'Bb',
      'C',
      'C',
      'Dm',
      'Dm',
      'F',
      'F',
      'Gm',
      'A',
      'Dm',
      'Dm',
    ],
    melody:
      'D5:2 F5:1 | E5:1 D5:1 A4:1 | G4:1.5 A4:.5 C5:1 | E5:3 | ' +
      'D5:2 F5:1 | E5:1 D5:1 Bb4:1 | C5:1 E5:1 G5:1 | E5:2 -:1 | ' +
      'A5:2 F5:1 | E5:1 F5:1 D5:1 | C5:1.5 D5:.5 F5:1 | A4:3 | ' +
      'Bb4:1 D5:1 G5:1 | E5:1 C#5:1 A4:1 | D5:1 F5:.5 E5:.5 D5:1 | D5:3',
  },
  // The lake and its floating lanterns: a boat song, rocking.
  lanternShore: {
    bpm: 72,
    metre: 4,
    feel: 'rock',
    chords: ['F', 'F', 'C', 'C', 'Dm', 'Dm', 'Bb', 'C', 'F', 'F', 'Am', 'Am', 'Bb', 'Gm', 'C', 'F'],
    melody:
      'A4:2 C5:1 F5:1 | E5:1.5 D5:.5 C5:2 | G4:2 C5:1 E5:1 | D5:3 -:1 | ' +
      'F5:2 E5:1 D5:1 | A4:3 -:1 | Bb4:1 D5:1 F5:1 D5:1 | E5:2 G5:2 | ' +
      'A5:2 G5:1 F5:1 | C5:3 -:1 | E5:2 C5:1 A4:1 | G4:1.5 A4:.5 C5:2 | ' +
      'D5:2 F5:1 D5:1 | Bb4:2 G4:2 | C5:1 E5:1 G5:1 E5:1 | F5:4',
  },
  // Up to Castle Mac-A-Boo: a stately air on a lute.
  castleHill: {
    bpm: 84,
    metre: 4,
    feel: 'lute',
    chords: ['Am', 'G', 'F', 'E', 'Am', 'G', 'F', 'E', 'C', 'G', 'Am', 'E', 'F', 'E', 'Am', 'Am'],
    melody:
      'E5:2 A5:2 | G5:1 F5:1 E5:1 D5:1 | C5:2 A4:2 | B4:3 -:1 | ' +
      'C5:1 B4:1 A4:1 C5:1 | D5:2 B4:2 | A4:1 C5:1 F5:1 E5:1 | E5:3 -:1 | ' +
      'G5:2 E5:1 G5:1 | D5:2 B4:1 D5:1 | C5:1 E5:1 A5:2 | G#5:3 -:1 | ' +
      'A5:1 G5:1 F5:1 E5:1 | D5:1 C5:1 B4:2 | A4:1 C5:1 E5:1 C5:1 | A4:4',
  },
  // The hidden clearing: a few bells, held, somewhere nobody else knows.
  hiddenClearing: {
    bpm: 66,
    metre: 4,
    feel: 'chime',
    chords: ['Em', 'Cmaj7', 'G', 'D', 'Em', 'Cmaj7', 'Am', 'B'],
    melody:
      'B4:2 E5:1 G5:1 | B5:3 -:1 | D5:2 G5:2 | F#5:3 -:1 | ' +
      'G5:1 F#5:1 E5:1 B4:1 | E5:2 G5:2 | C5:1 E5:1 A5:2 | F#5:2 D#5:2',
  },
  // The Hollow Fairground (0.2's M1): a calliope waltz, in the three-four Boothoven hears from his
  // window, bright and a bit giddy.
  fairground: {
    bpm: 126,
    metre: 3,
    feel: 'waltz',
    chords: ['C', 'G', 'G', 'G', 'G', 'Dm', 'C', 'C', 'C', 'C', 'F', 'F', 'C', 'G', 'G', 'C'],
    melody:
      'E5:1 G5:1 C6:1 | B5:2 G5:1 | F5:1 A5:1 G5:1 | D5:3 | ' +
      'D5:1 F5:1 B5:1 | A5:2 F5:1 | E5:1 G5:1 F5:1 | E5:3 | ' +
      'E5:1 G5:1 C6:1 | E6:2 C6:1 | A5:1 C6:1 A5:1 | F5:3 | ' +
      'E5:1 G5:1 C6:1 | B5:1 A5:1 G5:1 | E5:1 D5:1 B4:1 | C5:3',
  },
  // Boo Acres (0.3's F1): a little hoedown, bright and bouncy, for a morning in the fields.
  booAcres: {
    bpm: 112,
    metre: 4,
    feel: 'oompah',
    chords: ['G', 'G', 'C', 'G', 'G', 'G', 'D', 'D', 'G', 'G', 'C', 'C', 'G', 'D', 'D', 'G'],
    melody:
      'D5:1 B4:.5 D5:.5 G5:1 D5:1 | E5:.5 D5:.5 B4:1 G4:2 | C5:1 E5:1 G5:1 E5:1 | D5:3 -:1 | ' +
      'B4:1 D5:.5 B4:.5 G4:1 B4:1 | D5:1 G5:1 F#5:1 E5:1 | A4:1 C5:.5 A4:.5 F#4:1 A4:1 | D5:3 -:1 | ' +
      'G5:1 F#5:.5 G5:.5 A5:1 G5:1 | E5:1 D5:1 B4:2 | C5:1 E5:.5 C5:.5 G4:1 C5:1 | E5:2 G5:2 | ' +
      'D5:1 B4:1 G5:1 D5:1 | C5:1 A4:1 F#4:1 A4:1 | A4:.5 B4:.5 C5:1 D5:1 F#5:1 | G5:3 -:1',
  },
  // Her home: a lullaby of a waltz.
  home: {
    bpm: 80,
    metre: 3,
    feel: 'waltz',
    chords: ['C', 'Am', 'F', 'G', 'C', 'Am', 'Dm', 'G', 'C', 'E', 'Am', 'F', 'C', 'G', 'C', 'C'],
    melody:
      'E5:2 G5:1 | E5:1 C5:1 A4:1 | A4:1.5 C5:.5 F5:1 | D5:3 | ' +
      'E5:2 G5:1 | C6:1 B5:1 A5:1 | F5:1 E5:1 D5:1 | B4:2 D5:1 | ' +
      'C5:2 E5:1 | G#5:2 B5:1 | A5:1 E5:1 C5:1 | A4:2 C5:1 | ' +
      'E5:1 G5:1 C6:1 | B5:1.5 A5:.5 G5:1 | E5:1 D5:1 C5:1 | C5:3',
  },
  // The shops and the neighbours' houses: a bright little tune to browse to.
  indoors: {
    bpm: 100,
    metre: 4,
    feel: 'oompah',
    chords: ['G', 'Em', 'C', 'D', 'G', 'Em', 'Am', 'D', 'C', 'D', 'B', 'Em', 'C', 'D', 'G', 'G'],
    melody:
      'D5:.5 G5:.5 B5:1 A5:.5 G5:.5 D5:1 | E5:1 G5:1 B4:2 | C5:.5 E5:.5 G5:1 E5:1 C5:1 | ' +
      'D5:1 F#5:1 A5:2 | B5:.5 A5:.5 G5:1 D5:1 B4:1 | E5:1.5 F#5:.5 G5:2 | ' +
      'A5:1 G5:.5 E5:.5 C5:1 E5:1 | D5:3 -:1 | E5:1 G5:1 C6:1 G5:1 | F#5:1 A5:1 D5:2 | ' +
      'D#5:1 F#5:1 B5:2 | G5:1 E5:1 B4:2 | C5:1 E5:.5 G5:.5 A5:1 G5:1 | ' +
      'F#5:1 E5:1 D5:1 F#5:1 | G5:2 B5:1 A5:1 | G5:3 -:1',
  },
  // Castle Mac-A-Boo's hall, where they'd dance: the music box strums like their first dance did.
  castleHall: {
    bpm: 87,
    metre: 4,
    feel: 'strum',
    chords: [
      ...['F#m7 ring', 'A ring', 'Esus4 ring', 'B7sus4 ring'],
      ...['F#m7 ring', 'A ring', 'Esus4 ring', 'B7sus4 ring'],
      ...['F#m7 ring', 'A ring', 'Esus4 ring', 'B7sus4 ring'],
      ...['F#m7 ring', 'A ring', 'Esus4 ring', 'B7sus4 ring'],
    ],
    melody:
      '-:1 C#5:.5 E5:.5 F#5:1 E5:1 | C#5:1.5 B4:.5 A4:2 | -:.5 B4:.5 C#5:.5 E5:.5 B4:2 | ' +
      'A4:1 B4:1 E4:2 | -:1 C#5:.5 E5:.5 A5:1 F#5:1 | E5:1.5 C#5:.5 E5:2 | ' +
      '-:.5 E5:.5 F#5:.5 E5:.5 B4:1 C#5:1 | B4:3 -:1 | A5:1.5 F#5:.5 E5:1 C#5:1 | ' +
      'E5:2 C#5:1 A4:1 | B4:1 C#5:.5 E5:.5 F#5:2 | F#5:2 E5:2 | ' +
      '-:1 F#5:.5 E5:.5 C#5:1 A4:1 | C#5:1.5 E5:.5 C#5:1 B4:1 | A4:1 B4:1 C#5:2 | B4:3 -:1',
  },
  // The Halloween Festival's tune (0.2's J2): a skipping, trick-or-treating oom-pah.
  halloweenFestival: {
    bpm: 104,
    metre: 4,
    feel: 'oompah',
    chords: ['Dm', 'Dm', 'Gm', 'A', 'Bb', 'Dm', 'A', 'Dm'],
    melody:
      'D4:.5 F4:.5 A4:1 G4:.5 F4:.5 E4:1 | F4:.5 A4:.5 D5:1 C5:1 A4:1 | ' +
      'Bb4:.5 A4:.5 G4:1 E4:.5 F4:.5 G4:1 | A4:1.5 G4:.5 A4:2 | ' +
      'D5:.5 C5:.5 A4:1 Bb4:.5 A4:.5 G4:1 | F4:.5 G4:.5 A4:1 D4:1 F4:1 | ' +
      'E4:.5 F4:.5 G4:1 A4:.5 G4:.5 E4:1 | D4:3 -:1',
  },
  // The pond's fountain after dark (0.2's H2): a slow, wondering waltz, written for its music box.
  fountain: {
    bpm: 72,
    metre: 3,
    feel: 'waltz',
    chords: ['F', 'C', 'Dm', 'Bb', 'F', 'C', 'Bb', 'C', 'Dm', 'Am', 'Bb', 'F', 'Gm', 'C', 'F', 'F'],
    melody:
      'C5:1 F5:1 A5:1 | G5:2 E5:1 | F5:1 D5:1 A4:1 | Bb4:3 | ' +
      'A4:1 C5:1 F5:1 | E5:1.5 D5:.5 C5:1 | D5:1 F5:1 Bb5:1 | G5:3 | ' +
      'A5:1 F5:1 D5:1 | E5:1 C5:1 A4:1 | Bb4:1 D5:1 F5:1 | A5:2 C6:1 | ' +
      'Bb5:1 G5:1 D5:1 | E5:1 G5:.5 F5:.5 E5:1 | F5:3 | F5:2 -:1',
  },
  // Christmas in town while the tree is up in the square: a jingle with sleigh bells, the game's own.
  christmas: {
    bpm: 112,
    metre: 4,
    feel: 'sleigh',
    chords: ['G', 'G', 'C', 'G', 'G', 'A7', 'D', 'D7', 'G', 'G', 'C', 'Am', 'G', 'D', 'G', 'G'],
    melody:
      'B4:1 D5:1 G5:1.5 D5:.5 | B4:1 G4:1 D5:2 | E5:1 G5:1 E5:1 C5:1 | B4:3 -:1 | ' +
      'D5:.5 D5:.5 D5:1 B4:1 G4:1 | A4:1 C#5:1 E5:2 | F#5:1 E5:1 D5:1 A4:1 | C5:2 A4:1 F#4:1 | ' +
      'G4:1 B4:1 D5:1 G5:1 | A5:1.5 G5:.5 D5:2 | E5:1 C5:1 G5:1 E5:1 | C5:2 A4:2 | ' +
      'B4:1 D5:1 G5:1 B4:1 | A4:1 D5:.5 E5:.5 F#5:2 | G5:2 D5:1 B4:1 | G4:3 -:1',
  },
  // Their song day, 21 September (0.2's D2): a bright, bouncing tune of the game's own to sing
  // along over, never the song they sing.
  septemberSong: {
    bpm: 116,
    metre: 4,
    feel: 'rock',
    chords: ['G', 'Em', 'C', 'D', 'G', 'Em', 'Am', 'D', 'C', 'D', 'Em', 'C', 'G', 'Em', 'Am', 'G'],
    melody:
      'G4:.5 B4:.5 D5:1 B4:.5 D5:.5 G5:1 | E5:1 D5:.5 B4:.5 G4:2 | C5:.5 E5:.5 G5:1 E5:1 C5:1 | ' +
      'D5:1.5 E5:.5 F#5:2 | G5:.5 F#5:.5 E5:1 D5:1 B4:1 | E5:1 G5:1 B4:2 | ' +
      'A4:.5 C5:.5 E5:1 A5:1 G5:1 | F#5:1 A5:1 D5:2 | E5:.5 G5:.5 C6:1 G5:1 E5:1 | ' +
      'F#5:.5 A5:.5 D6:1 A5:1 F#5:1 | G5:1 E5:1 B4:1 E5:1 | C5:1.5 E5:.5 G5:2 | ' +
      'B4:.5 D5:.5 G5:1 D5:1 B4:1 | E5:1 B4:1 G4:2 | A4:1 C5:1 E5:.5 D5:.5 C5:1 | G4:3 -:1',
  },
};

/** How many beats a bar of `line` notation lasts, rests and all. */
export function barLength(text: string): number {
  let total = 0;
  let beats = 1;
  for (const token of text.trim().split(/\s+/)) {
    const length = token.split(':')[1];
    if (length !== undefined) beats = Number(length);
    total += beats;
  }
  return total;
}

/** A theme's melody as notes, each bar laid at its place whatever the bar before it held. */
function melodyOf(theme: Theme): Note[] {
  const bars = theme.melody.split('|');
  if (bars.length !== theme.chords.length) {
    throw new Error(`${bars.length} bars of melody over ${theme.chords.length} chords`);
  }
  return bars.flatMap((bar, i) => {
    if (barLength(bar) !== theme.metre) throw new Error(`bar ${i + 1} is not ${theme.metre} long`);
    return line(bar, i * theme.metre);
  });
}

function chordOf(name: string): { bass: number; voicing: number[] } {
  const chord = CHORDS[name];
  if (!chord) throw new Error(`no chord ${name}`);
  return { bass: midi(chord[0]), voicing: chord[1].split('+').map(midi) };
}

const note = (at: number, beats: number, pitch: number): Note => ({ at, beats, pitch });

/** The bass and chords under the melody, a bar at a time, as its feel plays them. */
function accompaniment(theme: Theme): Part[] {
  const { metre, feel } = theme;
  const bars = theme.chords.map((name, i) => ({ at: i * metre, ...chordOf(name) }));
  const each = (play: (bar: (typeof bars)[number]) => Note[]) => bars.flatMap(play);
  const plucked = (notes: Note[], gain: number, wave: Part['wave'] = 'triangle'): Part => ({
    wave,
    notes,
    gain,
    pluck: true,
  });
  switch (feel) {
    case 'waltz':
      return [
        plucked(
          each(({ at, bass }) => [note(at, 1, bass)]),
          0.14,
        ),
        plucked(
          each(({ at, voicing }) =>
            voicing.flatMap((p) => [note(at + 1, 1, p), note(at + 2, 1, p)]),
          ),
          0.035,
          'sine',
        ),
      ];
    case 'oompah':
      return [
        plucked(
          each(({ at, bass }) => [note(at, 1, bass), note(at + 2, 1, bass + 7)]),
          0.14,
        ),
        plucked(
          each(({ at, voicing }) =>
            voicing.flatMap((p) => [note(at + 1, 1, p), note(at + 3, 1, p)]),
          ),
          0.035,
          'sine',
        ),
      ];
    case 'ripple':
      return [
        plucked(
          each(({ at, bass, voicing }) => {
            const [a, b, c] = voicing as [number, number, number];
            const up = [bass, a, b, c, b, a, b, a].slice(0, metre * 2);
            return up.map((p, k) => note(at + k / 2, 0.5, p));
          }),
          0.1,
        ),
      ];
    case 'rock':
      return [
        plucked(
          each(({ at, bass }) =>
            [0, 7, 12, 7, 0, 7, 12, 7].map((up, k) => note(at + k / 2, 0.5, bass + up)),
          ),
          0.1,
        ),
      ];
    case 'lute':
      return [
        plucked(
          each(({ at, bass, voicing }) => [bass, ...voicing].map((p, k) => note(at + k, 1, p))),
          0.12,
        ),
      ];
    case 'chime':
      return [
        {
          wave: 'sine',
          notes: each(({ at, bass }) => [note(at, metre, bass)]),
          gain: 0.08,
          attack: 0.3,
          release: 0.8,
        },
        {
          wave: 'sine',
          notes: each(({ at, voicing }) =>
            voicing.flatMap((p) => [note(at, 2, p + 12), note(at + 2, 2, p + 12)]),
          ),
          gain: 0.03,
          attack: 0.005,
          release: 0.9,
          pluck: true,
        },
      ];
    case 'sleigh':
      return [
        plucked(
          each(({ at, bass }) => [note(at, 1, bass), note(at + 2, 1, bass + 7)]),
          0.13,
        ),
        plucked(
          each(({ at, voicing }) =>
            voicing.flatMap((p) => [note(at + 1, 0.5, p), note(at + 3, 0.5, p)]),
          ),
          0.035,
          'sine',
        ),
        // The sleigh bells, shaken on every half beat.
        {
          wave: 'hat',
          notes: hits([0, 0.5, 1, 1.5, 2, 2.5, 3, 3.5].slice(0, metre * 2), bars.length, metre),
          gain: 0.05,
        },
      ];
    case 'strum':
      return [
        plucked(
          each(({ at, bass }) => [note(at, 2, bass), note(at + 2, 2, bass)]),
          0.12,
        ),
        // Down, down, up, up, down, up: each a quick roll across the strings.
        plucked(
          each(({ at, voicing }) =>
            [0, 1, 1.75, 2.5, 3, 3.5].flatMap((hit) =>
              voicing.map((p, k) => note(at + hit + k * 0.04, 0.5, p)),
            ),
          ),
          0.04,
        ),
      ];
  }
}

/** A morning's tune is a touch quicker and brighter, an evening's slower, softer and held. */
const TEMPO: Record<DayWindow, number> = { morning: 1.08, afternoon: 1, evening: 0.85 };

/** A theme in the window's arrangement. */
export function arrange(theme: Theme, window: DayWindow): Tune {
  const melody = melodyOf(theme);
  const beats = theme.chords.length * theme.metre;
  const bars = theme.chords.map((name, i) => ({ at: i * theme.metre, ...chordOf(name) }));
  const parts: Part[] = [
    { wave: 'sine', notes: melody, gain: window === 'evening' ? 0.16 : 0.2, pluck: true },
    ...accompaniment(theme),
  ];
  // A second, quieter bell an octave up, for the music box's shimmer; brighter of a morning.
  if (window !== 'evening') {
    parts.push({
      wave: 'triangle',
      notes: melody.map((n) => ({ ...n, pitch: n.pitch + 12 })),
      gain: window === 'morning' ? 0.06 : 0.04,
      pluck: true,
    });
  }
  // A dewdrop two octaves up at the top of each bar.
  if (window === 'morning') {
    parts.push({
      wave: 'sine',
      notes: bars.map(({ at, voicing }) => note(at, 1, voicing[voicing.length - 1]! + 24)),
      gain: 0.025,
      release: 0.5,
      pluck: true,
    });
  }
  // A soft pad holding each chord, for the dark.
  if (window === 'evening') {
    parts.push({
      wave: 'sine',
      notes: bars.flatMap(({ at, voicing }) => voicing.map((p) => note(at, theme.metre, p))),
      gain: 0.025,
      attack: 0.6,
      release: 1.2,
    });
  }
  return { bpm: Math.round(theme.bpm * TEMPO[window]), beats, parts };
}

/** How much slower the fountain's music box turns than the tune it plays. */
const MUSIC_BOX_TEMPO = 0.85;

/**
 * A theme on the fountain's music box (0.2's H2): the melody up high on bright tines, a broken
 * chord picked out under it and a low tine at each bar's top, whatever the theme's own feel. It
 * turns a little slower than the tune does elsewhere, as a wound-up box does.
 */
export function musicBox(theme: Theme): Tune {
  const melody = melodyOf(theme);
  // Up an octave if the tune sits low (the festival's does), so every box is as bright.
  const lowest = Math.min(...melody.map((n) => n.pitch));
  const up = lowest < midi('G4') ? 12 : 0;
  const tines = melody.map((n) => ({ ...n, pitch: n.pitch + up }));
  const { metre } = theme;
  const bars = theme.chords.map((name, i) => ({ at: i * metre, ...chordOf(name) }));
  const broken = bars.flatMap(({ at, voicing }) =>
    Array.from({ length: metre * 2 - 1 }, (_, k) =>
      note(at + (k + 1) / 2, 0.5, voicing[k % voicing.length]! + 12),
    ),
  );
  return {
    bpm: Math.round(theme.bpm * MUSIC_BOX_TEMPO),
    beats: theme.chords.length * metre,
    parts: [
      { wave: 'sine', notes: tines, gain: 0.2, pluck: true, release: 0.4 },
      {
        wave: 'triangle',
        notes: tines.map((n) => ({ ...n, pitch: n.pitch + 12 })),
        gain: 0.035,
        pluck: true,
      },
      { wave: 'sine', notes: broken, gain: 0.05, pluck: true, release: 0.3 },
      {
        wave: 'triangle',
        notes: bars.map(({ at, bass }) => note(at, metre, bass + 12)),
        gain: 0.08,
        pluck: true,
      },
    ],
  };
}

const PLACES: Partial<Record<ZoneId, Place>> = {
  town: 'town',
  whisperwood: 'whisperwood',
  lanternShore: 'lanternShore',
  castleHill: 'castleHill',
  hiddenClearing: 'hiddenClearing',
  fairground: 'fairground',
  booAcres: 'booAcres',
  home: 'home',
  castleHall: 'castleHall',
};

/** Whose tune a place plays: its own, or the indoor tune in a shop or a neighbour's house. */
export function placeOf(zone: ZoneId): Place {
  return PLACES[zone] ?? 'indoors';
}

/** What's going on that the music answers to: the festivals, the decorations, the fountain. */
export interface Occasion {
  festivals: readonly FestivalId[];
  /** Whose decorations are up in town, if any. */
  decor: DecorId | null;
  /** Whether she is standing by a fountain after dark, while it plays. */
  fountain: boolean;
  /** Which of her special days it is, if any (0.2's D2). */
  special?: SpecialDayId | null;
}

/**
 * What plays where she is, in this window: the place's own tune, or in town the festival's while
 * one is on, Christmas's while its tree is up, and their song day's on 21 September. By the fountain after dark its music box plays
 * instead: the Halloween tune while Halloween's things are up, Christmas's at Christmas, and its
 * own the rest of the year.
 */
export function musicFor(zone: ZoneId, window: DayWindow, occasion: Occasion): MusicKey {
  const { festivals, decor, fountain } = occasion;
  if (fountain) {
    const halloween = decor === 'halloween' || festivals.includes('halloweenFestival');
    const theme =
      decor === 'christmas' ? 'christmas' : halloween ? 'halloweenFestival' : 'fountain';
    return `${theme}@musicBox`;
  }
  const place = placeOf(zone);
  const song = occasion.special === 'septemberSong' ? 'septemberSong' : undefined;
  const holiday = song ?? (decor === 'christmas' ? 'christmas' : undefined);
  const festival = place === 'town' ? (festivals[0] ?? holiday) : undefined;
  return `${festival ?? place}@${window}`;
}

const tunes = new Map<MusicKey, Tune>();

/** The tune a key names, written once and kept. */
export function tuneOf(key: MusicKey): Tune {
  let tune = tunes.get(key);
  if (!tune) {
    const [theme, how] = key.split('@') as [ThemeId, Arrangement];
    tune = how === 'musicBox' ? musicBox(THEMES[theme]) : arrange(THEMES[theme], how);
    tunes.set(key, tune);
  }
  return tune;
}
