/**
 * Where the calendar's events stand (0.2's M3, decision 202): at the Hollow Fairground once it's
 * open to her, and until then in town, where she can always get to them (decisions.md 11). Which
 * it is comes from the atlas, as the save has it, told by `Travel`; nothing of it is saved.
 */

let fairOpen = false;

/** What the atlas says of the fairground's gate: told as the world is made, and as it opens. */
export function knowFairground(open: boolean): void {
  fairOpen = open;
}

/** Whether the calendar's events have moved to the fairground. */
export function atTheFair(): boolean {
  return fairOpen;
}
