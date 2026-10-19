import type { SoundBoard } from '../../audio/SoundBoard';
import { NOTES } from '../../data/patchNotes';
import { readErrorNotes, troubleOf } from '../../errorNotes';
import type { SaveApi, SoundApi } from '../../hud/SettingsSheet';
import { saveService } from '../../persistence';
import { decodeBackup, encodeBackup } from '../../persistence/backup';
import { fetchKept, townFrom } from '../../persistence/cloud';
import { fromCode, keepCloudKey, readable, toCode } from '../../persistence/cloudKey';
import { sealerFor } from '../../persistence/cloudSeal';
import { runningStandalone } from '../../persistence/persist';
import { backedUpLine } from '../../systems/backupNudge';
import { markBackedUp, readBackedUpAt } from '../../safekeeping';
import type { Keeping } from '../keeping';

/** Settings' Backup tab: a code to copy, a town brought back from one, and the cloud's (V1's S2). */
export function saveApi(keeping: Keeping): SaveApi {
  const { autosave, cloud, key, persisted, currentSave } = keeping;
  return {
    backupCode: () => encodeBackup(currentSave()),
    async restore(code) {
      const decoded = await decodeBackup(code);
      if (!decoded.ok) return decoded;
      autosave.stop();
      cloud.stop();
      // Stamped now, so the town she chose is the newest and the cloud's isn't offered over it.
      saveService.save({ ...decoded.save, updatedAt: Date.now() });
      location.reload();
      return { ok: true };
    },
    cloud: {
      code: () => (key ? readable(key.code) : null),
      status: async () => {
        await cloud.recheck();
        return cloud.status();
      },
      async restore(text) {
        const bytes = fromCode(text);
        const theirs = bytes && (await sealerFor(toCode(bytes)));
        if (!bytes || !theirs) {
          return { ok: false, reason: "That doesn't look like a cloud code. Check each letter?" };
        }
        const got = await fetchKept(
          theirs,
          (url, init) => fetch(url, init),
          () => navigator.onLine,
        );
        if (!got.ok) {
          const why =
            got.state === 'notSetUp'
              ? "The cloud isn't set up yet."
              : "The cloud can't be reached.";
          return { ok: false, reason: `${why} Try again in a little while?` };
        }
        if (!got.kept) return { ok: false, reason: 'The cloud has no town under that code yet.' };
        const town = await townFrom(got.kept, theirs);
        if (!town.ok) return town;
        autosave.stop();
        cloud.stop();
        // This phone takes that code as its own, so both keep the one town from now on.
        keepCloudKey(toCode(bytes));
        saveService.save(town.save);
        location.reload();
        return { ok: true };
      },
    },
    status: async () => ({ persisted: await persisted, standalone: runningStandalone() }),
    backedUpLine: () => backedUpLine(Date.now(), readBackedUpAt()),
    backedUp: () => markBackedUp(Date.now()),
  };
}

/** Settings' Sound tab: this phone's switches, and a note of what went wrong lately (V1's S3). */
export function soundApi(sound: SoundBoard): SoundApi {
  return {
    effects: () => sound.effects,
    music: () => sound.musicOn,
    setEffects: (on) => sound.setEffectsOn(on),
    setMusic: (on) => sound.setMusicOn(on),
    ambience: () => sound.ambienceOn,
    setAmbience: (on) => sound.setAmbienceOn(on),
    playOnSilent: () => sound.playOnSilent,
    setPlayOnSilent: (on) => sound.setPlayOnSilent(on),
    trouble: () =>
      troubleOf(readErrorNotes(), Date.now(), {
        version: NOTES[NOTES.length - 1]!.version,
        userAgent: navigator.userAgent,
      }),
  };
}
