import { HUNDREDTH_VISIT, VISIT_MILESTONES, VISIT_ROUND, type VisitGift } from '../data/visits';

/** The gift for her `visit`th visit (the first is 1), worked out from the number alone. */
export function giftFor(visit: number): VisitGift {
  const milestone = VISIT_MILESTONES[visit];
  if (milestone) return milestone;
  if (visit % 100 === 0) return HUNDREDTH_VISIT;
  const n = Math.max(0, visit - 1);
  const slot = n % VISIT_ROUND.length;
  const gift = VISIT_ROUND[slot]!;
  if ('candy' in gift) return gift;
  // Each round moves every list on one, and two slots in a round never give the same thing.
  const round = Math.floor(n / VISIT_ROUND.length);
  return { item: gift.oneOf[(round + slot) % gift.oneOf.length]!, count: gift.count };
}

/** Whether a visit is one of the table's, worth saying so. */
export function isMilestone(visit: number): boolean {
  return visit in VISIT_MILESTONES || visit % 100 === 0;
}
