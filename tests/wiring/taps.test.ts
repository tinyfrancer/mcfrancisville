import { describe, expect, it } from 'vitest';
import { CUES } from '../../src/audio/cues';
import type { SoundBoard } from '../../src/audio/SoundBoard';
import type { MapSource } from '../../src/data/maps';
import { Effects, type Resolve } from '../../src/render/effects';
import { STEP_MS } from '../../src/loop';
import { feelTap } from '../../src/wiring/taps';
import { harness } from '../world/harness';

const LANE: MapSource = {
  rows: ['######', '#...R#', '######', '######'],
  spawn: { tx: 1, ty: 1 },
  legend: {
    '#': { tile: 'hedge', solid: true },
    '.': { tile: 'grass' },
    R: { tile: 'grass', prop: 'rock' },
  },
};

const resolve: Resolve = (a) => ('x' in a ? a : { x: 0, y: 0 });

function stage() {
  const h = harness(LANE);
  const effects = new Effects();
  const played: unknown[] = [];
  const sound = { cue: (tune: unknown) => played.push(tune) } as unknown as SoundBoard;
  const shown = () => {
    effects.step(STEP_MS, resolve);
    return effects.shown().map((s) => `${s.kind}${s.emote ?? ''}`);
  };
  return { h, effects, sound, played, shown };
}

describe('a tap felt (V1, decision 283)', () => {
  it('rings where it lands, brackets what she set off to, and ticks softly', () => {
    const { h, effects, sound, played, shown } = stage();
    const went = h.world.tapTile(4, 1);
    feelTap({ went, at: { x: 150, y: 40 } }, { world: h.world, effects, sound });
    expect(shown()).toEqual(['ring', 'outline']);
    expect(played).toEqual([CUES.tap]);
  });

  it('on open ground, only the ring and the tick', () => {
    const { h, effects, sound, played, shown } = stage();
    const went = h.world.tapTile(3, 1);
    feelTap({ went, at: { x: 110, y: 40 } }, { world: h.world, effects, sound });
    expect(shown()).toEqual(['ring']);
    expect(played).toEqual([CUES.tap]);
  });

  it('where she cannot go, a ? over her shrug and a soft no, never a toast', () => {
    const { h, effects, sound, played, shown } = stage();
    const went = h.world.tapTile(2, 3);
    feelTap({ went, at: { x: 80, y: 110 } }, { world: h.world, effects, sound });
    expect(shown()).toEqual(['ring', 'emote?']);
    expect(played).toEqual([CUES.refused]);
    expect(h.world.poses.pose()).toBe('shrug');
  });
});
