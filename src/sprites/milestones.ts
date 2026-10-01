import type { CritterId, MilestonePiece } from '../types/ids';
import {
  ACCENT,
  ACCENT_TWO,
  darkOf,
  DOOR,
  fillOf,
  finish,
  GLASS,
  GLINT,
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
import { CRITTER_ART } from './critters';
import type { FurnitureArt } from './furniture';
import { ball, frame, palette, slab, WOOD } from './furnish';
import { PALETTE as C } from './palette';
import { Sketch } from './sketch';
import type { Palette, SpriteSource } from './sprite';

// What finishing a shelf or a wing sends her (0.2's F2), at 32. The framed critters and the domes
// are a frame or a dome with the critter itself inside, as she sees it out and about, so each is
// always the critter she caught.

/** Keys the building kit never uses, for a critter's own keys inside a piece. */
const SPARE = 'αβγδεζηθικλμνξπρστυφχψω';

/** A critter's town-sized picture and palette, its keys moved to ones the kit leaves alone. */
function specimen(id: CritterId): { rows: string[]; palette: Palette; glow: Palette } {
  const art = CRITTER_ART[id];
  const keys = new Map<string, string>();
  const keyOf = (k: string) => {
    if (!keys.has(k)) keys.set(k, SPARE[keys.size]!);
    return keys.get(k)!;
  };
  const rows = art.world[0].rows.map((row) =>
    [...row].map((k) => (k === '.' ? '.' : keyOf(k))).join(''),
  );
  const moved = (p: Palette | undefined) =>
    Object.fromEntries(
      Object.entries(p ?? {}).flatMap(([k, v]) => (keys.has(k) ? [[keys.get(k)!, v]] : [])),
    );
  return { rows, palette: moved(art.palette), glow: moved(art.glow) };
}

/** Lays a critter's rows over a finished piece, at `x`, `y`. */
function laid(source: SpriteSource, rows: readonly string[], x: number, y: number): SpriteSource {
  const out = source.rows.map((r) => [...r]);
  rows.forEach((row, j) =>
    [...row].forEach((k, i) => {
      const line = out[y + j];
      if (k !== '.' && line && x + i < line.length) line[x + i] = k;
    }),
  );
  return { rows: out.map((r) => r.join('')) };
}

/** A gilt frame round a velvet mount, for the wall. */
const FRAME = (() => {
  const s = new Sketch(32, 32);
  frame(s, 1, 1, 30, 30, ACCENT_TWO, 3);
  s.rect(4, 4, 24, 24, fillOf(ROOF));
  s.rect(4, 4, 24, 1, darkOf(ROOF)).rect(4, 4, 1, 24, darkOf(ROOF));
  s.rect(13, 27, 6, 2, lightOf(ACCENT_TWO));
  return finish(s);
})();

/** A glass dome on a turned wooden plinth, clear but for its rim and its shine. */
const DOME = (() => {
  const s = new Sketch(32, 42);
  slab(s, 3, 33, 26, 5, TRIM);
  s.rect(5, 38, 22, 3, darkOf(TRIM)).rect(2, 32, 28, 2, lightOf(TRIM));
  const inside = (i: number, j: number) => ((i - 15.5) / 13) ** 2 + ((j - 19) / 18) ** 2 <= 1;
  for (let j = 1; j < 32; j++) {
    for (let i = 2; i < 30; i++) {
      const rim =
        inside(i, j) && (!inside(i - 1, j) || !inside(i + 1, j) || !inside(i, j - 1) || j === 31);
      if (rim) s.set(i, j, GLASS);
    }
  }
  s.line(8, 9, 6, 16, GLINT).line(9, 7, 11, 5, GLINT).set(7, 20, GLINT);
  s.rect(14, 0, 4, 2, fillOf(ACCENT_TWO));
  return s.toSource();
})();

/** Which critter each piece shows. */
const FRAMED: Record<Extract<MilestonePiece, `framed${string}` | `${string}Dome`>, CritterId> = {
  framedMoth: 'lunaMoth',
  framedBat: 'vampireBat',
  framedFrog: 'axolotl',
  framedOrb: 'wisp',
  framedBeetle: 'herculesBeetle',
  framedFish: 'blueMoonfish',
  mothDome: 'wishingMoth',
  batDome: 'lanternBat',
  frogDome: 'glowToad',
  orbDome: 'greenOrb',
  beetleDome: 'jewelBeetle',
  fishDome: 'booKoi',
};

const FRAME_COLOURS = palette({ ...WOOD, accentTwo: C.gold, roof: C.navy });
const DOME_COLOURS = palette({ ...WOOD, trim: C.bark, accentTwo: C.gold, glass: C.ghost });

function framed(id: CritterId): FurnitureArt {
  const critter = specimen(id);
  return {
    source: laid(FRAME, critter.rows, 4, 4),
    palette: { ...FRAME_COLOURS, ...critter.palette },
    ...(Object.keys(critter.glow).length > 0 ? { glow: critter.glow } : {}),
  };
}

function domed(id: CritterId): FurnitureArt {
  const critter = specimen(id);
  return {
    source: laid(DOME, critter.rows, 4, 9),
    palette: { ...DOME_COLOURS, ...critter.palette },
    ...(Object.keys(critter.glow).length > 0 ? { glow: critter.glow } : {}),
  };
}

/** Cody's shelf of squishies: goo balls and dumplings, two rows of them, on a little bookcase. */
const SQUISHY_SHELF = (() => {
  const s = new Sketch(32, 46);
  slab(s, 2, 2, 28, 42, TRIM);
  for (const y of [5, 19, 33]) s.rect(4, y, 24, 9, darkOf(TRIM));
  for (const y of [14, 28]) s.rect(3, y, 26, 2, lightOf(TRIM));
  const goo = [ACCENT, LEAVES, ROOF, DOOR, WALL, STONE];
  [6, 13, 20].forEach((x, i) => ball(s, x + 3, 10, 3, 3, goo[i]!));
  [6, 13, 20].forEach((x, i) => ball(s, x + 3, 24, 3, 3, goo[i + 3]!));
  // Two dumplings on the bottom shelf, pleats up, sleepy faces.
  for (const x of [9, 22]) {
    ball(s, x, 39, 5, 3, WALL);
    s.set(x, 36, shadeOf(WALL)).set(x - 1, 36, shadeOf(WALL));
    s.set(x - 2, 39, INK).set(x + 2, 39, INK);
  }
  const shine: [number, number][] = [
    [8, 9],
    [15, 9],
    [22, 23],
  ];
  for (const [x, y] of shine) s.set(x, y, WHITE);
  s.rect(4, 44, 3, 2, darkOf(TRIM)).rect(25, 44, 3, 2, darkOf(TRIM));
  return finish(s);
})();

/** Agatha's haunted dollhouse: a crooked little house, a light on upstairs, faces at the windows. */
const DOLL_HOUSE = (() => {
  const s = new Sketch(32, 48);
  // The roof, steep and a little crooked, with a tiny chimney.
  for (let j = 0; j < 16; j++) {
    const half = Math.floor(j * 0.95) + 1;
    s.rect(16 - half, 2 + j, half * 2, 1, j % 3 === 2 ? shadeOf(ROOF) : fillOf(ROOF));
  }
  s.rect(22, 3, 3, 7, fillOf(STONE)).rect(22, 3, 1, 7, lightOf(STONE));
  slab(s, 2, 18, 28, 26, WALL);
  s.rect(1, 17, 30, 2, darkOf(ROOF));
  // Two windows up, lit; one down beside the door.
  const windows: [number, number][] = [
    [6, 22],
    [19, 22],
    [6, 32],
  ];
  for (const [x, y] of windows) {
    s.rect(x - 1, y - 1, 9, 8, fillOf(TRIM)).rect(x, y, 7, 6, GLASS);
    s.rect(x + 3, y, 1, 6, fillOf(TRIM));
  }
  // A doll's face at the lit window, peeking.
  s.ellipse(22, 25, 2, 2, fillOf(ACCENT)).set(21, 25, INK).set(23, 25, INK);
  s.rect(19, 32, 7, 12, fillOf(DOOR))
    .rect(19, 32, 7, 1, lightOf(DOOR))
    .set(24, 38, fillOf(ACCENT_TWO));
  s.rect(0, 44, 32, 3, fillOf(TRIM)).rect(0, 44, 32, 1, lightOf(TRIM));
  s.set(15, 8, GLASS).set(16, 8, GLASS);
  return finish(s);
})();

export const MILESTONE_ART: Record<MilestonePiece, FurnitureArt> = {
  framedMoth: framed(FRAMED.framedMoth),
  framedBat: framed(FRAMED.framedBat),
  framedFrog: framed(FRAMED.framedFrog),
  framedOrb: framed(FRAMED.framedOrb),
  framedBeetle: framed(FRAMED.framedBeetle),
  framedFish: framed(FRAMED.framedFish),
  mothDome: domed(FRAMED.mothDome),
  batDome: domed(FRAMED.batDome),
  frogDome: domed(FRAMED.frogDome),
  orbDome: domed(FRAMED.orbDome),
  beetleDome: domed(FRAMED.beetleDome),
  fishDome: domed(FRAMED.fishDome),
  squishyShelf: {
    source: SQUISHY_SHELF,
    palette: palette({
      ...WOOD,
      trim: C.wood,
      accent: C.pumpkin,
      leaves: C.leafLight,
      roof: C.blueFabric,
      door: C.rose,
      wall: C.ghost,
      stone: C.lavender,
    }),
  },
  dollHouse: {
    source: DOLL_HOUSE,
    palette: palette({
      ...WOOD,
      wall: C.lavender,
      roof: C.plum,
      trim: C.ink,
      door: C.berry,
      accent: C.skinMinty,
      glass: C.dusk,
    }),
    glow: { [GLASS]: C.candle },
    lights: [{ x: 22, y: 25, radius: 18 }],
  },
};
