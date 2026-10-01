import type {
  BraceletId,
  EyeId,
  FabricId,
  HairColourId,
  HairStyleId,
  OutfitId,
  SkinId,
  Slot,
  TattooId,
} from './ids';

/** One piece of clothing as worn: which piece, in which of its colours. */
export interface Worn {
  id: OutfitId;
  fabric: FabricId;
}

/** Everything that decides how she is drawn, plus the name she typed. Saved as is (save v2). */
export interface Look {
  name: string;
  skin: SkinId;
  eyes: EyeId;
  hairStyle: HairStyleId;
  hairColour: HairColourId;
  /**
   * The colour of her other half, for split dye, or null for one colour all over (save v27; before
   * it, split dye was two colours fixed together).
   */
  splitColour: HairColourId | null;
  gauges: boolean;
  tattoos: TattooId | null;
  /** Which of her arms the striped sleeve is on; the stars and flowers go on the other (save v27). */
  stripesArm: 'left' | 'right';
  /** Freckles across her nose and cheeks (save v13). */
  freckles: boolean;
  /** A little stud in her nose (save v13). */
  nosePiercing: boolean;
  /**
   * The bracelets stacked on her left wrist, nearest her hand first, at most three (save v28). Each
   * stays in her bag while she wears it.
   */
  wrist: BraceletId[];
  /** A slot left out is bare. Only the top is never bare. */
  outfit: Partial<Record<Slot, Worn>>;
}
