import type { Facing } from '../../types/ids';
import { Sketch } from '../sketch';

/*
 * Her body, in regions (decisions 27 and 88): drawn once per facing and walk frame in keys that
 * name its parts, so a cut paints regions and never rows.
 */

export type View = 'front' | 'back' | 'side';

export function viewOf(facing: Facing): View {
  if (facing === 'down') return 'front';
  if (facing === 'up') return 'back';
  return 'side';
}

/** Standing, then two walk frames. */
export const DOLL_FRAMES = 3;

export type Grid = readonly string[];

export const DOLL_WIDTH = 32;
export const DOLL_HEIGHT = 48;

export const EMPTY: Grid = Array.from({ length: DOLL_HEIGHT }, () => '.'.repeat(DOLL_WIDTH));

/**
 * Region keys: `s` head, `n` neck, `b` torso, `p` hips, `a` upper arm (a short sleeve), `e` elbow
 * (a ¾ sleeve), `w` forearm (a long sleeve), `A` hand, `l` leg, `f` foot, and `o` the outline.
 */
export const ARM = 'aewA';

/** Rows the clothes are measured against. The torso is the same in every pose. */
export const SHOULDER = 25;
export const HEM = 33;
export const HIPS = 34;

/** How far a head-bang drops her head. */
export const BANG_DROP = 2;

export function head(s: Sketch, view: View, drop = 0): void {
  s.ellipse(16, 15.5 + drop, 8.5, 8, 's');
  s.rect(view === 'side' ? 13 : 12, 23 + drop, 8, 1, 's');
}

export function trunk(s: Sketch, view: View): void {
  s.rect(14, 24, 4, 1, 'n');
  if (view === 'side') {
    s.rect(12, 25, 8, 1, 'b').rect(11, 26, 10, 8, 'b').rect(11, 34, 10, 3, 'p');
  } else {
    s.rect(11, 25, 10, 1, 'b').rect(10, 26, 12, 8, 'b').rect(10, 34, 12, 3, 'p');
  }
}

/** Legs from the front or behind, one foot lifted two pixels mid-step (-1 the viewer's left). */
export function frontLegs(s: Sketch, lift: -1 | 0 | 1): void {
  const legs: [number, number, boolean][] = [
    [10, 9, lift === -1],
    [17, 17, lift === 1],
  ];
  for (const [x, footX, lifted] of legs) {
    const up = lifted ? 2 : 0;
    s.rect(x, 37, 5, 8 - up, 'l').rect(footX, 45 - up, 6, 2, 'f');
  }
}

/** Legs from the side, facing right: together, or mid-stride. */
export function sideLegs(s: Sketch, stride: boolean): void {
  if (!stride) {
    s.rect(13, 37, 6, 8, 'l').rect(13, 45, 8, 2, 'f');
    return;
  }
  for (let y = 37; y < 45; y++) {
    const d = Math.round((y - 37) * 0.5);
    s.rect(11 - d, y, 5, 1, 'l').rect(16 + d, y, 5, 1, 'l');
  }
  s.rect(7, 45, 7, 2, 'f').rect(20, 45, 7, 2, 'f');
}

/** Her upper arms, from rounded shoulders, as they hang whatever her forearms do. */
export function upperArms(s: Sketch): void {
  s.rect(7, 26, 3, 1, 'a').rect(6, 27, 4, 2, 'a').rect(22, 26, 3, 1, 'a').rect(22, 27, 4, 2, 'a');
}

/** One forearm hanging below her upper arm, `side` -1 for the viewer's left. */
export function hangingForearm(s: Sketch, side: -1 | 1): void {
  const at = (x: number) => (side === -1 ? x : 31 - x);
  const run = (from: number, to: number, y: number, h: number, key: string) =>
    s.rect(Math.min(at(from), at(to)), y, Math.abs(to - from) + 1, h, key);
  run(6, 9, 29, 2, 'e');
  run(7, 9, 31, 3, 'w');
  run(6, 9, 34, 2, 'A');
  run(7, 9, 36, 1, 'A');
}

/** One upper arm, hanging from its rounded shoulder, `side` -1 for the viewer's left. */
export function upperArm(s: Sketch, side: -1 | 1): void {
  if (side === -1) s.rect(7, 26, 3, 1, 'a').rect(6, 27, 4, 2, 'a');
  else s.rect(22, 26, 3, 1, 'a').rect(22, 27, 4, 2, 'a');
}

/** Her near arm from the side, over her torso, its hand `swing` pixels forward (or back). */
export function sideArm(s: Sketch, swing: number): void {
  const keys = 'aaaeewwwAAA';
  [...keys].forEach((key, i) => s.rect(14 + Math.round((swing * i) / 10), 26 + i, 3, 1, key));
}

/** A limb three pixels thick from one point to another, a key along it for each part. */
export function limb(
  s: Sketch,
  from: readonly [number, number],
  to: readonly [number, number],
  keys: string,
): void {
  const steps = Math.max(Math.abs(to[0] - from[0]), Math.abs(to[1] - from[1]));
  for (let i = 0; i <= steps; i++) {
    const t = steps === 0 ? 0 : i / steps;
    const x = Math.round(from[0] + (to[0] - from[0]) * t);
    const y = Math.round(from[1] + (to[1] - from[1]) * t);
    const key = keys[Math.min(keys.length - 1, Math.floor(t * keys.length))]!;
    s.rect(x - 1, y - 1, 3, 3, key);
  }
}

/** Outline round everything drawn so far, in `o`. */
export function outlineAll(s: Sketch): void {
  s.outline(() => 'o');
}

/**
 * How a build draws each part of its body (1.1's A5a): hers, and the stout build's
 * (`doll/stout.ts`), each region the same key on the same rows, so a cut paints any of them.
 */
export interface Parts {
  trunk: (s: Sketch, view: View) => void;
  frontLegs: (s: Sketch, lift: -1 | 0 | 1) => void;
  sideLegs: (s: Sketch, stride: boolean) => void;
  upperArm: (s: Sketch, side: -1 | 1) => void;
  hangingForearm: (s: Sketch, side: -1 | 1) => void;
  sideArm: (s: Sketch, swing: number) => void;
  limb: typeof limb;
}

export const REGULAR_PARTS: Parts = {
  trunk,
  frontLegs,
  sideLegs,
  upperArm,
  hangingForearm,
  sideArm,
  limb,
};

/**
 * Where a cut measures from on a body (1.1's A5a), so a button or a seam lands as far in from the
 * edge of a broader torso as of hers: the chest's outer columns from the front and behind (`left`,
 * `right`) and from the side facing right (`back`, `front`, the hips too), the hips' from the
 * front, the neck's, each leg's, and how much broader than hers it is each side at the shoulders
 * (`spread`).
 */
export interface Measure {
  left: number;
  right: number;
  back: number;
  front: number;
  hips: readonly [number, number];
  neck: readonly [number, number];
  legs: readonly [readonly [number, number], readonly [number, number]];
  spread: number;
}

export const REGULAR_MEASURE: Measure = {
  left: 10,
  right: 21,
  back: 11,
  front: 20,
  hips: [10, 21],
  neck: [14, 17],
  legs: [
    [10, 14],
    [17, 21],
  ],
  spread: 0,
};

const MEASURES = new WeakMap<Grid, Measure>();

/** Marks a body as a build's, for what's painted on it to measure from. */
export function measured<G extends Grid>(body: G, measure: Measure): G {
  if (measure !== REGULAR_MEASURE) MEASURES.set(body, measure);
  return body;
}

/** What a body measures: its build's, or hers for any body not marked as another's. */
export function measureOf(body: Grid): Measure {
  return MEASURES.get(body) ?? REGULAR_MEASURE;
}

export function frontBody(lift: -1 | 0 | 1, parts: Parts = REGULAR_PARTS): string[] {
  const s = new Sketch(DOLL_WIDTH, DOLL_HEIGHT);
  parts.trunk(s, 'front');
  parts.frontLegs(s, lift);
  for (const side of [-1, 1] as const) parts.upperArm(s, side);
  for (const side of [-1, 1] as const) parts.hangingForearm(s, side);
  head(s, 'front');
  outlineAll(s);
  return s.rows;
}

export function sideBody(frame: number, parts: Parts = REGULAR_PARTS): string[] {
  const s = new Sketch(DOLL_WIDTH, DOLL_HEIGHT);
  parts.trunk(s, 'side');
  parts.sideLegs(s, frame === 1);
  head(s, 'side');
  outlineAll(s);
  // Her arm swings back as she strides, and forward as her legs pass.
  parts.sideArm(s, frame === 1 ? -2 : frame === 2 ? 1 : 0);
  // A line either side of her arm and under her hand, where it lies over her.
  const arm = new Set<string>();
  for (let y = 0; y < s.height; y++) {
    for (let x = 0; x < s.width; x++) if (ARM.includes(s.get(x, y)!)) arm.add(`${x},${y}`);
  }
  for (let y = 0; y < s.height; y++) {
    for (let x = 0; x < s.width; x++) {
      if (!'bp'.includes(s.get(x, y)!)) continue;
      if (arm.has(`${x - 1},${y}`) || arm.has(`${x + 1},${y}`) || arm.has(`${x},${y - 1}`)) {
        s.set(x, y, 'o');
      }
    }
  }
  return s.rows;
}

/** A pose's body, and the part of it that goes in front of her hair (her arms, raised). */
export interface PoseBody {
  body: string[];
  over: string[] | null;
}

export const FRONT_BODY: Grid[] = [frontBody(0), frontBody(-1), frontBody(1)];

/** Her back is her front without a face, and the face is a layer of its own. */
export const BODY: Record<View, readonly Grid[]> = {
  front: FRONT_BODY,
  back: FRONT_BODY,
  side: [0, 1, 2].map((frame) => sideBody(frame)),
};
