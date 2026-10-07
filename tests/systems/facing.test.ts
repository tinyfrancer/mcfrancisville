import { describe, expect, it } from 'vitest';
import { facingToward } from '../../src/systems/facing';

describe('which way she faces what she walked up to', () => {
  const bed = { tx: 5, ty: 5, w: 1, h: 1 };

  it('turns to a tile beside her, whichever side she came up on', () => {
    expect(facingToward({ tx: 5, ty: 4 }, bed, 'up')).toBe('down');
    expect(facingToward({ tx: 5, ty: 6 }, bed, 'down')).toBe('up');
    expect(facingToward({ tx: 4, ty: 5 }, bed, 'left')).toBe('right');
    expect(facingToward({ tx: 6, ty: 5 }, bed, 'right')).toBe('left');
  });

  it('turns to the nearest tile of something big, from beside or below it', () => {
    // A house three wide and two deep, her on its door step under the middle.
    const house = { tx: 10, ty: 10, w: 3, h: 2 };
    expect(facingToward({ tx: 11, ty: 12 }, house, 'down')).toBe('up');
    expect(facingToward({ tx: 9, ty: 11 }, house, 'left')).toBe('right');
    expect(facingToward({ tx: 13, ty: 10 }, house, 'down')).toBe('left');
  });

  it('faces up or down at a corner, and keeps her way standing on it', () => {
    expect(facingToward({ tx: 4, ty: 4 }, bed, 'left')).toBe('down');
    expect(facingToward({ tx: 6, ty: 6 }, bed, 'left')).toBe('up');
    expect(facingToward({ tx: 5, ty: 5 }, bed, 'left')).toBe('left');
  });
});
