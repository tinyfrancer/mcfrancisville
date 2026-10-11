import { VILLAGER_IDS } from '../data/villagers';
import type { VillagerId } from '../types/ids';

/*
 * The mayor, met or not (V1's P3b, decision 303). Rob Boo's row is there from the start, but until
 * she has met him at the castle he isn't about: he walks nowhere, calls on nobody, has no birthday
 * on the calendar and is only a shape on the neighbours sheet. The unmasking is on every evening
 * from the day the mayor promised to say hello (`ready`) until the evening she's there, and stays
 * on the rest of that evening. Which it is comes from her corkboard, as the save has it, told by
 * `Mystery` as the world is made and as the clues are pinned; nothing of it is saved here.
 */

/** The neighbour who is the mayor. */
export const MAYOR: VillagerId = 'robBoo';

let promised: string | null = null;
let met: string | null = null;

/** What her corkboard says of the mayor: the day of the promise, and the day she met him. */
export function knowMayor(ready: string | null, metOn: string | null): void {
  promised = ready;
  met = metOn;
}

/** The day she met the mayor at the castle, or null while he's still a mystery. */
export function mayorMet(): string | null {
  return met;
}

/** Whether a neighbour is about in town: everyone, and the mayor once she has met him. */
export function inTown(villager: VillagerId): boolean {
  return villager !== MAYOR || met !== null;
}

/** Everyone about in town, in the order they're shown. */
export function townsfolk(): VillagerId[] {
  return VILLAGER_IDS.filter(inTown);
}

/**
 * Whether the unmasking is on, on a day: from the day of the promise, every day until the one she
 * meets him, and that day too, so the town stays to see him in.
 */
export function unmaskingOn(day: string): boolean {
  if (promised === null || day < promised) return false;
  return met === null || met === day;
}
