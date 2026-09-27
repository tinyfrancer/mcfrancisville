/**
 * Whether this phone plays the game's sounds and its music. A preference of the phone's rather
 * than part of her town, so it lives beside the save rather than in it, and a backup code doesn't
 * carry it.
 */
export interface SoundSettings {
  effects: boolean;
  music: boolean;
}

export const SOUND_KEY = 'mcfrancisville:sound';

const ON: SoundSettings = { effects: true, music: true };

export function readSoundSettings(
  storage: Storage | undefined = globalThis.localStorage,
): SoundSettings {
  try {
    const raw = storage?.getItem(SOUND_KEY);
    if (!raw) return { ...ON };
    const saved = JSON.parse(raw) as Partial<SoundSettings>;
    return { effects: saved.effects !== false, music: saved.music !== false };
  } catch {
    return { ...ON };
  }
}

export function writeSoundSettings(
  settings: SoundSettings,
  storage: Storage | undefined = globalThis.localStorage,
): void {
  try {
    storage?.setItem(SOUND_KEY, JSON.stringify(settings));
  } catch {
    // A phone that won't keep it just asks again next time: sound stays on.
  }
}
