/** A small, steady hash of a string (FNV-1a), so a day always picks the same snack and spot. */
export function hashString(text: string): number {
  let h = 0x811c9dc5;
  for (let i = 0; i < text.length; i++) {
    h ^= text.charCodeAt(i);
    h = Math.imul(h, 0x01000193);
  }
  return h >>> 0;
}

/**
 * `hashString`, stirred (murmur3's finish) so every bit of the key reaches every bit of the hash.
 * FNV-1a's low bits see only the low bits of each letter, so `hashString(key) % 4` over keys that
 * count up (`puff:day:1`, `puff:day:2`…) repeats every four; this one falls where it likes.
 */
export function hashMixed(text: string): number {
  let h = hashString(text);
  h ^= h >>> 16;
  h = Math.imul(h, 0x85ebca6b);
  h ^= h >>> 13;
  h = Math.imul(h, 0xc2b2ae35);
  h ^= h >>> 16;
  return h >>> 0;
}

/**
 * A small seeded random (mulberry32): the same seed always deals the same shelf, and a drawing
 * always comes out the same.
 */
export function seeded(seed: number): () => number {
  let t = seed >>> 0;
  return () => {
    t = (t + 0x6d2b79f5) >>> 0;
    let r = Math.imul(t ^ (t >>> 15), 1 | t);
    r ^= r + Math.imul(r ^ (r >>> 7), 61 | r);
    return ((r ^ (r >>> 14)) >>> 0) / 4294967296;
  };
}
