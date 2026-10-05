import type { CrawlyPiece } from '../types/ids';
import type { FurnitureArt } from './furniture';
import { domed, framed } from './milestones';

// What the creepy-crawlies send her (0.3's C2): the milestones' gilt frame and glass dome, each
// with the critter itself inside, as the other families' are.

export const CRAWLY_PIECES_ART: Record<CrawlyPiece, FurnitureArt> = {
  framedSnail: framed('goldenSnail'),
  glowwormDome: domed('glowworm'),
};
