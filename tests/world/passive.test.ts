import { describe, expect, it } from 'vitest';
import {
  CANDY_PER_WINDOW,
  SAPLING_DAYS,
  SHELF_HOLDS,
  STALL_HOLDS,
  STALL_SELLS_PER_WINDOW,
  TREE_FIRST_FILL,
  TREE_HOLDS,
} from '../../src/data/passive';
import { TOWN } from '../../src/data/maps';
import { ITEM_VALUE } from '../../src/data/shop';
import { parseMap } from '../../src/systems/grid';
import {
  dropsSapling,
  emptyStall,
  settleStall,
  stallSells,
  stallTakes,
  stockStall,
} from '../../src/systems/passive';
import { harness, type Harness } from './harness';

const HOUR = 3_600_000;
const map = parseMap(TOWN);
const prop = (id: string) => map.props.find((p) => p.id === id)!;

function walkUp(h: Harness, id: string) {
  const { tx, ty } = prop(id);
  h.world.tapTile(tx, ty);
  return h.until(() => !h.world.player.moving, `walking to the ${id}`).concat(h.tick(1));
}

describe('the candy tree', () => {
  it('has a little waiting the first time, and shakes it all down into her Candy', () => {
    const h = harness(TOWN);
    const before = h.world.wallet.candy;
    const events = walkUp(h, 'candyTree');
    const candy = TREE_FIRST_FILL * CANDY_PER_WINDOW;
    expect(events).toContainEqual({ kind: 'shook', candy });
    expect(h.world.wallet.candy).toBe(before + candy);
    expect(h.world.candyTree.look()).toBe('bare');
  });

  it('grows a little each window, and says when there will be more', () => {
    const h = harness(TOWN);
    walkUp(h, 'candyTree');
    h.world.tapTile(4, 12);
    h.until(() => !h.world.player.moving, 'walking away');
    expect(walkUp(h, 'candyTree')).toContainEqual({ kind: 'shook', candy: 0, back: 'evening' });
    h.clock.advance(7 * HOUR);
    expect(h.world.candyTree.windows()).toBe(1);
    h.clock.advance(24 * HOUR);
    expect(h.world.candyTree.windows()).toBe(4);
    expect(h.world.candyTree.look()).toBe('few');
  });

  it('holds a week of windows at most, and waits however long she is away', () => {
    const h = harness(TOWN, { candyTree: { shaken: new Date(2026, 5, 1, 9).getTime() } });
    expect(h.world.candyTree.windows()).toBe(TREE_HOLDS);
    expect(h.world.candyTree.look()).toBe('laden');
  });

  it('is saved as when she last shook it', () => {
    const h = harness(TOWN);
    walkUp(h, 'candyTree');
    expect(h.world.save().candyTree).toEqual({ shaken: h.clock.now(), saplings: [] });
  });
});

/** Moves the clock on a window at a time until the candy tree would drop a sapling. */
function untilASapling(h: Harness) {
  while (!dropsSapling(h.clock.now())) h.clock.advance(6 * HOUR);
}

describe("the candy tree's saplings (0.2's E1)", () => {
  const plots = map.props.filter((p) => p.id === 'saplingPlot');

  it('has two rings of earth for them, so three trees at most', () => {
    expect(plots).toHaveLength(2);
  });

  it('drops one now and then as she shakes it, about one window in five', () => {
    const start = new Date(2026, 9, 1, 5).getTime();
    let drops = 0;
    for (let w = 0; w < 300; w++) if (dropsSapling(start + w * 6 * HOUR)) drops++;
    expect(drops).toBeGreaterThan(40);
    expect(drops).toBeLessThan(80);
  });

  it('is planted in a ring, grows for a few days, and then fills and shakes like the first', () => {
    const h = harness(TOWN);
    untilASapling(h);
    const shook = walkUp(h, 'candyTree').find((e) => e.kind === 'shook');
    expect(shook).toMatchObject({ sapling: true });
    expect(h.world.bag.count('candySapling')).toBe(1);
    const ring = plots[0]!;
    expect(h.world.candyTree.stage(ring)).toBe('plot');
    expect(walkUp(h, 'saplingPlot')).toContainEqual({
      kind: 'sapling',
      did: 'planted',
      days: SAPLING_DAYS,
    });
    expect(h.world.bag.count('candySapling')).toBe(0);
    expect(h.world.candyTree.stage(ring)).toBe('sapling');
    h.clock.advance(24 * HOUR);
    expect(walkUp(h, 'saplingPlot')).toContainEqual({
      kind: 'sapling',
      did: 'growing',
      days: SAPLING_DAYS - 1,
    });
    h.clock.advance((SAPLING_DAYS - 1) * 24 * HOUR);
    expect(h.world.candyTree.stage(ring)).toBe('few');
    const before = h.world.wallet.candy;
    const candy = TREE_FIRST_FILL * CANDY_PER_WINDOW;
    expect(walkUp(h, 'saplingPlot')).toContainEqual({ kind: 'shook', candy });
    expect(h.world.wallet.candy).toBe(before + candy);
    expect(h.world.candyTree.stage(ring)).toBe('bare');
    const saved = h.world.save().candyTree;
    expect(saved.saplings).toEqual([
      { tx: ring.tx, ty: ring.ty, planted: expect.any(Number), shaken: h.clock.now() },
    ]);
    expect(harness(TOWN, { candyTree: saved }).world.save().candyTree).toEqual(saved);
  });

  it('says a ring waits for a sapling while she has none', () => {
    const h = harness(TOWN);
    expect(walkUp(h, 'saplingPlot')).toContainEqual({ kind: 'sapling', did: 'waiting' });
  });

  it('drops no more once she has three trees, planted, growing or in her bag', () => {
    const h = harness(TOWN, {
      candyTree: {
        shaken: null,
        saplings: [{ tx: plots[0]!.tx, ty: plots[0]!.ty, planted: 0, shaken: null }],
      },
    });
    h.world.bag.add('candySapling', 1);
    untilASapling(h);
    const shook = walkUp(h, 'candyTree').find((e) => e.kind === 'shook');
    expect(shook).not.toHaveProperty('sapling');
    expect(h.world.bag.count('candySapling')).toBe(1);
  });

  it('leaves out a saved sapling of the wrong shape', () => {
    const h = harness(TOWN, {
      candyTree: { shaken: null, saplings: [{ tx: 1 } as never, null as never] },
    });
    expect(h.world.save().candyTree.saplings).toEqual([]);
  });
});

describe('the honesty stall', () => {
  it('takes only what she grows and makes, as much as fits', () => {
    expect(stallTakes('pumpkin')).toBe(true);
    expect(stallTakes('blueRose')).toBe(true);
    expect(stallTakes('pumpkinSoup')).toBe(true);
    expect(stallTakes('loveBracelet')).toBe(true);
    expect(stallTakes('moonpetal')).toBe(false);
    expect(stallTakes('pumpkinSeed')).toBe(false);
    expect(stallTakes('heartBead')).toBe(false);
    const full = stockStall(emptyStall(0), 'rose', 100);
    expect(full.stock).toEqual([{ id: 'rose', count: STALL_HOLDS }]);
    expect(stockStall(full, 'pumpkin', 1)).toBe(full);
  });

  it('sells a few a window, what she left first first, for the shop price', () => {
    const now = new Date(2026, 8, 26, 12).getTime();
    let stall = stockStall(emptyStall(now), 'pumpkin', 3);
    stall = stockStall(stall, 'rose', 5);
    expect(settleStall(stall, now + HOUR)).toMatchObject({ sold: [], tin: 0 });
    const later = settleStall(stall, now + 7 * HOUR);
    expect(later.stock).toEqual([{ id: 'rose', count: 8 - STALL_SELLS_PER_WINDOW }]);
    expect(later.sold).toEqual([
      { id: 'pumpkin', count: 3 },
      { id: 'rose', count: STALL_SELLS_PER_WINDOW - 3 },
    ]);
    expect(later.tin).toBe(3 * ITEM_VALUE.pumpkin + (STALL_SELLS_PER_WINDOW - 3) * ITEM_VALUE.rose);
    const days = settleStall(later, now + 72 * HOUR);
    expect(days.stock).toEqual([]);
    expect(days.tin).toBe(3 * ITEM_VALUE.pumpkin + 5 * ITEM_VALUE.rose);
    // Worked out again later, nothing sells twice.
    expect(settleStall(days, now + 200 * HOUR)).toEqual({ ...days, since: now + 200 * HOUR });
  });

  it('is stocked from her bag, sells while she is away, and pays her when she comes by', () => {
    const h = harness(TOWN);
    h.world.bag.add('pumpkin', 6);
    expect(h.world.stall.leave('pumpkin', 6)).toBe(6);
    expect(h.world.bag.count('pumpkin')).toBe(0);
    expect(walkUp(h, 'honestyStall').some((e) => e.kind === 'stallSold')).toBe(false);
    h.clock.advance(7 * HOUR);
    const before = h.world.wallet.candy;
    const events = walkUp(h, 'honestyStall');
    const candy = STALL_SELLS_PER_WINDOW * ITEM_VALUE.pumpkin;
    expect(events).toContainEqual({
      kind: 'stallSold',
      sold: [{ id: 'pumpkin', count: STALL_SELLS_PER_WINDOW }],
      candy,
    });
    expect(h.world.wallet.candy).toBe(before + candy);
    expect(h.world.stall.view()).toMatchObject({ sold: [], tin: 0 });
  });

  it('gives back what she takes off it', () => {
    const h = harness(TOWN);
    h.world.bag.add('rose', 4);
    h.world.stall.leave('rose', 4);
    expect(h.world.stall.takeBack('rose')).toBe(4);
    expect(h.world.bag.count('rose')).toBe(4);
    expect(h.world.stall.view().stock).toEqual([]);
  });

  it("is saved, and a save's unknown or unsellable things are left out", () => {
    const h = harness(TOWN);
    h.world.bag.add('rose', 2);
    h.world.stall.leave('rose', 2);
    const saved = h.world.save().stall;
    expect(saved.stock).toEqual([{ id: 'rose', count: 2 }]);
    const again = harness(TOWN, {
      stall: {
        ...saved,
        stock: [...saved.stock, { id: 'sock' as never, count: 1 }, { id: 'wood', count: 3 }],
      },
    });
    expect(again.world.stall.view().stock).toEqual([{ id: 'rose', count: 2 }]);
  });

  it('has a second shelf built on at the workbench, which holds and sells more', () => {
    const h = harness(TOWN);
    expect(h.world.workbench.cantMake('stallShelf')).toBe('short');
    h.world.bag.add('wood', 20);
    h.world.bag.add('stone', 8);
    expect(h.world.workbench.craft('stallShelf')).toMatchObject({ made: { shelf: 1 } });
    expect(h.world.workbench.cantMake('stallShelf')).toBe('built');
    expect(h.world.stall.shelves).toBe(1);
    h.world.bag.add('rose', 100);
    expect(h.world.stall.leave('rose', 100)).toBe(STALL_HOLDS + SHELF_HOLDS);
    h.clock.advance(7 * HOUR);
    expect(h.world.stall.view().sold).toEqual([{ id: 'rose', count: stallSells(1) }]);
    expect(stallSells(1)).toBeGreaterThan(STALL_SELLS_PER_WINDOW);
    const saved = h.world.save().stall;
    expect(saved.shelves).toBe(1);
    expect(harness(TOWN, { stall: saved }).world.stall.shelves).toBe(1);
  });
});
