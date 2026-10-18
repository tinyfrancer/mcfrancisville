/**
 * The phone's cloud key (V1's S2, decision 323): 128 random bits made once, kept beside the save
 * rather than in it (a backup code mustn't carry it), and shown to her as a code she could read
 * aloud. Whoever has the code has the town, so it's never sent anywhere: the cloud is told a hash
 * of it (`cloudSeal.ts`), and the town goes up sealed with another.
 */
export const CLOUD_KEY = 'mcfrancisville:cloudKey';
/** Where a key is put when another one takes its place, never thrown away (decision 25's way). */
export const OLD_CLOUD_KEY_PREFIX = 'mcfrancisville:cloudKey:previous:';

/** Crockford's base 32: no I, L, O or U, so nothing reads as something else. */
const ALPHABET = '0123456789ABCDEFGHJKMNPQRSTVWXYZ';
export const KEY_BYTES = 16;
/** 26 symbols carry the 128 bits (the last has two spare zero bits); two more check her typing. */
const DATA = 26;
const CHECK = 2;
export const CODE_LENGTH = DATA + CHECK;
/** A prime under 32², so any one symbol changed, or two side by side swapped, changes the check. */
const CHECK_MOD = 1021;

function checkOf(values: readonly number[]): number {
  return values.reduce((sum, v, i) => (sum + (i + 1) * v) % CHECK_MOD, 0);
}

/** The key as its code: 28 symbols, no gaps. */
export function toCode(bytes: Uint8Array): string {
  if (bytes.length !== KEY_BYTES) throw new Error('a cloud key is 16 bytes');
  const values: number[] = [];
  let buffer = 0;
  let bits = 0;
  for (const byte of bytes) {
    buffer = (buffer << 8) | byte;
    bits += 8;
    while (bits >= 5) {
      bits -= 5;
      values.push((buffer >> bits) & 31);
    }
    buffer &= (1 << bits) - 1;
  }
  if (bits > 0) values.push((buffer << (5 - bits)) & 31);
  const check = checkOf(values);
  values.push(check >> 5, check & 31);
  return values.map((v) => ALPHABET[v]).join('');
}

/**
 * A code as she typed or pasted it back to its key: any case, any spaces or dashes, an O for a
 * zero and an I or L for a one. Null if it isn't one (too short, a typo the check catches).
 */
export function fromCode(text: string): Uint8Array | null {
  const symbols = text
    .toUpperCase()
    .replace(/[\s-]+/g, '')
    .replace(/O/g, '0')
    .replace(/[IL]/g, '1');
  if (symbols.length !== CODE_LENGTH) return null;
  const values: number[] = [];
  for (const s of symbols) {
    const v = ALPHABET.indexOf(s);
    if (v < 0) return null;
    values.push(v);
  }
  const data = values.slice(0, DATA);
  if (checkOf(data) !== values[DATA]! * 32 + values[DATA + 1]!) return null;
  // The last data symbol's two spare bits are always zero.
  if ((data[DATA - 1]! & 3) !== 0) return null;
  const bytes = new Uint8Array(KEY_BYTES);
  let buffer = 0;
  let bits = 0;
  let at = 0;
  for (const v of data) {
    buffer = (buffer << 5) | v;
    bits += 5;
    if (bits >= 8) {
      bits -= 8;
      if (at < KEY_BYTES) bytes[at++] = (buffer >> bits) & 255;
    }
    buffer &= (1 << bits) - 1;
  }
  return bytes;
}

/** The code in fours, as it's shown and put in the QR: "7KQ2-M9XA-…". */
export function readable(code: string): string {
  return (code.match(/.{1,4}/g) ?? []).join('-');
}

/** A new key's code, from the phone's own randomness. */
export function makeCode(
  random: (bytes: Uint8Array<ArrayBuffer>) => void = (b) => crypto.getRandomValues(b),
): string {
  const bytes = new Uint8Array(KEY_BYTES);
  random(bytes);
  return toCode(bytes);
}

/** This phone's key's code, or null if it hasn't one yet (or can't keep one). */
export function readCloudKey(
  storage: Storage | undefined = globalThis.localStorage,
): string | null {
  try {
    const code = storage?.getItem(CLOUD_KEY) ?? null;
    return code !== null && fromCode(code) ? code : null;
  } catch {
    return null;
  }
}

/**
 * Keeps `code` as this phone's key, the one it had put aside under its own name first. False if
 * the phone wouldn't keep it.
 */
export function keepCloudKey(
  code: string,
  storage: Storage | undefined = globalThis.localStorage,
  now = Date.now(),
): boolean {
  try {
    if (!storage) return false;
    const old = storage.getItem(CLOUD_KEY);
    if (old !== null && old !== code) storage.setItem(`${OLD_CLOUD_KEY_PREFIX}${now}`, old);
    storage.setItem(CLOUD_KEY, code);
    return storage.getItem(CLOUD_KEY) === code;
  } catch {
    return false;
  }
}

/** This phone's key, made and kept the first time it's wanted; null if it can't be kept. */
export function cloudKey(
  storage: Storage | undefined = globalThis.localStorage,
  random?: (bytes: Uint8Array<ArrayBuffer>) => void,
): { code: string; made: boolean } | null {
  const kept = readCloudKey(storage);
  if (kept) return { code: kept, made: false };
  try {
    const code = makeCode(random);
    return keepCloudKey(code, storage) ? { code, made: true } : null;
  } catch {
    return null;
  }
}
