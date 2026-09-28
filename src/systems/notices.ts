import { NOTICES, NOTICES_UP, type NoticeRow } from '../data/notices';
import { ITEM_VALUE } from '../data/shop';
import type { DayWindow } from '../data/windows';
import { hashString, seeded } from './random';

/** A note up on the board this window, by its slot there. */
export interface PinnedNotice {
  slot: number;
  row: NoticeRow;
}

/**
 * The notes up on the board in a window (a `windowKey`): the same all window and new the next,
 * dealt from those that go up in it, each from a different neighbour. Nothing is saved.
 */
export function noticesIn(key: string, window: DayWindow): PinnedNotice[] {
  const random = seeded(hashString(`notices:${key}`));
  const deck = NOTICES.filter((n) => !n.windows || n.windows.includes(window));
  for (let i = deck.length - 1; i > 0; i--) {
    const j = Math.floor(random() * (i + 1));
    [deck[i], deck[j]] = [deck[j]!, deck[i]!];
  }
  const up: NoticeRow[] = [];
  for (const row of deck) {
    if (up.length < NOTICES_UP && !up.some((u) => u.from === row.from)) up.push(row);
  }
  return up.map((row, slot) => ({ slot, row }));
}

/** What a note brings her: a little more than what she hands over would sell for. */
export function noticeCandy(row: NoticeRow): number {
  return 30 + Math.round(1.5 * ITEM_VALUE[row.item] * row.count);
}

/** What a taken-down note is remembered by in `taken`, so it's answered once a window. */
export const noticeKey = (slot: number) => `notice:${slot}`;
