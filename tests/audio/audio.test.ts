import { describe, expect, it } from 'vitest';
import { asks, CUES, cueOf, voiceOf } from '../../src/audio/cues';
import {
  arrange,
  barLength,
  isNight,
  musicBox,
  musicFor,
  placeOf,
  THEMES,
  tuneOf,
  variationOf,
  type MusicKey,
  type ThemeId,
  type Time,
} from '../../src/audio/music';
import { isRecord, RECORD_TUNES } from '../../src/audio/records';
import { PIANO_TUNES } from '../../src/audio/pianos';
import { TUNE_IDS } from '../../src/data/instruments';
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

describe("the pianos (0.2's G2)", () => {
  it('has notes for every tune, under a minute each, every bar filled and none spilling over', () => {
    expect(Object.keys(PIANO_TUNES).sort()).toEqual([...TUNE_IDS].sort());
    for (const [id, tune] of Object.entries(PIANO_TUNES)) {
      const end = Math.max(...tune.parts.flatMap((p) => p.notes.map((n) => n.at + n.beats)));
      expect(end, id).toBeLessThanOrEqual(tune.beats);
      expect(end, id).toBeGreaterThan(tune.beats - 4);
      expect(secondsOf(tune), id).toBeGreaterThan(15);
      expect(secondsOf(tune), id).toBeLessThan(60);
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

  it("lifts a question at its end (V1's S1), and leaves a statement as it was", () => {
    const asked = voiceOf('rufus', 'Did you see the moon tonight?').parts[0]!.notes;
    const told = voiceOf('rufus', 'Did you see the moon tonight').parts[0]!.notes;
    expect(asked.slice(0, -2)).toEqual(told.slice(0, -2));
    expect(asked.at(-1)!.pitch).toBe(told.at(-1)!.pitch + 5);
    expect(asked.at(-2)!.pitch).toBe(told.at(-2)!.pitch + 2);
    expect(asked.at(-1)!.beats).toBeGreaterThan(told.at(-1)!.beats);
    expect(asks('Is it you? 🦇')).toBe(true);
    expect(asks('"Who goes there?"')).toBe(true);
    expect(asks('Who? Me. Yes.')).toBe(false);
    const tune = voiceOf('maude', 'word '.repeat(30) + 'really?');
    wellFormed('a long question', tune);
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
  const times: Time[] = [...DAY_WINDOWS, 'night'];
  const keys = themes.flatMap((t) => times.map((w) => `${t}@${w}` as MusicKey));

  it('writes every bar of every melody to its metre, a chord a bar', () => {
    for (const id of themes) {
      const theme = THEMES[id];
      const bars = theme.melody.split('|');
      expect(bars, id).toHaveLength(theme.chords.length);
      bars.forEach((bar, i) => expect(barLength(bar), `${id} bar ${i + 1}`).toBe(theme.metre));
      // And its B section (V1's S1): eight bars, a chord each, in the same metre.
      const b = theme.b.melody.split('|');
      expect(theme.b.chords, `${id} B`).toHaveLength(8);
      expect(b, `${id} B`).toHaveLength(8);
      b.forEach((bar, i) => expect(barLength(bar), `${id} B bar ${i + 1}`).toBe(theme.metre));
    }
    const sections = themes.flatMap((t) => [THEMES[t].melody, THEMES[t].b.melody]);
    expect(new Set(sections).size).toBe(sections.length);
  });

  it.each(keys)(
    'plays %s well formed every time round, an A for 15 seconds to a minute and a quarter',
    (key) => {
      for (let pass = 0; pass < 12; pass++) {
        const tune = tuneOf(key, pass);
        wellFormed(`${key} pass ${pass}`, tune);
        // The melody ends in its last bar; a strum's roll may ring a moment past it.
        for (const [i, part] of tune.parts.entries()) {
          const end = Math.max(...part.notes.map((n) => n.at + n.beats));
          expect(end, `${key} pass ${pass}`).toBeLessThanOrEqual(tune.beats + (i ? 0.25 : 0));
        }
        // A B is eight bars: shorter than most As, never a blink.
        expect(secondsOf(tune), `${key} pass ${pass}`).toBeGreaterThan(pass % 2 ? 7 : 15);
        expect(secondsOf(tune), `${key} pass ${pass}`).toBeLessThan(75);
      }
    },
  );

  it.each(keys.filter((k) => k.endsWith('@afternoon') || k.endsWith('@night')))(
    'plays %s differently each time round: A and B in turn, ten passes before any comes back',
    (key) => {
      const passes = Array.from({ length: 10 }, (_, p) => JSON.stringify(tuneOf(key, p)));
      expect(new Set(passes).size).toBe(10);
      expect(tuneOf(key, 0)).toBe(tuneOf(key));
      expect(tuneOf(key, 1).beats).toBe(8 * THEMES[key.split('@')[0] as ThemeId].metre);
    },
  );

  it('varies a pass with a counter-melody, an octave, or a bar left out, never the first or last', () => {
    expect(variationOf(0, 16)).toEqual({ counter: false, octave: false, drop: null });
    expect(variationOf(1, 8)).toEqual({ counter: false, octave: false, drop: null });
    const kinds = Array.from({ length: 10 }, (_, p) => variationOf(p, 16));
    expect(kinds.some((v) => v.counter)).toBe(true);
    expect(kinds.some((v) => v.octave)).toBe(true);
    for (let p = 0; p < 200; p++) {
      const { drop } = variationOf(p, p % 2 ? 8 : 16);
      if (drop !== null) {
        expect(drop).toBeGreaterThan(0);
        expect(drop).toBeLessThan((p % 2 ? 8 : 16) - 1);
      }
    }
    // A bar left out is the melody's only: the chords play on under it.
    const town = THEMES.town;
    const dropping = Array.from({ length: 20 }, (_, p) => p).find(
      (p) => p % 2 === 0 && variationOf(p, 16).drop !== null,
    )!;
    const { drop } = variationOf(dropping, 16);
    const tune = arrange(town, 'afternoon', dropping);
    const inBar = (n: { at: number }) => n.at >= drop! * 3 && n.at < drop! * 3 + 3;
    expect(tune.parts[0]!.notes.filter(inBar)).toHaveLength(0);
    expect(tune.parts[1]!.notes.filter(inBar).length).toBeGreaterThan(0);
  });

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

  it("plays the night (from ten till five) slower and sparer than the evening (V1's S1)", () => {
    const notes = (t: { parts: readonly { notes: readonly unknown[] }[] }) =>
      t.parts.reduce((n, p) => n + p.notes.length, 0);
    for (const id of themes) {
      const evening = arrange(THEMES[id], 'evening');
      const night = arrange(THEMES[id], 'night');
      expect(night.bpm, id).toBeLessThan(evening.bpm);
      expect(notes(night), id).toBeLessThan(notes(evening));
      expect(night.parts[0]!.notes, id).toEqual(evening.parts[0]!.notes);
      expect(
        night.parts.some((p) => !p.pluck && (p.attack ?? 0) > 0.3),
        id,
      ).toBe(true);
    }
    expect([21, 22, 23, 0, 4, 5, 12].map(isNight)).toEqual([
      false,
      true,
      true,
      true,
      true,
      false,
      false,
    ]);
    const late = { festivals: [], decor: null, fountain: false, night: true } as const;
    expect(musicFor('lanternShore', 'evening', late)).toBe('lanternShore@night');
    expect(musicFor('town', 'evening', { ...late, fountain: true })).toBe('fountain@musicBox');
  });

  it('keeps every part of every tune in its place between the speakers', () => {
    for (const key of keys) {
      for (const part of tuneOf(key, 3).parts) {
        expect(Math.abs(part.pan ?? 0), key).toBeLessThanOrEqual(0.5);
      }
      expect(tuneOf(key).parts[0]!.pan ?? 0, `${key}'s melody in the middle`).toBe(0);
    }
  });

  const quiet = { festivals: [], decor: null, fountain: false } as const;

  it('keeps the town its waltz, but for the festival, which plays only in town', () => {
    expect(musicFor('town', 'afternoon', quiet)).toBe('town@afternoon');
    expect(THEMES.town.metre).toBe(3);
    const festival = { ...quiet, festivals: ['halloweenFestival'] as const };
    expect(musicFor('town', 'evening', festival)).toBe('halloweenFestival@evening');
    expect(musicFor('whisperwood', 'morning', festival)).toBe('whisperwood@morning');
    expect(musicFor('muse', 'afternoon', quiet)).toBe('indoors@afternoon');
    expect(tuneOf('town@morning')).toBe(tuneOf('town@morning'));
  });

  it("plays Christmas's jingle in town while its tree is up, with sleigh bells (0.2's H2)", () => {
    const christmas = { ...quiet, decor: 'christmas' } as const;
    expect(musicFor('town', 'evening', christmas)).toBe('christmas@evening');
    expect(musicFor('lanternShore', 'evening', christmas)).toBe('lanternShore@evening');
    expect(musicFor('town', 'evening', { ...quiet, decor: 'easter' })).toBe('town@evening');
    expect(tuneOf('christmas@afternoon').parts.some((p) => p.wave === 'hat')).toBe(true);
  });

  it("plays the fountain's music box by it: its own, Halloween's or Christmas's", () => {
    const by = { ...quiet, fountain: true };
    expect(musicFor('town', 'evening', by)).toBe('fountain@musicBox');
    expect(musicFor('town', 'evening', { ...by, decor: 'halloween' })).toBe(
      'halloweenFestival@musicBox',
    );
    expect(musicFor('town', 'evening', { ...by, festivals: ['halloweenFestival'] })).toBe(
      'halloweenFestival@musicBox',
    );
    expect(musicFor('town', 'morning', { ...by, decor: 'christmas' })).toBe('christmas@musicBox');
  });

  it.each(themes.map((t) => `${t}@musicBox` as MusicKey))(
    'plays %s on the music box, high and bright, a little slower than elsewhere',
    (key) => {
      const theme = THEMES[key.split('@')[0] as ThemeId];
      for (let pass = 0; pass < 10; pass++) {
        const tune = tuneOf(key, pass);
        wellFormed(key, tune);
        expect(tune.bpm).toBeLessThan(theme.bpm);
        expect(tune.parts.every((p) => p.pluck)).toBe(true);
        expect(Math.min(...tune.parts[0]!.notes.map((n) => n.pitch))).toBeGreaterThanOrEqual(
          midi('G4'),
        );
        expect(secondsOf(tune)).toBeGreaterThan(pass % 2 ? 7 : 15);
        expect(secondsOf(tune)).toBeLessThan(90);
      }
      expect(musicBox(theme, 1)).not.toEqual(musicBox(theme, 0));
    },
  );

  it('strums the hall like their first dance, with E and A ringing over every chord', () => {
    const hall = THEMES.castleHall;
    expect(hall.feel).toBe('strum');
    expect(hall.metre).toBe(4);
    const strum = tuneOf('castleHall@afternoon').parts[2]!;
    const bar = strum.notes.filter((n) => n.at < 4).map((n) => n.pitch);
    expect(bar).toEqual(expect.arrayContaining([midi('E4'), midi('A4')]));
  });
});
