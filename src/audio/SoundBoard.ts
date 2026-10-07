import {
  CRICKET_SONGS,
  FOOTSTEPS,
  noiseLayer,
  TICK,
  type Bed,
  type Ground,
  type Layer,
} from './ambience';
import { Mixer } from './graph';
import { tuneOf, type MusicKey } from './music';
import { browserPhone, SilentSwitch, type Phone } from './session';
import {
  readSilentHint,
  readSoundSettings,
  writeSilentHint,
  writeSoundSettings,
  type SoundSettings,
} from './settings';
import { secondsOf, type Note, type Part, type Tune } from './tune';

/** How far ahead the next notes of a long tune are set going, in seconds. */
const LOOKAHEAD_S = 0.6;
const TICK_MS = 120;
/** How long one place's tune takes to give way to the next's, in seconds. */
const FADE_S = 1.5;
/** How long a bed of ambience takes to come in, go, or change its level, in seconds. */
const AMBIENCE_FADE_S = 2;

/** A tune being played through: the notes in time order, and how far through it is. */
interface Playing {
  tune: Tune;
  events: { time: number; part: Part; note: Note }[];
  length: number;
  start: number;
  /** The next of `events` to set going. */
  at: number;
  loop: boolean;
  /** How many times round it has been. */
  pass: number;
  /** The tune for a later time round, for music that varies pass to pass (V1's S1). */
  passes?: (pass: number) => Tune;
  bus: AudioNode;
  /** The music's own fader on its bus, so one tune can fade out under the next. */
  fader?: GainNode;
  sources: Set<AudioScheduledSourceNode>;
}

/** A bed of ambience playing: its fader on the ambience bus, and how to stop it. */
interface Bedded {
  fader: GainNode;
  stop(): void;
}

/** How the board makes its audio context: the browser's, or a test's. */
export type MakeContext = () => AudioContext | null;

function browserContext(): AudioContext | null {
  const Context =
    globalThis.AudioContext ??
    (globalThis as unknown as { webkitAudioContext?: typeof AudioContext }).webkitAudioContext;
  return Context ? new Context() : null;
}

/**
 * Every sound the game makes, synthesised with Web Audio (decisions.md 2, for sound too: no
 * files). iOS only lets a page start making sound from inside a touch, so nothing plays until
 * her first tap (`listen`), and then the silent switch is got round first (V1's S1). The music
 * loops quietly, A and B in turn and varied each time round, crossfading as she crosses into
 * another place or a window turns (0.2's H1); a record on her record player stops it until the
 * record ends; the place's ambience plays under it all.
 */
export class SoundBoard {
  private ctx: AudioContext | null = null;
  private mixer: Mixer | null = null;
  private music: Playing | null = null;
  private record: Playing | null = null;
  /** The ambience's looping tunes (the crickets). */
  private loops: Playing[] = [];
  private timer: ReturnType<typeof setInterval> | null = null;
  private musicKey: MusicKey | null = null;
  private settings: SoundSettings;
  private readonly silent: SilentSwitch;
  private readonly makeContext: MakeContext;
  /** The ambience asked for, and what of it is playing. */
  private bed: Bed = {};
  private readonly layers = new Map<Layer, Bedded>();
  private steps = 0;
  private ticks = 0;

  constructor(
    settings: SoundSettings = readSoundSettings(),
    phone: Phone = browserPhone(),
    makeContext: MakeContext = browserContext,
  ) {
    this.settings = settings;
    this.silent = new SilentSwitch(phone);
    this.makeContext = makeContext;
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
      if (document.visibilityState === 'hidden') this.silent.hide();
      if (!this.ctx) return;
      if (document.visibilityState === 'hidden') void this.ctx.suspend();
      else void this.ctx.resume();
    });
  }

  /** The tune that loops behind everything, once sound has started; a new one fades in over it. */
  setMusic(key: MusicKey): void {
    if (key === this.musicKey) return;
    this.musicKey = key;
    if (this.music) {
      this.fadeOut(this.music);
      this.music = null;
    }
    this.startMusic();
  }

  /**
   * How far through its tune the music is, in beats, or null while none is playing: what the
   * fountain's lights pulse to (0.2's H2).
   */
  musicBeat(): number | null {
    const ctx = this.running();
    if (!ctx || !this.music) return null;
    const { tune, start, length } = this.music;
    const into = (((ctx.currentTime - start) % length) + length) % length;
    return (into * tune.bpm) / 60;
  }

  /** The music playing now, for smoke to hear it change. */
  get musicPlaying(): MusicKey | null {
    return this.music ? this.musicKey : null;
  }

  /** How many times round the music has been, and whether that's its B section, for smoke. */
  get musicPass(): number | null {
    return this.music?.pass ?? null;
  }

  setEffectsOn(on: boolean): void {
    this.settings = { ...this.settings, effects: on };
    writeSoundSettings(this.settings);
    this.applyAmbience();
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
    if (!ctx || !this.settings.effects || !this.mixer) return;
    const at = ctx.currentTime + 0.01;
    const spb = 60 / tune.bpm;
    for (const part of tune.parts) {
      for (const note of part.notes)
        this.mixer.voice(part, note, at + note.at * spb, spb, this.mixer.buses.effects);
    }
  }

  /** One of her footsteps, on the ground she's on (V1's S1). */
  footstep(ground: Ground, foot: 0 | 1): void {
    this.steps += 1;
    this.cue(FOOTSTEPS[ground][foot]);
  }

  /** The soft tick of a HUD button pressed (V1's S1). */
  uiTick(): void {
    this.ticks += 1;
    this.cue(TICK);
  }

  /** How many footsteps and ticks have been asked for, for smoke to hear them. */
  get heard(): { steps: number; ticks: number } {
    return { steps: this.steps, ticks: this.ticks };
  }

  /**
   * What's behind the music where she is (V1's S1): each layer comes in, goes, or moves to its
   * new level over a couple of seconds. Only the sounds' switch hushes it.
   */
  setAmbience(bed: Bed): void {
    this.bed = bed;
    this.applyAmbience();
  }

  /** The layers of ambience asked for now, each with its level, for smoke. */
  get ambience(): Bed {
    return this.bed;
  }

  /** The layers of ambience actually sounding, for smoke. */
  get ambiencePlaying(): Layer[] {
    return [...this.layers.keys()];
  }

  /**
   * Whether to tell her about the silent switch in Settings: true the first time only, on this
   * phone (V1's S1).
   */
  silentHint(): boolean {
    if (readSilentHint()) return false;
    writeSilentHint();
    return true;
  }

  /** Puts a record on: the music stops for it, and comes back once it's over. */
  playRecord(tune: Tune): void {
    this.stop('record');
    if (!this.running() || !this.settings.music || !this.mixer) return;
    this.stop('music');
    this.record = this.begin(tune, this.mixer.buses.record, false);
    this.schedule();
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

  /**
   * In her touch: the silent switch got round first (the session's hint, or the silence started),
   * and only then the context made or resumed, so it starts in the playback category.
   */
  private unlock(): void {
    this.silent.unlock();
    if (!this.ctx) {
      const ctx = this.makeContext();
      if (!ctx) return;
      this.mixer = new Mixer(ctx);
      this.ctx = ctx;
    }
    const started = () => {
      this.startMusic();
      this.applyAmbience();
    };
    if (this.ctx.state !== 'running') void this.ctx.resume().then(started);
    else started();
  }

  private running(): AudioContext | null {
    return this.ctx && this.ctx.state === 'running' ? this.ctx : null;
  }

  private startMusic(): void {
    if (this.music || this.record || !this.musicKey || !this.settings.music) return;
    const ctx = this.running();
    if (!ctx || !this.mixer) return;
    const fader = ctx.createGain();
    fader.gain.setValueAtTime(0, ctx.currentTime);
    fader.gain.linearRampToValueAtTime(1, ctx.currentTime + FADE_S);
    fader.connect(this.mixer.buses.music);
    const key = this.musicKey;
    this.music = {
      ...this.begin(tuneOf(key), fader, true),
      fader,
      passes: (pass) => tuneOf(key, pass),
    };
    this.schedule();
  }

  /** Lets a tune die away under the next, and stops whatever of it was still to come. */
  private fadeOut(playing: Playing): void {
    const ctx = this.ctx!;
    const end = ctx.currentTime + FADE_S;
    if (playing.fader) {
      playing.fader.gain.cancelScheduledValues(ctx.currentTime);
      playing.fader.gain.setValueAtTime(playing.fader.gain.value, ctx.currentTime);
      playing.fader.gain.linearRampToValueAtTime(0, end);
    }
    for (const source of playing.sources) {
      try {
        source.stop(end);
      } catch {
        // Already stopped.
      }
    }
    setTimeout(() => playing.fader?.disconnect(), FADE_S * 1000 + 200);
  }

  private begin(tune: Tune, bus: AudioNode, loop: boolean): Playing {
    if (!this.timer) this.timer = setInterval(() => this.schedule(), TICK_MS);
    return {
      tune,
      events: eventsOf(tune),
      length: secondsOf(tune),
      start: this.ctx!.currentTime + 0.1,
      at: 0,
      loop,
      pass: 0,
      bus,
      sources: new Set(),
    };
  }

  /** Sets going whatever notes are due in the next moment, and notices a record ending. */
  private schedule(): void {
    const ctx = this.running();
    if (!ctx || !this.mixer) return;
    const horizon = ctx.currentTime + LOOKAHEAD_S;
    for (const playing of [this.music, this.record, ...this.loops]) {
      if (!playing) continue;
      while (playing.at < playing.events.length) {
        const e = playing.events[playing.at]!;
        const at = playing.start + e.time;
        if (at > horizon) break;
        const spb = 60 / playing.tune.bpm;
        this.mixer.voice(e.part, e.note, at, spb, playing.bus, playing.sources);
        playing.at += 1;
        if (playing.at === playing.events.length && playing.loop) this.round(playing);
      }
    }
    if (this.record && ctx.currentTime > this.record.start + this.record.length + 0.3) {
      this.record = null;
      this.startMusic();
    }
    if (!this.music && !this.record && this.loops.length === 0 && this.timer) {
      clearInterval(this.timer);
      this.timer = null;
    }
  }

  /** A loop goes round again: the next time round of a varying tune, written once as it comes. */
  private round(playing: Playing): void {
    playing.start += playing.length;
    playing.at = 0;
    playing.pass += 1;
    if (!playing.passes) return;
    const tune = playing.passes(playing.pass);
    playing.tune = tune;
    playing.events = eventsOf(tune);
    playing.length = secondsOf(tune);
  }

  private stop(which: 'music' | 'record'): void {
    const playing = this[which];
    if (!playing) return;
    stopAll(playing.sources);
    this[which] = null;
  }

  /** Brings the ambience playing in line with what's asked for, fading each layer in or out. */
  private applyAmbience(): void {
    const ctx = this.running();
    if (!ctx || !this.mixer) return;
    const want: Bed = this.settings.effects ? this.bed : {};
    const now = ctx.currentTime;
    for (const [layer, bedded] of this.layers) {
      if (want[layer]) continue;
      bedded.fader.gain.cancelScheduledValues(now);
      bedded.fader.gain.setTargetAtTime(0, now, AMBIENCE_FADE_S / 3);
      setTimeout(() => bedded.stop(), AMBIENCE_FADE_S * 1500);
      this.layers.delete(layer);
    }
    for (const [layer, level] of Object.entries(want) as [Layer, number][]) {
      let bedded = this.layers.get(layer);
      if (!bedded) {
        const fader = ctx.createGain();
        fader.gain.value = 0;
        fader.connect(this.mixer.buses.ambience);
        const stop =
          layer === 'crickets' ? this.crickets(fader) : noiseLayer(this.mixer, layer, fader);
        bedded = {
          fader,
          stop() {
            stop();
            fader.disconnect();
          },
        };
        this.layers.set(layer, bedded);
      }
      bedded.fader.gain.cancelScheduledValues(now);
      bedded.fader.gain.setTargetAtTime(level, now, AMBIENCE_FADE_S / 3);
    }
  }

  /** The crickets: each one's song looping into `fader`, until stopped. */
  private crickets(fader: GainNode): () => void {
    const songs = CRICKET_SONGS.map((tune) => this.begin(tune, fader, true));
    this.loops.push(...songs);
    this.schedule();
    return () => {
      for (const song of songs) stopAll(song.sources);
      this.loops = this.loops.filter((l) => !songs.includes(l));
    };
  }
}

/** A tune's notes in the order they're played, each with its time in seconds. */
function eventsOf(tune: Tune): Playing['events'] {
  const spb = 60 / tune.bpm;
  return tune.parts
    .flatMap((part) => part.notes.map((note) => ({ time: note.at * spb, part, note })))
    .sort((a, b) => a.time - b.time);
}

function stopAll(sources: Set<AudioScheduledSourceNode>): void {
  for (const source of sources) {
    try {
      source.stop();
    } catch {
      // Already stopped.
    }
  }
}
