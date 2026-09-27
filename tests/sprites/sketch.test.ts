import { describe, expect, it } from 'vitest';
import { mix, PALETTE, ramp } from '../../src/sprites/palette';
import { CLEAR, Sketch } from '../../src/sprites/sketch';
import { enlarge, rasterize } from '../../src/sprites/sprite';

describe('Sketch', () => {
  it('starts clear and draws rectangles, clipped at its edges', () => {
    const s = new Sketch(4, 3).rect(2, 1, 5, 5, 'a');
    expect(s.rows).toEqual(['....', '..aa', '..aa']);
  });

  it('draws an even ellipse centred between pixels, and an odd one on a pixel', () => {
    expect(new Sketch(4, 4).ellipse(2, 2, 2, 2, 'o').rows).toEqual([
      '.oo.',
      'oooo',
      'oooo',
      '.oo.',
    ]);
    const odd = new Sketch(5, 5).ellipse(2.5, 2.5, 2.5, 2.5, 'o').rows;
    expect(odd[2]).toBe('ooooo');
    expect(odd.every((row) => row === [...row].reverse().join(''))).toBe(true);
  });

  it('draws a line from one pixel to another, both ends included', () => {
    expect(new Sketch(4, 2).line(0, 0, 3, 1, 'l').rows).toEqual(['ll..', '..ll']);
  });

  it('lights a sphere from the top left', () => {
    const s = new Sketch(16, 16).sphere(8, 8, 8, 8, '12345');
    expect(Number(s.get(4, 4))).toBeGreaterThan(Number(s.get(11, 11)));
    expect(s.get(0, 0)).toBe(CLEAR);
  });

  it('stamps a grid over itself, letting the clear pixels show through, and flips it', () => {
    const s = new Sketch(4, 1, 'b').stamp({ rows: ['a.'] }, 1, 0);
    expect(s.rows).toEqual(['babb']);
    expect(new Sketch(2, 1).stamp({ rows: ['a.'] }, 0, 0, { flipX: true }).rows).toEqual(['.a']);
  });

  it('mirrors the left half onto the right', () => {
    expect(new Sketch(5, 1).rect(0, 0, 2, 1, 'a').set(2, 0, 'c').mirrorX().rows).toEqual(['aacaa']);
  });

  it('bevels a shape: light on its top and left edges, shade on its bottom and right', () => {
    expect(new Sketch(4, 4).rect(0, 0, 4, 4, 'm').bevel('m', 'L', 'S').rows).toEqual([
      'LLLS',
      'LmmS',
      'LmmS',
      'SSSS',
    ]);
  });

  it('outlines the mask of what is painted with the outline of what it touches', () => {
    const s = new Sketch(4, 3).rect(1, 1, 2, 1, 'a').outline({ a: 'A' });
    expect(s.rows).toEqual(['.AA.', 'AaaA', '.AA.']);
    // A fill mapped to null gets no outline.
    expect(new Sketch(3, 3).set(1, 1, 'g').outline({ g: null }).rows).toEqual([
      '...',
      '.g.',
      '...',
    ]);
  });

  it('dithers one key into another in a checker', () => {
    expect(new Sketch(4, 2, 'a').dither('a', 'b', 0, 0, 4, 2).rows).toEqual(['baba', 'abab']);
  });

  it('refuses a key that isn’t one character, and reads back a grid it came from', () => {
    expect(() => new Sketch(1, 1).set(0, 0, 'ab')).toThrow();
    const source = { rows: ['ab', 'c.'] };
    expect(Sketch.from(source).toSource()).toEqual(source);
  });
});

describe('enlarging', () => {
  it('makes each pixel a square of itself, and a scale on rasterize does the same', () => {
    const palette = { a: '#ff0000', '.': null };
    const small = rasterize({ rows: ['a.'] }, palette);
    const big = enlarge(small, 2);
    expect([big.width, big.height]).toEqual([4, 2]);
    const alpha = [...big.data].filter((_, i) => i % 4 === 3);
    expect(alpha).toEqual([255, 255, 0, 0, 255, 255, 0, 0]);
    expect(rasterize({ rows: ['a.'] }, palette, { scale: 2 })).toEqual(big);
  });
});

describe('ramps', () => {
  it('mixes colours', () => {
    expect(mix('#000000', '#ffffff', 0.5)).toBe('#808080');
    expect(mix(PALETTE.pumpkin, '#000000', 0)).toBe(PALETTE.pumpkin);
  });

  it('runs from dark to light around its base', () => {
    const tones = ramp(PALETTE.pumpkin);
    const brightness = (hex: string) =>
      [1, 3, 5].reduce((sum, i) => sum + parseInt(hex.slice(i, i + 2), 16), 0);
    expect(tones[2]).toBe(PALETTE.pumpkin);
    for (let i = 1; i < tones.length; i++) {
      expect(brightness(tones[i]!)).toBeGreaterThan(brightness(tones[i - 1]!));
    }
  });
});
