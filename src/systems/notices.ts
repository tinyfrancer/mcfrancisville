import { NOTICES, NOTICES_UP, type NoticeRow } from '../data/notices';
import { ITEM_VALUE } from '../data/shop';
import type { DayWindow } from '../data/windows';
import { festivalsOn } from './calendar';
import { hashString, seeded } from './random';

/** A note up on the board this window, by its slot there. */
export interface PinnedNotice {
  slot: number;
  row: NoticeRow;
}

/**
 * The notes up on the board in a window (a `windowKey`): the same all window and new the next,
 * dealt from those that go up in it, each from a different neighbour. While a festival is on, the
 * first is always one of its notes. Nothing is saved.
 */
export function noticesIn(key: string, window: DayWindow): PinnedNotice[] {
  const random = seeded(hashString(`notices:${key}`));
  const festivals = festivalsOn(key.slice(0, 10));
  const deck = NOTICES.filter(
    (n) =>
      (!n.windows || n.windows.includes(window)) && (!n.during || festivals.includes(n.during)),
  );
  for (let i = deck.length - 1; i > 0; i--) {
    const j = Math.floor(random() * (i + 1));
    [deck[i], deck[j]] = [deck[j]!, deck[i]!];
  }
  const festive = deck.find((n) => n.during);
  const up: NoticeRow[] = festive ? [festive] : [];
  for (const row of deck) {
    if (row.during) continue;
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
