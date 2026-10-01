import { LOST_IDS, LOST_SPOTS, NEWS, type News } from '../data/smallEvents';
import type { LostId } from '../types/ids';
import type { Tile } from './pathfinding';
import { hashString } from './random';

/** The window's small event (phase S2): a bit of news, or something lost somewhere in town. */
export type SmallEvent =
  { kind: 'news'; news: News } | { kind: 'lost'; lost: LostId; at: Tile; where: string };

/**
 * The small event a window brings, dealt from its key (`YYYY-MM-DD@window`), the same all window
 * and different the next: news about half the time, and otherwise something lost.
 */
export function smallEventOf(window: string): SmallEvent {
  const h = hashString(`small:${window}`);
  if (h % 2 === 0) return { kind: 'news', news: NEWS[(h >>> 4) % NEWS.length]! };
  const spot = LOST_SPOTS[(h >>> 12) % LOST_SPOTS.length]!;
  return { kind: 'lost', lost: LOST_IDS[(h >>> 4) % LOST_IDS.length]!, ...spot };
}
