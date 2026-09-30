import type { Tile } from './pathfinding';

type Test = (tx: number, ty: number) => boolean;

const SIDES: readonly Tile[] = [
  { tx: 0, ty: -1 },
  { tx: 1, ty: 0 },
  { tx: 0, ty: 1 },
  { tx: -1, ty: 0 },
];

/**
 * The banks of the ice a tapped tile is on: every tile she can stand on beside that stretch of ice
 * (the creek, or the pond frozen over), for her to walk to the edge of it without her skates.
 */
export function banksOf(at: Tile, slippery: Test, canStand: Test): Tile[] {
  if (!slippery(at.tx, at.ty)) return [];
  const seen = new Set<string>([`${at.tx},${at.ty}`]);
  const ice: Tile[] = [at];
  const banks = new Map<string, Tile>();
  for (let i = 0; i < ice.length; i++) {
    const t = ice[i]!;
    for (const d of SIDES) {
      const next = { tx: t.tx + d.tx, ty: t.ty + d.ty };
      const key = `${next.tx},${next.ty}`;
      if (seen.has(key)) continue;
      seen.add(key);
      if (slippery(next.tx, next.ty)) ice.push(next);
      else if (canStand(next.tx, next.ty)) banks.set(key, next);
    }
  }
  return [...banks.values()];
}

/** The ice beside the bank she stands on that's nearest where she was heading, if there is any. */
export function iceBeside(bank: Tile, toward: Tile, slippery: Test): Tile | null {
  let best: Tile | null = null;
  let bestDistance = Infinity;
  for (const d of SIDES) {
    const t = { tx: bank.tx + d.tx, ty: bank.ty + d.ty };
    if (!slippery(t.tx, t.ty)) continue;
    const distance = Math.hypot(t.tx - toward.tx, t.ty - toward.ty);
    if (distance < bestDistance) [best, bestDistance] = [t, distance];
  }
  return best;
}
