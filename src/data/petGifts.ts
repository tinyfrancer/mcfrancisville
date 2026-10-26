/**
 * What Fibi brings her once a day at home (1.6's X5, decision 384): something she found, carried
 * in proudly. None of it is an item: it's shown, and given back, and never goes in her bag.
 */
export type PetGiftId = 'leaf' | 'sock' | 'bottleCap' | 'twig' | 'feather' | 'glove';

export interface PetGift {
  /** What she sees, `{name}` for Fibi's name as she has named her. */
  line: string;
}

export const PET_GIFTS: Record<PetGiftId, PetGift> = {
  leaf: { line: '{name} has brought you a leaf. A very good leaf. She would like it back now.' },
  sock: { line: '{name} has brought you a sock. It is not yours.' },
  bottleCap: {
    line: '{name} has brought you a bottle cap. She is very proud of it. Nobody knows whose it is.',
  },
  twig: { line: '{name} has brought you a twig. She chose it specially, out of all the twigs.' },
  feather: { line: "{name} has brought you a crow's feather. The crow would like a word." },
  glove: { line: '{name} has brought you one glove. Somewhere in town, a hand is chilly.' },
};

export const PET_GIFT_IDS = Object.keys(PET_GIFTS) as PetGiftId[];
