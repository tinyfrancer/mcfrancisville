import { lurksOf } from '../../systems/mystery';
import type { Mailbox } from '../services/Mailbox';
import { Mystery } from '../services/Mystery';
import type { MapZone } from '../zones/MapZone';
import type { Shared } from './shared';

/** The mayor's mystery: the clues pinned to her corkboard, and Wes peeking round his trees. */
export function mystery(s: Shared, mailbox: Mailbox, townZone: MapZone): Mystery {
  const townWalk = (tx: number, ty: number) => townZone.canWalk(tx, ty);
  return new Mystery(
    s.ctx,
    s.casebook,
    {
      mailbox,
      friends: s.friends,
      cabinet: s.cabinet,
      wardrobe: s.wardrobe,
      outside: () => s.town.scene() === 'town',
    },
    s.peopled ? lurksOf(s.map, townWalk) : [],
  );
}
