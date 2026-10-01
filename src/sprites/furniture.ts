import { HALLOWEEN_PHOTO_ART } from './finale';
import { HOLIDAY_FURNITURE_ART } from './holidays';
import { FIRST_BROOM } from '../data/broom';
import { broomStandArt } from './broom';
import { FURNITURE } from '../data/furniture';
import type { FurnitureId } from '../types/ids';
import { CRAFTED_ART } from './crafted';
import { GIFT_ART } from './gifts';
import { KEEPSAKE_ART } from './keepsakes';
import { MUSEUM_ART } from './museum';
import { MILESTONE_ART } from './milestones';
import { NEWCOMER_PIECES_ART } from './newcomerPieces';
import { PIECES_ART } from './pieces';
import { TOUCHES_ART } from './touches';
import type { PropLight } from './props';
import type { Palette, SpriteSource } from './sprite';

/**
 * A piece of furniture's picture. A floor piece stands with its bottom row on the front edge of its
 * footprint and may rise above it; a rug is exactly its footprint, flat; a wall piece exactly fills
 * the wall tiles it hangs on.
 */
export interface FurnitureArt {
  /** Facing her, which is how it's first put down and how the shops show it. */
  source: SpriteSource;
  palette: Palette;
  /** For a piece that turns all four ways: facing right (and, mirrored, left), and from behind. */
  side?: SpriteSource;
  back?: SpriteSource;
  /** Its keys that light up after dark, in their lit colours, as a prop's do. */
  glow?: Palette;
  lights?: readonly PropLight[];
}

export const FURNITURE_ART: Record<FurnitureId, FurnitureArt> = {
  ...PIECES_ART,
  ...CRAFTED_ART,
  ...GIFT_ART,
  ...KEEPSAKE_ART,
  ...MUSEUM_ART,
  ...MILESTONE_ART,
  ...TOUCHES_ART,
  ...NEWCOMER_PIECES_ART,
  ...HOLIDAY_FURNITURE_ART,
  broomStand: broomStandArt(FIRST_BROOM),
  halloweenPhoto: HALLOWEEN_PHOTO_ART,
};

/** The picture a piece shows turned `turn` times, and whether it's drawn mirrored. */
export function furnitureSprite(
  id: FurnitureId,
  turn: number,
): { source: SpriteSource; flip: boolean } {
  const art = FURNITURE_ART[id];
  const turns = FURNITURE[id].turns;
  if (turns === 'four') {
    if (turn === 1) return { source: art.side ?? art.source, flip: false };
    if (turn === 2) return { source: art.back ?? art.source, flip: false };
    if (turn === 3) return { source: art.side ?? art.source, flip: true };
    return { source: art.source, flip: false };
  }
  return { source: art.source, flip: turns === 'mirror' && turn % 2 === 1 };
}
