import type { Signals, WorldState } from '../events';

/**
 * The order the world is made in, by area, and why (1.1's W3, decisions.md 210, 218). A service
 * listens for a signal, or a change to the state the HUD follows, in the order it was made, so the
 * order is who hears first; and an area takes what earlier ones made, reading anything made later
 * through a function. `WorldParts`' constructor (`build.ts`) makes them in this order, telling
 * `areaMade` after each, and `tests/world/areaOrder.test.ts` holds that it does, that each area
 * listens for exactly what it says here, in that order, and that nothing is sent while the world
 * is being made, so a service made later never misses one.
 *
 * A new area is a row here, where it must hear; a new listener is a word in its area's row.
 */
export const AREAS = [
  {
    area: 'keepers',
    hears: {},
    why: 'Every keeper (`keepersOf`) and what the areas share; keepers hear nothing.',
  },
  {
    area: 'making',
    hears: { state: ['bag'] },
    why:
      'First, needing nothing made: the honesty stall before the workbench that builds its ' +
      'second shelf, and `Belongings`, which later areas hand things through. It hears the bag ' +
      "first, so a thing she's had is noted before anything else reads the bag.",
  },
  {
    area: 'passive',
    hears: {},
    why: "Visits and the candy tree, after `Belongings`, which a visit's gift of furniture goes through.",
  },
  {
    area: 'firstDay',
    hears: { state: ['bag', 'candy', 'friends', 'stall'] },
    why:
      "Cody's list for her first day reads the stall, the tree and the visits, so it comes after " +
      'them; what it hears only tells it to look again.',
  },
  {
    area: 'places',
    hears: {},
    why: 'The zones and the stalls; a gate asks `Travel`, made in `going`, through a function.',
  },
  {
    area: 'everyday',
    hears: { signals: ['moved'] },
    why:
      'Made in the constructor itself: the garden (which hears a planter moved), the barn, ' +
      "gathering, the shops, her mailbox and the town's projects, which most areas after take.",
  },
  {
    area: 'shopping',
    hears: {},
    why: "Ollie's deliveries and catalogue, Gourdon's book and figurines, after the mailbox.",
  },
  {
    area: 'neighbours',
    hears: { signals: ['crossed', 'harvested', 'donated', 'placed', 'posted'] },
    why:
      'Talk, then the neighbourhood that reads who she talks to, and the services round them. ' +
      'The neighbourhood hears her cross first, so a guest at hers follows her into the next ' +
      "room before anything resets; what they remember of her and Ollie's round are heard here.",
  },
  {
    area: 'mystery',
    hears: { signals: ['bought', 'opened'] },
    why: 'The mystery hears a letter opened before the broom does, as it always has (decision 218).',
  },
  {
    area: 'festivals',
    hears: {},
    why: 'The calendar, holidays, trick or treat, the patch, the finale, rare events: after the neighbourhood they read.',
  },
  {
    area: 'outdoors',
    hears: {},
    why: 'The weather and the fountain, reading where she is through a function.',
  },
  {
    area: 'fairground',
    hears: {},
    why: "The fairground's games, fortune and snacks, which read the weather.",
  },
  {
    area: 'catching',
    hears: {},
    why: 'The net, the rod, the fossils and the buried keys, after the kitchen whose lure they read.',
  },
  {
    area: 'going',
    hears: { signals: ['opened'] },
    why:
      'Her movement, travel and the broom, late because they take the zones, the mailbox and the ' +
      'visits (till then every gate reads open); the broom hears a letter opened after the mystery.',
  },
  {
    area: 'forget',
    hears: { signals: ['crossed'] },
    why:
      "The world's own reset as she crosses, in the constructor: after the neighbourhood moves " +
      'her guests, before the record player, decorating and the pets hear it.',
  },
  {
    area: 'homeServices',
    hears: { signals: ['crossed', 'crossed'] },
    why: 'The record player, then decorating, hear her cross after the reset (decision 218).',
  },
  {
    area: 'petServices',
    hears: { signals: ['crossed'] },
    why: 'Her pets, last to hear her cross, after the record player and decorating.',
  },
  {
    area: 'her',
    hears: {
      state: ['bag', 'bag', 'home', 'closet', 'recipes', 'cabinet', 'bag', 'cabinet'],
      signals: ['carved', 'thrilled', 'felt'],
    },
    why:
      'Hands, novelty, milestones, sitting and poses, last on the bag: a seed she has run out of ' +
      "is let go, then what's new is marked, then the shelves (decision 218); poses hear " +
      '`thrilled` and `felt` from everyone made before.',
  },
  {
    area: 'upNow',
    hears: {},
    why: 'Today, a plain read of everything made before it; it hears nothing.',
  },
] as const satisfies readonly AreaStep[];

/** One step of making the world: an area's function in `areas/`, or the constructor's own. */
export interface AreaStep {
  area: string;
  /** What its services listen for, on each bus, in the order they start to. */
  hears: {
    signals?: readonly (keyof Signals & string)[];
    state?: readonly (keyof WorldState & string)[];
  };
  why: string;
}

export type AreaName = (typeof AREAS)[number]['area'];
