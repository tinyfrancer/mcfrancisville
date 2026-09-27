import { describe, expect, it } from 'vitest';
import { TILE_SIZE } from '../../src/config/world';
import { fromSave, World, tileCentre, tileOf } from '../../src/world/World';
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
    const { world, until } = harness(OPEN);
    expect(world.tapTile(7, 1)).toBe(true);
    const events = until(() => !world.player.moving, 'arriving');
    expect(events).toEqual([{ kind: 'arrived', tx: 7, ty: 1 }]);
    expect(world.player).toMatchObject({ ...tileCentre({ tx: 7, ty: 1 }), moving: false });
    expect(world.target).toBeNull();
  });

  it('takes as long as the distance says, at four tiles a second', () => {
    const { world, tick } = harness(OPEN);
    world.tapTile(5, 1);
    tick(1, 999);
    expect(world.player.moving).toBe(true);
    tick(1, 1);
    expect(world.player.moving).toBe(false);
  });

  it('lands exactly on the target from one enormous frame, without passing through walls', () => {
    const { world, tick } = harness(OPEN);
    world.tapTile(4, 7);
    const events = tick(1, 10_000);
    expect(events).toEqual([{ kind: 'arrived', tx: 4, ty: 7 }]);
    expect(tileOf(world.player.x, world.player.y)).toEqual({ tx: 4, ty: 7 });
  });

  it('never stands on a solid tile at any point along the way, even at a low frame rate', () => {
    const { world, until } = harness(OPEN);
    world.tapTile(4, 7);
    until(() => {
      const here = tileOf(world.player.x, world.player.y);
      expect(world.canWalk(here.tx, here.ty)).toBe(true);
      return !world.player.moving;
    }, 'arriving');
  });

  it('tapping a tree walks to the nearest open tile beside it', () => {
    const { world, until } = harness(OPEN);
    world.tapTile(4, 3);
    until(() => !world.player.moving, 'arriving');
    const here = tileOf(world.player.x, world.player.y);
    expect(Math.max(Math.abs(here.tx - 4), Math.abs(here.ty - 3))).toBe(1);
    expect(here).toEqual({ tx: 3, ty: 2 });
  });

  it('ignores a tap on somewhere unreachable', () => {
    const { world } = harness(
      tinyMap(['#######', '#.#...#', '###...#', '#######'], { tx: 1, ty: 1 }),
    );
    expect(world.tapTile(4, 1)).toBe(false);
    expect(world.player.moving).toBe(false);
  });

  it('faces the way she walks', () => {
    const { world, tick } = harness(OPEN);
    world.tapTile(1, 4);
    tick(3);
    expect(world.player.facing).toBe('down');
    world.tapTile(7, tileOf(world.player.x, world.player.y).ty);
    tick(20);
    expect(world.player.facing).toBe('right');
  });

  it('a new tap mid-step goes back to the middle of her tile before turning', () => {
    const { world, tick, until } = harness(OPEN);
    world.tapTile(7, 1);
    tick(1, 100);
    const x = world.player.x;
    expect(x % TILE_SIZE).not.toBe(TILE_SIZE / 2);
    world.tapTile(1, 4);
    until(() => !world.player.moving, 'arriving');
    expect(tileOf(world.player.x, world.player.y)).toEqual({ tx: 1, ty: 4 });
  });
});

describe('walking up to things', () => {
  it('says which prop she walked up to when she arrives', () => {
    const { world, until } = harness(OPEN);
    world.tapTile(4, 3);
    const events = until(() => !world.player.moving, 'arriving');
    expect(events[0]).toMatchObject({ kind: 'arrived', at: 'tree' });
    // And, it being a tree, she gathers from it (tests/world/gathering.test.ts). Today, Fibi has
    // left a bone beside it too.
    expect(events.slice(1)).toEqual([
      expect.objectContaining({ kind: 'gathered', from: 'tree' }),
      expect.objectContaining({ kind: 'gathered', from: 'bone' }),
    ]);
  });

  it('says so on the next update when she is already beside it', () => {
    const { world, tick, until } = harness(OPEN);
    world.tapTile(4, 3);
    until(() => !world.player.moving, 'arriving');
    expect(world.tapTile(4, 3)).toBe(true);
    expect(tick(1)).toEqual([
      expect.objectContaining({ kind: 'arrived', at: 'tree' }),
      expect.objectContaining({ kind: 'resting', from: 'tree' }),
    ]);
    expect(tick(1)).toEqual([]);
  });

  it('forgets the prop once she is sent somewhere else', () => {
    const { world, until } = harness(OPEN);
    world.tapTile(4, 3);
    world.tapTile(7, 7);
    const events = until(() => !world.player.moving, 'arriving');
    expect(events).toEqual([{ kind: 'arrived', tx: 7, ty: 7 }]);
  });
});

describe('saving her place', () => {
  it('snapshots the tile she is on and restores her there', () => {
    const { world, until } = harness(OPEN);
    world.tapTile(6, 2);
    until(() => !world.player.moving, 'arriving');
    const saved = world.snapshot();
    expect(saved).toEqual({ tx: 6, ty: 2, facing: expect.any(String), zone: 'town' });
    const restored = new World({ map: OPEN, player: saved });
    expect(restored.player).toMatchObject({ ...tileCentre(saved), facing: saved.facing });
  });

  it('starts her at her door if the saved tile is no longer somewhere she can stand', () => {
    const restored = new World({ map: OPEN, player: { tx: 4, ty: 3, facing: 'up', zone: 'town' } });
    expect(tileOf(restored.player.x, restored.player.y)).toEqual({ tx: 1, ty: 1 });
  });

  it('saves every part of the world, and loads back to the same save', () => {
    const { world, clock, until } = harness(undefined, { candy: 500 });
    world.wallet.spend(120);
    world.workbench.learn('stoneHearth');
    world.petCare.rename('gary', 'Sir Gary');
    world.petCare.walkWith('dolly');
    world.bag.add('wood', 3);
    world.tapTile(world.map.spawn.tx + 3, world.map.spawn.ty + 2);
    until(() => !world.player.moving, 'walking');
    const saved = world.save();
    const again = new World({ clock, ...fromSave(saved) });
    expect(again.save()).toEqual(saved);
    expect(fromSave(null)).toEqual({});
  });
});
