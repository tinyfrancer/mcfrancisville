import { PET_RESTS, REST_LIKES, type RestKind } from '../data/affection';
import type { Placed } from '../data/home';
import { PET_IDS } from '../data/pets';
import type { PetId } from '../types/ids';
import { footprint } from './decor';
import type { Tile } from './pathfinding';
import { hashString } from './random';

/**
 * Where each pet rests at home (V1's R6c, decision 317): by the fire, up on the bed or the sofa,
 * or sprawled on a rug, chosen from the pieces in the room she's in by what each likes best, one
 * pet to a tile. Worked out from the room as it stands, so a moved bed takes its pets with it.
 */
export interface RestSpot {
  kind: RestKind;
  /** The floor tile it walks to: where it rests, or in front of what it hops up onto. */
  floor: Tile;
  /** Up on the piece: the tile it sits on and how high; null on the floor. */
  perch: { tile: Tile; lift: number } | null;
  /** Which way it sits: facing into the room, or at the fire, its back to her, watching it. */
  looks: 'front' | 'back';
}

/** The spots a piece has for a pet, each with the tile no other pet may take. */
function spotsOf(piece: Placed, canWalk: (tx: number, ty: number) => boolean): RestSpot[] {
  const row = PET_RESTS[piece.id];
  if (!row || piece.on) return [];
  const { w, h } = footprint(piece.id, piece.turn);
  const spots: RestSpot[] = [];
  for (let tx = piece.tx; tx < piece.tx + w; tx++) {
    if (row.kind === 'rug') {
      for (let ty = piece.ty; ty < piece.ty + h; ty++) {
        if (canWalk(tx, ty))
          spots.push({ kind: 'rug', floor: { tx, ty }, perch: null, looks: 'front' });
      }
      continue;
    }
    const front = { tx, ty: piece.ty + h };
    if (!canWalk(front.tx, front.ty)) continue;
    if (row.kind === 'hearth') {
      spots.push({ kind: 'hearth', floor: front, perch: null, looks: 'back' });
    } else {
      const tile = { tx, ty: piece.ty + h - 1 };
      spots.push({
        kind: row.kind,
        floor: front,
        perch: { tile, lift: row.lift ?? 0 },
        looks: 'front',
      });
    }
  }
  return spots;
}

/** The tile a spot keeps for its pet: up on the piece, or on the floor. */
function held(spot: RestSpot): string {
  const t = spot.perch?.tile ?? spot.floor;
  return `${t.tx},${t.ty}`;
}

/**
 * Each pet's resting spot in a room: its favourite kind there is, a spot on it picked by its name
 * so it's the same one each time, and none shared; a pet with nothing it likes has none.
 */
export function restSpots(
  placed: readonly Placed[],
  canWalk: (tx: number, ty: number) => boolean,
): Map<PetId, RestSpot> {
  const all = placed.flatMap((p) => spotsOf(p, canWalk));
  const taken = new Set<string>();
  const out = new Map<PetId, RestSpot>();
  for (const id of PET_IDS) {
    for (const kind of REST_LIKES[id]) {
      const open = all.filter((s) => s.kind === kind && !taken.has(held(s)));
      if (open.length === 0) continue;
      const spot = open[hashString(`rest:${id}`) % open.length]!;
      taken.add(held(spot));
      // Nobody waits on the floor in front of a pet that's up on the bed.
      taken.add(`${spot.floor.tx},${spot.floor.ty}`);
      out.set(id, spot);
      break;
    }
  }
  return out;
}
