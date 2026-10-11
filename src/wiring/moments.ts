import { CUES, cueOf } from '../audio/cues';
import { isRecord, RECORD_TUNES } from '../audio/records';
import { PIANO_TUNES } from '../audio/pianos';
import type { SoundBoard } from '../audio/SoundBoard';
import type { Hud } from '../hud/Hud';
import { eventToast, MARKET_SHUT, NO_SEEDS } from '../hud/messages';
import { isDisplayPiece } from '../data/display';
import type { World, WorldEvent } from '../world/World';
import type { Tile } from '../systems/pathfinding';
import { seedsIn, type Waiting } from './apis';
import type { Effects } from '../render/effects';
import type { Transitions } from '../render/transition';
import { tileCentre } from '../world/World';
import { bumpsOf, effectsOf, type Placing } from './effectsOf';

/** What the moments are played on. */
export interface Stage {
  world: World;
  hud: Hud;
  sound: SoundBoard;
  /** Something changed that the next save should keep. */
  changed: () => void;
  waiting: Waiting;
  /** A photo of whoever stands on these tiles, from the view she's in (0.2's J4). */
  snapshot: (tiles: readonly Tile[]) => HTMLCanvasElement | null;
  /** What each moment looks like where it happens (V1's E1). */
  effects: Effects;
  /** The iris, the broom's flight and a window's wash (V1's E4); without, a place fades in. */
  transitions?: Transitions;
}

/**
 * Plays the world's moments: each one's cue, the sheet it opens (a shop, a neighbour, the seeds),
 * and its toast. The loop's moments and a sheet's own come through here alike.
 */
export function playMoments(events: readonly WorldEvent[], stage: Stage): void {
  const { world, hud, sound, changed, waiting, snapshot, effects, transitions } = stage;
  let toward: Placing['toward'] = null;
  for (const event of events) {
    changed();
    // Seen where it happens (V1's E1): from what she walked up to, if she walked up to something.
    if (event.kind === 'arrived' && event.toward) {
      toward = { box: event.toward, ...(event.at && { prop: event.at }) };
    }
    const line = world.fishing.line;
    const placing: Placing = {
      her: { x: world.player.x, y: world.player.y },
      toward,
      float: line ? tileCentre(line) : null,
    };
    for (const effect of effectsOf(event, placing)) effects.push(world.scene, effect);
    for (const bump of bumpsOf(event)) hud.bump(bump);
    const cue = cueOf(event);
    if (cue) sound.cue(CUES[cue]);
    if (event.kind === 'played' && event.record && isRecord(event.record)) {
      sound.playRecord(RECORD_TUNES[event.record]);
    }
    if (event.kind === 'tune') sound.playRecord(PIANO_TUNES[event.tune]);
    if (event.kind === 'entered' && !transitions) hud.fade();
    // Between places, and as the day turns (V1's E4): the view's, never the world's.
    if (event.kind === 'flew') transitions?.flew(world);
    if (event.kind === 'entered') transitions?.entered();
    if (event.kind === 'window') transitions?.windowTurned(event.window);
    if (event.kind === 'photo') {
      const them = world.neighbourhood.neighbour(event.with).tile;
      const picture = snapshot([world.movement.tile, them]);
      if (picture) hud.photo(picture, event.caption);
    }
    if (event.kind === 'entered' && event.scene !== 'home') sound.stopRecord();
    if (event.kind === 'arrived' && event.opens) {
      const opens = event.opens;
      // An activity's (the fortune table's) is opened below, with the fairground's stalls.
      if ('shop' in opens) hud.openShop(opens.shop);
      else if ('sheet' in opens && opens.sheet === 'salon') hud.openSalon();
      else if ('sheet' in opens && opens.sheet === 'stove') hud.openStove();
      else if ('sheet' in opens && opens.sheet === 'catalogue') hud.openCatalogue();
      else if ('sheet' in opens) hud.openMuseum();
    }
    if (event.kind === 'arrived' && event.at === 'popUpShop') hud.openShop('popUp');
    if (event.kind === 'arrived' && event.at === 'mailbox') hud.openMail();
    if (event.kind === 'arrived' && event.at === 'noticeboard') hud.openNotices();
    if (event.kind === 'arrived' && event.at === 'honestyStall') hud.openStall();
    if (event.kind === 'arrived' && event.at === 'moonPieCart') hud.openShop('moonPie');
    if (event.kind === 'arrived' && event.at === 'seedCart') hud.openShop('seeds');
    if (event.kind === 'arrived' && event.at === 'barn') hud.openBarn();
    // Market day's stall by the fairground's stage (0.2's M3): its table, or when it's out.
    if (event.kind === 'arrived' && event.at === 'marketStall') {
      if (world.shops.isOpen('market')) hud.openShop('market');
      else hud.toast(MARKET_SHUT);
    }
    // The fairground's stalls and the fortune table (0.2's M2): open, or when they will be.
    const activity = event.kind === 'arrived' ? world.activities.at(event) : null;
    if (activity && world.activities.isOpen(activity)) hud.openFair(activity);
    else if (activity) hud.toast({ text: world.activities.closed(activity) });
    // With a sheet already up, she can't talk now, so they needn't wait for her.
    if (event.kind === 'arrived' && event.villager && !hud.openTalk(event.villager)) {
      world.neighbourhood.endTalk();
    }
    if (event.kind === 'arrived' && event.pet && !hud.openPet(event.pet)) world.petCare.endPet();
    if (event.kind === 'arrived' && event.at === 'storageChest') hud.openStorage();
    if (event.kind === 'arrived' && event.piece && isDisplayPiece(event.piece)) hud.openDisplay();
    if (event.kind === 'arrived' && event.piece === 'workbench') hud.openWorkbench();
    if (event.kind === 'arrived' && event.piece === 'stove') hud.openStove();
    if (event.kind === 'arrived' && event.piece === 'broomStand') hud.openBroom();
    if (event.kind === 'arrived' && event.piece === 'mysteryCorkboard') hud.openCorkboard();
    if (event.kind === 'wesChat') hud.openWes(event.lines);
    if (event.kind === 'tilled' || event.kind === 'bare') {
      waiting.bed = { zone: world.scene, tx: event.tx, ty: event.ty };
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
