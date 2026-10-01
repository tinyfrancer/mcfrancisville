import { PATCH_FESTIVAL, PATCH_STAGES, type PatchStage } from '../data/pumpkinPatch';
import { festivalDay, festivalsOn } from './calendar';

export type { PatchStage };

/** What she has picked from the patch is kept by this in `Takings`, once a day. */
export const PATCH_KEY = 'pumpkin:patch';

/** How the pumpkin patch is coming on, from the day key alone (0.2's J3). */
export function patchStage(day: string): PatchStage {
  if (!festivalsOn(day).includes(PATCH_FESTIVAL)) return 'resting';
  const { nth } = festivalDay(PATCH_FESTIVAL, day);
  return PATCH_STAGES.findLast((s) => s.from <= nth)?.stage ?? 'resting';
}
