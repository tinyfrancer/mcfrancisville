/**
 * Music as data: every sound in the game, from a coin's clink to a record, is a `Tune` of parts,
 * each a line of notes on one voice. Nothing here makes a sound; `SoundBoard` plays them. Every
 * melody is original (personal_touches.md, "The finishing touches"): no real tune is copied.
 */

/**
 * What a part sounds like: one of the Web Audio oscillators, or a drum made from noise and a
 * falling pitch.
 */
export type Wave = 'sine' | 'triangle' | 'square' | 'sawtooth' | 'kick' | 'snare' | 'hat';

/** One note: when it starts and how long it lasts, in beats, and its pitch as a MIDI number. */
export interface Note {
  at: number;
  beats: number;
  pitch: number;
}

export interface Part {
  wave: Wave;
  notes: readonly Note[];
  /** How loud, 0 to 1, before the bus it plays on. */
  gain: number;
  /** Seconds to fade in, and to fade out at the note's end; short for a pluck, long for a pad. */
  attack?: number;
  release?: number;
  /** A pluck dies away over its note rather than holding. */
  pluck?: boolean;
  /** Cents to detune a copy of each note by, for a fuller sound. */
  chorus?: number;
}

export interface Tune {
  bpm: number;
  /** How long it is, in beats, which is where a loop starts again. */
  beats: number;
  parts: readonly Part[];
}

const NAMES: Record<string, number> = { C: 0, D: 2, E: 4, F: 5, G: 7, A: 9, B: 11 };

/** A note name as a MIDI number: `C4` is 60, `F#3` is 54, `Bb5` is 82. */
export function midi(name: string): number {
  const match = /^([A-G])([#b]?)(-?\d)$/.exec(name);
  if (!match) throw new Error(`not a note: ${name}`);
  const [, letter, accidental, octave] = match;
  const shift = accidental === '#' ? 1 : accidental === 'b' ? -1 : 0;
  return 12 * (Number(octave) + 1) + NAMES[letter!]! + shift;
}

/** A pitch in hertz. */
export function hertz(pitch: number): number {
  return 440 * 2 ** ((pitch - 69) / 12);
}

/**
 * A line of notes from a string: `E4:1 G4:.5 -:.5 C5+E5:2` is an E for a beat, a G for half a
 * beat, half a beat's rest, then a C and E together for two. A note with no length lasts the one
 * before it; the first lasts a beat.
 */
export function line(text: string, from = 0): Note[] {
  const notes: Note[] = [];
  let at = from;
  let beats = 1;
  for (const token of text.trim().split(/\s+/)) {
    const [names, length] = token.split(':');
    if (length !== undefined) beats = Number(length);
    if (!Number.isFinite(beats) || beats <= 0) throw new Error(`not a length: ${token}`);
    if (names !== '-') {
      for (const name of names!.split('+')) notes.push({ at, beats, pitch: midi(name) });
    }
    at += beats;
  }
  return notes;
}

/** A line played `times` times over, one after another, each `every` beats long. */
export function repeat(notes: readonly Note[], times: number, every: number): Note[] {
  const out: Note[] = [];
  for (let i = 0; i < times; i++) {
    for (const n of notes) out.push({ ...n, at: n.at + i * every });
  }
  return out;
}

/** A line moved up (or down) by `semitones`. */
export function transpose(notes: readonly Note[], semitones: number): Note[] {
  return notes.map((n) => ({ ...n, pitch: n.pitch + semitones }));
}

/** A drum on the given beats of each bar, for `bars` bars of `perBar` beats. */
export function hits(beats: readonly number[], bars: number, perBar = 4, length = 0.25): Note[] {
  const out: Note[] = [];
  for (let bar = 0; bar < bars; bar++) {
    for (const b of beats) out.push({ at: bar * perBar + b, beats: length, pitch: 60 });
  }
  return out;
}

/** How long a tune lasts, in seconds. */
export function secondsOf(tune: Tune): number {
  return (tune.beats * 60) / tune.bpm;
}
