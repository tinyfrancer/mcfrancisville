import { fromBase64Url, toBase64Url } from './backup';
import { fromCode } from './cloudKey';

/**
 * What the cloud is told, and what it keeps (V1's S2, decision 323). It never sees the key: it
 * files the town under a hash of it (`id`), and what it files is sealed (AES-GCM) with another
 * hash of it, so nobody with the store, its logs or the function can read her town without the
 * code. Both are hashes of 128 random bits, so no stretching is needed.
 */
export interface Sealer {
  /** The name the cloud files this key's town under: 64 hex digits. */
  id: string;
  seal(text: string): Promise<string>;
  /** The text back, or null if this key didn't seal it (or it got mixed up on the way). */
  unseal(data: string): Promise<string | null>;
}

const ID_SALT = 'mcfrancisville:cloud:id:';
const KEY_SALT = 'mcfrancisville:cloud:key:';
const IV_BYTES = 12;

async function hashOf(salt: string, key: Uint8Array): Promise<Uint8Array<ArrayBuffer>> {
  const salted = new Uint8Array([...new TextEncoder().encode(salt), ...key]);
  return new Uint8Array(await crypto.subtle.digest('SHA-256', salted));
}

/** The sealer for a code, or null for a code that isn't one, or a phone with no WebCrypto. */
export async function sealerFor(code: string): Promise<Sealer | null> {
  const key = fromCode(code);
  if (!key || typeof crypto === 'undefined' || !crypto.subtle) return null;
  try {
    const id = [...(await hashOf(ID_SALT, key))]
      .map((b) => b.toString(16).padStart(2, '0'))
      .join('');
    const aes = await crypto.subtle.importKey(
      'raw',
      await hashOf(KEY_SALT, key),
      'AES-GCM',
      false,
      ['encrypt', 'decrypt'],
    );
    return {
      id,
      async seal(text) {
        const iv = crypto.getRandomValues(new Uint8Array(IV_BYTES));
        const plain = new TextEncoder().encode(text);
        const sealed = new Uint8Array(
          await crypto.subtle.encrypt({ name: 'AES-GCM', iv }, aes, plain),
        );
        return toBase64Url(new Uint8Array([...iv, ...sealed]));
      },
      async unseal(data) {
        try {
          const bytes = fromBase64Url(data);
          const iv = bytes.slice(0, IV_BYTES);
          const plain = await crypto.subtle.decrypt(
            { name: 'AES-GCM', iv },
            aes,
            bytes.slice(IV_BYTES),
          );
          return new TextDecoder().decode(plain);
        } catch {
          return null;
        }
      },
    };
  } catch {
    return null;
  }
}
