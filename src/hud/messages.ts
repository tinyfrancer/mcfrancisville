import { CRITTERS } from '../data/critters';
import { CROPS } from '../data/crops';
import { FLOORINGS, FURNITURE, WALLPAPERS } from '../data/furniture';
import { ITEMS } from '../data/items';
import { OUTFITS } from '../data/outfits';
import { ACCESSORIES } from '../data/pets';
import { recipeName, type Made } from '../data/recipes';
import type { Ware } from '../data/shop';
import type { Refusal } from '../systems/decor';
import type { Sender } from '../systems/friendship';
import { CLUES, WES_GONE } from '../data/mystery';
import { VILLAGERS } from '../data/villagers';
import { ZONES } from '../data/zones';
import { HOUSES, isHouse } from '../data/houses';
import type { CritterId, ItemId, PropId } from '../types/ids';
import type { WorldEvent } from '../world/World';

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

/**
 * What she finds on walking up to something with nothing to open: a sign, Skelly, a neighbour's
 * door while it's shut. Null for anything that opens a sheet or says nothing.
 */
export function arrivalToast(at: PropId): Toast | null {
  if (at === 'farmSign') return FARM_SIGN;
  if (at === 'skelly') return { text: 'Skelly.', icon: '💀' };
  if (isHouse(at)) return { text: `${HOUSES[at].name}. ${HOUSES[at].shut}`, icon: '🏠' };
  return null;
}

/** Who a letter is from, as it's signed. */
export function senderName(from: Sender): string {
  if (from === 'mayor') return 'the Mayor';
  return from === 'everyone' ? 'everyone in town' : VILLAGERS[from].name;
}

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
  if ('recipe' in ware) {
    return `Recipe learned: ${recipeName(ware.recipe)}! Make it at your workbench at home.`;
  }
  if ('accessory' in ware) {
    return `${ACCESSORIES[ware.accessory].name}, yours! Dress a pet in it by walking up to them.`;
  }
  const name = OUTFITS[ware.outfit].name;
  const them = /[^s]s$/.test(name) ? 'them' : 'it';
  return `${name}, into your closet! Try ${them} on from the 👗.`;
}

/** What the workbench says as she makes something: what it was, and where it went. */
export function madeToast(made: Made): Toast {
  if ('room' in made) {
    return {
      text: 'Your home grew! So much more room for everything.',
      special: true,
      icon: '🏡',
    };
  }
  if ('item' in made) {
    return { text: `${ITEMS[made.item].name}, made! It's in your bag.`, icon: '✨' };
  }
  const name = FURNITURE[made.furniture].name;
  return { text: `${name}, made! It's waiting in your storage chest.`, icon: '✨' };
}

/** What Cobweb Corner says as it buys something from her. */
export function soldLine(item: ItemId, count: number, paid: number): string {
  return `Sold ${quantity(item, count)} for ${paid} Candy. Thank you kindly!`;
}

/** Why the shop won't take something: purse butter, which is priceless, and Fibi's bones. */
export function wontBuy(item: ItemId): string {
  if (item === 'fibisBone')
    return "That's Fibi's! She'd miss it terribly. Bring it home to her instead.";
  if (item === 'iceSkates') return 'Your first-date skates? Not for all the candy in town.';
  return "Nobody's buying your purse butter. It's far too precious (and a little squashed).";
}

/** Why a piece won't go where she tried to put it while decorating. */
const REFUSED: Record<Refusal, string> = {
  noRoom: "That won't fit there. Try somewhere with a little more room.",
  standing: "You're standing right there! Try a spot beside you.",
  blocking: 'That would block the way. Leave a path to the door and the chest.',
};

/** What the HUD says about a moment in town: a find, a bed tended, or a promise of tomorrow. */
export function eventToast(event: WorldEvent): Toast | null {
  switch (event.kind) {
    case 'gathered': {
      const toast = gatheredToast(event.from, event.item, event.count);
      return event.bead ? withBead(toast, event.bead) : toast;
    }
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
      return event.says ? { text: event.says } : null;
    }
    case 'played':
      if (event.dance) {
        return {
          text: `You put on the ${ITEMS[event.record!].name}, and dance! Cody hears it from next door and comes over to dance with you.`,
          special: true,
          icon: '💃',
        };
      }
      return event.record
        ? { text: `You put on the ${ITEMS[event.record].name}. What a tune!`, icon: '🎶' }
        : { text: 'No records yet! Cobweb Corner sells one most days.' };
    case 'refused':
      return { text: REFUSED[event.why] };
    case 'mail':
      return {
        text: `A letter from ${senderName(event.from)} is waiting in your mailbox!`,
        special: true,
        icon: '💌',
      };
    case 'made':
      return madeToast(event.made);
    case 'clue':
      return {
        text: `A clue! ${CLUES[event.clue].title}. Pinned to the corkboard at home.`,
        special: true,
        icon: '📌',
      };
    case 'found':
      return {
        text: `You found ${ZONES[event.zone].name}! It's on your map now.`,
        special: true,
        icon: '🗺️',
      };
    case 'opened':
      return { text: ZONES[event.zone].opened ?? '', special: true, icon: '✨' };
    case 'shut':
      return { text: ZONES[event.zone].shut ?? '' };
    case 'wesGone':
      return { text: WES_GONE[event.line % WES_GONE.length]!, icon: '🕵️' };
    case 'caught':
      return caughtToast(event.critter, event.first);
    case 'fled':
      return {
        text: `The ${CRITTERS[event.critter].name.toLowerCase()} fluttered off! It hasn't gone far. Try again?`,
      };
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

/** A critter in her net: a fuss for a new one, and a word about the rare ones. */
export function caughtToast(critter: CritterId, first: boolean): Toast {
  const row = CRITTERS[critter];
  const name = row.name.toLowerCase();
  const a = /^[aeiou]/.test(name) ? 'an' : 'a';
  const what = critter === 'orbPair' ? 'a pair of orbs! Forever orbs.' : `${a} ${name}!`;
  if (first) {
    return { text: `You caught ${what} New in your Curiosity Cabinet.`, special: true, icon: '🦋' };
  }
  if (row.rarity === 'rare')
    return { text: `You caught ${what} What luck!`, special: true, icon: '✨' };
  return { text: `You caught ${what}` };
}

/** A find with a bead found as well, tucked in the stone or dropped from the branches. */
function withBead(toast: Toast, bead: ItemId): Toast {
  const name = ITEMS[bead].name;
  const one = bead === 'loveBeads' ? `some ${name}` : `a ${name.toLowerCase()}`;
  return { text: `${toast.text} And look, ${one}!`, icon: '📿' };
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
    case 'bone':
      return {
        text: "One of Fibi's bones! She'll be so happy to have it back.",
        special: true,
        icon: '🦴',
      };
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
