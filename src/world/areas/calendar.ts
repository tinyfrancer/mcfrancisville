import { GOOSE_OUTFITS } from '../../data/geese';
import type { MapZoneId } from '../../types/ids';
import type { PropArrivals } from '../arrivals';
import { Calendar } from '../services/Calendar';
import { Finale } from '../services/Finale';
import { Holidays } from '../services/Holidays';
import type { Neighbourhood } from '../services/Neighbourhood';
import { PumpkinPatch } from '../services/PumpkinPatch';
import type { Mailbox } from '../services/Mailbox';
import { RareEvents } from '../services/RareEvents';
import { TrickOrTreat } from '../services/TrickOrTreat';
import type { Stalls } from '../zones/Stalls';
import type { Shared } from './shared';

/** The calendar, the holidays in town, and the Halloween Festival's evenings, patch and finale. */
export interface Festivals {
  calendar: Calendar;
  holidays: Holidays;
  trickOrTreat: TrickOrTreat;
  pumpkinPatch: PumpkinPatch;
  finale: Finale;
  /** What's out of the ordinary today, and who's passing through (V1's R3). */
  rareEvents: RareEvents;
  /** The pumpkin patch, and the porch geese saying what they have on. */
  arrivals: PropArrivals;
}

interface FestivalParts {
  stalls: Stalls;
  neighbourhood: Neighbourhood;
  /** The place outdoors she's in, or null indoors. */
  outside: () => MapZoneId | null;
  mailbox: Mailbox;
}

export function festivals(s: Shared, parts: FestivalParts): Festivals {
  const { ctx, town, bag, takings } = s;
  const { neighbourhood } = parts;
  const holidays = new Holidays(ctx, { bag, takings }, parts.outside);
  const pumpkinPatch = new PumpkinPatch(ctx, { bag, takings });
  return {
    calendar: new Calendar(ctx, parts.stalls),
    holidays,
    trickOrTreat: new TrickOrTreat(
      ctx,
      { bag, takings },
      {
        ...town,
        hosting: (zone) => neighbourhood.happeningIn(zone) !== null,
        isIn: (villager, zone) =>
          neighbourhood.neighbours.some((n) => n.id === villager && n.zone === zone),
      },
    ),
    pumpkinPatch,
    finale: new Finale(ctx, takings, { ...town, look: () => s.wardrobe.look }),
    rareEvents: new RareEvents(ctx, {
      bag,
      takings,
      wallet: s.wallet,
      mailbox: parts.mailbox,
      stalls: parts.stalls,
      thank: town.thank,
      outside: parts.outside,
      name: town.name,
      lots: { popUp: s.map.popUpLots, peddler: s.map.peddlerSpots },
    }),
    arrivals: {
      pumpkinPatch: () => [pumpkinPatch.visit()],
      goose: ({ prop, arrived, place }) => {
        if (!place) return null;
        // The first goose in the map is hers, by her path; the other is Barty's.
        const whose = place.map.props.find((p) => p.id === 'goose') === prop ? 0 : 1;
        arrived.says = GOOSE_OUTFITS[holidays.goose(whose)][whose];
        return [];
      },
    },
  };
}
