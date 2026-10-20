/**
 * The builds a figure can be drawn in (1.1's A5a, decision 354): the body under every look, so a
 * neighbour isn't her silhouette in other colours. Every build is 32×48 with the same head, the
 * same rows (shoulders, waist, hips, knees, feet on the bottom row but one) and so the same face,
 * hair and hats; what a build changes is how wide each part of the body is. She is always
 * `regular`; a neighbour's is `build` on their row (`data/villagers.ts`), `regular` if it has none.
 */
export type Build = 'regular' | 'slight' | 'stout';

export interface BuildRow {
  /** What it is, for the gallery and the tests. */
  name: string;
}

export const BUILDS: Record<Build, BuildRow> = {
  regular: { name: 'her build, the one every look was first drawn on' },
  slight: { name: 'narrow in the shoulders and hips, a thin neck, slender arms and legs' },
  stout: { name: 'broad in the shoulders, round in the middle, sturdy on thick legs' },
};

export const BUILD_IDS = Object.keys(BUILDS) as Build[];
