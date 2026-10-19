import { CRITTERS, flies } from '../data/critters';
import type { CritterId } from '../types/ids';
import type { Tile } from './pathfinding';

/*
 * Shy critters (V1's R6a, decision 316): the rare ones, and the moths finer than a common one,
 * notice her rushing up and drift a tile away, then settle there. Creeping up (walking no more
 * than three tiles since she last stood still, so stopping a few steps off and then tapping
 * it) or coming up behind a flier, she isn't noticed. A flier is
 * drawn face on, looking out of the screen, so its back is to the north: from there it never sees
 * her coming. It's never more than a tile, never more than twice an hour, and the commons don't mind
 * her at all. All of it is worked out from where she is, how far she has come and the clock.
 */

/** How near she comes before a shy critter may notice her. */
export const NOTICE_TILES = 2;
/**
 * Having walked no more than this since she last stood still, she's creeping up, and it doesn't
 * mind her: stopped four tiles off and tapping it, she reaches it unnoticed.
 */
export const CREEP_TILES = 3;
/** How long a hop a tile away takes, drawn as a little arc, never a jump cut. */
export const HOP_MS = 320;
/** How many times a critter drifts off in its hour before it's used to her and stays put. */
export const DRIFTS_AN_HOUR = 2;

/** Whether a critter is shy: a rare or legendary one, or a moth finer than a common one. */
export function drifts(id: CritterId): boolean {
  const row = CRITTERS[id];
  // A fish is in the water, and a creepy-crawly keeps to its spot (0.3's C2).
  if (row.family === 'fish' || row.family === 'crawly') return false;
  if (row.rarity === 'rare' || row.rarity === 'legendary') return true;
  return row.family === 'moth' && row.rarity !== 'common';
}

const reach = (a: Tile, b: Tile) => Math.max(Math.abs(a.tx - b.tx), Math.abs(a.ty - b.ty));

/**
 * Whether she's behind a flier: north of it, where its back is, since it looks out at us; more
 * north of it than to one side, so coming at it along a row above it is still from the side.
 */
export function isBehind(critter: Tile, her: Tile): boolean {
  const above = critter.ty - her.ty;
  return above > 0 && Math.abs(her.tx - critter.tx) <= above;
}

/** What a critter notices of her: where she is, and how many tiles she has walked to get there. */
export interface Approach {
  her: Tile;
  walked: number;
}

/**
 * Whether a critter notices her and drifts off: shy, she's near, she has come further than a
 * creep, and, for a flier, she isn't coming up behind it.
 */
export function startles(id: CritterId, at: Tile, approach: Approach): boolean {
  if (!drifts(id)) return false;
  if (reach(approach.her, at) > NOTICE_TILES) return false;
  if (approach.walked <= CREEP_TILES) return false;
  if (flies(id) && isBehind(at, approach.her)) return false;
  return true;
}

/**
 * Where a startled critter drifts: the tile beside it furthest from her that's free, and further
 * from her than it was; null if there's none, when it stays where it is.
 */
export function driftTo(at: Tile, her: Tile, free: (t: Tile) => boolean): Tile | null {
  const was = Math.hypot(at.tx - her.tx, at.ty - her.ty);
  let best: Tile | null = null;
  let bestD = was;
  for (let dy = -1; dy <= 1; dy++) {
    for (let dx = -1; dx <= 1; dx++) {
      if (dx === 0 && dy === 0) continue;
      const t = { tx: at.tx + dx, ty: at.ty + dy };
      const d = Math.hypot(t.tx - her.tx, t.ty - her.ty);
      if (d > bestD + 1e-9 && reach(t, her) >= reach(at, her) && free(t)) {
        best = t;
        bestD = d;
      }
    }
  }
  return best;
}
