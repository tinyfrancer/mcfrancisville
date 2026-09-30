import type { EyeId, FabricId, HairColourId, SkinId } from '../types/ids';
import { PALETTE as C } from './palette';

/** A colour and the darker one beside it that gives it shape. */
export interface Tone {
  main: string;
  shade: string;
}

export const SKIN_TONES: Record<SkinId, Tone> = {
  porcelain: { main: C.skinPorcelain, shade: C.skinPorcelainShade },
  peach: { main: C.skin, shade: C.skinShade },
  honey: { main: C.skinHoney, shade: C.skinHoneyShade },
  bronze: { main: C.skinBronze, shade: C.skinBronzeShade },
  umber: { main: C.skinUmber, shade: C.skinUmberShade },
  ghostly: { main: C.skinGhostly, shade: C.skinGhostlyShade },
  minty: { main: C.skinMinty, shade: C.skinMintyShade },
};

export const EYE_COLOURS: Record<EyeId, string> = {
  brown: C.eyeBrown,
  blue: C.eyeBlue,
  green: C.eyeGreen,
  hazel: C.eyeHazel,
  grey: C.eyeGrey,
  plum: C.eyePlum,
};

/**
 * Hair is drawn with two keys, one per half of her head, so split dye is a palette and works on
 * every style for free (personal_touches.md). A solid colour is the same tone on both halves.
 */
export interface HairTones {
  /** Her left half. */
  left: Tone;
  right: Tone;
}

const HAIR: Record<HairColourId, Tone> = {
  pink: { main: C.hairPink, shade: C.hairPinkShade },
  darkBrown: { main: C.hairDarkBrown, shade: C.hairDarkBrownShade },
  blonde: { main: C.hairBlonde, shade: C.hairBlondeShade },
  coral: { main: C.hairCoral, shade: C.hairCoralShade },
  brown: { main: C.hairBrown, shade: C.hairBrownShade },
  black: { main: C.hairBlack, shade: C.hairBlackShade },
  auburn: { main: C.hairAuburn, shade: C.hairAuburnShade },
  blue: { main: C.hairBlue, shade: C.hairBlueShade },
  lavender: { main: C.hairLavender, shade: C.hairLavenderShade },
  silver: { main: C.hairSilver, shade: C.hairSilverShade },
};

/** A colour's swatch, for the creator and the salon. */
export function hairTone(id: HairColourId): Tone {
  return HAIR[id];
}

/**
 * Her hair's two halves: `colour` on her right and `split` on her left, as her own pink is on
 * her right and her dark brown on her left; with no split, both halves are the one colour.
 */
export function hairTones(colour: HairColourId, split: HairColourId | null): HairTones {
  return { right: HAIR[colour], left: HAIR[split ?? colour] };
}

export const FABRIC_TONES: Record<FabricId, Tone> = {
  blue: { main: C.blueFabric, shade: C.blueFabricShade },
  navy: { main: C.navy, shade: C.navyShade },
  sky: { main: C.sky, shade: C.skyShade },
  denim: { main: C.denim, shade: C.denimDark },
  rose: { main: C.rose, shade: C.berryLight },
  coral: { main: C.coral, shade: C.coralShade },
  cream: { main: C.cream, shade: C.creamShade },
  plum: { main: C.plumLight, shade: C.plum },
  lavender: { main: C.lavender, shade: C.lavenderShade },
  ink: { main: C.inkFabric, shade: C.inkFabricShade },
  moss: { main: C.mossLight, shade: C.moss },
  teal: { main: C.tealLight, shade: C.teal },
  pumpkin: { main: C.pumpkin, shade: C.pumpkinShade },
  silver: { main: C.silver, shade: C.silverShade },
  gold: { main: C.gold, shade: C.goldShade },
  scarlet: { main: C.scarlet, shade: C.scarletShade },
  maroon: { main: C.maroon, shade: C.maroonShade },
};
