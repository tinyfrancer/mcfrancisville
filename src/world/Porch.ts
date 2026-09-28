import { POT_PLANT_IDS, POT_PLANTS, STARTER_POT_PLANT } from '../data/porch';
import type { PotPlantId } from '../types/ids';

/** What of her porch is saved: what's growing in the pots by her door. */
export interface PorchSnapshot {
  plant: PotPlantId;
}

function isPotPlant(id: unknown): id is PotPlantId {
  return typeof id === 'string' && id in POT_PLANTS;
}

/** Her front step: the two pots by her door, and what's in them. */
export class Porch {
  private current: PotPlantId;

  /** A plant a later build added, that this one doesn't know, gives back the mums. */
  constructor(saved: Partial<PorchSnapshot> = {}) {
    this.current = isPotPlant(saved.plant) ? saved.plant : STARTER_POT_PLANT;
  }

  get plant(): PotPlantId {
    return this.current;
  }

  /** The next plant round goes in the pots, and the first comes round again after the last. */
  swap(): PotPlantId {
    const at = POT_PLANT_IDS.indexOf(this.current);
    this.current = POT_PLANT_IDS[(at + 1) % POT_PLANT_IDS.length]!;
    return this.current;
  }

  snapshot(): PorchSnapshot {
    return { plant: this.current };
  }
}
