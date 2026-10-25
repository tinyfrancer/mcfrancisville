import type { ItemId, MapZoneId, ProjectId, PropId } from '../types/ids';
import type { Tile } from './maps';

/*
 * The town's projects (V1's R4, decision 314): something to build, funded over weeks at the
 * noticeboard in Candy and in what she gathers and grows, one at a time. Each goes up where it'll
 * stand in three stages, the posts, then its frame, then the thing itself, and once it's built it's
 * hers to use. A new project is a row here, its pieces' art and a letter; the rules are
 * `systems/projects.ts`.
 */

/** How far along a project is, as it stands in the world. */
export type ProjectStage = 'posts' | 'frames' | 'done';

export const PROJECT_STAGES: readonly ProjectStage[] = ['posts', 'frames', 'done'];

/** Something that stands on a project's site at a stage, by its top-left tile. */
export interface SitePiece {
  prop: PropId;
  tx: number;
  ty: number;
}

/** What a project asks for besides Candy: so many of something she gathers or grows. */
export interface ProjectNeed {
  item: ItemId;
  count: number;
}

export interface ProjectRow {
  name: string;
  /** What it is and what it'll be for, on the noticeboard. */
  blurb: string;
  /** Where it goes up, and in words. */
  zone: MapZoneId;
  where: string;
  candy: number;
  needs: readonly ProjectNeed[];
  /** What stands on its site at each stage. Nothing stands there before she starts it. */
  stages: Record<ProjectStage, readonly SitePiece[]>;
  /** What's drawn on the noticeboard for it: the finished piece. */
  picture: PropId;
  /** Once built, the tiles that are walked on and not solid (the bridge's deck): wood, not ice. */
  deck?: readonly Tile[];
  /** Once built, the tiles that are beds of hers (the greenhouse's planters). */
  beds?: readonly Tile[];
  /** The mayor's letter when it's done, with `{name}` for hers. */
  letter: string;
  /** What she reads as it's finished. */
  built: string;
}

/** Four corner posts round a box, for the first stage. */
function corners(tx: number, ty: number, w: number, h: number): SitePiece[] {
  const xs = w > 1 ? [tx, tx + w - 1] : [tx];
  const ys = h > 1 ? [ty, ty + h - 1] : [ty];
  return ys.flatMap((y) => xs.map((x) => ({ prop: 'sitePost' as const, tx: x, ty: y })));
}

/** The bandstand on the square, beside the noticeboard. */
const BANDSTAND_AT = { tx: 26, ty: 19 };
/** The castle garden's new corner, on the west lawn below the castle. */
const GARDEN_AT = { tx: 6, ty: 24 };
/** The footbridge across Whisperwood's creek, from the woods to the far bank. */
const BRIDGE_AT = { tx: 21, ty: 25 };
/** Her greenhouse, at the top of her yard behind the house. */
const GREENHOUSE_AT = { tx: 5, ty: 1 };
/** The ice hut (1.4's G3), on the pond's north-east bank, its door on the water's side. */
const ICE_HUT_AT = { tx: 31, ty: 38 };

export const PROJECTS: Record<ProjectId, ProjectRow> = {
  bandstand: {
    name: 'The bandstand',
    blurb:
      "A bandstand on the square, with a pointy roof and bunting, for Boothoven's recitals and a tune whenever anyone walks up. After dark it plays the fountain's music box.",
    zone: 'town',
    where: 'on the square, by the noticeboard',
    candy: 5000,
    needs: [
      { item: 'wood', count: 80 },
      { item: 'stone', count: 40 },
      { item: 'pumpkin', count: 6 },
    ],
    stages: {
      posts: corners(BANDSTAND_AT.tx, BANDSTAND_AT.ty, 3, 2),
      frames: [{ prop: 'bandstandFrame', ...BANDSTAND_AT }],
      done: [{ prop: 'bandstand', ...BANDSTAND_AT }],
    },
    picture: 'bandstand',
    letter:
      "Dear {name},\n\nThe bandstand is up! I stood under its roof this morning and hummed, very quietly, and it hummed back. Boothoven says he'll play his Tuesday recitals there from now on, and he has already polished it twice.\n\nThank you for every plank and pumpkin. The square has a heart now.\n\nYour Mayor",
    built: 'The bandstand is finished! Walk up for a tune, any time.',
  },
  castleGarden: {
    name: 'The castle garden',
    blurb:
      'The overgrown corner of the castle garden made lovely again: two raised beds of flowers and a bench to sit on and look at them.',
    zone: 'castleHill',
    where: 'in the castle garden',
    candy: 3600,
    needs: [
      { item: 'stone', count: 60 },
      { item: 'wood', count: 30 },
      { item: 'rose', count: 6 },
      { item: 'marigold', count: 6 },
    ],
    stages: {
      posts: corners(GARDEN_AT.tx, GARDEN_AT.ty, 6, 1),
      frames: [
        { prop: 'bedFrame', ...GARDEN_AT },
        { prop: 'planks', tx: GARDEN_AT.tx + 2, ty: GARDEN_AT.ty },
        { prop: 'bedFrame', tx: GARDEN_AT.tx + 4, ty: GARDEN_AT.ty },
      ],
      done: [
        { prop: 'flowerBed', ...GARDEN_AT },
        { prop: 'gardenSeat', tx: GARDEN_AT.tx + 2, ty: GARDEN_AT.ty },
        { prop: 'flowerBed', tx: GARDEN_AT.tx + 4, ty: GARDEN_AT.ty },
      ],
    },
    picture: 'flowerBed',
    letter:
      "Dear {name},\n\nThe castle garden's corner is blooming! The roses have settled in beside the marigolds, and the new bench is exactly the right height for sitting and thinking. I sat and thought for an hour. It was lovely.\n\nCome and sit a while, whenever you like.\n\nYour Mayor",
    built: 'The castle garden is restored! Its new bench is just for sitting.',
  },
  footbridge: {
    name: 'The footbridge',
    blurb:
      "A little wooden bridge over Whisperwood's creek, so the far bank is a short stroll away, no skates needed.",
    zone: 'whisperwood',
    where: "over Whisperwood's creek",
    candy: 4200,
    needs: [
      { item: 'wood', count: 120 },
      { item: 'stone', count: 30 },
    ],
    stages: {
      posts: corners(BRIDGE_AT.tx, BRIDGE_AT.ty, 2, 2),
      frames: [{ prop: 'bridgeFrame', ...BRIDGE_AT }],
      done: [{ prop: 'footbridge', ...BRIDGE_AT }],
    },
    picture: 'footbridge',
    deck: [
      { tx: BRIDGE_AT.tx, ty: BRIDGE_AT.ty },
      { tx: BRIDGE_AT.tx + 1, ty: BRIDGE_AT.ty },
      { tx: BRIDGE_AT.tx, ty: BRIDGE_AT.ty + 1 },
      { tx: BRIDGE_AT.tx + 1, ty: BRIDGE_AT.ty + 1 },
    ],
    letter:
      "Dear {name},\n\nThe footbridge is across! I walked over it six times to make sure, and once more backwards, for luck. The far bank of the creek is a short stroll now, skates or no skates.\n\nMind the toadstools on the other side. They're shy.\n\nYour Mayor",
    built: 'The footbridge is finished! The far bank is a stroll away now.',
  },
  greenhouse: {
    name: 'Your greenhouse',
    blurb:
      "A little glasshouse of your own at the top of your yard, behind the house, with three planters under its glass where anything grows as if it's in season.",
    zone: 'town',
    where: 'in your yard, behind the house',
    candy: 6000,
    needs: [
      { item: 'wood', count: 60 },
      { item: 'stone', count: 40 },
      { item: 'sunflower', count: 4 },
    ],
    stages: {
      posts: corners(GREENHOUSE_AT.tx, GREENHOUSE_AT.ty, 3, 2),
      frames: [{ prop: 'greenhouseFrame', ...GREENHOUSE_AT }],
      done: [{ prop: 'herGreenhouse', ...GREENHOUSE_AT }],
    },
    picture: 'herGreenhouse',
    beds: [
      { tx: GREENHOUSE_AT.tx, ty: GREENHOUSE_AT.ty + 1 },
      { tx: GREENHOUSE_AT.tx + 1, ty: GREENHOUSE_AT.ty + 1 },
      { tx: GREENHOUSE_AT.tx + 2, ty: GREENHOUSE_AT.ty + 1 },
    ],
    letter:
      "Dear {name},\n\nYour greenhouse is finished! Gourdon fitted the last pane himself and then stood back and said nothing for a very long time, which I believe means he's proud. Three planters under glass, all yours: whatever you sow in them will think it's in season.\n\nGrow something wonderful.\n\nYour Mayor",
    built: 'Your greenhouse is finished! Its planters grow anything as if in season.',
  },
  iceHut: {
    name: 'The ice hut',
    blurb:
      "Gourdon's idea: a snug little hut on the pond's bank, with a stove to warm your mittens by and a hole in its floor to fish through, all winter long and the rest of the year too.",
    zone: 'town',
    where: "on the pond's bank, by the fountain",
    candy: 3800,
    needs: [
      { item: 'wood', count: 70 },
      { item: 'stone', count: 20 },
      { item: 'ghostPepper', count: 6 },
    ],
    stages: {
      posts: corners(ICE_HUT_AT.tx, ICE_HUT_AT.ty, 2, 2),
      frames: [{ prop: 'iceHutFrame', ...ICE_HUT_AT }],
      done: [{ prop: 'iceHut', ...ICE_HUT_AT }],
    },
    picture: 'iceHut',
    letter:
      "Dear {name},\n\nThe ice hut is up! Gourdon lit its stove with one of your ghost peppers and it has been toasty ever since. He drilled the hole in the floor himself, then sat by it for an hour with a flask of cocoa, which he says was testing.\n\nIt's yours whenever you fancy a quiet fish. Do take a cushion.\n\nYour Mayor",
    built: 'The ice hut is finished! Its stove is lit, and its hole is ready to fish through.',
  },
};

export const PROJECT_IDS = Object.keys(PROJECTS) as ProjectId[];

/** How much of a project's worth must be in before its frame goes up. */
export const FRAMES_FROM = 0.5;

/** Candy is given in lots of this much, the last lot whatever's left. */
export const CANDY_LOT = 100;
