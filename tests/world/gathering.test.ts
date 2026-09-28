import { describe, expect, it } from 'vitest';
import { ITEMS } from '../../src/data/items';
import { snackTonight } from '../../src/systems/gathering';
import { World } from '../../src/world/World';
import { harness } from './harness';
import type { MapSource } from '../../src/data/maps';

/** A tree, a rock, a patch of forget-me-boos, and one place for the night's snack. */
const GROVE: MapSource = {
  rows: ['#########', '#.......#', '#.T...R.#', '#.......#', '#...;...#', '#.......#', '#########'],
  spawn: { tx: 1, ty: 1 },
  snackSpots: [{ tx: 7, ty: 5 }],
  legend: {
    '#': { tile: 'hedge', solid: true },
    '.': { tile: 'grass' },
    ';': { tile: 'grass', patch: 'forgetMeBoos' },
    T: { tile: 'grass', prop: 'tree' },
    R: { tile: 'grass', prop: 'rock' },
  },
};

const NOON = new Date(2026, 8, 26, 12);
const TEN_PM = new Date(2026, 8, 26, 22);
const NEXT_MORNING = new Date(2026, 8, 27, 5, 1);

function walkTo(h: ReturnType<typeof harness>, tx: number, ty: number) {
  h.world.tapTile(tx, ty);
  return h.until(() => !h.world.player.moving, `walking to ${tx},${ty}`).concat(h.tick(1));
}

describe('gathering', () => {
  it('starts her bag with a few purse butters, and seeds for her garden', () => {
    const { world } = harness(GROVE);
    expect(world.bag.contents[0]).toEqual({ id: 'purseButter', count: 5 });
    expect(world.bag.count('pumpkinSeed')).toBeGreaterThan(0);
  });

  it('shakes wood from a tree once a window', () => {
    const h = harness(GROVE);
    expect(walkTo(h, 2, 2)).toContainEqual({
      kind: 'gathered',
      from: 'tree',
      item: 'wood',
      count: 3,
    });
    expect(h.world.bag.count('wood')).toBe(3);

    walkTo(h, 5, 5);
    expect(walkTo(h, 2, 2)).toContainEqual({
      kind: 'resting',
      from: 'tree',
      item: 'wood',
      back: 'evening',
    });
    expect(h.world.bag.count('wood')).toBe(3);
  });

  it('has more for her the next window, however long she was away', () => {
    const h = harness(GROVE);
    walkTo(h, 6, 2);
    expect(h.world.bag.count('stone')).toBe(2);
    h.clock.set(new Date(2026, 8, 26, 17, 59));
    walkTo(h, 5, 5);
    expect(walkTo(h, 6, 2)).toContainEqual(expect.objectContaining({ kind: 'resting' }));
    h.clock.set(new Date(2026, 8, 26, 18));
    walkTo(h, 5, 5);
    walkTo(h, 6, 2);
    expect(h.world.bag.count('stone')).toBe(4);
    // The evening runs on past midnight until the day turns over.
    h.clock.set(new Date(2026, 8, 27, 4, 59));
    walkTo(h, 5, 5);
    expect(walkTo(h, 6, 2)).toContainEqual(
      expect.objectContaining({ kind: 'resting', back: 'morning' }),
    );
    h.clock.set(new Date(2026, 9, 30, 9));
    walkTo(h, 5, 5);
    walkTo(h, 6, 2);
    expect(h.world.bag.count('stone')).toBe(6);
  });

  it('picks flowers she walks onto, and only when she stops there', () => {
    const h = harness(GROVE);
    walkTo(h, 4, 5);
    walkTo(h, 4, 3);
    expect(h.world.bag.count('forgetMeBoo')).toBe(0);
    expect(walkTo(h, 4, 4)).toContainEqual({
      kind: 'gathered',
      from: 'flowers',
      item: 'forgetMeBoo',
      count: 2,
    });
    expect(h.world.takings.isReady('patch:4,4')).toBe(false);
  });

  it('picks flowers she is already standing in when she taps them', () => {
    const h = harness(GROVE);
    walkTo(h, 4, 4);
    h.clock.set(NEXT_MORNING);
    expect(walkTo(h, 4, 4)).toContainEqual(expect.objectContaining({ kind: 'gathered' }));
    expect(h.world.bag.count('forgetMeBoo')).toBe(4);
  });

  it('tells the bag it has changed', () => {
    const h = harness(GROVE);
    const seen: number[] = [];
    const start = h.world.bag.contents.length;
    h.world.events.on('bag', (bag) => seen.push(bag.length));
    walkTo(h, 2, 2);
    walkTo(h, 6, 2);
    expect(seen).toHaveLength(2);
    expect(seen[0]).toBe(start + 1);
    expect(seen[1]).toBeGreaterThan(start + 1);
  });

  it('turns up a bead in a rock on some days and not others, the same all day', () => {
    const h = harness(GROVE);
    let beads = 0;
    for (let day = 0; day < 40; day++) {
      h.clock.set(new Date(2026, 9, 1 + day, 9));
      walkTo(h, 5, 5);
      const events = walkTo(h, 6, 2);
      const found = events.find((e) => e.kind === 'gathered');
      if (found?.kind === 'gathered' && found.bead) {
        expect(found.item).toBe('stone');
        expect(ITEMS[found.bead].kind).toBe('bead');
        expect(h.world.bag.count(found.bead)).toBeGreaterThan(0);
        beads++;
      }
    }
    expect(beads).toBeGreaterThan(10);
    expect(beads).toBeLessThan(30);
  });
});

describe('the late-night snack', () => {
  it('is out only after dark', () => {
    const h = harness(GROVE);
    h.clock.set(NOON);
    expect(h.world.gathering.snack()).toBeNull();
    h.clock.set(TEN_PM);
    expect(h.world.gathering.snack()).toMatchObject({ tx: 7, ty: 5 });
  });

  it('is found by walking to it, once a night', () => {
    const h = harness(GROVE);
    h.clock.set(TEN_PM);
    const snack = h.world.gathering.snack()!;
    expect(walkTo(h, 7, 5)).toContainEqual({
      kind: 'gathered',
      from: 'snack',
      item: snack.item,
      count: 1,
    });
    expect(h.world.bag.count(snack.item)).toBe(1);
    expect(h.world.gathering.snack()).toBeNull();
    // Still gone at 2am: it's the same night until 5.
    h.clock.set(new Date(2026, 8, 27, 2));
    expect(h.world.gathering.snack()).toBeNull();
    h.clock.set(new Date(2026, 8, 27, 21));
    expect(h.world.gathering.snack()).not.toBeNull();
  });

  it('is the same all night, and not always the same snack', () => {
    const spots = [
      { tx: 1, ty: 1 },
      { tx: 2, ty: 2 },
      { tx: 3, ty: 3 },
    ];
    const at = (d: Date) => snackTonight(spots, {}, d.getTime());
    expect(at(new Date(2026, 8, 26, 21))).toEqual(at(new Date(2026, 8, 27, 3)));
    const items = new Set<string>();
    for (let day = 1; day <= 20; day++) items.add(at(new Date(2026, 9, day, 23))!.item);
    expect(items.size).toBeGreaterThan(1);
  });
});

describe('saving her finds', () => {
  it('keeps the bag, and what was taken today, through a save', () => {
    const h = harness(GROVE);
    walkTo(h, 2, 2);
    const finds = h.world.save();
    expect(finds.taken).toEqual({ 'prop:2,2': '2026-09-26@afternoon' });
    const restored = new World({ map: GROVE, finds, clock: h.clock });
    expect(restored.bag.count('wood')).toBe(3);
    expect(restored.takings.isReady('prop:2,2')).toBe(false);
  });

  it('keeps the bone and the snack once a day, and reads a save from before the windows', () => {
    const h = harness(GROVE);
    const world = new World({
      map: GROVE,
      clock: h.clock,
      finds: { taken: { 'prop:2,2': '2026-09-26', bone: '2026-09-26@morning' } },
    });
    // A bare day key was never this window, so the tree has something for her.
    expect(world.takings.isReady('prop:2,2')).toBe(true);
    expect(world.takings.isReady('bone')).toBe(false);
    expect(world.takings.backIn('bone')).toBe('morning');
    expect(world.save().taken).toEqual({ 'prop:2,2': '2026-09-26', bone: '2026-09-26@morning' });
  });

  it("drops yesterday's takings rather than saving them forever", () => {
    const h = harness(GROVE);
    walkTo(h, 2, 2);
    h.clock.set(NEXT_MORNING);
    expect(h.world.save().taken).toEqual({});
  });

  it('leaves out an item this build does not know, and keeps the rest', () => {
    const world = new World({
      map: GROVE,
      finds: {
        bag: [{ id: 'wood', count: 2 }, { id: 'retiredSock', count: 1 } as never],
      },
    });
    expect(world.bag.contents).toEqual([{ id: 'wood', count: 2 }]);
  });
});
