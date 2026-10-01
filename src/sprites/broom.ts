import type { BristlesId, BroomLook, RibbonId } from '../data/broom';
import { ACCENT, DOOR, fillOf, finish, lightOf, ROOF, shadeOf, TRIM } from './buildings';
import type { FurnitureArt } from './furniture';
import { palette, WOOD } from './furnish';
import type { ItemArt } from './items';
import { PALETTE as C, ramp } from './palette';
import { Sketch } from './sketch';
import type { Palette, SpriteSource } from './sprite';

/*
 * Her broom (0.2's P1): the icon on the quick bar and in her bag, and the stand it rests on by her
 * door. Its ribbon and bristles are her colours, so both are drawn in keys her choice fills.
 */

const RIBBON_COLOUR: Record<RibbonId, string> = {
  plum: C.plum,
  rose: C.rose,
  gold: C.gold,
  teal: C.teal,
  pumpkin: C.pumpkin,
  sky: C.sky,
  ink: C.inkFabric,
  ghost: C.ghost,
};

const BRISTLES_COLOUR: Record<BristlesId, string> = {
  straw: C.rope,
  hazel: C.wood,
  ink: C.inkFabric,
  lavender: C.lavender,
  pumpkin: C.pumpkin,
  moss: C.moss,
};

/** A swatch's colour, for the sheet she picks them on. */
export function ribbonColour(id: RibbonId): string {
  return RIBBON_COLOUR[id];
}

export function bristlesColour(id: BristlesId): string {
  return BRISTLES_COLOUR[id];
}

/** Standing up, bristles down, with a bow tied where the bristles meet the handle. */
const BROOM_ICON: SpriteSource = {
  rows: [
    '.......oo.......',
    '......oHho......',
    '......oHho......',
    '......oHho......',
    '......oHho......',
    '......oHho......',
    '...oo.oHho.oo...',
    '..oRRooRRooRRo..',
    '...orRRRRRRro...',
    '....oBBRRBBo....',
    '....oBbBBbBo....',
    '...oBBbBBbBBo...',
    '...oBbBBbBBbo...',
    '..oBBbBBbBBbBo..',
    '..obBbBbBbBbbo..',
    '..oooooooooooo..',
  ],
};

export function broomIconArt(look: BroomLook): ItemArt {
  const ribbon = ramp(RIBBON_COLOUR[look.ribbon]);
  const bristles = ramp(BRISTLES_COLOUR[look.bristles]);
  const art: Palette = {
    '.': null,
    o: C.ink,
    H: C.wood,
    h: C.bark,
    R: ribbon[2],
    r: ribbon[1],
    B: bristles[2],
    b: bristles[1],
  };
  return { source: BROOM_ICON, palette: art };
}

const STAND = (() => {
  const s = new Sketch(32, 48);
  // A little cauldron by the door, and her broom standing up in it, bristles to the sky, as an
  // umbrella stands in its pot.
  s.rect(15, 14, 2, 22, fillOf(ACCENT)).rect(15, 14, 1, 22, lightOf(ACCENT));
  for (let k = 0; k < 12; k++) {
    const x = 10 + k;
    const top = 1 + Math.round(Math.abs(k - 5.5) * 0.5) + (k % 3 === 1 ? 1 : 0);
    s.rect(x, top, 1, 12 - top, k % 2 === 0 ? fillOf(DOOR) : shadeOf(DOOR));
  }
  s.rect(10, 11, 12, 1, shadeOf(DOOR));
  s.rect(11, 12, 10, 3, fillOf(ROOF)).rect(11, 12, 10, 1, lightOf(ROOF));
  s.line(11, 14, 8, 18, fillOf(ROOF)).line(20, 14, 23, 18, fillOf(ROOF));
  s.ellipse(16, 38, 11, 8, fillOf(TRIM));
  s.rect(8, 34, 1, 5, lightOf(TRIM)).rect(9, 33, 3, 1, lightOf(TRIM));
  s.rect(5, 29, 22, 3, shadeOf(TRIM)).rect(5, 29, 22, 1, lightOf(TRIM));
  s.rect(8, 45, 3, 2, shadeOf(TRIM)).rect(21, 45, 3, 2, shadeOf(TRIM));
  return finish(s);
})();

export function broomStandArt(look: BroomLook): FurnitureArt {
  return {
    source: STAND,
    palette: palette({
      ...WOOD,
      trim: C.iron,
      accent: C.wood,
      roof: RIBBON_COLOUR[look.ribbon],
      door: BRISTLES_COLOUR[look.bristles],
    }),
  };
}

/** A key for a look, for whatever is baked in it to be cached apart from the other looks. */
export function lookKey(look: BroomLook): string {
  return `${look.ribbon}:${look.bristles}`;
}
