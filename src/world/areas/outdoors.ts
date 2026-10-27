import type { MapZoneId } from '../../types/ids';
import type { PropArrivals } from '../arrivals';
import type { TileBox } from '../events';
import { Delights } from '../services/Delights';
import { Forecast } from '../services/Forecast';
import { Fountain } from '../services/Fountain';
import type { Kitchen } from '../services/Kitchen';
import type { Mailbox } from '../services/Mailbox';
import { Snow } from '../services/Snow';
import { Stargazing } from '../services/Stargazing';
import { Well } from '../services/Well';
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
  /** The wishing well on the square (1.7's Y2): a Candy a day for a wish. */
  well: Well;
  /** The telescope at the castle lookout, and the well, whose card opens (`moments.ts`). */
  arrivals: PropArrivals;
}

/** Where the square's well stands (a test's small town may have none: a tile off the map). */
function wellBox(s: Shared): TileBox {
  const well = s.map.props.find((p) => p.id === 'well');
  return well ? { tx: well.tx, ty: well.ty, w: well.w, h: well.h } : { tx: -1, ty: -1, w: 1, h: 1 };
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
  const weather = new Forecast(s.ctx, outside, s.bag);
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
    well: new Well(
      s.ctx,
      { bag: s.bag, wallet: s.wallet, takings: s.takings, home: s.home },
      s.town.name,
      wellBox(s),
    ),
    arrivals: {
      // Walking up to the well opens its card (`moments.ts`), and nothing more.
      well: () => [],
      telescope: () => {
        const looked = stargazing.lookUp();
        return looked ? [looked] : [];
      },
    },
  };
}
