import { CHAIN_LAST, UNMASKED } from '../../data/mysteryChain';
import { knowMayor } from '../../systems/mayor';
import { lurksOf } from '../../systems/mystery';
import type { Casebook } from '../Casebook';
import type { Mailbox } from '../services/Mailbox';
import { Mystery } from '../services/Mystery';
import type { MapZone } from '../zones/MapZone';
import type { Shared } from './shared';

/**
 * Tells the town what her corkboard says of the mayor (V1's P3b): whether he has promised, and
 * whether she has met him, before anyone who walks the town is made, so he walks only once met.
 */
export function tellTheMayor(casebook: Casebook): void {
  knowMayor(casebook.foundOn(CHAIN_LAST), casebook.foundOn(UNMASKED));
}

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
