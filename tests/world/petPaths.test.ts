import { describe, expect, it } from 'vitest';
import { TILE_SIZE } from '../../src/config/world';
import type { Tile } from '../../src/systems/pathfinding';
import { Pet, type PetSurroundings } from '../../src/world/Pet';

/** A room ten tiles square with nothing in it, and a pillar where `solid` says. */
function room(solid: (tx: number, ty: number) => boolean = () => false) {
  return {
    canWalk: (tx: number, ty: number) => tx >= 0 && ty >= 0 && tx < 10 && ty < 10 && !solid(tx, ty),
    width: 10,
    height: 10,
  };
}

/** A pet pottering about at home, sent to `goal`, and every point it passes on the way. */
function trot(from: Tile, goal: Tile, ground = room()): { x: number; y: number }[] {
  const pet = new Pet('fibi', from);
  const s: PetSurroundings = {
    now: 0,
    ground,
    her: { x: 9.5 * TILE_SIZE, y: 9.5 * TILE_SIZE, facing: 'down', moving: true, stillMs: 0 },
    following: false,
    held: false,
    villagers: [],
    roam: [goal],
    happy: false,
  };
  const points = [{ x: pet.x, y: pet.y }];
  for (let i = 0; i < 1000 && (i === 0 || pet.moving); i++) {
    pet.update(16, s);
    points.push({ x: pet.x, y: pet.y });
  }
  return points;
}

const middle = (t: Tile) => ({ x: (t.tx + 0.5) * TILE_SIZE, y: (t.ty + 0.5) * TILE_SIZE });

describe('pets on a pulled path (1.1 W1)', () => {
  it('trot straight across an open room, as she walks, not tile to tile', () => {
    const from = { tx: 1, ty: 1 };
    const goal = { tx: 8, ty: 4 };
    const points = trot(from, goal);
    const a = middle(from);
    const b = middle(goal);
    expect(points.at(-1)).toEqual(b);
    for (const p of points) {
      // How far off the straight line from its tile's middle to the goal's, in world pixels.
      const off =
        Math.abs((b.x - a.x) * (p.y - a.y) - (b.y - a.y) * (p.x - a.x)) /
        Math.hypot(b.x - a.x, b.y - a.y);
      expect(off).toBeLessThan(0.01);
    }
  });

  it('still go round what stands in the way, never through it', () => {
    const pillar = (tx: number, ty: number) => tx === 4 && ty >= 0 && ty <= 6;
    const points = trot({ tx: 1, ty: 2 }, { tx: 7, ty: 2 }, room(pillar));
    expect(points.at(-1)).toEqual(middle({ tx: 7, ty: 2 }));
    for (const p of points) {
      expect(pillar(Math.floor(p.x / TILE_SIZE), Math.floor(p.y / TILE_SIZE))).toBe(false);
    }
    // Round the pillar's foot: below it, and no further than it needs.
    expect(Math.max(...points.map((p) => p.y))).toBeLessThan(8 * TILE_SIZE);
    expect(Math.max(...points.map((p) => p.y))).toBeGreaterThan(7 * TILE_SIZE);
  });
});
