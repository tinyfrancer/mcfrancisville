import type { MapZoneId } from '../../types/ids';
import type { PropArrivals } from '../arrivals';
import { Delights } from '../services/Delights';
import { Forecast } from '../services/Forecast';
import { Fountain } from '../services/Fountain';
import type { Kitchen } from '../services/Kitchen';
import type { Mailbox } from '../services/Mailbox';
import { Snow } from '../services/Snow';
import { Stargazing } from '../services/Stargazing';
import type { Neighbourhood } from '../services/Neighbourhood';
import type { Zones } from '../zones/Zones';
import type { Shared } from './shared';

/**
 * What's in the air outdoors: the day's weather and its rainbow, the pond's fountain, the stars after
 * dark, the snow in winter and the small delights (1.6's X5).
 */
export interface Outdoors {
  weather: Forecast;
  fountain: Fountain;
  /** The night sky through a telescope, and her star chart (1.5's G4). */
  stargazing: Stargazing;
  /** Snow to play in, in winter (1.6's X4): snowmen in her yard, snowballs anywhere. */
  snow: Snow;
  /** Small delights (1.6's X5): a butterfly on her hat, fireflies, the crow's caw, a sneeze. */
  delights: Delights;
  /** The telescope at the castle lookout. */
  arrivals: PropArrivals;
}

/** `outside` is the place outdoors she's in, or null indoors. */
export function outdoors(
  s: Shared,
  zones: Zones,
  outside: () => MapZoneId | null,
  mailbox: Mailbox,
  neighbourhood: Neighbourhood,
  kitchen: Kitchen,
): Outdoors {
  const weather = new Forecast(s.ctx, outside, s.bag, s.options.rainbow ?? null);
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
    snow: new Snow(s.ctx, {
      yard: s.yard,
      home: s.home,
      bag: s.bag,
      zones,
      neighbourhood,
      movement: s.movement,
      outside,
    }),
    delights: new Delights(s.ctx, {
      zones,
      takings: s.takings,
      neighbourhood,
      movement: s.movement,
      outside,
      weather: () => weather.today(),
      pace: () => kitchen.pace(),
      name: s.town.name,
    }),
    arrivals: {
      telescope: () => {
        const looked = stargazing.lookUp();
        return looked ? [looked] : [];
      },
    },
  };
}
