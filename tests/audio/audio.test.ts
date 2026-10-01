import { describe, expect, it } from 'vitest';
import { CUES, cueOf, voiceOf } from '../../src/audio/cues';
import {
  arrange,
  barLength,
  musicFor,
  placeOf,
  THEMES,
  tuneOf,
  type MusicKey,
  type ThemeId,
} from '../../src/audio/music';
import { isRecord, RECORD_TUNES } from '../../src/audio/records';
import { readSoundSettings, SOUND_KEY, writeSoundSettings } from '../../src/audio/settings';
import { hertz, line, midi, repeat, secondsOf, transpose, type Tune } from '../../src/audio/tune';
import { ITEMS } from '../../src/data/items';
import { DAY_WINDOWS } from '../../src/data/windows';
import { ZONES } from '../../src/data/zones';
import type { ZoneId } from '../../src/types/ids';
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

describe('the cues', () => {
  it('are short, and well formed', () => {
    for (const [id, tune] of Object.entries(CUES)) {
      wellFormed(id, tune);
      expect(secondsOf(tune), id).toBeLessThan(2.5);
    }
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

describe("the music (0.2's H1)", () => {
  const themes = Object.keys(THEMES) as ThemeId[];
  const keys = themes.flatMap((t) => DAY_WINDOWS.map((w) => `${t}@${w}` as MusicKey));

  it('writes every bar of every melody to its metre, a chord a bar', () => {
    for (const id of themes) {
      const theme = THEMES[id];
      const bars = theme.melody.split('|');
      expect(bars, id).toHaveLength(theme.chords.length);
      bars.forEach((bar, i) => expect(barLength(bar), `${id} bar ${i + 1}`).toBe(theme.metre));
    }
  });

  it.each(keys)(
    'plays %s well formed, filling its bars, for 15 seconds to a minute and a quarter',
    (key) => {
      const tune = tuneOf(key);
      wellFormed(key, tune);
      const melody = tune.parts[0]!.notes;
      const end = Math.max(...melody.map((n) => n.at + n.beats));
      expect(end).toBeLessThanOrEqual(tune.beats);
      expect(secondsOf(tune)).toBeGreaterThan(15);
      expect(secondsOf(tune)).toBeLessThan(75);
    },
  );

  it('gives every place its own tune, and the shops and houses one between them', () => {
    const zones = Object.keys(ZONES) as ZoneId[];
    const outdoors = zones.filter((z) => ZONES[z].map);
    const places = new Set(zones.map(placeOf));
    for (const zone of outdoors) expect(placeOf(zone)).toBe(zone);
    expect(placeOf('home')).toBe('home');
    expect(placeOf('castleHall')).toBe('castleHall');
    expect(placeOf('cobwebCorner')).toBe('indoors');
    expect(placeOf('codyManor')).toBe('indoors');
    expect(places.size).toBe(outdoors.length + 3);
    const melodies = new Set(themes.map((t) => THEMES[t].melody));
    expect(melodies.size).toBe(themes.length);
  });

  it('plays a morning quicker and brighter, and an evening slower and held', () => {
    for (const id of themes) {
      const [morning, afternoon, evening] = DAY_WINDOWS.map((w) => arrange(THEMES[id], w));
      expect(morning!.bpm, id).toBeGreaterThan(afternoon!.bpm);
      expect(evening!.bpm, id).toBeLessThan(afternoon!.bpm);
      expect(morning!.parts.length, id).toBeGreaterThan(afternoon!.parts.length);
      expect(
        evening!.parts.some((p) => !p.pluck && (p.attack ?? 0) > 0.3),
        id,
      ).toBe(true);
    }
  });

  it('keeps the town its waltz, but for the festival, which plays only in town', () => {
    expect(musicFor('town', 'afternoon', [])).toBe('town@afternoon');
    expect(THEMES.town.metre).toBe(3);
    expect(musicFor('town', 'evening', ['halloweenFestival'])).toBe('halloweenFestival@evening');
    expect(musicFor('whisperwood', 'morning', ['halloweenFestival'])).toBe('whisperwood@morning');
    expect(musicFor('muse', 'afternoon', [])).toBe('indoors@afternoon');
    expect(tuneOf('town@morning')).toBe(tuneOf('town@morning'));
  });

  it('strums the hall like their first dance, with E and A ringing over every chord', () => {
    const hall = THEMES.castleHall;
    expect(hall.feel).toBe('strum');
    expect(hall.metre).toBe(4);
    const strum = tuneOf('castleHall@afternoon').parts[2]!;
    const bar = strum.notes.filter((n) => n.at < 4).map((n) => n.pitch);
    expect(bar).toEqual(expect.arrayContaining([midi('E4'), midi('A4')]));
  });
});
