import { describe, expect, it } from 'vitest';
import { hashMixed, hashString, seeded } from '../../src/systems/random';

describe('random', () => {
  it('hashes a string the same way every time', () => {
    expect(hashString('pet:fibi')).toBe(hashString('pet:fibi'));
    expect(hashString('pet:fibi')).not.toBe(hashString('pet:cody'));
    // FNV-1a's offset basis: an empty string is where every hash starts.
    expect(hashString('')).toBe(0x811c9dc5);
  });

  it('deals the same numbers from the same seed, each in [0, 1)', () => {
    const a = seeded(42);
    const b = seeded(42);
    const dealt = Array.from({ length: 50 }, () => a());
    expect(dealt).toEqual(Array.from({ length: 50 }, () => b()));
    expect(dealt.every((n) => n >= 0 && n < 1)).toBe(true);
    expect(seeded(43)()).not.toBe(dealt[0]);
  });

  it('stirs a hash so keys that count up fall anywhere, not every fourth', () => {
    const plain = (n: number) => hashString(`puff:2026-10-01:${n}`) % 4;
    const mixed = (n: number) => hashMixed(`puff:2026-10-01:${n}`) % 4;
    // The pattern it's for: FNV-1a's low bits come round with the digits' low bits.
    expect([1, 2, 3, 4].map(plain)).toEqual([5, 6, 7, 8].map(plain));
    expect([1, 2, 3, 4].map(mixed)).not.toEqual([5, 6, 7, 8].map(mixed));
    expect(hashMixed('pet:fibi')).toBe(hashMixed('pet:fibi'));
  });
});
