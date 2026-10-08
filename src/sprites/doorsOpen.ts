import { DOOR, fillOf, lightOf, shadeOf, darkOf, LAMP, type DoorRect } from './buildings';
import { PALETTE as C } from './palette';
import { CLEAR, Sketch } from './sketch';
import type { Palette, SpriteSource } from './sprite';

/*
 * A building's front door opening as she walks up to it (V1's E5): a patch the size of its door,
 * drawn over the building where the door is. It's worked out from the building's own grid, so
 * every door in the kit opens, square, arched or pointed, with whatever is set in it.
 */

/** Inside the doorway: the room's dark, its floor catching the light, and a lamp's glow. */
const DARK = '#';
const FLOOR = '=';
const WARM = '*';

/** How the inside of a doorway looks by day. */
export const OPEN_DOOR_PALETTE: Palette = {
  [DARK]: C.ink,
  [FLOOR]: C.plum,
  [WARM]: C.pumpkinDark,
};

/** After dark the room beyond is lit, so an open door spills a little candlelight. */
export const OPEN_DOOR_GLOW: Palette = { [WARM]: C.candle, [FLOOR]: C.pumpkinShade };

/** How far open: ajar as she comes near, then wide as she reaches the step. */
export type Opening = 1 | 2;

const LEAF_KEYS = new Set([...DOOR]);

/**
 * The door's leaf in the grid, row by row: the run from its first pixel of door to its last,
 * inside the frame, so a window or a knob set in it is part of it.
 */
function leafOf(source: SpriteSource, door: DoorRect): { y: number; from: number; to: number }[] {
  const rows: { y: number; from: number; to: number }[] = [];
  for (let y = door.y + 2; y < door.y + door.h; y++) {
    const row = source.rows[y] ?? '';
    let from = -1;
    let to = -1;
    for (let x = door.x + 2; x < door.x + door.w - 2; x++) {
      if (!LEAF_KEYS.has(row[x] ?? CLEAR)) continue;
      if (from < 0) from = x;
      to = x;
    }
    if (from >= 0) rows.push({ y, from, to });
  }
  return rows;
}

/** Which side its knob is on, so it swings in on its hinges' side. */
function knobOnLeft(source: SpriteSource, door: DoorRect): boolean {
  for (let y = door.y; y < door.y + door.h; y++) {
    const row = source.rows[y] ?? '';
    for (let x = door.x; x < door.x + door.w; x++) {
      if (row[x] === LAMP) return x < door.x + door.w / 2;
    }
  }
  return false;
}

/**
 * The door patch, `opening` open: the doorway dark with the room's floor at its foot, and the
 * leaf swung in against its hinges, half its width ajar and edge on once it's wide open.
 */
export function openDoor(source: SpriteSource, door: DoorRect, opening: Opening): SpriteSource {
  const s = new Sketch(door.w, door.h);
  const leaf = leafOf(source, door);
  if (leaf.length === 0) return s.toSource();
  const left = Math.min(...leaf.map((r) => r.from));
  const right = Math.max(...leaf.map((r) => r.to));
  const width = right - left + 1;
  const bottom = leaf[leaf.length - 1]!.y;
  const floorFrom = bottom - Math.round(leaf.length * 0.28);
  const hingeLeft = !knobOnLeft(source, door);
  const swung = opening === 1 ? Math.ceil(width * 0.45) : 3;
  for (const { y, from, to } of leaf) {
    for (let x = from; x <= to; x++) {
      const key = y >= floorFrom ? (y >= bottom - 2 ? WARM : FLOOR) : DARK;
      s.set(x - door.x, y - door.y, key);
    }
    // The leaf, against its hinges, lit along its edge and darker toward them.
    for (let k = 0; k < swung; k++) {
      const x = hingeLeft ? from + k : to - k;
      if (x < from || x > to) continue;
      const edge = k === swung - 1;
      const key = edge
        ? lightOf(DOOR)
        : k === 0
          ? darkOf(DOOR)
          : opening === 1
            ? fillOf(DOOR)
            : shadeOf(DOOR);
      s.set(x - door.x, y - door.y, key);
    }
  }
  return s.toSource();
}
