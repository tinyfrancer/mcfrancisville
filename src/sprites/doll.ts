import { OUTFITS } from '../data/outfits';
import type { CutId, Facing, Pose, Slot } from '../types/ids';
import type { Look, Worn } from '../types/look';
import type { Feeling } from '../types/mood';
import { backRows } from './doll/backs';
import {
  BANG_DROP,
  BODY,
  DOLL_FRAMES,
  EMPTY,
  FRONT_BODY,
  type Grid,
  type View,
  viewOf,
} from './doll/body';
import { BIBS, JACKETS, pieceRows } from './doll/cuts';
import { facePalette, faceRows, gaugeRows, type Mood } from './doll/face';
import { HAIR, hairPalette, hairRows } from './doll/hair';
import { TATTOO_PALETTE, tattooRows, wristPalette, wristRows } from './doll/ink';
import { lower, skinPalette, skinRows, stamp } from './doll/paint';
import {
  ACTION_BODY,
  ACTION_FRAMES,
  BREATH_FROM,
  CROUCH_DROP,
  CROUCH_FROM,
  folded,
  isAction,
  POSE_BODY,
  raised,
  seated,
} from './doll/poses';
import { wornPalette } from './doll/prints';
import { EYE_COLOURS, hairTones, SKIN_TONES } from './lookColours';
import { PALETTE as C } from './palette';
import { CLEAR } from './sketch';
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

export {
  ARM,
  BODY,
  DOLL_FRAMES,
  DOLL_HEIGHT,
  DOLL_WIDTH,
  EMPTY,
  viewOf,
  type Grid,
  type PoseBody,
  type View,
} from './doll/body';
export {
  ACTION_BODY,
  ACTION_FRAMES,
  ACTION_POSES,
  arm,
  armsBody,
  BREATH_FROM,
  CROUCH_DROP,
  CROUCH_FROM,
  folded,
  forearm,
  isAction,
  mirror,
  POSE_BODY,
  POSES,
  POUR_HAND,
  raised,
  seated,
  SIT_DROP,
  SIT_FROM,
  SWING_HAND,
  type ActionArms,
  type ArmPath,
  type FrontPose,
  type Point,
} from './doll/poses';
export { finish, paint, skinPalette, skinRows, stamp } from './doll/paint';
export { facePalette, faceRows, type FaceTouches, type Mood } from './doll/face';
export { TATTOO_PALETTE, tattooRows, WRIST_ARM, wristPalette, wristRows } from './doll/ink';
export { HAIR, hairPalette, hairRows } from './doll/hair';
export { HAT_ROOM } from './doll/hats';
export { BONE, OUTFIT_ART, wornPalette, type OutfitArt } from './doll/prints';
export { BACKS, backRows } from './doll/backs';
export { pieceRows } from './doll/cuts';

/** Her phone, in its pink case, held up to her face: from where we stand, we see its back. */
const PHONE: Grid = ['.oooo.', 'opkppo', 'oppppo', 'oppPpo', 'opppPo', 'oppppo', '.oooo.'];

/** The order clothes go on, over the body, face and tattoos and under the hair. */
const WORN_ORDER: readonly Slot[] = [
  'tights',
  'bottom',
  'top',
  'outer',
  'shoes',
  'necklace',
  'gloves',
];

/**
 * What hangs in front of her legs: skirts, dresses and the opera coat's tails. A cape hangs behind
 * her but from behind, where it falls over her.
 */
const HEMS: readonly CutId[] = [
  'sundress',
  'collarDress',
  'pleatedSkirt',
  'skaterSkirt',
  'tulleSkirt',
  'gown',
  'velvetDress',
  'wings',
  'operaCoat',
];

export function hangsOver(cut: CutId, view: View): boolean {
  return HEMS.includes(cut) || (cut === 'cape' && view === 'back');
}

/**
 * Where her shoes go among what she wears (decision 220): just under the first hem that hangs over
 * her legs, which hides a boot's shaft as it hides her shin, or in their own place if nothing does.
 * Either way they stay over her tights and trousers, which are on before any hem.
 */
function shoesLayer(worn: readonly Worn[], view: View): number {
  const own = WORN_ORDER.indexOf('shoes');
  const hems = worn.filter((w) => hangsOver(OUTFITS[w.id].cut, view)).map((w) => placeOf(w));
  return Math.min(own, ...hems.map((at) => at - 0.25));
}

/** A piece's place in `WORN_ORDER`; overalls go on just after the top, over it. */
function placeOf(w: Worn): number {
  const row = OUTFITS[w.id];
  return WORN_ORDER.indexOf(row.slot) + (BIBS.includes(row.cut) ? 1.5 : 0);
}

/** Where a piece goes among the rest she wears, from that view. */
function layerOf(w: Worn, worn: readonly Worn[], view: View): number {
  return OUTFITS[w.id].slot === 'shoes' ? shoesLayer(worn, view) : placeOf(w);
}

/**
 * Clothes listed in the order they're drawn, with any shoes after the first hem moved to just under
 * it, as hers are (decision 220): for a neighbour, whose clothes are listed by hand.
 */
export function shoesUnderHems<T>(pieces: readonly T[], wornOf: (p: T) => Worn, view: View): T[] {
  const hem = pieces.findIndex((p) => hangsOver(OUTFITS[wornOf(p).id].cut, view));
  if (hem < 0) return [...pieces];
  const shoe = (p: T) => OUTFITS[wornOf(p).id].slot === 'shoes';
  const after = pieces.slice(hem);
  return [...pieces.slice(0, hem), ...after.filter(shoe), ...after.filter((p) => !shoe(p))];
}

/** What goes in front of her hair with her arms raised: her sleeves, and her gloves. */
export function onRaisedArms(w: Worn): boolean {
  const { slot, cut } = OUTFITS[w.id];
  return slot === 'top' || slot === 'gloves' || (slot === 'outer' && JACKETS.includes(cut));
}

/**
 * Her, in layers, bottom first: body, face, tattoos, tights, bottom, top or dress (overalls over
 * it), a jacket or cape, shoes (under any hem), necklace, gloves, her phone, hair, gauges, hat,
 * glasses, then her arms if they're raised in front of her hair. Gauges go over the hair so they
 * peek out of any style, and a dress hides the bottom it covers. A pose faces the front, whatever
 * `facing` says.
 */
export function dollLayers(
  look: Look,
  facing: Facing,
  frame: number,
  pose?: Pose,
  rest: Rest = {},
): Layer[] {
  if (pose === 'sit') return seated(dollLayers(look, facing === 'up' ? 'up' : 'down', 0));
  const acting = isAction(pose);
  const turned = pose && !acting ? 'down' : facing;
  const view = viewOf(turned);
  const { body, over } = isAction(pose)
    ? ACTION_BODY[pose][view][frame % ACTION_FRAMES[pose]]!
    : pose
      ? POSE_BODY[pose]
      : { body: BODY[view][frame % DOLL_FRAMES]!, over: null };
  const drop = pose === 'bang' ? BANG_DROP : 0;
  const skin = SKIN_TONES[look.skin];
  const layers: Layer[] = [];
  const add = (rows: readonly string[], palette: Palette) =>
    layers.push({ source: { rows }, palette });
  const onHead = (rows: readonly string[]) => lower(rows, drop);

  const dressed = OUTFITS[look.outfit.top?.id ?? 'cozyTee'].dress === true;
  const on = WORN_ORDER.flatMap((slot) => {
    const w = look.outfit[slot];
    return w && !(slot === 'bottom' && dressed) ? [w] : [];
  });
  const worn = [...on].sort((a, b) => layerOf(a, on, view) - layerOf(b, on, view));
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
  // Over her sleeves and gloves, so they're always seen.
  const bracelets = (part: Grid) => {
    if (look.wrist.length === 0) return;
    const rows = wristRows(look.wrist, body, turned);
    add(
      part === body
        ? rows
        : rows.map((line, r) =>
            [...line].map((ch, c) => (part[r]?.[c] === CLEAR ? CLEAR : ch)).join(''),
          ),
      wristPalette(look.wrist),
    );
  };

  const backs = (part: 'behind' | 'over') => {
    for (const w of worn) {
      const rows = backRows(w, view, body, part);
      if (rows) add(rows, wornPalette(w));
    }
  };

  backs('behind');
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
              : pose === 'holdUp'
                ? 'rock'
                : !pose && rest.blink
                  ? 'blink'
                  : 'open';
    const touches = { ...look, lashes: true };
    // How she feels about a moment shows on her face as usual, but never over a pose's own face
    // or her find held up (V1's L7).
    const feels = rest.feel && (mood === 'open' || mood === 'blink') && pose !== 'holdUp';
    const face = feels ? faceRows(view, rest.feel!, touches, rest.blink === true && !pose) : null;
    add(onHead(face ?? faceRows(view, mood, touches)), facePalette(EYE_COLOURS[look.eyes], skin));
  }
  for (const w of worn) add(pieceRows(w, view, body), wornPalette(w));
  bracelets(body);
  if (pose === 'phone') {
    add(stamp(EMPTY, PHONE, 25, 13), { '.': null, o: C.ink, p: C.roseLight, P: C.rose, k: C.ink });
  }

  // Her head is measured against her standing body, then moved with it as it bangs.
  const still = acting ? BODY[view][0]! : pose ? FRONT_BODY[0]! : body;
  const hair = hairRows(HAIR[look.hairStyle], turned, still);
  add(onHead(hair), hairPalette(hairTones(look.hairColour, look.splitColour)));
  backs('over');
  if (look.gauges && view !== 'back') {
    add(onHead(gaugeRows(view)), { '.': null, k: C.silver, K: C.iron });
  }
  for (const slot of ['hat', 'glasses'] as const) {
    const w = look.outfit[slot];
    if (w) add(onHead(pieceRows(w, view, still)), wornPalette(w));
  }
  if (over) {
    dress(over, worn.filter(onRaisedArms));
    bracelets(over);
  }
  const whole = raised(layers);
  if (pose === 'crouch') return folded(whole, CROUCH_FROM, CROUCH_DROP);
  return !pose && rest.out ? folded(whole, BREATH_FROM, 1) : whole;
}

/** Standing still as usual (V1's E2): breathing out, and blinking; and how she feels (V1's L7). */
export interface Rest {
  out?: boolean;
  blink?: boolean;
  feel?: Feeling;
}

/** Names a look's picture for the bake cache. The name she typed doesn't change how she looks. */
export function dollKey(
  look: Look,
  facing: Facing,
  frame: number,
  pose?: Pose,
  rest: Rest = {},
): string {
  const slots = [
    'top',
    'bottom',
    'shoes',
    'hat',
    'necklace',
    'glasses',
    'gloves',
    'outer',
    'tights',
  ] as const;
  const worn = slots
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
    look.wrist.join('+'),
  ];
  const at =
    pose === 'sit'
      ? `pose:sit:${facing === 'up' ? 'up' : 'down'}`
      : isAction(pose)
        ? `act:${pose}:${facing}:${frame % ACTION_FRAMES[pose]}`
        : pose
          ? `pose:${pose}`
          : `${facing}:${frame % DOLL_FRAMES}${rest.out ? ':out' : ''}${rest.blink ? ':blink' : ''}`;
  const feel = rest.feel ? `:feel:${rest.feel}` : '';
  return `doll:${at}${feel}:${body.join(',')}:${worn}`;
}
