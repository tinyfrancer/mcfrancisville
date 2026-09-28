import { describe, expect, it } from 'vitest';
import { idsOf, HAIR_STYLES, TATTOOS } from '../../src/data/looks';
import { DEFAULT_LOOK, OUTFITS, STARTER_WARDROBE } from '../../src/data/outfits';
import {
  BODY,
  DOLL_FRAMES,
  dollKey,
  dollLayers,
  POSE_BODY,
  POSES,
  type View,
} from '../../src/sprites/doll';
import { HAIR_TONES } from '../../src/sprites/lookColours';
import { ramp } from '../../src/sprites/palette';
import { rasterizeLayers, spriteSize } from '../../src/sprites/sprite';
import { wear } from '../../src/systems/wardrobe';
import type { Facing, OutfitId } from '../../src/types/ids';
import type { Look } from '../../src/types/look';

const FACINGS: Facing[] = ['down', 'up', 'left', 'right'];
const EVERYTHING = Object.keys(OUTFITS) as OutfitId[];

function pixel(look: Look, facing: Facing, x: number, y: number): string {
  const { data, width } = rasterizeLayers(dollLayers(look, facing, 0), {
    flipX: facing === 'left',
  });
  const at = (y * width + x) * 4;
  return '#' + [...data.slice(at, at + 3)].map((n) => n.toString(16).padStart(2, '0')).join('');
}

describe('the paper doll', () => {
  it('has a 32x48 body for every view, frame and pose', () => {
    for (const view of ['front', 'back', 'side'] as View[]) {
      expect(BODY[view]).toHaveLength(DOLL_FRAMES);
      for (const frame of BODY[view]) {
        expect(spriteSize({ rows: frame }), view).toEqual({ width: 32, height: 48 });
      }
    }
    for (const pose of POSES) {
      expect(spriteSize({ rows: POSE_BODY[pose].body }), pose).toEqual({ width: 32, height: 48 });
    }
  });

  it('stands with her feet on the bottom row but one, the outline under them', () => {
    for (const view of ['front', 'side'] as View[]) {
      const body = BODY[view][0]!;
      expect(body[46], view).toContain('f');
      expect(body[47], view).not.toMatch(/[^.o]/);
    }
  });

  it('draws every piece, hairstyle and tattoo in every facing and frame', () => {
    const looks: Look[] = [
      DEFAULT_LOOK,
      { ...DEFAULT_LOOK, gauges: false, tattoos: null, outfit: {} },
      ...idsOf(HAIR_STYLES).map((hairStyle) => ({ ...DEFAULT_LOOK, hairStyle })),
      ...idsOf(TATTOOS).map((tattoos) => ({ ...DEFAULT_LOOK, tattoos })),
      ...EVERYTHING.flatMap((id) =>
        OUTFITS[id].fabrics.map((fabric) => wear(DEFAULT_LOOK, id, EVERYTHING, fabric)),
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
      for (const pose of POSES) {
        const label = dollKey(look, 'down', 0, pose);
        expect(() => rasterizeLayers(dollLayers(look, 'down', 0, pose)), label).not.toThrow();
      }
    }
  });

  it('puts her dark brown on her left and her pink on her right, however she faces', () => {
    const { left, right } = HAIR_TONES.pinkSplit;
    const of = (tone: { main: string }) => [...ramp(tone.main), tone.main];
    const look: Look = { ...DEFAULT_LOOK, hairStyle: 'splitBob', hairColour: 'pinkSplit' };
    // From the front, her left is the viewer's right.
    expect(of(left)).toContain(pixel(look, 'down', 26, 14));
    expect(of(right)).toContain(pixel(look, 'down', 5, 14));
    // From behind, it's the other way round.
    expect(of(left)).toContain(pixel(look, 'up', 5, 14));
    expect(of(right)).toContain(pixel(look, 'up', 26, 14));
    // From the side, only the near half shows.
    expect(of(right)).toContain(pixel(look, 'right', 8, 14));
    expect(of(left)).toContain(pixel(look, 'left', 23, 14));
  });

  it('gives heels a heel from the side, and platforms a sole from every side', () => {
    const shod = (id: OutfitId) => wear(DEFAULT_LOOK, id, EVERYTHING);
    const flats = shod('batBowFlats');
    // Her foot from the side runs along columns 13 to 20 of rows 45 and 46.
    const underHeel = (look: Look) => pixel(look, 'right', 13, 47);
    expect(underHeel(shod('velvetPumps'))).not.toBe(underHeel(flats));
    expect(pixel(shod('platformMaryJanes'), 'down', 10, 47)).not.toBe(pixel(flats, 'down', 10, 47));
  });

  it('shows her freckles and nose stud only when she has them', () => {
    const bare: Look = { ...DEFAULT_LOOK, freckles: false, nosePiercing: false };
    expect(pixel(DEFAULT_LOOK, 'down', 13, 19)).not.toBe(pixel(bare, 'down', 13, 19));
    expect(pixel(DEFAULT_LOOK, 'down', 17, 19)).not.toBe(pixel(bare, 'down', 17, 19));
  });

  it('moves her sleeves with her arms when she strikes a pose', () => {
    const tee = DEFAULT_LOOK.outfit.top!;
    const sleeve = (pose: 'horns' | undefined, x: number, y: number) => {
      const { data, width } = rasterizeLayers(dollLayers(DEFAULT_LOOK, 'down', 0, pose));
      const at = (y * width + x) * 4;
      return [...data.slice(at, at + 4)].join(',');
    };
    expect(tee.id).toBe('teeScreamDion');
    // Raised, her upper arm is up by her shoulder, not hanging at her side.
    expect(sleeve('horns', 8, 27)).not.toBe(sleeve(undefined, 8, 27));
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
