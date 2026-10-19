import { beforeEach, describe, expect, it } from 'vitest';
import {
  CLOUD_KEY,
  CODE_LENGTH,
  cloudKey,
  fromCode,
  keepCloudKey,
  makeCode,
  OLD_CLOUD_KEY_PREFIX,
  readable,
  readCloudKey,
  toCode,
} from '../../src/persistence/cloudKey';
import { sealerFor } from '../../src/persistence/cloudSeal';

const bytes = (...values: number[]) => new Uint8Array(values);
const ALL = new Set('0123456789ABCDEFGHJKMNPQRSTVWXYZ');

describe('the cloud key as a code', () => {
  it('goes to 28 symbols of a readable alphabet and back, for any 128 bits', () => {
    const samples = [
      new Uint8Array(16),
      new Uint8Array(16).fill(255),
      bytes(...Array.from({ length: 16 }, (_, i) => i * 17)),
    ];
    for (let n = 0; n < 200; n++) samples.push(crypto.getRandomValues(new Uint8Array(16)));
    for (const key of samples) {
      const code = toCode(key);
      expect(code).toHaveLength(CODE_LENGTH);
      expect([...code].every((c) => ALL.has(c))).toBe(true);
      expect(fromCode(code)).toEqual(key);
    }
  });

  it('reads back however she types it: grouped, spaced, lower case, O for 0, I or L for 1', () => {
    const key = crypto.getRandomValues(new Uint8Array(16));
    const code = toCode(key);
    expect(readable(code)).toMatch(/^([0-9A-Z]{4}-){6}[0-9A-Z]{4}$/);
    expect(fromCode(readable(code))).toEqual(key);
    expect(fromCode(` ${readable(code).toLowerCase().replace(/-/g, ' ')} `)).toEqual(key);
    const sloppy = code.replace(/0/g, 'O').replace(/1/g, 'l');
    expect(fromCode(sloppy)).toEqual(key);
  });

  it('catches a typo: any one symbol changed, or two side by side swapped', () => {
    const code = toCode(bytes(...Array.from({ length: 16 }, (_, i) => (i * 37 + 11) & 255)));
    for (let i = 0; i < CODE_LENGTH; i++) {
      for (const s of ALL) {
        if (s === code[i]) continue;
        expect(fromCode(code.slice(0, i) + s + code.slice(i + 1))).toBeNull();
      }
      if (i + 1 < CODE_LENGTH && code[i] !== code[i + 1]) {
        expect(fromCode(code.slice(0, i) + code[i + 1] + code[i] + code.slice(i + 2))).toBeNull();
      }
    }
  });

  it('refuses what is not one', () => {
    for (const text of ['', 'MFV1-abc', 'U'.repeat(28), toCode(new Uint8Array(16)).slice(1)]) {
      expect(fromCode(text)).toBeNull();
    }
  });

  it('makes a new key from the phone’s randomness', () => {
    const a = makeCode();
    const b = makeCode();
    expect(a).not.toBe(b);
    expect(fromCode(a)).not.toBeNull();
    expect(makeCode((b) => b.fill(0))).toBe(toCode(new Uint8Array(16)));
  });
});

describe('the phone keeping its key', () => {
  beforeEach(() => localStorage.clear());

  it('makes one the first time it is wanted, then keeps giving the same one', () => {
    expect(readCloudKey()).toBeNull();
    const first = cloudKey()!;
    expect(first.made).toBe(true);
    expect(localStorage.getItem(CLOUD_KEY)).toBe(first.code);
    expect(cloudKey()).toEqual({ code: first.code, made: false });
  });

  it('puts the old key aside when another takes its place, never throwing it away', () => {
    const mine = cloudKey()!.code;
    const theirs = makeCode();
    expect(keepCloudKey(theirs, localStorage, 1234)).toBe(true);
    expect(readCloudKey()).toBe(theirs);
    expect(localStorage.getItem(`${OLD_CLOUD_KEY_PREFIX}1234`)).toBe(mine);
  });

  it('carries on with storage that throws', () => {
    const broken = {
      getItem: () => {
        throw new Error('blocked');
      },
      setItem: () => {
        throw new Error('blocked');
      },
    } as unknown as Storage;
    expect(readCloudKey(broken)).toBeNull();
    expect(cloudKey(broken)).toBeNull();
    expect(keepCloudKey(makeCode(), broken)).toBe(false);
  });

  it('ignores a kept key that is not one', () => {
    localStorage.setItem(CLOUD_KEY, 'not a key');
    expect(readCloudKey()).toBeNull();
  });
});

describe('sealing her town for the cloud', () => {
  it('files it under a hash of the key, never the key, and only the key opens it', async () => {
    const code = makeCode();
    const sealer = (await sealerFor(code))!;
    expect(sealer.id).toMatch(/^[0-9a-f]{64}$/);
    expect(sealer.id).toBe((await sealerFor(readable(code).toLowerCase()))!.id);
    const text = 'MFV1-a whole town, more or less';
    const sealed = await sealer.seal(text);
    expect(sealed).toMatch(/^[A-Za-z0-9_-]+$/);
    expect(sealed).not.toContain('town');
    expect(await sealer.seal(text)).not.toBe(sealed);
    expect(await sealer.unseal(sealed)).toBe(text);
    const other = (await sealerFor(makeCode()))!;
    expect(other.id).not.toBe(sealer.id);
    expect(await other.unseal(sealed)).toBeNull();
    expect(await sealer.unseal('mixed-up')).toBeNull();
  });

  it('has no sealer for a code that is not one', async () => {
    expect(await sealerFor('nope')).toBeNull();
  });
});
