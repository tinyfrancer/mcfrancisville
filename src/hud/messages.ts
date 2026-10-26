import { PROJECTS, type ProjectStage } from '../data/projects';
import { FORAGE_LINES, GREW_LINES } from '../data/affection';
import { DECOR } from '../data/holidays';
import {
  BUILT,
  GREW,
  MELTS,
  RAINBOW_AGAIN,
  RAINBOW_FIRST,
  ROLLED,
  SNOW_HINT,
  thawLine,
} from '../data/snow';
import { CRITTERS } from '../data/critters';
import { shinyName, shinyOf } from '../data/shinies';
import { CROPS } from '../data/crops';
import { FLOORINGS, FURNITURE, WALLPAPERS } from '../data/furniture';
import { ITEMS } from '../data/items';
import { OUTFITS } from '../data/outfits';
import { ACCESSORIES } from '../data/pets';
import { RECIPES, recipeName, type Made } from '../data/recipes';
import { BEST_SWEET } from '../data/trickOrTreat';
import { NEIGHBOUR_COSTUMES } from '../data/costumes';
import type { Effect } from '../data/dishes';
import type { Ware } from '../data/shop';
import { CALENDAR, type CalendarId } from '../data/calendar';
import { wordsOf, type FestivalDay } from '../systems/calendar';
import type { DayWindow } from '../systems/clock';
import type { Refusal } from '../systems/decor';
import type { Sender } from '../systems/friendship';
import { CLUES, WES_GONE } from '../data/mystery';
import { WES_DROPPED } from '../data/story';
import { WES_STAYS } from '../data/wes';
import { PATCH_LINES, PICKED, PICKED_TODAY } from '../data/pumpkinPatch';
import { VILLAGERS } from '../data/villagers';
import { plotPlace, ZONES } from '../data/zones';
import { HAPPENINGS } from '../data/happenings';
import { LOST } from '../data/smallEvents';
import { INTERIORS, isInterior } from '../data/interiors';
import { TUNES } from '../data/instruments';
import { POT_PLANTS } from '../data/porch';
import { SIGNPOSTS } from '../data/signposts';
import { BURIED } from '../data/buried';
import { FOSSILS } from '../data/fossils';
import type { MoundFind } from '../systems/fossils';
import { FRUIT_OF, isFruitTree } from '../data/orchard';
import type { VisitGift } from '../data/visits';
import { FIRST_DAY, FIRST_DAY_STEPS } from '../data/firstDay';
import { isMilestone } from '../systems/visits';
import { aSweet } from '../systems/trickOrTreat';
import { handsOf } from '../systems/catchSize';
import type {
  CritterId,
  FigurineId,
  FirstDayStepId,
  ItemId,
  MapZoneId,
  ProjectId,
  PropId,
} from '../types/ids';
import type { Glyph } from '../data/glyphs';
import type { WorldEvent } from '../world/World';
import type { Herald } from '../world/events';
import { PASSERS, RARE_EVENTS } from '../data/rareEvents';

/**
 * Said when she tries the ice without her skates, and slides back to the bank (phase B1). Question
 * 37 in the handoff asks for a line from their first date to put here.
 */
export const SLIPPED =
  'Whoa! The ice is slippery as anything, and you slide right back to the bank. A pair of skates ' +
  'would do it!';

/** The castle's telescope by day, and on a cloudy night (1.5's G4). */
export const SKY_SHUT = {
  bright:
    'You peek through the telescope. Sky, very blue, and a cloud shaped like a sheep. The stars come out after eight: try a clear night!',
  cloudy:
    'You peek through the telescope. Cloud, cloud and more cloud. The stars are up there somewhere: try a clear night!',
} as const;

export interface Toast {
  text: string;
  /** Something worth a little fuss: the night's snack, a blue rose. Shown in candlelight. */
  special?: true;
  /** Shown before the text: one of the game's own pictures (V1's L5). */
  icon?: Glyph;
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

/**
 * Cobweb Corner's wanted list (0.2's E1), said on its counter and the noticeboard: "Wanted this
 * week, for double Candy: a luna moth, a pumpkin and a pumpkin soup."
 */
export function wantedLine(wanted: readonly ItemId[]): string {
  const things = wanted.map((id) => asked(id, 1));
  const list = `${things.slice(0, -1).join(', ')} and ${things.at(-1)}`;
  return `Wanted this week, for double Candy: ${list}.`;
}

/** "Ripe tomorrow!", "Ripe in 3 days!" */
function ripeIn(days: number): string {
  return days <= 1 ? 'Ripe tomorrow!' : `Ripe in ${days} days!`;
}

const BLUE_ROSE: Toast = {
  text: 'A blue rose! The rarest bloom in McFrancisVille.',
  special: true,
  icon: { item: 'blueRose' },
};

/** What the sign at the farm gate says when she walks up to it. */
export const FARM_SIGN: Toast = {
  text: 'Welcome to Hosta La Vista Farm! Nothing here ever wilts.',
  special: true,
  icon: { item: 'hosta' },
};

/**
 * What she finds on walking up to something with nothing to open: a sign, or Skelly. Null for
 * anything that opens a sheet or says nothing.
 */
export function arrivalToast(at: PropId): Toast | null {
  if (at === 'farmSign') return FARM_SIGN;
  if (at === 'skelly') return { text: 'Skelly.', icon: 'skull' };
  if (at === 'castle') {
    return {
      text:
        'The great door of Castle Mac-A-Boo is shut, with a note pinned to it: "Closed for ' +
        'dusting. Please admire the butterflies."',
      icon: 'castle',
    };
  }
  if (at === 'weddingArch') {
    return {
      text: 'An arch of roses and orange ribbons. A monarch lands on your shoulder, just for a moment.',
      special: true,
      icon: { mark: 'dollyDay' },
    };
  }
  if (at === 'filmScreen') {
    return {
      text: "Film night's screen. The friendly ghost film is on from seven till ten, and everyone's coming!",
      icon: { item: 'plushGhost' },
    };
  }
  if (at === 'popcornTable') {
    return {
      text: 'Tubs and tubs of popcorn for film night, still warm. Wrapunzel made all of it.',
      icon: { item: 'popcorn' },
    };
  }
  if (at === 'lotSign') {
    return {
      text: 'A plot of land, all ready for someone. The sign says "COMING SOON!"',
      icon: 'signpost',
    };
  }
  if (at === 'soldSign') {
    return { text: 'The sign says "SOLD!" Somebody new is moving in tomorrow.', icon: 'signpost' };
  }
  if (at === 'movingBoxes') {
    return {
      text: 'Boxes and boxes, labelled "KITCHEN", "BOOKS", "SPOOKY" and "MISC (VERY)".',
      icon: 'parcel',
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
/** Market day's stall at the fairground, any other day (0.2's M3). */
export const MARKET_SHUT: Toast = {
  text: "The market stall's empty today. It's full of extras on the first Saturday of the month!",
  icon: { mark: 'marketDay' },
};

export const NO_SEEDS: Toast = {
  text: "You're out of seeds for now. Every harvest gives one back, so check what's growing!",
};

/** Candy, as it's said in a sentence: "12 Candy". A price on a button is `price` (`glyph.ts`). */
export function candy(amount: number): string {
  return `${amount} Candy`;
}

/** What a ware is called: "Moonflower lamp (recipe)", "Bookworm tee" (0.2's U3). */
export function wareName(ware: Ware): string {
  if ('item' in ware) return ITEMS[ware.item].name;
  if ('furniture' in ware) return FURNITURE[ware.furniture].name;
  if ('wallpaper' in ware) return `${WALLPAPERS[ware.wallpaper].name} wallpaper`;
  if ('flooring' in ware) return `${FLOORINGS[ware.flooring].name} flooring`;
  if ('recipe' in ware) return `Recipe: ${recipeName(ware.recipe)}`;
  if ('accessory' in ware) return ACCESSORIES[ware.accessory].name;
  return OUTFITS[ware.outfit].name;
}

/** What Ollie's counter says as she orders something (0.3's S1). */
export function orderedLine(ware: Ware): string {
  return `${wareName(ware)}, ordered! Ollie will bring it round in the morning.`;
}

/** A piece ordered from Gourdon's book (0.3's S2). */
export function madeToOrderLine(ware: Ware): string {
  return `${wareName(ware)}, ordered! Gourdon makes it tonight, and Ollie brings it in the morning.`;
}

/** Gourdon carved her a figurine (0.3's C3), there and then. */
export function carvedLine(figurine: FigurineId, first: boolean): string {
  const fuss = first ? ' Your first of those!' : '';
  return `${FURNITURE[figurine].name}, carved while you watched! Into your storage chest at home.${fuss}`;
}

/** Ollie has been round with her orders (0.3's S1). */
export function deliveredToast(wares: readonly Ware[]): Toast {
  const one = wares.length === 1;
  const what = one ? `your ${wareName(wares[0]!)}` : `${wares.length} parcels`;
  return {
    text: `Ollie has been round with ${what}! ${one ? "It's" : "They're"} waiting in your mailbox.`,
    special: true,
    icon: 'parcel',
  };
}

/** What a shop says as she buys something: where it went. */
export function boughtLine(ware: Ware): string {
  if ('item' in ware) return `${ITEMS[ware.item].name}, into your bag!`;
  if ('furniture' in ware) {
    return `${FURNITURE[ware.furniture].name}, into your storage chest at home!`;
  }
  if ('wallpaper' in ware) {
    return `${WALLPAPERS[ware.wallpaper].name} wallpaper, yours! Put it up when you decorate at home.`;
  }
  if ('flooring' in ware) {
    return `${FLOORINGS[ware.flooring].name} flooring, yours! Lay it when you decorate at home.`;
  }
  if ('recipe' in ware) {
    return `Recipe learned: ${recipeName(ware.recipe)}! Make it at your workbench at home.`;
  }
  if ('accessory' in ware) {
    return `${ACCESSORIES[ware.accessory].name}, yours! Dress a pet in it by walking up to them.`;
  }
  const name = OUTFITS[ware.outfit].name;
  const them = /[^s]s$/.test(name) ? 'them' : 'it';
  return `${name}, into your closet! Try ${them} on from your closet.`;
}

/** What a ring of earth for a candy sapling says (0.2's E1), by how many days it has to grow. */
const SAPLING_LINES: Record<'planted' | 'growing' | 'waiting', (days: number) => Toast> = {
  planted: (days) => ({
    text: `You planted the candy sapling! It'll be a tree in ${days} days.`,
    special: true,
    icon: { item: 'candySapling' },
  }),
  growing: (days) => ({
    text:
      days === 1
        ? 'The candy sapling is nearly there. A tree by tomorrow!'
        : `The candy sapling is growing. A tree in ${days} days!`,
    icon: { item: 'candySapling' },
  }),
  waiting: () => ({
    text: 'A ring of earth, waiting for a sapling. The candy tree drops one now and then.',
  }),
};

/** What the workbench says as she makes something: what it was, and where it went. */
export function madeToast(made: Made): Toast {
  if ('room' in made && made.in === 'attic') {
    return {
      text: 'Your attic grew! More cozy nooks under the roof, and just as snug.',
      special: true,
      icon: 'house',
    };
  }
  if ('room' in made) {
    return {
      text: 'Your home grew! So much more room for everything.',
      special: true,
      icon: 'house',
    };
  }
  if ('newRoom' in made && made.newRoom === 'attic') {
    return {
      text: 'An attic! Climb the new ladder in your back room. Mind your head on the eaves.',
      special: true,
      icon: 'house',
    };
  }
  if ('newRoom' in made) {
    return {
      text: 'A back room! Walk through the new arch by your chest, and make it your own.',
      special: true,
      icon: 'door',
    };
  }
  if ('beds' in made) {
    const place = plotPlace(made.beds);
    const where = place === 'town' ? 'Hosta La Vista Farm' : ZONES[place].name;
    return {
      text: `A new row of beds at ${where}! Ready to dig over and plant.`,
      special: true,
      icon: { item: 'candySapling' },
    };
  }
  if ('shelf' in made) {
    return {
      text: 'A second shelf on the honesty stall! Room for more, and more sold each window.',
      special: true,
      icon: { mark: 'marketDay' },
    };
  }
  if ('item' in made) {
    return { text: `${ITEMS[made.item].name}, made! It's in your bag.`, icon: 'sparkle' };
  }
  const name = FURNITURE[made.furniture].name;
  return { text: `${name}, made! It's waiting in your storage chest.`, icon: 'sparkle' };
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
  crawly: 'A creepy-crawly',
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
      icon: 'evening',
    };
  }
  return { text: `${name}, cooked${from}! It's in your bag.`, icon: { item: event.item } };
}

/** What she's told as she eats something, and what it does. */
export function ateToast(item: ItemId, effect: Effect, until: DayWindow): Toast {
  const name = ITEMS[item].name.toLowerCase();
  const till = tillWhen(until);
  if (effect === 'pep')
    return { text: `Mmm, ${name}! A spring in your step ${till}.`, icon: 'yum' };
  if (effect === 'bites') {
    return {
      text: `Mmm, ${name}! The fish can smell it. They'll bite sooner ${till}.`,
      icon: 'yum',
    };
  }
  return {
    text: `Mmm, ${name}! ${LURED[effect.lure]} will come out to see what smells so good, wherever you are outdoors ${till}.`,
    icon: 'yum',
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
  if (item === 'broom') return 'Your broom? You would have to walk everywhere!';
  if (item === 'castleKey') return "The castle's key? Best hang on to that one.";
  if (item === 'hallKey') return "The heart key? That one's far too special to sell.";
  return "Nobody's buying your purse butter. It's far too precious (and a little squashed).";
}

/** Why a piece won't go where she tried to put it while decorating. */
const REFUSED: Record<Refusal, string> = {
  noRoom: "That won't fit there. Try somewhere with a little more room.",
  standing: "You're standing right there! Try a spot beside you.",
  blocking: 'That would block the way. Leave a path to the door and the chest.',
  indoors: "That one likes it indoors, where it's cozy and dry. It can go in the house!",
  inTheWay: 'That would block the way round your yard. Leave a path for everyone!',
  melts: MELTS,
  eaves: 'The eaves are too low for that. Try it further from the back, where the roof is higher.',
};

/** What the HUD says about a moment in town: a find, a bed tended, or a promise of later. */
export function eventToast(event: WorldEvent): Toast | null {
  switch (event.kind) {
    case 'gathered': {
      const toast = gatheredToast(event.from, event.item, event.count);
      return event.bead ? withBead(toast, event.bead) : toast;
    }
    case 'resting':
      return event.plenty
        ? plentyToast(event.plenty, event.back)
        : restingToast(event.from, event.back);
    case 'tilled':
      return { text: 'You tilled a fresh bed. Ready for planting!' };
    case 'planted':
      return {
        text: `You planted a ${ITEMS[CROPS[event.crop].seed].name.toLowerCase()}. ${
          event.quick && event.season
            ? "It loves it here, and it's in season: two days sooner!"
            : event.quick
              ? 'It loves it here, and will be ready a day sooner!'
              : event.season
                ? "It's in season, so it'll be ready a day sooner!"
                : 'A drink today helps it along.'
        }`,
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
        icon: 'drops',
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
      return { text: BURIED[event.buried].found, special: true, icon: { item: 'castleKey' } };
    case 'unearthed':
      return unearthedToast(event.find, event.first);
    case 'potted':
      return {
        text: `${POT_PLANTS[event.plant].name} in the pots by your door now.`,
        icon: 'plant',
      };
    case 'keepsake':
      return {
        text: `${VILLAGERS[event.from].name} says you can have a ${FURNITURE[event.piece].name.toLowerCase()} just like theirs! It's in your storage chest at home.`,
        special: true,
        icon: { mark: 'earlyBirthday' },
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
      if (event.sign) return { text: SIGNPOSTS[event.sign].line, icon: 'signpost' };
      return event.at ? arrivalToast(event.at) : null;
    }
    case 'played':
      if (event.dance) {
        return {
          text: `You put on the ${ITEMS[event.record!].name}, and dance! Cody hears it from next door and comes over to dance with you.`,
          special: true,
          icon: { item: event.record! },
        };
      }
      return event.record
        ? {
            text: `You put on the ${ITEMS[event.record].name}. What a tune!`,
            icon: { item: event.record },
          }
        : { text: 'No records yet! Cobweb Corner sells one most days.' };
    // 1.5's G4: the castle's telescope on a night it can't see, or in the day.
    case 'stargaze':
      return event.sky === 'open' ? null : { text: SKY_SHUT[event.sky], icon: 'telescope' };
    case 'tune':
      return {
        text: event.line ?? TUNES[event.tune].line,
        icon: TUNES[event.tune].instrument === 'telescope' ? 'telescope' : 'piano',
      };
    case 'refused':
      return { text: REFUSED[event.why] };
    case 'mail':
      return {
        text: `A letter from ${senderName(event.from)} is waiting in your mailbox!`,
        special: true,
        icon: 'letter',
      };
    case 'delivered':
      return deliveredToast(event.wares);
    // The catalogue's sheet says it as she orders.
    case 'ordered':
      return null;
    case 'made':
      return madeToast(event.made);
    case 'cooked':
      return cookedToast(event);
    // Her bag's card says it as she eats, and the chip in the top bar keeps saying it (0.3's A4).
    case 'ate':
      return null;
    case 'clue':
      return {
        text: `A clue! ${CLUES[event.clue].title}. Pinned to the corkboard at home.`,
        special: true,
        icon: 'pin',
      };
    case 'found':
      return {
        text: `You found ${ZONES[event.zone].name}! It's on your map now.`,
        special: true,
        icon: 'map',
      };
    case 'opened':
      return { text: ZONES[event.zone].opened ?? '', special: true, icon: 'sparkle' };
    case 'shut':
      return { text: ZONES[event.zone].shut ?? '' };
    case 'slipped':
      return { text: SLIPPED, icon: { item: 'iceSkates' } };
    case 'flew':
      return event.call ? { text: event.call, icon: { item: 'broom' } } : null;
    case 'wesGone':
      return { text: WES_GONE[event.line % WES_GONE.length]!, icon: 'lookingGlass' };
    case 'wesDropped':
      return { text: WES_DROPPED, special: true, icon: 'scroll' };
    case 'wesStays':
      return { text: WES_STAYS, special: true, icon: 'lookingGlass' };
    case 'window':
      return windowToast(event.window, event.happening, event.festival);
    case 'answered':
      return {
        text: `You brought ${VILLAGERS[event.from].name} ${asked(event.item, event.count)}. ${candy(event.candy)}, and a thank-you!`,
        icon: 'pin',
      };
    // Snow days and the rainbow (1.6's X4).
    case 'snowHint':
      return { text: SNOW_HINT, icon: { item: 'meltlessSnowman' } };
    case 'snowball':
      return { text: event.did === 'rolled' ? ROLLED : GREW };
    case 'snowman':
      return { text: BUILT[event.snowman], special: true, icon: { item: 'meltlessSnowman' } };
    case 'thawed':
      return { text: thawLine(event.count), special: true, icon: { item: 'meltlessSnowman' } };
    case 'rainbow':
      return event.first
        ? { text: RAINBOW_FIRST, special: true, icon: { item: 'rainbowJar' } }
        : { text: RAINBOW_AGAIN, icon: { item: 'rainbowJar' } };
    case 'weather':
      if (event.storm) {
        return {
          text: 'A thunderstorm today! Rain on the roofs, a far-off rumble, and now and then a flash. Cosy.',
          icon: 'storm',
        };
      }
      return event.weather === 'rain'
        ? {
            text: 'A soft rain today. It will water your garden, and the frogs are delighted.',
            icon: 'rain',
          }
        : {
            text: 'A foggy day. The orbs and moths love it, and something grey is out in the trees.',
            icon: 'fog',
          };
    case 'firstDay':
      return firstDayToast(event.step, event.reward);
    case 'visit':
      return {
        text: `A new day! ${visitLine(event.count, event.gift)}`,
        special: true,
        icon: { mark: 'earlyBirthday' },
      };
    case 'shook':
      return event.back
        ? { text: `The candy tree is still growing its sweets. More ${whenBack(event.back)}!` }
        : {
            text:
              (event.sweet
                ? `You shook the candy tree, and down came ${candy(event.candy)}, and ${aSweet(event.sweet)}!`
                : `You shook the candy tree, and down came ${candy(event.candy)}!`) +
              (event.sapling
                ? ' And a little sapling! Plant it in a ring of earth in your yard.'
                : ''),
            icon: 'candy',
            ...(event.sapling ? { special: true } : {}),
          };
    case 'sapling':
      return SAPLING_LINES[event.did](event.days ?? 0);
    case 'patch':
      if (event.stage !== 'ripe')
        return { text: PATCH_LINES[event.stage], icon: { item: 'patchPumpkin' } };
      return event.picked
        ? { text: PICKED, special: true, icon: { item: 'patchPumpkin' } }
        : { text: PICKED_TODAY, icon: { item: 'patchPumpkin' } };
    case 'foundLost':
      return { text: LOST[event.lost].found, icon: 'lookingGlass' };
    // V1's R3: what's out of the ordinary today, a passer-by's hello, and a stray found.
    case 'heralded': {
      const told = heraldToast(event.what);
      return event.posted ? { ...told, text: `${told.text} ${KEEPSAKE_POSTED}` } : told;
    }
    case 'metPasser':
      return {
        text:
          `${PASSERS[event.who].name}: "${event.line}"` +
          (event.gift ? ` ${PASSERS[event.who].name} gave you ${aSweet(event.gift)}.` : '') +
          (event.posted ? ` ${KEEPSAKE_POSTED}` : ''),
        icon: event.gift ? { item: event.gift } : 'footprints',
      };
    case 'foundStray':
      return { text: event.line, special: true, icon: { item: event.critter } };
    // V1's R4: a town project's posts or frame going up, and one built.
    case 'pitchedIn':
      return event.raised
        ? { text: raisedLine(event.project, event.raised), icon: 'hammer' }
        : null;
    case 'built':
      return { text: PROJECTS[event.project].built, special: true, icon: 'hammer' };
    // V1's R6c: a pet grown fonder, and Fibi by the day's mound.
    case 'petGrew':
      return {
        text: GREW_LINES[event.pet][event.level - 1]!.replaceAll('{name}', event.name),
        special: true,
        icon: 'heart',
      };
    case 'petTrick':
      return event.line ? { text: event.line, icon: 'sparkle' } : null;
    case 'petHelped':
      if (event.job === 'forage' && event.item) {
        return {
          text: FORAGE_LINES[event.item === 'friedPickles' ? 1 : 0]
            .replaceAll('{name}', event.name)
            .replaceAll('{item}', ITEMS[event.item].name.toLowerCase()),
          icon: { item: event.item },
        };
      }
      return event.job === 'sniff'
        ? { text: `${event.name} is sitting by today's mound. What a good nose!`, icon: 'sparkle' }
        : null;
    case 'decorated':
      return {
        text: DECOR[event.decor].up,
        special: true,
        icon: { mark: DECOR[event.decor].holiday },
      };
    case 'frozen':
      return {
        text: 'The pond in the park has frozen over! Perfect for a skate, just like your very first date.',
        special: true,
        icon: { item: 'iceSkates' },
      };
    case 'foundEgg':
      return event.left === 0
        ? {
            text: `That's all ${event.found} eggs! Barty will be so proud. Happy Easter!`,
            special: true,
            icon: { mark: 'marketDay' },
          }
        : {
            text: `A chocolate egg! That's ${event.found}, and ${event.left} still hidden.`,
            icon: { item: 'chocolateEgg' },
          };
    case 'dressedUp': {
      const who = event.villagers.map(
        (id) => `${VILLAGERS[id].name} has gone as ${NEIGHBOUR_COSTUMES[id].as}`,
      );
      const list = who.length > 1 ? `${who.slice(0, -1).join(', ')} and ${who.at(-1)}` : who[0];
      return {
        text: `Costumes are going on! ${list}. More of the town dresses up every week of the festival.`,
        special: true,
        icon: { mark: 'halloweenFestival' },
      };
    }
    case 'trickOrTreat':
      return event.item === BEST_SWEET
        ? { text: `${event.line} Your favourite!`, special: true, icon: { item: event.item } }
        : { text: event.line, icon: event.home ? { mark: 'halloween' } : { item: event.item } };
    // Small delights (1.6's X5): Fibi's gift, and a neighbour's bless you.
    case 'petGift':
      return { text: event.line, icon: 'heart' };
    case 'sneezed':
      return event.by && event.line
        ? { text: `${VILLAGERS[event.by].name}: "${event.line}"`, icon: 'heart' }
        : null;
    // Reginald at six, if she's at Boo Acres to hear him (1.6's X3); the card says the rest.
    case 'crow':
      return {
        text: 'Cock-a-doodle-doo! Reginald says good morning to all of Boo Acres. Scarah has asked him to consider seven.',
      };
    case 'stallSold':
      return {
        text: `Your honesty stall sold ${listed(event.sold)} while you were away. ${candy(event.candy)} in the tin!`,
        special: true,
        icon: { mark: 'marketDay' },
      };
    case 'caught':
      return event.shiny
        ? shinyToast(event.critter, event.first, event.firstShiny === true)
        : caughtToast(event.critter, event.first, event);
    case 'hooked':
      return {
        text: 'Hooked! Tap as the needle crosses the glowing part of the line to reel it in.',
      };
    case 'slack':
      return event.first
        ? { text: "The line went slack! Don't worry, it's still there: wait for another bite." }
        : null;
    case 'drifted':
      return event.first
        ? {
            text: `The ${CRITTERS[event.critter].name.toLowerCase()} drifted off a little. It's shy: stop a few steps away, then creep up on it slowly.`,
          }
        : null;
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

/** Said after a rare event's toast when its keepsake has come in the mail with it (V1's R3). */
export const KEEPSAKE_POSTED = "And there's a letter in your mailbox!";

/** What's told as out of the ordinary today (V1's R3), the first time she's out that day. */
function heraldToast(what: Herald): Toast {
  if ('rare' in what) {
    const row = RARE_EVENTS[what.rare];
    return { text: row.heralds, special: true, icon: row.glyph };
  }
  if ('passer' in what) {
    return { text: PASSERS[what.passer].heralds ?? '', special: true, icon: 'shell' };
  }
  return what.shop === 'moonPie'
    ? {
        text: 'The Moon Pie Man has set up his cart in town today! Chocolate. Banana. Watermelon. Moon pie.',
        icon: { item: 'moonPie' },
      }
    : {
        text: 'Spirit Halloweenie has popped up in town today! (Temporarily.) Costumes inside.',
        icon: 'skull',
      };
}

/** Said as she casts, until she has caught her first fish (phase Q). */
export const CAST_HINT: Toast = {
  text: 'A nibble only wiggles the float. When it goes right under, tap!',
  icon: { tool: 'rod' },
};

/** The blue moonfish, the rare blue one (phase Q), as the blue rose is in her garden. */
const BLUE_MOONFISH: Toast = {
  text: 'Once in a blue moon! You caught a blue moonfish!',
  special: true,
  icon: { item: 'blueMoonfish' },
};

/** How big a fish is, as the toast tells it (V1's R6a): a whopper and a best with a fuss. */
export function sizeLine(size: { size?: number; best?: 'first' | 'best'; whopper?: true }): string {
  if (size.size === undefined) return '';
  const hands = handsOf(size.size);
  if (size.whopper && size.best === 'best') return ` A whopper, ${hands} long: your biggest yet!`;
  if (size.whopper) return ` A whopper, ${hands} long!`;
  if (size.best === 'best') return ` ${capital(hands)} long: your biggest yet!`;
  return ` It's ${hands} long.`;
}

const capital = (text: string) => text.charAt(0).toUpperCase() + text.slice(1);

/** A critter in her net or on her rod: a fuss for a new one, and a word about the rare ones. */
export function caughtToast(
  critter: CritterId,
  first: boolean,
  size: { size?: number; best?: 'first' | 'best'; whopper?: true } = {},
): Toast {
  const told = caughtWords(critter, first);
  const more = sizeLine(size);
  if (!more) return told;
  return size.whopper || size.best === 'best'
    ? { ...told, text: told.text + more, special: true }
    : { ...told, text: told.text + more };
}

/**
 * A shiny caught (1.4's G1): always a fuss, and more of one the first of its kind, and the
 * Cabinet's word if it's the first of the critter at all.
 */
export function shinyToast(critter: CritterId, first: boolean, firstShiny: boolean): Toast {
  const name = shinyName(critter).toLowerCase();
  const a = /^[aeiou]/.test(name) ? 'an' : 'a';
  const icon: Glyph = { item: shinyOf(critter) };
  const cabinet = first ? ' New in your Curiosity Cabinet, shine and all.' : '';
  const told = firstShiny
    ? `You caught ${a} ${name}! It's the wrong colour on purpose, and prettier for it.`
    : `You caught ${a} ${name}! Another one, glittering away.`;
  return { text: told + cabinet, special: true, icon };
}

function caughtWords(critter: CritterId, first: boolean): Toast {
  if (critter === 'blueMoonfish') return BLUE_MOONFISH;
  const row = CRITTERS[critter];
  const name = row.name.toLowerCase();
  const a = /^[aeiou]/.test(name) ? 'an' : 'a';
  const what = critter === 'orbPair' ? 'a pair of orbs! Forever orbs.' : `${a} ${name}!`;
  // The thing itself, which a phone's emoji never was (V1's L5).
  const icon: Glyph = { item: critter };
  if (first) {
    return { text: `You caught ${what} New in your Curiosity Cabinet.`, special: true, icon };
  }
  if (row.rarity === 'legendary')
    return { text: `You caught ${what} A legendary one!`, special: true, icon };
  if (row.rarity === 'rare') return { text: `You caught ${what} What luck!`, special: true, icon };
  return { text: `You caught ${what}`, icon };
}

/** What she finds in the day's mound (0.3's C1): a fuss for a new fossil, and for a rare one. */
export function unearthedToast(find: MoundFind, first: boolean): Toast {
  if ('candy' in find) {
    return {
      text: `You dig into the mound and find a little tin someone buried, with ${candy(find.candy)} inside!`,
    };
  }
  if ('bead' in find) {
    const name = ITEMS[find.bead].name.toLowerCase();
    return {
      text: `You dig into the mound and find a ${name}, a little muddy but none the worse.`,
      icon: { item: find.bead },
    };
  }
  const row = FOSSILS[find.fossil];
  const name = row.name.toLowerCase();
  const what = `You dig into the mound and brush off the earth: ${/^[aeiou]/.test(name) ? 'an' : 'a'} ${name}!`;
  const icon: Glyph = { item: find.fossil };
  if (first) return { text: `${what} New in your Curiosity Cabinet.`, special: true, icon };
  if (row.rarity === 'rare') return { text: `${what} What a find!`, special: true, icon };
  return { text: what, icon };
}

/** A find with a bead found as well, tucked in the stone or dropped from the branches. */
function withBead(toast: Toast, bead: ItemId): Toast {
  const name = ITEMS[bead].name;
  const one = bead === 'loveBeads' ? `some ${name}` : `a ${name.toLowerCase()}`;
  return { text: `${toast.text} And look, ${one}!`, icon: { item: bead } };
}

function gatheredToast(from: string, item: ItemId, count: number): Toast {
  const what = quantity(item, count);
  if (item === 'blueRose') return BLUE_ROSE;
  // Boo Acres' orchard (0.3's F2).
  if (isFruitTree(from)) {
    return { text: `You picked ${what}, warm from the sun, off the ${fruitTree(from)}.` };
  }
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
        icon: { item: 'fibisBone' },
      };
    case 'snack':
      return {
        text: `Late-night snackies! A ${ITEMS[item].name.toLowerCase()}, just for you.`,
        special: true,
        icon: 'evening',
      };
    default:
      return { text: `You found ${what}.` };
  }
}

/** "26 days to Halloween", "Halloween is tomorrow", "Halloween is today". */
export function countdown(festival: FestivalDay): string {
  const to = festival.finale ? CALENDAR[festival.finale].name : null;
  if (festival.left === 0) return `${to ?? 'The last day'} is today`;
  if (festival.left === 1) return `${to ?? 'The last day'} is tomorrow`;
  return `${festival.left} days to ${to ?? 'the last day'}`;
}

const WINDOW_ICON: Record<DayWindow, Glyph> = {
  morning: 'morning',
  afternoon: 'afternoon',
  evening: 'evening',
};

/** What she's told when a window of the day begins while she plays. */
function windowToast(
  window: DayWindow,
  happening: readonly CalendarId[],
  festival: FestivalDay | null,
): Toast {
  const icon = WINDOW_ICON[window];
  const on = happening[0];
  if (window === 'morning') {
    let today = on ? ` ${wordsOf(on).morning}` : '';
    // A festival's own morning line on its quiet days, and its countdown till the big one.
    if (festival && festival.left > 0) {
      if (!on) today = ` ${wordsOf(festival.id).morning}`;
      today += ` ${countdown(festival)}.`;
    }
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
  if ('candy' in gift) return `${candy(gift.candy)}, in your purse`;
  if ('furniture' in gift) {
    const name = FURNITURE[gift.furniture].name.toLowerCase();
    return `${/^[aeiou]/.test(name) ? 'an' : 'a'} ${name}, in your storage chest at home`;
  }
  return `${quantity(gift.item, gift.count)}, in your bag`;
}

/** A step of her first day done (V1's R1): Cody's line after it, and what it brought. */
export function firstDayToast(step: FirstDayStepId, reward: VisitGift): Toast {
  const after = FIRST_DAY_STEPS[step].after;
  return { text: `Cody: "${after}" For you: ${giftLine(reward)}.`, icon: 'heart' };
}

/** Her whole first day done, and his keepsake for the house (V1's R1). */
export const FIRST_DAY_FINISHED: Toast = {
  text: `Cody: "${FIRST_DAY.finished}"`,
  icon: 'house',
  special: true,
};

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

/** "apple tree", "persimmon tree". */
function fruitTree(tree: keyof typeof FRUIT_OF): string {
  return `${ITEMS[FRUIT_OF[tree]].name.toLowerCase()} tree`;
}

/** A town project's posts or frame going up (V1's R4), where it stands. */
function raisedLine(project: ProjectId, stage: ProjectStage): string {
  const { name, where } = PROJECTS[project];
  return stage === 'posts'
    ? `The posts are in ${where}! ${name} has begun.`
    : `${name}'s frame is going up ${where}. Halfway there!`;
}

/**
 * A place that has given her plenty this window (V1's R4's cap): its trees and flowers rest till the
 * next, whichever she tries.
 */
function plentyToast(zone: MapZoneId, back: DayWindow): Toast {
  return {
    text: `${PLACE_WORDS[zone]} has shared plenty for now. Everything here will have more ${whenBack(back)}!`,
    icon: 'tree',
  };
}

const PLACE_WORDS: Record<MapZoneId, string> = {
  town: 'The town',
  whisperwood: 'Whisperwood',
  lanternShore: 'Lantern Shore',
  castleHill: 'The castle hill',
  hiddenClearing: 'The hidden clearing',
  fairground: 'The fairground',
  booAcres: 'Boo Acres',
};

function restingToast(from: string, back: DayWindow): Toast {
  const when = whenBack(back);
  if (isFruitTree(from)) {
    return { text: `The ${fruitTree(from)} is picked clean for now. More will ripen ${when}!` };
  }
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
