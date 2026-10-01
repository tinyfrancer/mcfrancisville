import type { GooseOutfit } from '../data/geese';
import {
  ACCENT,
  ACCENT_TWO,
  buildingPalette,
  darkOf,
  fillOf,
  finish,
  INK,
  lightOf,
  ROOF,
  shadeOf,
  TRIM,
  WALL,
  WHITE,
} from './buildings';
import { PALETTE as C } from './palette';
import { Sketch } from './sketch';
import type { Palette, SpriteSource } from './sprite';

/*
 * The porch geese (0.2's K1): a plaster goose standing on the porch, side on and facing left, in
 * an outfit for the season or the holiday. The goose is the wall's keys (white), her beak and feet
 * the accent (orange); an outfit is the roof's keys, the trim's and the second accent's, each in
 * its own colours.
 */

const W = 32;
const H = 40;
/** Her head's middle, and where the outfit's hats sit. */
const HX = 10;
const HY = 15;

function goose(s: Sketch): void {
  // Feet and little legs.
  s.rect(14, 35, 2, 3, fillOf(ACCENT)).rect(20, 35, 2, 3, fillOf(ACCENT));
  s.rect(12, 38, 5, 1, fillOf(ACCENT)).rect(18, 38, 5, 1, fillOf(ACCENT));
  // The body, plump, with its tail tipped up behind.
  s.ellipse(18, 29, 10, 7, fillOf(WALL));
  s.rect(26, 24, 3, 3, fillOf(WALL)).rect(28, 22, 2, 3, fillOf(WALL));
  // The neck, curving up from her chest to her head.
  for (let y = HY; y < 27; y++) {
    const x = HX - 1 + Math.round(Math.max(0, (y - 19) / 4));
    s.rect(x, y, 4, 1, fillOf(WALL));
  }
  s.ellipse(HX, HY, 3.5, 3.5, fillOf(WALL));
  s.bevel(fillOf(WALL), lightOf(WALL), shadeOf(WALL));
  // Her wing folded on her side.
  for (let x = 16; x < 26; x++) s.set(x, 26 + Math.round(Math.abs(x - 20) / 3), shadeOf(WALL));
  s.line(25, 27, 22, 31, shadeOf(WALL));
  // The beak and her eye.
  s.rect(HX - 6, HY, 3, 2, fillOf(ACCENT)).set(HX - 6, HY + 1, shadeOf(ACCENT));
  s.set(HX - 1, HY - 1, INK);
}

/** A hat's brim across her head, `w` wide, at row `y`. */
function brim(s: Sketch, y: number, w: number, m = ROOF): void {
  s.rect(HX - Math.floor(w / 2), y, w, 2, fillOf(m)).rect(
    HX - Math.floor(w / 2),
    y,
    w,
    1,
    lightOf(m),
  );
}

/** A scarf round her neck, its end hanging down her front. */
function scarf(s: Sketch, stripes: boolean): void {
  s.rect(HX - 3, 21, 8, 3, fillOf(ROOF)).rect(HX - 3, 21, 8, 1, lightOf(ROOF));
  s.rect(HX - 3, 24, 3, 6, fillOf(ROOF)).set(HX - 3, 29, shadeOf(ROOF));
  if (stripes) {
    for (const x of [HX - 2, HX + 1, HX + 4]) s.rect(x, 21, 1, 3, fillOf(ACCENT_TWO));
    s.rect(HX - 3, 26, 3, 1, fillOf(ACCENT_TWO)).rect(HX - 3, 28, 3, 1, fillOf(ACCENT_TWO));
  }
}

/** A bow at her throat. */
function bow(s: Sketch, m = ROOF): void {
  s.rect(HX - 3, 21, 2, 3, fillOf(m)).rect(HX + 2, 21, 2, 3, fillOf(m));
  s.rect(HX - 1, 22, 3, 2, shadeOf(m)).set(HX - 3, 21, lightOf(m));
}

const OUTFITS: Record<GooseOutfit, (s: Sketch) => void> = {
  witch: (s) => {
    // A cape over her back, and a pointed hat with a crooked tip and a band.
    s.ellipse(20, 26, 8, 4, fillOf(ROOF)).rect(13, 22, 6, 4, fillOf(ROOF));
    s.rect(13, 22, 6, 1, lightOf(ROOF));
    brim(s, 11, 11);
    for (let j = 0; j < 8; j++)
      s.rect(
        HX - 3 + Math.floor(j / 3),
        10 - j,
        Math.max(1, Math.round(6 - j * 0.6)),
        1,
        fillOf(ROOF),
      );
    s.set(HX + 2, 2, fillOf(ROOF))
      .set(HX + 3, 2, fillOf(ROOF))
      .set(HX + 4, 3, fillOf(ROOF));
    s.rect(HX - 3, 9, 6, 1, fillOf(ACCENT_TWO));
  },
  ghost: (s) => {
    // A sheet over all of her, wavy at the hem, with two eyeholes and her beak poking out.
    s.ellipse(HX + 1, HY - 1, 5, 5, fillOf(ROOF));
    for (let y = HY; y < 36; y++) {
      const half = Math.min(13, 4 + (y - HY) * 0.8);
      s.rect(Math.round(HX + 3 - half * 0.6), y, Math.round(half * 1.7), 1, fillOf(ROOF));
    }
    for (let x = 4; x < 27; x += 4) s.set(x, 36, fillOf(ROOF)).set(x + 1, 36, fillOf(ROOF));
    s.bevel(fillOf(ROOF), lightOf(ROOF), shadeOf(ROOF));
    s.rect(HX - 2, HY - 2, 2, 2, INK).rect(HX + 2, HY - 2, 2, 2, INK);
    s.rect(HX - 7, HY + 1, 3, 2, fillOf(ACCENT));
  },
  santa: (s) => {
    // A floppy red hat with a white band and bobble, and a scarf.
    for (let j = 0; j < 7; j++) s.rect(HX - 3 + j, 11 - j, 7 - j, 1, fillOf(ROOF));
    s.rect(HX + 4, 5, 3, 3, fillOf(ROOF));
    s.ellipse(HX + 7, 9, 2, 2, fillOf(ACCENT_TWO));
    brim(s, 11, 9, ACCENT_TWO);
    scarf(s, false);
  },
  antlers: (s) => {
    for (const [x, d] of [
      [HX - 2, -1],
      [HX + 2, 1],
    ] as const) {
      s.rect(x, 6, 1, 6, fillOf(TRIM));
      s.set(x + d, 7, fillOf(TRIM))
        .set(x + d * 2, 6, fillOf(TRIM))
        .set(x - d, 9, fillOf(TRIM));
    }
    bow(s);
  },
  bunny: (s) => {
    // A headband with two tall ears, pink inside.
    for (const x of [HX - 2, HX + 2]) {
      s.rect(x - 1, 2, 3, 9, fillOf(ACCENT_TWO)).set(x - 1, 2, lightOf(ACCENT_TWO));
      s.rect(x, 4, 1, 6, fillOf(ROOF));
    }
    s.rect(HX - 3, 11, 7, 1, fillOf(ACCENT_TWO));
  },
  hearts: (s) => {
    bow(s);
    // A little heart on her chest.
    s.rect(15, 27, 2, 1, fillOf(ROOF)).rect(18, 27, 2, 1, fillOf(ROOF));
    s.rect(15, 28, 5, 1, fillOf(ROOF)).rect(16, 29, 3, 1, fillOf(ROOF)).set(17, 30, fillOf(ROOF));
  },
  shamrock: (s) => {
    brim(s, 11, 9);
    s.rect(HX - 3, 5, 6, 6, fillOf(ROOF)).rect(HX - 3, 5, 1, 6, lightOf(ROOF));
    s.rect(HX - 3, 9, 6, 1, fillOf(ACCENT_TWO));
    bow(s);
  },
  stars: (s) => {
    // A blue bandana with white stars, and a red band in a little hat.
    s.rect(HX - 3, 21, 8, 3, fillOf(ROOF)).rect(HX - 2, 24, 5, 2, fillOf(ROOF));
    s.set(HX - 1, 25, fillOf(ROOF)).set(HX, 26, fillOf(ROOF));
    for (const [x, y] of [
      [HX - 2, 22],
      [HX + 1, 23],
      [HX + 3, 22],
    ] as const)
      s.set(x, y, WHITE);
    brim(s, 11, 7, ACCENT_TWO);
    s.rect(HX - 2, 8, 4, 3, fillOf(ACCENT_TWO)).rect(HX - 2, 9, 4, 1, fillOf(ROOF));
  },
  pilgrim: (s) => {
    brim(s, 11, 11);
    s.rect(HX - 3, 4, 6, 7, fillOf(ROOF)).rect(HX - 3, 4, 1, 7, lightOf(ROOF));
    s.rect(HX - 3, 9, 6, 1, darkOf(ROOF)).rect(HX - 1, 8, 2, 3, fillOf(ACCENT_TWO));
    s.rect(HX - 3, 21, 8, 2, WHITE).rect(HX - 4, 23, 4, 1, WHITE);
  },
  party: (s) => {
    // A striped cone with a pompom, at a jaunty angle.
    for (let j = 0; j < 8; j++) {
      s.rect(
        HX - 3 + Math.floor(j / 2),
        11 - j,
        Math.max(1, 6 - j),
        1,
        j % 3 === 1 ? fillOf(ACCENT_TWO) : fillOf(ROOF),
      );
    }
    s.ellipse(HX + 1, 2, 1.5, 1.5, fillOf(ACCENT_TWO));
    bow(s, ACCENT_TWO);
  },
  raincoat: (s) => {
    // A sou'wester, its brim longer behind, and a yellow coat over her body.
    s.ellipse(HX, 11, 3.5, 2.5, fillOf(ROOF)).rect(HX - 4, 12, 10, 2, fillOf(ROOF));
    s.rect(HX + 4, 13, 3, 2, fillOf(ROOF)).rect(HX - 4, 12, 10, 1, lightOf(ROOF));
    s.ellipse(19, 29, 9, 5, fillOf(ROOF)).rect(12, 22, 6, 6, fillOf(ROOF));
    s.rect(12, 22, 6, 1, lightOf(ROOF))
      .rect(14, 25, 1, 1, darkOf(ROOF))
      .rect(14, 28, 1, 1, darkOf(ROOF));
  },
  sunhat: (s) => {
    brim(s, 11, 15);
    s.ellipse(HX, 9, 4, 3, fillOf(ROOF)).rect(HX - 4, 10, 8, 1, fillOf(ACCENT_TWO));
    s.rect(HX - 4, HY - 2, 6, 2, INK).set(HX - 3, HY - 2, WHITE);
  },
  scarf: (s) => scarf(s, true),
  bobble: (s) => {
    s.ellipse(HX, 11, 4.5, 4, fillOf(ROOF)).rect(HX - 4, 11, 9, 2, fillOf(ROOF));
    s.rect(HX - 4, 12, 9, 2, fillOf(ACCENT_TWO));
    for (let x = HX - 3; x < HX + 4; x += 2) s.set(x, 9, shadeOf(ROOF));
    s.ellipse(HX, 6, 2, 2, fillOf(ACCENT_TWO)).set(HX - 1, 5, lightOf(ACCENT_TWO));
    scarf(s, true);
  },
};

/** The outfits' colours: the roof's keys the main one, the second accent the trim. */
const COLOURS: Record<GooseOutfit, { roof: string; trim?: string; accentTwo: string }> = {
  witch: { roof: C.plum, accentTwo: C.pumpkin },
  ghost: { roof: C.white, accentTwo: C.white },
  santa: { roof: C.scarlet, accentTwo: C.white },
  antlers: { roof: C.scarlet, trim: C.bark, accentTwo: C.gold },
  bunny: { roof: C.roseLight, accentTwo: C.white },
  hearts: { roof: C.roseLight, accentTwo: C.white },
  shamrock: { roof: C.leaf, accentTwo: C.gold },
  stars: { roof: C.navy, accentTwo: C.scarlet },
  pilgrim: { roof: C.furBlack, accentTwo: C.gold },
  party: { roof: C.lavender, accentTwo: C.gold },
  raincoat: { roof: C.gold, accentTwo: C.gold },
  sunhat: { roof: C.cream, accentTwo: C.rose },
  scarf: { roof: C.pumpkin, accentTwo: C.plum },
  bobble: { roof: C.blueFabric, accentTwo: C.white },
};

export const GOOSE_ART: Record<GooseOutfit, { source: SpriteSource; palette: Palette }> =
  Object.fromEntries(
    (Object.keys(OUTFITS) as GooseOutfit[]).map((outfit) => {
      const s = new Sketch(W, H);
      goose(s);
      OUTFITS[outfit](s);
      const { roof, trim, accentTwo } = COLOURS[outfit];
      const palette = buildingPalette({
        wall: C.white,
        roof,
        trim: trim ?? C.bark,
        door: C.berry,
        accent: C.pumpkin,
        accentTwo,
      });
      return [outfit, { source: finish(s), palette }];
    }),
  ) as Record<GooseOutfit, { source: SpriteSource; palette: Palette }>;
