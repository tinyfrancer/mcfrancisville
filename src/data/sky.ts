import type { MapZoneId } from '../types/ids';

/** Something that crosses the sky over a place (V1's E5): a crow by day, a bat at dusk. */
export type Flyer = 'crow' | 'bat';

/**
 * What crosses each place's sky, one entry a flyer, each crossing now and then in its own time:
 * crows over the fields and woods, bats round the castle and the trees at dusk. Only to be seen,
 * so nothing in the world knows of them; a new one is an entry here.
 */
export const SKY: Record<MapZoneId, readonly Flyer[]> = {
  town: ['crow', 'crow', 'bat', 'bat'],
  whisperwood: ['crow', 'crow', 'crow', 'bat', 'bat', 'bat'],
  lanternShore: ['crow', 'bat', 'bat'],
  castleHill: ['crow', 'bat', 'bat', 'bat', 'bat'],
  hiddenClearing: ['bat', 'bat'],
  fairground: ['crow', 'bat'],
  booAcres: ['crow', 'crow', 'crow', 'crow', 'bat'],
};

/**
 * Where the month's constellation hangs faint in the night once she has traced it (1.5's G4):
 * over the castle hill, where the telescope is; the rest of the world's sky is left to the moon.
 */
export const STARRY: readonly MapZoneId[] = ['castleHill'];

/** When each is out, by the hour: crows from dawn to the golden hour, bats from dusk till late. */
export const FLYER_HOURS: Record<Flyer, { from: number; to: number }> = {
  crow: { from: 6.5, to: 18.5 },
  bat: { from: 18, to: 23 },
};
