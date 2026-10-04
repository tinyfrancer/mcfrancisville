import type { Movement } from '../Movement';
import type { Collecting } from '../services/Collecting';
import { PetCare } from '../services/PetCare';
import type { Travel } from '../services/Travel';
import type { HomeZone } from '../zones/HomeZone';
import type { MapZone } from '../zones/MapZone';
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
}

export function petServices(s: Shared, parts: PetParts): PetServices {
  const { travel } = parts;
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
  });
  return { petCare };
}
