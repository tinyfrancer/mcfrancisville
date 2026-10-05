import type { FurnitureArt } from './furniture';
import { FOSSIL_ART } from './fossils';
import { domeOver, specimenOf } from './milestones';

// What the fossil case sends her (0.3's C1): the moth in amber under the milestones' glass dome.
// Barty's fossil shelf is a set piece, drawn with the others in `display.ts`.

const amber = FOSSIL_ART.mothInAmber;

export const FOSSIL_PIECES_ART: Record<'amberDome', FurnitureArt> = {
  amberDome: domeOver(specimenOf(amber.source, amber.palette, amber.glow)),
};
