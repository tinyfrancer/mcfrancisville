import { ITEMS } from '../data/items';
import { AT_THE_DOOR, BOWL_NOTE, SWEETS, TRICK_OR_TREAT_FESTIVAL } from '../data/trickOrTreat';
import { VILLAGERS } from '../data/villagers';
import type { ItemId, VillagerId } from '../types/ids';
import { festivalsOn } from './calendar';
import { dayKey, windowKey, windowOf } from './clock';
import { hashMixed } from './random';

/**
 * Trick or treat (0.2's J2, decision 144), from the clock alone: whether it's a trick-or-treat
 * evening, and which sweet each door hands out today. What she has had is `Takings`', once a day
 * a door (`knockKey`).
 */

/** Whether it's an evening of the festival, when the doors are knocked on. */
export function isTrickOrTreat(now: number): boolean {
  return festivalsOn(dayKey(now)).includes(TRICK_OR_TREAT_FESTIVAL) && windowOf(now) === 'evening';
}

/** Whether the Halloween Festival is on at all today: the candy tree grows sweets all day. */
export function isSweetSeason(now: number): boolean {
  return festivalsOn(dayKey(now)).includes(TRICK_OR_TREAT_FESTIVAL);
}

const TOTAL = SWEETS.reduce((sum, s) => sum + s.weight, 0);

/** A sweet dealt from the bowl by a key, weighted: the same key always deals the same one. */
function dealt(key: string): ItemId {
  let roll = hashMixed(key) % TOTAL;
  for (const { item, weight } of SWEETS) {
    if (roll < weight) return item;
    roll -= weight;
  }
  return SWEETS[0]!.item;
}

/** What a neighbour's door hands out on a day. */
export function sweetAt(villager: VillagerId, day: string): ItemId {
  return dealt(`sweet:${villager}:${day}`);
}

/** The sweet that falls with the candy tree's Candy in a window of the festival. */
export function treeSweet(now: number): ItemId {
  return dealt(`tree:${windowKey(now)}`);
}

/** What she has had from a door is kept by this, once a day. */
export const knockKey = (villager: VillagerId) => `knock:${villager}`;

/** A sweet as it's handed over: "a gummy cluster", "a box of chewy dots". */
export function aSweet(item: ItemId): string {
  const one = ITEMS[item].name.toLowerCase();
  return `${/^[aeiou]/.test(one) ? 'an' : 'a'} ${one}`;
}

/**
 * What happens at the door, `{name}` still to fill: the neighbour's own line if they're home, or
 * the bowl on the step.
 */
export function doorLine(villager: VillagerId, item: ItemId, home: boolean): string {
  const text = home ? AT_THE_DOOR[villager] : BOWL_NOTE.replace('{who}', VILLAGERS[villager].name);
  return text.replace('{sweet}', aSweet(item));
}
