import { describe, expect, it } from 'vitest';
import {
  coveredCrowns,
  FADE_MS,
  hiddenPixels,
  LINGER_MS,
  nearHer,
  SEE_THROUGH_ALPHA,
  SeeThrough,
  type Mask,
  type Placed,
} from '../../src/render/occlusion';
import { STEP_MS } from '../../src/loop';

/** A mask from rows of `#` (drawn) and `.` (clear). */
function mask(rows: string[]): Mask {
  const width = rows[0]!.length;
  const solid = Uint8Array.from(rows.join('').split(''), (c) => (c === '#' ? 1 : 0));
  return { width, height: rows.length, solid, count: solid.reduce((a, b) => a + b, 0) };
}

/** A block `w` by `h`, solid all over. */
function block(w: number, h: number): Mask {
  return mask(Array.from({ length: h }, () => '#'.repeat(w)));
}

/** A tree: a crown 12 across over a trunk 2 across, its feet at 20. */
const TREE: Placed & { key: string } = {
  key: 'tree',
  x: 0,
  y: 0,
  footY: 20,
  mask: mask([
    ...Array.from({ length: 12 }, () => '############'),
    ...Array.from({ length: 8 }, () => '.....##.....'),
  ]),
};

describe('hiddenPixels', () => {
  it('counts the pixels both draw, where they overlap', () => {
    const her = { x: 8, y: 6, footY: 14, mask: block(6, 8) };
    // Columns 8 to 11 of the crown's rows 6 to 11: four across, six down.
    expect(hiddenPixels(TREE, her)).toBe(24);
  });

  it('counts nothing where either is clear', () => {
    const beside = { x: 0, y: 14, footY: 18, mask: block(4, 4) };
    expect(hiddenPixels(TREE, beside)).toBe(0);
    const apart = { x: 40, y: 0, footY: 8, mask: block(4, 4) };
    expect(hiddenPixels(TREE, apart)).toBe(0);
  });

  it('stops counting once it has enough', () => {
    const her = { x: 0, y: 0, footY: 10, mask: block(12, 12) };
    expect(hiddenPixels(TREE, her, 5)).toBe(5);
  });
});

describe('coveredCrowns', () => {
  it('fades a crown with her behind it', () => {
    const her = { x: 2, y: 2, footY: 10, mask: block(8, 8) };
    expect(coveredCrowns([TREE], [her])).toEqual(new Set(['tree']));
  });

  it('leaves it be with her in front of it, however much they overlap', () => {
    const her = { x: 2, y: 2, footY: 24, mask: block(8, 8) };
    expect(coveredCrowns([TREE], [her])).toEqual(new Set());
  });

  it('leaves it be for a corner of her under the edge of its leaves', () => {
    const her = { x: 10, y: 9, footY: 17, mask: block(8, 8) };
    // Two across, three down: six pixels, fewer than it takes.
    expect(hiddenPixels(TREE, her)).toBe(6);
    expect(coveredCrowns([TREE], [her])).toEqual(new Set());
  });

  it('fades for something small, all of it hidden', () => {
    const moth = { x: 4, y: 4, footY: 8, mask: mask(['#.#', '.#.']) };
    expect(coveredCrowns([TREE], [moth])).toEqual(new Set(['tree']));
  });

  it('fades only the crowns that hide something', () => {
    const other = { ...TREE, key: 'other', x: 100 };
    const her = { x: 2, y: 2, footY: 10, mask: block(8, 8) };
    expect(coveredCrowns([TREE, other], [her])).toEqual(new Set(['tree']));
  });
});

describe('SeeThrough', () => {
  /** Steps the fade on as the loop would, a step at a time, and says how opaque it is after each. */
  function run(fade: SeeThrough, ms: number): number[] {
    const out: number[] = [];
    for (let t = 0; t < ms; t += STEP_MS) {
      fade.step(STEP_MS);
      out.push(fade.alpha('tree'));
    }
    return out;
  }

  it('is solid until something is hidden', () => {
    const fade = new SeeThrough();
    expect(fade.alpha('tree')).toBe(1);
    run(fade, 500);
    expect(fade.alpha('tree')).toBe(1);
    expect(fade.faded()).toEqual([]);
  });

  it('fades to about half over a few steps, only ever down, and stays there', () => {
    const fade = new SeeThrough();
    fade.see(new Set(['tree']));
    const alphas = run(fade, FADE_MS + 100);
    expect(alphas[0]).toBeLessThan(1);
    expect(alphas[0]).toBeGreaterThan(0.95);
    for (let i = 1; i < alphas.length; i++) expect(alphas[i]).toBeLessThanOrEqual(alphas[i - 1]!);
    expect(alphas.at(-1)).toBe(SEE_THROUGH_ALPHA);
    expect(fade.faded()).toEqual([{ key: 'tree', alpha: SEE_THROUGH_ALPHA }]);
  });

  it('lingers a moment once she steps out, then comes back, only ever up', () => {
    const fade = new SeeThrough();
    fade.see(new Set(['tree']));
    run(fade, FADE_MS);
    fade.see(new Set());
    const lingering = run(fade, LINGER_MS - 2 * STEP_MS);
    expect(lingering.every((a) => a === SEE_THROUGH_ALPHA)).toBe(true);
    const back = run(fade, FADE_MS + 100);
    for (let i = 1; i < back.length; i++) expect(back[i]).toBeGreaterThanOrEqual(back[i - 1]!);
    expect(fade.alpha('tree')).toBe(1);
    expect(fade.faded()).toEqual([]);
  });

  it("doesn't flicker as she moves a pixel in and out of its edge", () => {
    const fade = new SeeThrough();
    fade.see(new Set(['tree']));
    run(fade, FADE_MS);
    for (let i = 0; i < 20; i++) {
      fade.see(new Set(i % 2 === 0 ? [] : ['tree']));
      run(fade, 70);
      expect(fade.alpha('tree')).toBe(SEE_THROUGH_ALPHA);
    }
  });

  it('turns back where it is, part way through', () => {
    const fade = new SeeThrough();
    fade.see(new Set(['tree']));
    run(fade, FADE_MS / 2);
    const halfway = fade.alpha('tree');
    fade.see(new Set());
    run(fade, LINGER_MS + STEP_MS);
    expect(fade.alpha('tree')).toBeGreaterThan(halfway);
  });

  it('is solid again once she has gone', () => {
    const fade = new SeeThrough();
    fade.see(new Set(['tree']));
    run(fade, FADE_MS);
    fade.clear();
    expect(fade.alpha('tree')).toBe(1);
    run(fade, 100);
    expect(fade.alpha('tree')).toBe(1);
  });
});

describe('nearHer', () => {
  it('keeps what stands within three tiles of her feet, and leaves the rest of the wood be', () => {
    const her = { x: 100, y: 100, footY: 148, mask: block(32, 48) };
    const at = (x: number, footY: number) => ({ x, y: footY - 16, footY, mask: block(16, 16) });
    const near = at(100 + 8 + 96, 148 - 96);
    const across = at(100 + 8 + 97, 148);
    const below = at(108, 148 + 97);
    expect(nearHer(her, [near, across, below])).toEqual([near]);
  });
});
