import { afterEach, describe, expect, it } from 'vitest';
import {
  ambienceFor,
  CRICKET_SONGS,
  FOOTFALL_MS,
  Footfalls,
  FOOTSTEPS,
  groundOf,
  TICK,
  waterNear,
  type Surroundings,
} from '../../src/audio/ambience';
import { softened } from '../../src/audio/graph';
import { SilentSwitch, silentWav, type Phone } from '../../src/audio/session';
import { readSilentHint, SILENT_HINT_KEY, writeSilentHint } from '../../src/audio/settings';
import { SoundBoard } from '../../src/audio/SoundBoard';
import { midi, secondsOf, type Tune } from '../../src/audio/tune';
import { tickOnPress } from '../../src/hud/dom';
import { openSettings, SILENT_HINT, type SoundApi } from '../../src/hud/SettingsSheet';

/** Every note inside its tune, at a pitch and gain a phone can play. */
function wellFormed(name: string, tune: Tune) {
  for (const part of tune.parts) {
    expect(part.gain, name).toBeGreaterThan(0);
    expect(part.gain, name).toBeLessThanOrEqual(0.6);
    for (const n of part.notes) {
      expect(n.at, name).toBeGreaterThanOrEqual(0);
      expect(n.at + n.beats, name).toBeLessThanOrEqual(tune.beats);
      expect(n.pitch, name).toBeGreaterThanOrEqual(midi('A0'));
      expect(n.pitch, name).toBeLessThanOrEqual(midi('C8'));
    }
  }
}

describe('the silent switch (V1’s S1)', () => {
  const silence = (log: string[]) => {
    let paused = true;
    return {
      get paused() {
        return paused;
      },
      play() {
        log.push('silence');
        paused = false;
      },
      pause() {
        log.push('pause');
        paused = true;
      },
    };
  };

  it('takes the hint where the phone has one, and needs no silence', () => {
    const log: string[] = [];
    const session = { type: 'auto' };
    const phone: Phone = { audioSession: session, silence: () => silence(log) };
    const s = new SilentSwitch(phone);
    expect(s.hinted).toBe(true);
    s.unlock();
    expect(session.type).toBe('playback');
    expect(log).toEqual([]);
  });

  it('otherwise plays a loop of silence, once, and stops it when the page is hidden', () => {
    const log: string[] = [];
    const s = new SilentSwitch({ silence: () => silence(log) });
    s.unlock();
    s.unlock();
    expect(log).toEqual(['silence']);
    s.hide();
    s.unlock();
    expect(log).toEqual(['silence', 'pause', 'silence']);
  });

  it('makes its silence rather than loading it: a second of 8-bit WAV, all quiet', () => {
    const uri = silentWav();
    expect(uri.startsWith('data:audio/wav;base64,')).toBe(true);
    const bytes = Uint8Array.from(atob(uri.split(',')[1]!), (c) => c.charCodeAt(0));
    expect(String.fromCharCode(...bytes.slice(0, 4))).toBe('RIFF');
    expect(String.fromCharCode(...bytes.slice(8, 12))).toBe('WAVE');
    expect(bytes.length).toBe(44 + 8000);
    expect(bytes.slice(44).every((b) => b === 128)).toBe(true);
  });

  /** A stand-in for Web Audio that takes any node made and any call on it, and logs the order. */
  function fakeContext(log: string[]) {
    const param = () =>
      new Proxy({ value: 0 } as Record<string | symbol, unknown>, {
        get: (t, k) => (k in t ? t[k] : () => undefined),
      });
    const node = (): unknown =>
      new Proxy({} as Record<string | symbol, unknown>, {
        get(t, k) {
          if (k in t) return t[k];
          if (k === 'connect') return (n: unknown) => n;
          if (
            typeof k === 'string' &&
            /^(gain|frequency|Q|detune|pan|threshold|knee|ratio|attack|release)$/.test(k)
          ) {
            return (t[k] = param());
          }
          return () => undefined;
        },
        set(t, k, v) {
          t[k] = v;
          return true;
        },
      });
    const ctx = {
      state: 'suspended' as AudioContextState,
      currentTime: 0,
      sampleRate: 8000,
      destination: node(),
      resume() {
        log.push('resume');
        ctx.state = 'running';
        return Promise.resolve();
      },
      suspend: () => Promise.resolve(),
      createBuffer: (_: number, length: number) => ({
        getChannelData: () => new Float32Array(length),
      }),
    };
    return new Proxy(ctx as Record<string | symbol, unknown>, {
      get: (t, k) =>
        k in t ? t[k] : typeof k === 'string' && k.startsWith('create') ? node : undefined,
    }) as unknown as AudioContext;
  }

  it('in her first touch, gets round the switch before the sound is started', async () => {
    for (const hinted of [false, true]) {
      const log: string[] = [];
      const session = {
        set type(t: string) {
          log.push(`session:${t}`);
        },
        get type() {
          return 'auto';
        },
      };
      const phone: Phone = {
        ...(hinted && { audioSession: session }),
        silence: () => silence(log),
      };
      const board = new SoundBoard({ effects: true, music: true }, phone, () => {
        log.push('context');
        return fakeContext(log);
      });
      const target = document.createElement('div');
      board.listen(target);
      target.dispatchEvent(new Event('pointerdown'));
      await Promise.resolve();
      expect(log).toEqual([hinted ? 'session:playback' : 'silence', 'context', 'resume']);
      expect(board.state).toBe('running');
    }
  });
});

describe('the silent switch’s hint in Settings (V1’s S1)', () => {
  afterEach(() => localStorage.removeItem(SILENT_HINT_KEY));

  it('is told once on this phone, the first time the Sound tab is shown', () => {
    localStorage.removeItem(SILENT_HINT_KEY);
    expect(readSilentHint()).toBe(false);
    writeSilentHint();
    expect(readSilentHint()).toBe(true);
    localStorage.removeItem(SILENT_HINT_KEY);

    const board = new SoundBoard(
      { effects: true, music: true },
      { silence: () => ({ paused: false, play() {}, pause() {} }) },
      () => null,
    );
    const sound: SoundApi = {
      effects: () => true,
      music: () => true,
      setEffects() {},
      setMusic() {},
      silentHint: () => board.silentHint(),
    };
    const api = {
      backupCode: () => Promise.resolve('MFV'),
      restore: () => Promise.resolve({ ok: true as const }),
      status: () => Promise.resolve({ persisted: true, standalone: true }),
    };
    const hud = document.createElement('div');
    const shown = () => hud.querySelector('.hud-sound-hint')?.textContent ?? null;
    // With a view to pick, Settings opens on View, not Sound.
    const view = { closeness: () => 'close' as const, setCloseness() {} };
    let close = openSettings(hud, api, sound, () => {}, view);
    expect(shown()).toBeNull();
    const tab = [...hud.querySelectorAll<HTMLButtonElement>('.hud-sheet-tab')].find(
      (b) => b.textContent === 'Sound',
    )!;
    tab.click();
    expect(shown()).toBe(SILENT_HINT);
    close();
    close = openSettings(hud, api, sound, () => {}, view);
    expect(shown()).toBeNull();
    close();
  });
});

describe('the soft tick on every HUD button (V1’s S1)', () => {
  it('ticks for a button pressed, any way it was made, and not for a disabled one or the rest', () => {
    const root = document.createElement('div');
    const plain = document.createElement('button');
    const label = document.createElement('span');
    plain.append(label);
    const off = document.createElement('button');
    off.disabled = true;
    const text = document.createElement('p');
    root.append(plain, off, text);
    let ticks = 0;
    tickOnPress(root, () => (ticks += 1));
    label.click();
    plain.click();
    off.dispatchEvent(new MouseEvent('click', { bubbles: true }));
    text.click();
    expect(ticks).toBe(2);
  });

  it('is short and quiet', () => {
    wellFormed('tick', TICK);
    expect(secondsOf(TICK)).toBeLessThan(0.1);
  });
});

describe('the ambience (V1’s S1)', () => {
  const night: Surroundings = {
    zone: 'lanternShore',
    outdoors: true,
    hour: 23,
    month: 7,
    weather: 'clear',
    stormy: false,
    water: 0,
  };

  it('makes the night at Lantern Shore sound like a place: crickets, and the lake lapping', () => {
    const bed = ambienceFor(night);
    expect(Object.keys(bed).sort()).toEqual(['crickets', 'water']);
    expect(ambienceFor({ ...night, water: 1 }).water).toBeGreaterThan(bed.water!);
  });

  it('brings the crickets out after dark in the warm months, and hushes them in rain', () => {
    expect(ambienceFor({ ...night, hour: 14 }).crickets).toBeUndefined();
    expect(ambienceFor({ ...night, hour: 3 }).crickets).toBeGreaterThan(0);
    expect(ambienceFor({ ...night, month: 1 }).crickets).toBeUndefined();
    const wet = ambienceFor({ ...night, weather: 'rain' });
    expect(wet.crickets).toBeUndefined();
    expect(wet.rain).toBeGreaterThan(0);
    expect(ambienceFor({ ...night, weather: 'rain', stormy: true }).rain).toBeGreaterThan(
      wet.rain!,
    );
  });

  it('blows in the woods and up the castle hill, murmurs at the fair, and hums indoors', () => {
    const day = { ...night, hour: 14 };
    expect(ambienceFor({ ...day, zone: 'whisperwood' }).wind).toBeGreaterThan(0);
    expect(ambienceFor({ ...day, zone: 'castleHill' }).wind).toBeGreaterThan(
      ambienceFor({ ...day, zone: 'whisperwood' }).wind!,
    );
    expect(ambienceFor({ ...day, zone: 'town' })).toEqual({});
    expect(ambienceFor({ ...day, zone: 'fairground' }).murmur).toBeGreaterThan(0);
    expect(ambienceFor({ ...day, zone: 'fairground', hour: 3 }).murmur).toBeUndefined();
    const inside = ambienceFor({ ...day, zone: 'home', outdoors: false });
    expect(Object.keys(inside)).toEqual(['hum']);
    expect(ambienceFor({ ...day, zone: 'home', outdoors: false, weather: 'rain' }).roof).toBe(0.5);
    // Under the music: no layer above full, and only a handful at once.
    const loud = ambienceFor({
      ...night,
      zone: 'castleHill',
      weather: 'rain',
      stormy: true,
      water: 1,
    });
    for (const level of Object.values(loud)) expect(level).toBeLessThanOrEqual(1);
  });

  it('hears water nearer the nearer she stands, and the creek under its ice softer', () => {
    const pond = (x: number, y: number) =>
      x >= 10 && x < 14 && y >= 10 && y < 14 ? 'water' : null;
    expect(waterNear(9, 11, pond)).toBe(1);
    expect(waterNear(6, 11, pond)).toBeLessThan(waterNear(8, 11, pond));
    expect(waterNear(0, 0, pond)).toBe(0);
    const creek = (x: number) => (x === 10 ? 'ice' : null);
    expect(waterNear(9, 0, creek)).toBe(0.5);
  });

  it('hears her steps on the ground she walks: grass, the path, boards, ice, a floor indoors', () => {
    expect(groundOf('grass', true, false)).toBe('grass');
    expect(groundOf('path', true, false)).toBe('path');
    expect(groundOf('steps', true, false)).toBe('path');
    expect(groundOf('boards', true, false)).toBe('boards');
    expect(groundOf('ice', true, false)).toBe('ice');
    expect(groundOf('water', true, true)).toBe('ice');
    expect(groundOf(undefined, false, false)).toBe('floor');
    for (const [ground, feet] of Object.entries(FOOTSTEPS)) {
      for (const tune of feet) {
        wellFormed(ground, tune);
        expect(secondsOf(tune)).toBeLessThan(0.15);
      }
      expect(feet[0]).not.toEqual(feet[1]);
    }
  });

  it('puts a foot down each step of her walk, left and right in turn, and none standing', () => {
    const f = new Footfalls();
    const feet: (0 | 1 | null)[] = [];
    for (let ms = 0; ms <= FOOTFALL_MS * 4; ms += 40)
      feet.push(f.step({ moving: true, walkMs: ms }));
    const fell = feet.filter((x) => x !== null);
    expect(fell).toEqual([1, 0, 1, 0]);
    expect(f.step({ moving: false, walkMs: 0 })).toBeNull();
    expect(f.step({ moving: true, walkMs: 0 })).toBeNull();
  });

  it('sings its crickets as loops of uneven lengths, high and quiet', () => {
    for (const song of CRICKET_SONGS) {
      wellFormed('cricket', song);
      expect(song.parts.every((p) => p.wave === 'brush')).toBe(true);
    }
    expect(new Set(CRICKET_SONGS.map((s) => s.beats)).size).toBe(CRICKET_SONGS.length);
  });
});

describe('the sound of the room (V1’s S1)', () => {
  it('softens a triangle or square a few times above its pitch, never too dark or bright', () => {
    expect(softened(midi('A4'), 6)).toBeCloseTo(2640);
    expect(softened(midi('A1'), 3)).toBe(700);
    expect(softened(midi('C8'), 6)).toBe(7000);
  });
});
