import { describe, expect, it } from 'vitest';
import { clearLine, findPath, stringPull } from '../../src/systems/pathfinding';

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

const BODY = 7 / 16;
const mid = (tx: number, ty: number) => ({ x: tx + 0.5, y: ty + 0.5 });

describe('clearLine', () => {
  it('sees straight along an open row, and not through a wall', () => {
    const g = grid(['.....', '..#..']);
    expect(clearLine(mid(0, 0), mid(4, 0), g.walkable, BODY)).toBe(true);
    expect(clearLine(mid(0, 1), mid(4, 1), g.walkable, BODY)).toBe(false);
  });

  it('keeps her body off a corner a thin line would slip past', () => {
    // The centre line passes just over the wall's top-right corner.
    const g = grid(['....', '.#..', '....']);
    const to = { x: 3.5, y: 1.4 };
    expect(clearLine(mid(0, 0), to, g.walkable, 0)).toBe(true);
    expect(clearLine(mid(0, 0), to, g.walkable, BODY)).toBe(false);
  });

  it('passes a one-tile gap with nothing to spare', () => {
    const g = grid(['#.#', '...', '#.#']);
    expect(clearLine(mid(1, 0), mid(1, 2), g.walkable, BODY)).toBe(true);
  });

  it('treats beyond the edge as solid', () => {
    const g = grid(['...']);
    expect(clearLine(mid(0, 0), { x: 0.5, y: -0.5 }, g.walkable, BODY)).toBe(false);
  });
});

describe('stringPull', () => {
  it('pulls a staircase of grid steps into one straight walk', () => {
    const g = grid(['.....', '.....', '.....']);
    const path = findPath({ tx: 0, ty: 0 }, { tx: 4, ty: 2 }, g.walkable, g.width, g.height)!;
    expect(path.length).toBeGreaterThan(1);
    const points = path.map((t) => mid(t.tx, t.ty));
    expect(stringPull(mid(0, 0), points, g.walkable, BODY)).toEqual([mid(4, 2)]);
  });

  it('keeps the corner it has to go round', () => {
    const g = grid(['.#.', '.#.', '...']);
    const path = findPath({ tx: 0, ty: 0 }, { tx: 2, ty: 0 }, g.walkable, g.width, g.height)!;
    const pulled = stringPull(
      mid(0, 0),
      path.map((t) => mid(t.tx, t.ty)),
      g.walkable,
      BODY,
    );
    expect(pulled.at(-1)).toEqual(mid(2, 0));
    expect(pulled.length).toBeGreaterThan(1);
    let from = mid(0, 0);
    for (const p of pulled) {
      expect(clearLine(from, p, g.walkable, BODY)).toBe(true);
      from = p;
    }
  });

  it('is empty for an empty path', () => {
    const g = grid(['.']);
    expect(stringPull(mid(0, 0), [], g.walkable, BODY)).toEqual([]);
  });
});
