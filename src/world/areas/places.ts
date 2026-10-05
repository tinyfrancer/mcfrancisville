import { INTERIOR_IDS } from '../../data/interiors';
import { TOWN } from '../../data/maps';
import type { FurnitureId, MapZoneId, ZoneId } from '../../types/ids';
import { Decorations } from '../zones/Decorations';
import { HomeZone } from '../zones/HomeZone';
import { Lots } from '../zones/Lots';
import { MapZone } from '../zones/MapZone';
import { Mounds } from '../zones/Mounds';
import { RoomZone } from '../zones/RoomZone';
import { Stalls } from '../zones/Stalls';
import { Zones } from '../zones/Zones';
import type { Shared } from './shared';

/** The places she can be, and what stands in town only on some days. */
export interface Places {
  stalls: Stalls;
  townZone: MapZone;
  homeZone: HomeZone;
  zones: Zones;
}

/** `isOpen` is read through travel, made after the places; until then every gate is open. */
export function places(s: Shared, isOpen: (zone: ZoneId) => boolean): Places {
  const { ctx, home } = s;
  const now = () => ctx.clock.now();
  const stalls = new Stalls(ctx.clock, s.map);
  const lotsIn = (zone: MapZoneId) => new Lots(zone);
  const hers = (piece: FurnitureId) =>
    home.everyPiece.some((p) => p.id === piece) ||
    home.stored.some((st) => st.id === piece) ||
    s.yard.placed.some((p) => p.id === piece);
  const townZone = new MapZone(
    'town',
    s.map,
    stalls,
    isOpen,
    lotsIn('town'),
    // The square's holiday pieces stand in the town's own map, not a test's small one.
    (s.options.map ?? TOWN) === TOWN ? new Decorations(now, hers) : null,
    () => s.farm.rows,
    s.yard,
    new Mounds('town', s.map.digSpots, ctx.clock),
  );
  const homeZone = new HomeZone(home);
  const zones = new Zones(
    homeZone,
    [
      townZone,
      ...s.beyond.map(({ id, map }) => {
        // What's set out for a happening at the fairground's stage (0.2's M3).
        const set = id === 'fairground' ? new Decorations(now, hers, id) : null;
        const mounds = new Mounds(id, map.digSpots, ctx.clock);
        return new MapZone(id, map, null, isOpen, lotsIn(id), set, () => s.farm.rows, null, mounds);
      }),
    ],
    INTERIOR_IDS.map((id) => new RoomZone(id)),
  );
  return { stalls, townZone, homeZone, zones };
}
