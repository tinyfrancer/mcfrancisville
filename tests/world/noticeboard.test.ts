import { describe, expect, it } from 'vitest';
import { NOTICES, NOTICES_UP } from '../../src/data/notices';
import { TOWN } from '../../src/data/maps';
import { eventToast } from '../../src/hud/messages';
import { noticeCandy, noticesIn } from '../../src/systems/notices';
import { ITEM_VALUE } from '../../src/data/shop';
import { harness, type Harness } from './harness';

const WINDOWS = ['morning', 'afternoon', 'evening'] as const;

function walkTo(h: Harness, tx: number, ty: number) {
  h.world.tapTile(tx, ty);
  return h.until(() => !h.world.player.moving, `walking to ${tx},${ty}`).concat(h.tick(1));
}

describe('the notes on the board', () => {
  it('are three, each from a different neighbour, the same all window and new the next', () => {
    for (let d = 1; d <= 30; d++) {
      for (const w of WINDOWS) {
        const key = `2026-10-${String(d).padStart(2, '0')}@${w}`;
        const up = noticesIn(key, w);
        expect(up, key).toHaveLength(NOTICES_UP);
        expect(new Set(up.map((n) => n.row.from)).size).toBe(NOTICES_UP);
        for (const { row } of up) if (row.windows) expect(row.windows).toContain(w);
        expect(noticesIn(key, w)).toEqual(up);
      }
    }
    const seen = new Set(
      Array.from({ length: 30 }, (_, d) =>
        WINDOWS.flatMap((w) => noticesIn(`2026-11-${d + 1}@${w}`, w).map((n) => n.row.note)),
      ).flat(),
    );
    expect(seen.size).toBe(NOTICES.filter((n) => !n.during).length);
  });

  it("put one of the festival's notes up first every window of October, and none after", () => {
    const festive = new Set<string>();
    for (let d = 1; d <= 31; d++) {
      for (const w of WINDOWS) {
        const key = `2026-10-${String(d).padStart(2, '0')}@${w}`;
        const up = noticesIn(key, w);
        expect(up[0]!.row.during, key).toBe('halloweenFestival');
        expect(up.filter((n) => n.row.during)).toHaveLength(1);
        festive.add(up[0]!.row.note);
      }
    }
    expect(festive.size).toBe(NOTICES.filter((n) => n.during).length);
    for (const w of WINDOWS) {
      expect(noticesIn(`2026-11-01@${w}`, w).some((n) => n.row.during)).toBe(false);
      expect(noticesIn(`2026-09-30@${w}`, w).some((n) => n.row.during)).toBe(false);
    }
  });

  it('each ask for something, say what, and bring more than it would sell for', () => {
    for (const row of NOTICES) {
      expect(row.note, row.note).toContain('{what}');
      expect(row.count).toBeGreaterThan(0);
      expect(noticeCandy(row)).toBeGreaterThan(ITEM_VALUE[row.item] * row.count);
    }
  });
});

describe('the noticeboard', () => {
  it('stands by the square, and opens when she walks up to it', () => {
    const h = harness();
    const row = TOWN.rows.findIndex((r) => r.includes('N'));
    const tx = TOWN.rows[row]!.indexOf('N');
    expect(walkTo(h, tx, row)).toContainEqual(
      expect.objectContaining({ kind: 'arrived', at: 'noticeboard' }),
    );
  });

  it('takes what a note asks for, pays her, and brings her closer to who pinned it', () => {
    const h = harness();
    const notice = h.world.noticeboard.notices()[0]!;
    expect(h.world.noticeboard.answer(notice.slot)).toBeNull();
    h.world.bag.add(notice.item, notice.count);
    const candy = h.world.wallet.candy;
    const points = h.world.friends.of(notice.from).points;
    const answered = h.world.noticeboard.answer(notice.slot);
    expect(answered).toEqual({
      kind: 'answered',
      from: notice.from,
      item: notice.item,
      count: notice.count,
      candy: notice.candy,
    });
    expect(h.world.bag.count(notice.item)).toBe(0);
    expect(h.world.wallet.candy).toBe(candy + notice.candy);
    expect(h.world.friends.of(notice.from).points).toBeGreaterThan(points);
    expect(h.world.noticeboard.notices()[0]!.done).toBe(true);
    h.world.bag.add(notice.item, notice.count);
    expect(h.world.noticeboard.answer(notice.slot)).toBeNull();
    expect(eventToast(answered!)?.text).toMatch(/thank-you/);
  });

  it('keeps a note answered through a save, and puts up new ones the next window', () => {
    const h = harness();
    const notice = h.world.noticeboard.notices()[1]!;
    h.world.bag.add(notice.item, notice.count);
    h.world.noticeboard.answer(notice.slot);
    const saved = h.world.save();
    const again = harness(undefined, { finds: { bag: saved.bag, taken: saved.taken } });
    expect(again.world.noticeboard.notices()[1]!.done).toBe(true);
    again.clock.set(new Date(2026, 8, 26, 18));
    expect(again.world.noticeboard.notices().every((n) => !n.done)).toBe(true);
  });
});
