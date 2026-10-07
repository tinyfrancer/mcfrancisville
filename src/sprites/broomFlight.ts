import type { BroomLook } from '../data/broom';
import { ribbonColour, bristlesColour } from './broom';
import { PALETTE as C, ramp } from './palette';
import { Sketch } from './sketch';
import type { Palette, SpriteSource } from './sprite';

/*
 * Her broom seen flying (V1's E4, decision 283): the broom she sits on as she swoops off, and the
 * puff of smoke she leaves behind. Drawn at 32 like everything in the world; the broom flies to
 * the right, its bristles trailing, and is flipped to fly left.
 */

/** The broom side on: its handle ahead of her, a bow where the bristles are bound, bristles behind. */
export const RIDING_BROOM: SpriteSource = {
  rows: [
    '..ooo.......................................',
    '.oBBBoo.....................................',
    'oBbBbBBoooooooooooooooooooooooooooooooooooo.',
    'obBbBbBRRoHHHHHHHHHHHHHHHHHHHHHHHHHHHHHHHHHo',
    'oBbBbBBRroHhhhhhhhhhhhhhhhhhhhhhhhhhhhhhhhho',
    'obBbBbBRRoooooooooooooooooooooooooooooooooo.',
    'oBbBbBBoo...................................',
    '.oBBBoo.....................................',
    '..ooo.......................................',
  ],
};

/** Where on the broom she sits: the pixel under her hips, a little ahead of the bow. */
export const BROOM_SEAT = { x: 17, y: 3 };

export function ridingBroomPalette(look: BroomLook): Palette {
  const ribbon = ramp(ribbonColour(look.ribbon));
  const bristles = ramp(bristlesColour(look.bristles));
  return {
    '.': null,
    o: C.ink,
    H: C.wood,
    h: C.bark,
    R: ribbon[2],
    r: ribbon[1],
    B: bristles[2],
    b: bristles[1],
  };
}

/**
 * The puff she vanishes into, big enough to hide her and a tall hat: a ball of smoke growing,
 * full, then thinning as it drifts.
 */
export const POOF_FRAMES: readonly SpriteSource[] = [0, 1, 2].map((frame) => {
  const s = new Sketch(48, 60);
  // Three tones of a soft lavender smoke, lit from the top left as everything is.
  const puffs: readonly (readonly [number, number, number])[] =
    frame === 0
      ? [
          [24, 44, 9],
          [16, 48, 7],
          [32, 48, 7],
        ]
      : [
          [24, 34, 12],
          [13, 44, 9],
          [35, 44, 9],
          [24, 49, 9],
          [17, 22, 9],
          [31, 21, 9],
          [24, 12, 8],
        ];
  for (const [cx, cy, r] of puffs) s.sphere(cx, cy, r, r, 'abc');
  // Thinning, it breaks into a few holes before it goes.
  if (frame === 2) {
    for (const [x, y] of [
      [13, 40],
      [29, 16],
      [35, 40],
      [21, 51],
      [25, 30],
    ] as const) {
      s.ellipse(x, y, 2, 2, '.');
    }
  }
  s.outline({ a: 'o', b: 'o', c: 'o' });
  return s.toSource();
});

export const POOF_PALETTE: Palette = {
  '.': null,
  a: C.lavenderShade,
  b: C.cloudShade,
  c: C.fog,
  o: C.lavenderShade,
};
