import { CROPS } from '../data/crops';
import { FLOORINGS, FURNITURE, WALLPAPERS } from '../data/furniture';
import { ITEMS } from '../data/items';
import { OUTFITS } from '../data/outfits';
import type { Ware } from '../data/shop';
import type { Refusal } from '../systems/decor';
import type { ItemId } from '../types/ids';
import type { WorldEvent } from '../world/Town';

export interface Toast {
  text: string;
  /** Something worth a little fuss: the night's snack, a blue rose. Shown in candlelight. */
  special?: true;
  /** Shown before the text. */
  icon?: string;
}

/** "2 forget-me-boos", "1 wood", in a sentence. A record keeps its band's name as it's written. */
export function quantity(item: ItemId, count: number): string {
  const row = ITEMS[item];
  const one = row.kind === 'record' ? row.name : row.name.toLowerCase();
  if (count === 1 || row.kind === 'material') return `${count} ${one}`;
  return `${count} ${row.plural ?? `${one}s`}`;
}

/** "Ripe tomorrow!", "Ripe in 3 days!" */
function ripeIn(days: number): string {
  return days <= 1 ? 'Ripe tomorrow!' : `Ripe in ${days} days!`;
}

const BLUE_ROSE: Toast = {
  text: 'A blue rose! The rarest bloom in McFrancisVille.',
  special: true,
  icon: '💙',
};

/** What the sign at the farm gate says when she walks up to it. */
export const FARM_SIGN: Toast = {
  text: 'Welcome to Hosta La Vista Farm! Nothing here ever wilts.',
  special: true,
  icon: '🌿',
};

/** When she's at an empty bed with no seeds; every harvest gives one back, so it's rare. */
export const NO_SEEDS: Toast = {
  text: "You're out of seeds for now. Every harvest gives one back, so check what's growing!",
};

/** Candy, as it's written on a price or a purse. */
export function candy(amount: number): string {
  return `🍬 ${amount}`;
}

/** What a shop says as she buys something: where it went. */
export function boughtLine(ware: Ware): string {
  if ('item' in ware) return `${ITEMS[ware.item].name}, into your bag!`;
  if ('furniture' in ware) {
    return `${FURNITURE[ware.furniture].name}, into your storage chest at home!`;
  }
  if ('wallpaper' in ware) {
    return `${WALLPAPERS[ware.wallpaper].name} wallpaper, yours! Put it up from 🛋️ at home.`;
  }
  if ('flooring' in ware) {
    return `${FLOORINGS[ware.flooring].name} flooring, yours! Lay it from 🛋️ at home.`;
  }
  const name = OUTFITS[ware.outfit].name;
  const them = /[^s]s$/.test(name) ? 'them' : 'it';
  return `${name}, into your closet! Try ${them} on from the 👗.`;
}

/** What Cobweb Corner says as it buys something from her. */
export function soldLine(item: ItemId, count: number, paid: number): string {
  return `Sold ${quantity(item, count)} for ${paid} Candy. Thank you kindly!`;
}

/** Why the shop won't take something: only purse butter, which is priceless. */
export const WONT_BUY =
  "Nobody's buying your purse butter. It's far too precious (and a little squashed).";

/** Why a piece won't go where she tried to put it while decorating. */
const REFUSED: Record<Refusal, string> = {
  noRoom: "That won't fit there. Try somewhere with a little more room.",
  standing: "You're standing right there! Try a spot beside you.",
  blocking: 'That would block the way. Leave a path to the door and the chest.',
};

/** What the HUD says about a moment in town: a find, a bed tended, or a promise of tomorrow. */
export function eventToast(event: WorldEvent): Toast | null {
  switch (event.kind) {
    case 'gathered':
      return gatheredToast(event.from, event.item, event.count);
    case 'resting':
      return restingToast(event.from);
    case 'tilled':
      return { text: 'You tilled a fresh bed. Ready for planting!' };
    case 'planted':
      return {
        text: `You planted a ${ITEMS[CROPS[event.crop].seed].name.toLowerCase()}. Tap it again to water it.`,
      };
    case 'watered':
      return { text: `You watered the ${CROPS[event.crop].name}. ${ripeIn(event.days)}` };
    case 'growing':
      return {
        text: `The ${CROPS[event.crop].name} had a drink today. ${ripeIn(event.days)}`,
      };
    case 'arrived': {
      const says = event.piece && FURNITURE[event.piece].says;
      return says ? { text: says } : null;
    }
    case 'played':
      return event.record
        ? { text: `You put on the ${ITEMS[event.record].name}. What a tune!`, icon: '🎶' }
        : { text: 'No records yet! Cobweb Corner sells one most days.' };
    case 'refused':
      return { text: REFUSED[event.why] };
    case 'harvested':
      if (event.item === 'blueRose') return BLUE_ROSE;
      if (event.item === 'pumpkin') {
        return { text: 'A big, proper pumpkin! And a seed saved to plant again.' };
      }
      return { text: `You picked ${quantity(event.item, event.count)}, and saved a seed.` };
    default:
      return null;
  }
}

function gatheredToast(from: string, item: ItemId, count: number): Toast {
  const what = quantity(item, count);
  if (item === 'blueRose') return BLUE_ROSE;
  switch (from) {
    case 'tree':
      return { text: `The tree shook loose ${what}.` };
    case 'rock':
      return { text: `You chipped off ${what}.` };
    case 'flowers':
      return { text: `You picked ${what}!` };
    case 'roseBush':
      return { text: `The rose bush gave you ${what}.` };
    case 'snack':
      return {
        text: `Late-night snackies! A ${ITEMS[item].name.toLowerCase()}, just for you.`,
        special: true,
        icon: '🌙',
      };
    default:
      return { text: `You found ${what}.` };
  }
}

function restingToast(from: string): Toast {
  switch (from) {
    case 'tree':
      return { text: 'This tree has shared all its wood today. More tomorrow!' };
    case 'rock':
      return { text: 'This rock is all chipped out for today.' };
    case 'flowers':
      return { text: "Just sprouts for now. They'll bloom again tomorrow." };
    case 'roseBush':
      return { text: 'Just buds today. The roses will open again tomorrow.' };
    default:
      return { text: 'Nothing more here today. Come back tomorrow!' };
  }
}
