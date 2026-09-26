import type { Facing } from '../types/ids';
import { PALETTE as C } from './palette';
import type { Palette, SpriteSource } from './sprite';

/*
 * A placeholder villager to walk the town with until phase 3's paper doll replaces it. The body is
 * assembled from a head, a torso and a pair of legs so the walk frames only redraw the legs.
 */

const HEAD_DOWN = [
  '.....oooooo.....',
  '....ohhhhhho....',
  '...ohhHhhhhho...',
  '...ohhhhhhhho...',
  '...ohssssssho...',
  '...osesssseso...',
  '...oscsssscso...',
  '....osssssso....',
  '.....oSSSSo.....',
];

const HEAD_UP = [
  '.....oooooo.....',
  '....ohhhhhho....',
  '...ohhHhhhhho...',
  '...ohhhhhhhho...',
  '...ohhhhhhhho...',
  '...ohhhHhhhho...',
  '...ohhhhhhhho...',
  '....ohhhhhho....',
  '.....oSSSSo.....',
];

const HEAD_RIGHT = [
  '.....oooooo.....',
  '....ohhhhhho....',
  '...ohhhhHhhho...',
  '...ohhhhhhhho...',
  '...ohhhhhsssso..',
  '...ohhhhssesso..',
  '...ohhhhscssso..',
  '....ohhhsssso...',
  '.....oSSSSo.....',
];

const TORSO_FRONT = [
  '....otttttto....',
  '...otttttttto...',
  '...ottTttTtto...',
  '...osttttttso...',
  '...osTttttTso...',
  '....otttttto....',
  '....oTTTTTTo....',
  '....ojjjjjjo....',
  '....ojjjjjjo....',
  '....ojjJJjjo....',
  '....ojjoojjo....',
];

const TORSO_SIDE = [
  '.....otttto.....',
  '....otttttto....',
  '....ottTttto....',
  '....otsTttto....',
  '....otsTttto....',
  '....otttttto....',
  '....oTTTTTTo....',
  '....ojjjjjjo....',
  '.....ojjjjo.....',
  '.....ojjjjo.....',
  '.....ojjjjo.....',
];

const LEGS_FRONT_STAND = [
  '....ojjoojjo....',
  '....ojjoojjo....',
  '....obboobbo....',
  '....oooooooo....',
];
const LEGS_FRONT_A = [
  '....ojjoojjo....',
  '....obboojjo....',
  '....ooo.obbo....',
  '........oooo....',
];
const LEGS_FRONT_B = [
  '....ojjoojjo....',
  '....ojjoobbo....',
  '....obbo.ooo....',
  '....oooo........',
];
const LEGS_SIDE_STAND = [
  '.....ojjjjo.....',
  '.....ojjjjo.....',
  '.....obbbbbo....',
  '.....ooooooo....',
];
const LEGS_SIDE_A = [
  '....ojjoojjo....',
  '...ojjo..ojjo...',
  '...obbo..obbbo..',
  '...oooo..ooooo..',
];

function body(head: string[], torso: string[], legs: string[]): SpriteSource {
  return { rows: [...head, ...torso, ...legs] };
}

/** Standing first, then the two walk frames. Left is right, flipped when it is baked. */
export const PLAYER_FRAMES: Record<Exclude<Facing, 'left'>, SpriteSource[]> = {
  down: [
    body(HEAD_DOWN, TORSO_FRONT, LEGS_FRONT_STAND),
    body(HEAD_DOWN, TORSO_FRONT, LEGS_FRONT_A),
    body(HEAD_DOWN, TORSO_FRONT, LEGS_FRONT_B),
  ],
  up: [
    body(HEAD_UP, TORSO_FRONT, LEGS_FRONT_STAND),
    body(HEAD_UP, TORSO_FRONT, LEGS_FRONT_A),
    body(HEAD_UP, TORSO_FRONT, LEGS_FRONT_B),
  ],
  right: [
    body(HEAD_RIGHT, TORSO_SIDE, LEGS_SIDE_STAND),
    body(HEAD_RIGHT, TORSO_SIDE, LEGS_SIDE_A),
    body(HEAD_RIGHT, TORSO_SIDE, LEGS_SIDE_STAND),
  ],
};

export const PLAYER_PALETTE: Palette = {
  '.': null,
  o: C.ink,
  h: C.hair,
  H: C.hairLight,
  s: C.skin,
  S: C.skinShade,
  e: C.ink,
  c: C.cheek,
  t: C.tee,
  T: C.teeShade,
  j: C.denim,
  J: C.denimDark,
  b: C.night,
};
