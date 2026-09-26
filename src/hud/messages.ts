import { ITEMS } from '../data/items';
import type { ItemId } from '../types/ids';
import type { WorldEvent } from '../world/Town';

export interface Toast {
  text: string;
  /** The night's snack gets a little fuss made over it. */
  special?: true;
}

/** "2 forget-me-boos", "1 wood", in a sentence. */
export function quantity(item: ItemId, count: number): string {
  const row = ITEMS[item];
  const one = row.name.toLowerCase();
  if (count === 1 || row.kind === 'material') return `${count} ${one}`;
  return `${count} ${row.plural ?? `${one}s`}`;
}

/** What the HUD says when she gathers something, or finds it resting until tomorrow. */
export function gatherToast(event: WorldEvent): Toast | null {
  if (event.kind === 'gathered') {
    const what = quantity(event.item, event.count);
    switch (event.from) {
      case 'tree':
        return { text: `The tree shook loose ${what}.` };
      case 'rock':
        return { text: `You chipped off ${what}.` };
      case 'flowers':
        return { text: `You picked ${what}!` };
      case 'snack':
        return {
          text: `Late-night snackies! A ${ITEMS[event.item].name.toLowerCase()}, just for you.`,
          special: true,
        };
      default:
        return { text: `You found ${what}.` };
    }
  }
  if (event.kind === 'resting') {
    switch (event.from) {
      case 'tree':
        return { text: 'This tree has shared all its wood today. More tomorrow!' };
      case 'rock':
        return { text: 'This rock is all chipped out for today.' };
      case 'flowers':
        return { text: "Just sprouts for now. They'll bloom again tomorrow." };
      default:
        return { text: 'Nothing more here today. Come back tomorrow!' };
    }
  }
  return null;
}
