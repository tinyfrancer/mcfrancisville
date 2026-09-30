import { describe, expect, it } from 'vitest';
import { CUES, cueOf, FESTIVAL_MUSIC, MUSIC, musicFor, voiceOf } from '../../src/audio/cues';
import { isRecord, RECORD_TUNES } from '../../src/audio/records';
import { readSoundSettings, SOUND_KEY, writeSoundSettings } from '../../src/audio/settings';
import { hertz, line, midi, repeat, secondsOf, transpose, type Tune } from '../../src/audio/tune';
import { ITEMS } from '../../src/data/items';
import type { ItemId } from '../../src/types/ids';

describe('the notation', () => {
  it('names notes as MIDI numbers, and tunes A to 440', () => {
    expect(midi('C4')).toBe(60);
    expect(midi('F#3')).toBe(54);
    expect(midi('Bb5')).toBe(82);
    expect(hertz(69)).toBe(440);
    expect(() => midi('H2')).toThrow();
  });

  it('reads a line of notes, rests and chords, each lasting as long as the one before', () => {
    expect(line('E4:1 G4:.5 -:.5 C5+E5:2 D5')).toEqual([
      { at: 0, beats: 1, pitch: 64 },
      { at: 1, beats: 0.5, pitch: 67 },
      { at: 2, beats: 2, pitch: 72 },
      { at: 2, beats: 2, pitch: 76 },
      { at: 4, beats: 2, pitch: 74 },
    ]);
    expect(() => line('C4:0')).toThrow();
  });

  it('repeats and transposes lines', () => {
    const notes = line('C4:1 D4');
    expect(repeat(notes, 2, 4).map((n) => n.at)).toEqual([0, 1, 4, 5]);
    expect(transpose(notes, 1).map((n) => n.pitch)).toEqual([61, 63]);
  });
});

/** Every note starts inside the tune, and is somewhere a phone's speaker can play it. */
function wellFormed(name: string, tune: Tune) {
  for (const part of tune.parts) {
    expect(part.gain, name).toBeGreaterThan(0);
    expect(part.gain, name).toBeLessThanOrEqual(0.6);
    for (const n of part.notes) {
      expect(n.at, name).toBeGreaterThanOrEqual(0);
      expect(n.at, name).toBeLessThan(tune.beats);
      expect(n.pitch, name).toBeGreaterThanOrEqual(midi('A0'));
      expect(n.pitch, name).toBeLessThanOrEqual(midi('C8'));
    }
  }
}

describe('the records', () => {
  it('has a tune for every record she can own, and only those', () => {
    const records = (Object.keys(ITEMS) as ItemId[]).filter((id) => ITEMS[id].kind === 'record');
    expect(Object.keys(RECORD_TUNES).sort()).toEqual([...records].sort());
    for (const id of records) expect(isRecord(id)).toBe(true);
    expect(isRecord('wood')).toBe(false);
  });

  it.each(Object.entries(RECORD_TUNES))(
    'plays %s through, between 20 seconds and a minute',
    (id, tune) => {
      wellFormed(id, tune);
      expect(secondsOf(tune)).toBeGreaterThan(20);
      expect(secondsOf(tune)).toBeLessThan(60);
    },
  );

  it('fills every bar of each melody to the end, with nothing spilling over', () => {
    for (const [id, tune] of Object.entries(RECORD_TUNES)) {
      const end = Math.max(...tune.parts.flatMap((p) => p.notes.map((n) => n.at + n.beats)));
      expect(end, id).toBeLessThanOrEqual(tune.beats);
      expect(end, id).toBeGreaterThan(tune.beats - 4);
    }
  });
});

describe('the cues and the music', () => {
  it('are short, and well formed', () => {
    for (const [id, tune] of Object.entries(CUES)) {
      wellFormed(id, tune);
      expect(secondsOf(tune), id).toBeLessThan(2.5);
    }
    wellFormed('music', MUSIC);
    expect(MUSIC.beats % 3).toBe(0);
  });

  it('plays the festival its own tune, filling its bars, and the waltz on any other day', () => {
    wellFormed('festival', FESTIVAL_MUSIC);
    const end = Math.max(
      ...FESTIVAL_MUSIC.parts.flatMap((p) => p.notes.map((n) => n.at + n.beats)),
    );
    expect(end).toBeLessThanOrEqual(FESTIVAL_MUSIC.beats);
    expect(FESTIVAL_MUSIC.beats % 4).toBe(0);
    expect(musicFor(['halloweenFestival'])).toBe(FESTIVAL_MUSIC);
    expect(musicFor([])).toBe(MUSIC);
  });

  it('gives the moments that matter a sound, and plain arrivals none', () => {
    expect(cueOf({ kind: 'arrived', tx: 1, ty: 1 })).toBeNull();
    expect(cueOf({ kind: 'gathered', from: 'tree', item: 'wood', count: 2 })).toBe('wood');
    expect(cueOf({ kind: 'gathered', from: 'snack', item: 'midnightPizza', count: 1 })).toBe(
      'treat',
    );
    expect(cueOf({ kind: 'caught', critter: 'lunaMoth', first: true })).toBe('firstCatch');
    expect(cueOf({ kind: 'clue', clue: 'button' })).toBe('clue');
    expect(cueOf({ kind: 'mail', from: 'mayor' })).toBe('mail');
  });

  it('voices a line the same way every time, a blip a word, a dozen at most', () => {
    const said = 'Babe, you are getting on mah nerves';
    expect(voiceOf('cody', said)).toEqual(voiceOf('cody', said));
    expect(voiceOf('cody', said).parts[0]!.notes).toHaveLength(7);
    expect(voiceOf('maude', 'word '.repeat(30)).parts[0]!.notes).toHaveLength(12);
    const low = Math.max(...voiceOf('cody', said).parts[0]!.notes.map((n) => n.pitch));
    const high = Math.min(...voiceOf('maude', said).parts[0]!.notes.map((n) => n.pitch));
    expect(low).toBeLessThan(high);
  });
});

describe('sound settings', () => {
  it('start on, and remember being turned off on this phone', () => {
    localStorage.removeItem(SOUND_KEY);
    expect(readSoundSettings()).toEqual({ effects: true, music: true });
    writeSoundSettings({ effects: true, music: false });
    expect(readSoundSettings()).toEqual({ effects: true, music: false });
    localStorage.setItem(SOUND_KEY, 'not json');
    expect(readSoundSettings()).toEqual({ effects: true, music: true });
  });
});
