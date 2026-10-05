import { inReach } from './beds';
import type { Tile } from './pathfinding';

/*
 * The barn's wall at Boo Acres (0.3's F2, decision 242): the farm's fields as blocks of beds, and
 * where her sprinklers go to water a field whole with as few as can do it.
 */

/** A field: beds that touch, side to side or end to end, and which of the farm's rows it spans. */
export interface Field {
  beds: Tile[];
  /** The first and last of the place's rows of beds it takes in, counted from 1 at the top. */
  rows: [number, number];
}

const key = (t: Tile) => `${t.tx},${t.ty}`;

/**
 * A place's beds as fields, top first: each block of beds that touch, so a pair of rows with no
 * path between them is one field.
 */
export function fieldsOf(beds: readonly Tile[]): Field[] {
  const left = new Map(beds.map((t) => [key(t), t]));
  const rowsDown = [...new Set(beds.map((t) => t.ty))].sort((a, b) => a - b);
  const fields: Field[] = [];
  const sorted = [...beds].sort((a, b) => a.ty - b.ty || a.tx - b.tx);
  for (const start of sorted) {
    if (!left.has(key(start))) continue;
    left.delete(key(start));
    const field: Tile[] = [];
    const queue = [start];
    while (queue.length > 0) {
      const t = queue.shift()!;
      field.push(t);
      for (const [dx, dy] of [
        [1, 0],
        [-1, 0],
        [0, 1],
        [0, -1],
      ] as const) {
        const next = left.get(key({ tx: t.tx + dx, ty: t.ty + dy }));
        if (!next) continue;
        left.delete(key(next));
        queue.push(next);
      }
    }
    field.sort((a, b) => a.ty - b.ty || a.tx - b.tx);
    const top = rowsDown.indexOf(field[0]!.ty) + 1;
    const bottom = rowsDown.indexOf(field.at(-1)!.ty) + 1;
    fields.push({ beds: field, rows: [top, bottom] });
  }
  return fields;
}

/**
 * Where to stand sprinklers so every bed in `field` is watered: each in a bed with none yet, the
 * one reaching the most beds not yet watered first (top left on a tie), until none is left dry.
 * `watered` says which are already reached, and `taken` which beds already have one.
 */
export function sprinklersFor(
  field: readonly Tile[],
  watered: (bed: Tile) => boolean,
  taken: (bed: Tile) => boolean,
): Tile[] {
  const dry = new Set(field.filter((b) => !watered(b)).map(key));
  const chosen: Tile[] = [];
  while (dry.size > 0) {
    let best: Tile | null = null;
    let most = 0;
    for (const bed of field) {
      if (taken(bed) || chosen.some((c) => key(c) === key(bed))) continue;
      const reaches = field.filter((b) => dry.has(key(b)) && inReach(bed, b)).length;
      if (reaches > most) {
        best = bed;
        most = reaches;
      }
    }
    if (!best) break;
    chosen.push(best);
    for (const b of field) if (inReach(best, b)) dry.delete(key(b));
  }
  return chosen;
}
