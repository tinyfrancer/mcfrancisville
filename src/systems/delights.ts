import { CRITTER_IDS, CRITTERS } from '../data/critters';
import { PET_GIFT_IDS, type PetGiftId } from '../data/petGifts';
import type { Weather } from '../data/weather';
import type { CritterId, MapZoneId, TileId } from '../types/ids';
import type { PlacedProp } from './grid';
import type { Tile } from './pathfinding';
import { hashString } from './random';
import { isAbout } from './critters';
import { seasonOf } from './seasons';

/*
 * Small delights (1.6's X5, decision 384): things that cost nothing and happen now and then, each
 * a short rule read off the clock and where she is. Nothing here is saved; what comes once a day
 * or a window is kept with the day's takings.
 */

/** How long she stands still outdoors before a butterfly or moth lands on her hat. */
export const PERCH_AFTER_MS = 8_000;
/** And how long after one landed before another may. */
export const PERCH_EVERY_MS = 60_000;

/**
 * The moths and butterflies that might land on her where she is now: the family's, not legendary,
 * and none in the rain, when they're sheltering under the leaves.
 */
export function fliersAbout(
  place: MapZoneId,
  day: string,
  hour: number,
  weather: Weather,
): CritterId[] {
  if (weather === 'rain') return [];
  return CRITTER_IDS.filter((id) => {
    const row = CRITTERS[id];
    return (
      row.family === 'moth' &&
      row.rarity !== 'legendary' &&
      row.where.includes(place) &&
      isAbout(id, day, hour, weather)
    );
  });
}

/** Which of them lands, the `n`th time today. */
export function flierFor(fliers: readonly CritterId[], day: string, n: number): CritterId | null {
  if (fliers.length === 0) return null;
  return fliers[hashString(`perch:${day}:${n}`) % fliers.length]!;
}

/** The ground fireflies gather over: the lawn, the meadow and the long grass. */
const GRASSY: readonly TileId[] = ['grass', 'meadow', 'longGrass'];

/** Fireflies are out from nine at night until four in the morning, in June, July and August. */
export const FIREFLIES_FROM = 21;
export const FIREFLIES_TO = 4;

/** Whether fireflies gather round her: a summer night, outdoors on grass, and not in the rain. */
export function firefliesOut(
  day: string,
  hour: number,
  ground: TileId | undefined,
  weather: Weather,
): boolean {
  if (seasonOf(day) !== 'summer' || weather === 'rain') return false;
  if (hour < FIREFLIES_FROM && hour >= FIREFLIES_TO) return false;
  return ground !== undefined && GRASSY.includes(ground);
}

/** How near the scarecrow she walks for its crow to caw at her, in tiles. */
export const CAW_REACH = 2;

/** The scarecrow she's walking past, if any: within two tiles of it. */
export function scarecrowBy(props: readonly PlacedProp[], her: Tile): PlacedProp | null {
  return (
    props.find(
      (p) =>
        p.id === 'scarecrow' &&
        her.tx >= p.tx - CAW_REACH &&
        her.tx < p.tx + p.w + CAW_REACH &&
        her.ty >= p.ty - CAW_REACH &&
        her.ty < p.ty + p.h + CAW_REACH,
    ) ?? null
  );
}

/** The crow on a scarecrow caws once a window, kept with the day's takings. */
export function cawKey(place: MapZoneId, p: PlacedProp): string {
  return `caw:${place}:${p.tx},${p.ty}`;
}

/** The ground that tickles her nose in spring. */
const TICKLY: readonly TileId[] = ['meadow', 'longGrass'];

/** Whether a tile tickles her nose on a day: the meadow and long grass, in spring. */
export function tickles(day: string, ground: TileId | undefined): boolean {
  return seasonOf(day) === 'spring' && ground !== undefined && TICKLY.includes(ground);
}

/** She sneezes once a window at most, kept with the day's takings. */
export const SNEEZE_KEY = 'sneeze';

/**
 * How many tickly tiles she walks onto in a window before she sneezes: between four and nine,
 * dealt by the window, so it comes now and then rather than at the first step.
 */
export function sneezeAfter(window: string): number {
  return 4 + (hashString(`sneeze:${window}`) % 6);
}

/** How far off a neighbour can be and still hear her sneeze, in tiles. */
export const BLESS_REACH = 4;

/** The nearest neighbour within earshot, of those standing on `near`'s tiles. */
export function blesser<T extends { tile: Tile }>(near: readonly T[], her: Tile): T | null {
  let best: T | null = null;
  let bestReach = Infinity;
  for (const n of near) {
    const d = Math.max(Math.abs(n.tile.tx - her.tx), Math.abs(n.tile.ty - her.ty));
    if (d <= BLESS_REACH && d < bestReach) {
      best = n;
      bestReach = d;
    }
  }
  return best;
}

/** Fibi brings her something once a day at home. */
export const GIFT_KEY = 'gift:fibi';

/** How long she has been home before Fibi brings it, so it isn't in the middle of her hello. */
export const GIFT_AFTER_MS = 6_000;

/** What Fibi brings on a day. */
export function giftOn(day: string): PetGiftId {
  return PET_GIFT_IDS[hashString(`fibiGift:${day}`) % PET_GIFT_IDS.length]!;
}
