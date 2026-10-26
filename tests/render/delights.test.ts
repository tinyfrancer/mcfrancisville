import { describe, expect, it } from 'vitest';
import { cueOf } from '../../src/audio/cues';
import {
  Effects,
  FIREFLIES,
  PERCH_IN_MS,
  PERCH_OUT_MS,
  perchAt,
  type Resolve,
} from '../../src/render/effects';
import { STEP_MS } from '../../src/loop';
import { effectsOf, type Placing } from '../../src/wiring/effectsOf';

const HEAD = { x: 100, y: 60 };
const resolve: Resolve = (a) => ('her' in a ? HEAD : 'villager' in a ? null : a);
const here: Placing = { her: { x: 100, y: 90 }, toward: null, float: null };

function stepFor(effects: Effects, ms: number): void {
  for (let t = 0; t < ms; t += STEP_MS) effects.step(STEP_MS, resolve);
}

describe('a butterfly on her hat, as it looks (1.6’s X5)', () => {
  it('flutters in from up to one side and sits on her hat', () => {
    const start = perchAt({ age: 0, leaving: null }, HEAD);
    const sat = perchAt({ age: PERCH_IN_MS, leaving: null }, HEAD);
    expect(start.x).toBeLessThan(sat.x);
    expect(start.y).toBeLessThan(sat.y);
    expect(start.flying).toBe(true);
    expect(sat).toMatchObject({ alpha: 1, flying: false });
    // On top of her, a little to one side: its feet just under the top of her hat.
    expect(Math.abs(sat.x - HEAD.x)).toBeLessThanOrEqual(4);
    expect(sat.y).toBeGreaterThan(HEAD.y);
    expect(sat.y - HEAD.y).toBeLessThanOrEqual(8);
  });

  it('stays until it flits off, then is gone once it has flown', () => {
    const effects = new Effects();
    effects.push('town', { kind: 'perch', critter: 'mourningCloak' });
    stepFor(effects, 20_000);
    expect(effects.perched()).toBe('mourningCloak');
    effects.push('town', { kind: 'flit' });
    stepFor(effects, PERCH_OUT_MS / 2);
    expect(effects.perched()).toBe('mourningCloak');
    const away = perchAt({ age: 99_999, leaving: PERCH_OUT_MS / 2 }, HEAD);
    expect(away.y).toBeLessThan(HEAD.y);
    stepFor(effects, PERCH_OUT_MS);
    expect(effects.perched()).toBeNull();
  });

  it('with less motion asked for, sits at once and goes at once', () => {
    const effects = new Effects({ reduced: () => true });
    effects.push('town', { kind: 'perch', critter: 'ghostMoth' });
    expect(effects.perched()).toBe('ghostMoth');
    effects.push('town', { kind: 'flit' });
    expect(effects.perched()).toBeNull();
  });
});

describe('fireflies, as they look (1.6’s X5)', () => {
  it('gather softly round her while asked for, and go softly after', () => {
    const effects = new Effects({ random: () => 0.5 });
    for (let t = 0; t < 2000; t += STEP_MS) {
      effects.fireflies('town', true);
      effects.step(STEP_MS, resolve);
    }
    expect(effects.fireflyCount('town')).toBe(FIREFLIES);
    expect(effects.fireflyCount('whisperwood')).toBe(0);
    // Round her middle, not far off.
    for (const p of effects.glints('town')) {
      expect(Math.abs(p.x - HEAD.x)).toBeLessThan(40);
      expect(Math.abs(p.y - (HEAD.y + 24))).toBeLessThan(30);
    }
    for (let t = 0; t < 1000; t += STEP_MS) {
      effects.fireflies('town', false);
      effects.step(STEP_MS, resolve);
    }
    expect(effects.fireflyCount('town')).toBe(0);
  });

  it('none with less motion asked for, and none carried into another place', () => {
    const still = new Effects({ reduced: () => true });
    still.fireflies('town', true);
    stepFor(still, 2000);
    expect(still.fireflyCount('town')).toBe(0);

    const effects = new Effects();
    for (let t = 0; t < 2000; t += STEP_MS) {
      effects.fireflies('town', true);
      effects.step(STEP_MS, resolve);
    }
    effects.fireflies('whisperwood', true);
    expect(effects.fireflyCount('whisperwood')).toBe(0);
  });
});

describe('what the delights look and sound like (1.6’s X5)', () => {
  it('perches the butterfly on a landing and sends it off as it flies', () => {
    expect(effectsOf({ kind: 'landed', critter: 'monarch' }, here)).toEqual([
      { kind: 'perch', critter: 'monarch' },
    ]);
    expect(effectsOf({ kind: 'flewOff', critter: 'monarch' }, here)).toEqual([{ kind: 'flit' }]);
    expect(cueOf({ kind: 'landed', critter: 'monarch' })).toBe('wings');
  });

  it('drops a crow’s feathers off the scarecrow as it caws', () => {
    const shown = effectsOf({ kind: 'cawed', box: { tx: 4, ty: 3, w: 1, h: 1 } }, here);
    expect(shown).toHaveLength(1);
    expect(shown[0]).toMatchObject({ kind: 'burst', particle: 'feather' });
    expect(cueOf({ kind: 'cawed', box: { tx: 4, ty: 3, w: 1, h: 1 } })).toBe('caw');
  });

  it('puffs pollen at the sneeze, and a heart from whoever blessed her', () => {
    const alone = effectsOf({ kind: 'sneezed' }, here);
    expect(alone.map((e) => e.kind)).toEqual(['burst']);
    const blessed = effectsOf({ kind: 'sneezed', by: 'maude', line: 'Bless you!' }, here);
    expect(blessed[1]).toMatchObject({ kind: 'emote', emote: '♥', over: { villager: 'maude' } });
    expect(cueOf({ kind: 'sneezed' })).toBe('achoo');
  });

  it('has each pet say hello in its own voice, and Gary say nothing', () => {
    const at = { x: 50, y: 50 };
    expect(cueOf({ kind: 'greeted', pet: 'fibi', at })).toBe('woof');
    expect(cueOf({ kind: 'greeted', pet: 'elvira', at })).toBe('mew');
    expect(cueOf({ kind: 'greeted', pet: 'pickle', at })).toBe('chitter');
    expect(cueOf({ kind: 'greeted', pet: 'gary', at })).toBeNull();
  });

  it('pops up what Fibi brought, with no count: it isn’t hers', () => {
    const from = { x: 50, y: 50 };
    const shown = effectsOf(
      { kind: 'petGift', pet: 'fibi', gift: 'sock', line: 'A sock.', from },
      here,
    );
    expect(shown[0]).toEqual({ kind: 'pop', icon: { gift: 'sock' }, count: 0, from });
  });
});
