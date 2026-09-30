import { CUES, cueOf } from '../audio/cues';
import { isRecord, RECORD_TUNES } from '../audio/records';
import type { SoundBoard } from '../audio/SoundBoard';
import type { Hud } from '../hud/Hud';
import { eventToast, NO_SEEDS } from '../hud/messages';
import type { World, WorldEvent } from '../world/World';
import { seedsIn, type Waiting } from './apis';

/** What the moments are played on. */
export interface Stage {
  world: World;
  hud: Hud;
  sound: SoundBoard;
  /** Something changed that the next save should keep. */
  changed: () => void;
  waiting: Waiting;
}

/**
 * Plays the world's moments: each one's cue, the sheet it opens (a shop, a neighbour, the seeds),
 * and its toast. The loop's moments and a sheet's own come through here alike.
 */
export function playMoments(events: readonly WorldEvent[], stage: Stage): void {
  const { world, hud, sound, changed, waiting } = stage;
  for (const event of events) {
    changed();
    const cue = cueOf(event);
    if (cue) sound.cue(CUES[cue]);
    if (event.kind === 'played' && event.record && isRecord(event.record)) {
      sound.playRecord(RECORD_TUNES[event.record]);
    }
    if (event.kind === 'entered') hud.fade();
    if (event.kind === 'entered' && event.scene !== 'home') sound.stopRecord();
    if (event.kind === 'arrived' && event.opens) {
      const opens = event.opens;
      if ('shop' in opens) hud.openShop(opens.shop);
      else if (opens.sheet === 'salon') hud.openSalon();
      else if (opens.sheet === 'stove') hud.openStove();
      else hud.openMuseum();
    }
    if (event.kind === 'arrived' && event.at === 'popUpShop') hud.openShop('popUp');
    if (event.kind === 'arrived' && event.at === 'mailbox') hud.openMail();
    if (event.kind === 'arrived' && event.at === 'noticeboard') hud.openNotices();
    if (event.kind === 'arrived' && event.at === 'honestyStall') hud.openStall();
    if (event.kind === 'arrived' && event.at === 'moonPieCart') hud.openShop('moonPie');
    // With a sheet already up, she can't talk now, so they needn't wait for her.
    if (event.kind === 'arrived' && event.villager && !hud.openTalk(event.villager)) {
      world.neighbourhood.endTalk();
    }
    if (event.kind === 'arrived' && event.pet && !hud.openPet(event.pet)) world.petCare.endPet();
    if (event.kind === 'arrived' && event.at === 'storageChest') hud.openStorage();
    if (event.kind === 'arrived' && event.piece === 'workbench') hud.openWorkbench();
    if (event.kind === 'arrived' && event.piece === 'stove') hud.openStove();
    if (event.kind === 'arrived' && event.piece === 'broomStand') hud.openBroom();
    if (event.kind === 'arrived' && event.piece === 'mysteryCorkboard') hud.openCorkboard();
    if (event.kind === 'tilled' || event.kind === 'bare') {
      waiting.bed = { tx: event.tx, ty: event.ty };
      // The sheet says it all; a toast behind it would only be half seen.
      if (seedsIn(world).length > 0) {
        hud.openSeeds();
        continue;
      }
      if (event.kind === 'bare') {
        hud.toast(NO_SEEDS);
        continue;
      }
    }
    const toast = eventToast(event);
    if (toast) hud.toast(toast);
  }
}
