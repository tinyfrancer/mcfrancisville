import { describe, expect, it } from 'vitest';
import {
  ambienceFor,
  CHORUS,
  chorus,
  CRICKETS,
  EBB,
  ebbOf,
  type Chirp,
  type NoiseLayer,
  type Surroundings,
} from '../../src/audio/ambience';
import { ZONE_IDS, ZONES } from '../../src/data/zones';

/** The chorus from `seed`, for `seconds`. */
function sung(seed: number, seconds: number): Chirp[] {
  const out: Chirp[] = [];
  for (const chirp of chorus(seed)) {
    if (chirp.at >= seconds) break;
    out.push(chirp);
  }
  return out;
}

/** Seeds of every kind: small, and the clock's milliseconds as `SoundBoard` deals them. */
const SEEDS = [
  ...Array.from({ length: 40 }, (_, i) => i),
  ...Array.from({ length: 40 }, (_, i) => (1_792_000_000_000 + i * 7_919_311) % 2 ** 31),
];
const TEN_MINUTES = 600;

/** A cricket's runs, each from its first chirp to just after its last. */
function runsOf(chirps: Chirp[], cricket: 0 | 1): [number, number][] {
  const runs: [number, number][] = [];
  for (const c of chirps.filter((c) => c.cricket === cricket)) {
    const last = runs[runs.length - 1];
    if (last && c.at - last[1] < 2) last[1] = c.at + 0.1;
    else runs.push([c.at, c.at + 0.1]);
  }
  return runs;
}

const length = (spans: [number, number][]) => spans.reduce((n, [a, b]) => n + (b - a), 0);

describe('the crickets, a chorus that swells and rests (1.1’s H2)', () => {
  it('never chirps more than once a second over any minute of ten', () => {
    for (const seed of SEEDS) {
      const ats = sung(seed, TEN_MINUTES).map((c) => c.at);
      for (let from = 0; from + 60 <= TEN_MINUTES; from += 1) {
        const inMinute = ats.filter((at) => at >= from && at < from + 60).length;
        expect(inMinute, `seed ${seed}, from ${from} s`).toBeLessThanOrEqual(60);
      }
    }
  });

  it('rests at least twenty seconds in every two minutes', () => {
    for (const seed of SEEDS) {
      const ats = sung(seed, TEN_MINUTES).map((c) => c.at);
      for (let from = 0; from + 120 <= TEN_MINUTES; from += 1) {
        const marks = [from, ...ats.filter((at) => at >= from && at < from + 120), from + 120];
        let longest = 0;
        for (let i = 1; i < marks.length; i++)
          longest = Math.max(longest, marks[i]! - marks[i - 1]!);
        expect(longest, `seed ${seed}, from ${from} s`).toBeGreaterThanOrEqual(20);
      }
    }
  });

  it('sings the near cricket and the far one apart: together less than a quarter of the time', () => {
    for (const seed of SEEDS) {
      const chirps = sung(seed, TEN_MINUTES);
      const near = runsOf(chirps, 0);
      const far = runsOf(chirps, 1);
      expect(near.length, `seed ${seed}`).toBeGreaterThan(0);
      expect(far.length, `seed ${seed}`).toBeGreaterThan(0);
      const both: [number, number][] = [];
      for (const [a, b] of near) {
        for (const [c, d] of far) {
          if (Math.min(b, d) > Math.max(a, c)) both.push([Math.max(a, c), Math.min(b, d)]);
        }
      }
      const either = length(near) + length(far) - length(both);
      expect(length(both) / either, `seed ${seed}`).toBeLessThan(0.25);
    }
  });

  it('sings runs of four to eight chirps, a chirp every 0.4–0.7 s, swelling and fading', () => {
    for (const seed of SEEDS.slice(0, 10)) {
      const chirps = sung(seed, TEN_MINUTES);
      for (const cricket of [0, 1] as const) {
        const own = chirps.filter((c) => c.cricket === cricket);
        let run: Chirp[] = [];
        const check = () => {
          if (run.length === 0) return;
          expect(run.length).toBeGreaterThanOrEqual(CHORUS.chirps[0]);
          expect(run.length).toBeLessThanOrEqual(CHORUS.chirps[1]);
          for (let i = 1; i < run.length; i++) {
            const gap = run[i]!.at - run[i - 1]!.at;
            expect(gap).toBeGreaterThanOrEqual(0.4 - 1e-9);
            expect(gap).toBeLessThanOrEqual(0.7 + 1e-9);
          }
          const middle = run[Math.floor(run.length / 2)]!.level;
          expect(run[0]!.level).toBeLessThan(middle);
          expect(run[run.length - 1]!.level).toBeLessThan(middle);
        };
        for (const c of own) {
          const last = run[run.length - 1];
          if (last && c.at - last.at > 2) {
            check();
            run = [];
          }
          run.push(c);
        }
        check();
      }
    }
  });

  it('deals the same chorus from the same seed, and nothing in ten minutes over again', () => {
    expect(sung(7, 120)).toEqual(sung(7, 120));
    expect(sung(7, 120)).not.toEqual(sung(8, 120));
    for (const seed of SEEDS.slice(0, 10)) {
      const chirps = sung(seed, TEN_MINUTES);
      // Each phrase's shape: its chirps' times from its first, to the millisecond.
      const phrases: string[] = [];
      let phrase: number[] = [];
      for (const c of chirps) {
        if (phrase.length && c.at - phrase[phrase.length - 1]! > 10) {
          phrases.push(phrase.map((at) => (at - phrase[0]!).toFixed(3)).join(' '));
          phrase = [];
        }
        phrase.push(c.at);
      }
      expect(new Set(phrases).size, `seed ${seed}`).toBe(phrases.length);
    }
  });

  it('is two soft crickets with a wide band, the far one softer still', () => {
    expect(CRICKETS).toHaveLength(2);
    for (const c of CRICKETS) {
      expect(c.gain).toBeLessThanOrEqual(0.25);
      expect(c.q).toBeLessThanOrEqual(4);
    }
    expect(CRICKETS[1].gain).toBeLessThan(CRICKETS[0].gain);
  });

  it('sings low in the bed in every place outdoors: the town 0.3, the fair lowest', () => {
    const night: Surroundings = {
      zone: 'town',
      outdoors: true,
      hour: 23,
      month: 7,
      weather: 'clear',
      stormy: false,
      water: 0,
    };
    const outdoors = ZONE_IDS.filter((z) => ZONES[z].map);
    expect(outdoors.length).toBeGreaterThan(5);
    for (const zone of outdoors) {
      const level = ambienceFor({ ...night, zone }).crickets;
      expect(level, zone).toBeGreaterThan(0);
      expect(level, zone).toBeLessThanOrEqual(0.4);
    }
    expect(ambienceFor(night).crickets).toBe(0.3);
    const fair = ambienceFor({ ...night, zone: 'fairground' }).crickets!;
    for (const zone of outdoors) {
      expect(ambienceFor({ ...night, zone }).crickets, zone).toBeGreaterThanOrEqual(fair);
    }
  });
});

describe('every other layer ebbs and swells (1.1’s H2)', () => {
  const layers = Object.keys(EBB) as NoiseLayer[];

  it('has an ebb for every layer of noise', () => {
    expect(layers.sort()).toEqual(['hum', 'murmur', 'rain', 'roof', 'water', 'wind']);
  });

  it('dips below 60% of its full level once each long wave, whatever the short one does', () => {
    for (const layer of layers) {
      const { middle, long, short } = ebbOf(layer);
      expect(middle + long + short, layer).toBeCloseTo(1);
      expect(middle - long - short, layer).toBeCloseTo(EBB[layer].floor);
      // The long wave's trough, with the short one at its crest.
      expect(middle - long + short, layer).toBeLessThanOrEqual(0.6 + 1e-9);
      expect(EBB[layer].floor, layer).toBeGreaterThan(0.2);
    }
  });

  it('ebbs slowly, over a minute or two, its two waves out of step', () => {
    for (const layer of layers) {
      const [long, short] = EBB[layer].periods;
      expect(long, layer).toBeGreaterThanOrEqual(60);
      expect(long, layer).toBeLessThanOrEqual(120);
      expect(short, layer).toBeGreaterThanOrEqual(20);
      expect(short, layer).toBeLessThan(long);
      const ratio = long / short;
      expect(Math.abs(ratio - Math.round(ratio)), layer).toBeGreaterThan(0.1);
    }
  });
});
