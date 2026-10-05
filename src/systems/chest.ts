import { isKept } from '../data/items';
import type { ItemId } from '../types/ids';

/**
 * How many of something in her bag she could put away in her storage chest (0.3's H1): all she
 * can spare, which leaves what she has on her wrist, but none of what's hers to keep with her (her
 * skates, her broom, her keys, Fibi's bone), which the ice, the sky and the gates need in her bag.
 */
export function stowable(id: ItemId, spare: number): number {
  return isKept(id) ? 0 : Math.max(0, Math.floor(spare));
}
