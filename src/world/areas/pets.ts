import { CRITTERS } from '../../data/critters';
import type { PetFinds } from '../../systems/pets';
import type { Movement } from '../Movement';
import type { Collecting } from '../services/Collecting';
import type { Fossils } from '../services/Fossils';
import { PetCare } from '../services/PetCare';
import type { SmallEvents } from '../services/SmallEvents';
import type { Travel } from '../services/Travel';
import type { HomeZone } from '../zones/HomeZone';
import type { MapZone } from '../zones/MapZone';
import type { Zones } from '../zones/Zones';
import type { Shared } from './shared';

/** Their pets: the one out with her, those at home, and Fibi's bones. */
export interface PetServices {
  petCare: PetCare;
}

interface PetParts {
  movement: Movement;
  travel: Travel;
  homeZone: HomeZone;
  townZone: MapZone;
  collecting: Collecting;
  /** For a pet's job on a walk (V1's R6c): today's mounds and what's lost about town. */
  fossils?: Fossils;
  smallEvents?: SmallEvents;
  zones?: Zones;
}

export function petServices(s: Shared, parts: PetParts): PetServices {
  const { travel, collecting, fossils, smallEvents, zones } = parts;
  // What a walk turns up where she is, from each service's own reads (V1's R6c).
  const finds = (): PetFinds => {
    const outdoors = zones?.outdoor(travel.here);
    if (!outdoors) return { mound: null, critters: [], lost: null };
    const id = outdoors.id;
    const mound = fossils && !fossils.isDug(id) ? fossils.mound(id) : null;
    const lying = id === 'town' ? (smallEvents?.lying() ?? null) : null;
    const critters = collecting.critters(id).map((c) => {
      const row = CRITTERS[c.critter];
      const shy = row.wary > 0 || collecting.isShy(c.critter);
      return { key: c.key, tx: c.tx, ty: c.ty, shy, orb: row.family === 'orb' };
    });
    return {
      mound: mound && { tx: mound.tx, ty: mound.ty },
      critters,
      lost: lying?.at ?? null,
      outdoors: true,
    };
  };
  const petCare = new PetCare(s.ctx, {
    pets: s.pets,
    bag: s.bag,
    takings: s.takings,
    movement: parts.movement,
    homeZone: parts.homeZone,
    townZone: parts.townZone,
    habitats: parts.collecting.habitatsIn('town'),
    where: () => travel.here,
    zone: () => travel.zone,
    home: s.home,
    finds,
    fetched: (at) => smallEvents?.pickUp(at) ?? [],
    settle: (key) => collecting.settle(key),
    draw: (key, to) => collecting.draw(key, to),
  });
  return { petCare };
}
