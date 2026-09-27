import { readSoundSettings, writeSoundSettings, type SoundSettings } from './settings';
import { hertz, secondsOf, type Note, type Part, type Tune } from './tune';

/** How far ahead the next notes of a long tune are set going, in seconds. */
const LOOKAHEAD_S = 0.6;
const TICK_MS = 120;

/** How loud each kind of sound is, under everything. */
const LEVELS = { master: 0.8, effects: 0.7, music: 0.45, record: 0.7 };

/** A tune being played through: the notes in time order, and how far through it is. */
interface Playing {
  tune: Tune;
  events: { time: number; part: Part; note: Note }[];
  length: number;
  start: number;
  next: number;
  loop: boolean;
  bus: GainNode;
  sources: Set<AudioScheduledSourceNode>;
}

/**
 * Every sound the game makes, synthesised with Web Audio (decisions.md 2, for sound too: no
 * files). iOS only lets a page start making sound from inside a touch, so nothing plays until
 * her first tap (`listen`). The music loops quietly; a record on her record player stops it until
 * the record ends.
 */
export class SoundBoard {
  private ctx: AudioContext | null = null;
  private buses: { effects: GainNode; music: GainNode; record: GainNode } | null = null;
  private noise: AudioBuffer | null = null;
  private music: Playing | null = null;
  private record: Playing | null = null;
  private timer: ReturnType<typeof setInterval> | null = null;
  private musicTune: Tune | null = null;
  private settings: SoundSettings;

  constructor(settings: SoundSettings = readSoundSettings()) {
    this.settings = settings;
  }

  get effects(): boolean {
    return this.settings.effects;
  }

  get musicOn(): boolean {
    return this.settings.music;
  }

  /** Starts the sound on her first touch, and wakes it again on any touch after iOS hushed it. */
  listen(target: EventTarget): void {
    const wake = () => this.unlock();
    for (const type of ['pointerdown', 'touchend', 'click', 'keydown']) {
      target.addEventListener(type, wake, { capture: true, passive: true });
    }
    document.addEventListener('visibilitychange', () => {
      if (!this.ctx) return;
      if (document.visibilityState === 'hidden') void this.ctx.suspend();
      else void this.ctx.resume();
    });
  }

  /** The tune that loops behind everything, once sound has started. */
  setMusic(tune: Tune): void {
    this.musicTune = tune;
    this.startMusic();
  }

  setEffectsOn(on: boolean): void {
    this.settings = { ...this.settings, effects: on };
    writeSoundSettings(this.settings);
  }

  setMusicOn(on: boolean): void {
    this.settings = { ...this.settings, music: on };
    writeSoundSettings(this.settings);
    if (on) this.startMusic();
    else {
      this.stop('music');
      this.stop('record');
    }
  }

  /** Plays a short sound at once. */
  cue(tune: Tune): void {
    const ctx = this.running();
    if (!ctx || !this.settings.effects || !this.buses) return;
    const at = ctx.currentTime + 0.01;
    const spb = 60 / tune.bpm;
    for (const part of tune.parts) {
      for (const note of part.notes)
        this.voice(part, note, at + note.at * spb, spb, this.buses.effects);
    }
  }

  /** Puts a record on: the music stops for it, and comes back once it's over. */
  playRecord(tune: Tune): void {
    this.stop('record');
    if (!this.running() || !this.settings.music || !this.buses) return;
    this.stop('music');
    this.record = this.begin(tune, this.buses.record, false);
    this.tick();
  }

  /** Takes the record off, and lets the music back in. */
  stopRecord(): void {
    if (!this.record) return;
    this.stop('record');
    this.startMusic();
  }

  /** Whether a record is playing, for smoke to check. */
  get recordPlaying(): boolean {
    return this.record !== null;
  }

  get state(): AudioContextState | 'none' {
    return this.ctx?.state ?? 'none';
  }

  private unlock(): void {
    if (!this.ctx) {
      const Context =
        globalThis.AudioContext ??
        (globalThis as unknown as { webkitAudioContext?: typeof AudioContext }).webkitAudioContext;
      if (!Context) return;
      const ctx = new Context();
      const master = ctx.createGain();
      master.gain.value = LEVELS.master;
      master.connect(ctx.destination);
      const bus = (level: number) => {
        const g = ctx.createGain();
        g.gain.value = level;
        g.connect(master);
        return g;
      };
      this.buses = {
        effects: bus(LEVELS.effects),
        music: bus(LEVELS.music),
        record: bus(LEVELS.record),
      };
      this.noise = noiseBuffer(ctx);
      this.ctx = ctx;
    }
    if (this.ctx.state !== 'running') void this.ctx.resume().then(() => this.startMusic());
    else this.startMusic();
  }

  private running(): AudioContext | null {
    return this.ctx && this.ctx.state === 'running' ? this.ctx : null;
  }

  private startMusic(): void {
    if (this.music || this.record || !this.musicTune || !this.settings.music) return;
    if (!this.running() || !this.buses) return;
    this.music = this.begin(this.musicTune, this.buses.music, true);
    this.tick();
  }

  private begin(tune: Tune, bus: GainNode, loop: boolean): Playing {
    const spb = 60 / tune.bpm;
    const events = tune.parts
      .flatMap((part) => part.notes.map((note) => ({ time: note.at * spb, part, note })))
      .sort((a, b) => a.time - b.time);
    if (!this.timer) this.timer = setInterval(() => this.tick(), TICK_MS);
    return {
      tune,
      events,
      length: secondsOf(tune),
      start: this.ctx!.currentTime + 0.1,
      next: 0,
      loop,
      bus,
      sources: new Set(),
    };
  }

  /** Sets going whatever notes are due in the next moment, and notices a record ending. */
  private tick(): void {
    const ctx = this.running();
    if (!ctx) return;
    const horizon = ctx.currentTime + LOOKAHEAD_S;
    for (const playing of [this.music, this.record]) {
      if (!playing) continue;
      const spb = 60 / playing.tune.bpm;
      while (playing.next < playing.events.length) {
        const e = playing.events[playing.next]!;
        const at = playing.start + e.time;
        if (at > horizon) break;
        this.voice(e.part, e.note, at, spb, playing.bus, playing.sources);
        playing.next += 1;
        if (playing.next === playing.events.length && playing.loop) {
          playing.start += playing.length;
          playing.next = 0;
        }
      }
    }
    if (this.record && ctx.currentTime > this.record.start + this.record.length + 0.3) {
      this.record = null;
      this.startMusic();
    }
    if (!this.music && !this.record && this.timer) {
      clearInterval(this.timer);
      this.timer = null;
    }
  }

  private stop(which: 'music' | 'record'): void {
    const playing = this[which];
    if (!playing) return;
    for (const source of playing.sources) {
      try {
        source.stop();
      } catch {
        // Already stopped.
      }
    }
    this[which] = null;
  }

  /** One note on one voice, from `at` for its length, with its envelope. */
  private voice(
    part: Part,
    note: Note,
    at: number,
    spb: number,
    bus: GainNode,
    sources?: Set<AudioScheduledSourceNode>,
  ): void {
    const ctx = this.ctx!;
    const length = note.beats * spb;
    const keep = (source: AudioScheduledSourceNode) => {
      if (!sources) return;
      sources.add(source);
      source.onended = () => sources.delete(source);
    };
    const gain = ctx.createGain();
    gain.connect(bus);

    if (part.wave === 'kick') {
      const osc = ctx.createOscillator();
      osc.frequency.setValueAtTime(150, at);
      osc.frequency.exponentialRampToValueAtTime(45, at + 0.12);
      gain.gain.setValueAtTime(part.gain, at);
      gain.gain.exponentialRampToValueAtTime(0.001, at + 0.25);
      osc.connect(gain);
      osc.start(at);
      osc.stop(at + 0.3);
      keep(osc);
      return;
    }
    if (part.wave === 'snare' || part.wave === 'hat') {
      const source = ctx.createBufferSource();
      source.buffer = this.noise;
      const filter = ctx.createBiquadFilter();
      filter.type = 'highpass';
      filter.frequency.value = part.wave === 'hat' ? 7000 : 1200;
      const decay = part.wave === 'hat' ? 0.05 : 0.16;
      gain.gain.setValueAtTime(part.gain, at);
      gain.gain.exponentialRampToValueAtTime(0.001, at + decay);
      source.connect(filter).connect(gain);
      source.start(at);
      source.stop(at + decay + 0.02);
      keep(source);
      return;
    }

    const attack = part.attack ?? 0.005;
    const release = part.release ?? 0.06;
    const end = part.pluck ? at + Math.max(0.12, length) + release : at + length + release;
    gain.gain.setValueAtTime(0, at);
    gain.gain.linearRampToValueAtTime(part.gain, at + attack);
    if (part.pluck) {
      gain.gain.exponentialRampToValueAtTime(0.001, end);
    } else {
      gain.gain.setValueAtTime(part.gain, Math.max(at + attack, at + length));
      gain.gain.linearRampToValueAtTime(0, end);
    }
    const detunes = part.chorus ? [0, part.chorus] : [0];
    for (const detune of detunes) {
      const osc = ctx.createOscillator();
      osc.type = part.wave;
      osc.frequency.value = hertz(note.pitch);
      osc.detune.value = detune;
      osc.connect(gain);
      osc.start(at);
      osc.stop(end + 0.02);
      keep(osc);
    }
  }
}

/** A second of white noise, for the drums. */
function noiseBuffer(ctx: AudioContext): AudioBuffer {
  const buffer = ctx.createBuffer(1, ctx.sampleRate, ctx.sampleRate);
  const data = buffer.getChannelData(0);
  // A fixed little generator rather than Math.random, so the hats sound the same every time.
  let seed = 1;
  for (let i = 0; i < data.length; i++) {
    seed = (seed * 16807) % 2147483647;
    data[i] = (seed / 2147483647) * 2 - 1;
  }
  return buffer;
}
