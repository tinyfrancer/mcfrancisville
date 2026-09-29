import { describe, expect, it } from 'vitest';
import {
  CANDY_PER_WINDOW,
  STALL_HOLDS,
  STALL_SELLS_PER_WINDOW,
  TREE_FIRST_FILL,
  TREE_HOLDS,
} from '../../src/data/passive';
import { TOWN } from '../../src/data/maps';
import { ITEM_VALUE } from '../../src/data/shop';
import { parseMap } from '../../src/systems/grid';
import { emptyStall, settleStall, stallTakes, stockStall } from '../../src/systems/passive';
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
    expect(h.world.save().candyTree).toEqual({ shaken: h.clock.now() });
  });
});

describe('the honesty stall', () => {
  it('takes only what she grows, as much as fits', () => {
    expect(stallTakes('pumpkin')).toBe(true);
    expect(stallTakes('blueRose')).toBe(true);
    expect(stallTakes('moonpetal')).toBe(false);
    expect(stallTakes('pumpkinSeed')).toBe(false);
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
});
