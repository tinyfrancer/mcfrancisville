import { LOST, LOST_IDS, LOST_SPOTS, NEWS, type News } from '../data/smallEvents';
import type { LostId, VillagerId } from '../types/ids';
import type { Tile } from './pathfinding';
import { hashString } from './random';

/** The window's small event (phase S2): a bit of news, or something lost somewhere in town. */
export type SmallEvent =
  { kind: 'news'; news: News } | { kind: 'lost'; lost: LostId; at: Tile; where: string };

/**
 * The small event a window brings, dealt from its key (`YYYY-MM-DD@window`), the same all window
 * and different the next: news about half the time, and otherwise something lost, by someone who
 * lives here (a newcomer loses nothing before they've moved in, 0.2's L1).
 */
export function smallEventOf(
  window: string,
  livesHere: (villager: VillagerId) => boolean = () => true,
): SmallEvent {
  const h = hashString(`small:${window}`);
  if (h % 2 === 0) return { kind: 'news', news: NEWS[(h >>> 4) % NEWS.length]! };
  const spot = LOST_SPOTS[(h >>> 12) % LOST_SPOTS.length]!;
  const lost = LOST_IDS.filter((id) => livesHere(LOST[id].who));
  return { kind: 'lost', lost: lost[(h >>> 4) % lost.length]!, ...spot };
}
