import type { Figure } from '../sprites/villagers';
import { ZONES } from '../data/zones';
import { hashString } from '../systems/random';
import type { WorldEvent } from '../world/World';
import { line, type Part, type Tune } from './tune';

/*
 * The little sounds the game makes, each a short tune: soft plucks and chimes, never a buzzer.
 * `cueOf` says which one a moment makes, and the background music is here too.
 */

/** A cue at 240 beats a minute, so a beat is a quarter of a second. */
function cue(...parts: Part[]): Tune {
  const beats = Math.max(...parts.flatMap((p) => p.notes.map((n) => n.at + n.beats)));
  return { bpm: 240, beats, parts };
}

const pluck = (notes: string, gain = 0.28, wave: Part['wave'] = 'triangle'): Part => ({
  wave,
  notes: line(notes),
  gain,
  pluck: true,
});

const chime = (notes: string, gain = 0.22): Part => ({
  wave: 'sine',
  notes: line(notes),
  gain,
  attack: 0.005,
  release: 0.4,
  pluck: true,
});

export const CUES = {
  wood: cue(pluck('C4:.3 G4:.5')),
  stone: cue(pluck('A5:.2 E6:.5', 0.2)),
  pick: cue(chime('C5:.2 E5:.2 G5:.2 C6:.6')),
  treat: cue(chime('G5:.2 C6:.2 E6:.2 G6:.2 C7:.8'), pluck('C5:.8 -:.1 G5:.9', 0.12)),
  resting: cue(chime('E4:.3 C4:.6', 0.14)),
  window: cue(chime('G4:.3 C5:.3 E5:.3 G5:.9', 0.14)),
  tilled: cue({ wave: 'kick', notes: line('C4:.3'), gain: 0.35 }, pluck('C3:.4', 0.2)),
  planted: cue(pluck('G4:.25 D5:.6')),
  watered: cue(chime('C5:.15 D5:.15 E5:.15 G5:.5', 0.16)),
  harvested: cue(pluck('C5:.25 E5:.25 G5:.25 C6:1'), pluck('C4:1.75', 0.16)),
  coin: cue(pluck('B5:.2 E6:1', 0.22, 'square')),
  made: cue(
    { wave: 'hat', notes: line('C4:.25 C4 C4'), gain: 0.18 },
    chime('-:.9 C6:.25 E6:.25 G6:.8'),
  ),
  caught: cue({ wave: 'hat', notes: line('C4:.3'), gain: 0.12 }, chime('E5:.2 G5:.2 B5:.2 E6:.7')),
  firstCatch: cue(
    { wave: 'hat', notes: line('C4:.3'), gain: 0.12 },
    chime('C5:.2 E5:.2 G5:.2 C6:.2 E6:.2 G6:.2 C7:1'),
    pluck('-:.6 C4+G4:1.2', 0.14),
  ),
  fled: cue(chime('E6:.2 C6:.2 A5:.2 E5:.5', 0.16)),
  // Her rod (phase Q): a plop as the float goes in, a tick at a nibble, a splash and a ring at a bite.
  cast: cue(
    { wave: 'hat', notes: line('-:.3 C4:.2'), gain: 0.1 },
    pluck('-:.3 G3:.4', 0.18, 'sine'),
  ),
  nibble: cue(pluck('D6:.12', 0.08, 'sine')),
  bite: cue({ wave: 'hat', notes: line('C4:.3'), gain: 0.2 }, chime('A5:.15 E6:.6', 0.2)),
  reeled: cue(chime('G5:.2 D5:.5', 0.12)),
  mail: cue(chime('E5:.3 C6:.9'), chime('-:.15 G5:.3 E6:.8', 0.14)),
  clue: cue(pluck('A4:.4 C5:.4 D#5:.4 E5:1.4', 0.24), chime('-:1.2 E6:1', 0.1)),
  wes: cue(pluck('C4:.25 -:.25 E4:.25 -:.25 G4:.25 -:.25 C5:.4', 0.2, 'sine')),
  goIn: cue(chime('G4:.2 C5:.6', 0.16)),
  goOut: cue(chime('C5:.2 G4:.6', 0.16)),
  found: cue(chime('C5:.2 E5:.2 G5:.2 A5:.2 G5:.9'), pluck('-:.4 C4+G4:1.4', 0.14)),
  refused: cue(pluck('C4:.2 A3:.5', 0.16)),
  heart: cue(chime('E5:.2 G5:.2 E6:.7')),
  tap: cue(chime('A5:.12', 0.05)),
  // A rustle of leaves, and sweets pattering down.
  shake: cue(
    { wave: 'hat', notes: line('C4:.15 C4:.15 C4:.3'), gain: 0.14 },
    chime('-:.3 G6:.12 E6:.12 C7:.12 G6:.12 E7:.6', 0.12),
  ),
  // Her stove (phase R): a sizzle and a ding, and two soft munches.
  cooked: cue(
    { wave: 'hat', notes: line('C4:.12 C4:.12 C4:.12 C4:.12 C4:.3'), gain: 0.1 },
    chime('-:.9 G5:.2 C6:.2 E6:.8', 0.18),
  ),
  munch: cue(pluck('E4:.15 -:.1 D4:.15 -:.15 C5:.2 E5:.5', 0.16, 'sine')),
} satisfies Record<string, Tune>;

export type CueId = keyof typeof CUES;

/** The sound a moment makes, if any. */
export function cueOf(event: WorldEvent): CueId | null {
  switch (event.kind) {
    case 'gathered':
      if (event.item === 'blueRose' || event.from === 'snack' || event.from === 'bone') {
        return 'treat';
      }
      if (event.from === 'tree') return 'wood';
      if (event.from === 'rock') return 'stone';
      return 'pick';
    case 'resting':
      return 'resting';
    case 'window':
      return 'window';
    case 'tilled':
      return 'tilled';
    case 'planted':
    case 'potted':
    case 'sowedRow':
      return 'planted';
    case 'fitted':
    case 'unfitted':
      return 'made';
    case 'watered':
      return 'watered';
    case 'harvested':
      return event.item === 'blueRose' ? 'treat' : 'harvested';
    case 'bought':
    case 'sold':
    case 'answered':
    case 'stallSold':
      return 'coin';
    case 'shook':
      return event.back ? 'resting' : 'shake';
    case 'visit':
    case 'movedIn':
      return 'treat';
    case 'made':
      return 'made';
    case 'cooked':
      return 'cooked';
    case 'ate':
      return 'munch';
    case 'keepsake':
    case 'dug':
    case 'foundLost':
    case 'foundEgg':
    case 'decorated':
      return 'treat';
    case 'caught':
      return event.first ? 'firstCatch' : 'caught';
    case 'fled':
      return 'fled';
    case 'cast':
    case 'nibble':
    case 'bite':
    case 'reeled':
      return event.kind;
    case 'letGo':
      return 'reeled';
    case 'mail':
      return 'mail';
    case 'clue':
      return 'clue';
    case 'wesGone':
      return 'wes';
    case 'entered':
      return ZONES[event.scene].map ? 'goOut' : 'goIn';
    case 'found':
    case 'opened':
      return 'found';
    case 'shut':
      return 'refused';
    case 'refused':
      return 'refused';
    default:
      return null;
  }
}

/** How high each voice speaks: a low vampire, an airy ghost, a bouncy wolf. */
const VOICES: Record<Figure, { base: number; wave: Part['wave'] }> = {
  cody: { base: 52, wave: 'triangle' },
  maude: { base: 76, wave: 'sine' },
  rufus: { base: 60, wave: 'square' },
  wrapunzel: { base: 69, wave: 'triangle' },
  agatha: { base: 64, wave: 'triangle' },
  barty: { base: 57, wave: 'square' },
  ollie: { base: 66, wave: 'square' },
  nessa: { base: 72, wave: 'sine' },
  gourdon: { base: 48, wave: 'triangle' },
  hazel: { base: 71, wave: 'triangle' },
  moonPieMan: { base: 50, wave: 'triangle' },
  wes: { base: 48, wave: 'sine' },
};

const STEPS = [0, 2, 4, 5, 7, 9];

/**
 * A neighbour talking, as a patter of little blips, one a word up to a dozen, each at a pitch the
 * word picks, so the same line always sounds the same.
 */
export function voiceOf(who: Figure, text: string): Tune {
  const { base, wave } = VOICES[who];
  const words = text.split(/\s+/).filter(Boolean).slice(0, 12);
  const notes = words.map((word, i) => ({
    at: i * 0.35,
    beats: 0.25,
    pitch: base + STEPS[hashString(word.toLowerCase()) % STEPS.length]!,
  }));
  return {
    bpm: 240,
    beats: words.length * 0.35,
    parts: [{ wave, notes, gain: 0.06, pluck: true }],
  };
}

// ---- The music: a soft, spooky-cute music-box waltz that goes round and round ----

const WALTZ_CHORDS = [
  'Am',
  'Am',
  'F',
  'F',
  'C',
  'C',
  'E',
  'E',
  'Am',
  'Am',
  'F',
  'F',
  'C',
  'G',
  'Am',
  'Am',
];
const WALTZ_ROOT: Record<string, string> = { Am: 'A2', F: 'F2', C: 'C3', E: 'E2', G: 'G2' };
const WALTZ_CHORD: Record<string, string> = {
  Am: 'A3+C4+E4',
  F: 'A3+C4+F4',
  C: 'G3+C4+E4',
  E: 'G#3+B3+E4',
  G: 'G3+B3+D4',
};

const WALTZ_MELODY =
  'A4:1 C5:1 E5:1 D5:2 C5:1 C5:1 A4:1 F4:1 A4:3 ' +
  'G4:1 C5:1 E5:1 F5:1.5 E5:.5 D5:1 B4:1 D5:1 G#4:1 B4:3 ' +
  'A4:1 C5:1 E5:1 A5:2 G5:1 F5:1 E5:1 C5:1 D5:3 ' +
  'E5:1 D5:1 C5:1 B4:1 D5:1 G4:1 A4:2 E4:1 A4:3';

export const MUSIC: Tune = {
  bpm: 88,
  beats: 48,
  parts: [
    { wave: 'sine', notes: line(WALTZ_MELODY), gain: 0.2, pluck: true },
    // A second, quieter bell an octave up, for the music box's shimmer.
    {
      wave: 'triangle',
      notes: line(WALTZ_MELODY).map((n) => ({ ...n, pitch: n.pitch + 12 })),
      gain: 0.04,
      pluck: true,
    },
    {
      wave: 'triangle',
      notes: WALTZ_CHORDS.flatMap((c, i) => line(`${WALTZ_ROOT[c]}:1`, i * 3)),
      gain: 0.14,
      pluck: true,
    },
    {
      wave: 'sine',
      notes: WALTZ_CHORDS.flatMap((c, i) =>
        line(`-:1 ${WALTZ_CHORD[c]}:1 ${WALTZ_CHORD[c]}:1`, i * 3),
      ),
      gain: 0.035,
      pluck: true,
    },
  ],
};
