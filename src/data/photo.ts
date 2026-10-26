/*
 * The photo mode's filters (1.5's G5, decision 374), as she picks them in the viewfinder: what
 * each is called and the line under it. What each does to a pixel is `render/filters.ts`.
 */

export type FilterId = 'plain' | 'sepia' | 'spooky' | 'moonlit';

export interface FilterRow {
  name: string;
  /** Said as she picks it. */
  line: string;
}

export const FILTER_IDS: readonly FilterId[] = ['plain', 'sepia', 'spooky', 'moonlit'];

export const FILTERS: Record<FilterId, FilterRow> = {
  plain: { name: 'Plain', line: 'Just as it is. Lovely already.' },
  sepia: { name: 'Sepia', line: 'Like an old photo found in a very nice attic.' },
  spooky: { name: 'Spooky', line: 'A ghostly green glow, darker at the edges. Ooooo.' },
  moonlit: { name: 'Moonlit', line: 'Cool and blue, with a few stars sprinkled in.' },
};

/** What the viewfinder says as she lifts the camera. */
export const CAMERA_LINE = 'Drag to look around. Everyone close by will pose!';

/** The photo card's words, after the shutter. */
export const SNAPPED = {
  title: 'Snap!',
  line: 'Cody would like a copy, please.',
  /** The caption under a photo she didn't write one for: a print still has its foot. */
  untitled: 'McFrancisVille',
  full: 'Six stickers is plenty! Drag one off the photo to swap it.',
};
