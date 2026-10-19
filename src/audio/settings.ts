/**
 * Whether this phone plays the game's sounds, its music and its ambience, and whether it plays
 * them through the silent switch (1.1's H1, decision 330). A preference of the phone's rather
 * than part of her town, so it lives beside the save rather than in it, and a backup code doesn't
 * carry it.
 */
export interface SoundSettings {
  effects: boolean;
  music: boolean;
  /** The bed under it all (the crickets, the rain, the wind): on unless she turns it off. */
  ambience: boolean;
  /** Heard with the switch on the side of the phone down: off unless she turns it on. */
  playOnSilent: boolean;
}

export const SOUND_KEY = 'mcfrancisville:sound';

const START: SoundSettings = { effects: true, music: true, ambience: true, playOnSilent: false };

export function readSoundSettings(
  storage: Storage | undefined = globalThis.localStorage,
): SoundSettings {
  try {
    const raw = storage?.getItem(SOUND_KEY);
    if (!raw) return { ...START };
    const saved = JSON.parse(raw) as Partial<SoundSettings>;
    return {
      effects: saved.effects !== false,
      music: saved.music !== false,
      ambience: saved.ambience !== false,
      playOnSilent: saved.playOnSilent === true,
    };
  } catch {
    return { ...START };
  }
}

export function writeSoundSettings(
  settings: SoundSettings,
  storage: Storage | undefined = globalThis.localStorage,
): void {
  try {
    storage?.setItem(SOUND_KEY, JSON.stringify(settings));
  } catch {
    // A phone that won't keep it starts as before next time: sound on, the switch obeyed.
  }
}
