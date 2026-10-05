import { describe, expect, it } from 'vitest';
import type { Placed } from '../../src/data/home';
import { Home } from '../../src/world/Home';
import type { World } from '../../src/world/World';
import { harness } from './harness';

const TABLE: Placed = { id: 'teaTable', tx: 5, ty: 6, turn: 0 };
const MUG: Placed = { id: 'skullMug', tx: 6, ty: 6, turn: 0, on: true };
const JAR: Placed = { id: 'bellJar', tx: 5, ty: 6, turn: 0, on: true, shows: 'lunaMoth' };

/** Walks her in through her front door, with a tea table out and things on it. */
function atHome(placed: Placed[] = [TABLE, MUG]) {
  const h = harness(undefined, {
    home: { rooms: { main: { placed: placed.map((p) => ({ ...p })) } } },
  });
  const house = h.world.map.props.find((p) => p.id === 'homeHouse')!;
  h.world.tapTile(house.tx + 1, house.ty + 1);
  h.until(() => h.world.scene === 'home', 'going in');
  return h;
}

const piece = (world: World, id: string) => world.home.placed.find((p) => p.id === id)!;

describe('things on tables (0.3’s H3)', () => {
  it('keeps a small piece on its surface through a save', () => {
    const home = new Home({ rooms: { main: { placed: [MUG, TABLE].map((p) => ({ ...p })) } } });
    expect(home.placed).toHaveLength(2);
    expect(home.surfaceUnder(home.placed.find((p) => p.id === 'skullMug')!)?.id).toBe('teaTable');
    const again = new Home(home.snapshot());
    expect(again.snapshot().rooms.main.placed).toEqual(home.snapshot().rooms.main.placed);
    expect(again.pieceAt(6, 6)?.id).toBe('skullMug');
    expect(again.pieceAt(5, 6)?.id).toBe('teaTable');
  });

  it('stands a small piece on the floor if its surface has gone, or in the chest if it can’t', () => {
    const floor = new Home({ rooms: { main: { placed: [{ ...MUG }] } } });
    expect(floor.placed).toEqual([{ id: 'skullMug', tx: 6, ty: 6, turn: 0 }]);
    const crowded = new Home({
      rooms: { main: { placed: [{ id: 'cauldron', tx: 6, ty: 6, turn: 0 }, { ...MUG }] } },
    });
    expect(crowded.placed.map((p) => p.id)).toEqual(['cauldron']);
    expect(crowded.stored).toEqual([{ id: 'skullMug', count: 1 }]);
  });

  it('puts a small piece on a table by a tap, and down on the floor by another', () => {
    const h = atHome([TABLE]);
    h.world.home.store('hourglass');
    expect(h.world.decorating.takeOut('hourglass')).toBe(true);
    const glass = piece(h.world, 'hourglass');
    expect(h.world.decorating.tap(5, 6)).toBe(true);
    expect(glass).toMatchObject({ tx: 5, ty: 6, on: true });
    expect(h.world.decorating.tap(6, 6)).toBe(true);
    expect(glass).toMatchObject({ tx: 6, ty: 6, on: true });
    expect(h.world.decorating.tap(9, 9)).toBe(true);
    expect(glass).toEqual({ id: 'hourglass', tx: 9, ty: 9, turn: 0 });
  });

  it('won’t put a big piece on a table, or two things on one tile', () => {
    const h = atHome();
    h.world.decorating.start();
    h.world.home.store('cauldron');
    h.world.decorating.takeOut('cauldron');
    // A tap on the table picks it up instead.
    h.world.decorating.tap(5, 6);
    expect(h.world.decorating.state?.selected?.id).toBe('teaTable');
    h.world.home.store('hourglass');
    h.world.decorating.takeOut('hourglass');
    // A tap on the mug picks the mug up rather than stacking on it.
    h.world.decorating.tap(6, 6);
    expect(h.world.decorating.state?.selected?.id).toBe('skullMug');
  });

  it('carries what stands on a table when the table moves', () => {
    const h = atHome();
    h.world.decorating.start();
    h.world.decorating.tap(5, 6);
    expect(h.world.decorating.state?.selected?.id).toBe('teaTable');
    expect(h.world.decorating.tap(3, 9)).toBe(true);
    expect(piece(h.world, 'teaTable')).toMatchObject({ tx: 3, ty: 9 });
    expect(piece(h.world, 'skullMug')).toMatchObject({ tx: 4, ty: 9, on: true });
  });

  it('picks up the mug, then the table under it, then puts the table down', () => {
    const h = atHome();
    h.world.decorating.start();
    h.world.decorating.tap(6, 6);
    expect(h.world.decorating.state?.selected?.id).toBe('skullMug');
    h.world.decorating.tap(6, 6);
    expect(h.world.decorating.state?.selected?.id).toBe('teaTable');
    h.world.decorating.tap(6, 6);
    expect(h.world.decorating.state?.selected).toBeNull();
  });

  it('puts what stands on a table away with it, and what was on show back in her bag', () => {
    const h = atHome([TABLE, MUG, JAR]);
    expect(piece(h.world, 'bellJar').shows).toBe('lunaMoth');
    const moths = h.world.bag.count('lunaMoth');
    h.world.decorating.start(piece(h.world, 'teaTable'));
    expect(h.world.decorating.putAwaySelected()).toBe(true);
    expect(
      h.world.home.placed.some((p) => ['teaTable', 'skullMug', 'bellJar'].includes(p.id)),
    ).toBe(false);
    for (const id of ['teaTable', 'skullMug', 'bellJar']) {
      expect(
        h.world.home.stored.some((s) => s.id === id),
        id,
      ).toBe(true);
    }
    expect(h.world.bag.count('lunaMoth')).toBe(moths + 1);
  });

  it('walks her up beside the table to a thing on it, and arrives at the thing', () => {
    const h = atHome();
    h.world.tapTile(6, 6);
    const events = h.until(() => !h.world.player.moving, 'walking up to it');
    expect(events).toContainEqual(expect.objectContaining({ kind: 'arrived', piece: 'skullMug' }));
  });
});
