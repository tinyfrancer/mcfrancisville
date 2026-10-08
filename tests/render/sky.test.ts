import { describe, expect, it } from 'vitest';
import { SKY } from '../../src/data/sky';
import { crossing, flyerOut } from '../../src/render/sky';
import { leafAt, leavesFall, shedsLeaves } from '../../src/render/leaves';
import type { Drawable } from '../../src/render/scene';

describe('what crosses the sky (V1 E5)', () => {
  const view = { x: 100, y: 200, width: 390, height: 724 };

  it('has crows by day and bats at dusk', () => {
    expect(flyerOut('crow', 9)).toBe(true);
    expect(flyerOut('crow', 21)).toBe(false);
    expect(flyerOut('bat', 20)).toBe(true);
    expect(flyerOut('bat', 12)).toBe(false);
  });

  it('crosses each sky now and then, along its top or bottom, never through her middle', () => {
    for (const [zone, flyers] of Object.entries(SKY)) {
      flyers.forEach((flyer, i) => {
        const seen: { x: number; y: number }[] = [];
        let gaps = 0;
        for (let ms = 0; ms < 60_000; ms += 250) {
          const at = crossing(flyer, i, zone as keyof typeof SKY, view, ms);
          if (!at) {
            gaps++;
            continue;
          }
          seen.push(at);
          expect(Number.isInteger(at.x) && Number.isInteger(at.y)).toBe(true);
          const band = (at.y - view.y) / view.height;
          expect(band < 0.4 || band > 0.6, `${zone} ${flyer} ${i}`).toBe(true);
        }
        expect(seen.length, `${zone} ${flyer} ${i}`).toBeGreaterThan(0);
        expect(gaps).toBeGreaterThan(0);
        // It goes from one side of the view to the other.
        const xs = seen.map((p) => p.x);
        expect(Math.max(...xs) - Math.min(...xs)).toBeGreaterThan(view.width / 2);
      });
    }
  });

  it('beats its wings as it goes', () => {
    const frames = new Set<number>();
    for (let ms = 0; ms < 60_000; ms += 40) {
      const at = crossing('crow', 0, 'booAcres', view, ms);
      if (at) frames.add(at.frame);
    }
    expect([...frames].sort()).toEqual([0, 1, 2]);
  });
});

describe('leaves falling in autumn (V1 E5)', () => {
  const tree = {
    x: 320,
    y: 160,
    footY: 256,
    sprite: { width: 64, height: 96 },
  } as unknown as Drawable;

  it('falls from September to November, under the trees that shed', () => {
    expect(
      ['2026-08-31', '2026-09-01', '2026-10-15', '2026-11-30', '2026-12-01'].map(leavesFall),
    ).toEqual([false, true, true, true, false]);
    expect(shedsLeaves('tree')).toBe(true);
    expect(shedsLeaves('fountain')).toBe(false);
  });

  it('drops from the crown to the ground round the trunk, rocking as it goes', () => {
    const path: { x: number; y: number; frame: number }[] = [];
    let gaps = 0;
    for (let ms = 0; ms < 30_000; ms += 100) {
      const at = leafAt(tree, 0, ms);
      if (at) path.push(at);
      else gaps++;
    }
    expect(path.length).toBeGreaterThan(10);
    expect(gaps).toBeGreaterThan(0);
    for (const p of path) {
      expect(p.y).toBeGreaterThanOrEqual(tree.y);
      expect(p.y).toBeLessThanOrEqual(tree.footY);
      expect(p.x).toBeGreaterThan(tree.x - 20);
      expect(p.x).toBeLessThan(tree.x + 64 + 20);
    }
    expect(new Set(path.map((p) => p.frame)).size).toBe(2);
  });
});
