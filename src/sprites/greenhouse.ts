import type { FixtureId } from '../types/ids';
import {
  darkOf,
  fillOf,
  finish,
  GLASS,
  GLASS_DARK,
  GLINT,
  LEAVES,
  lightOf,
  shadeOf,
  STONE,
  TRIM,
  DOOR,
} from './buildings';
import { frame, palette, slab, WOOD } from './furnish';
import type { FixtureArt } from './interiors';
import { mix, PALETTE as C } from './palette';
import { Sketch } from './sketch';

/*
 * Inside the greenhouse at Boo Acres (0.3's F2, decision 242): its raised beds, each one of her
 * beds, and the glass along its back wall, drawn at 32 from the building kit's materials.
 */

/**
 * A raised bed edged in old brick and heaped with dark soil. Its soil is where a planter box's is
 * (`PLANTER_SOIL` above its tile's foot), so a crop stands in it as in one at home.
 */
const RAISED_BED = (() => {
  // A tile tall, as anything standing in a room is, the bed in its bottom 22 rows.
  const s = new Sketch(32, 32);
  const top = 10;
  slab(s, 1, top + 4, 30, 15, STONE);
  s.rect(3, top + 5, 26, 3, fillOf(DOOR));
  s.rect(3, top + 5, 26, 1, shadeOf(DOOR));
  for (const x of [6, 12, 18, 24]) s.set(x, top + 6, lightOf(DOOR));
  // Brick courses, each a half brick along from the last.
  for (const y of [10, 14]) s.rect(2, top + y, 28, 1, darkOf(STONE));
  for (const x of [8, 16, 24]) s.rect(x, top + 11, 1, 3, darkOf(STONE));
  for (const x of [4, 12, 20, 28]) s.rect(x, top + 15, 1, 3, darkOf(STONE));
  s.rect(3, top + 19, 3, 2, shadeOf(STONE)).rect(26, top + 19, 3, 2, shadeOf(STONE));
  return finish(s);
})();

/**
 * A run of the greenhouse's glass, two tiles wide and two tall on the back wall: white glazing bars
 * over panes that catch the light, and a vine climbing up the frame.
 */
const GLASS_PANES = (() => {
  const s = new Sketch(64, 64);
  frame(s, 1, 2, 62, 60, TRIM, 3);
  for (const [x, y] of [
    [4, 5],
    [33, 5],
    [4, 33],
    [33, 33],
  ] as const) {
    s.rect(x, y, 27, 26, GLASS);
    s.rect(x, y + 20, 27, 6, GLASS_DARK);
    for (let k = 0; k < 8; k++) s.set(x + 4 + k, y + 3 + k, GLINT);
    for (let k = 0; k < 4; k++) s.set(x + 4 + k, y + 9 + k, GLINT);
  }
  // The glazing bars between the panes.
  slab(s, 30, 4, 4, 56, TRIM);
  slab(s, 4, 30, 56, 4, TRIM);
  // A vine up the left side and along the top.
  for (let y = 60; y > 6; y -= 6) {
    s.ellipse(4 + ((y / 6) % 2), y, 3, 2, fillOf(LEAVES));
    s.set(4 + ((y / 6) % 2), y - 1, lightOf(LEAVES));
  }
  for (let x = 10; x < 40; x += 7) {
    s.ellipse(x, 4, 2.5, 2, fillOf(LEAVES));
    s.set(x - 1, 3, lightOf(LEAVES));
  }
  return finish(s);
})();

export const GREENHOUSE_FIXTURE_ART: Pick<
  Record<FixtureId, FixtureArt>,
  'raisedBed' | 'glassPanes'
> = {
  raisedBed: {
    source: RAISED_BED,
    palette: palette({
      ...WOOD,
      stone: mix(C.pumpkinShade, C.stone, 0.45),
      door: C.soilDark,
    }),
  },
  glassPanes: {
    source: GLASS_PANES,
    palette: palette({
      ...WOOD,
      trim: C.white,
      leaves: C.leaf,
      glass: mix(C.tealLight, C.skyDay, 0.4),
    }),
  },
};
