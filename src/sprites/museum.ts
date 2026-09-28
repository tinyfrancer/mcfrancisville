import type { FurnitureId } from '../types/ids';
import {
  ACCENT_TWO,
  darkOf,
  fillOf,
  finish,
  GLASS,
  GLINT,
  INK,
  LEAVES,
  lightOf,
  ROOF,
  shadeOf,
  TRIM,
  WALL,
  WHITE,
} from './buildings';
import type { FurnitureArt } from './furniture';
import { ball, bat, palette, slab, WOOD } from './furnish';
import { PALETTE as C } from './palette';
import { Sketch } from './sketch';

// What Wrapunzel sends from the museum (phase 10), as her cases fill, at 32 (phase J). Like her
// neighbours' gifts, no shop sells them.

/** A luna moth of green glass on a brass stand, lit from inside. */
const LUNA_LAMP = (() => {
  const s = new Sketch(32, 46);
  s.ellipse(16, 43, 8, 3, fillOf(ACCENT_TWO)).rect(8, 43, 16, 1, shadeOf(ACCENT_TWO));
  s.rect(15, 22, 3, 21, fillOf(ACCENT_TWO)).rect(15, 22, 1, 21, lightOf(ACCENT_TWO));
  // Four wings, the hind ones trailing into long tails, each with an eyespot.
  for (const side of [-1, 1]) {
    s.ellipse(16 + side * 7, 9, 7, 7, fillOf(LEAVES));
    s.ellipse(16 + side * 5, 19, 5, 5, fillOf(LEAVES));
    s.line(16 + side * 6, 22, 16 + side * 9, 30, fillOf(LEAVES));
    s.line(16 + side * 7, 22, 16 + side * 10, 30, fillOf(LEAVES));
    s.ellipse(16 + side * 8, 9, 2, 2, lightOf(ACCENT_TWO)).set(16 + side * 8, 9, INK);
  }
  s.ellipse(10, 6, 3, 2, lightOf(LEAVES)).ellipse(22, 6, 3, 2, lightOf(LEAVES));
  s.rect(15, 4, 3, 18, WHITE).set(14, 2, fillOf(ACCENT_TWO)).set(18, 2, fillOf(ACCENT_TWO));
  s.set(15, 3, fillOf(ACCENT_TWO)).set(17, 3, fillOf(ACCENT_TWO));
  return finish(s);
})();

/**
 * Wrapunzel's museum in miniature: a cabinet with a nook for each family of critter, a moth, an
 * orb, a frog, a beetle, a fish and a bat, behind glass.
 */
const CURIOSITY_CABINET = (() => {
  const s = new Sketch(64, 60);
  slab(s, 2, 2, 60, 52, TRIM);
  s.rect(0, 0, 64, 4, fillOf(TRIM))
    .rect(0, 0, 64, 1, lightOf(TRIM))
    .rect(0, 3, 64, 1, darkOf(TRIM));
  for (const x of [4, 57]) s.rect(x, 54, 3, 5, darkOf(TRIM));
  const nooks: [number, number][] = [];
  for (const y of [7, 28]) for (const x of [5, 25, 45]) nooks.push([x, y]);
  for (const [x, y] of nooks) {
    s.rect(x, y, 15, 18, darkOf(TRIM)).rect(x + 1, y + 1, 13, 16, GLASS);
    s.set(x + 2, y + 2, GLINT).set(x + 3, y + 3, GLINT);
  }
  const at = (i: number) => nooks[i]!;
  // A luna moth.
  {
    const [x, y] = at(0);
    s.ellipse(x + 5, y + 7, 3, 3, fillOf(LEAVES)).ellipse(x + 10, y + 7, 3, 3, fillOf(LEAVES));
    s.rect(x + 7, y + 5, 1, 8, WHITE)
      .set(x + 5, y + 12, fillOf(LEAVES))
      .set(x + 9, y + 12, fillOf(LEAVES));
  }
  // An orb.
  {
    const [x, y] = at(1);
    ball(s, x + 7.5, y + 9, 4, 4, LEAVES);
    s.set(x + 6, y + 7, WHITE);
  }
  // A frog.
  {
    const [x, y] = at(2);
    ball(s, x + 7.5, y + 11, 5, 3.5, LEAVES);
    s.ellipse(x + 5, y + 7.5, 1.5, 1.5, WHITE).ellipse(x + 10, y + 7.5, 1.5, 1.5, WHITE);
    s.set(x + 5, y + 7, INK).set(x + 10, y + 7, INK);
  }
  // A jewel beetle.
  {
    const [x, y] = at(3);
    ball(s, x + 7.5, y + 10, 4, 5, ROOF);
    s.rect(x + 7, y + 6, 1, 9, darkOf(ROOF)).rect(x + 6, y + 4, 3, 2, INK);
  }
  // A ghost-fish.
  {
    const [x, y] = at(4);
    s.ellipse(x + 7, y + 9, 5, 3, fillOf(WALL)).set(x + 5, y + 8, INK);
    s.rect(x + 12, y + 7, 1, 5, fillOf(WALL)).rect(x + 11, y + 8, 1, 3, fillOf(WALL));
  }
  // A bat.
  {
    const [x, y] = at(5);
    bat(s, x, y + 6);
  }
  s.rect(26, 50, 12, 2, fillOf(ACCENT_TWO));
  for (const [x, y] of nooks) s.rect(x + 6, y + 18, 3, 1, fillOf(ACCENT_TWO));
  s.rect(0, 58, 1, 1, '.');
  return finish(s);
})();

export const MUSEUM_ART: Record<
  Extract<FurnitureId, 'lunaMothLamp' | 'curiosityCabinet'>,
  FurnitureArt
> = {
  lunaMothLamp: {
    source: LUNA_LAMP,
    palette: palette({ ...WOOD, leaves: C.luna, accentTwo: C.gold }),
    glow: {
      [fillOf(LEAVES)]: C.orbGreenLight,
      [lightOf(LEAVES)]: C.white,
      [WHITE]: C.white,
    },
    lights: [{ x: 16, y: 12, radius: 36 }],
  },
  curiosityCabinet: {
    source: CURIOSITY_CABINET,
    palette: palette({
      ...WOOD,
      trim: C.bark,
      accentTwo: C.gold,
      leaves: C.orbGreen,
      roof: C.blueFabric,
      wall: C.ghost,
      glass: C.dusk,
    }),
    glow: { [fillOf(LEAVES)]: C.orbGreenLight, [lightOf(LEAVES)]: C.white },
    lights: [{ x: 32, y: 20, radius: 40 }],
  },
};
