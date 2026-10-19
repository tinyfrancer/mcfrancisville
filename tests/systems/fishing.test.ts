import { describe, expect, it } from 'vitest';
import { CRITTER_IDS, CRITTERS, isFish } from '../../src/data/critters';
import {
  BITE_MS,
  bestReelAfter,
  CAST_MS,
  lineAt,
  needleAt,
  nextBite,
  NIBBLE_MS,
  REEL_SWEEPS,
  reelGrade,
  reelLength,
  reelOf,
  roundOf,
  type Nibbler,
} from '../../src/systems/fishing';

const COMMON: Nibbler = { wary: 0, biteMs: BITE_MS.common };
const WARY: Nibbler = { wary: 1, biteMs: BITE_MS.common };

/** When the first bite comes, from the cast. */
function firstBite(seed: string, wary: number): number {
  return CAST_MS + roundOf(seed, 0, wary).bite;
}

describe('a line in the water', () => {
  it('casts, waits, nibbles and bites, and the bite lasts long enough to tap', () => {
    expect(lineAt('a', COMMON, 0).state).toBe('casting');
    expect(lineAt('a', COMMON, CAST_MS).state).toBe('waiting');
    const bite = firstBite('a', 0);
    expect(lineAt('a', COMMON, bite - 1).state).not.toBe('bite');
    expect(lineAt('a', COMMON, bite).state).toBe('bite');
    expect(lineAt('a', COMMON, bite + BITE_MS.common - 1)).toEqual({ state: 'bite', round: 0 });
    expect(BITE_MS.common).toBeGreaterThanOrEqual(1000);
    const round = roundOf('a', 0, 0);
    for (const [i, n] of round.nibbles.entries()) {
      expect(lineAt('a', COMMON, CAST_MS + n)).toEqual({ state: 'nibble', round: 0, nibble: i });
      expect(lineAt('a', COMMON, CAST_MS + n + NIBBLE_MS).state).toBe('waiting');
    }
  });

  it('is the same for the same cast, and different for another', () => {
    expect(roundOf('a', 0, 0)).toEqual(roundOf('a', 0, 0));
    const bites = new Set(Array.from({ length: 20 }, (_, i) => firstBite(`cast${i}`, 0)));
    expect(bites.size).toBeGreaterThan(10);
  });

  it('bites within a few seconds, a wary fish after a couple more nibbles', () => {
    for (let i = 0; i < 200; i++) {
      const seed = `cast${i}`;
      expect(firstBite(seed, 0)).toBeLessThan(6000);
      expect(firstBite(seed, 1)).toBeLessThan(10_000);
      expect(roundOf(seed, 0, 1).nibbles.length).toBe(roundOf(seed, 0, 0).nibbles.length + 2);
    }
  });

  it('comes round to another bite after one let go, forever', () => {
    const after = firstBite('a', 0) + BITE_MS.common;
    expect(lineAt('a', COMMON, after)).toMatchObject({ round: 1 });
    expect(lineAt('a', COMMON, after).state).not.toBe('bite');
    // Ten minutes on, it's still going round.
    const late = 10 * 60_000;
    const bites = Array.from({ length: 30 }, (_, s) => lineAt('a', COMMON, late + s * 1000).state);
    expect(bites).toContain('bite');
  });

  it('says when the bite she is in, or the next, starts and ends', () => {
    const bite = firstBite('a', 1);
    expect(nextBite('a', WARY, 0)).toEqual({ from: bite, to: bite + BITE_MS.common });
    expect(nextBite('a', WARY, bite + 10)).toEqual({ from: bite, to: bite + BITE_MS.common });
    const next = nextBite('a', WARY, bite + BITE_MS.common);
    expect(next.from).toBeGreaterThan(bite + BITE_MS.common);
    expect(lineAt('a', WARY, next.from).state).toBe('bite');
    expect(lineAt('a', WARY, next.to - 1).state).toBe('bite');
    expect(lineAt('a', WARY, next.to).state).not.toBe('bite');
  });
});

describe('a bite by how rare the fish is (V1 R6a)', () => {
  it('is shorter the rarer the fish: about 1.5 s common down to 0.7 s legendary', () => {
    expect(BITE_MS).toEqual({ common: 1500, uncommon: 1100, rare: 900, legendary: 700 });
  });

  it('holds the float under for as long as its tier says', () => {
    for (const rarity of ['common', 'uncommon', 'rare', 'legendary'] as const) {
      const fish = { wary: 0, biteMs: BITE_MS[rarity] };
      const bite = firstBite('b', 0);
      expect(lineAt('b', fish, bite + BITE_MS[rarity] - 1).state, rarity).toBe('bite');
      expect(lineAt('b', fish, bite + BITE_MS[rarity]).state, rarity).not.toBe('bite');
    }
  });
});

describe('the reel (V1 R6a)', () => {
  it('is only for a rare or legendary fish, the same for the same cast', () => {
    expect(reelOf('a', 'common')).toBeNull();
    expect(reelOf('a', 'uncommon')).toBeNull();
    expect(reelOf('a', 'rare')).toEqual(reelOf('a', 'rare'));
    const targets = new Set(Array.from({ length: 20 }, (_, i) => reelOf(`c${i}`, 'rare')!.target));
    expect(targets.size).toBeGreaterThan(10);
    for (const t of targets) {
      expect(t).toBeGreaterThanOrEqual(0.3);
      expect(t).toBeLessThanOrEqual(0.7);
    }
  });

  it('sweeps the needle there and back across the bar, from the left', () => {
    const reel = reelOf('a', 'rare')!;
    expect(needleAt(reel, 0)).toBe(0);
    expect(needleAt(reel, reel.period / 2)).toBeCloseTo(1);
    expect(needleAt(reel, reel.period)).toBeCloseTo(0);
    expect(needleAt(reel, reel.period / 4)).toBeCloseTo(0.5);
  });

  it('lands a tap on the middle, and goes slack on one well wide of it', () => {
    for (let i = 0; i < 40; i++) {
      for (const rarity of ['rare', 'legendary'] as const) {
        const reel = reelOf(`r${i}`, rarity)!;
        const best = bestReelAfter(reel, 0);
        expect(reelGrade(reel, best), `${rarity} ${i}`).toBe(2);
        expect(Math.abs(needleAt(reel, best) - reel.target)).toBeLessThan(0.01);
        // At the far end of the bar the needle is wide of any window.
        expect(reelGrade(reel, reel.period / 2)).toBe(0);
        expect(reelGrade(reel, 0)).toBe(0);
      }
    }
  });

  it('gives a fair window to land in, in milliseconds, each pass', () => {
    for (const rarity of ['rare', 'legendary'] as const) {
      const reel = reelOf('w', rarity)!;
      let landed = 0;
      for (let t = 0; t < reel.period; t++) if (reelGrade(reel, t) > 0) landed++;
      // Twice a sweep, there and back: each pass at least 150 ms.
      expect(landed / 2, rarity).toBeGreaterThanOrEqual(150);
    }
  });

  it('sweeps slower under reduced motion, its window wider in time (1.0.1)', () => {
    for (const rarity of ['rare', 'legendary'] as const) {
      const quick = reelOf('s', rarity)!;
      const slow = reelOf('s', rarity, true)!;
      expect(slow.period).toBeGreaterThan(quick.period * 1.5);
      expect({ ...slow, period: 0 }).toEqual({ ...quick, period: 0 });
      const pass = (reel: typeof quick) => {
        let landed = 0;
        for (let t = 0; t < reel.period; t++) if (reelGrade(reel, t) > 0) landed++;
        return landed / 2;
      };
      expect(pass(slow)).toBeGreaterThan(pass(quick) * 1.5);
      expect(reelGrade(slow, bestReelAfter(slow, 0))).toBe(2);
    }
  });

  it('finds the next best moment from any time', () => {
    const reel = reelOf('n', 'legendary')!;
    for (let from = 0; from < reelLength(reel); from += 97) {
      const best = bestReelAfter(reel, from);
      expect(best).toBeGreaterThanOrEqual(from);
      expect(best - from).toBeLessThanOrEqual(reel.period);
      expect(reelGrade(reel, best)).toBe(2);
    }
    expect(reelLength(reel)).toBe(reel.period * REEL_SWEEPS);
  });
});

describe('the fish', () => {
  it('each have a shadow, and nothing else does', () => {
    for (const id of CRITTER_IDS) {
      expect(CRITTERS[id].shadow !== undefined, id).toBe(isFish(id));
    }
  });

  it('include a legendary blue one, the blue moonfish, after dark at the lake, at the full moon', () => {
    const row = CRITTERS.blueMoonfish;
    expect(row.rarity).toBe('legendary');
    expect(row.moon).toBe(true);
    expect(row.where).toEqual(['lanternShore']);
    expect(row.description).toMatch(/blue/);
    expect(row.from).toBeGreaterThanOrEqual(18);
  });
});
