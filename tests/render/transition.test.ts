import { describe, expect, it, vi } from 'vitest';
import {
  FLIGHT_MS,
  IRIS_CLOSE_MS,
  IRIS_OPEN_MS,
  LANDING_MS,
  WASH_COLOUR,
  WASH_MS,
  irisRows,
  passageMs,
  swoopAt,
  Transitions,
  washAlpha,
} from '../../src/render/transition';
import { STEP_MS } from '../../src/loop';

/** A canvas whose 2D context does nothing, since jsdom draws nothing. */
function canvas(width = 390, height = 724): HTMLCanvasElement {
  const c = document.createElement('canvas');
  c.width = width;
  c.height = height;
  return c;
}

function stepFor(t: Transitions, ms: number): void {
  for (let s = 0; s < ms; s += STEP_MS) t.step(STEP_MS);
}

describe('the iris', () => {
  it('is a circle of whole pixels round her: open inside, dark outside', () => {
    const at = { x: 100, y: 100 };
    const rows = irisRows(at, 40, 300, 300);
    expect(rows).toHaveLength(300);
    // Outside its height, the whole row is dark.
    expect(rows[50]).toEqual({ left: 0, right: 0 });
    expect(rows[150]).toEqual({ left: 0, right: 0 });
    // Through its middle, as wide as it is round.
    const middle = rows[100]!;
    expect(middle.right - middle.left).toBeGreaterThanOrEqual(78);
    expect(middle.right - middle.left).toBeLessThanOrEqual(81);
    // Narrower toward its top, and every edge on a whole pixel.
    const near = rows[64]!;
    expect(near.right - near.left).toBeLessThan(middle.right - middle.left);
    for (const r of rows) {
      expect(Number.isInteger(r.left) && Number.isInteger(r.right)).toBe(true);
    }
  });

  it('shut, it is all dark; wide open, nothing is', () => {
    expect(irisRows({ x: 50, y: 50 }, 0, 100, 100).every((r) => r.right === 0)).toBe(true);
    const open = irisRows({ x: 50, y: 50 }, 1000, 100, 100);
    expect(open.every((r) => r.left === 0 && r.right === 100)).toBe(true);
  });

  it('takes about 400 ms through a door, and the broom flies first', () => {
    expect(passageMs('iris')).toBe(IRIS_CLOSE_MS + IRIS_OPEN_MS);
    expect(passageMs('iris')).toBeGreaterThanOrEqual(350);
    expect(passageMs('iris')).toBeLessThanOrEqual(450);
    expect(passageMs('broom')).toBe(FLIGHT_MS + passageMs('iris'));
    // Her landing is seen as the iris opens.
    expect(LANDING_MS).toBe(FLIGHT_MS + IRIS_CLOSE_MS);
  });
});

describe('the broom', () => {
  it('swoops up and away from where she stood until she is past the edge', () => {
    const from = { x: 120, y: 400 };
    expect(swoopAt(0, from, 1, 390, 40)).toEqual(from);
    const half = swoopAt(0.5, from, 1, 390, 40);
    expect(half.y).toBeLessThan(from.y);
    expect(half.x).toBeGreaterThan(from.x);
    expect(swoopAt(1, from, 1, 390, 40).x).toBeGreaterThanOrEqual(390 + 40);
    expect(swoopAt(1, { x: 300, y: 400 }, -1, 390, 40).x).toBeLessThanOrEqual(-40);
    // Faster as she goes: more ground in the second half than the first.
    const end = swoopAt(1, from, 1, 390, 40);
    expect(end.x - half.x).toBeGreaterThan(half.x - from.x);
  });
});

describe('a window turning', () => {
  it('washes the frame in its colour, up quickly and away slowly, then nothing', () => {
    expect(washAlpha(0)).toBe(0);
    const peak = Math.max(...Array.from({ length: 50 }, (_, i) => washAlpha((i * WASH_MS) / 50)));
    expect(peak).toBeGreaterThan(0.15);
    expect(peak).toBeLessThan(0.3);
    expect(washAlpha(WASH_MS)).toBe(0);
    expect(new Set(Object.values(WASH_COLOUR)).size).toBe(3);
  });
});

describe('Transitions', () => {
  // jsdom has no 2D context; copying the frame is a no-op there, and it's the state that's tested.
  vi.spyOn(HTMLCanvasElement.prototype, 'getContext').mockReturnValue(null);

  it('draws nothing at all when nothing is under way', () => {
    const t = new Transitions(canvas());
    expect(t.state()).toBeNull();
    stepFor(t, 1000);
    expect(t.state()).toBeNull();
  });

  it('runs an iris through a door, and is done once it has opened', () => {
    const t = new Transitions(canvas());
    t.seen({ x: 200, y: 400 });
    t.entered();
    expect(t.state()).toEqual({ kind: 'iris', progress: 0 });
    stepFor(t, IRIS_CLOSE_MS);
    expect(t.state()?.progress).toBeCloseTo(IRIS_CLOSE_MS / passageMs('iris'), 1);
    stepFor(t, IRIS_OPEN_MS + STEP_MS);
    expect(t.state()).toBeNull();
  });

  it("flies home through a fade with less motion, and the door's moment doesn't start another", () => {
    const world = {
      broom: { look: { ribbon: 'plum', bristles: 'straw' } },
      wardrobe: { look: null },
    };
    // Reduced motion: the flight is a fade through dark (an iris that only fades).
    const reduced = new Transitions(canvas(), { reduced: () => true });
    reduced.flew(world as never);
    reduced.entered();
    expect(reduced.state()?.kind).toBe('iris');
    stepFor(reduced, passageMs('iris') + STEP_MS);
    expect(reduced.state()).toBeNull();
  });

  it('keeps a frame drawn after she went for the moment that says so', () => {
    const t = new Transitions(canvas());
    t.leaving('town:');
    t.seen({ x: 100, y: 300 });
    // The broom moves her outside the step; a frame is drawn in the new place before its moment.
    t.leaving('home:front');
    t.entered();
    expect(t.state()?.kind).toBe('iris');
    // One kept for a moment that never comes is let go.
    const idle = new Transitions(canvas());
    idle.leaving('town:');
    idle.leaving('home:front');
    stepFor(idle, 1000);
    idle.entered();
    expect(idle.state()?.kind).toBe('iris');
  });

  it("a window's wash comes and goes on its own", () => {
    const t = new Transitions(canvas());
    t.windowTurned('evening');
    expect(t.state()?.kind).toBe('wash');
    stepFor(t, WASH_MS + STEP_MS);
    expect(t.state()).toBeNull();
  });
});
