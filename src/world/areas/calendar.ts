import type { MapZoneId } from '../../types/ids';
import { Calendar } from '../services/Calendar';
import { Finale } from '../services/Finale';
import { Holidays } from '../services/Holidays';
import type { Neighbourhood } from '../services/Neighbourhood';
import { PumpkinPatch } from '../services/PumpkinPatch';
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
}

interface FestivalParts {
  stalls: Stalls;
  neighbourhood: Neighbourhood;
  /** The place outdoors she's in, or null indoors. */
  outside: () => MapZoneId | null;
}

export function festivals(s: Shared, parts: FestivalParts): Festivals {
  const { ctx, town, bag, takings } = s;
  const { neighbourhood } = parts;
  return {
    calendar: new Calendar(ctx, parts.stalls),
    holidays: new Holidays(ctx, { bag, takings }, parts.outside),
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
    pumpkinPatch: new PumpkinPatch(ctx, { bag, takings }),
    finale: new Finale(ctx, takings, { ...town, look: () => s.wardrobe.look }),
  };
}
