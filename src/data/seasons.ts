import type { ClutterRule, DecalId } from './clutter';
import type { SeasonId } from './milestones';

export type { SeasonId };

/*
 * The town through the seasons (V1's L4, decision 294): the four seasons are the months the
 * Cabinet's shelves and the crops already go by (`SEASON_MONTHS`), and October is still the heart
 * of it: autumn's ground and trees are the ones the game had before the seasons turned. What a
 * season does to the colours is art (`sprites/seasons.ts`); what's here is what lies on the ground.
 */

/**
 * How the ground looks in a stretch of the year: the season's colours, and the decals it hides (the
 * daisies under the snow, last autumn's leaves in spring) or adds after each place's own (more
 * flowers in spring, leaf drifts building through autumn), and whether snow lies on it.
 */
export interface GroundLook {
  season: SeasonId;
  hides: readonly DecalId[];
  adds: readonly ClutterRule[];
  /** Snow lies on the ground and the roofs, so no puddles stand on it and the rain falls as snow. */
  snow?: true;
}

export type GroundLookId = 'winter' | 'spring' | 'summer' | 'earlyAutumn' | 'autumn' | 'lateAutumn';

/** What snow covers: everything that lies on the lawn but pinecones and twigs, and the lily pads. */
const UNDER_SNOW: readonly DecalId[] = [
  'leaves',
  'clover',
  'mushroomRing',
  'leafDrift',
  'puddle',
  'acorns',
  'daisies',
  'molehill',
  'dandelions',
  'fairyRing',
  'lilyPad',
];

export const GROUND_LOOKS: Record<GroundLookId, GroundLook> = {
  winter: { season: 'winter', hides: UNDER_SNOW, adds: [], snow: true },
  spring: {
    season: 'spring',
    hides: ['leaves', 'leafDrift', 'acorns'],
    adds: [
      { decal: 'daisies', on: 'grass', oneIn: 9 },
      { decal: 'dandelions', on: 'grass', oneIn: 11 },
    ],
  },
  summer: {
    season: 'summer',
    hides: ['leaves', 'leafDrift'],
    adds: [{ decal: 'clover', on: 'grass', oneIn: 10 }],
  },
  // Through autumn the drifts build: the leaves under the trees in September, the drifts out on the
  // lawn by October (as the town always was), and in November more of both, all over.
  earlyAutumn: { season: 'autumn', hides: ['leafDrift'], adds: [] },
  autumn: { season: 'autumn', hides: [], adds: [] },
  lateAutumn: {
    season: 'autumn',
    hides: [],
    adds: [
      { decal: 'leafDrift', on: 'grass', oneIn: 8 },
      { decal: 'leaves', on: 'grass', oneIn: 11 },
    ],
  },
};

/** Which look each month of the year has, January first. */
export const MONTH_LOOKS: readonly GroundLookId[] = [
  'winter',
  'winter',
  'spring',
  'spring',
  'spring',
  'summer',
  'summer',
  'summer',
  'earlyAutumn',
  'autumn',
  'lateAutumn',
  'winter',
];
