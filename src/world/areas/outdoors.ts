import type { MapZoneId } from '../../types/ids';
import type { PropArrivals } from '../arrivals';
import { Forecast } from '../services/Forecast';
import { Fountain } from '../services/Fountain';
import type { Mailbox } from '../services/Mailbox';
import { Stargazing } from '../services/Stargazing';
import type { Zones } from '../zones/Zones';
import type { Shared } from './shared';

/** What's in the air outdoors: the day's weather, the pond's fountain and the stars after dark. */
export interface Outdoors {
  weather: Forecast;
  fountain: Fountain;
  /** The night sky through a telescope, and her star chart (1.5's G4). */
  stargazing: Stargazing;
  /** The telescope at the castle lookout. */
  arrivals: PropArrivals;
}

/** `outside` is the place outdoors she's in, or null indoors. */
export function outdoors(
  s: Shared,
  zones: Zones,
  outside: () => MapZoneId | null,
  mailbox: Mailbox,
): Outdoors {
  const weather = new Forecast(s.ctx, outside);
  const stargazing = new Stargazing(s.ctx, {
    cabinet: s.cabinet,
    mailbox,
    weather: () => weather.today(),
  });
  return {
    weather,
    fountain: new Fountain(s.ctx, () => {
      const zone = zones.outdoor(s.town.scene());
      if (!zone) return null;
      // A built bandstand plays the fountain's music box too (V1's R4).
      const props = [...zone.map.props, ...(zone.sites?.props() ?? [])];
      return { props, tile: s.movement().tile };
    }),
    stargazing,
    arrivals: {
      telescope: () => {
        const looked = stargazing.lookUp();
        return looked ? [looked] : [];
      },
    },
  };
}
