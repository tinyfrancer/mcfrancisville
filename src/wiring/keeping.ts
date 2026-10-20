import type { Hud } from '../hud/Hud';
import { offerCloud } from '../hud/CloudCard';
import { newSave, saveService, type SaveState } from '../persistence';
import { AutoSaver } from '../persistence/autosave';
import { CloudSave } from '../persistence/cloud';
import { cloudKey } from '../persistence/cloudKey';
import { sealerFor } from '../persistence/cloudSeal';
import { requestPersistence } from '../persistence/persist';
import { markBackedUp } from '../safekeeping';
import type { World } from '../world/World';

/** How long the title waits for the cloud to say whether it has a newer town (V1's S2). */
const CLOUD_WAIT_MS = 2500;

/** Her town kept: on the phone as she plays, and sealed in the cloud beside it (V1's S2). */
export interface Keeping {
  /** Her town as it is now, stamped, to be written. */
  currentSave(): SaveState;
  /** When her town was first saved. */
  createdAt(): number;
  autosave: AutoSaver;
  cloud: CloudSave;
  /** The key this phone made once for the cloud, if it could. */
  key: { code: string; made: boolean } | null;
  /** Whether the phone has said it will keep the game's storage. */
  persisted: Promise<boolean>;
  /** In from the title once the cloud has said (or a moment has passed), asked first if newer. */
  afterCloud(go: () => void): void;
  /** Straight in, past a title never shown (a dev build's `?skiptitle`). */
  pastTitle(): void;
}

/**
 * Keeps her town (decisions 25, 323): saved as she plays and as the page hides, a newer town in
 * the cloud offered once she's past the title, never swapped in silently. `hud` is read late: the
 * offer is only made once the HUD is up.
 */
export function keepTown(world: World, loaded: SaveState | null, hud: () => Hud): Keeping {
  // What was loaded is kept so `createdAt` survives; the rest is rebuilt from the town each save.
  let save: SaveState = loaded ?? newSave(Date.now(), world.snapshot());
  const currentSave = (): SaveState => {
    const now = Date.now();
    save = {
      ...save,
      updatedAt: now,
      lastPlayedAt: now,
      ...world.save(),
    };
    return save;
  };
  // Her town kept in the cloud too (V1's S2, decision 323), under a key this phone makes once.
  const key = cloudKey();
  const sealer = key ? sealerFor(key.code) : Promise.resolve(null);
  // A newer town in the cloud is offered once she's past the title, never swapped in silently.
  let pastTitle = false;
  let newerAt: number | null = null;
  const cloud = new CloudSave({
    sealer: () => sealer,
    fetch: (url, init) => fetch(url, init),
    now: () => Date.now(),
    online: () => navigator.onLine !== false,
    backedUp: (at) => markBackedUp(at),
    onNewer: (at) => (pastTitle ? offerCloudTown(at) : (newerAt = at)),
  });
  const checking = cloud.check(loaded?.updatedAt ?? 0);
  const autosave = new AutoSaver(() => {
    const written = currentSave();
    saveService.save(written);
    cloud.saved(written);
  });
  // `pagehide` is the one iOS reliably fires as a Home Screen app is swiped away; a tab being
  // hidden is the last moment anything is guaranteed to run at all.
  document.addEventListener('visibilitychange', () => {
    if (document.visibilityState === 'hidden') autosave.flush();
  });
  window.addEventListener('pagehide', () => autosave.flush());
  // After the save above: what's waiting for the cloud goes as the page hides, the game comes
  // back to the front, or the signal comes back.
  document.addEventListener('visibilitychange', () => {
    void cloud.flush(document.visibilityState === 'hidden');
  });
  window.addEventListener('pagehide', () => void cloud.flush(true));
  window.addEventListener('online', () => void cloud.flush());
  const persisted = requestPersistence();
  // The cloud's newer town, offered (V1's S2); `then` once it's settled, if she keeps hers.
  const offerCloudTown = (at: number, then?: () => void) =>
    offerCloud(
      hud().element,
      at,
      {
        async take() {
          const town = await cloud.newer();
          if (!town?.ok)
            return town?.reason ?? "The cloud's town couldn't be brought down just now.";
          autosave.stop();
          cloud.stop();
          saveService.save(town.save);
          location.reload();
          return null;
        },
        keep: () => cloud.keepMine(),
      },
      then,
    );
  // In from the title once the cloud has said (or a moment has passed), asked first if it's newer.
  const afterCloud = (go: () => void) => {
    const waited = new Promise((done) => setTimeout(done, CLOUD_WAIT_MS));
    void Promise.race([checking, waited]).then(() => {
      pastTitle = true;
      const at = newerAt;
      newerAt = null;
      if (at === null) go();
      else offerCloudTown(at, go);
    });
  };
  return {
    currentSave,
    createdAt: () => save.createdAt,
    autosave,
    cloud,
    key,
    persisted,
    afterCloud,
    pastTitle: () => (pastTitle = true),
  };
}
