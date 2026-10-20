import type { Build } from '../../data/builds';
import type { ActionPose, Pose } from '../../types/ids';
import { CLEAR, Sketch } from '../sketch';
import type { Layer } from '../sprite';
import {
  ARM,
  BANG_DROP,
  DOLL_HEIGHT,
  DOLL_WIDTH,
  frontLegs,
  head,
  limb,
  outlineAll,
  type PoseBody,
  trunk,
  upperArms,
  type View,
  measured,
} from './body';
import { PHYSIQUES, type Physique } from './builds';

/*
 * Her poses (decisions 88 and 89), her action poses (V1's E2, decision 281) and the folds that
 * sit, crouch and breathe her: bodies of their own, and her standing layers folded.
 */

/** A pose drawn with a body of its own, facing the front; sitting is her standing, folded. */
export type FrontPose = Exclude<Pose, 'sit' | ActionPose>;

/** Every pose (`src/systems/poses.ts` says when) but sitting faces the front. */
export const POSES: readonly FrontPose[] = ['phone', 'arms', 'horns', 'bang', 'pinup'];

/**
 * Sitting (0.2's G1) is her standing still with her thighs folded away: these rows of her legs,
 * from just under her hips, come out, and everything above them comes down. Her knees point at
 * us, her hands rest on the seat beside her, and her feet stay on the floor.
 */
export const SIT_FROM = 37;

export const SIT_DROP = 4;

/**
 * An arm raised above her head with the devil horns up: a fist with two fingers pointing, from her
 * shoulder at (`sx`, 27) to a wrist at (`wx`, 13). `side` is -1 for the viewer's left.
 */
function raisedArm(s: Sketch, side: -1 | 1): void {
  const at = (x: number) => (side === -1 ? x : 31 - x);
  for (let y = 13; y <= 27; y++) {
    const t = (27 - y) / 14;
    const x = Math.round(3.5 + (y - 13) * (5 / 14));
    const key = t < 0.3 ? 'a' : t < 0.5 ? 'e' : 'w';
    for (let i = -1; i <= 1; i++) s.set(at(x + i), y, key);
  }
  s.rect(Math.min(at(2), at(5)), 10, 4, 3, 'A');
  for (const x of [2, 5]) s.set(at(x), 9, 'A').set(at(x), 8, 'A');
}

/** A line under (and at the ends of) whatever `over` crosses, where it lies over `onto`. */
function lineUnder(s: Sketch, over: string, onto: string): void {
  const changes: [number, number][] = [];
  for (let y = 0; y < s.height; y++) {
    for (let x = 0; x < s.width; x++) {
      if (!onto.includes(s.get(x, y) ?? CLEAR)) continue;
      const above = s.get(x, y - 1) ?? CLEAR;
      const beside = [s.get(x - 1, y) ?? CLEAR, s.get(x + 1, y) ?? CLEAR];
      if (over.includes(above) || beside.some((k) => 'wA'.includes(k) && over.includes(k))) {
        changes.push([x, y]);
      }
    }
  }
  for (const [x, y] of changes) s.set(x, y, 'o');
}

function poseBody(pose: FrontPose): PoseBody {
  const s = new Sketch(DOLL_WIDTH, DOLL_HEIGHT);
  trunk(s, 'front');
  frontLegs(s, 0);
  if (pose === 'phone') {
    upperArms(s);
    s.rect(7, 29, 4, 2, 'e').rect(21, 29, 4, 2, 'e');
    s.rect(10, 30, 3, 2, 'w').rect(19, 30, 3, 2, 'w');
    s.rect(13, 30, 3, 3, 'A').rect(16, 30, 3, 3, 'A');
  } else if (pose === 'arms') {
    upperArms(s);
    s.rect(6, 29, 4, 2, 'e').rect(22, 29, 4, 4, 'e');
    // Her right forearm over her left, each hand tucked under the other arm.
    s.rect(10, 29, 10, 2, 'w').rect(20, 29, 2, 2, 'A');
    s.rect(12, 32, 10, 2, 'w').rect(10, 32, 2, 2, 'A');
  } else if (pose === 'pinup') {
    // A pin-up's pose: one hand behind her head, its elbow up, and the other on her hip.
    limb(s, [8, 27], [3, 14], 'aae');
    limb(s, [3, 13], [10, 10], 'wwA');
    limb(s, [23, 27], [26, 31], 'aae');
    limb(s, [26, 32], [22, 34], 'wwA');
  } else {
    raisedArm(s, -1);
    raisedArm(s, 1);
  }
  head(s, 'front', pose === 'bang' ? BANG_DROP : 0);
  outlineAll(s);
  if (pose === 'phone' || pose === 'arms' || pose === 'pinup') lineUnder(s, 'wA', 'bp');
  const body = s.rows;
  if (pose === 'arms') return { body, over: null };
  // Raised arms go over her hair, and her hands over her phone; a pin-up's hand stays behind her
  // head, and only her arm up to the elbow comes in front of her hair.
  const lifted = (x: number, y: number) => {
    const key = body[y]?.[x] ?? CLEAR;
    if (pose === 'phone') return key === 'A';
    if (pose === 'pinup') return y <= 26 && x < 12 && 'ae'.includes(key);
    return y <= 24 && ARM.includes(key);
  };
  const over = body.map((row, y) =>
    [...row]
      .map((key, x) => {
        if (lifted(x, y)) return key;
        const near = lifted(x - 1, y) || lifted(x + 1, y) || lifted(x, y - 1) || lifted(x, y + 1);
        return key === 'o' && near ? 'o' : CLEAR;
      })
      .join(''),
  );
  return { body, over };
}

export const POSE_BODY: Record<FrontPose, PoseBody> = {
  phone: poseBody('phone'),
  arms: poseBody('arms'),
  horns: poseBody('horns'),
  bang: poseBody('bang'),
  pinup: poseBody('pinup'),
};

/** Her action poses, each facing whichever way she does (`systems/poses.ts` says when). */
export const ACTION_POSES: readonly ActionPose[] = [
  'crouch',
  'pour',
  'swing',
  'holdUp',
  'wave',
  'shrug',
];

/** How many frames each has: a swing's arm up then down, a wave's hand one way then the other. */
export const ACTION_FRAMES: Record<ActionPose, number> = {
  crouch: 1,
  pour: 1,
  swing: 2,
  holdUp: 1,
  wave: 2,
  shrug: 1,
};

export function isAction(pose: Pose | undefined): pose is ActionPose {
  return pose !== undefined && (ACTION_POSES as readonly string[]).includes(pose);
}

/**
 * A crouch is her reaching for the ground with her legs folded under her as she sits (`folded`):
 * these rows of her legs come out, and everything above them comes down.
 */
export const CROUCH_FROM = SIT_FROM;

export const CROUCH_DROP = 5;

/** Breathing out, her shoulders come down a pixel: this row of her hips comes out. */
export const BREATH_FROM = 36;

export type Point = readonly [number, number];

/** An arm along a run of points, shoulder first, each stretch in its own region keys. */
export interface ArmPath {
  points: readonly Point[];
  keys: readonly string[];
}

/** Hands hold the arm's last stretch: upper arm, forearm, then hand. */
export function arm(points: readonly Point[]): ArmPath {
  return { points, keys: ['aae', 'ww', 'A'].slice(0, points.length - 1) };
}

/** A forearm only, from a hanging upper arm's elbow: elbow and forearm, then hand. */
export function forearm(points: readonly Point[]): ArmPath {
  return { points, keys: ['eww', 'A'].slice(0, points.length - 1) };
}

/** The same arm on the other side of her, from the front or behind. */
export function mirror(path: ArmPath): ArmPath {
  return { ...path, points: path.points.map(([x, y]) => [DOLL_WIDTH - 1 - x, y] as const) };
}

/**
 * Each action's moving arms for one view and frame, drawn over her body: from the front, her right
 * arm is on the viewer's left and does the one-handed things (as it holds her net and can); from
 * behind it's on the viewer's right; from the side, facing right, her near arm. A side that isn't
 * listed hangs as she stands, from the front and behind.
 */
export interface ActionArms {
  left?: ArmPath;
  right?: ArmPath;
  /** From the side: her near arm. */
  near?: ArmPath;
}

const CROUCH_REACH = forearm([
  [8, 29],
  [10, 33],
  [12, 35],
]);

const HOLD_UP = arm([
  [8, 27],
  [4, 18],
  [7, 8],
  [10, 4],
]);

const POUR_OUT = forearm([
  [8, 29],
  [5, 31],
  [3, 33],
]);

const SWING_UP = arm([
  [8, 27],
  [5, 21],
  [4, 15],
  [4, 13],
]);

const SWING_DOWN = arm([
  [8, 27],
  [9, 31],
  [13, 34],
  [14, 35],
]);

const WAVE: readonly ArmPath[] = [
  arm([
    [8, 27],
    [4, 22],
    [3, 15],
    [3, 12],
  ]),
  arm([
    [8, 27],
    [4, 22],
    [6, 15],
    [7, 12],
  ]),
];

/** A shrug (V1's E4): her elbows at her sides and her hands out either side of her, palms up. */
const SHRUG = forearm([
  [8, 29],
  [5, 29],
  [3, 27],
]);

const FRONT_ARMS: Record<ActionPose, readonly ActionArms[]> = {
  crouch: [{ left: CROUCH_REACH, right: mirror(CROUCH_REACH) }],
  pour: [{ left: POUR_OUT }],
  swing: [{ left: SWING_UP }, { left: SWING_DOWN }],
  holdUp: [{ left: HOLD_UP, right: mirror(HOLD_UP) }],
  wave: WAVE.map((left) => ({ left })),
  shrug: [{ left: SHRUG, right: mirror(SHRUG) }],
};

/** Reaching past her hips from behind, her hands just showing at her sides. */
const CROUCH_TUCKED = forearm([
  [8, 29],
  [9, 32],
  [10, 34],
]);

/** From behind her one-handed arm is on our right, and in a crouch her hands are round in front. */
const BACK_ARMS: Record<ActionPose, readonly ActionArms[]> = {
  crouch: [{ left: CROUCH_TUCKED, right: mirror(CROUCH_TUCKED) }],
  pour: [{ right: mirror(POUR_OUT) }],
  swing: [
    { right: mirror(SWING_UP) },
    {
      right: arm([
        [23, 27],
        [24, 22],
        [22, 17],
        [21, 15],
      ]),
    },
  ],
  holdUp: FRONT_ARMS.holdUp,
  wave: WAVE.map((left) => ({ right: mirror(left) })),
  shrug: FRONT_ARMS.shrug,
};

const SIDE_ARMS: Record<ActionPose, readonly ActionArms[]> = {
  crouch: [
    {
      near: arm([
        [15, 27],
        [18, 32],
        [21, 35],
        [22, 36],
      ]),
    },
  ],
  pour: [
    {
      near: arm([
        [15, 27],
        [19, 30],
        [23, 32],
        [24, 33],
      ]),
    },
  ],
  swing: [
    {
      near: arm([
        [15, 27],
        [17, 21],
        [20, 16],
        [21, 14],
      ]),
    },
    {
      near: arm([
        [15, 27],
        [19, 30],
        [23, 31],
        [25, 31],
      ]),
    },
  ],
  holdUp: [
    {
      near: arm([
        [15, 27],
        [16, 19],
        [17, 9],
        [17, 4],
      ]),
    },
  ],
  wave: [
    {
      near: arm([
        [15, 27],
        [21, 23],
        [24, 16],
        [25, 13],
      ]),
    },
    {
      near: arm([
        [15, 27],
        [21, 23],
        [26, 17],
        [28, 15],
      ]),
    },
  ],
  // From the side, her near hand out in front of her, palm up.
  shrug: [
    {
      near: arm([
        [15, 27],
        [16, 31],
        [20, 30],
        [22, 28],
      ]),
    },
  ],
};

const ARMS: Record<View, Record<ActionPose, readonly ActionArms[]>> = {
  front: FRONT_ARMS,
  back: BACK_ARMS,
  side: SIDE_ARMS,
};

/** Where the hand of an action's arm is, in her picture facing right from the side. */
function handOf(path: ArmPath | undefined): { x: number; y: number } {
  const [x, y] = path?.points[path.points.length - 1] ?? [16, 35];
  return { x, y };
}

/**
 * Where her hand holds her can as she pours (the viewer's left from the front, right from behind,
 * her near hand from the side, facing right), and her net through its swing, in her picture.
 */
export const POUR_HAND: Record<View, { x: number; y: number }> = {
  front: handOf(FRONT_ARMS.pour[0]!.left),
  back: handOf(BACK_ARMS.pour[0]!.right),
  side: handOf(SIDE_ARMS.pour[0]!.near),
};

export const SWING_HAND: Record<View, readonly { x: number; y: number }[]> = {
  front: FRONT_ARMS.swing.map((a) => handOf(a.left)),
  back: BACK_ARMS.swing.map((a) => handOf(a.right)),
  side: SIDE_ARMS.swing.map((a) => handOf(a.near)),
};

/**
 * An action's body: her standing body, with the arms that move drawn over it and outlined against
 * whatever they cross, her head included; and those arms again, to go over her hair and anything
 * drawn over her body (a skirt, overalls), since they're in front of her.
 */
function actionBody(
  pose: ActionPose,
  view: View,
  arms: ActionArms,
  physique: Physique = PHYSIQUES.regular,
): PoseBody {
  const { parts, reach, measure } = physique;
  const s = new Sketch(DOLL_WIDTH, DOLL_HEIGHT);
  parts.trunk(s, view);
  if (view === 'side') parts.sideLegs(s, false);
  else {
    parts.frontLegs(s, 0);
    for (const side of [-1, 1] as const) {
      const path = side === -1 ? arms.left : arms.right;
      if (!path || path.keys[0] !== 'aae') parts.upperArm(s, side);
      if (!path) parts.hangingForearm(s, side);
    }
  }
  head(s, view);
  outlineAll(s);
  const moved = new Set<string>();
  for (const path of [arms.left, arms.right, arms.near]) {
    if (!path) continue;
    const before = s.rows;
    const points = path.points.map((p) => reach(p, view));
    path.keys.forEach((keys, i) => parts.limb(s, points[i]!, points[i + 1]!, keys));
    for (let y = 0; y < s.height; y++) {
      for (let x = 0; x < s.width; x++) if (s.get(x, y) !== before[y]![x]) moved.add(`${x},${y}`);
    }
  }
  // A line round the arm wherever it lies over something that isn't more of her arm.
  const isMoved = (x: number, y: number) => moved.has(`${x},${y}`);
  const lines: [number, number][] = [];
  for (let y = 0; y < s.height; y++) {
    for (let x = 0; x < s.width; x++) {
      if (ARM.includes(s.get(x, y)!)) continue;
      if (isMoved(x - 1, y) || isMoved(x + 1, y) || isMoved(x, y - 1) || isMoved(x, y + 1)) {
        lines.push([x, y]);
      }
    }
  }
  for (const [x, y] of lines) s.set(x, y, 'o');
  const body = measured(s.rows, measure);
  if (pose === 'crouch' && view === 'back') return { body, over: null };
  const over = body.map((row, y) =>
    [...row]
      .map((key, x) => {
        if (isMoved(x, y) && ARM.includes(key)) return key;
        const near = [
          [x - 1, y],
          [x + 1, y],
          [x, y - 1],
          [x, y + 1],
        ].some(([nx, ny]) => isMoved(nx!, ny!) && ARM.includes(body[ny!]?.[nx!] ?? CLEAR));
        return key === 'o' && near ? 'o' : CLEAR;
      })
      .join(''),
  );
  return { body, over: measured(over, measure) };
}

/**
 * A body with arms of its own for a neighbour's job (V1's E3): her standing body with `arms` drawn
 * over it as an action's are, and those arms again to go over hair and clothes.
 */
export function armsBody(view: View, arms: ActionArms, build: Build = 'regular'): PoseBody {
  return actionBody('wave', view, arms, PHYSIQUES[build]);
}

/** Every action's body, by view and frame, for a build. */
function actionBodies(pose: ActionPose, build: Build): Record<View, readonly PoseBody[]> {
  const of = (view: View) =>
    ARMS[view][pose].map((arms) => actionBody(pose, view, arms, PHYSIQUES[build]));
  return { front: of('front'), back: of('back'), side: of('side') };
}

type ActionBodies = Record<ActionPose, Record<View, readonly PoseBody[]>>;

function actionBodiesOf(build: Build): ActionBodies {
  return {
    crouch: actionBodies('crouch', build),
    pour: actionBodies('pour', build),
    swing: actionBodies('swing', build),
    holdUp: actionBodies('holdUp', build),
    wave: actionBodies('wave', build),
    shrug: actionBodies('shrug', build),
  };
}

/** Her action bodies, by pose, view and frame. */
export const ACTION_BODY: ActionBodies = actionBodiesOf('regular');

/** Every build's action bodies (1.1's A5a): hers, and the same arms on the stout body. */
export const ACTION_BODIES: Record<Build, ActionBodies> = {
  regular: ACTION_BODY,
  stout: actionBodiesOf('stout'),
};

/**
 * Layers brought to the height of the tallest (a tall hat's), each lifted by blank rows on top,
 * so they stack with her feet on the same row.
 */
export function raised(layers: Layer[]): Layer[] {
  const tall = Math.max(...layers.map((l) => l.source.rows.length));
  return layers.map((l) => {
    const short = tall - l.source.rows.length;
    if (short === 0) return l;
    const blank = '.'.repeat(DOLL_WIDTH);
    const rows = [...Array.from({ length: short }, () => blank), ...l.source.rows];
    return { ...l, source: { ...l.source, rows } };
  });
}

/**
 * Her standing layers, sat down: `SIT_DROP` rows of her legs taken out at `SIT_FROM` (measured
 * from her feet, so a tall hat's room is left alone) and as many blank rows put back on top.
 */
export function seated(layers: Layer[]): Layer[] {
  return folded(layers, SIT_FROM, SIT_DROP);
}

/**
 * Layers with `drop` rows taken out at row `from` of her body (measured from her feet, so a tall
 * hat's room is left alone) and as many blank rows put back on top: everything above comes down,
 * and her feet stay put. Sitting, crouching and breathing out are each a fold.
 */
export function folded(layers: Layer[], from: number, drop: number): Layer[] {
  return layers.map((l) => {
    const rows = l.source.rows;
    const cut = rows.length - DOLL_HEIGHT + from;
    const blank = '.'.repeat(DOLL_WIDTH);
    return {
      ...l,
      source: {
        ...l.source,
        rows: [
          ...Array.from({ length: drop }, () => blank),
          ...rows.slice(0, cut),
          ...rows.slice(cut + drop),
        ],
      },
    };
  });
}
