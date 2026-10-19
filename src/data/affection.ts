import type { FurnitureId, PetId } from '../types/ids';

/**
 * Pets that grow (V1's R6c, decision 317): each of her pets grows fonder of her from pats, walks
 * and treats, a little a day, and at each of two levels has new things to say and do. Nothing is
 * ever lost: a day she doesn't come by is just a day, and the points only ever go up.
 */

/** How fond a pet is of her: 0 to start, 1 once it's learnt its job, 2 once it's learnt a trick. */
export type PetLevel = 0 | 1 | 2;

/** What makes a pet fonder of her. */
export type FondKind = 'pat' | 'walk' | 'treat';

/** What each is worth, and how many points of it count in a day, per pet. */
export const FONDNESS: Record<FondKind, { points: number; perDay: number }> = {
  pat: { points: 1, perDay: 3 },
  walk: { points: 1, perDay: 4 },
  treat: { points: 3, perDay: 3 },
};

/** How many tiles she walks outdoors with a pet beside her for a walk's point. */
export const WALK_TILES = 24;

/**
 * The points each level is reached at: two days of everything for the first, six for the second;
 * a pat a day and a short walk, about a week and three.
 */
export const LEVEL_AT: readonly [number, number, number] = [0, 20, 60];

/** What a pet's fondness is kept as, in the save: its points, and what counted on `day`. */
export interface Fondness {
  points: number;
  /** The day the counts below are for. */
  day: string | null;
  pat: number;
  walk: number;
  treat: number;
}

export const NO_FONDNESS: Fondness = { points: 0, day: null, pat: 0, walk: 0, treat: 0 };

/**
 * Three more pat lines at each level, in each one's own character (personal_touches.md, "The
 * pets"), said after the three they've always had. `{name}` is theirs.
 */
export const GROWN_PATS: Record<PetId, readonly [readonly string[], readonly string[]]> = {
  florence: [
    [
      '{name} purrs without waking up. She knows your hands by heart now.',
      '{name} lifts the edge of her blanket so your hand can come in too.',
      '{name} kneads the blanket, slow as honey, and sighs the happiest sigh.',
    ],
    [
      '{name} rolls onto her back for belly rubs. Warm, wrinkly, perfect.',
      '{name} wakes up all the way, just for you. From Florence, that is love.',
      '{name} headbutts your chin and falls asleep mid-purr, right there.',
    ],
  ],
  fibi: [
    [
      '{name} whines a whole song about her day. Most of it is about bones.',
      '{name} rests her big head on your knee and gives you the eyes.',
      '{name} sniffs your pockets for bones, finds pats instead, and is fine with it.',
    ],
    [
      '{name} sits up tall and offers you a paw. Then the other paw. Then whines.',
      '{name} flops against you with a happy groan. You smell a bit like her now.',
      "{name} brings you a stick she found. It's yours. (She'll want it back.)",
    ],
  ],
  dolly: [
    [
      '{name} gives one brave little woof, from right beside you. Progress!',
      '{name} presses her curly head into your hand and wags with her whole self.',
      '{name} lets you fluff her pom-poms. Only you are allowed to do that.',
    ],
    [
      '{name} stands in front of you for once, on guard. Then checks you saw.',
      '{name} does a happy prance, ears flopping, bandana flying.',
      '{name} boops your nose with hers. Bravest girl in McFrancisVille.',
    ],
  ],
  gary: [
    [
      "{name} pokes out both eye stalks at once. That's a big day for Gary.",
      '{name} leaves a little shiny trail in the shape of a heart. Probably on purpose.',
      '{name}… … … wiggles one stalk. You feel very appreciated.',
    ],
    [
      '{name} moves a whole centimetre towards you. Towards you!',
      '{name} says "…" with real feeling this time.',
      "{name} lets you pat his shell. It's warm. He's beaming, on the inside.",
    ],
  ],
  wybie: [
    [
      '{name} zooms one lap, flickers, and lands back in your hands for more.',
      '{name} purrs so hard his little ears go see-through.',
      '{name} headbutts you, misses a bit, and floats right through your arm. Oops!',
    ],
    [
      '{name} drapes round your neck like a cool, purring scarf. Then ZOOM.',
      '{name} glows extra blue and sits still for three whole pats.',
      '{name} chirps at you, does a backflip, and pretends that was on purpose.',
    ],
  ],
  elvira: [
    [
      '{name} glows a soft green and melts into your lap.',
      '{name} purrs a ghostly little rumble you can feel in your bones.',
      '{name} rubs her cheek on yours. The heart over her eye glows a touch brighter.',
    ],
    [
      '{name} wraps her plume of a tail round your wrist. Not letting go.',
      '{name} fades in and out, happily, like a nightlight just for you.',
      "{name} gives you slow blinks, one after another. That's cat for I love you.",
    ],
  ],
};

/** A pet's trick, learnt at level two: what it's called on the sheet and what it does. */
export interface TrickRow {
  name: string;
  line: string;
  /** How long it takes, start to finish. */
  ms: number;
}

export const TRICKS: Record<PetId, TrickRow> = {
  florence: {
    name: 'rolls over',
    line: '{name} rolls over, very slowly, blanket and all. Ta-da. Now, a nap.',
    ms: 1800,
  },
  fibi: {
    name: 'sits up and begs',
    line: '{name} sits up tall, paws up, and begs beautifully. And whines. Mostly whines.',
    ms: 1600,
  },
  dolly: {
    name: 'spins',
    line: '{name} spins round and round and round, then has to sit down for a moment.',
    ms: 1400,
  },
  gary: {
    name: 'does a trick… eventually',
    line: '{name} is doing a trick. … … … There! He did it. (You think.)',
    ms: 3600,
  },
  wybie: {
    name: 'loops the loop',
    line: '{name} loops the loop through the air and lands like nothing happened.',
    ms: 1300,
  },
  elvira: {
    name: 'fades and reappears',
    line: '{name} fades away to nothing… and pops back, right in your arms. Boo!',
    ms: 2000,
  },
};

/** What a pet does on a walk once it's fond enough (level one). */
export type PetJob = 'sniff' | 'bark' | 'draw' | 'fetch' | 'nap';

export interface JobRow {
  job: PetJob;
  /** What the sheet says it does, after "On walks, {name}". */
  does: string;
}

export const JOBS: Record<PetId, JobRow> = {
  florence: { job: 'nap', does: "naps. It's her job, and she is the very best at it." },
  fibi: { job: 'sniff', does: "sniffs out the day's mound, and sits by it till you dig." },
  dolly: { job: 'bark', does: 'barks the shy critters out, so they settle for your net.' },
  gary: { job: 'nap', does: 'naps in his shell. It is his job too, and he takes it seriously.' },
  wybie: { job: 'fetch', does: "fetches anything a neighbour's dropped about town." },
  elvira: { job: 'draw', does: 'draws the orbs a little nearer to you.' },
};

/** What each says on the sheet's toast as it grows: at level one, then at level two. */
export const GREW_LINES: Record<PetId, readonly [string, string]> = {
  florence: [
    '{name} adores you a little more. On walks, she has taken up napping professionally.',
    '{name} adores you to bits, and has learnt to roll over. Ask her nicely!',
  ],
  fibi: [
    "{name} adores you a little more, and has started sniffing out the day's mound on walks.",
    '{name} adores you to bits, and can sit up and beg. Try her trick!',
  ],
  dolly: [
    '{name} adores you a little more, and is brave enough to bark the shy critters out.',
    '{name} adores you to bits, and has learnt to spin. Try her trick!',
  ],
  gary: [
    '{name} adores you a little more, in his way. He naps on walks now, on purpose.',
    '{name} adores you to bits, and has learnt a trick. It takes a while.',
  ],
  wybie: [
    '{name} adores you a little more, and fetches whatever a neighbour drops.',
    '{name} adores you to bits, and can loop the loop. Try his trick!',
  ],
  elvira: [
    '{name} adores you a little more, and draws the orbs nearer when you walk.',
    '{name} adores you to bits, and can fade away and back. Try her trick!',
  ],
};

/** What each does with a treat from her bag. `{treat}` is what it was. */
export const TREAT_LINES: Record<PetId, string> = {
  florence: '{name} wakes up for the {treat}, eats it in one bite, and goes back to sleep happy.',
  fibi: '{name} takes the {treat} so gently, then whines for another. One a day, Fibi.',
  dolly: '{name} sniffs the {treat} bravely, decides it is safe, and wolfs it down.',
  gary: '{name} gets to work on the {treat}. He will be at it till tomorrow, very content.',
  wybie: '{name} snatches the {treat} and zooms off to eat it somewhere private.',
  elvira: '{name} nibbles the {treat} delicately, then purrs at you for ages.',
};

/** Where a pet likes to rest at home: by the fire, on a bed or a sofa, or sprawled on a rug. */
export type RestKind = 'hearth' | 'bed' | 'sofa' | 'rug';

export interface RestRow {
  kind: RestKind;
  /** How far up it holds a pet, in pixels from the floor at its front edge; none for a rug. */
  lift?: number;
}

/** The pieces a pet will rest at, in her home. */
export const PET_RESTS: Partial<Record<FurnitureId, RestRow>> = {
  stoneHearth: { kind: 'hearth' },
  batBed: { kind: 'bed', lift: 14 },
  canopyBed: { kind: 'bed', lift: 14 },
  velvetSettee: { kind: 'sofa', lift: 13 },
  coffinSofa: { kind: 'sofa', lift: 13 },
  moonRug: { kind: 'rug' },
  spiderwebRug: { kind: 'rug' },
  pawPrintRug: { kind: 'rug' },
  heartRug: { kind: 'rug' },
  moonPhaseRug: { kind: 'rug' },
};

/** Where each likes to rest best, first to last: Florence by the fire, the ghosts on the bed. */
export const REST_LIKES: Record<PetId, readonly RestKind[]> = {
  florence: ['hearth', 'bed', 'sofa', 'rug'],
  fibi: ['rug', 'hearth', 'sofa'],
  dolly: ['sofa', 'bed', 'rug'],
  gary: ['rug', 'hearth'],
  wybie: ['bed', 'sofa', 'rug'],
  elvira: ['bed', 'sofa', 'hearth', 'rug'],
};
