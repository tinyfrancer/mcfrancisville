import { ZONE_IDS } from '../../data/zones';
import type { UnlockFacts } from '../../systems/zones';
import type { ZoneId } from '../../types/ids';
import { Movement } from '../Movement';
import { Broom } from '../services/Broom';
import type { Mailbox } from '../services/Mailbox';
import { Travel } from '../services/Travel';
import type { Visits } from '../services/Visits';
import type { Zones } from '../zones/Zones';
import type { Shared } from './shared';

/** Where she stands and walks, going from place to place, and her broom home and back. */
export interface Going {
  movement: Movement;
  travel: Travel;
  broom: Broom;
}

interface GoingParts {
  zones: Zones;
  mailbox: Mailbox;
  visits: Visits;
}

/**
 * The save puts her back where she was. If that tile has stopped being somewhere she can stand (a
 * later map put a tree on it), she starts at her door instead of inside the tree.
 */
export function going(s: Shared, { zones, mailbox, visits }: GoingParts): Going {
  const { ctx, bag, atlas } = s;
  const saved = s.options.player;
  // A place a later build added, that this one doesn't know, puts her back at her door.
  const known = saved && (ZONE_IDS as string[]).includes(saved.zone);
  const start: ZoneId = known ? saved.zone : 'town';
  const zone = zones.get(start);
  const startTile = known && zone.canWalk(saved.tx, saved.ty) ? saved : zone.entry(null).tile;
  const movement = new Movement(startTile, saved?.facing ?? 'down');
  const facts: UnlockFacts = {
    has: (item) => bag.count(item) > 0,
    hearts: (villager) => s.friends.hearts(villager),
    found: (z) => atlas.hasFound(z),
    caughtKinds: () => s.cabinet.found,
  };
  const travel = new Travel(
    ctx,
    { zones, atlas, movement, mailbox, facts },
    start,
    s.options.left ?? null,
  );
  const broom = new Broom(
    ctx,
    {
      bag,
      home: s.home,
      mailbox,
      travel,
      visits: () => visits.count,
      standing: () => (travel.here === 'home' ? movement.tile : null),
    },
    s.options.broom,
  );
  return { movement, travel, broom };
}
