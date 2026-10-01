import type { BraceletId } from '../types/ids';
import { PALETTE as C } from './palette';

/**
 * Each bracelet's beads, in the order they're strung: the colours of its icon in her bag, and of
 * the band on her wrist (0.2's W1).
 */
export const BRACELET_BEADS: Record<BraceletId, readonly string[]> = {
  loveBracelet: [C.roseLight, C.white],
  smileyBracelet: [C.lavender, C.gold],
  friendshipBracelet: [C.roseLight, C.gold, C.inkFabric, C.ghost],
  tigersBracelet: [C.pumpkin, C.ink, C.roseLight],
  scarletBracelet: [C.scarlet, C.silver, C.roseLight],
  spookyBracelet: [C.ghost, C.inkFabric],
};
