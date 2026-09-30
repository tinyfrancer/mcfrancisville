import { NOTES, type PatchNotes } from '../data/patchNotes';

/** The version on her phone: the newest notes. */
export function currentVersion(): string {
  return NOTES[NOTES.length - 1]!.version;
}

/**
 * The notes to show as she opens the game, given the version this phone last showed her (null if
 * none) and whether she already has a town. Only the newest: nothing is new to someone whose town
 * begins today, and a phone that missed a version hears about the latest, which is all she has.
 */
export function notesToShow(lastSeen: string | null, hasTown: boolean): PatchNotes | null {
  const newest = NOTES[NOTES.length - 1]!;
  if (!hasTown || lastSeen === newest.version) return null;
  return newest;
}
