import type {
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
  gauges: boolean;
  tattoos: TattooId | null;
  /** A slot left out is bare. Only the top is never bare. */
  outfit: Partial<Record<Slot, Worn>>;
}
