import { describe, expect, it } from 'vitest';
import { flicker, frameAt, frameCount, sourcesOf, type Frames } from '../../src/sprites/frames';
import { PROP_ART } from '../../src/sprites/props';
import { guttered } from '../../src/sprites/motion';
import { FURNITURE_ART } from '../../src/sprites/furniture';
import { FIXTURE_ART } from '../../src/sprites/interiors';
import { carsAt, WHEEL_STEPS } from '../../src/sprites/fairground';
import { phaseAt } from '../../src/render/frames';
import { PALETTE as C } from '../../src/sprites/palette';
import { spriteSize, type Palette, type SpriteSource } from '../../src/sprites/sprite';

describe('frames (V1 E5)', () => {
  const two: Frames = { glows: [{}, {}], period: 1000 };

  it('takes each frame in turn over the period, offset by a phase', () => {
    expect([0, 499, 500, 999, 1000].map((ms) => frameAt(two, ms))).toEqual([0, 0, 1, 1, 0]);
    expect(frameAt(two, 0, 500)).toBe(1);
    expect(frameAt(two, -250)).toBe(1);
  });

  it('follows an order, mostly steady with a dip now and then', () => {
    const order = flicker(10, { 3: 1, 4: 1 });
    expect(order).toEqual([0, 0, 0, 1, 1, 0, 0, 0, 0, 0]);
    const f: Frames = { glows: [{}, {}], period: 1000, order };
    const seen = Array.from({ length: 10 }, (_, i) => frameAt(f, i * 100 + 50));
    expect(seen).toEqual(order);
  });

  it('draws art dear to draw once, when first asked', () => {
    let calls = 0;
    const f: Frames = { sources: () => (calls++, [{ rows: ['a'] }, { rows: ['b'] }]), period: 1 };
    expect(calls).toBe(0);
    expect(frameCount(f)).toBe(2);
    sourcesOf(f);
    expect(calls).toBe(1);
  });

  it('gives things side by side phases of their own', () => {
    const phases = new Set(Array.from({ length: 8 }, (_, i) => phaseAt(10 + i, 4, 9600)));
    expect(phases.size).toBeGreaterThan(5);
    for (const p of phases) expect(p).toBeLessThan(9600);
  });

  it('gutters candlelight a step warmer and leaves other light alone', () => {
    const g = guttered({ a: C.candleBright, b: C.candle, c: C.orbGreenLight, d: null });
    expect(g).toEqual({ a: C.candle, b: C.pumpkinLight, c: C.orbGreenLight, d: null });
  });

  const everything: (readonly [
    string,
    { source: SpriteSource; frames?: Frames; glow?: Palette },
  ])[] = [
    ...Object.entries(PROP_ART).map(([id, a]) => [`prop:${id}`, a] as const),
    ...Object.entries(FURNITURE_ART).map(([id, a]) => [`furniture:${id}`, a] as const),
    ...Object.entries(FIXTURE_ART).map(([id, a]) => [`fixture:${id}`, a] as const),
  ];

  it.each(everything.filter(([, a]) => a.frames))(
    '%s: every frame is the size of its picture, and something changes',
    (_, art) => {
      const frames = art.frames!;
      const size = spriteSize(art.source);
      const sources = sourcesOf(frames);
      for (const s of sources) expect(spriteSize(s)).toEqual(size);
      expect(frameCount(frames)).toBeGreaterThan(1);
      if (frames.glows) expect(frames.glows.length).toBe(frameCount(frames));
      const looks = new Set(
        Array.from({ length: frameCount(frames) }, (_, i) =>
          JSON.stringify([sources[i]?.rows ?? null, frames.glows?.[i] ?? null]),
        ),
      );
      expect(looks.size).toBe(frameCount(frames));
      for (const i of frames.order ?? []) expect(i).toBeLessThan(frameCount(frames));
    },
  );

  it('moves what the plan says moves', () => {
    for (const id of ['fountain', 'ferrisWheel', 'lantern', 'pumpkin', 'castle', 'popUpShop'])
      expect(PROP_ART[id as keyof typeof PROP_ART].frames, id).toBeDefined();
  });

  it("hangs the wheel's cars round it, all the way round, on whole pixels", () => {
    const first = carsAt(0);
    const half = carsAt(WHEEL_STEPS / 2);
    expect(first).toHaveLength(8);
    // Half a turn on, each car is where the one opposite it was.
    first.forEach((c, k) => {
      const opposite = half[(k + 4) % 8]!;
      expect(Math.abs(opposite.x - c.x)).toBeLessThanOrEqual(1);
      expect(Math.abs(opposite.y - c.y)).toBeLessThanOrEqual(1);
      expect(Number.isInteger(c.x) && Number.isInteger(c.y)).toBe(true);
    });
    expect(carsAt(WHEEL_STEPS)).toEqual(first);
  });
});
