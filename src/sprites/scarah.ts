import type { FixtureId, ScarahPiece } from '../types/ids';
import {
  ACCENT,
  ACCENT_TWO,
  darkOf,
  DOOR,
  fillOf,
  finish,
  INK,
  LEAVES,
  lightOf,
  ROOF,
  shadeOf,
  STONE,
  TRIM,
  WALL,
  WHITE,
} from './buildings';
import type { FurnitureArt } from './furniture';
import { ball, palette, slab, WOOD } from './furnish';
import type { FixtureArt } from './interiors';
import { PALETTE as C } from './palette';
import { Sketch } from './sketch';

/*
 * Scarah's (0.3's F3): the seed drawers in her farmhouse, her keepsakes (Cornelius's perch and the
 * harvest moon quilt), and the straw friend she teaches her to make, drawn at 32 from the
 * building kit's materials as every piece is.
 */

// ---- Her seed drawers -------------------------------------------------------------------------

/** A tall dresser of little drawers, four by four, each with a knob and a stitched label. */
const SEED_DRAWERS = (() => {
  const s = new Sketch(64, 60);
  slab(s, 0, 8, 64, 52, TRIM);
  s.rect(0, 8, 64, 2, darkOf(TRIM)).rect(0, 9, 64, 1, lightOf(TRIM));
  for (let row = 0; row < 4; row++) {
    for (let col = 0; col < 4; col++) {
      const x = 3 + col * 15;
      const y = 12 + row * 11;
      slab(s, x, y, 13, 9, DOOR);
      s.rect(x + 3, y + 2, 7, 2, WHITE)
        .set(x + 4, y + 2, INK)
        .set(x + 7, y + 3, INK);
      s.rect(x + 6, y + 6, 2, 1, fillOf(ACCENT_TWO));
    }
  }
  // On top: a jar of seeds, a tin, and a few packets propped up.
  slab(s, 4, 0, 9, 8, STONE);
  s.rect(5, 3, 7, 4, fillOf(ACCENT_TWO)).rect(5, 1, 7, 1, lightOf(STONE));
  slab(s, 20, 2, 10, 6, ROOF);
  for (const [x, m] of [
    [38, ACCENT],
    [45, LEAVES],
    [52, ACCENT_TWO],
  ] as const) {
    slab(s, x, 1, 6, 7, WALL);
    s.rect(x + 1, 3, 4, 3, fillOf(m));
  }
  return finish(s);
})();

export const SCARAH_FIXTURE_ART: Pick<Record<FixtureId, FixtureArt>, 'seedDrawers'> = {
  seedDrawers: {
    source: SEED_DRAWERS,
    palette: palette({
      ...WOOD,
      trim: C.wood,
      door: C.rope,
      roof: C.scarlet,
      stone: C.iceLight,
      accent: C.rose,
      accentTwo: C.gold,
      leaves: C.leaf,
    }),
  },
};

// ---- Her keepsakes ----------------------------------------------------------------------------

/** A wooden perch on three feet, a straw nest on its crossbar and a brass bell hung from its end. */
const CROW_PERCH = (() => {
  const s = new Sketch(32, 48);
  s.rect(15, 16, 3, 30, fillOf(TRIM)).rect(15, 16, 1, 30, lightOf(TRIM));
  slab(s, 7, 44, 19, 3, TRIM);
  slab(s, 3, 14, 26, 3, TRIM);
  // The nest: a bowl of straw, a few loose strands sticking out.
  ball(s, 12, 11, 7, 4, ACCENT_TWO);
  s.rect(5, 12, 15, 2, fillOf(ACCENT_TWO)).rect(6, 13, 13, 1, shadeOf(ACCENT_TWO));
  for (const [x, y] of [
    [4, 9],
    [19, 8],
    [8, 7],
    [16, 6],
  ] as const) {
    s.set(x, y, lightOf(ACCENT_TWO));
  }
  // The bell, on a short string.
  s.rect(25, 17, 1, 3, darkOf(TRIM));
  ball(s, 25, 22, 3, 3, ACCENT);
  s.rect(23, 24, 5, 1, shadeOf(ACCENT)).set(25, 26, darkOf(ACCENT));
  return finish(s);
})();

/** A quilt hung from a rod: patchwork all round, a gold moon in the middle, rows of tiny corn. */
const HARVEST_QUILT = (() => {
  const s = new Sketch(64, 32);
  const patches = [DOOR, ACCENT, LEAVES, ROOF, ACCENT_TWO] as const;
  for (let y = 3; y < 31; y += 4) {
    for (let x = 2; x < 62; x += 4) {
      const m = patches[((x / 4 + (y / 4) * 2) % patches.length) | 0]!;
      s.rect(x, y, 4, 4, fillOf(m)).set(x, y, lightOf(m));
    }
  }
  // Its middle: a calm panel with the moon and the corn stitched on.
  s.rect(14, 6, 36, 22, fillOf(WALL)).rect(14, 6, 36, 1, lightOf(WALL));
  ball(s, 32, 14, 6, 6, ACCENT_TWO);
  for (let x = 17; x < 48; x += 3) {
    if (x > 24 && x < 40) continue;
    s.rect(x, 20, 1, 6, fillOf(LEAVES)).rect(x, 18, 1, 3, fillOf(ACCENT_TWO));
  }
  for (let x = 20; x < 46; x += 2) s.set(x, 26, shadeOf(WALL));
  // The rod it hangs from, a knob at each end.
  s.rect(0, 1, 64, 2, fillOf(TRIM)).rect(0, 1, 64, 1, lightOf(TRIM));
  return finish(s);
})();

export const SCARAH_PIECES_ART: Record<ScarahPiece, FurnitureArt> = {
  crowPerch: {
    source: CROW_PERCH,
    palette: palette({ ...WOOD, trim: C.wood, accent: C.gold, accentTwo: C.rope }),
  },
  harvestQuilt: {
    source: HARVEST_QUILT,
    palette: palette({
      ...WOOD,
      wall: C.cream,
      door: C.sky,
      accent: C.rose,
      leaves: C.leaf,
      roof: C.lavender,
      accentTwo: C.gold,
      trim: C.wood,
    }),
  },
  strawFriend: {
    source: (() => {
      const s = new Sketch(32, 48);
      // The post, and her arms out along the cross-piece, straw at the cuffs.
      s.rect(15, 34, 3, 13, fillOf(TRIM)).rect(15, 34, 1, 13, lightOf(TRIM));
      slab(s, 3, 23, 26, 3, WALL);
      for (const x of [1, 2, 29, 30]) s.rect(x, 23, 1, 3, fillOf(ACCENT_TWO));
      // Her gingham sundress, flaring, with a patch.
      for (let y = 22; y < 36; y++) {
        const half = 4 + Math.round((y - 22) * 0.45);
        s.rect(16 - half, y, half * 2, 1, fillOf(DOOR));
        for (let x = 16 - half; x < 16 + half; x++) {
          if (((x >> 1) + (y >> 1)) % 2 === 0) s.set(x, y, lightOf(DOOR));
        }
      }
      s.rect(18, 29, 3, 3, fillOf(ACCENT)).set(18, 29, INK);
      // Her burlap face and stitched smile, under a straw bob.
      ball(s, 16, 15, 7, 6, WALL);
      s.rect(9, 11, 14, 3, fillOf(ACCENT_TWO));
      for (let y = 12; y < 22; y++) {
        s.set(8, y, fillOf(ACCENT_TWO)).set(23, y, fillOf(ACCENT_TWO));
        if (y % 2 === 0) s.set(9, y, shadeOf(ACCENT_TWO)).set(22, y, shadeOf(ACCENT_TWO));
      }
      s.rect(13, 15, 2, 2, INK).rect(18, 15, 2, 2, INK);
      s.rect(13, 19, 6, 1, darkOf(WALL)).set(12, 18, darkOf(WALL)).set(19, 18, darkOf(WALL));
      s.set(11, 18, fillOf(ACCENT)).set(21, 18, fillOf(ACCENT));
      // Her straw hat, its brim wide and floppy, a red band round it.
      s.rect(3, 9, 26, 2, fillOf(ACCENT_TWO)).rect(3, 9, 26, 1, lightOf(ACCENT_TWO));
      s.rect(2, 10, 2, 2, fillOf(ACCENT_TWO)).rect(28, 10, 2, 2, fillOf(ACCENT_TWO));
      ball(s, 16, 6, 7, 4, ACCENT_TWO);
      s.rect(9, 7, 14, 2, fillOf(ROOF));
      // The little wooden crow on her shoulder.
      ball(s, 25, 19, 3, 2, STONE);
      ball(s, 27, 16, 2, 2, STONE);
      s.set(28, 15, WHITE).rect(29, 16, 2, 1, fillOf(ACCENT_TWO));
      return finish(s);
    })(),
    palette: palette({
      ...WOOD,
      wall: C.rope,
      trim: C.wood,
      door: C.sky,
      accent: C.rose,
      accentTwo: C.gold,
      roof: C.scarlet,
      stone: C.inkFabric,
    }),
  },
};
