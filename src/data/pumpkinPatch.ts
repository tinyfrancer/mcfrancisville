import type { FestivalId } from './calendar';

/**
 * The pumpkin patch on the farm (0.2's J3, decision 156): it rests under straw most of the year,
 * and grows over the Halloween Festival, to be picked from the middle of October on, for carving
 * (personal_touches.md, question 31: they go to the pumpkin patch every October). Until the
 * fairground (M1), it's on her farm.
 */

/** The festival it grows over. */
export const PATCH_FESTIVAL: FestivalId = 'halloweenFestival';

export type PatchStage = 'resting' | 'sprouting' | 'flowering' | 'ripe';

/** The festival's day each stage starts on, from 1; outside the festival it rests. */
export const PATCH_STAGES: readonly { stage: Exclude<PatchStage, 'resting'>; from: number }[] = [
  { stage: 'sprouting', from: 1 },
  { stage: 'flowering', from: 8 },
  { stage: 'ripe', from: 15 },
];

/** What she finds walking up to it, by how it's coming on. */
export const PATCH_LINES: Record<Exclude<PatchStage, 'ripe'>, string> = {
  resting: 'The pumpkin patch is resting under its straw. It wakes up for the Halloween Festival.',
  sprouting:
    'The pumpkin patch is sprouting! Little vines are curling everywhere. Pumpkins by the middle of the month.',
  flowering:
    'Yellow flowers all over the pumpkin patch, and little green pumpkins under the leaves. Not long now!',
};

/** Picking one, and coming back for another the same day. */
export const PICKED =
  'You pick the roundest pumpkin in the patch. It wants carving into something with whiskers, at your workbench.';
export const PICKED_TODAY =
  "You've had today's pick of the patch. Another will be round and ready tomorrow.";
