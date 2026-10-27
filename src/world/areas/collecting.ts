import { CRITTER_IDS, isFish } from '../../data/critters';
import type { ItemId, MapZoneId } from '../../types/ids';
import type { PropArrivals } from '../arrivals';
import { Collecting } from '../services/Collecting';
import { Fishing } from '../services/Fishing';
import { Digging } from '../services/Digging';
import { Fossils } from '../services/Fossils';
import { LeafPiles } from '../services/LeafPiles';
import type { Kitchen } from '../services/Kitchen';
import type { Mailbox } from '../services/Mailbox';
import type { SmallEvents } from '../services/SmallEvents';
import type { Zones } from '../zones/Zones';
import type { Shared } from './shared';

/** Her net and her rod: the critters and fish out, catching them, and the museum; and the fossils. */
export interface Catching {
  collecting: Collecting;
  fishing: Fishing;
  fossils: Fossils;
  /** Digging up what's buried, once (phase I). */
  digging: Digging;
  /** Autumn's leaf piles to jump in (1.7's Y2), where a critter may rustle out for her net. */
  leafPiles: LeafPiles;
  /** A mound walked up to: today's fossil first, then a buried key; and a leaf pile jumped in. */
  arrivals: PropArrivals;
}

interface CatchingParts {
  mailbox: Mailbox;
  zones: Zones;
  kitchen: Kitchen;
  /** The place outdoors she's in, or null indoors. */
  outside: () => MapZoneId | null;
  /** Whether she has ever had a thing (the milestones, made later). */
  hasHad: (id: ItemId) => boolean;
  /** The window's small event, whose lost thing may turn up in a leaf pile in town. */
  smallEvents: SmallEvents;
}

export function catching(s: Shared, parts: CatchingParts): Catching {
  const { ctx, cabinet } = s;
  const { kitchen } = parts;
  const collecting = new Collecting(
    ctx,
    { bag: s.bag, takings: s.takings, cabinet, mailbox: parts.mailbox },
    parts.zones.outdoors,
    s.peopled,
    parts.outside,
    { lure: () => kitchen.lure(), standing: () => s.movement().tile },
  );
  const fishing = new Fishing(ctx, {
    collecting,
    walking: () => s.movement().walking,
    hasFished: () => CRITTER_IDS.some((id) => isFish(id) && cabinet.caughtOn(id) !== null),
    eager: () => kitchen.eager(),
    slow: () => s.options.slow?.() ?? false,
    scene: () => s.town.scene(),
  });
  const fossils = new Fossils(ctx, {
    bag: s.bag,
    takings: s.takings,
    wallet: s.wallet,
    cabinet,
    zones: parts.zones,
    hasHad: parts.hasHad,
    mailbox: parts.mailbox,
  });
  const digging = new Digging(ctx, s.dug, s.bag);
  const leafPiles = new LeafPiles(
    ctx,
    { bag: s.bag, wallet: s.wallet, takings: s.takings, home: s.home },
    { zones: parts.zones, collecting, smallEvents: parts.smallEvents },
  );
  const arrivals: PropArrivals = {
    mound: ({ prop, place }) => {
      if (!place) return null;
      const dug = fossils.isToday(place.id, prop)
        ? fossils.dig(place.id)
        : digging.dig(place.id, prop);
      return dug ? [dug] : [];
    },
    leafPile: ({ prop, place }) => (place ? leafPiles.jump(place, prop) : null),
  };
  return { collecting, fishing, fossils, digging, leafPiles, arrivals };
}
