import { describe, expect, it } from 'vitest';
import { qrEncode, qrPicture } from '../../src/hud/qr';
import vectors from './fixtures/qr-reference.json';

/**
 * What reference encoders made of each text at level M with the mask named (`by`): `segno` for
 * the alphanumeric ones, python-qrcode for bytes (segno pads a byte-aligned stream with a whole
 * extra zero byte, which is allowed but isn't the standard's minimal padding).
 */
const VECTORS = vectors as {
  text: string;
  version: number;
  mask: number;
  by: string;
  rows: string[];
}[];

const TEXTS = ['7KQ2-M9XA-4HJT-0WZB-CDEF-GNPR-SV8C', 'HELLO WORLD', 'lanterns on the lake'];

const rows = (modules: boolean[][]) => modules.map((r) => r.map((d) => (d ? '#' : '.')).join(''));

describe('the QR encoder', () => {
  it('has a vector for every version it makes', () => {
    expect(new Set(VECTORS.map((v) => v.version))).toEqual(new Set([1, 2, 3, 4, 5, 6]));
  });

  it.each(VECTORS.map((v) => [`${v.version}-M, mask ${v.mask}, ${v.by}: ${v.text}`, v] as const))(
    'makes the same code as a reference encoder: %s',
    (_, v) => {
      const qr = qrEncode(v.text, v.mask);
      expect(qr.version).toBe(v.version);
      expect(rows(qr.modules)).toEqual(v.rows);
    },
  );

  // Encoders score the masks a little differently (segno scores before the format bits go in),
  // so which is picked is ours; any of the eight reads.
  it('picks a mask when none is named, the same code as naming it', () => {
    for (const text of TEXTS) {
      const qr = qrEncode(text);
      expect(qr.mask).toBeGreaterThanOrEqual(0);
      expect(qr.mask).toBeLessThan(8);
      expect(rows(qr.modules)).toEqual(rows(qrEncode(text, qr.mask).modules));
    }
  });

  it('refuses a text too long for version 6', () => {
    expect(() => qrEncode('x'.repeat(200))).toThrow();
  });

  it('draws whole squares with a quiet zone of four, dark on white', () => {
    const svg = qrPicture('HELLO WORLD', 4);
    expect(svg.getAttribute('viewBox')).toBe('0 0 29 29');
    expect(svg.getAttribute('width')).toBe('116');
    expect(svg.querySelector('rect')!.getAttribute('fill')).toBe('#ffffff');
    // The finder's top-left corner, four squares in from the edge.
    expect(svg.querySelector('path')!.getAttribute('d')!.startsWith('M4 4h1v1h-1z')).toBe(true);
  });
});
