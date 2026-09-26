import { migrateSave } from './migrations';
import type { SaveState } from './SaveState';

/** Compressed. The digit is the code's format, not the save's version, which travels inside. */
const COMPRESSED = 'MFV1-';
/** Plain, for browsers without CompressionStream (iOS before 16.4). Longer, but it still works. */
const PLAIN = 'MFV0-';

export type DecodedBackup = { ok: true; save: SaveState } | { ok: false; reason: string };

/**
 * Her whole town as a line of text she can paste into Notes or a message (decisions.md 26):
 * the save's JSON, deflated where the browser can, in URL-safe base64, behind a prefix that says
 * how to read it back.
 */
export async function encodeBackup(save: SaveState): Promise<string> {
  const json = new TextEncoder().encode(JSON.stringify(save));
  if (typeof CompressionStream === 'undefined') return PLAIN + toBase64Url(json);
  return COMPRESSED + toBase64Url(await transform(json, new CompressionStream('deflate-raw')));
}

export async function decodeBackup(code: string): Promise<DecodedBackup> {
  const compact = code.replace(/\s+/g, '');
  const fail = (reason: string): DecodedBackup => ({ ok: false, reason });
  try {
    let bytes: Uint8Array<ArrayBuffer>;
    if (compact.startsWith(COMPRESSED)) {
      if (typeof DecompressionStream === 'undefined') {
        return fail('This phone is too old to open that code. Try updating iOS.');
      }
      const packed = fromBase64Url(compact.slice(COMPRESSED.length));
      bytes = await transform(packed, new DecompressionStream('deflate-raw'));
    } else if (compact.startsWith(PLAIN)) {
      bytes = fromBase64Url(compact.slice(PLAIN.length));
    } else {
      return fail("That doesn't look like a McFrancisVille code. They start with MFV.");
    }
    const save = migrateSave(JSON.parse(new TextDecoder().decode(bytes)));
    if (!save) return fail('That code is from a newer version of the game, or got cut short.');
    return { ok: true, save };
  } catch {
    return fail('That code got cut short or mixed up. Try copying the whole thing again.');
  }
}

async function transform(
  bytes: Uint8Array<ArrayBuffer>,
  stream: CompressionStream | DecompressionStream,
): Promise<Uint8Array<ArrayBuffer>> {
  const body = new Response(bytes).body;
  if (!body) throw new Error('no stream');
  return new Uint8Array(await new Response(body.pipeThrough(stream)).arrayBuffer());
}

function toBase64Url(bytes: Uint8Array): string {
  let binary = '';
  for (const b of bytes) binary += String.fromCharCode(b);
  return btoa(binary).replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/, '');
}

function fromBase64Url(text: string): Uint8Array<ArrayBuffer> {
  const padded = text.replace(/-/g, '+').replace(/_/g, '/');
  const binary = atob(padded + '='.repeat((4 - (padded.length % 4)) % 4));
  const bytes = new Uint8Array(binary.length);
  for (let i = 0; i < binary.length; i++) bytes[i] = binary.charCodeAt(i);
  return bytes;
}
