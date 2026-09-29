import { CRITTERS, isFish } from '../data/critters';
import { CROPS } from '../data/crops';
import { FLOORINGS, FURNITURE, WALLPAPERS } from '../data/furniture';
import { ITEMS } from '../data/items';
import { OUTFITS } from '../data/outfits';
import { ACCESSORIES } from '../data/pets';
import { RECIPES, recipeName, type Made } from '../data/recipes';
import type { Effect } from '../data/dishes';
import type { Ware } from '../data/shop';
import { CALENDAR, type CalendarId } from '../data/calendar';
import type { DayWindow } from '../systems/clock';
import type { Refusal } from '../systems/decor';
import type { Sender } from '../systems/friendship';
import { CLUES, WES_GONE } from '../data/mystery';
import { VILLAGERS } from '../data/villagers';
import { ZONES } from '../data/zones';
import { HAPPENINGS } from '../data/happenings';
import { INTERIORS, isInterior } from '../data/interiors';
import { POT_PLANTS } from '../data/porch';
import { BURIED } from '../data/buried';
import type { VisitGift } from '../data/visits';
import { isMilestone } from '../systems/visits';
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

/** "a pumpkin", "an owl-eye moth", "3 moonpetals": what someone asks for, in a sentence. */
export function asked(item: ItemId, count: number): string {
  const row = ITEMS[item];
  if (count !== 1 || row.kind === 'material' || row.kind === 'record') {
    return quantity(item, count);
  }
  const one = row.name.toLowerCase();
  return `${/^[aeiou]/.test(one) ? 'an' : 'a'} ${one}`;
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
 * What she finds on walking up to something with nothing to open: a sign, or Skelly. Null for
 * anything that opens a sheet or says nothing.
 */
export function arrivalToast(at: PropId): Toast | null {
  if (at === 'farmSign') return FARM_SIGN;
  if (at === 'skelly') return { text: 'Skelly.', icon: '💀' };
  if (at === 'castle') {
    return {
      text:
        'The great door of Castle Mac-A-Boo is shut, with a note pinned to it: "Closed for ' +
        'dusting. Please admire the butterflies."',
      icon: '🏰',
    };
  }
  if (at === 'weddingArch') {
    return {
      text: 'An arch of roses and orange ribbons. A monarch lands on your shoulder, just for a moment.',
      special: true,
      icon: '🦋',
    };
  }
  if (at === 'rowboat')
    return { text: 'A little rowboat, tied up snug. Someday, a row round the lake.' };
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

/** "till this evening", "till morning": how long something she ate keeps doing its thing. */
export function tillWhen(until: DayWindow): string {
  return until === 'morning' ? 'till morning' : `till this ${until}`;
}

/** What a lure brings out, in a sentence. */
const LURED: Record<Exclude<Effect, 'pep' | 'bites'>['lure'], string> = {
  moth: 'A moth',
  bat: 'A bat',
  frog: 'A frog',
  orb: 'An orb',
  beetle: 'A beetle',
};

/** What she's told as she cooks something (phase R). */
export function cookedToast(event: Extract<WorldEvent, { kind: 'cooked' }>): Toast {
  const name = ITEMS[event.item].name;
  const any = RECIPES[event.recipe].needs.some((n) => 'any' in n);
  const from = any
    ? ` (with ${listed(event.used.map((u) => ({ id: u.item, count: u.count })))})`
    : '';
  if (event.night) {
    return {
      text: `A late-night snackie! ${name}, cooked${from}. It's in your bag.`,
      special: true,
      icon: '🌙',
    };
  }
  return { text: `${name}, cooked${from}! It's in your bag.`, icon: '🍲' };
}

/** What she's told as she eats something, and what it does. */
export function ateToast(item: ItemId, effect: Effect, until: DayWindow): Toast {
  const name = ITEMS[item].name.toLowerCase();
  const till = tillWhen(until);
  if (effect === 'pep') return { text: `Mmm, ${name}! A spring in your step ${till}.`, icon: '😋' };
  if (effect === 'bites') {
    return {
      text: `Mmm, ${name}! The fish can smell it. They'll bite sooner ${till}.`,
      icon: '😋',
    };
  }
  return {
    text: `Mmm, ${name}! ${LURED[effect.lure]} will come out to see what smells so good, wherever you are outdoors ${till}.`,
    icon: '😋',
  };
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
  if (item === 'castleKey') return "The castle's key? Best hang on to that one.";
  return "Nobody's buying your purse butter. It's far too precious (and a little squashed).";
}

/** Why a piece won't go where she tried to put it while decorating. */
const REFUSED: Record<Refusal, string> = {
  noRoom: "That won't fit there. Try somewhere with a little more room.",
  standing: "You're standing right there! Try a spot beside you.",
  blocking: 'That would block the way. Leave a path to the door and the chest.',
};

/** What the HUD says about a moment in town: a find, a bed tended, or a promise of later. */
export function eventToast(event: WorldEvent): Toast | null {
  switch (event.kind) {
    case 'gathered': {
      const toast = gatheredToast(event.from, event.item, event.count);
      return event.bead ? withBead(toast, event.bead) : toast;
    }
    case 'resting':
      return restingToast(event.from, event.back);
    case 'tilled':
      return { text: 'You tilled a fresh bed. Ready for planting!' };
    case 'planted':
      return {
        text: `You planted a ${ITEMS[CROPS[event.crop].seed].name.toLowerCase()}. A drink today helps it along.`,
      };
    case 'sowedRow':
      return {
        text: `You planted a row: ${quantity(CROPS[event.crop].seed, event.count)}, all tucked in.`,
      };
    case 'fitted':
      return {
        text:
          event.beds > 1
            ? `Your sprinkler's in! It waters this bed and the ${event.beds - 1} touching it, every morning.`
            : "Your sprinkler's in! It waters this bed every morning.",
        icon: '💦',
      };
    case 'unfitted':
      return {
        text: "You popped the sprinkler out. It's back in your bag, and everything it watered stays watered.",
      };
    case 'watered':
      return { text: `You watered the ${CROPS[event.crop].name}. ${ripeIn(event.days)}` };
    case 'growing':
      return {
        text: event.rained
          ? `The rain is watering the ${CROPS[event.crop].name} for you today. ${ripeIn(event.days)}`
          : event.sprinkled
            ? `Your sprinkler is watering the ${CROPS[event.crop].name} today. ${ripeIn(event.days)}`
            : `The ${CROPS[event.crop].name} had a drink today. ${ripeIn(event.days)}`,
      };
    case 'dug':
      return { text: BURIED[event.buried].found, special: true, icon: '🗝️' };
    case 'potted':
      return { text: `${POT_PLANTS[event.plant].name} in the pots by your door now.`, icon: '🪴' };
    case 'keepsake':
      return {
        text: `${VILLAGERS[event.from].name} says you can have a ${FURNITURE[event.piece].name.toLowerCase()} just like theirs! It's in your storage chest at home.`,
        special: true,
        icon: '🎁',
      };
    case 'entered': {
      if (!isInterior(event.scene)) return null;
      const on = event.happening ? HAPPENINGS[event.happening].welcome : undefined;
      return {
        text: on ? `${INTERIORS[event.scene].welcome} ${on}` : INTERIORS[event.scene].welcome,
      };
    }
    case 'arrived': {
      if (event.says) return { text: event.says };
      return event.at ? arrivalToast(event.at) : null;
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
    case 'cooked':
      return cookedToast(event);
    case 'ate':
      return ateToast(event.item, event.effect, event.until);
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
    case 'window':
      return windowToast(event.window, event.happening);
    case 'answered':
      return {
        text: `You brought ${VILLAGERS[event.from].name} ${asked(event.item, event.count)}. ${candy(event.candy)} Candy, and a thank-you!`,
        icon: '📌',
      };
    case 'weather':
      return event.weather === 'rain'
        ? {
            text: 'A soft rain today. It will water your garden, and the frogs are delighted.',
            icon: '🌧️',
          }
        : {
            text: 'A foggy day. The orbs and moths love it, and something grey is out in the trees.',
            icon: '🌫️',
          };
    case 'visit':
      return {
        text: `A new day! ${visitLine(event.count, event.gift)}`,
        special: true,
        icon: '🎁',
      };
    case 'shook':
      return event.back
        ? { text: `The candy tree is still growing its sweets. More ${whenBack(event.back)}!` }
        : {
            text: `You shook the candy tree, and down came ${candy(event.candy)} Candy!`,
            icon: '🍭',
          };
    case 'stallSold':
      return {
        text: `Your honesty stall sold ${listed(event.sold)} while you were away. ${candy(event.candy)} Candy in the tin!`,
        special: true,
        icon: '🧺',
      };
    case 'caught':
      return caughtToast(event.critter, event.first);
    case 'cast':
      return event.hint ? CAST_HINT : null;
    case 'letGo':
      return event.first
        ? { text: "It let go! Keep still: it'll be back for another bite." }
        : null;
    case 'reeled':
      return { text: 'Too soon! It was only nibbling. Tap its shadow to cast again.' };
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

/** Said as she casts, until she has caught her first fish (phase Q). */
export const CAST_HINT: Toast = {
  text: 'A nibble only wiggles the float. When it goes right under, tap!',
  icon: '🎣',
};

/** The blue moonfish, the rare blue one (phase Q), as the blue rose is in her garden. */
const BLUE_MOONFISH: Toast = {
  text: 'Once in a blue moon! You caught a blue moonfish!',
  special: true,
  icon: '💙',
};

/** A critter in her net or on her rod: a fuss for a new one, and a word about the rare ones. */
export function caughtToast(critter: CritterId, first: boolean): Toast {
  if (critter === 'blueMoonfish') return BLUE_MOONFISH;
  const row = CRITTERS[critter];
  const name = row.name.toLowerCase();
  const a = /^[aeiou]/.test(name) ? 'an' : 'a';
  const what = critter === 'orbPair' ? 'a pair of orbs! Forever orbs.' : `${a} ${name}!`;
  if (first) {
    const icon = isFish(critter) ? '🐟' : '🦋';
    return { text: `You caught ${what} New in your Curiosity Cabinet.`, special: true, icon };
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
    case 'oldTree':
      return {
        text: `The old tree murmurs something sleepy about the weather, and shakes loose ${what}.`,
      };
    case 'toadstools':
      return { text: `You picked ${what}. They're a bit spotty, but in a good way.` };
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

const WINDOW_ICON: Record<DayWindow, string> = { morning: '🌅', afternoon: '☀️', evening: '🌙' };

/** What she's told when a window of the day begins while she plays. */
function windowToast(window: DayWindow, happening: readonly CalendarId[]): Toast {
  const icon = WINDOW_ICON[window];
  const on = happening[0];
  if (window === 'morning') {
    const today = on ? ` ${CALENDAR[on].morning}` : '';
    // A new day is a little fuss, and waits its turn with the day's visit.
    return {
      text: `Good morning! A brand-new day, with new notes on the board.${today}`,
      special: true,
      icon,
    };
  }
  if (window === 'afternoon') {
    return {
      text: "Good afternoon! Everything's grown back, there are new notes on the board, and a new special.",
      icon,
    };
  }
  return {
    text: "Good evening! The lamps are on, everything's grown back, and there are new notes on the board.",
    icon,
  };
}

/** "3 pumpkins and 2 roses": a few kinds of thing, in a sentence. */
function listed(stacks: readonly { id: ItemId; count: number }[]): string {
  const each = stacks.map((s) => quantity(s.id, s.count));
  if (each.length < 2) return each[0] ?? 'nothing';
  return `${each.slice(0, -1).join(', ')} and ${each.at(-1)}`;
}

/** "1st", "22nd", "113th". */
export function ordinal(n: number): string {
  const tens = n % 100;
  if (tens >= 11 && tens <= 13) return `${n}th`;
  return `${n}${['th', 'st', 'nd', 'rd'][n % 10] ?? 'th'}`;
}

/** A visit's gift, and where it went: "3 pumpkin seeds, in your bag". */
export function giftLine(gift: VisitGift): string {
  if ('candy' in gift) return `${candy(gift.candy)} Candy, in your purse`;
  if ('furniture' in gift) {
    const name = FURNITURE[gift.furniture].name.toLowerCase();
    return `${/^[aeiou]/.test(name) ? 'an' : 'a'} ${name}, in your storage chest at home`;
  }
  return `${quantity(gift.item, gift.count)}, in your bag`;
}

/** What a visit brought, said on the greeting and when a day turns while she plays. */
export function visitLine(count: number, gift: VisitGift): string {
  if (count === 1) return `A little welcome gift: ${giftLine(gift)}.`;
  if (isMilestone(count))
    return `Your ${ordinal(count)} visit! The town left you ${giftLine(gift)}.`;
  return `Visit ${count}: ${giftLine(gift)}.`;
}

/** When something resting is back, in a sentence: "this afternoon", "this evening", "tomorrow". */
export function whenBack(back: DayWindow): string {
  return back === 'morning' ? 'tomorrow' : `this ${back}`;
}

function restingToast(from: string, back: DayWindow): Toast {
  const when = whenBack(back);
  switch (from) {
    case 'tree':
      return { text: `This tree has shared all its wood for now. More ${when}!` };
    case 'rock':
      return { text: `This rock is all chipped out for now. Try again ${when}.` };
    case 'flowers':
      return { text: `Just sprouts for now. They'll bloom again ${when}.` };
    case 'roseBush':
      return { text: `Just buds for now. The roses will open again ${when}.` };
    case 'oldTree':
      return { text: `The old tree is dozing. It'll have more wood for you ${when}.` };
    case 'toadstools':
      return { text: `Only stubs for now. The toadstools pop back up ${when}.` };
    default:
      return { text: `Nothing more here for now. Come back ${when}!` };
  }
}
