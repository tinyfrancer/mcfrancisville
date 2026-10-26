import { describe, expect, it } from 'vitest';
import { TILE_SIZE } from '../../src/config/world';
import { VILLAGER_IDS } from '../../src/data/villagers';
import { dayKey, hourOf } from '../../src/systems/clock';
import { POSE_TILES, poseOf, stanceOf, stopNow } from '../../src/systems/neighbourLife';
import { stopAt } from '../../src/systems/schedules';
import { harness, type Harness } from './harness';

/** The middle of a tile, in world pixels: where she stands on it. */
const middle = (t: { tx: number; ty: number }) => ({
  x: t.tx * TILE_SIZE + TILE_SIZE / 2,
  y: t.ty * TILE_SIZE + TILE_SIZE / 2,
});

const farFrom = (t: { tx: number; ty: number }) => middle({ tx: t.tx > 20 ? 3 : 36, ty: 3 });

/** Someone at their stop in town just now, and the stop. */
function atStop(h: Harness) {
  const day = dayKey(h.clock.now());
  const hour = hourOf(h.clock.now());
  const n = h.world.neighbourhood.neighboursIn('town').find((o) => stopNow(o.id, hour, day))!;
  return { n, stop: stopAt(stopNow(n.id, hour, day)!) };
}

describe('everyone poses for her camera (1.5’s G5)', () => {
  it('turns a neighbour within three tiles to her, posing, and lets them carry on after', () => {
    const h = harness();
    const { n, stop } = atStop(h);
    const nh = h.world.neighbourhood;
    nh.step(16, farFrom(stop), null);
    const her = middle({ tx: stop.tx + POSE_TILES, ty: stop.ty });
    nh.step(16, her, null, true);
    expect(n.posing).toBe(true);
    expect(n.moving).toBe(false);
    expect(n.facing).toBe('right');
    const stance = stanceOf({ ...n, seated: n.seat !== null }, 1234);
    expect(stance?.act).toBe('pose');
    expect(stance?.feel).toMatch(/happy|laugh/);
    // The pose is held for the photo: the same at any moment, no blink, no breath.
    expect(stanceOf({ ...n, seated: n.seat !== null }, 99_999)).toEqual(stance);
    // The camera down, they're themselves again, and wave as she's close.
    nh.step(16, her, null, false);
    expect(n.posing).toBe(false);
    expect(stanceOf({ ...n, seated: n.seat !== null }, 1234)?.act).not.toBe('pose');
  });

  it('leaves anyone farther than three tiles to themselves', () => {
    const h = harness();
    const { n, stop } = atStop(h);
    h.world.neighbourhood.step(
      16,
      middle({ tx: stop.tx + POSE_TILES + 1, ty: stop.ty }),
      null,
      true,
    );
    expect(n.posing).toBe(false);
  });

  it('stops a neighbour walking by, where they are, to pose', () => {
    const h = harness();
    const nh = h.world.neighbourhood;
    // Walk the town on until someone is on their way somewhere.
    h.until(() => nh.neighboursIn('town').some((o) => o.moving), 'someone walking', 600_000);
    const n = nh.neighboursIn('town').find((o) => o.moving)!;
    const at = { x: n.x, y: n.y };
    nh.step(16, { x: n.x + TILE_SIZE * 2, y: n.y }, null, true);
    expect(n.moving).toBe(false);
    expect(n.posing).toBe(true);
    expect({ x: n.x, y: n.y }).toEqual(at);
  });

  it('is through `world.posing`, which the step hands on', () => {
    const h = harness();
    const { n, stop } = atStop(h);
    h.world.player.x = middle({ tx: stop.tx + 1, ty: stop.ty }).x;
    h.world.player.y = middle({ tx: stop.tx + 1, ty: stop.ty }).y;
    h.world.posing = true;
    h.tick(1);
    expect(n.posing).toBe(true);
    h.world.posing = false;
    h.tick(1);
    expect(n.posing).toBe(false);
  });

  it('gives each their own pose, a hand up and a smile, the same every time', () => {
    for (const id of VILLAGER_IDS) {
      const pose = poseOf(id, false);
      expect(pose.act).toBe('pose');
      expect([0, 1]).toContain(pose.frame);
      expect(['happy', 'laugh']).toContain(pose.feel);
      expect(poseOf(id, false)).toEqual(pose);
      expect(poseOf(id, true).sit).toBe(true);
    }
  });
});

describe('her pets sit for the photo', () => {
  it('stops a pet out walking with her, sits it facing her, and lets it follow again after', () => {
    const h = harness();
    const house = h.world.map.props.find((p) => p.id === 'homeHouse')!;
    h.world.tapTile(house.tx + 1, house.ty + 1);
    h.until(() => h.world.scene === 'home', 'going in');
    h.world.petCare.walkWith('dolly');
    const mat = h.world.home.rooms.room.mat;
    h.world.tapTile(mat.tx, mat.ty);
    h.until(() => h.world.scene === 'town', 'going out');
    const dolly = h.world.petCare.pet('dolly');
    // Off for a walk, Dolly trotting after her.
    h.world.tapTile(h.world.map.spawn.tx + 6, h.world.map.spawn.ty + 4);
    h.until(() => dolly.moving, 'Dolly trotting');
    h.world.posing = true;
    h.tick(1);
    expect(dolly.moving).toBe(false);
    expect(dolly.pose).toBe('sit');
    expect(dolly.facing).toBe(h.world.player.x > dolly.x ? 'right' : 'left');
    h.world.posing = false;
    h.until(() => !h.world.player.moving, 'her walk done');
    h.tick(200);
    const her = { tx: Math.floor(h.world.player.x / 32), ty: Math.floor(h.world.player.y / 32) };
    const reach = Math.max(Math.abs(dolly.tile.tx - her.tx), Math.abs(dolly.tile.ty - her.ty));
    expect(reach).toBeLessThanOrEqual(1);
  });
});
