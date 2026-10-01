/**
 * Her fishing rod's colours (personal_touches.md, "The rod (18)", 0.2's K2): nothing on it but its
 * pumpkin float, and the rod itself painted whichever of these she likes. It starts as plain wood.
 */
export type RodColourId = 'wood' | 'plum' | 'rose' | 'teal' | 'pumpkin' | 'sky' | 'ink' | 'gold';

export const ROD_COLOURS: Record<RodColourId, string> = {
  wood: 'Plain wood',
  plum: 'Plum',
  rose: 'Rose',
  teal: 'Teal',
  pumpkin: 'Pumpkin',
  sky: 'Sky blue',
  ink: 'Midnight',
  gold: 'Gold',
};

export const ROD_COLOUR_IDS = Object.keys(ROD_COLOURS) as RodColourId[];

export const FIRST_ROD: RodColourId = 'wood';

export function isRodColour(id: unknown): id is RodColourId {
  return typeof id === 'string' && id in ROD_COLOURS;
}
