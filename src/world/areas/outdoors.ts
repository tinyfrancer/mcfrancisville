import type { MapZoneId } from '../../types/ids';
import { Forecast } from '../services/Forecast';
import { Fountain } from '../services/Fountain';
import type { Zones } from '../zones/Zones';
import type { Shared } from './shared';

/** What's in the air outdoors: the day's weather, and the pond's fountain after dark. */
export interface Outdoors {
  weather: Forecast;
  fountain: Fountain;
}

/** `outside` is the place outdoors she's in, or null indoors. */
export function outdoors(s: Shared, zones: Zones, outside: () => MapZoneId | null): Outdoors {
  return {
    weather: new Forecast(s.ctx, outside),
    fountain: new Fountain(s.ctx, () => {
      const zone = zones.outdoor(s.town.scene());
      if (!zone) return null;
      return { props: zone.map.props, tile: s.movement().tile };
    }),
  };
}
