import { CROPS } from '../data/crops';
import { ITEMS } from '../data/items';
import type { ItemId } from '../types/ids';
import type { WorldEvent } from '../world/Town';

export interface Toast {
  text: string;
  /** Something worth a little fuss: the night's snack, a blue rose. Shown in candlelight. */
  special?: true;
  /** Shown before the text. */
  icon?: string;
}

/** "2 forget-me-boos", "1 wood", in a sentence. */
export function quantity(item: ItemId, count: number): string {
  const row = ITEMS[item];
  const one = row.name.toLowerCase();
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
