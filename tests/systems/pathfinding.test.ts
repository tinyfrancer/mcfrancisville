import { describe, expect, it } from 'vitest';
import { findPath } from '../../src/systems/pathfinding';

function grid(rows: string[]) {
  const walkable = (tx: number, ty: number) => rows[ty]?.[tx] === '.';
  return { walkable, width: rows[0]!.length, height: rows.length };
}

describe('findPath', () => {
  it('walks straight on open ground', () => {
    const g = grid(['.....']);
    expect(findPath({ tx: 0, ty: 0 }, { tx: 4, ty: 0 }, g.walkable, g.width, g.height)).toEqual([
      { tx: 1, ty: 0 },
      { tx: 2, ty: 0 },
      { tx: 3, ty: 0 },
      { tx: 4, ty: 0 },
    ]);
  });

  it('cuts diagonally across open ground', () => {
    const g = grid(['....', '....', '....', '....']);
    const path = findPath({ tx: 0, ty: 0 }, { tx: 3, ty: 3 }, g.walkable, g.width, g.height);
    expect(path).toHaveLength(3);
  });

  it('goes around a wall', () => {
    const g = grid(['.#.', '.#.', '...']);
    const path = findPath({ tx: 0, ty: 0 }, { tx: 2, ty: 0 }, g.walkable, g.width, g.height)!;
    expect(path.at(-1)).toEqual({ tx: 2, ty: 0 });
    expect(path.every((t) => g.walkable(t.tx, t.ty))).toBe(true);
  });

  it('never squeezes diagonally between two solid corners', () => {
    const g = grid(['.#', '#.']);
    expect(findPath({ tx: 0, ty: 0 }, { tx: 1, ty: 1 }, g.walkable, g.width, g.height)).toBeNull();
  });

  it('never clips the corner of one solid tile', () => {
    const g = grid(['.#', '..']);
    const path = findPath({ tx: 0, ty: 0 }, { tx: 1, ty: 1 }, g.walkable, g.width, g.height);
    expect(path).toEqual([
      { tx: 0, ty: 1 },
      { tx: 1, ty: 1 },
    ]);
  });

  it('returns null for an unreachable or solid goal, and [] for where you stand', () => {
    const g = grid(['.#.']);
    expect(findPath({ tx: 0, ty: 0 }, { tx: 2, ty: 0 }, g.walkable, g.width, g.height)).toBeNull();
    expect(findPath({ tx: 0, ty: 0 }, { tx: 1, ty: 0 }, g.walkable, g.width, g.height)).toBeNull();
    expect(findPath({ tx: 0, ty: 0 }, { tx: 0, ty: 0 }, g.walkable, g.width, g.height)).toEqual([]);
  });
});
