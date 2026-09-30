import { describe, expect, it } from 'vitest';
import { idsOf, HAIR_STYLES, TATTOOS } from '../../src/data/looks';
import { DEFAULT_LOOK, OUTFITS, STARTER_WARDROBE } from '../../src/data/outfits';
import {
  BODY,
  DOLL_FRAMES,
  dollKey,
  dollLayers,
  HAT_ROOM,
  POSE_BODY,
  POSES,
  TATTOO_PALETTE,
  type View,
} from '../../src/sprites/doll';
import { hairTones } from '../../src/sprites/lookColours';
import { PALETTE as C, ramp } from '../../src/sprites/palette';
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

  // Every piece in every fabric, facing and frame is seconds of drawing, past 5s under coverage.
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
  }, 30_000);

  it('puts her dark brown on her left and her pink on her right, however she faces', () => {
    const { left, right } = hairTones('pink', 'darkBrown');
    const of = (tone: { main: string }) => [...ramp(tone.main), tone.main];
    const look: Look = {
      ...DEFAULT_LOOK,
      hairStyle: 'splitBob',
      hairColour: 'pink',
      splitColour: 'darkBrown',
    };
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

  describe('her tattoos', () => {
    const hex = (look: Look, facing: Facing, pose?: 'horns') => {
      const { data, width, height } = rasterizeLayers(dollLayers(look, facing, 0, pose), {
        flipX: facing === 'left',
      });
      return (x: number, y: number) => {
        if (x < 0 || y < 0 || x >= width || y >= height) return '';
        const at = (y * width + x) * 4;
        return (
          '#' + [...data.slice(at, at + 3)].map((n) => n.toString(16).padStart(2, '0')).join('')
        );
      };
    };
    /** Whether a colour shows anywhere in columns `from` to `to` of rows `top` to `bottom`. */
    const shows = (look: Look, facing: Facing, colour: string, box: number[], pose?: 'horns') => {
      const at = hex(look, facing, pose);
      const [from, to, top, bottom] = box as [number, number, number, number];
      for (let y = top; y <= bottom; y++)
        for (let x = from; x <= to; x++) if (at(x, y) === colour) return true;
      return false;
    };
    const inked: Look = { ...DEFAULT_LOOK, tattoos: 'sleeves' };
    const viewerLeft = [0, 15, 26, 36];
    const viewerRight = [16, 31, 26, 36];

    it('puts the striped sleeve on her right arm and the stars on her left, however she faces', () => {
      const stripes = C.tattooMid;
      const stars = C.tattooLight;
      // From the front her right arm is on the viewer's left.
      expect(shows(inked, 'down', stripes, viewerLeft)).toBe(true);
      expect(shows(inked, 'down', stars, viewerRight)).toBe(true);
      expect(shows(inked, 'down', stripes, viewerRight)).toBe(false);
      // From behind, the other way round.
      expect(shows(inked, 'up', stripes, viewerRight)).toBe(true);
      expect(shows(inked, 'up', stars, viewerLeft)).toBe(true);
      // From the side, the arm nearer us.
      const whole = [0, 31, 26, 36];
      expect(shows(inked, 'right', stripes, whole)).toBe(true);
      expect(shows(inked, 'left', stripes, whole)).toBe(false);
      expect(shows(inked, 'left', stars, whole)).toBe(true);
    });

    it('moves the stripes to her left arm when she picks it', () => {
      const swapped: Look = { ...inked, stripesArm: 'left' };
      expect(shows(swapped, 'down', C.tattooMid, viewerRight)).toBe(true);
      expect(shows(swapped, 'down', C.tattooMid, viewerLeft)).toBe(false);
    });

    it('is all black and white', () => {
      const greys = [C.tattooInk, C.tattooDark, C.tattooMid, C.tattooLight, C.tattooWhite];
      for (const colour of Object.values(TATTOO_PALETTE)) {
        if (colour !== null) expect(greys).toContain(colour);
      }
    });

    it('lets a sleeve cover what it covers, and a scooped neckline show her rose', () => {
      // The evenstar, near her left shoulder: the viewer's right from the front.
      const star = [21, 26, 26, 28];
      const dressed = wear(inked, 'sundressFloral', STARTER_WARDROBE);
      const bare: Look = { ...dressed, outfit: { ...dressed.outfit, necklace: undefined } };
      expect(shows(bare, 'down', C.tattooWhite, star)).toBe(true);
      expect(shows(inked, 'down', C.tattooWhite, star)).toBe(false);
      const chest = [13, 18, 25, 28];
      expect(shows(bare, 'down', C.tattooDark, chest)).toBe(true);
      expect(shows(inked, 'down', C.tattooDark, chest)).toBe(false);
    });

    it('keeps the ink on an arm raised in front of her hair', () => {
      expect(shows(inked, 'down', C.tattooMid, [0, 15, 8, 24], 'horns')).toBe(true);
    });
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

  it('rises a witch hat above her head, with her feet where they were', () => {
    const hatted = wear(DEFAULT_LOOK, 'witchHat', [...STARTER_WARDROBE, 'witchHat']);
    for (const facing of FACINGS) {
      const layers = dollLayers(hatted, facing, 0);
      for (const layer of layers) {
        expect(spriteSize(layer.source), facing).toEqual({ width: 32, height: 48 + HAT_ROOM });
      }
      const { data, width } = rasterizeLayers(layers);
      const filled = (y: number) =>
        Array.from({ length: width }, (_, x) => data[(y * width + x) * 4 + 3]!).some((a) => a > 0);
      // Something of the hat in the room above her head, and her feet on the same row as ever.
      expect([...Array(HAT_ROOM).keys()].some(filled), facing).toBe(true);
      expect(filled(HAT_ROOM + 46), facing).toBe(true);
    }
    expect(spriteSize(dollLayers(DEFAULT_LOOK, 'down', 0)[0]!.source).height).toBe(48);
  });

  it('hides the bottom under a dress', () => {
    const dressed = wear(DEFAULT_LOOK, 'sundressFloral', STARTER_WARDROBE);
    const sneaky: Look = {
      ...dressed,
      outfit: { ...dressed.outfit, bottom: { id: 'jeans', fabric: 'denim' } },
    };
    expect(dollLayers(sneaky, 'down', 0)).toHaveLength(dollLayers(dressed, 'down', 0).length);
  });

  it('puts overalls on over her top, and her gloves on her hands', () => {
    const inOveralls = wear(DEFAULT_LOOK, 'overalls', STARTER_WARDROBE);
    const inHoodie = wear(inOveralls, 'cozyHoodie', STARTER_WARDROBE);
    // The bib is the same whatever is under it; beside it, the top shows.
    expect(pixel(inHoodie, 'down', 15, 31)).toBe(pixel(inOveralls, 'down', 15, 31));
    expect(pixel(inHoodie, 'down', 11, 31)).not.toBe(pixel(inOveralls, 'down', 11, 31));
    const gloved = wear(DEFAULT_LOOK, 'gardenGloves', STARTER_WARDROBE);
    for (const facing of FACINGS) {
      expect(dollLayers(gloved, facing, 0)).toHaveLength(
        dollLayers(DEFAULT_LOOK, facing, 0).length + 1,
      );
    }
    expect(pixel(gloved, 'down', 7, 35)).not.toBe(pixel(DEFAULT_LOOK, 'down', 7, 35));
  });

  it('hangs her comfy shirt a size too big, out past her sides', () => {
    const comfy = wear(DEFAULT_LOOK, 'comfyShirt', STARTER_WARDROBE);
    const snug = wear(DEFAULT_LOOK, 'stripyTee', STARTER_WARDROBE);
    expect(pixel(comfy, 'down', 4, 29)).not.toBe(pixel(snug, 'down', 4, 29));
    expect(pixel(snug, 'down', 4, 29)).toBe(pixel(DEFAULT_LOOK, 'down', 4, 29));
  });

  it('names a picture by everything that changes it, and nothing else', () => {
    const renamed = { ...DEFAULT_LOOK, name: 'Someone' };
    expect(dollKey(renamed, 'down', 0)).toBe(dollKey(DEFAULT_LOOK, 'down', 0));
    const blue = wear(DEFAULT_LOOK, 'jeans', STARTER_WARDROBE, 'sky');
    expect(dollKey(blue, 'down', 0)).not.toBe(dollKey(DEFAULT_LOOK, 'down', 0));
    expect(dollKey(DEFAULT_LOOK, 'down', 1)).not.toBe(dollKey(DEFAULT_LOOK, 'down', 0));
  });
});
