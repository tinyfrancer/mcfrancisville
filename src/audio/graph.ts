import { hertz, type Note, type Part } from './tune';

/*
 * The sound of the room (V1's S1, decision 321): every voice plays into a bus, each bus goes dry
 * into a master compressor and sends some of itself to one reverb made from a generated impulse,
 * so a pluck has somewhere to ring. Nothing here knows the game; `SoundBoard` decides what plays
 * and when, and a script can build the same graph on an `OfflineAudioContext` to measure it.
 */

/** The four kinds of sound, each with a level of its own under the master. */
export type Bus = 'effects' | 'music' | 'record' | 'ambience';

/** How loud each bus is, and the master over them all, after the compressor. */
export const LEVELS: Record<Bus | 'master', number> = {
  // Lower than the 0.8 of before the compressor, whose make-up gain and the reverb bring each
  // sound back to the loudness it had (measured offline, V1's S1).
  master: 0.55,
  effects: 0.7,
  music: 0.45,
  record: 0.7,
  ambience: 0.5,
};

/**
 * How much of each bus goes to the reverb: the music and the ambience wetter, so they sit back
 * in the room, the cues drier, so a tap still sounds like a tap.
 */
export const SENDS: Record<Bus, number> = {
  effects: 0.12,
  music: 0.34,
  record: 0.2,
  ambience: 0.4,
};

/** The reverb's tail, in seconds, and how long before it starts. */
const TAIL_S = 2.2;
const PRE_DELAY_S = 0.018;

/** How long the noise the drums, brushes and ambience are cut from lasts, in seconds. */
const NOISE_S = 4;

/** The waves with overtones to soften: how many times their pitch the lowpass sits at. */
const SOFTEN: Partial<Record<Part['wave'], number>> = { triangle: 6, square: 3.5, sawtooth: 3 };
const SOFTEN_RANGE = { low: 700, high: 7000 };

/** Every bus, the reverb and the compressor, on one context. */
export class Mixer {
  readonly ctx: BaseAudioContext;
  readonly buses: Record<Bus, GainNode>;
  /** Stereo noise, a different stream each side, for the drums, brushes and ambience. */
  readonly noise: AudioBuffer;
  /** What goes into the master compressor, for anything with its own way in. */
  readonly input: AudioNode;
  /** A pan into each destination, made once per position and kept. */
  private readonly pans = new WeakMap<AudioNode, Map<number, AudioNode>>();

  constructor(ctx: BaseAudioContext) {
    this.ctx = ctx;
    const master = ctx.createGain();
    master.gain.value = LEVELS.master;
    master.connect(ctx.destination);
    const squeeze = ctx.createDynamicsCompressor();
    squeeze.threshold.value = -20;
    squeeze.knee.value = 18;
    squeeze.ratio.value = 3;
    squeeze.attack.value = 0.006;
    squeeze.release.value = 0.3;
    squeeze.connect(master);
    this.input = squeeze;
    const reverb = ctx.createConvolver();
    reverb.buffer = impulse(ctx);
    reverb.connect(squeeze);
    const bus = (name: Bus): GainNode => {
      const g = ctx.createGain();
      g.gain.value = LEVELS[name];
      g.connect(squeeze);
      const send = ctx.createGain();
      send.gain.value = SENDS[name];
      g.connect(send).connect(reverb);
      return g;
    };
    this.buses = {
      effects: bus('effects'),
      music: bus('music'),
      record: bus('record'),
      ambience: bus('ambience'),
    };
    this.noise = noiseBuffer(ctx, NOISE_S, 2);
  }

  /** Where a part plays into: the destination itself, or a pan into it kept for its position. */
  into(destination: AudioNode, pan = 0): AudioNode {
    if (pan === 0 || typeof this.ctx.createStereoPanner !== 'function') return destination;
    let byPan = this.pans.get(destination);
    if (!byPan) this.pans.set(destination, (byPan = new Map()));
    let panner = byPan.get(pan);
    if (!panner) {
      const p = this.ctx.createStereoPanner();
      p.pan.value = Math.max(-1, Math.min(1, pan));
      p.connect(destination);
      byPan.set(pan, (panner = p));
    }
    return panner;
  }

  /**
   * One note on one voice, from `at` for its length, with its envelope; each source made is put
   * in `sources`, if given, until it ends.
   */
  voice(
    part: Part,
    note: Note,
    at: number,
    spb: number,
    destination: AudioNode,
    sources?: Set<AudioScheduledSourceNode>,
  ): void {
    const ctx = this.ctx;
    const length = note.beats * spb;
    const keep = (source: AudioScheduledSourceNode) => {
      if (!sources) return;
      sources.add(source);
      source.onended = () => sources.delete(source);
    };
    const gain = ctx.createGain();
    gain.connect(this.into(destination, part.pan));

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
    if (part.wave === 'snare' || part.wave === 'hat' || part.wave === 'brush') {
      const source = ctx.createBufferSource();
      source.buffer = this.noise;
      const filter = ctx.createBiquadFilter();
      let decay: number;
      if (part.wave === 'brush') {
        filter.type = 'bandpass';
        filter.frequency.value = hertz(note.pitch);
        filter.Q.value = part.q ?? 1.2;
        decay = Math.max(0.02, length);
        gain.gain.setValueAtTime(0, at);
        gain.gain.linearRampToValueAtTime(part.gain, at + (part.attack ?? 0.003));
      } else {
        filter.type = 'highpass';
        filter.frequency.value = part.wave === 'hat' ? 7000 : 1200;
        decay = part.wave === 'hat' ? 0.05 : 0.16;
        gain.gain.setValueAtTime(part.gain, at);
      }
      gain.gain.exponentialRampToValueAtTime(0.001, at + decay);
      source.connect(filter).connect(gain);
      // From a different place in the noise each time, so no two brushes are the same grain.
      const from = (note.pitch * 0.137 + at * 7.31) % (NOISE_S - 1);
      source.start(at, from);
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
    // A triangle's or square's upper overtones buzz on a phone's speaker: a lowpass a few times
    // its pitch keeps the body of the note and takes off the edge.
    let into: AudioNode = gain;
    const soften = SOFTEN[part.wave];
    if (soften) {
      const filter = ctx.createBiquadFilter();
      filter.type = 'lowpass';
      filter.frequency.value = softened(note.pitch, soften);
      filter.Q.value = 0;
      filter.connect(gain);
      into = filter;
    }
    const detunes = part.chorus ? [0, part.chorus] : [0];
    for (const detune of detunes) {
      const osc = ctx.createOscillator();
      osc.type = part.wave as OscillatorType;
      osc.frequency.value = hertz(note.pitch);
      osc.detune.value = detune;
      osc.connect(into);
      osc.start(at);
      osc.stop(end + 0.02);
      keep(osc);
    }
  }
}

/** Where a soft wave's lowpass sits for a pitch: `times` its frequency, kept within reason. */
export function softened(pitch: number, times: number): number {
  return Math.min(SOFTEN_RANGE.high, Math.max(SOFTEN_RANGE.low, hertz(pitch) * times));
}

/** A fixed little generator rather than Math.random, so the noise is the same every time. */
function* seeded(seed: number): Generator<number, never> {
  let s = seed;
  for (;;) {
    s = (s * 16807) % 2147483647;
    yield (s / 2147483647) * 2 - 1;
  }
}

/** White noise, `seconds` long, a different stream on each channel. */
export function noiseBuffer(ctx: BaseAudioContext, seconds: number, channels = 1): AudioBuffer {
  const buffer = ctx.createBuffer(channels, Math.round(ctx.sampleRate * seconds), ctx.sampleRate);
  for (let c = 0; c < channels; c++) {
    const data = buffer.getChannelData(c);
    const random = seeded(1 + c * 7919);
    for (let i = 0; i < data.length; i++) data[i] = random.next().value;
  }
  return buffer;
}

/**
 * A room's echo, made rather than recorded: a moment's silence, then noise dying away over the
 * tail, darker as it dies (as a real room's highs fade first), a different stream each side.
 */
export function impulse(ctx: BaseAudioContext): AudioBuffer {
  const rate = ctx.sampleRate;
  const length = Math.round(rate * TAIL_S);
  const delay = Math.round(rate * PRE_DELAY_S);
  const buffer = ctx.createBuffer(2, length, rate);
  for (let c = 0; c < 2; c++) {
    const data = buffer.getChannelData(c);
    const random = seeded(101 + c * 31);
    let low = 0;
    for (let i = delay; i < length; i++) {
      const t = (i - delay) / (length - delay);
      // From bright to dark: a one-pole lowpass closing as the tail goes on.
      low += (random.next().value - low) * (0.9 - 0.8 * t);
      data[i] = low * Math.exp(-6.9 * t) * 0.6;
    }
  }
  return buffer;
}
