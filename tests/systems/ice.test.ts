import { describe, expect, it } from 'vitest';
import { banksOf, iceBeside } from '../../src/systems/ice';

/** A picture: `-` is ice, `.` ground she can stand on, `#` solid. */
function picture(rows: string[]) {
  const at = (tx: number, ty: number) => rows[ty]?.[tx];
  return {
    slippery: (tx: number, ty: number) => at(tx, ty) === '-',
    canStand: (tx: number, ty: number) => at(tx, ty) === '.',
  };
}

describe('the ice', () => {
  const { slippery, canStand } = picture([
    '#####', //
    '#.--#',
    '#.--.',
    '#####',
    '#.-.#',
  ]);

  it('finds every bank beside the stretch of ice tapped, and none beside another', () => {
    const banks = banksOf({ tx: 3, ty: 1 }, slippery, canStand);
    expect(banks).toHaveLength(3);
    expect(banks).toEqual(
      expect.arrayContaining([
        { tx: 1, ty: 1 },
        { tx: 1, ty: 2 },
        { tx: 4, ty: 2 },
      ]),
    );
    expect(banksOf({ tx: 1, ty: 1 }, slippery, canStand)).toEqual([]);
  });

  it('slips her onto the ice beside her nearest where she was heading', () => {
    expect(iceBeside({ tx: 1, ty: 1 }, { tx: 3, ty: 2 }, slippery)).toEqual({ tx: 2, ty: 1 });
    expect(iceBeside({ tx: 4, ty: 2 }, { tx: 2, ty: 1 }, slippery)).toEqual({ tx: 3, ty: 2 });
    expect(iceBeside({ tx: 1, ty: 4 }, { tx: 0, ty: 0 }, slippery)).toEqual({ tx: 2, ty: 4 });
    expect(iceBeside({ tx: 3, ty: 4 }, { tx: 3, ty: 4 }, () => false)).toBeNull();
  });
});
