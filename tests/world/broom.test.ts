import { describe, expect, it } from 'vitest';
import { BROOM_CALLS } from '../../src/data/broom';
import { BROOM_LETTER_ID } from '../../src/world/services/Broom';
import { fromSave, type WorldEvent } from '../../src/world/World';
import { harness, type Harness } from './harness';

const flights = (events: WorldEvent[]) =>
  events.filter((e): e is Extract<WorldEvent, { kind: 'flew' }> => e.kind === 'flew');

/** Brings the broom the way she'd get it: her first day in town, and Agatha's letter opened. */
function withBroom(h: Harness): void {
  h.world.visits.welcome(null);
  h.tick(1);
  expect(h.world.mailbox.open(BROOM_LETTER_ID)).toBe(true);
}

describe('her broom comes by Agatha', () => {
  it('on her first day in town, once she is past the title (decision 211)', () => {
    const h = harness();
    h.tick(1);
    expect(h.world.mailbox.letters.has(BROOM_LETTER_ID)).toBe(false);
    h.world.visits.welcome(null);
    const events = h.tick(1);
    expect(h.world.mailbox.letters.has(BROOM_LETTER_ID)).toBe(true);
    expect(events).toContainEqual({ kind: 'mail', from: 'agatha' });
  });

  it('on the first day of 0.2 for a town she has come to before', () => {
    const h = harness(undefined, { visits: { count: 12, last: '2026-09-20' } });
    h.world.visits.welcome(Date.now() - 86_400_000);
    h.tick(1);
    expect(h.world.mailbox.letters.has(BROOM_LETTER_ID)).toBe(true);
  });

  it('brings the broom, and sets its stand out by her mat', () => {
    const h = harness();
    expect(h.world.broom.has).toBe(false);
    withBroom(h);
    expect(h.world.broom.has).toBe(true);
    const stand = h.world.home.placed.find((p) => p.id === 'broomStand');
    const mat = h.world.home.room.mat;
    expect(stand).toBeDefined();
    expect(Math.abs(stand!.tx - mat.tx) + Math.abs(stand!.ty - mat.ty)).toBeLessThanOrEqual(4);
  });
});

describe('flying home, and back', () => {
  it('swoops her from anywhere outside onto her mat, and back to the very tile she left', () => {
    const h = harness();
    withBroom(h);
    const { tx, ty } = { tx: 19, ty: 30 };
    h.world.tapTile(tx, ty);
    h.until(() => !h.world.player.moving, 'walking down the town');
    const from = h.world.snapshot();

    expect(h.world.broom.flyHome()).toBe(true);
    const home = h.tick(1);
    expect(h.world.scene).toBe('home');
    expect(h.world.movement.tile).toEqual(h.world.home.room.mat);
    const [flew] = flights(home);
    expect(flew).toMatchObject({ to: 'home' });
    expect(BROOM_CALLS.map((c) => c.line)).toContain(flew!.call);
    expect(home).toContainEqual({ kind: 'entered', scene: 'home' });
    expect(h.world.broom.backTo).toBe('town');

    expect(h.world.broom.flyBack()).toBe(true);
    const back = h.tick(1);
    expect(flights(back)).toHaveLength(1);
    expect(h.world.snapshot()).toEqual(from);
    expect(h.world.broom.backTo).toBeNull();
    expect(h.world.broom.flyBack()).toBe(false);
  });

  it("isn't hers to ride before Agatha's letter, nor from home", () => {
    const h = harness();
    expect(h.world.broom.flyHome()).toBe(false);
    withBroom(h);
    expect(h.world.broom.flyHome()).toBe(true);
    h.tick(1);
    expect(h.world.broom.flyHome()).toBe(false);
  });

  it('keeps the spot she left through a save', () => {
    const h = harness();
    withBroom(h);
    h.world.broom.flyHome();
    h.tick(1);
    const saved = h.world.save();
    const again = harness(undefined, fromSave(saved));
    expect(again.world.travel.left).toEqual(saved.left);
    expect(again.world.broom.flyBack()).toBe(true);
    again.tick(1);
    expect(again.world.scene).toBe('town');
  });

  it("the world map's travel flies too", () => {
    const h = harness();
    h.world.atlas.find('whisperwood');
    expect(h.world.travel.go('whisperwood')).toBe(true);
    expect(flights(h.tick(1))).toEqual([{ kind: 'flew', to: 'whisperwood' }]);
  });
});

describe('its colours', () => {
  it('are hers to choose, from the ones it comes in, and are saved', () => {
    const h = harness();
    expect(h.world.broom.dress({ ribbon: 'teal' })).toBe(true);
    expect(h.world.broom.dress({ bristles: 'moss' })).toBe(true);
    expect(h.world.broom.dress({ ribbon: 'plaid' as never })).toBe(false);
    expect(h.world.broom.look).toEqual({ ribbon: 'teal', bristles: 'moss' });
    const again = harness(undefined, fromSave(h.world.save()));
    expect(again.world.broom.look).toEqual({ ribbon: 'teal', bristles: 'moss' });
  });
});
