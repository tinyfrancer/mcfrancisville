import { describe, expect, it } from 'vitest';
import { idsOf, HAIR_STYLES, TATTOOS } from '../../src/data/looks';
import { DEFAULT_LOOK, OUTFITS, STARTER_WARDROBE } from '../../src/data/outfits';
import { BODY, DOLL_FRAMES, dollKey, dollLayers, type View } from '../../src/sprites/doll';
import { HAIR_TONES } from '../../src/sprites/lookColours';
import { rasterizeLayers, spriteSize } from '../../src/sprites/sprite';
import { wear } from '../../src/systems/wardrobe';
import type { Facing } from '../../src/types/ids';
import type { Look } from '../../src/types/look';

const FACINGS: Facing[] = ['down', 'up', 'left', 'right'];

function pixel(look: Look, facing: Facing, x: number, y: number): string {
  const { data, width } = rasterizeLayers(dollLayers(look, facing, 0), {
    flipX: facing === 'left',
  });
  const at = (y * width + x) * 4;
  return '#' + [...data.slice(at, at + 3)].map((n) => n.toString(16).padStart(2, '0')).join('');
}

describe('the paper doll', () => {
  it('has a 16x24 body for every view and frame', () => {
    for (const view of ['front', 'back', 'side'] as View[]) {
      expect(BODY[view]).toHaveLength(DOLL_FRAMES);
      for (const frame of BODY[view]) {
        expect(spriteSize({ rows: frame }), view).toEqual({ width: 16, height: 24 });
      }
    }
  });

  it('draws every piece, hairstyle and tattoo in every facing and frame', () => {
    const looks: Look[] = [
      DEFAULT_LOOK,
      { ...DEFAULT_LOOK, gauges: false, tattoos: null, outfit: {} },
      ...idsOf(HAIR_STYLES).map((hairStyle) => ({ ...DEFAULT_LOOK, hairStyle })),
      ...idsOf(TATTOOS).map((tattoos) => ({ ...DEFAULT_LOOK, tattoos })),
      ...STARTER_WARDROBE.flatMap((id) =>
        OUTFITS[id].fabrics.map((fabric) => wear(DEFAULT_LOOK, id, STARTER_WARDROBE, fabric)),
      ),
    ];
    for (const look of looks) {
      for (const facing of FACINGS) {
        for (let frame = 0; frame < DOLL_FRAMES; frame++) {
          const label = dollKey(look, facing, frame);
          // Throws on a layer of the wrong size or a key its palette doesn't answer.
          expect(() => rasterizeLayers(dollLayers(look, facing, frame)), label).not.toThrow();
        }
      }
    }
  });

  it('puts split dye blonde on her left and coral on her right, however she faces', () => {
    const { left, right } = HAIR_TONES.splitDye;
    const look: Look = { ...DEFAULT_LOOK, hairStyle: 'bob' };
    // From the front, her left is the viewer's right.
    expect(pixel(look, 'down', 12, 5)).toBe(left.shade);
    expect(pixel(look, 'down', 3, 5)).toBe(right.shade);
    // From behind, it's the other way round.
    expect(pixel(look, 'up', 4, 5)).toBe(left.main);
    expect(pixel(look, 'up', 11, 5)).toBe(right.main);
    // From the side, only the near half shows.
    expect(pixel(look, 'right', 4, 5)).toBe(right.main);
    expect(pixel(look, 'left', 11, 5)).toBe(left.main);
  });

  it('hides the bottom under a dress', () => {
    const dressed = wear(DEFAULT_LOOK, 'sundressFloral', STARTER_WARDROBE);
    const sneaky: Look = {
      ...dressed,
      outfit: { ...dressed.outfit, bottom: { id: 'jeans', fabric: 'denim' } },
    };
    expect(dollLayers(sneaky, 'down', 0)).toHaveLength(dollLayers(dressed, 'down', 0).length);
  });

  it('names a picture by everything that changes it, and nothing else', () => {
    const renamed = { ...DEFAULT_LOOK, name: 'Someone' };
    expect(dollKey(renamed, 'down', 0)).toBe(dollKey(DEFAULT_LOOK, 'down', 0));
    const blue = wear(DEFAULT_LOOK, 'jeans', STARTER_WARDROBE, 'sky');
    expect(dollKey(blue, 'down', 0)).not.toBe(dollKey(DEFAULT_LOOK, 'down', 0));
    expect(dollKey(DEFAULT_LOOK, 'down', 1)).not.toBe(dollKey(DEFAULT_LOOK, 'down', 0));
  });
});
