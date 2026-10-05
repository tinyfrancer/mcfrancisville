import { PALETTE as C, ramp } from './palette';
import { CLEAR, Sketch } from './sketch';
import type { Palette, SpriteSource } from './sprite';

/*
 * The arch in her back wall through to the room beyond (0.3's H4), at 32: a wooden frame round a
 * round-topped opening, the dusk of the next room inside it and its floorboards catching the
 * light at the bottom. Drawn into the room's wall, its foot on the skirting board, over the tile
 * of floor she walks onto to go through.
 */

/** How far the frame hangs past its tile on each side. */
export const DOORWAY_OVERHANG = 4;

export const DOORWAY_WIDTH = 32 + DOORWAY_OVERHANG * 2;
export const DOORWAY_HEIGHT = 76;

const WOOD = ramp(C.wood);

export interface DoorwayArt {
  source: SpriteSource;
  palette: Palette;
}

export const DOORWAY_ART: DoorwayArt = {
  source: (() => {
    const w = DOORWAY_WIDTH;
    const h = DOORWAY_HEIGHT;
    const s = new Sketch(w, h);
    // The frame: posts and a round head, a keystone at its top.
    s.ellipse(w / 2, 20, 20, 20, 'f').rect(0, 20, w, h - 20, 'f');
    s.bevel('f', 'F', 'd');
    // The opening, the next room's dusk deepening toward the top.
    s.ellipse(w / 2, 22, 14, 15, 'o').rect(6, 22, w - 12, h - 22, 'o');
    s.replace('o', 'k', (_, y) => y < 34);
    s.dither('k', 'o', 0, 30, w, 8);
    // Its floorboards, lit from this side, and a threshold board under the arch.
    s.replace('o', 'b', (_, y) => y >= h - 12);
    for (let x = 9; x < w - 6; x += 7) s.rect(x, h - 12, 1, 9, 'B');
    s.replace('b', 'l', (x, y) => y >= h - 12 && y < h - 10 && x % 2 === 0);
    s.rect(4, h - 3, w - 8, 3, 'd').rect(5, h - 3, w - 10, 1, 'F');
    // A keystone, and the frame's grain.
    s.rect(w / 2 - 3, 0, 6, 6, 'K').rect(w / 2 - 2, 1, 4, 1, 'F');
    for (let y = 26; y < h - 6; y += 9) {
      s.set(2, y, 'd').set(w - 3, y + 4, 'd');
    }
    s.outline({ f: 'd', F: 'd', K: 'd' });
    return s.toSource();
  })(),
  palette: {
    [CLEAR]: null,
    f: WOOD[2],
    F: WOOD[3],
    d: C.barkDark,
    K: C.bark,
    k: C.ink,
    o: C.dusk,
    b: C.bark,
    B: C.barkDark,
    l: C.wood,
  },
};
