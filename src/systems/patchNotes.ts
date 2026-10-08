import { NOTES, type PatchNotes } from '../data/patchNotes';

/** The version on her phone: the newest notes. */
export function currentVersion(): string {
  return NOTES[NOTES.length - 1]!.version;
}

/**
 * The notes to show as she opens the game, oldest first, given the version this phone last showed
 * her (null if none) and whether she already has a town. Nothing is new to someone whose town
 * begins today. A phone that last saw a version these notes know hears every one since, a card
 * each, because a patch may carry more than one version's worth (V1 ships 0.4 and 0.5 together);
 * a phone from before the notes, or one that saw a version they no longer know, hears the
 * newest, which is all it can be told.
 */
export function notesToShow(lastSeen: string | null, hasTown: boolean): PatchNotes[] {
  const newest = NOTES[NOTES.length - 1]!;
  if (!hasTown || lastSeen === newest.version) return [];
  const seen = NOTES.findIndex((n) => n.version === lastSeen);
  return seen < 0 ? [newest] : NOTES.slice(seen + 1);
}
