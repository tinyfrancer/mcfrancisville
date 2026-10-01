import { INTERIOR_IDS, INTERIORS } from '../data/interiors';
import { PROP_FOOTPRINT } from '../data/maps';
import { ZONE_IDS, ZONES } from '../data/zones';
import type { InteriorId, MapZoneId, PropId, VillagerId } from '../types/ids';
import type { PlacedProp } from './grid';

/*
 * The lots the neighbours who came later built on (phase T). Nobody moves in over time any more
 * (decision 211): every house stands on its lot from her first day, and a neighbour who comes
 * with an update comes with a lot of their own.
 */

/** Where a house stands on its lot: the place, and its footprint. */
export interface Lot {
  zone: MapZoneId;
  house: PlacedProp;
  /** The inside of it, through its door. */
  inside: InteriorId;
  owner: VillagerId;
}

/** Every lot, in every place. */
export const LOTS: readonly Lot[] = ZONE_IDS.flatMap((zone) =>
  (ZONES[zone].map?.lots ?? []).map((lot) => {
    const inside = INTERIOR_IDS.find((id) => INTERIORS[id].building === lot.prop);
    const owner = inside && INTERIORS[inside].owner;
    if (!inside || !owner) throw new Error(`nobody lives in the ${lot.prop} on ${zone}'s lot`);
    const house = { id: lot.prop, tx: lot.tx, ty: lot.ty, ...PROP_FOOTPRINT[lot.prop] };
    return { zone: zone as MapZoneId, house, inside, owner };
  }),
);

/** A neighbour's lot, if their house stands on one. */
export function lotOf(villager: VillagerId): Lot | undefined {
  return LOTS.find((l) => l.owner === villager);
}

/** The lot a house stands on, by its prop. */
export function lotFor(prop: PropId): Lot | undefined {
  return LOTS.find((l) => l.house.id === prop);
}
