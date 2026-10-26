import type { Weather } from '../data/weather';
import type { TileId, ZoneId } from '../types/ids';
import type { Mixer } from './graph';
import { line, midi, type Part, type Tune } from './tune';

/*
 * The sound of the place she's in (V1's S1, decision 321), quiet under the music: crickets after
 * dark, rain, wind in the woods and up the castle hill, water lapping by the lake, the pond and
 * the creek, the fairground's murmur, a soft hum indoors; and her footsteps and the HUD's tick.
 * What's heard is worked out here from what the music reads (the place, the hour, the weather)
 * and how near water she stands; `SoundBoard` plays it. A bed of sound is a generated node (noise
 * through filters, swelling on slow oscillators and ebbing over a minute or two) or, for the
 * crickets, a chorus of two dealt chirp by chirp, which sings in runs and rests (1.1's H2).
 */

/** Each kind of sound a place can have behind it. */
export type Layer = 'crickets' | 'rain' | 'roof' | 'wind' | 'water' | 'murmur' | 'hum';

/** How loud each layer is now, 0 to 1; a layer left out is silent. */
export type Bed = Partial<Record<Layer, number>>;

/** Everything the ambience answers to. */
export interface Surroundings {
  zone: ZoneId;
  /** Whether the place is outdoors (has a map). */
  outdoors: boolean;
  /** The hour of the clock, 0–23. */
  hour: number;
  /** The month, 1–12. */
  month: number;
  weather: Weather;
  stormy: boolean;
  /** How near open water she stands, 0 (none in earshot) to 1 (on its edge). */
  water: number;
}

/** When the crickets sing: from dusk until the small hours, from spring until the frosts. */
const CRICKET_NIGHTS = { from: 20, until: 4, months: [4, 5, 6, 7, 8, 9, 10] } as const;

/**
 * How the crickets carry in each place outdoors (about half of what they were before 1.1's H2,
 * decision 331); the rest have the town's.
 */
export const CRICKETS_IN: Partial<Record<ZoneId, number>> = {
  whisperwood: 0.4,
  hiddenClearing: 0.4,
  lanternShore: 0.4,
  booAcres: 0.4,
  castleHill: 0.2,
  fairground: 0.1,
};

/** The crickets anywhere not in `CRICKETS_IN`: the town's. */
export const CRICKETS_ELSEWHERE = 0.3;

/** The wind in each place it blows, on any day. */
const WIND_IN: Partial<Record<ZoneId, number>> = {
  whisperwood: 0.4,
  castleHill: 0.6,
  hiddenClearing: 0.3,
};

/** Water a place has all over, whatever tile she's on: the lake is the shore's whole sound. */
const WATER_IN: Partial<Record<ZoneId, number>> = { lanternShore: 0.4 };

/** The fairground's crowd, while it's open. */
const MURMUR = { from: 10, until: 23, level: 0.5 } as const;

/** The rain outdoors and on the roof indoors, on a wet day and in a storm; the hum indoors. */
const RAIN = { rain: 0.6, storm: 0.8 } as const;
const ROOF = { rain: 0.4, storm: 0.5 } as const;
const HUM = 0.3;

const round = (n: number) => Math.round(n * 10) / 10;

/** What a place sounds like behind the music, now (V1's S1). */
export function ambienceFor(s: Surroundings): Bed {
  const bed: Bed = {};
  const set = (layer: Layer, level: number) => {
    const l = round(Math.min(1, level));
    if (l > 0) bed[layer] = l;
  };
  const raining = s.weather === 'rain';
  if (!s.outdoors) {
    set('hum', HUM);
    if (raining) set('roof', s.stormy ? ROOF.storm : ROOF.rain);
    return bed;
  }
  const late = s.hour >= CRICKET_NIGHTS.from || s.hour < CRICKET_NIGHTS.until;
  if (late && !raining && (CRICKET_NIGHTS.months as readonly number[]).includes(s.month)) {
    set('crickets', CRICKETS_IN[s.zone] ?? CRICKETS_ELSEWHERE);
  }
  if (raining) set('rain', s.stormy ? RAIN.storm : RAIN.rain);
  const wind = (WIND_IN[s.zone] ?? 0) + (s.stormy ? 0.3 : 0) + (s.weather === 'fog' ? 0.1 : 0);
  set('wind', wind);
  set('water', Math.max(WATER_IN[s.zone] ?? 0, s.water * 0.8));
  if (s.zone === 'fairground' && s.hour >= MURMUR.from && s.hour < MURMUR.until) {
    set('murmur', MURMUR.level);
  }
  return bed;
}

/** How far she hears water from, in tiles. */
const WATER_REACH = 5;

/**
 * How near water she stands, 0 to 1, from the tiles round her: open water at full, ice (the
 * creek running under it, the pond frozen over) at half. Read when she steps onto a tile.
 */
export function waterNear(
  tx: number,
  ty: number,
  at: (tx: number, ty: number) => 'water' | 'ice' | null,
): number {
  let best = 0;
  for (let dy = -WATER_REACH; dy <= WATER_REACH; dy++) {
    for (let dx = -WATER_REACH; dx <= WATER_REACH; dx++) {
      const kind = at(tx + dx, ty + dy);
      if (!kind) continue;
      const near = 1 - (Math.max(1, Math.hypot(dx, dy)) - 1) / WATER_REACH;
      best = Math.max(best, near * (kind === 'water' ? 1 : 0.5));
    }
  }
  return round(best);
}

/** What she's walking on, for the sound of her steps. */
export type Ground = 'grass' | 'path' | 'boards' | 'ice' | 'floor' | 'snow' | 'puddle';

/** The ground a tile is underfoot: indoors is floor, the pier boards, the creek and pond ice. */
export function groundOf(tile: TileId | undefined, outdoors: boolean, slippery: boolean): Ground {
  if (!outdoors) return 'floor';
  if (slippery || tile === 'ice') return 'ice';
  if (tile === 'boards') return 'boards';
  if (tile === 'path' || tile === 'steps' || tile === 'dirt' || tile === 'gravel') return 'path';
  // The square's flagstones and the setts round the well (1.1's A1) sound as the cobbles do.
  if (tile === 'flagstones' || tile === 'setts') return 'path';
  return 'grass';
}

/** A footfall every this long of walking: two walk frames, one step (as the dust's, V1's E1). */
export const FOOTFALL_MS = 280;

/** Counts her steps as she walks, one footfall each time her walk cycle goes round a step. */
export class Footfalls {
  private last: number | null = null;
  private foot: 0 | 1 = 0;

  /** The foot that fell this step, or null if none did. */
  step(player: { moving: boolean; walkMs: number }): 0 | 1 | null {
    const step = player.moving ? Math.floor(player.walkMs / FOOTFALL_MS) : null;
    const fell = step !== null && this.last !== null && step !== this.last;
    this.last = step;
    if (!fell) return null;
    this.foot = this.foot === 0 ? 1 : 0;
    return this.foot;
  }
}

/** A short sound at 240 beats a minute, as the cues are. */
function blip(...parts: Part[]): Tune {
  const beats = Math.max(...parts.flatMap((p) => p.notes.map((n) => n.at + n.beats)));
  return { bpm: 240, beats, parts };
}

const brush = (notes: string, gain: number, q = 1, pan?: number): Part => ({
  wave: 'brush',
  notes: line(notes),
  gain,
  q,
  ...(pan !== undefined && { pan }),
});

const knock = (notes: string, gain: number): Part => ({
  wave: 'sine',
  notes: line(notes),
  gain,
  pluck: true,
});

/**
 * Her footsteps, a left and a right for each ground, each a little off the middle on its side:
 * a swish of grass, the crunch of the path, a hollow knock on the boards, a skate's hiss on the
 * ice, a soft pat indoors, a squeak in the snow and a splash in a puddle. All of them quiet: she hears she's walking, not each step.
 */
export const FOOTSTEPS: Record<Ground, readonly [Tune, Tune]> = {
  grass: [
    blip(brush('A6:.18', 0.15, 0.9, -0.15), brush('-:.06 D7:.14', 0.09, 1.2, -0.15)),
    blip(brush('G6:.18', 0.15, 0.9, 0.15), brush('-:.06 C7:.14', 0.09, 1.2, 0.15)),
  ],
  path: [
    blip(brush('C7:.06 -:.04 E7:.1', 0.18, 2, -0.15), brush('C5:.14', 0.12, 1, -0.15)),
    blip(brush('B6:.06 -:.04 D7:.1', 0.18, 2, 0.15), brush('B4:.14', 0.12, 1, 0.15)),
  ],
  boards: [
    blip(knock('A3:.12', 0.09), brush('E5:.12', 0.07, 1.5, -0.15)),
    blip(knock('G3:.12', 0.09), brush('D5:.12', 0.07, 1.5, 0.15)),
  ],
  ice: [
    blip(brush('G7:.3', 0.14, 3, -0.15), knock('E7:.06', 0.04)),
    blip(brush('F#7:.3', 0.14, 3, 0.15), knock('D#7:.06', 0.04)),
  ],
  floor: [
    blip(brush('A4:.12', 0.18, 1, -0.15), knock('A3:.08', 0.075)),
    blip(brush('G4:.12', 0.18, 1, 0.15), knock('G3:.08', 0.075)),
  ],
  // Lying snow, a soft squeaky crunch; and a puddle, a splash (1.6's X4).
  snow: [
    blip(brush('E6:.08 -:.02 C6:.12', 0.16, 1.6, -0.15), knock('C4:.06', 0.03)),
    blip(brush('D6:.08 -:.02 B5:.12', 0.16, 1.6, 0.15), knock('B3:.06', 0.03)),
  ],
  puddle: [
    blip(brush('C7:.08 G6:.16', 0.2, 0.7, -0.15), knock('E5:.1', 0.05)),
    blip(brush('B6:.08 F6:.16', 0.2, 0.7, 0.15), knock('D5:.1', 0.05)),
  ],
};

/** The HUD's tick (V1's S1): a soft, dry click under the thumb on every button. */
export const TICK: Tune = blip(brush('E7:.05', 0.15, 2.5), knock('E6:.05', 0.06));

/**
 * One cricket: how high it sings, how loud, how narrow its band of noise, and where it sits. A
 * chirp is three quick pulses of it.
 */
export interface Cricket {
  pitch: string;
  gain: number;
  /** The brush's band: wide enough to be a chirp, not a whistle in the ear. */
  q: number;
  pan: number;
}

/**
 * The chorus (1.1's H2, decision 331): one cricket near and one farther off and softer. A third
 * sang once, highest of all, and was the one in the ear.
 */
export const CRICKETS: readonly [Cricket, Cricket] = [
  { pitch: 'B7', gain: 0.25, q: 4, pan: -0.4 },
  { pitch: 'G7', gain: 0.13, q: 3, pan: 0.55 },
];

/**
 * How the chorus goes (1.1's H2): a phrase is one cricket's run of chirps, answered by the other
 * more often than not, now and then a little over the end of it (the swell); then both rest.
 * Each range is in chirps or seconds, and each draw is anywhere within it.
 */
export const CHORUS = {
  /** Chirps in a run. */
  chirps: [4, 8],
  /** Seconds from one chirp to the next within a run, before each chirp's own little wobble. */
  every: [0.45, 0.65],
  wobble: 0.05,
  /** How often a run is answered by the other cricket. */
  answered: 0.6,
  /** Seconds from the last chirp of a run to its answer: below zero, they sing together a moment. */
  answer: [-1, 4],
  /** Seconds of quiet between phrases. */
  rest: [20, 60],
  /** Seconds before the first phrase, as she steps out. */
  lead: [1, 4],
} as const;

/** One chirp of the chorus: when, in seconds from its start, which cricket, and how loud, 0–1. */
export interface Chirp {
  at: number;
  cricket: 0 | 1;
  level: number;
}

/** A little seeded generator, 0 to 1 (mulberry32), so a chorus is the same from the same seed. */
function dealer(seed: number): () => number {
  let s = seed >>> 0;
  return () => {
    s = (s + 0x6d2b79f5) >>> 0;
    let t = Math.imul(s ^ (s >>> 15), 1 | s);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

/**
 * The crickets' chorus, chirp by chirp in time order, forever, dealt from `seed` (1.1's H2):
 * runs that swell and fade, softest at their ends, and rests long enough to hear the night
 * between them. `SoundBoard` sets each chirp going as its time comes near; the tests read it
 * for minutes at a time.
 */
export function* chorus(seed: number): Generator<Chirp, never> {
  const deal = dealer(seed);
  const within = ([lo, hi]: readonly [number, number]) => lo + (hi - lo) * deal();
  const run = (cricket: 0 | 1, from: number): Chirp[] => {
    const n = Math.min(
      CHORUS.chirps[1],
      Math.floor(within([CHORUS.chirps[0], CHORUS.chirps[1] + 1])),
    );
    const every = within(CHORUS.every);
    const out: Chirp[] = [];
    let at = from;
    for (let i = 0; i < n; i++) {
      out.push({ at, cricket, level: 0.55 + 0.45 * Math.sin((Math.PI * (i + 0.5)) / n) });
      at += every + (deal() * 2 - 1) * CHORUS.wobble;
    }
    return out;
  };
  let at = within(CHORUS.lead);
  for (;;) {
    const first: 0 | 1 = deal() < 0.5 ? 0 : 1;
    const phrase = run(first, at);
    if (deal() < CHORUS.answered) {
      const last = phrase[phrase.length - 1]!.at;
      phrase.push(...run(first === 0 ? 1 : 0, Math.max(at, last + within(CHORUS.answer))));
    }
    phrase.sort((a, b) => a.at - b.at);
    yield* phrase;
    at = phrase[phrase.length - 1]!.at + within(CHORUS.rest);
  }
}

/** A chirp is three quick pulses of noise, each this long and this far apart, in seconds. */
const PULSE = { length: 0.0175, apart: 0.03 } as const;

/** Sets one chirp of the chorus going at `at` (the context's time), into `out`. */
export function chirpInto(
  mixer: Mixer,
  chirp: Chirp,
  at: number,
  out: AudioNode,
  sources?: Set<AudioScheduledSourceNode>,
): void {
  const cricket = CRICKETS[chirp.cricket];
  const part: Part = {
    wave: 'brush',
    notes: [],
    gain: cricket.gain * chirp.level,
    q: cricket.q,
    pan: cricket.pan,
  };
  // At a beat a second, a note's beats are its seconds.
  const note = { at: 0, beats: PULSE.length, pitch: midi(cricket.pitch) };
  for (let i = 0; i < 3; i++) mixer.voice(part, note, at + i * PULSE.apart, 1, out, sources);
}

/** How much louder or softer each noise layer is made, at a level of 1. */
const LAYER_GAIN: Record<NoiseLayer, number> = {
  rain: 0.08,
  roof: 0.16,
  wind: 0.24,
  water: 0.3,
  murmur: 0.3,
  hum: 0.2,
};

/** The layers of noise, every layer but the crickets. */
export type NoiseLayer = Exclude<Layer, 'crickets'>;

/**
 * How each layer of noise ebbs and swells over a minute or two (1.1's H2, decision 331), so none
 * is a constant hiss: the whole layer rides between `floor` and its full level on two slow
 * waves, the first `periods[0]` seconds round and carrying four parts of the swing, the second
 * shorter and out of step with it, carrying the fifth. Its quick movements (a gust, a lap, the
 * patter) ride on top, as before.
 */
export const EBB: Record<NoiseLayer, { floor: number; periods: readonly [number, number] }> = {
  rain: { floor: 0.4, periods: [71, 29] },
  roof: { floor: 0.4, periods: [83, 31] },
  // The wind gusted already: its ebb only brings a calmer minute now and then.
  wind: { floor: 0.5, periods: [97, 41] },
  water: { floor: 0.4, periods: [67, 26] },
  murmur: { floor: 0.35, periods: [89, 37] },
  hum: { floor: 0.5, periods: [113, 47] },
};

/** Where an ebb sits, and how far each of its two waves moves it either side, from its row. */
export function ebbOf(layer: NoiseLayer): { middle: number; long: number; short: number } {
  const { floor } = EBB[layer];
  const swing = (1 - floor) / 2;
  return { middle: (1 + floor) / 2, long: swing * 0.8, short: swing * 0.2 };
}

/**
 * A layer of noise, made once when it starts: the noise through its filters, swelling and
 * moving on slow oscillators of its own, into `out`. Nothing in it is touched again until it
 * stops: the oscillators do all the moving.
 */
export function noiseLayer(mixer: Mixer, layer: NoiseLayer, out: GainNode): () => void {
  const ctx = mixer.ctx;
  const sources: AudioScheduledSourceNode[] = [];
  const noise = (from: number) => {
    const s = ctx.createBufferSource();
    s.buffer = mixer.noise;
    s.loop = true;
    s.start(ctx.currentTime, from);
    sources.push(s);
    return s;
  };
  const filter = (type: BiquadFilterType, frequency: number, q = 0.7) => {
    const f = ctx.createBiquadFilter();
    f.type = type;
    f.frequency.value = frequency;
    f.Q.value = q;
    return f;
  };
  const level = (value: number) => {
    const g = ctx.createGain();
    g.gain.value = value;
    return g;
  };
  /** A slow oscillator moving `param` by `depth` either side of where it's set, `hz` times a second. */
  const sway = (param: AudioParam, hz: number, depth: number) => {
    const o = ctx.createOscillator();
    o.frequency.value = hz;
    const d = level(depth);
    o.connect(d).connect(param);
    o.start();
    sources.push(o);
  };
  const body = level(LAYER_GAIN[layer]);
  const ebb = ebbOf(layer);
  const ebbing = level(ebb.middle);
  sway(ebbing.gain, 1 / EBB[layer].periods[0], ebb.long);
  sway(ebbing.gain, 1 / EBB[layer].periods[1], ebb.short);
  body.connect(ebbing).connect(out);
  switch (layer) {
    case 'rain': {
      // A steady hiss, with a brighter patter over it coming and going.
      noise(0)
        .connect(filter('highpass', 500))
        .connect(filter('lowpass', 4500, 0))
        .connect(body);
      const patter = level(0.35);
      noise(1.7)
        .connect(filter('bandpass', 2600, 0.8))
        .connect(patter)
        .connect(body);
      sway(patter.gain, 0.23, 0.15);
      break;
    }
    case 'roof':
      // The rain on the roof, heard from inside: low and muffled.
      noise(0.4)
        .connect(filter('lowpass', 700, 0))
        .connect(filter('highpass', 120))
        .connect(body);
      break;
    case 'wind': {
      const band = filter('bandpass', 520, 0.9);
      const gust = level(0.55);
      noise(2.3).connect(band).connect(gust).connect(body);
      sway(band.frequency, 0.06, 260);
      sway(gust.gain, 0.09, 0.35);
      sway(gust.gain, 0.031, 0.15);
      break;
    }
    case 'water': {
      // A low wash, swelling in and out as it laps, and a little glitter over it.
      const wash = level(0.6);
      noise(0.9)
        .connect(filter('lowpass', 750, 0))
        .connect(wash)
        .connect(body);
      sway(wash.gain, 0.27, 0.35);
      sway(wash.gain, 0.11, 0.15);
      const glint = level(0.12);
      noise(3.1)
        .connect(filter('bandpass', 1600, 1.2))
        .connect(glint)
        .connect(body);
      sway(glint.gain, 0.37, 0.1);
      break;
    }
    case 'murmur': {
      // A crowd's voices: two bands of noise where voices sit, each rising and falling.
      for (const [hz, rate, from] of [
        [420, 0.41, 0.2],
        [880, 0.29, 2.6],
      ] as const) {
        const voices = level(0.5);
        noise(from)
          .connect(filter('bandpass', hz, 1.6))
          .connect(voices)
          .connect(body);
        sway(voices.gain, rate, 0.3);
      }
      break;
    }
    case 'hum': {
      // The room's own quiet: a low, still air, and the faintest hum under it.
      noise(1.3)
        .connect(filter('lowpass', 240, 0))
        .connect(body);
      const hum = ctx.createOscillator();
      hum.frequency.value = 98;
      hum.connect(level(0.05)).connect(body);
      hum.start();
      sources.push(hum);
      break;
    }
  }
  return () => {
    for (const s of sources) {
      try {
        s.stop();
      } catch {
        // Already stopped.
      }
    }
    body.disconnect();
    ebbing.disconnect();
  };
}
