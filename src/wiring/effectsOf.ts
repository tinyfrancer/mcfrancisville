import { TILE_SIZE } from '../config/world';
import { EGG_ITEM } from '../data/holidays';
import type { Ware } from '../data/shop';
import type { Made } from '../data/recipes';
import type { VisitGift } from '../data/visits';
import { CAST_MS } from '../systems/fishing';
import { SPRINKLER } from '../systems/beds';
import { PROP_ART } from '../sprites/props';
import type { Anchor, Effect, PopIcon } from '../render/effects';
import { LANDING_MS } from '../render/transition';
import type { Point } from '../render/camera';
import type { PropId } from '../types/ids';
import type { TileBox, WorldEvent } from '../world/events';

/**
 * What each moment looks like in the world (V1's E1, decision 280): the effects
 * `wiring/moments.ts` pushes for it. The world says what happened and where; this says what it
 * looks like, so the world never names an effect and a new look is a line here.
 */

/** Where things are as a moment plays, in world pixels. */
export interface Placing {
  /** Her, at her tile's centre when she stands. */
  her: Point;
  /** What she walked up to in this batch of moments, and which prop, if it was one. */
  toward: { box: TileBox; prop?: PropId } | null;
  /** Where her float sits on the water, while her line is in. */
  float: Point | null;
}

/** Which button in the HUD bumps as something comes to it. */
export type Bump = 'bag' | 'purse';

/** Her feet, a little under her tile's centre, where dust is kicked up. */
const FEET = 13;

const over = { her: true } as const;
const emote = (e: Extract<Effect, { kind: 'emote' }>['emote'], on: Anchor = over): Effect => ({
  kind: 'emote',
  emote: e,
  over: on,
});
const burst = (
  particle: Extract<Effect, { kind: 'burst' }>['particle'],
  at: Anchor,
  count?: number,
  spread?: number,
): Effect => ({
  kind: 'burst',
  particle,
  at,
  ...(count !== undefined && { count }),
  ...(spread !== undefined && { spread }),
});
const pop = (icon: PopIcon, count: number, from: Anchor, delayMs?: number): Effect => ({
  kind: 'pop',
  icon,
  count,
  from,
  ...(delayMs !== undefined && { delayMs }),
});

/** The middle of a box of tiles, on the ground. */
function middle(box: TileBox): Point {
  return { x: (box.tx + box.w / 2) * TILE_SIZE, y: (box.ty + box.h / 2) * TILE_SIZE };
}

/** Halfway up a prop's picture (a tree's trunk), and its crown, the top third of it. */
function heights(
  box: TileBox,
  prop: PropId | undefined,
): { mid: Point; crown: Point; wide: number } {
  const foot = (box.ty + box.h) * TILE_SIZE;
  const x = (box.tx + box.w / 2) * TILE_SIZE;
  const rows = prop ? PROP_ART[prop].source.rows : null;
  const tall = rows ? rows.length : box.h * TILE_SIZE;
  const wide = rows ? (rows[0]?.length ?? TILE_SIZE) : box.w * TILE_SIZE;
  return { mid: { x, y: foot - tall / 2 }, crown: { x, y: foot - tall * 0.7 }, wide };
}

const leafy = (prop: string) => /tree|willow/i.test(prop);
const stony = (prop: string) => /rock|stone|boulder/i.test(prop);

/** A shop's ware, a letter's gift, or what a visit brought, as a pop shows it. */
function wareIcon(ware: Ware): PopIcon {
  return 'item' in ware ? { item: ware.item } : { parcel: true };
}

function madeIcon(made: Made): PopIcon | null {
  if ('item' in made) return { item: made.item };
  if ('furniture' in made) return { parcel: true };
  return null;
}

function giftIcon(gift: VisitGift): { icon: PopIcon; count: number } {
  if ('candy' in gift) return { icon: { candy: true }, count: gift.candy };
  if ('item' in gift) return { icon: { item: gift.item }, count: gift.count };
  return { icon: { parcel: true }, count: 1 };
}

/** The effects a moment shows, where. Many moments show none: the toast or sheet is theirs. */
export function effectsOf(event: WorldEvent, at: Placing): Effect[] {
  const feet: Point = { x: at.her.x, y: at.her.y + FEET };
  const head: Point = { x: at.her.x, y: at.her.y - 30 };
  const box = at.toward?.box ?? null;
  const there = box ? middle(box) : feet;
  const shape = box ? heights(box, at.toward?.prop) : null;
  const source = shape?.mid ?? feet;
  switch (event.kind) {
    case 'gathered': {
      const from = event.from;
      const shown: Effect[] = [];
      if (shape && leafy(from)) shown.push(burst('leaf', shape.crown, 7, shape.wide / 3));
      else if (shape && stony(from)) shown.push(burst('dust', there, 6, 10));
      else if (from === 'flowers') shown.push(burst('leaf', feet, 4, 8));
      else shown.push(burst('sparkle', from === 'snack' || from === 'bone' ? feet : source, 4));
      shown.push(pop({ item: event.item }, event.count, from === 'flowers' ? feet : source));
      if (event.bead) shown.push(pop({ item: event.bead }, 1, source));
      return shown;
    }
    case 'resting':
    case 'letGo':
    case 'reeled':
    case 'shut':
    case 'refused':
      return [emote('…')];
    case 'tilled':
    case 'bare':
      return [burst('dust', middle({ tx: event.tx, ty: event.ty, w: 1, h: 1 }), 6, 10)];
    case 'planted': {
      const bed = middle({ tx: event.tx, ty: event.ty, w: 1, h: 1 });
      return [burst('dust', bed, 4, 8), burst('leaf', bed, 2, 4)];
    }
    case 'sowedRow':
      return [burst('dust', feet, 5, 10), emote('♪')];
    case 'fitted':
      return [burst('sparkle', there, 4)];
    case 'unfitted':
      return [burst('dust', there, 4, 8), pop({ item: SPRINKLER }, 1, there)];
    case 'watered':
      return [burst('splash', there, 7, 8)];
    case 'growing':
      return [burst('sparkle', there, 3, 10)];
    case 'harvested': {
      const shown: Effect[] = [
        burst('leaf', there, 5, 10),
        pop({ item: event.item }, event.count, there),
      ];
      if (event.first) shown.push(burst('sparkle', head, 6, 16), emote('!'));
      return shown;
    }
    case 'bought':
      return [pop(wareIcon(event.ware), 1, over)];
    case 'snackBought':
      return [pop({ item: event.item }, 1, over)];
    case 'ordered':
      return [emote('♪')];
    case 'carved':
      return event.first ? [burst('confetti', head), emote('!')] : [burst('sparkle', head, 5, 16)];
    case 'delivered':
    case 'wesDropped':
      return [emote('!')];
    case 'mail':
      return [emote('!')];
    case 'shelved':
      return [burst('confetti', head), burst('sparkle', head, 6, 18)];
    case 'answered':
      return [burst('coin', head), pop({ candy: true }, event.candy, over)];
    case 'sold':
      return [burst('coin', head), pop({ candy: true }, event.candy, over)];
    case 'stallSold':
      return [burst('coin', there), pop({ candy: true }, event.candy, there)];
    case 'made': {
      const icon = madeIcon(event.made);
      return icon ? [burst('sparkle', head, 5, 16), pop(icon, 1, over)] : [burst('confetti', head)];
    }
    case 'cooked':
      return [burst('sparkle', head, 4, 14), pop({ item: event.item }, 1, over)];
    case 'baked':
      return [
        burst('sparkle', head, 4, 14),
        pop({ item: event.item }, 1, over),
        pop({ candy: true }, event.candy, over),
      ];
    case 'ate':
      return [emote('♥')];
    case 'caught': {
      const from = box ? there : (at.float ?? source);
      const shown: Effect[] = [pop({ item: event.critter }, 1, from)];
      if (event.first) shown.push(burst('sparkle', head, 6, 16), emote('!'));
      return shown;
    }
    case 'fled':
      return [burst('dust', there, 4, 8), emote('…')];
    case 'cast':
      return at.float ? [{ ...burst('splash', at.float, 6, 3), delayMs: CAST_MS }] : [];
    case 'nibble':
      return at.float ? [burst('splash', at.float, 2, 2)] : [];
    case 'bite':
      return at.float ? [burst('splash', at.float, 5, 3), emote('!')] : [emote('!')];
    case 'potted':
      return [burst('leaf', there, 6, 10), emote('♪')];
    case 'dug':
      return [burst('dust', there, 7, 10), pop({ item: event.item }, 1, there)];
    case 'unearthed': {
      const find = event.find;
      const icon: PopIcon =
        'fossil' in find
          ? { item: find.fossil }
          : 'bead' in find
            ? { item: find.bead }
            : { candy: true };
      const shown: Effect[] = [
        burst('dust', there, 7, 10),
        pop(icon, 'candy' in find ? find.candy : 1, there),
      ];
      if (event.first) shown.push(burst('sparkle', head, 6, 16), emote('!'));
      return shown;
    }
    case 'visit': {
      const { icon, count } = giftIcon(event.gift);
      return [pop(icon, count, over), emote('♥')];
    }
    case 'shook': {
      const crown = shape?.crown ?? head;
      if (event.back) return [burst('leaf', crown, 3, 12), emote('…')];
      const shown: Effect[] = [burst('leaf', crown, 8, (shape?.wide ?? 32) / 3)];
      if (event.candy > 0) shown.push(pop({ candy: true }, event.candy, crown));
      if (event.sweet) shown.push(pop({ item: event.sweet }, 1, crown));
      if (event.sapling) shown.push(pop({ item: 'candySapling' }, 1, crown));
      return shown;
    }
    case 'sapling':
      if (event.did === 'planted') return [burst('dust', there, 5, 10), burst('leaf', there, 3, 6)];
      if (event.did === 'growing') return [burst('sparkle', there, 3, 10)];
      return [emote('?')];
    case 'tossed':
      return event.landed ? [burst('sparkle', head, 3, 12)] : [emote('…')];
    case 'won':
      return event.top
        ? [burst('confetti', head), pop({ item: event.item }, 1, over)]
        : [pop({ item: event.item }, 1, over)];
    case 'readFortune':
      return [burst('sparkle', head, 6, 18), emote('♪')];
    case 'patch':
      if (event.picked)
        return [burst('leaf', there, 6, 14), pop({ item: 'patchPumpkin' }, 1, there)];
      return [emote('…')];
    case 'foundLost':
      return [burst('sparkle', feet, 5, 10), emote('!')];
    case 'decorated':
      return [burst('confetti', head), emote('♪')];
    case 'frozen':
      return [burst('sparkle', head, 6, 20), emote('♪')];
    case 'dressedUp':
    case 'played':
    case 'tune':
      return [emote('♪')];
    case 'foundEgg': {
      const shown: Effect[] = [burst('sparkle', feet, 5, 10), pop({ item: EGG_ITEM }, 1, feet)];
      if (event.left === 0) shown.push(burst('confetti', head));
      return shown;
    }
    case 'trickOrTreat':
      return [pop({ item: event.item }, 1, box ? there : over), emote('♥')];
    case 'keepsake':
      return [burst('sparkle', there, 6, 14), emote('♥')];
    case 'clue':
      return [burst('sparkle', head, 4, 14), emote('?')];
    case 'wesGone':
      return [emote('?')];
    // V1's P3a: he'll stay next time; and his chat is the sheet's.
    case 'wesStays':
      return [emote('!')];
    case 'wesChat':
      return [];
    case 'crowned':
      return [
        burst('confetti', { villager: event.villager }),
        emote('♥', { villager: event.villager }),
      ];
    case 'gave': {
      const them = { villager: event.villager };
      if (event.reaction === 'loved') return [burst('heart', them), emote('♥', them)];
      return [emote(event.reaction === 'liked' ? '♥' : '♪', them)];
    }
    case 'flew':
      // Seen as she lands, once her broom has swooped off and the iris has closed (V1's E4).
      return [burst('dust', feet, 7, 12), burst('sparkle', head, 4, 16)].map((e) => ({
        ...e,
        delayMs: LANDING_MS,
      }));
    case 'found':
      return [burst('sparkle', head, 6, 18), emote('!')];
    case 'opened':
      return [burst('sparkle', head, 5, 16)];
    case 'slipped':
      return [burst('dust', feet, 6, 10), emote('!')];
    // Theirs is elsewhere: a sheet or the walk (`arrived`), the photo's flash card, the fade
    // in (`entered`), the weather and the window's turn drawn by their own layers.
    case 'arrived':
    case 'photo':
    case 'entered':
    case 'window':
    case 'weather':
    case 'thunder':
      return [];
  }
}

/** Which HUD button a moment fills: the bag for a thing, the purse for Candy. */
export function bumpsOf(event: WorldEvent): Bump[] {
  switch (event.kind) {
    case 'gathered':
    case 'harvested':
    case 'caught':
    case 'dug':
    case 'cooked':
    case 'won':
    case 'snackBought':
    case 'trickOrTreat':
    case 'foundEgg':
    case 'unfitted':
      return ['bag'];
    case 'patch':
      return event.picked ? ['bag'] : [];
    case 'bought':
      return 'item' in event.ware ? ['bag'] : [];
    case 'made':
      return 'item' in event.made ? ['bag'] : [];
    case 'sold':
    case 'answered':
    case 'stallSold':
      return ['purse'];
    case 'baked':
      return ['bag', 'purse'];
    case 'unearthed':
      return 'candy' in event.find ? ['purse'] : ['bag'];
    case 'shook':
      return [
        ...(event.candy > 0 ? (['purse'] as const) : []),
        ...(event.sweet || event.sapling ? (['bag'] as const) : []),
      ];
    case 'visit':
      return 'candy' in event.gift ? ['purse'] : 'item' in event.gift ? ['bag'] : [];
    default:
      return [];
  }
}
