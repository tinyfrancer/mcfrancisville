import { describe, expect, it } from 'vitest';
import {
  EMOTE_MS,
  Effects,
  POOL_SIZE,
  POP_ARC_MS,
  POP_FLOAT_MS,
  POP_GAP_MS,
  STILL_EMOTE_MS,
  STILL_POP_MS,
  popAt,
  type Resolve,
} from '../../src/render/effects';
import { STEP_MS } from '../../src/loop';

/** A seeded random, so where the bits fly is the same every run. */
function seeded(seed = 1): () => number {
  let s = seed;
  return () => {
    s = (s * 16807) % 2147483647;
    return (s - 1) / 2147483646;
  };
}

const HEAD = { x: 100, y: 60 };
/** Her head at `HEAD`, Maude's at 200,60, and anyone else not here. */
const resolve: Resolve = (a) =>
  'her' in a ? HEAD : 'villager' in a ? (a.villager === 'maude' ? { x: 200, y: 60 } : null) : a;

function stepFor(effects: Effects, ms: number): void {
  for (let t = 0; t < ms; t += STEP_MS) effects.step(STEP_MS, resolve);
}

describe('popAt', () => {
  it('starts where it came from, arcs up, and ends over her head', () => {
    const from = { x: 40, y: 100 };
    expect(popAt(0, from, HEAD)).toMatchObject({ x: 40, y: 100, alpha: 1 });
    const middle = popAt(POP_ARC_MS / 2, from, HEAD);
    // Above the straight line between them: it's thrown, not slid.
    expect(middle.y).toBeLessThan((from.y + HEAD.y) / 2);
    expect(popAt(POP_ARC_MS, from, HEAD)).toMatchObject({ x: HEAD.x, y: HEAD.y });
  });

  it('floats up after, and fades only at the end', () => {
    const later = popAt(POP_ARC_MS + POP_FLOAT_MS / 2, null, HEAD);
    expect(later.y).toBeLessThan(HEAD.y);
    expect(later.alpha).toBe(1);
    expect(popAt(POP_ARC_MS + POP_FLOAT_MS - 10, null, HEAD).alpha).toBeLessThan(0.1);
  });

  it('from her own hands, rises from below her head with no arc', () => {
    const start = popAt(0, null, HEAD);
    expect(start.x).toBe(HEAD.x);
    expect(start.y).toBeGreaterThan(HEAD.y);
  });

  it('is always on a whole pixel', () => {
    for (let age = 0; age < 1100; age += 7) {
      const p = popAt(age, { x: 33.3, y: 91.7 }, { x: 100.5, y: 60.2 });
      expect(Number.isInteger(p.x) && Number.isInteger(p.y)).toBe(true);
    }
  });
});

describe('the effects queue', () => {
  it('shows a pop from the step it is pushed, for its life, then lets it go', () => {
    const effects = new Effects({ random: seeded() });
    effects.push('town', { kind: 'pop', icon: { item: 'stone' }, count: 2, from: { x: 0, y: 0 } });
    effects.step(STEP_MS, resolve);
    expect(effects.shown()).toEqual([
      expect.objectContaining({ kind: 'pop', zone: 'town', icon: { item: 'stone' }, count: 2 }),
    ]);
    stepFor(effects, POP_ARC_MS + POP_FLOAT_MS);
    expect(effects.shown()).toEqual([]);
  });

  it('spaces pops that come together, so each is seen', () => {
    const effects = new Effects({ random: seeded() });
    const stone = { kind: 'pop', icon: { item: 'stone' }, count: 1, from: HEAD } as const;
    effects.push('town', stone);
    effects.push('town', stone);
    effects.step(STEP_MS, resolve);
    expect(effects.shown()).toHaveLength(1);
    stepFor(effects, POP_GAP_MS);
    expect(effects.shown()).toHaveLength(2);
  });

  it('keeps one emote over a head at a time: the newest', () => {
    const effects = new Effects({ random: seeded() });
    effects.push('town', { kind: 'emote', emote: '!', over: { her: true } });
    effects.push('town', { kind: 'emote', emote: '♪', over: { her: true } });
    effects.push('town', { kind: 'emote', emote: '♥', over: { villager: 'maude' } });
    effects.step(STEP_MS, resolve);
    expect(effects.shown().map((s) => s.emote)).toEqual(['♪', '♥']);
    stepFor(effects, EMOTE_MS);
    expect(effects.shown()).toEqual([]);
  });

  it('waits out a delay before it begins', () => {
    const effects = new Effects({ random: seeded() });
    effects.push('town', { kind: 'emote', emote: '!', over: { her: true }, delayMs: 100 });
    effects.step(STEP_MS, resolve);
    expect(effects.shown()).toEqual([]);
    stepFor(effects, 100);
    expect(effects.shown()).toHaveLength(1);
  });

  it('throws a burst of particles where it is, and they fall away in their time', () => {
    const effects = new Effects({ random: seeded() });
    effects.push('town', { kind: 'burst', particle: 'heart', at: { villager: 'maude' } });
    effects.push('town', { kind: 'burst', particle: 'leaf', at: { x: 10, y: 10 }, count: 3 });
    effects.step(STEP_MS, resolve);
    expect(effects.particles('town')).toBe(4 + 3);
    expect(effects.particles('home')).toBe(0);
    expect(effects.shown()).toEqual([]);
    stepFor(effects, 2000);
    expect(effects.particles()).toBe(0);
  });

  it("throws nothing over someone who isn't here", () => {
    const effects = new Effects({ random: seeded() });
    effects.push('town', { kind: 'burst', particle: 'heart', at: { villager: 'rufus' } });
    effects.step(STEP_MS, resolve);
    expect(effects.particles()).toBe(0);
  });

  it('never holds more particles than its pool, reusing the oldest', () => {
    const effects = new Effects({ random: seeded() });
    for (let i = 0; i < 20; i++) {
      effects.push('town', { kind: 'burst', particle: 'confetti', at: HEAD, count: 16 });
      effects.step(STEP_MS, resolve);
    }
    expect(effects.particles()).toBe(POOL_SIZE);
  });

  it('kicks up dust at each footfall outdoors, none indoors or standing', () => {
    const effects = new Effects({ random: seeded() });
    const walk = (walkMs: number, moving = true) => ({ x: 0, y: 0, moving, walkMs });
    effects.walking('town', walk(0), true);
    effects.walking('town', walk(100), true);
    expect(effects.particles()).toBe(0);
    effects.walking('town', walk(300), true);
    expect(effects.particles()).toBe(1);
    effects.walking('home', walk(600), false);
    effects.walking('town', walk(900, false), true);
    expect(effects.particles()).toBe(1);
  });

  it('with reduced motion asked for: no bits fly, and pops and emotes are short and still', () => {
    const effects = new Effects({ reduced: () => true, random: seeded() });
    effects.push('town', { kind: 'burst', particle: 'confetti', at: HEAD });
    effects.push('town', { kind: 'pop', icon: { candy: true }, count: 5, from: { x: 0, y: 0 } });
    effects.push('town', { kind: 'emote', emote: '♥', over: { villager: 'maude' } });
    effects.walking('town', { x: 0, y: 0, moving: true, walkMs: 0 }, true);
    effects.walking('town', { x: 0, y: 0, moving: true, walkMs: 300 }, true);
    effects.step(STEP_MS, resolve);
    expect(effects.particles()).toBe(0);
    const lives = effects.shown().map((s) => [s.kind, s.life]);
    expect(lives).toEqual([
      ['pop', STILL_POP_MS],
      ['emote', STILL_EMOTE_MS],
    ]);
  });
});
