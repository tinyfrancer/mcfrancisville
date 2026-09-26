import { describe, expect, it } from 'vitest';
import { TILE_SIZE } from '../../src/config/world';
import { tileCentre, tileOf } from '../../src/world/Town';
import { harness, tinyMap } from './harness';

const OPEN = tinyMap([
  '##########',
  '#........#',
  '#........#',
  '#...T....#',
  '#........#',
  '#...##...#',
  '#...##...#',
  '#........#',
  '##########',
]);

describe('walking', () => {
  it('walks to a tapped tile, stops there and says so', () => {
    const { town, until } = harness(OPEN);
    expect(town.tapTile(7, 1)).toBe(true);
    const events = until(() => !town.player.moving, 'arriving');
    expect(events).toEqual([{ kind: 'arrived', tx: 7, ty: 1 }]);
    expect(town.player).toMatchObject({ ...tileCentre({ tx: 7, ty: 1 }), moving: false });
    expect(town.target).toBeNull();
  });

  it('takes as long as the distance says, at four tiles a second', () => {
    const { town, tick } = harness(OPEN);
    town.tapTile(5, 1);
    tick(1, 999);
    expect(town.player.moving).toBe(true);
    tick(1, 1);
    expect(town.player.moving).toBe(false);
  });

  it('lands exactly on the target from one enormous frame, without passing through walls', () => {
    const { town, tick } = harness(OPEN);
    town.tapTile(4, 7);
    const events = tick(1, 10_000);
    expect(events).toEqual([{ kind: 'arrived', tx: 4, ty: 7 }]);
    expect(tileOf(town.player.x, town.player.y)).toEqual({ tx: 4, ty: 7 });
  });

  it('never stands on a solid tile at any point along the way, even at a low frame rate', () => {
    const { town, until } = harness(OPEN);
    town.tapTile(4, 7);
    until(() => {
      const here = tileOf(town.player.x, town.player.y);
      expect(town.canWalk(here.tx, here.ty)).toBe(true);
      return !town.player.moving;
    }, 'arriving');
  });

  it('tapping a tree walks to the nearest open tile beside it', () => {
    const { town, until } = harness(OPEN);
    town.tapTile(4, 3);
    until(() => !town.player.moving, 'arriving');
    const here = tileOf(town.player.x, town.player.y);
    expect(Math.max(Math.abs(here.tx - 4), Math.abs(here.ty - 3))).toBe(1);
    expect(here).toEqual({ tx: 3, ty: 2 });
  });

  it('ignores a tap on somewhere unreachable', () => {
    const { town } = harness(
      tinyMap(['#######', '#.#...#', '###...#', '#######'], { tx: 1, ty: 1 }),
    );
    expect(town.tapTile(4, 1)).toBe(false);
    expect(town.player.moving).toBe(false);
  });

  it('faces the way she walks', () => {
    const { town, tick } = harness(OPEN);
    town.tapTile(1, 4);
    tick(3);
    expect(town.player.facing).toBe('down');
    town.tapTile(7, tileOf(town.player.x, town.player.y).ty);
    tick(20);
    expect(town.player.facing).toBe('right');
  });

  it('a new tap mid-step goes back to the middle of her tile before turning', () => {
    const { town, tick, until } = harness(OPEN);
    town.tapTile(7, 1);
    tick(1, 100);
    const x = town.player.x;
    expect(x % TILE_SIZE).not.toBe(TILE_SIZE / 2);
    town.tapTile(1, 4);
    until(() => !town.player.moving, 'arriving');
    expect(tileOf(town.player.x, town.player.y)).toEqual({ tx: 1, ty: 4 });
  });
});
