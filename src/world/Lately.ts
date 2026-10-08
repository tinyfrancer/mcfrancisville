import { isCritter } from '../data/critters';
import { CROPS } from '../data/crops';
import { isFossil } from '../data/fossils';
import { FURNITURE } from '../data/furniture';
import type { CritterId, CropId, FossilId, FurnitureId } from '../types/ids';

/**
 * What she has done lately that her neighbours remember and bring up (V1's P1, save v44): the
 * last piece she put out at home or in her yard, the last crop she picked and the last thing she
 * gave the museum, each with its day. Only the last of each is kept; nothing else is needed.
 */
export interface LatelySnapshot {
  placed: { piece: FurnitureId; day: string } | null;
  harvested: { crop: CropId; day: string } | null;
  donated: { thing: CritterId | FossilId; day: string } | null;
}

/** Nothing done yet: a new town, or a save from before they remembered. */
export const NOTHING_LATELY: LatelySnapshot = { placed: null, harvested: null, donated: null };

function dayOf(value: unknown): string | null {
  const day = (value as { day?: unknown } | null)?.day;
  return typeof day === 'string' ? day : null;
}

/** One of the last things she did, if it's a thing this build knows. */
function known<K extends string, T extends string>(
  value: unknown,
  key: K,
  is: (id: string) => id is T,
): ({ day: string } & Record<K, T>) | null {
  const day = dayOf(value);
  const id = (value as Record<string, unknown> | null)?.[key];
  if (!day || typeof id !== 'string' || !is(id)) return null;
  return { [key]: id, day } as { day: string } & Record<K, T>;
}

const isPiece = (id: string): id is FurnitureId => id in FURNITURE;
const isCrop = (id: string): id is CropId => id in CROPS;
const isThing = (id: string): id is CritterId | FossilId => isCritter(id) || isFossil(id);

export class Lately {
  private kept: LatelySnapshot;

  constructor(saved?: Partial<LatelySnapshot>) {
    this.kept = {
      placed: known(saved?.placed, 'piece', isPiece),
      harvested: known(saved?.harvested, 'crop', isCrop),
      donated: known(saved?.donated, 'thing', isThing),
    };
  }

  /** She put a piece out at home or in her yard. */
  placed(piece: FurnitureId, day: string): void {
    this.kept.placed = { piece, day };
  }

  /** She picked a crop. */
  harvested(crop: CropId, day: string): void {
    this.kept.harvested = { crop, day };
  }

  /** She gave the museum a critter or a fossil. */
  donated(thing: CritterId | FossilId, day: string): void {
    this.kept.donated = { thing, day };
  }

  /** The last of each, for a talk. */
  get last(): LatelySnapshot {
    return { ...this.kept };
  }

  snapshot(): { lately: LatelySnapshot } {
    return { lately: { ...this.kept } };
  }
}
