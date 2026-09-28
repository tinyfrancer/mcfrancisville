import type { PotPlantId } from '../types/ids';

/*
 * The pots by her front door (personal_touches.md, "After phase F"): potted mums to start, and
 * other plants she can swap in by walking up to them.
 */

export interface PotPlantRow {
  /** What's in the pots, as a sentence says it. */
  name: string;
}

/** In the order a walk up to the pots brings them round. */
export const POT_PLANTS: Record<PotPlantId, PotPlantRow> = {
  mums: { name: 'Orange mums' },
  plumMums: { name: 'Plum mums' },
  succulents: { name: 'Succulents' },
  hostas: { name: 'Little hostas' },
};

export const POT_PLANT_IDS = Object.keys(POT_PLANTS) as PotPlantId[];

/** What's in the pots on her first day: the mums from their own front step. */
export const STARTER_POT_PLANT: PotPlantId = 'mums';
