import { describe, expect, it } from 'vitest';
import { CRITTER_IDS, CRITTERS, isFish } from '../../src/data/critters';
import { BITE_MS, CAST_MS, lineAt, NIBBLE_MS, roundOf } from '../../src/systems/fishing';

/** When the first bite comes, from the cast. */
function firstBite(seed: string, wary: number): number {
  return CAST_MS + roundOf(seed, 0, wary).bite;
}

describe('a line in the water', () => {
  it('casts, waits, nibbles and bites, and the bite lasts long enough to tap', () => {
    expect(lineAt('a', 0, 0).state).toBe('casting');
    expect(lineAt('a', 0, CAST_MS).state).toBe('waiting');
    const bite = firstBite('a', 0);
    expect(lineAt('a', 0, bite - 1).state).not.toBe('bite');
    expect(lineAt('a', 0, bite).state).toBe('bite');
    expect(lineAt('a', 0, bite + BITE_MS - 1)).toEqual({ state: 'bite', round: 0 });
    expect(BITE_MS).toBeGreaterThanOrEqual(1000);
    const round = roundOf('a', 0, 0);
    for (const [i, n] of round.nibbles.entries()) {
      expect(lineAt('a', 0, CAST_MS + n)).toEqual({ state: 'nibble', round: 0, nibble: i });
      expect(lineAt('a', 0, CAST_MS + n + NIBBLE_MS).state).toBe('waiting');
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
    const after = firstBite('a', 0) + BITE_MS;
    expect(lineAt('a', 0, after)).toMatchObject({ round: 1 });
    expect(lineAt('a', 0, after).state).not.toBe('bite');
    // Ten minutes on, it's still going round.
    const late = 10 * 60_000;
    const bites = Array.from({ length: 30 }, (_, s) => lineAt('a', 0, late + s * 1000).state);
    expect(bites).toContain('bite');
  });
});

describe('the fish', () => {
  it('each have a shadow, and nothing else does', () => {
    for (const id of CRITTER_IDS) {
      expect(CRITTERS[id].shadow !== undefined, id).toBe(isFish(id));
    }
  });

  it('include a rare blue one, the blue moonfish, after dark at the lake', () => {
    const row = CRITTERS.blueMoonfish;
    expect(row.rarity).toBe('rare');
    expect(row.where).toEqual(['lanternShore']);
    expect(row.description).toMatch(/blue/);
    expect(row.from).toBeGreaterThanOrEqual(18);
  });
});
