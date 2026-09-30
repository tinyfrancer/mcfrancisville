import { OUTFITS } from '../data/outfits';
import type { CutId, Facing, HairStyleId, OutfitId, Pose, Slot } from '../types/ids';
import type { Look, Worn } from '../types/look';
import {
  EYE_COLOURS,
  FABRIC_TONES,
  hairTones,
  SKIN_TONES,
  type HairTones,
  type Tone,
} from './lookColours';
import { mix, PALETTE as C, ramp } from './palette';
import { CLEAR, Sketch } from './sketch';
import type { Layer, Palette } from './sprite';

/*
 * Her, as a paper doll at 32×48 (decisions.md 79): a body and a stack of layers drawn over it, one
 * grid each per facing and frame. Left is right, flipped when it is baked. She is drawn to
 * `docs/art_style.md`, after the scale sheet the user locked in.
 *
 * The body is drawn in *region* keys (`b` torso, `a` upper arm, `l` leg…), all in her skin. That
 * lets most clothes be painted rather than drawn: a tee is "her torso and her upper arms", worked
 * out from the body for every facing, frame and pose, so a new top or colour is a row in
 * `src/data/outfits.ts` rather than twenty more grids, and a pose moves her sleeves with her arms.
 * Only what changes the silhouette (a skirt, hair, a hat, glasses) is drawn by hand. Every layer
 * gets its light from the top left and a soft outline in its own darkest tone as it's finished.
 */

export type View = 'front' | 'back' | 'side';

export function viewOf(facing: Facing): View {
  if (facing === 'down') return 'front';
  if (facing === 'up') return 'back';
  return 'side';
}

/** Standing, then two walk frames. */
export const DOLL_FRAMES = 3;

/** Every pose (`src/systems/poses.ts` says when) faces the front. */
export const POSES: readonly Pose[] = ['phone', 'arms', 'horns', 'bang', 'pinup'];

export type Grid = readonly string[];

export const DOLL_WIDTH = 32;
export const DOLL_HEIGHT = 48;

export const EMPTY: Grid = Array.from({ length: DOLL_HEIGHT }, () => '.'.repeat(DOLL_WIDTH));

// ---- The body, in regions ------------------------------------------------------------------

/**
 * Region keys: `s` head, `n` neck, `b` torso, `p` hips, `a` upper arm (a short sleeve), `e` elbow
 * (a ¾ sleeve), `w` forearm (a long sleeve), `A` hand, `l` leg, `f` foot, and `o` the outline.
 */
export const ARM = 'aewA';

/** Rows the clothes are measured against. The torso is the same in every pose. */
const SHOULDER = 25;
const HEM = 33;
const HIPS = 34;
/** How far a head-bang drops her head. */
const BANG_DROP = 2;

function head(s: Sketch, view: View, drop = 0): void {
  s.ellipse(16, 15.5 + drop, 8.5, 8, 's');
  s.rect(view === 'side' ? 13 : 12, 23 + drop, 8, 1, 's');
}

function trunk(s: Sketch, view: View): void {
  s.rect(14, 24, 4, 1, 'n');
  if (view === 'side') {
    s.rect(12, 25, 8, 1, 'b').rect(11, 26, 10, 8, 'b').rect(11, 34, 10, 3, 'p');
  } else {
    s.rect(11, 25, 10, 1, 'b').rect(10, 26, 12, 8, 'b').rect(10, 34, 12, 3, 'p');
  }
}

/** Legs from the front or behind, one foot lifted two pixels mid-step (-1 the viewer's left). */
function frontLegs(s: Sketch, lift: -1 | 0 | 1): void {
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
function sideLegs(s: Sketch, stride: boolean): void {
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
function upperArms(s: Sketch): void {
  s.rect(7, 26, 3, 1, 'a').rect(6, 27, 4, 2, 'a').rect(22, 26, 3, 1, 'a').rect(22, 27, 4, 2, 'a');
}

/**
 * Her arms hanging at her sides, `x` the outer edge of the viewer's left one: a rounded shoulder,
 * a forearm that narrows to her wrist, and a hand a pixel wider again, its thumb on the side
 * nearer her.
 */
function hangingArms(s: Sketch): void {
  upperArms(s);
  for (const side of [-1, 1] as const) {
    const at = (x: number) => (side === -1 ? x : 31 - x);
    const run = (from: number, to: number, y: number, h: number, key: string) =>
      s.rect(Math.min(at(from), at(to)), y, Math.abs(to - from) + 1, h, key);
    run(6, 9, 29, 2, 'e');
    run(7, 9, 31, 3, 'w');
    run(6, 9, 34, 2, 'A');
    run(7, 9, 36, 1, 'A');
  }
}

/** Her near arm from the side, over her torso, its hand `swing` pixels forward (or back). */
function sideArm(s: Sketch, swing: number): void {
  const keys = 'aaaeewwwAAA';
  [...keys].forEach((key, i) => s.rect(14 + Math.round((swing * i) / 10), 26 + i, 3, 1, key));
}

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

/** A limb three pixels thick from one point to another, a key along it for each part. */
function limb(s: Sketch, from: [number, number], to: [number, number], keys: string): void {
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
function outlineAll(s: Sketch): void {
  s.outline(() => 'o');
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

function frontBody(lift: -1 | 0 | 1): string[] {
  const s = new Sketch(DOLL_WIDTH, DOLL_HEIGHT);
  trunk(s, 'front');
  frontLegs(s, lift);
  hangingArms(s);
  head(s, 'front');
  outlineAll(s);
  return s.rows;
}

function sideBody(frame: number): string[] {
  const s = new Sketch(DOLL_WIDTH, DOLL_HEIGHT);
  trunk(s, 'side');
  sideLegs(s, frame === 1);
  head(s, 'side');
  outlineAll(s);
  // Her arm swings back as she strides, and forward as her legs pass.
  sideArm(s, frame === 1 ? -2 : frame === 2 ? 1 : 0);
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
interface PoseBody {
  body: string[];
  over: string[] | null;
}

function poseBody(pose: Pose): PoseBody {
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

const FRONT_BODY: Grid[] = [frontBody(0), frontBody(-1), frontBody(1)];

/** Her back is her front without a face, and the face is a layer of its own. */
export const BODY: Record<View, readonly Grid[]> = {
  front: FRONT_BODY,
  back: FRONT_BODY,
  side: [0, 1, 2].map(sideBody),
};

export const POSE_BODY: Record<Pose, PoseBody> = {
  phone: poseBody('phone'),
  arms: poseBody('arms'),
  horns: poseBody('horns'),
  bang: poseBody('bang'),
  pinup: poseBody('pinup'),
};

// ---- Finishing a layer: light, shade and a soft outline ------------------------------------

/** Keeps a painted pixel, or leaves it clear so what is underneath shows. */
type Painter = (key: string, row: number, col: number) => string | null;

export function paint(body: Grid, painter: Painter): string[] {
  return body.map((line, r) => [...line].map((key, c) => painter(key, r, c) ?? '.').join(''));
}

/** Lays `top` over `base` from row `at` down (and column `left` across); `.` lets `base` show. */
export function stamp(base: readonly string[], top: Grid, at: number, left = 0): string[] {
  const out = base.map((row) => [...row]);
  top.forEach((line, i) => {
    const row = out[at + i];
    if (!row) return;
    [...line].forEach((ch, j) => {
      if (ch !== '.' && left + j >= 0 && left + j < row.length) row[left + j] = ch;
    });
  });
  return out.map((row) => row.join(''));
}

/** Moves a layer down by `by` rows, for her head as it bangs. */
function lower(rows: readonly string[], by: number): string[] {
  if (by === 0) return [...rows];
  const blank = '.'.repeat(DOLL_WIDTH);
  return [...Array.from({ length: by }, () => blank), ...rows.slice(0, rows.length - by)];
}

/**
 * Light from the top left on a piece's `m`, and a soft outline round it: `M` where it turns away
 * from the light, `L` where it catches it, `O` round its edge. A piece painted onto her body
 * (`painted`) is outlined only where it meets her own outline or the air, so a tee doesn't draw a
 * line across her arm; a piece drawn over her (a hat) is outlined all round.
 */
export function finish(rows: readonly string[], body: Grid, mode: 'painted' | 'drawn'): string[] {
  const g = rows.map((row) => [...row]);
  const inPiece = (x: number, y: number) => {
    const key = rows[y]?.[x];
    return key !== undefined && key !== CLEAR;
  };
  for (let y = 0; y < g.length; y++) {
    for (let x = 0; x < DOLL_WIDTH; x++) {
      const key = rows[y]![x]!;
      if (key === 'm') {
        if (!inPiece(x + 1, y) || !inPiece(x, y + 1)) g[y]![x] = 'M';
        else if (!inPiece(x - 1, y) || !inPiece(x, y - 1)) g[y]![x] = 'L';
      } else if (key === CLEAR) {
        const under = body[y]?.[x] ?? CLEAR;
        if (mode === 'painted' && under !== 'o' && under !== CLEAR) continue;
        if (inPiece(x, y + 1) || inPiece(x - 1, y) || inPiece(x + 1, y) || inPiece(x, y - 1)) {
          g[y]![x] = 'O';
        }
      }
    }
  }
  return g.map((row) => row.join(''));
}

const drawnFor = new WeakMap<object, Map<string, readonly string[]>>();

/**
 * Remembers rows drawn for something (a body, a hairstyle): the same skin, hair or cut on the same
 * body is the same rows whatever else she wears, so a look is quick to put together. The rows are
 * shared, so nothing may change them.
 */
function remember(owner: object, key: string, draw: () => readonly string[]): readonly string[] {
  let drawn = drawnFor.get(owner);
  if (!drawn) {
    drawn = new Map();
    drawnFor.set(owner, drawn);
  }
  let rows = drawn.get(key);
  if (!rows) {
    rows = draw();
    drawn.set(key, rows);
  }
  return rows;
}

/** A number for each body, for a remembered drawing that depends on the body too. */
const bodyIds = new WeakMap<Grid, number>();
let bodies = 0;
function bodyId(body: Grid): number {
  let id = bodyIds.get(body);
  if (id === undefined) {
    id = bodies++;
    bodyIds.set(body, id);
  }
  return id;
}

/** Her skin, shaded along the bottom and right of each part: head, torso, arms, legs. */
export function skinRows(body: Grid): readonly string[] {
  return remember(body, 'skin', () => shadeSkin(body));
}

function shadeSkin(body: Grid): string[] {
  const groups = ['sn', 'bp', ARM, 'lf'];
  const group = (key: string | undefined) => groups.findIndex((g) => key && g.includes(key));
  return body.map((row, y) =>
    [...row]
      .map((key, x) => {
        if (key === CLEAR || key === 'o') return key;
        const mine = group(key);
        const shaded = group(row[x + 1]) !== mine || group(body[y + 1]?.[x]) !== mine;
        return shaded ? 'S' : 's';
      })
      .join(''),
  );
}

// ---- Drawn by hand: her face, hair, hats, glasses, and anything that isn't painted on ------

/** How her face looks: as usual, down at her phone, eyes shut tight, or mouth open, rocking. */
export type Mood = 'open' | 'down' | 'shut' | 'rock' | 'wink';

/**
 * An eye four wide and round, her right one as the viewer sees it (the outer corner on the left):
 * a tall highlight, and her iris lightening toward the bottom. The other is mirrored.
 */
const EYE_OPEN: Grid = ['.EE.', 'EwEE', 'EweE', 'EeiE', '.EE.'];
const EYE_DOWN: Grid = ['....', '....', 'EEEE', 'EeeE', '.EE.'];
const EYE_SHUT: Grid = ['....', '....', '.EE.', 'E..E', '....'];

function mirrored(grid: Grid): Grid {
  return grid.map((row) => [...row].reverse().join(''));
}

/** What a face has beyond eyes, cheeks and a mouth. */
export interface FaceTouches {
  lashes?: boolean;
  freckles?: boolean;
  nosePiercing?: boolean;
}

/**
 * Eyes, cheeks and a mouth, low on the face, and freckles and a nose stud for whoever has them.
 * From the side only the near eye shows.
 */
export function faceRows(
  view: Exclude<View, 'back'>,
  mood: Mood,
  look: FaceTouches,
): readonly string[] {
  const key = [view, mood, look.lashes, look.freckles, look.nosePiercing].join(':');
  return remember(EMPTY, `face:${key}`, () => drawFace(view, mood, look));
}

function drawFace(view: Exclude<View, 'back'>, mood: Mood, look: FaceTouches): string[] {
  const s = new Sketch(DOLL_WIDTH, DOLL_HEIGHT);
  const eye = mood === 'down' ? EYE_DOWN : mood === 'shut' ? EYE_SHUT : EYE_OPEN;
  const open = mood === 'open' || mood === 'rock' || mood === 'wink';
  const lashes = look.lashes === true && open;
  const lips = (x: number, wide: boolean) => {
    if (mood === 'rock' || mood === 'shut') {
      s.rect(x, 20, wide ? 3 : 2, 2, 'U').rect(x, 21, wide ? 3 : 2, 1, 'u');
      if (wide) s.set(x + 1, 20, 'U');
    } else if (wide) {
      // Her lips: the parting line, and the fuller lower lip under it.
      s.rect(x, 20, 2, 1, 'U').rect(x, 21, 2, 1, 'u');
    } else s.set(x, 20, 'U').set(x, 21, 'u');
  };
  if (view === 'front') {
    s.stamp({ rows: eye }, 10, 14);
    s.stamp({ rows: mood === 'wink' ? EYE_SHUT : mirrored(eye) }, 18, 14);
    // Brows, where her fringe lets them show; a flick of lashes at each outer corner.
    s.rect(10, 12, 3, 1, 'b').rect(19, 12, 3, 1, 'b');
    if (mood === 'rock') s.set(12, 11, 'b').set(19, 11, 'b');
    if (lashes) s.set(9, 14, 'E').set(9, 13, 'E');
    if (lashes && mood !== 'wink') s.set(22, 14, 'E').set(22, 13, 'E');
    s.rect(8, 19, 3, 1, 'c').set(9, 20, 'c').rect(21, 19, 3, 1, 'c').set(22, 20, 'c');
    s.set(9, 19, 'C').set(22, 19, 'C');
    s.set(16, 18, 'n');
    lips(15, true);
    if (look.freckles) for (const [x, y] of FRECKLES_FRONT) s.set(x, y, 'r');
    if (look.nosePiercing) s.set(17, 19, 'x');
  } else {
    s.stamp({ rows: eye.map((row) => row.slice(0, 3)) }, 20, 14);
    s.rect(20, 12, 3, 1, 'b');
    if (lashes) s.set(23, 14, 'E').set(23, 13, 'E');
    s.rect(19, 19, 3, 1, 'c').set(20, 19, 'C');
    s.set(24, 18, 'n');
    lips(22, false);
    if (look.freckles) for (const [x, y] of FRECKLES_SIDE) s.set(x, y, 'r');
    if (look.nosePiercing) s.set(24, 19, 'x');
  }
  return s.rows;
}

/** A dusting across the bridge of her nose and under her eyes. */
const FRECKLES_FRONT: readonly (readonly [number, number])[] = [
  [11, 20],
  [13, 19],
  [14, 20],
  [18, 20],
  [19, 19],
  [21, 20],
];
const FRECKLES_SIDE: readonly (readonly [number, number])[] = [
  [18, 19],
  [19, 20],
  [22, 19],
];

/** A little heart through each earlobe (personal_touches.md): her gauges, over any hair. */
function gaugeRows(view: Exclude<View, 'back'>): readonly string[] {
  return remember(EMPTY, `gauges:${view}`, () => drawGauges(view));
}

function drawGauges(view: Exclude<View, 'back'>): string[] {
  const s = new Sketch(DOLL_WIDTH, DOLL_HEIGHT);
  const heart = { rows: ['k.k', 'kKk', '.k.'] };
  if (view === 'front') s.stamp(heart, 6, 20).stamp(heart, 23, 20);
  else s.stamp(heart, 11, 20);
  return s.rows;
}

/**
 * Her tattoos under her clothes (0.2's K3, personal_touches.md), all black and white: on one arm
 * a Beetlejuice sleeve, in the game's own art (the stripes, a sandworm winding down); on the other
 * an evenstar and a black-eyed Susan; she picks which arm the stripes go on
 * (`stripesArm`, her right as it really is). With either, the rose in the middle of her chest,
 * which a scooped neckline shows. Scattered is a few pieces of them.
 */
export function tattooRows(
  tattoos: NonNullable<Look['tattoos']>,
  stripesArm: Look['stripesArm'],
  body: Grid,
  facing: Facing,
): readonly string[] {
  return remember(body, `tattoos:${tattoos}:${stripesArm}:${facing}`, () =>
    drawTattoos(tattoos, stripesArm, body, facing),
  );
}

/**
 * Each arm's ink as it would be laid on her, shoulder first and wrist last, four across from the
 * outside of her arm in. A narrower part of her arm shows the first of them; a sleeve covers what
 * it covers.
 */
const SLEEVES: Record<'stripes' | 'stars', Record<NonNullable<Look['tattoos']>, Grid>> = {
  stripes: {
    sleeves: ['kWk.', 'kWkW', 'kWkW', 'gKKg', 'gkWg', 'Wkg.', 'gWk.', 'gkW.'],
    scattered: ['....', '....', '....', '....', '.KK.', '.kW.', '.Wk.', '....'],
  },
  stars: {
    sleeves: ['.k..', 'kSk.', '.k..', 'vyy.', 'yYYy', '.yyv', '....', '....'],
    scattered: ['....', '....', '....', '.yy.', 'yYYy', '.yy.', '....', '....'],
  },
};

const AROUND: readonly (readonly [number, number])[] = [-1, 0, 1].flatMap((dy) =>
  [-1, 0, 1].flatMap((dx) => (dx === 0 && dy === 0 ? [] : [[dx, dy] as const])),
);

/** A rose with its leaves, big in the middle of her chest, just under her collarbones. */
const ROSE: Grid = ['.RKK..', 'RKqKK.', 'vKKqKv', '.vKKv.'];

function drawTattoos(
  tattoos: NonNullable<Look['tattoos']>,
  stripesArm: Look['stripesArm'],
  body: Grid,
  facing: Facing,
): string[] {
  const view = viewOf(facing);
  const ink = new Map<string, string>();
  const onArm = (x: number, y: number) => 'aewA'.includes(body[y]?.[x] ?? CLEAR);
  // How far each pixel of an arm is from her hand, walking up the arm.
  const fromHand = new Map<string, number>();
  let wave: [number, number][] = [];
  for (let y = 0; y < body.length; y++) {
    for (let x = 0; x < DOLL_WIDTH; x++) if (body[y]![x] === 'A') wave.push([x, y]);
  }
  for (const [x, y] of wave) fromHand.set(`${x},${y}`, 0);
  for (let step = 1; wave.length > 0; step++) {
    const next: [number, number][] = [];
    for (const [x, y] of wave) {
      // Diagonal steps count as one, so a row across a straight arm is all one distance.
      for (const [nx, ny] of AROUND.map(([dx, dy]) => [x + dx, y + dy] as const)) {
        if (!onArm(nx, ny) || fromHand.has(`${nx},${ny}`)) continue;
        fromHand.set(`${nx},${ny}`, step);
        next.push([nx, ny]);
      }
    }
    wave = next;
  }
  // Which of her arms each side of the picture is: from the front her right is on our left.
  const armAt = (x: number): 'left' | 'right' => {
    if (view === 'side') return facing === 'right' ? 'right' : 'left';
    return x < 16 === (view === 'front') ? 'right' : 'left';
  };
  const groups = new Map<string, [number, number][]>();
  for (const [key, step] of fromHand) {
    if (step === 0) continue;
    const [x, y] = key.split(',').map(Number) as [number, number];
    const side = view === 'side' ? 'near' : x < 16 ? 'l' : 'r';
    const group = `${side}:${step}`;
    groups.set(group, [...(groups.get(group) ?? []), [x, y]]);
  }
  for (const [group, pixels] of groups) {
    const step = Number(group.split(':')[1]);
    const arm = armAt(pixels[0]![0]);
    const grid = SLEEVES[arm === stripesArm ? 'stripes' : 'stars'][tattoos];
    const row = grid[grid.length - step];
    if (!row) continue;
    // Outside of her arm first; from behind, the other side of it shows.
    const outward = pixels[0]![0] < 16 ? 1 : -1;
    pixels.sort((p, q) => (p[0] - q[0]) * outward || p[1] - q[1]);
    pixels.forEach(([x, y], rank) => {
      let col = Math.floor((rank * 4) / pixels.length);
      if (view === 'back') col = 3 - col;
      const key = row[col];
      if (key && key !== '.') ink.set(`${x},${y}`, key);
    });
  }
  let rows = paint(body, (k, r, c) => (ARM.includes(k) ? (ink.get(`${c},${r}`) ?? null) : null));
  if (view === 'front') {
    const rose = stamp(EMPTY, ROSE, SHOULDER, centred(ROSE));
    rows = stamp(
      rows,
      rose.map((line, r) => [...line].map((ch, c) => (body[r]?.[c] === 'b' ? ch : CLEAR)).join('')),
      0,
    );
  }
  return rows;
}

/**
 * Hair is drawn as a mask in `h`, its shine in `j`, and finished like any piece: shaded, lit and
 * outlined. `hairRows` then splits it into her left half and her right half, which is how split
 * dye works on every style. Every style leaves her eyes and cheeks clear.
 */
type HairStyle = Record<View, Grid>;

/**
 * Leaves the face showing under a fringe: an arch from `top` at the middle down to `sides` at
 * its edges, `across` either side of the middle, down to the chin.
 */
function showFace(s: Sketch, top: number, sides: number, across: number): void {
  for (let y = top; y <= 23; y++) {
    for (let x = 0; x < DOLL_WIDTH; x++) {
      const off = Math.abs(x + 0.5 - 16);
      if (off > across) continue;
      if (y >= top + off * ((sides - top) / across)) s.set(x, y, CLEAR);
    }
  }
}

/** From the side: the face shows in front of the hair from `from` across, below `top`. */
function showProfile(s: Sketch, from: number, top: number): void {
  for (let y = top; y <= 23; y++) for (let x = from; x < DOLL_WIDTH; x++) s.set(x, y, CLEAR);
}

/** The crown of every style: a round cap over her head. */
function crown(s: Sketch, side = false): Sketch {
  return side ? s.ellipse(14.5, 11.5, 11, 10.5, 'h') : s.ellipse(16, 11.5, 12, 10.5, 'h');
}

function style(draw: (view: View) => Sketch): HairStyle {
  return { front: draw('front').rows, back: draw('back').rows, side: draw('side').rows };
}

/** Her split bob: blunt at her jaw all round, parted down the middle (like Sia's). */
const SPLIT_BOB = style((view) => {
  const s = new Sketch(DOLL_WIDTH, DOLL_HEIGHT);
  if (view === 'side') {
    crown(s, true).rect(3, 11, 16, 12, 'h');
    showProfile(s, 17, 9);
    return s;
  }
  crown(s).rect(4, 11, 24, 12, 'h');
  if (view === 'front') {
    showFace(s, 7, 12, 6);
  } else {
    s.rect(15, 1, 2, 7, 'H');
  }
  return s;
});

/** Long and straight, past her shoulders, with a soft fringe. */
const LONG = style((view) => {
  const s = new Sketch(DOLL_WIDTH, DOLL_HEIGHT);
  if (view === 'side') {
    crown(s, true).rect(3, 11, 13, 17, 'h').ellipse(9, 28, 6, 3, 'h');
    showProfile(s, 17, 8);
    return s;
  }
  crown(s).rect(4, 11, 24, 12, 'h');
  if (view === 'front') {
    s.rect(4, 22, 6, 7, 'h').rect(22, 22, 6, 7, 'h');
    s.ellipse(7, 29, 3, 2, 'h').ellipse(25, 29, 3, 2, 'h');
    showFace(s, 8, 11, 7);
  } else {
    s.rect(4, 22, 24, 7, 'h').ellipse(16, 29, 12, 3, 'h');
  }
  return s;
});

/** A rounded bob with a straight fringe, curling in under her chin. */
const BOB = style((view) => {
  const s = new Sketch(DOLL_WIDTH, DOLL_HEIGHT);
  if (view === 'side') {
    crown(s, true).rect(3, 11, 15, 9, 'h').ellipse(10, 20, 7, 2.5, 'h');
    showProfile(s, 17, 10);
    return s;
  }
  crown(s).rect(4, 11, 24, 9, 'h').ellipse(16, 20, 12, 2.5, 'h');
  if (view === 'front') {
    showFace(s, 10, 10, 7);
  }
  return s;
});

/** Two bunches, one each side, with a fringe. */
const BUNCHES = style((view) => {
  const s = new Sketch(DOLL_WIDTH, DOLL_HEIGHT);
  if (view === 'side') {
    crown(s, true).rect(4, 11, 13, 6, 'h').ellipse(4, 18, 3.5, 6, 'h');
    s.rect(3, 11, 3, 2, 'x');
    showProfile(s, 17, 10);
    return s;
  }
  crown(s).rect(4, 11, 24, 5, 'h');
  s.ellipse(3.5, 18, 3.5, 6.5, 'h').ellipse(28.5, 18, 3.5, 6.5, 'h');
  s.rect(3, 10, 3, 2, 'x').rect(26, 10, 3, 2, 'x');
  if (view === 'front') {
    showFace(s, 9, 11, 7);
  }
  return s;
});

/** A pixie cut, swept to one side and short at the back. */
const PIXIE = style((view) => {
  const s = new Sketch(DOLL_WIDTH, DOLL_HEIGHT);
  if (view === 'side') {
    s.ellipse(15, 11, 10.5, 9.5, 'h').rect(6, 11, 10, 6, 'h');
    showProfile(s, 17, 8);
    return s;
  }
  s.ellipse(16, 11, 10.5, 9.5, 'h').rect(6, 11, 20, 5, 'h');
  if (view === 'front') {
    // The fringe sweeps down to her left.
    for (let x = 9; x <= 22; x++) {
      const top = Math.round(7 + (x - 9) * 0.25);
      for (let y = top; y <= 23; y++) if (x >= 9 && x <= 22) s.set(x, y, CLEAR);
    }
  } else {
    s.ellipse(16, 17, 9, 3, 'h');
  }
  return s;
});

export const HAIR: Record<HairStyleId, HairStyle> = {
  splitBob: SPLIT_BOB,
  long: LONG,
  bob: BOB,
  bunches: BUNCHES,
  pixie: PIXIE,
};

/** A hat, one sketch for each way she faces; drawn over her hair and outlined all round. */
type HatStyle = (view: View) => Sketch;

/** Her pumpkin beanie: a ribbed dome with a stalk on top. */
const BEANIE: HatStyle = (view) => {
  const s = new Sketch(DOLL_WIDTH, DOLL_HEIGHT);
  const cx = view === 'side' ? 15 : 16;
  s.ellipse(cx, 10.5, 12.5, 9.5, 'm').rect(0, 11, DOLL_WIDTH, 40, CLEAR);
  s.rect(cx - 12, 9, 25, 2, 'M');
  for (let x = cx - 12; x <= cx + 12; x += 2) s.set(x, 10, 'm');
  for (const dx of [-6, 0, 6]) for (let y = 3; y < 9; y++) s.set(cx + dx, y, 'M');
  s.rect(cx - 1, 1, 2, 2, 'x');
  return s;
};

/**
 * How many rows a tall hat rises above her head, where her hair already reaches the top of her
 * 32×48 (phase V: squashed to fit, the witch hat lost its point and her hair showed round it).
 * Wearing one, every layer of her is lifted by this much, so her feet stay where they were.
 */
export const HAT_ROOM = 12;

/**
 * A witch hat: a brim just above her fringe, and a cone that covers the crown of her head and
 * rises above it, its tip flopped over the way they always are, with a candlelit band.
 */
const WITCH_HAT: HatStyle = (view) => {
  const s = new Sketch(DOLL_WIDTH, DOLL_HEIGHT + HAT_ROOM);
  const cx = view === 'side' ? 15 : 16;
  const at = (x: number) => (view === 'back' ? 31 - x : x);
  const base = HAT_ROOM + 6;
  for (let y = 1; y <= base; y++) {
    const half = (12 * y) / base;
    // The top of the cone leans over, a pixel more each row up.
    const lean = y < 6 ? Math.round((6 - y) ** 1.4 * 0.7) : 0;
    for (let x = Math.round(cx - half); x < Math.round(cx + half); x++) {
      s.set(at(x + lean), y, 'm');
    }
  }
  for (let x = cx - 11; x < cx + 11; x++) s.set(at(x), base - 2, 'x').set(at(x), base - 1, 'x');
  s.ellipse(cx, base + 1.5, 15, 2.2, 'm');
  return s;
};

/** Cat ears on a headband, pink inside where they face her way. */
const CAT_EARS: HatStyle = (view) => {
  const s = new Sketch(DOLL_WIDTH, DOLL_HEIGHT);
  const ears = view === 'side' ? [11, 17] : [7, 20];
  for (const left of ears) {
    for (let y = 0; y < 6; y++) {
      const w = 1 + Math.floor(y / 1.2);
      for (let x = left + 2 - Math.floor(w / 2); x < left + 2 - Math.floor(w / 2) + w; x++) {
        s.set(x, y, 'm');
      }
    }
    if (view !== 'back') s.rect(left + 1, 3, 2, 2, 'x').set(left + 2, 2, 'x');
  }
  for (let x = 5; x <= 26; x++) {
    const y = Math.round(3 + ((x - 15.5) / 11) ** 2 * 6);
    s.set(x, y, 'M').set(x, y + 1, 'M');
  }
  return s;
};

/** A ring of little flowers with leaves between them, over the top of her head. */
const FLOWER_CROWN: HatStyle = (view) => {
  const s = new Sketch(DOLL_WIDTH, DOLL_HEIGHT);
  const arc = (x: number) => Math.round(4 + ((x - 15.5) / 11) ** 2 * 5);
  for (let x = 5; x <= 26; x++) s.set(x, arc(x), 'y').set(x, arc(x) + 1, 'y');
  const flowers = view === 'side' ? [15, 20, 25] : [7, 12, 17, 22];
  for (const x of flowers) {
    const y = arc(x + 1) - 1;
    s.rect(x, y, 3, 3, 'm')
      .set(x, y, CLEAR)
      .set(x + 2, y, CLEAR)
      .set(x + 1, y + 1, 'x');
  }
  return s;
};

/** A wide-brimmed straw hat with a ribbon round it, for a day in the garden. */
const SUN_HAT: HatStyle = (view) => {
  const s = new Sketch(DOLL_WIDTH, DOLL_HEIGHT);
  const cx = view === 'side' ? 15 : 16;
  s.ellipse(cx, 8, 9, 7, 'm').rect(0, 8, DOLL_WIDTH, 40, CLEAR);
  s.rect(cx - 9, 6, 18, 2, 'y');
  s.ellipse(16, 9, 16, 2.5, 'm');
  return s;
};

/**
 * A bug catcher's pith helmet (0.2's J2): a round dome with a band, and a narrow brim all round.
 */
const EXPLORER_HAT: HatStyle = (view) => {
  const s = new Sketch(DOLL_WIDTH, DOLL_HEIGHT);
  const cx = view === 'side' ? 15 : 16;
  s.ellipse(cx, 9, 10, 8, 'm').rect(0, 9, DOLL_WIDTH, 40, CLEAR);
  s.rect(cx - 10, 6, 20, 2, 'x');
  s.ellipse(16, 9.5, 14, 2, 'm');
  s.set(cx, 1, 'M');
  return s;
};

/** How many rows a butterfly's antennae rise above her head. */
const ANTENNAE_ROOM = 6;

/** A butterfly's antennae on a headband, curling out, a bobble on the end of each. */
const ANTENNAE: HatStyle = (view) => {
  const s = new Sketch(DOLL_WIDTH, DOLL_HEIGHT + ANTENNAE_ROOM);
  const top = ANTENNAE_ROOM;
  for (let x = 5; x <= 26; x++) {
    const y = top + Math.round(3 + ((x - 15.5) / 11) ** 2 * 6);
    s.set(x, y, 'M').set(x, y + 1, 'M');
  }
  const roots =
    view === 'side'
      ? [[13, -1]]
      : [
          [12, -1],
          [19, 1],
        ];
  for (const [root, way] of roots as [number, number][]) {
    for (let i = 0; i < 7; i++) {
      const x = root + way * Math.round(i * 0.6 + (i > 4 ? i - 4 : 0));
      s.set(x, top + 3 - i, 'm');
    }
    const tip = root + way * (Math.round(6 * 0.6) + 2);
    s.rect(tip - 1, top - 5, 3, 2, 'x').rect(tip, top - 6, 1, 4, 'x');
  }
  return s;
};

/** A ringmaster's top hat (0.2's J2): a tall crown with a gold band, on a curled brim. */
const TOP_HAT: HatStyle = (view) => {
  const s = new Sketch(DOLL_WIDTH, DOLL_HEIGHT + HAT_ROOM);
  const cx = view === 'side' ? 15 : 16;
  const base = HAT_ROOM + 6;
  s.rect(cx - 7, 5, 14, base - 5, 'm');
  s.rect(cx - 7, base - 4, 14, 2, 'x');
  s.ellipse(cx, 5, 7, 1.2, 'M');
  s.ellipse(cx, base + 1.5, 12.5, 2, 'm');
  return s;
};

/**
 * A lion's mane (0.2's J2): a shaggy ring of fur all round her face, tufted at the edge, and two
 * round ears on top. From behind it's all mane.
 */
const MANE: HatStyle = (view) => {
  const s = new Sketch(DOLL_WIDTH, DOLL_HEIGHT);
  const cx = view === 'side' ? 13 : 16;
  s.ellipse(cx, 15, 13, 12.5, 'm');
  for (let a = 0; a < 24; a++) {
    const t = (a / 24) * Math.PI * 2;
    s.ellipse(cx + Math.cos(t) * 12.5, 15 + Math.sin(t) * 12, 2, 2, a % 2 ? 'm' : 'M');
  }
  for (let a = 0; a < 12; a++) {
    const t = (a / 12) * Math.PI * 2 + 0.2;
    s.set(Math.round(cx + Math.cos(t) * 9), Math.round(15 + Math.sin(t) * 9), 'M');
  }
  const ears = view === 'side' ? [cx + 3] : [cx - 8, cx + 8];
  for (const x of ears) s.ellipse(x, 3.5, 3, 3, 'm').ellipse(x, 4, 1.5, 1.5, 'x');
  if (view === 'front') s.ellipse(16, 17, 8, 8.5, CLEAR);
  if (view === 'side') s.ellipse(20, 17, 6.5, 8, CLEAR);
  return s;
};

/** How many rows a bobble rises above her head. */
const BOBBLE_ROOM = 3;

/** A knit beanie (0.2's W2): a turned-up, ribbed cuff and a fluffy bobble on top. */
const POM_BEANIE: HatStyle = (view) => {
  const s = new Sketch(DOLL_WIDTH, DOLL_HEIGHT + BOBBLE_ROOM);
  const cx = view === 'side' ? 15 : 16;
  const top = BOBBLE_ROOM;
  s.ellipse(cx, top + 10.5, 12.5, 9.5, 'm').rect(0, top + 11, DOLL_WIDTH, 40, CLEAR);
  s.rect(cx - 12, top + 7, 25, 4, 'M');
  for (let x = cx - 11; x <= cx + 11; x += 2) s.rect(x, top + 7, 1, 4, 'm');
  s.ellipse(cx, 3, 3.5, 3, 'x');
  return s;
};

/** A big floppy bow (0.2's W2), clipped at the side of her head, its tails hanging down. */
const HAIR_BOW: HatStyle = (view) => {
  const s = new Sketch(DOLL_WIDTH, DOLL_HEIGHT);
  // On her left: the viewer's right from the front, and left from behind.
  const cx = view === 'front' ? 22 : view === 'back' ? 10 : 11;
  s.ellipse(cx - 3, 5, 3, 2.5, 'm').ellipse(cx + 3, 5, 3, 2.5, 'm');
  s.rect(cx - 5, 7, 2, 1, 'm').rect(cx + 3, 7, 2, 1, 'm');
  s.set(cx - 1, 9, 'm')
    .set(cx - 2, 10, 'm')
    .set(cx, 9, 'm')
    .set(cx + 1, 10, 'm');
  s.rect(cx - 1, 4, 2, 3, 'M');
  return s;
};

const HATS: Partial<Record<CutId, HatStyle>> = {
  beanie: BEANIE,
  witchHat: WITCH_HAT,
  catEars: CAT_EARS,
  flowerCrown: FLOWER_CROWN,
  sunHat: SUN_HAT,
  explorerHat: EXPLORER_HAT,
  antennae: ANTENNAE,
  topHat: TOP_HAT,
  mane: MANE,
  pomBeanie: POM_BEANIE,
  hairBow: HAIR_BOW,
};

type Glasses = 'roundGlasses' | 'catEyeGlasses' | 'squareGlasses';

/** Frames round her eyes; cat-eyes flick up at the outer corners, and square ones are thick. */
function glassesRows(cut: Glasses, view: View): string[] {
  const s = new Sketch(DOLL_WIDTH, DOLL_HEIGHT);
  if (view === 'back') return s.rows;
  if (cut === 'squareGlasses') {
    const lens = (x: number) => s.rect(x, 14, 7, 5, 'm').rect(x + 1, 15, 5, 3, CLEAR);
    if (view === 'front') {
      lens(8);
      lens(17);
      s.rect(15, 15, 2, 1, 'm');
    } else {
      lens(19);
      s.rect(13, 15, 6, 1, 'm');
    }
    return s.rows;
  }
  const lens = (cx: number) => {
    const ring = new Sketch(DOLL_WIDTH, DOLL_HEIGHT)
      .ellipse(cx, 16.5, 3.5, 3.5, 'm')
      .ellipse(cx, 16.5, 2.5, 2.5, CLEAR);
    s.stamp(ring, 0, 0);
  };
  if (view === 'front') {
    lens(12);
    lens(20);
    s.rect(15, 15, 2, 1, 'm');
    if (cut === 'catEyeGlasses') s.rect(7, 13, 2, 1, 'm').rect(23, 13, 2, 1, 'm');
  } else {
    lens(21.5);
    s.rect(13, 15, 5, 1, 'm');
    if (cut === 'catEyeGlasses') s.rect(24, 13, 2, 1, 'm');
  }
  return s.rows;
}

// ---- Clothes ---------------------------------------------------------------------------------

/** What is drawn on a piece beyond its cut: a band tee's print, a pendant, a dress's pattern. */
export interface OutfitArt {
  /** Centred on her chest from the front. */
  print?: Grid;
  /** Centred between her shoulder blades from behind. */
  backPrint?: Grid;
  /** Across the front of a dress's skirt, which is wider than her chest. */
  skirtPrint?: Grid;
  /** Hung from a chain, centred under her chin. */
  pendant?: Grid;
  /** Over the piece's main colour: little flowers, checks, dots, or glitter for shoes. */
  pattern?: 'floral' | 'gingham' | 'dots' | 'glitter' | 'patchwork' | 'stripes';
  /** Colours of `x` and `y` in the art, when they aren't white and black. */
  accents?: { x?: string; y?: string };
}

const NUMBER_49: Grid = ['x.xxxx', 'x.xx.x', 'xxxxxx', '..x..x', '..xxxx'];

/** A bone, for Bone Jovi. The records are sleeved in the same prints as the tees. */
export const BONE: Grid = ['x....x', '.xxxx.', 'x....x'];

export const OUTFIT_ART: Record<OutfitId, OutfitArt> = {
  // A butterfly, for Dolly's.
  teeGhoulyParton: {
    print: ['xx..xx', 'xxyyxx', '.x..x.'],
    accents: { x: C.candle, y: C.inkFabric },
  },
  // A lightning bolt, a crescent moon and a heart.
  teeLadyGhoulga: { print: ['..xx', '.xx.', 'xx..'], accents: { x: C.candle } },
  teeFleetwoodMacabre: { print: ['.xx.', 'x...', '.xx.'], accents: { x: C.candleBright } },
  teeScreamDion: { print: ['.x..x.', 'xxxxxx', '.xxxx.', '..xx..'], accents: { x: C.rose } },
  cozyTee: {},
  jerseyTigers: { print: NUMBER_49, backPrint: NUMBER_49, accents: { x: C.white, y: C.inkFabric } },
  sundressFloral: { pattern: 'floral' },
  sundressGingham: { pattern: 'gingham' },
  wednesdayDress: {},
  jeans: {},
  cutoffs: {},
  pleatedSkirt: {},
  sneakers: {},
  stompyBoots: {},
  maryJanes: {},
  pumpkinBeanie: { accents: { x: C.mossLight } },
  // A little bat, wings out, and a crescent moon.
  batPendant: { pendant: ['m.m.m', 'mmmmm', '.m.m.'] },
  moonLocket: { pendant: ['.mm', 'm..', 'm..', '.mm'] },
  pearlStrand: {},
  roundGlasses: {},
  catEyeGlasses: {},
  teeBoneJovi: { print: BONE },
  jerseyScarlet: { accents: { y: C.silver } },
  sundressDots: { pattern: 'dots' },
  glitterHeels: { pattern: 'glitter' },
  velvetPumps: {},
  // White soles under a strap, for a bit of height.
  platformMaryJanes: {},
  batBowFlats: { accents: { x: C.inkFabric } },
  rhinestoneBoots: { pattern: 'glitter' },
  kneeHighBoots: {},
  moonbeamSandals: { accents: { x: C.candleBright } },
  witchHat: { accents: { x: C.candle } },
  catEars: { accents: { x: C.roseLight } },
  // A ribcage, down the front.
  skeletonTee: { print: ['..xx..', 'xx..xx', '..xx..', 'xx..xx', '..xx..'] },
  jackOLanternDress: { skirtPrint: ['.yy..yy.', '.yy..yy.', 'y......y', '.yyyyyy.'] },
  // An open book, and a cupcake.
  bookwormTee: { print: ['xx.xx', 'xxyxx', 'xxyxx'] },
  flowerCrown: { accents: { x: C.candle, y: C.leaf } },
  crumbsTee: { print: ['.xx.', 'xxxx', 'yyyy', '.yy.'], accents: { x: C.roseLight, y: C.wood } },
  starryDress: { pattern: 'glitter', accents: { x: C.candleBright } },
  strawSunHat: { accents: { y: C.rose } },
  maroonTee: {},
  manyColoursCoat: { pattern: 'patchwork', accents: { x: C.candle, y: C.roseLight } },
  // An envelope, sealed with a heart; bubbles; a check, like any good flannel; a moon and a star.
  postieTee: {
    print: ['xxxxxxx', 'xyx.xyx', 'x.yyy.x', 'xxxxxxx'],
    accents: { x: C.white, y: C.scarlet },
  },
  bubbleDress: { pattern: 'dots', accents: { x: C.iceLight } },
  flannelShirt: { pattern: 'gingham', accents: { x: C.inkFabric } },
  nightSkyTee: {
    print: ['.xx....', 'x....y.', 'x...yyy', 'x....y.', '.xx....'],
    accents: { x: C.candleBright, y: C.candle },
  }, // The Halloween shelf's costumes (0.2's J2): two pockets, a monarch's white spots and black
  // veins, a ringmaster's gold and black, the mane's inner ears.
  bugCatcherHat: { accents: { x: C.bark } },
  bugCatcherShirt: { print: ['xx..xx', 'xx..xx'], accents: { x: C.creamShade } },
  butterflyAntennae: { accents: { x: C.candle } },
  butterflyWings: { accents: { x: C.white, y: C.inkFabric } },
  ringmasterHat: { accents: { x: C.gold } },
  ringmasterCoat: { accents: { x: C.gold, y: C.inkFabric } },
  lionMane: { accents: { x: C.roseLight } },
  clueTurtleneck: {},
  clueGlasses: {},
  scaredyTee: {},
  // The fuller closet (0.2's W2): white drawstrings, a cream vest and moth-gold buttons, white
  // stripes, brass buttons on the bib, a white bobble and a white frill at the gloves' cuffs.
  cozyHoodie: {},
  comfyShirt: {},
  mothCardigan: { accents: { x: C.cream, y: C.candle } },
  stripyTee: { pattern: 'stripes' },
  leggings: {},
  overalls: { accents: { x: C.candle } },
  skaterSkirt: {},
  joggers: {},
  rainBoots: {},
  bobbleBeanie: {},
  hairBow: {},
  gardenGloves: {},
};

function centred(grid: Grid): number {
  return 16 - Math.ceil((grid[0]?.length ?? 0) / 2);
}

const PATCHES = ['m', 'x', 'y', 'M'] as const;

function withPattern(rows: string[], pattern: OutfitArt['pattern']): string[] {
  if (!pattern) return rows;
  return rows.map((line, r) =>
    [...line]
      .map((ch, c) => {
        if (ch !== 'm') return ch;
        // Little flowers in staggered rows, like a print on cotton.
        if (pattern === 'floral')
          return r % 3 === 1 && (c + (r % 6 === 1 ? 0 : 2)) % 4 === 1 ? 'x' : ch;
        if (pattern === 'dots')
          return r % 2 === 0 && (c + (r % 4 === 0 ? 0 : 2)) % 4 === 1 ? 'x' : ch;
        // A sparkle here and there, dense enough that even a pair of heels catches one.
        if (pattern === 'glitter') return (r * 5 + c * 3) % 7 === 0 ? 'x' : ch;
        // Squares of three colours and the fabric's shade, like a quilt.
        if (pattern === 'patchwork')
          return PATCHES[(Math.floor(r / 3) + 2 * Math.floor(c / 3)) % 4]!;
        // Bold stripes, a pixel of the accent every other pair of rows.
        if (pattern === 'stripes') return r % 3 === 0 ? 'x' : ch;
        return ((r >> 1) + (c >> 1)) % 2 === 0 ? 'x' : ch;
      })
      .join(''),
  );
}

/** How many rows above a foot pixel (r, c) is, straight down her leg; Infinity if not on one. */
function aboveFoot(body: Grid, r: number, c: number): number {
  for (let rr = r + 1; rr < body.length; rr++) {
    const key = body[rr]![c];
    if (key === 'f') return rr - r;
    if (key !== 'l') return Infinity;
  }
  return Infinity;
}

/**
 * Which end of a foot a foot pixel is. From the side she faces right in the grid, so the heel is a
 * foot's left end and the toe its right; from the front they are just its two sides.
 */
function footEnd(body: Grid, r: number, c: number): 'heel' | 'toe' | 'both' | null {
  const row = body[r]!;
  if (row[c] !== 'f') return null;
  const heel = row[c - 1] !== 'f';
  const toe = row[c + 1] !== 'f';
  return heel && toe ? 'both' : heel ? 'heel' : toe ? 'toe' : null;
}

/** Whether (r, c) is the outline just under a foot pixel, where a sole or a heel would be. */
function underFoot(body: Grid, r: number, c: number): boolean {
  return body[r]![c] === 'o' && body[r - 1]?.[c] === 'f';
}

/** A heel is drawn under the back of each foot, and shows only from the side. */
function underHeel(body: Grid, view: View, r: number, c: number): boolean {
  if (view !== 'side' || !underFoot(body, r, c)) return false;
  const end = footEnd(body, r - 1, c);
  return end === 'heel' || end === 'both';
}

/** Whether a pixel of her arm is beside a part of it further down: where a sleeve ends. */
function cuffOf(body: Grid, r: number, c: number, beyond: string): boolean {
  return [body[r + 1]?.[c], body[r - 1]?.[c], body[r]?.[c - 1], body[r]?.[c + 1]].some(
    (k) => k !== undefined && beyond.includes(k),
  );
}

/**
 * A skirt flaring from her hips, `rows` long and `flare` pixels wider each side by its hem, and
 * behind her arms and hands, which stay in front of it.
 */
function skirt(body: Grid, view: View, rows: number, flare: number, pleats: boolean): string[] {
  const half = view === 'side' ? 5 : 6;
  return body.map((line, y) =>
    [...line]
      .map((key, x) => {
        const i = y - HIPS;
        if (i < 0 || i >= rows || ARM.includes(key)) return CLEAR;
        const w = half + (flare * i) / (rows - 1);
        if (Math.abs(x + 0.5 - 16) > w) return CLEAR;
        return pleats && i > 0 && x % 3 === 0 ? 'M' : 'm';
      })
      .join(''),
  );
}

/**
 * A butterfly's wings (0.2's J2) behind a dress with a short flared skirt: an upper and a lower
 * wing each side, veined, with white dots at their edges, showing only where she doesn't. From the
 * side they're one pair behind her back.
 */
function wingRows(body: Grid, view: View): string[] {
  const wings = new Sketch(DOLL_WIDTH, DOLL_HEIGHT);
  const pair = (x: number, lean: number) => {
    wings.ellipse(x, 24, 5.5, 9, 'm').ellipse(x + lean, 36, 4, 4.5, 'm');
    for (let i = 0; i < 7; i++) wings.set(x + Math.round((i - 3) * 0.5 * lean), 19 + i * 3, 'y');
    for (const [dx, y] of [
      [-1, 16],
      [2, 17],
      [-3, 20],
      [3, 23],
      [-3, 27],
    ] as const) {
      wings.set(x + dx * lean, y, 'x');
    }
    wings.set(x - 2 * lean, 39, 'x');
  };
  if (view === 'side') pair(7, 1);
  else {
    pair(4, 1);
    pair(27, -1);
  }
  const behind = wings.rows.map((row, r) =>
    [...row].map((ch, c) => ((body[r]?.[c] ?? CLEAR) === CLEAR ? ch : CLEAR)).join(''),
  );
  const dress = paint(body, (k) => (k === 'b' ? 'm' : null));
  return stamp(stamp(behind, dress, 0), skirt(body, view, 6, 2, false), 0);
}

/** One piece of clothing's layer, for one facing and frame, finished and ready for its colours. */
export function pieceRows(worn: Worn, view: View, body: Grid): readonly string[] {
  return remember(body, `piece:${worn.id}:${view}`, () => drawPiece(worn, view, body));
}

function drawPiece(worn: Worn, view: View, body: Grid): string[] {
  const art = OUTFIT_ART[worn.id];
  const cut = OUTFITS[worn.id].cut;
  const rows = withPattern(tailor(cutRows(cut, art, view, body), cut, view, body), art.pattern);
  if (NECKLACES.includes(cut) || GLASSES.includes(cut)) return rows;
  return finish(rows, body, HATS[cut] ? 'drawn' : 'painted');
}

const TOPS: readonly CutId[] = [
  'tee',
  'jersey',
  'threeQuarterTee',
  'sundress',
  'collarDress',
  'jacket',
  'turtleneck',
  'hoodie',
  'cardigan',
  'bigTee',
  'longTee',
];
const CREW_NECKS: readonly CutId[] = ['tee', 'jersey', 'threeQuarterTee', 'bigTee', 'longTee'];
const TROUSERS: readonly CutId[] = ['jeans', 'cutoffs', 'overalls'];

/** Bottoms worn over the top, not under it: overalls, their bib and straps across it. */
const BIBS: readonly CutId[] = ['overalls'];

/**
 * Seams, folds and shade, the same on every piece of a cut: a top creases under her arms and
 * pulls in toward her waist, a crew neck has its rim, and trousers have a fly, pockets and a
 * knee catching the light. Only plain fabric (`m`) is touched, so a print or a trim stays whole.
 */
function tailor(rows: string[], cut: CutId, view: View, body: Grid): string[] {
  const top = TOPS.includes(cut);
  const trousers = TROUSERS.includes(cut);
  if (!top && !trousers) return rows;
  const front = view === 'front';
  const folds = new Set<string>();
  const fold = (x: number, y: number) => folds.add(`${x},${y}`);
  if (top && view !== 'side') {
    for (let y = SHOULDER + 2; y <= HEM; y++) {
      for (let x = 0; x < DOLL_WIDTH; x++) {
        const beside = [body[y]?.[x - 1], body[y]?.[x + 1]];
        if (body[y]?.[x] === 'b' && beside.some((k) => k !== undefined && ARM.includes(k))) {
          fold(x, y);
        }
      }
    }
    for (const [x, y] of [
      [12, 30],
      [13, 31],
      [19, 30],
      [18, 31],
    ] as const) {
      fold(x, y);
    }
    if (front && CREW_NECKS.includes(cut)) for (let x = 13; x <= 18; x++) fold(x, SHOULDER);
  }
  if (trousers && view !== 'side') {
    const seams: [number, number][] = front
      ? [
          [16, HIPS],
          [16, HIPS + 1],
          [11, HIPS],
          [12, HIPS + 1],
          [20, HIPS],
          [19, HIPS + 1],
        ]
      : [11, 12, 13, 18, 19, 20].map((x) => [x, HIPS + 1]);
    for (const [x, y] of seams) fold(x, y);
  }
  const knees = new Set(trousers && cut === 'jeans' ? ['11,40', '18,40', '12,41', '19,41'] : []);
  return rows.map((line, y) =>
    [...line]
      .map((ch, x) => {
        if (ch !== 'm') return ch;
        if (folds.has(`${x},${y}`)) return 'M';
        return front && knees.has(`${x},${y}`) && body[y]?.[x] === 'l' ? 'L' : ch;
      })
      .join(''),
  );
}

const NECKLACES: readonly CutId[] = ['chainPendant', 'pearls'];
const GLASSES: readonly CutId[] = ['roundGlasses', 'catEyeGlasses', 'squareGlasses'];

function cutRows(cut: CutId, art: OutfitArt, view: View, body: Grid): string[] {
  const front = view === 'front';
  switch (cut) {
    case 'tee':
    case 'jersey':
    case 'threeQuarterTee': {
      const sleeve = cut === 'threeQuarterTee' ? 'ae' : 'a';
      let rows = paint(body, (k, r, c) => {
        if (k === 'b' || sleeve.includes(k)) {
          if (cut === 'threeQuarterTee' && k === 'e' && cuffOf(body, r, c, 'wA')) return 'M';
          return 'm';
        }
        // The jersey's sleeves are a stripe longer, in its stripes.
        if (cut === 'jersey' && k === 'e' && cuffOf(body, r, c, 'a')) {
          return (r + c) % 2 ? 'y' : 'x';
        }
        return null;
      });
      // A print ends at the hem, however tall it is, below where a pendant hangs.
      if (front && art.print) {
        rows = stamp(rows, art.print, HEM + 1 - art.print.length, centred(art.print));
      }
      if (view === 'back' && art.backPrint) {
        rows = stamp(rows, art.backPrint, SHOULDER + 2, centred(art.backPrint));
      }
      return rows;
    }
    case 'sundress': {
      const straps = view === 'side' ? [18] : [11, 12, 19, 20];
      let rows = paint(body, (k, r, c) => {
        if (k !== 'b') return null;
        // A scooped neck: straps only, for the top four rows of her, room for her rose.
        if (r <= SHOULDER + (front ? 3 : 2) && !(view === 'back' && r > SHOULDER)) {
          return straps.includes(c) ? 'm' : null;
        }
        return 'm';
      });
      if (front && art.print) {
        rows = stamp(rows, art.print, HEM - art.print.length, centred(art.print));
      }
      rows = stamp(rows, skirt(body, view, 8, 3, false), 0);
      if (front && art.skirtPrint) {
        rows = stamp(rows, art.skirtPrint, HIPS + 2, centred(art.skirtPrint));
      }
      return rows;
    }
    case 'collarDress': {
      const collar = view === 'side' ? [16, 17, 18] : view === 'front' ? [12, 13, 18, 19] : null;
      const rows = paint(body, (k, r, c) => {
        if (k === 'b') {
          const peter = r === SHOULDER && (collar === null || collar.includes(c));
          return peter || (r === SHOULDER + 1 && collar?.includes(c)) ? 'x' : 'm';
        }
        if ('aew'.includes(k)) return k === 'w' && cuffOf(body, r, c, 'A') ? 'x' : 'm';
        return null;
      });
      return stamp(rows, skirt(body, view, 8, 3, false), 0);
    }
    case 'jeans':
      return paint(body, (k, r, c) => {
        if (k === 'p') return 'm';
        if (k === 'l') return aboveFoot(body, r, c) === 1 ? 'M' : 'm';
        return null;
      });
    case 'cutoffs':
      return paint(body, (k, r) => {
        if (k === 'p') return 'm';
        if (k === 'l' && r <= HIPS + 5) return r === HIPS + 5 ? 'x' : 'm';
        return null;
      });
    case 'pleatedSkirt':
      return skirt(body, view, 7, 2, true);
    case 'sneakers':
      return paint(body, (k, r, c) => {
        if (k === 'f') return 'm';
        if (underFoot(body, r, c)) return 'x';
        const up = k === 'l' ? aboveFoot(body, r, c) : Infinity;
        return up === 1 ? 'm' : up === 2 ? 'x' : null;
      });
    case 'boots':
      return paint(body, (k, r, c) => {
        if (k === 'f') return 'm';
        const up = k === 'l' ? aboveFoot(body, r, c) : Infinity;
        return up <= 4 ? 'm' : up === 5 ? 'M' : null;
      });
    case 'maryJanes':
      return paint(body, (k, r, c) => {
        if (k === 'f') return r > 0 && body[r - 1]?.[c] === 'l' ? 'M' : 'm';
        return k === 'l' && aboveFoot(body, r, c) <= 2 ? 'x' : null;
      });
    case 'heels':
      return paint(body, (k, r, c) => {
        if (k === 'f') return 'm';
        return underHeel(body, view, r, c) ? 'M' : null;
      });
    case 'platforms':
      return paint(body, (k, r, c) => {
        if (k === 'f') return 'm';
        if (underFoot(body, r, c)) return 'x';
        return k === 'l' && aboveFoot(body, r, c) === 1 ? 'M' : null;
      });
    case 'flats':
      // A little bow on each: on the toe from the side, and on the inside of each foot from the front.
      return paint(body, (k, r, c) => {
        if (k !== 'f') return null;
        if (view === 'side') return footEnd(body, r, c) === 'toe' ? 'x' : 'm';
        return view === 'front' && (c === 13 || c === 18) ? 'x' : 'm';
      });
    case 'tallBoots':
      return paint(body, (k, r, c) => {
        if (k === 'f') return 'm';
        if (underHeel(body, view, r, c)) return 'M';
        const up = k === 'l' ? aboveFoot(body, r, c) : Infinity;
        return up <= 7 ? 'm' : up === 8 ? 'M' : null;
      });
    case 'sandals':
      // Straps with her toes showing between them, a thin sole, and a shining ankle strap.
      return paint(body, (k, r, c) => {
        if (k === 'f') return (r + c) % 2 === 0 ? 'm' : null;
        if (underFoot(body, r, c)) return 'M';
        return k === 'l' && aboveFoot(body, r, c) === 1 ? 'x' : null;
      });
    case 'beanie':
    case 'witchHat':
    case 'catEars':
    case 'flowerCrown':
    case 'sunHat':
    case 'explorerHat':
    case 'antennae':
    case 'topHat':
    case 'mane':
      return HATS[cut]!(view).rows;
    case 'chainPendant':
    case 'pearls': {
      if (view === 'back') return [...EMPTY];
      const pearls = cut === 'pearls';
      if (view === 'side') {
        const chain = pearls ? ['.......m...', '........Lm.'] : ['.......m...', '........m..'];
        const rows = stamp(EMPTY, chain, SHOULDER, 11);
        return pearls ? rows : stamp(rows, ['m', 'M'], SHOULDER + 2, 19);
      }
      const chain = pearls ? ['...m....m...', '....LmLm....'] : ['...m....m...', '....m..m....'];
      const rows = stamp(EMPTY, chain, SHOULDER, 10);
      if (!art.pendant) return rows;
      return stamp(rows, art.pendant, SHOULDER + 2, centred(art.pendant));
    }
    case 'roundGlasses':
    case 'catEyeGlasses':
    case 'squareGlasses':
      return glassesRows(cut, view);
    case 'jacket': {
      // A ringmaster's: gold cuffs and buttons, and dark lapels down the front.
      const lapels = [14, 15, 16, 17];
      const buttons = [SHOULDER + 3, SHOULDER + 5, SHOULDER + 7];
      return paint(body, (k, r, c) => {
        if ('aew'.includes(k)) return k === 'w' && cuffOf(body, r, c, 'A') ? 'x' : 'm';
        if (k !== 'b') return null;
        if (!front) return 'm';
        if (lapels.includes(c) && r <= SHOULDER + 3 + Math.abs(c - 15.5)) return 'y';
        return (c === 12 || c === 19) && buttons.includes(r) ? 'x' : 'm';
      });
    }
    case 'turtleneck':
      // Long sleeves, and a folded collar up her neck.
      return paint(body, (k, r, c) => {
        if (k === 'n') return 'M';
        if ('aew'.includes(k)) return k === 'w' && cuffOf(body, r, c, 'A') ? 'M' : 'm';
        return k === 'b' ? 'm' : null;
      });
    case 'wings':
      return wingRows(body, view);
    case 'hoodie':
      return hoodieRows(body, view);
    case 'cardigan':
      return cardiganRows(body, view);
    case 'bigTee':
      return bigTeeRows(body);
    case 'longTee':
      return paint(body, (k, r, c) => {
        if ('aew'.includes(k)) return k === 'w' && cuffOf(body, r, c, 'A') ? 'M' : 'm';
        return k === 'b' ? 'm' : null;
      });
    case 'leggings':
      return paint(body, (k) => ('pl'.includes(k) ? 'm' : null));
    case 'joggers':
      // Cuffed at the ankle, with a drawstring's two ends at the front of the waist.
      return paint(body, (k, r, c) => {
        if (k === 'p') return front && r <= HIPS + 1 && (c === 14 || c === 17) ? 'x' : 'm';
        if (k === 'l') return aboveFoot(body, r, c) <= 2 ? 'M' : 'm';
        return null;
      });
    case 'overalls':
      return overallRows(body, view);
    case 'skaterSkirt': {
      // Short and flared, a band at the waist and a soft fold here and there.
      const flared = skirt(body, view, 6, 3.5, false);
      return flared.map((line, y) =>
        [...line]
          .map((ch, x) => {
            if (ch !== 'm') return ch;
            if (y === HIPS) return 'M';
            return y > HIPS + 2 && x % 5 === 1 ? 'M' : ch;
          })
          .join(''),
      );
    }
    case 'wellies':
      // Up the shin, a rolled rim at the top and a thick sole.
      return paint(body, (k, r, c) => {
        if (k === 'f') return 'm';
        if (underFoot(body, r, c)) return 'M';
        const up = k === 'l' ? aboveFoot(body, r, c) : Infinity;
        return up <= 5 ? 'm' : up === 6 ? 'M' : null;
      });
    case 'gloves':
      // Her hands, and a frill at the wrist.
      return paint(body, (k, r, c) => {
        if (k === 'A') return 'm';
        return k === 'w' && cuffOf(body, r, c, 'A') ? 'x' : null;
      });
    case 'pomBeanie':
    case 'hairBow':
      return HATS[cut]!(view).rows;
  }
}

/**
 * A hoodie (0.2's W2): long sleeves with ribbed cuffs, a ribbed band at her hips, and from the
 * front its hood gathered round her neck, two drawstrings and the pocket across her tummy; from
 * behind, the hood lies between her shoulder blades.
 */
function hoodieRows(body: Grid, view: View): string[] {
  const front = view === 'front';
  return paint(body, (k, r, c) => {
    if ('aew'.includes(k)) return k === 'w' && cuffOf(body, r, c, 'A') ? 'M' : 'm';
    if (k === 'p') return r === HIPS ? 'M' : null;
    if (k === 'n') return view === 'back' ? 'm' : null;
    if (k !== 'b') return null;
    if (front) {
      if (r === SHOULDER && (c <= 12 || c >= 19)) return 'M';
      if ((c === 13 || c === 18) && r > SHOULDER && r <= SHOULDER + 4) return 'x';
      if (r === HEM - 3 && c >= 12 && c <= 19) return 'M';
      if ((c === 12 || c === 19) && r > HEM - 3) return 'M';
    }
    if (view === 'back') {
      if (r <= SHOULDER + 4 && (c === 12 || c === 19)) return 'M';
      if (r === SHOULDER + 5 && c > 12 && c < 19) return 'M';
    }
    if (view === 'side' && c === 12 && r <= SHOULDER + 3) return 'M';
    return 'm';
  });
}

/**
 * A cardigan (0.2's W2), worn open: long sleeves and a hem down over her hips, and from the front
 * the vest under it showing between its edges, with moth buttons down one of them.
 */
function cardiganRows(body: Grid, view: View): string[] {
  const buttons = [SHOULDER + 3, SHOULDER + 6];
  return paint(body, (k, r, c) => {
    if ('aew'.includes(k)) return k === 'w' && cuffOf(body, r, c, 'A') ? 'M' : 'm';
    const open = view === 'front' && c >= 14 && c <= 17;
    if (k === 'p') return r > HIPS + 1 || open ? null : r === HIPS + 1 ? 'M' : 'm';
    if (k !== 'b') return null;
    if (view === 'front') {
      if (open || (r === SHOULDER && (c === 13 || c === 18))) return 'x';
      if (c === 13 && buttons.includes(r)) return 'y';
      if (c === 13 || c === 18) return 'M';
    }
    if (view === 'side' && c === 20) return 'M';
    return 'm';
  });
}

/**
 * Her comfy shirt (0.2's W2, question 34): long sleeves, a hem down over her hips, and a size too
 * big, so it hangs a pixel out past her all down her sides and arms.
 */
function bigTeeRows(body: Grid): string[] {
  const covered = 'bpaew';
  return paint(body, (k, r, c) => {
    if ('aew'.includes(k)) return k === 'w' && cuffOf(body, r, c, 'A') ? 'M' : 'm';
    if (k === 'b') return 'm';
    if (k === 'p') return r <= HIPS + 1 ? 'm' : null;
    // Out over her outline, where her side meets the air, never on a line across her.
    if (k === 'o' && r > SHOULDER && r <= HIPS + 1) {
      const sides = [body[r]?.[c - 1] ?? CLEAR, body[r]?.[c + 1] ?? CLEAR];
      const onHer = sides.some((s) => covered.includes(s));
      return onHer && sides.includes(CLEAR) && !sides.includes('A') ? 'm' : null;
    }
    return null;
  });
}

/**
 * Overalls (0.2's W2): trousers to her ankles, and over her top a bib with a pocket and two
 * buttons, held up by straps; from behind the straps cross between her shoulder blades.
 */
function overallRows(body: Grid, view: View): string[] {
  const bibTop = SHOULDER + 4;
  return paint(body, (k, r, c) => {
    if (k === 'p') return 'm';
    if (k === 'l') return aboveFoot(body, r, c) === 1 ? 'M' : 'm';
    if (k !== 'b') return null;
    if (view === 'front') {
      if (r >= bibTop && c >= 12 && c <= 19) {
        if (r === bibTop && (c === 12 || c === 19)) return 'x';
        return r === bibTop + 2 && c >= 14 && c <= 17 ? 'M' : 'm';
      }
      return c === 12 || c === 19 ? 'm' : null;
    }
    if (view === 'back') {
      if (r >= HEM - 1) return c >= 12 && c <= 19 ? 'm' : null;
      const t = (r - SHOULDER) / (HEM - 1 - SHOULDER);
      return c === Math.round(12 + 7 * t) || c === Math.round(19 - 7 * t) ? 'm' : null;
    }
    if (r >= bibTop && c >= 16) return r === bibTop && c === 18 ? 'x' : 'm';
    return c === 18 ? 'm' : null;
  });
}

// ---- Putting her together ------------------------------------------------------------------

/**
 * Hair in her left and right halves' keys. From the front her left is on the viewer's right;
 * from behind it's on the left. From the side only the near half shows.
 */
export function hairRows(style: HairStyle, facing: Facing, body: Grid): readonly string[] {
  return remember(style, `${facing}:${bodyId(body)}`, () => drawHair(style, facing, body));
}

/**
 * Where a style's shine and strands go, worked out from its shape so they follow any style: a band
 * of light two rows in from the top of the hair on the side the light comes from, and strands
 * of shade fanning out from the parting down to the ends.
 */
function groom(drawn: Grid, view: View): (x: number, y: number) => 'shine' | 'strand' | null {
  const isHair = (x: number, y: number) => 'hjH'.includes(drawn[y]?.[x] ?? CLEAR);
  const depth = (x: number, y: number) => {
    let d = 0;
    while (isHair(x, y - d - 1)) d++;
    return d;
  };
  const cols = [...Array(DOLL_WIDTH).keys()].filter((x) => drawn.some((_, y) => isHair(x, y)));
  const left = Math.min(...cols);
  const right = Math.max(...cols);
  const part = view === 'side' ? left + (right - left) * 0.45 : 15.5;
  return (x, y) => {
    if (!isHair(x, y)) return null;
    const d = depth(x, y);
    // The shine: all along the lit side, and just a glint past the parting.
    const lit = view === 'side' ? x < right - 3 : x < 15 || (x > 17 && x < 21);
    if (lit && x > left && (d === 2 || (d === 3 && x < part - 3))) return 'shine';
    if (d < 5) return null;
    const dx = x + 0.5 - part;
    const dy = y + 0.5;
    const angle = Math.atan2(dx, dy);
    const spread = Math.round(angle * 3.2);
    const off = Math.abs(angle - spread / 3.2) * Math.hypot(dx, dy);
    // A strand now and then broken, so they read as locks rather than stripes.
    if (off < 0.5 && (spread + Math.floor(d / 4)) % 3 !== 0) return 'strand';
    return null;
  };
}

function drawHair(style: HairStyle, facing: Facing, body: Grid): string[] {
  const view = viewOf(facing);
  const mask = style[view].map((row) => row.replace(/[hjH]/g, 'm'));
  const groomed = groom(style[view], view);
  const finished = finish(mask, body, 'painted').map((row, y) =>
    [...row]
      .map((k, x) => {
        const drawn = style[view][y]![x]!;
        if (drawn === 'j' || drawn === 'H') return drawn;
        if (k === 'm') {
          const touch = groomed(x, y);
          return touch === 'shine' ? 'j' : touch === 'strand' ? 'H' : 'h';
        }
        return k === 'M' ? 'H' : k === 'L' ? 'j' : k === 'O' ? 'q' : k;
      })
      .join(''),
  );
  const leftHalf = (c: number): boolean => {
    if (facing === 'down') return c >= 16;
    if (facing === 'up') return c < 16;
    return facing === 'left';
  };
  const other: Record<string, string> = { h: 'g', H: 'G', j: 'J', q: 'Q' };
  return finished.map((line) =>
    [...line].map((ch, c) => (leftHalf(c) ? ch : (other[ch] ?? ch))).join(''),
  );
}

/** A finished layer's outline, shade, colour and light, from its colour's ramp. */
function toneKeys(main: string): Record<string, string> {
  const r = ramp(main);
  return { O: r[0], M: r[1], m: main, L: r[3] };
}

/**
 * Everything a piece of clothing's layer can use, from its fabric (or a colour of its own, for a
 * neighbour's clothes) and its accents.
 */
export function wornPalette(worn: Worn, tone: Tone = FABRIC_TONES[worn.fabric]): Palette {
  const accents = OUTFIT_ART[worn.id].accents;
  return {
    '.': null,
    ...toneKeys(tone.main),
    x: accents?.x ?? C.white,
    y: accents?.y ?? C.inkFabric,
  };
}

/** Her skin: its outline, its shade and itself. */
export function skinPalette(skin: Tone): Palette {
  const r = ramp(skin.main);
  return { '.': null, o: r[0], S: r[1], s: skin.main };
}

export function facePalette(iris: string, skin: Tone): Palette {
  return {
    '.': null,
    E: C.ink,
    w: C.white,
    e: iris,
    i: mix(iris, C.white, 0.45),
    b: mix(skin.shade, C.barkDark, 0.6),
    n: skin.shade,
    c: mix(skin.main, C.cheek, 0.7),
    C: mix(skin.main, C.cheek, 0.45),
    u: C.berryLight,
    U: C.berry,
    r: mix(skin.shade, C.barkDark, 0.35),
    x: C.silver,
  };
}

export function hairPalette(hair: HairTones): Palette {
  const left = ramp(hair.left.main);
  const right = ramp(hair.right.main);
  return {
    '.': null,
    q: left[0],
    H: left[1],
    h: hair.left.main,
    j: left[3],
    Q: right[0],
    G: right[1],
    g: hair.right.main,
    J: right[3],
    x: C.roseLight,
  };
}

/** Black and white, as all of hers are: each key a grey, so the pieces still read apart. */
export const TATTOO_PALETTE: Palette = {
  '.': null,
  k: C.tattooInk,
  W: C.tattooWhite,
  g: C.tattooMid,
  K: C.tattooDark,
  R: C.tattooLight,
  q: C.tattooInk,
  v: C.tattooDark,
  y: C.tattooLight,
  Y: C.tattooDark,
  S: C.tattooWhite,
};

/** Her phone, in its pink case, held up to her face: from where we stand, we see its back. */
const PHONE: Grid = ['.oooo.', 'opkppo', 'oppppo', 'oppPpo', 'opppPo', 'oppppo', '.oooo.'];

/** The order clothes go on, over the body, face and tattoos and under the hair. */
const WORN_ORDER: readonly Slot[] = ['bottom', 'top', 'shoes', 'necklace', 'gloves'];

/** Where a piece goes in `WORN_ORDER`; overalls go on just after the top, over it. */
function layerOf(w: Worn): number {
  const row = OUTFITS[w.id];
  return WORN_ORDER.indexOf(row.slot) + (BIBS.includes(row.cut) ? 1.5 : 0);
}

/**
 * Her, in layers, bottom first: body, face, tattoos, bottom, top or dress (overalls over it),
 * shoes, necklace, gloves, her phone, hair, gauges, hat, glasses, then her arms if they're raised in front of her hair. Gauges
 * go over the hair so they peek out of any style, and a dress hides the bottom it covers. A pose
 * faces the front, whatever `facing` says.
 */
export function dollLayers(look: Look, facing: Facing, frame: number, pose?: Pose): Layer[] {
  const turned = pose ? 'down' : facing;
  const view = viewOf(turned);
  const { body, over } = pose
    ? POSE_BODY[pose]
    : { body: BODY[view][frame % DOLL_FRAMES]!, over: null };
  const drop = pose === 'bang' ? BANG_DROP : 0;
  const skin = SKIN_TONES[look.skin];
  const layers: Layer[] = [];
  const add = (rows: readonly string[], palette: Palette) =>
    layers.push({ source: { rows }, palette });
  const onHead = (rows: readonly string[]) => lower(rows, drop);

  const dressed = OUTFITS[look.outfit.top?.id ?? 'cozyTee'].dress === true;
  const worn = WORN_ORDER.flatMap((slot) => {
    const w = look.outfit[slot];
    return w && !(slot === 'bottom' && dressed) ? [w] : [];
  }).sort((a, b) => layerOf(a) - layerOf(b));
  const dress = (part: Grid, pieces: readonly Worn[]) => {
    add(skinRows(part), skinPalette(skin));
    if (look.tattoos) {
      // Worked out on the whole of her, so an arm raised in front of her hair keeps its ink.
      const ink = tattooRows(look.tattoos, look.stripesArm, body, turned);
      add(
        part === body
          ? ink
          : ink.map((line, r) =>
              [...line].map((ch, c) => (part[r]?.[c] === CLEAR ? CLEAR : ch)).join(''),
            ),
        TATTOO_PALETTE,
      );
    }
    for (const w of pieces) add(pieceRows(w, view, part), wornPalette(w));
  };

  dress(body, []);
  if (view !== 'back') {
    const mood: Mood =
      pose === 'phone'
        ? 'down'
        : pose === 'bang'
          ? 'shut'
          : pose === 'horns'
            ? 'rock'
            : pose === 'pinup'
              ? 'wink'
              : 'open';
    const touches = { ...look, lashes: true };
    add(onHead(faceRows(view, mood, touches)), facePalette(EYE_COLOURS[look.eyes], skin));
  }
  for (const w of worn) add(pieceRows(w, view, body), wornPalette(w));
  if (pose === 'phone') {
    add(stamp(EMPTY, PHONE, 25, 13), { '.': null, o: C.ink, p: C.roseLight, P: C.rose, k: C.ink });
  }

  // Her head is measured against her standing body, then moved with it as it bangs.
  const still = pose ? FRONT_BODY[0]! : body;
  const hair = hairRows(HAIR[look.hairStyle], turned, still);
  add(onHead(hair), hairPalette(hairTones(look.hairColour, look.splitColour)));
  if (look.gauges && view !== 'back') {
    add(onHead(gaugeRows(view)), { '.': null, k: C.silver, K: C.iron });
  }
  for (const slot of ['hat', 'glasses'] as const) {
    const w = look.outfit[slot];
    if (w) add(onHead(pieceRows(w, view, still)), wornPalette(w));
  }
  if (over)
    dress(
      over,
      worn.filter((w) => OUTFITS[w.id].slot === 'top' || OUTFITS[w.id].slot === 'gloves'),
    );
  return raised(layers);
}

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

/** Names a look's picture for the bake cache. The name she typed doesn't change how she looks. */
export function dollKey(look: Look, facing: Facing, frame: number, pose?: Pose): string {
  const worn = (['top', 'bottom', 'shoes', 'hat', 'necklace', 'glasses', 'gloves'] as const)
    .map((slot) => {
      const w = look.outfit[slot];
      return w ? `${w.id}/${w.fabric}` : '-';
    })
    .join(',');
  const body = [
    look.skin,
    look.eyes,
    look.hairStyle,
    look.hairColour,
    look.splitColour,
    look.gauges,
    look.tattoos,
    look.stripesArm,
    look.freckles,
    look.nosePiercing,
  ];
  const at = pose ? `pose:${pose}` : `${facing}:${frame % DOLL_FRAMES}`;
  return `doll:${at}:${body.join(',')}:${worn}`;
}
