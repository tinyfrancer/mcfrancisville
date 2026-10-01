import { describe, expect, it } from 'vitest';
import { FURNITURE } from '../../src/data/furniture';
import { FIXTURES, INTERIORS } from '../../src/data/interiors';
import { TUNE_IDS, TUNES, tunesOf } from '../../src/data/instruments';
import { RECIPES } from '../../src/data/recipes';
import type { FixtureId } from '../../src/types/ids';
import type { WorldEvent } from '../../src/world/World';
import { harness, type Harness } from './harness';

const tunesIn = (events: WorldEvent[]) =>
  events.flatMap((e) => (e.kind === 'tune' ? [e.tune] : []));

function walkTo(h: Harness, tx: number, ty: number): WorldEvent[] {
  expect(h.world.tapTile(tx, ty), `a way to ${tx},${ty}`).toBe(true);
  return h.until(() => !h.world.player.moving, `walking to ${tx},${ty}`).concat(h.tick(2));
}

describe("what plays (0.2's G2)", () => {
  it('gives every instrument a tune, and every tune an instrument something plays', () => {
    const plays = [
      ...Object.values(FURNITURE).map((r) => r.plays),
      ...Object.values(FIXTURES).map((r) => r.plays),
    ].filter((p) => p !== undefined);
    expect(new Set(plays)).toEqual(new Set(['piano', 'musicBox']));
    for (const id of TUNE_IDS) expect(plays, id).toContain(TUNES[id].instrument);
    expect(tunesOf('piano')[0]).toBe('hushUpAndDance');
    expect(RECIPES.piano.makes).toEqual({ furniture: 'piano' });
    expect(RECIPES.piano.card).toBeGreaterThan(0);
  });

  it('plays the piano at home, each of its tunes in turn', () => {
    const home = { placed: [{ id: 'piano' as const, tx: 6, ty: 3, turn: 0 }] };
    const h = harness(undefined, { home, player: { zone: 'home', tx: 6, ty: 8, facing: 'up' } });
    const heard = Array.from({ length: 5 }, () => {
      walkTo(h, 6, 6);
      const events = walkTo(h, 6, 3);
      expect(events).toContainEqual(expect.objectContaining({ kind: 'arrived', piece: 'piano' }));
      return tunesIn(events);
    }).flat();
    expect(heard).toHaveLength(5);
    expect(new Set(heard.slice(0, 4))).toEqual(new Set(tunesOf('piano')));
    expect(heard[4]).toBe(heard[0]);
  });

  it("plays the hall's grand piano, and its music box their first dance", () => {
    const h = harness(undefined, { player: { zone: 'castleHall', tx: 6, ty: 9, facing: 'up' } });
    h.tick(1);
    const room = h.world.zones.inside('castleHall')!;
    const at = (id: FixtureId) => {
      const thing = room.things.find((t) => 'fixture' in t && t.fixture.id === id)!;
      return 'fixture' in thing ? thing.fixture : thing.piece;
    };
    const piano = walkTo(h, at('grandPiano').tx, at('grandPiano').ty);
    expect(tunesIn(piano)).toHaveLength(1);
    expect(tunesOf('piano')).toContain(tunesIn(piano)[0]);
    const box = walkTo(h, at('musicBox').tx, at('musicBox').ty);
    expect(tunesIn(box)).toEqual(['firstDance']);
    expect(box.find((e) => e.kind === 'arrived')).not.toHaveProperty('says');
    expect(INTERIORS.castleHall.fixtures.some((f) => f.id === 'grandPiano')).toBe(true);
  });
});
