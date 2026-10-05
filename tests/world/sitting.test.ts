import { describe, expect, it } from 'vitest';
import { FURNITURE } from '../../src/data/furniture';
import { INTERIORS } from '../../src/data/interiors';
import type { MapSource } from '../../src/data/maps';
import { PROP_SEATS } from '../../src/data/seats';
import { TILE_SIZE } from '../../src/config/world';
import { tileOf } from '../../src/world/World';
import { seatOn } from '../../src/world/services/Sitting';
import { harness, type Harness } from './harness';

/** A bench along the top of a little garden, two tiles long. */
const GARDEN: MapSource = {
  rows: ['######', '#.jj.#', '#....#', '#....#', '######'],
  spawn: { tx: 1, ty: 3 },
  legend: {
    '#': { tile: 'hedge', solid: true },
    '.': { tile: 'grass' },
    j: { tile: 'grass', prop: 'bench' },
  },
};

function walkTo(h: Harness, tx: number, ty: number): void {
  expect(h.world.tapTile(tx, ty), `a way to ${tx},${ty}`).toBe(true);
  h.until(() => !h.world.player.moving, `walking to ${tx},${ty}`);
  h.tick(2);
}

describe('sitting', () => {
  it('sits on the end of a long seat nearest her, its top at her hips', () => {
    const box = { tx: 2, ty: 1, w: 2, h: 1 };
    const row = { height: 14 };
    expect(seatOn(box, row, 'down', { tx: 1, ty: 2 })).toEqual({
      x: 2 * TILE_SIZE + TILE_SIZE / 2,
      y: 2 * TILE_SIZE - 14,
      floor: 2 * TILE_SIZE,
      facing: 'down',
    });
    expect(seatOn(box, row, 'down', { tx: 4, ty: 1 }).x).toBe(3 * TILE_SIZE + TILE_SIZE / 2);
    expect(seatOn(box, row, 'up', { tx: 3, ty: 2 }).facing).toBe('up');
  });

  it('sits her on a bench she walks up to, and the next tap only stands her up', () => {
    const h = harness(GARDEN);
    walkTo(h, 2, 1);
    const seat = h.world.sitting.seat;
    expect(seat).not.toBeNull();
    expect(h.world.poses.pose()).toBe('sit');
    expect(h.world.player.facing).toBe('down');
    // She stays sat whatever the clock does: nothing else happens.
    h.tick(2000);
    expect(h.world.sitting.seat).toEqual(seat);
    const here = tileOf(h.world.player.x, h.world.player.y);
    expect(h.world.tapTile(4, 3)).toBe(true);
    expect(h.world.sitting.seat).toBeNull();
    h.tick(30);
    expect(tileOf(h.world.player.x, h.world.player.y)).toEqual(here);
    expect(h.world.poses.pose()).not.toBe('sit');
    // And the tap after that walks her off.
    walkTo(h, 4, 3);
    expect(tileOf(h.world.player.x, h.world.player.y)).toEqual({ tx: 4, ty: 3 });
  });

  it('sits in her pumpkin armchair at home, and gets up to decorate', () => {
    const h = harness();
    const house = h.world.map.props.find((p) => p.id === 'homeHouse')!;
    h.world.tapTile(house.tx + 1, house.ty + 1);
    h.until(() => h.world.scene === 'home', 'going in');
    const chair = h.world.home.placed.find((p) => p.id === 'pumpkinChair')!;
    walkTo(h, chair.tx, chair.ty);
    expect(h.world.sitting.seat?.floor).toBe((chair.ty + 1) * TILE_SIZE);
    expect(h.world.poses.pose()).toBe('sit');
    // Saving her keeps the tile she walked to: nothing about sitting is saved.
    expect(h.world.save().player).toEqual({ ...h.world.snapshot() });
    expect(h.world.decorating.start()).toBe(true);
    expect(h.world.sitting.seat).toBeNull();
  });

  it('sits with her back to us in a chair turned to the wall', () => {
    const h = harness(undefined, {
      home: { rooms: { main: { placed: [{ id: 'pumpkinChair', tx: 4, ty: 6, turn: 2 }] } } },
    });
    const house = h.world.map.props.find((p) => p.id === 'homeHouse')!;
    h.world.tapTile(house.tx + 1, house.ty + 1);
    h.until(() => h.world.scene === 'home', 'going in');
    walkTo(h, 4, 6);
    expect(h.world.sitting.seat?.facing).toBe('up');
    expect(h.world.player.facing).toBe('up');
  });

  it("sits on a stool in a neighbour's house", () => {
    const h = harness();
    const crumbs = h.world.map.props.find((p) => p.id === INTERIORS.crumbs.building)!;
    walkTo(h, crumbs.tx, crumbs.ty);
    expect(h.world.scene).toBe('crumbs');
    const stool = INTERIORS.crumbs.furniture.find((p) => p.id === 'stumpStool')!;
    walkTo(h, stool.tx, stool.ty);
    expect(h.world.sitting.seat).not.toBeNull();
  });

  it('seats her only on what has a seat', () => {
    for (const [id, row] of Object.entries(FURNITURE)) {
      if (row.seat) expect(row.layer, id).toBe('floor');
    }
    expect(Object.keys(PROP_SEATS).sort()).toEqual(['bench', 'log', 'stump']);
    expect(FURNITURE.makeupChair.seat).toBeDefined();
    const h = harness();
    const house = h.world.map.props.find((p) => p.id === 'homeHouse')!;
    h.world.tapTile(house.tx + 1, house.ty + 1);
    h.until(() => h.world.scene === 'home', 'going in');
    const bed = h.world.home.placed.find((p) => p.id === 'batBed')!;
    walkTo(h, bed.tx, bed.ty);
    expect(h.world.sitting.seat).toBeNull();
  });
});
