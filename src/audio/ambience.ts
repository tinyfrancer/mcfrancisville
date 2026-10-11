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
 * through filters, swelling on slow oscillators) or, for the crickets, a `Tune` on a loop.
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
const CRICKETS = { from: 20, until: 4, months: [4, 5, 6, 7, 8, 9, 10] } as const;

/** How the crickets carry in each place outdoors; the rest have the town's. */
const CRICKETS_IN: Partial<Record<ZoneId, number>> = {
  whisperwood: 0.9,
  hiddenClearing: 0.9,
  lanternShore: 0.8,
  booAcres: 0.9,
  castleHill: 0.5,
  fairground: 0.35,
};

/** The wind in each place it blows, on any day. */
const WIND_IN: Partial<Record<ZoneId, number>> = {
  whisperwood: 0.45,
  castleHill: 0.7,
  hiddenClearing: 0.3,
};

/** Water a place has all over, whatever tile she's on: the lake is the shore's whole sound. */
const WATER_IN: Partial<Record<ZoneId, number>> = { lanternShore: 0.45 };

/** The fairground's crowd, while it's open. */
const MURMUR = { from: 10, until: 23, level: 0.55 } as const;

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
    set('hum', 0.4);
    if (raining) set('roof', s.stormy ? 0.6 : 0.45);
    return bed;
  }
  const late = s.hour >= CRICKETS.from || s.hour < CRICKETS.until;
  if (late && !raining && (CRICKETS.months as readonly number[]).includes(s.month)) {
    set('crickets', CRICKETS_IN[s.zone] ?? 0.6);
  }
  if (raining) set('rain', s.stormy ? 0.9 : 0.7);
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
export type Ground = 'grass' | 'path' | 'boards' | 'ice' | 'floor';

/** The ground a tile is underfoot: indoors is floor, the pier boards, the creek and pond ice. */
export function groundOf(tile: TileId | undefined, outdoors: boolean, slippery: boolean): Ground {
  if (!outdoors) return 'floor';
  if (slippery || tile === 'ice') return 'ice';
  if (tile === 'boards') return 'boards';
  if (tile === 'path' || tile === 'steps' || tile === 'dirt' || tile === 'gravel') return 'path';
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
 * ice, a soft pat indoors. All of them quiet: she hears she's walking, not each step.
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
};

/** The HUD's tick (V1's S1): a soft, dry click under the thumb on every button. */
export const TICK: Tune = blip(brush('E7:.05', 0.15, 2.5), knock('E6:.05', 0.06));

/**
 * One cricket: a chirp is three quick pulses of a narrow band of noise, high up, and the chirps
 * come unevenly, at `chirps` (in beats), round a loop `beats` long.
 */
function cricket(pitch: string, chirps: readonly number[], beats: number, pan: number): Tune {
  const notes = chirps.flatMap((at) =>
    [0, 0.12, 0.24].map((after) => ({ at: at + after, beats: 0.07, pitch: midi(pitch) })),
  );
  return { bpm: 240, beats, parts: [{ wave: 'brush', notes, gain: 0.45, q: 8, pan }] };
}

/**
 * Three crickets, one each side and one farther off, each round a loop of its own length so
 * together they never fall into step.
 */
export const CRICKET_SONGS: readonly Tune[] = [
  cricket('B7', [0, 1.6, 3.1, 4.8, 6.3, 9.2, 10.7, 12.3, 13.8, 17.1, 18.6, 20.2], 23, -0.55),
  cricket('A7', [0.9, 2.6, 4.2, 7.4, 9.0, 10.6, 14.1, 15.7, 17.3, 18.9, 24.6, 26.2], 29, 0.6),
  cricket('C8', [2.2, 5.0, 7.9, 12.6, 15.4, 21.0], 31, 0.1),
];

/** How much louder or softer each noise layer is made, at a level of 1. */
const LAYER_GAIN: Record<Exclude<Layer, 'crickets'>, number> = {
  rain: 0.08,
  roof: 0.16,
  wind: 0.24,
  water: 0.3,
  murmur: 0.3,
  hum: 0.2,
};

/**
 * A layer of noise, made once when it starts: the noise through its filters, swelling and
 * moving on slow oscillators of its own, into `out`. Nothing in it is touched again until it
 * stops: the oscillators do all the moving.
 */
export function noiseLayer(
  mixer: Mixer,
  layer: Exclude<Layer, 'crickets'>,
  out: GainNode,
): () => void {
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
  body.connect(out);
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
  };
}
