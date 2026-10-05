import { effectOf, type Effect } from '../data/dishes';
import type { Family } from '../data/critters';
import { ITEMS } from '../data/items';
import type { DayWindow } from '../data/windows';
import type { ItemId } from '../types/ids';

/*
 * What a dish, a snack or a treat does, told the same way on every card, on the stove and on the
 * chip in the top bar while it's doing it (0.3's A4, decision 223). It is a fact of the food's row
 * (`effectOf`), so the words are worked out from the effect, never written per dish.
 */

/** A lured critter, by its family, as the middle of a sentence has it. */
const LURED: Record<Exclude<Family, 'fish'>, string> = {
  moth: 'a moth',
  bat: 'a bat',
  frog: 'a frog',
  orb: 'an orb',
  beetle: 'a beetle',
};

/** What it does, in the middle of a sentence: "a spring in your step". */
export function effectWords(effect: Effect): string {
  if (effect === 'pep') return 'a spring in your step';
  if (effect === 'bites') return 'the fish bite sooner';
  return `${LURED[effect.lure]} comes out to see what smells so good`;
}

/** The fixed line under a food's description: "Eat it: the fish bite sooner till the window turns." */
export function eatLine(id: ItemId): string | null {
  const effect = effectOf(id);
  if (effect === null) return null;
  const till = typeof effect === 'object' ? '' : ' till the window turns';
  return `Eat it: ${effectWords(effect)}${till}.`;
}

/** A thing's description, and after it what eating it does, if it's for eating. */
export function aboutFood(id: ItemId): string {
  const eat = eatLine(id);
  return eat ? `${ITEMS[id].description} ${eat}` : ITEMS[id].description;
}

/** The stove's groups (phase R), named for what eating each does, as the cards say it. */
export const EFFECT_GROUPS = [
  { id: 'pep', label: 'Spring in your step' },
  { id: 'fishing', label: 'Fish bite sooner' },
  { id: 'lures', label: 'Lures a critter' },
] as const;

/** Which of the stove's groups a dish is in. */
export function effectGroup(effect: Effect): (typeof EFFECT_GROUPS)[number]['id'] {
  return typeof effect === 'object' ? 'lures' : effect === 'bites' ? 'fishing' : 'pep';
}

/**
 * The chip's few words: "till evening". The afternoon starts at noon, and "till noon" leaves the
 * day beside the chip whole on a phone held upright, where "till afternoon" cut it short.
 */
export function tillShort(until: DayWindow): string {
  return until === 'afternoon' ? 'till noon' : `till ${until}`;
}

/** What a tap on the chip says: what it's doing, and till when. */
export function buffLine(effect: Effect, until: DayWindow): string {
  const till = until === 'morning' ? 'till morning' : `till this ${until}`;
  const words = effectWords(effect);
  const said = `${words[0]!.toUpperCase()}${words.slice(1)}`;
  return typeof effect === 'object'
    ? `${said}, wherever you are outdoors, ${till} or till you catch it.`
    : `${said} ${till}.`;
}
