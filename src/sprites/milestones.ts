import type { CritterId, MilestonePiece } from '../types/ids';
import { ACCENT_TWO, darkOf, fillOf, finish, GLASS, GLINT, lightOf, ROOF, TRIM } from './buildings';
import { CRITTER_ART } from './critters';
import { SHOWCASE_FURNITURE_ART } from './display';
import type { FurnitureArt } from './furniture';
import { frame, palette, slab, WOOD } from './furnish';
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
  return specimenOf(art.world[0], art.palette, art.glow);
}

/** A picture's rows and palettes, its keys moved to ones the kit leaves alone. */
export function specimenOf(
  source: SpriteSource,
  palette: Palette,
  glow?: Palette,
): { rows: string[]; palette: Palette; glow: Palette } {
  const art = { palette, glow };
  const keys = new Map<string, string>();
  const keyOf = (k: string) => {
    if (!keys.has(k)) keys.set(k, SPARE[keys.size]!);
    return keys.get(k)!;
  };
  const rows = source.rows.map((row) => [...row].map((k) => (k === '.' ? '.' : keyOf(k))).join(''));
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

export function framed(id: CritterId): FurnitureArt {
  const critter = specimen(id);
  return {
    source: laid(FRAME, critter.rows, 4, 4),
    palette: { ...FRAME_COLOURS, ...critter.palette },
    ...(Object.keys(critter.glow).length > 0 ? { glow: critter.glow } : {}),
  };
}

export function domed(id: CritterId): FurnitureArt {
  return domeOver(specimen(id));
}

/** Anything at 24 under the glass dome: its rows, its palette and what of it glows. */
export function domeOver(critter: {
  rows: string[];
  palette: Palette;
  glow: Palette;
}): FurnitureArt {
  return {
    source: laid(DOME, critter.rows, 4, 9),
    palette: { ...DOME_COLOURS, ...critter.palette },
    ...(Object.keys(critter.glow).length > 0 ? { glow: critter.glow } : {}),
  };
}

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
  // They show the squishies and dolls she has (0.3's H2), drawn with the other display pieces.
  squishyShelf: SHOWCASE_FURNITURE_ART.squishyShelf,
  dollHouse: SHOWCASE_FURNITURE_ART.dollHouse,
};
