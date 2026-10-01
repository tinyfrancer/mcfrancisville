import type { EyeId, HairColourId, HairStyleId, SkinId, TattooId } from '../types/ids';

/**
 * The creator's and the salon's choices, in the order they are offered. Only names live here; the
 * colours are the art's (`src/sprites/lookColours.ts`).
 */
export const SKINS: Record<SkinId, { name: string }> = {
  porcelain: { name: 'Porcelain' },
  peach: { name: 'Peach' },
  honey: { name: 'Honey' },
  bronze: { name: 'Bronze' },
  umber: { name: 'Umber' },
  ghostly: { name: 'Ghostly' },
  minty: { name: 'Minty' },
};

export const EYES: Record<EyeId, { name: string }> = {
  brown: { name: 'Brown' },
  blue: { name: 'Blue' },
  green: { name: 'Green' },
  hazel: { name: 'Hazel' },
  grey: { name: 'Grey' },
  plum: { name: 'Plum' },
};

/** Her split bob comes first: it is her own (personal_touches.md, "Her, drawn bigger"). */
export const HAIR_STYLES: Record<HairStyleId, { name: string }> = {
  splitBob: { name: 'Split bob' },
  long: { name: 'Long' },
  bob: { name: 'Bob' },
  bunches: { name: 'Bunches' },
  pixie: { name: 'Pixie' },
};

/**
 * Her own two colours come first: pink, and a very dark brown. Any two make a split dye, one on
 * each half (the look's `splitColour`).
 */
export const HAIR_COLOURS: Record<HairColourId, { name: string }> = {
  pink: { name: 'Pink' },
  darkBrown: { name: 'Dark brown' },
  blonde: { name: 'Blonde' },
  coral: { name: 'Coral' },
  brown: { name: 'Brown' },
  black: { name: 'Black' },
  auburn: { name: 'Auburn' },
  blue: { name: 'Blue' },
  lavender: { name: 'Lavender' },
  silver: { name: 'Silver' },
};

/** Which of her arms the striped sleeve goes on (0.2's K3): her right, as it really is. */
export const STRIPES_ARMS: Record<'right' | 'left', { name: string }> = {
  right: { name: 'Right arm' },
  left: { name: 'Left arm' },
};

export const TATTOOS: Record<TattooId, { name: string }> = {
  sleeves: { name: 'Sleeves' },
  scattered: { name: 'Scattered' },
};

/** A record's ids in the order they were written, which is the order they are offered in. */
export function idsOf<K extends string>(record: Record<K, unknown>): K[] {
  return Object.keys(record) as K[];
}
