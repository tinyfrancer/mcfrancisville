import {
  ACCENT,
  ACCENT_TWO,
  buildingPalette,
  darkOf,
  fillOf,
  finish,
  GLASS,
  GLASS_DARK,
  GLINT,
  LEAVES,
  letters,
  lightOf,
  ROOF,
  shadeOf,
  STONE,
  TRIM,
  WHITE,
} from './buildings';
import { FIRE, FIRE_LIGHT, slab } from './furnish';
import { PALETTE as C, ramp } from './palette';
import { Sketch } from './sketch';
import type { Palette, SpriteSource } from './sprite';

/*
 * The town's small things, redrawn at 32 in phase L in the building kit's materials: the
 * jack-o'-lanterns, the lamps, the gravestones, the iron fence, the well and her mailbox. They were
 * the last of version 0's art in the world.
 */

// ---- Jack-o'-lanterns ------------------------------------------------------------------------------

/** The faces a jack-o'-lantern can wear, each a few carved shapes: eyes, a nose, a grin. */
type Face = (s: Sketch) => void;

const FACES: readonly Face[] = [
  // Round eyes and a wide, toothy grin.
  (s) => {
    s.ellipse(11, 18, 2, 2, FIRE).ellipse(21, 18, 2, 2, FIRE);
    s.rect(9, 23, 14, 2, FIRE).rect(10, 25, 12, 1, FIRE);
    s.set(13, 23, fillOf(ACCENT)).set(18, 23, fillOf(ACCENT));
    s.set(10, 18, FIRE_LIGHT).set(20, 18, FIRE_LIGHT);
  },
  // Triangle eyes, a little nose, and a smile.
  (s) => {
    for (const x of [9, 19])
      s.rect(x, 19, 5, 1, FIRE)
        .rect(x + 1, 18, 3, 1, FIRE)
        .set(x + 2, 17, FIRE);
    s.set(16, 21, FIRE);
    s.rect(10, 23, 12, 1, FIRE).rect(11, 24, 10, 1, FIRE).rect(13, 25, 6, 1, FIRE);
    s.set(9, 22, FIRE).set(22, 22, FIRE);
    s.set(11, 19, FIRE_LIGHT).set(21, 19, FIRE_LIGHT);
  },
  // Sleepy crescent eyes and a small round "o".
  (s) => {
    for (const x of [9, 19])
      s.rect(x, 19, 4, 1, FIRE)
        .set(x - 1, 18, FIRE)
        .set(x + 4, 18, FIRE);
    s.ellipse(16, 24, 2, 2, FIRE).set(16, 24, FIRE_LIGHT);
  },
];

/**
 * A jack-o'-lantern: a squat pumpkin of three lobes, lit from the top left, with a curly stem and
 * a leaf, and a face carved in it that glows after dark. Each wears one of `FACES`.
 */
function pumpkin(face: Face): SpriteSource {
  const s = new Sketch(32, 32);
  s.sphere(9, 21, 7, 8, 'KaA');
  s.sphere(23, 21, 7, 8, 'KaA');
  s.sphere(16, 21, 9, 9, 'KaAl');
  // The grooves between the lobes.
  for (let y = 15; y < 29; y++) {
    if (y > 16 && y < 28) s.set(11, y, shadeOf(ACCENT)).set(20, y, shadeOf(ACCENT));
  }
  slab(s, 15, 8, 3, 6, TRIM);
  s.set(18, 8, fillOf(TRIM)).set(19, 7, fillOf(TRIM));
  s.ellipse(21, 11, 3, 1.5, fillOf(LEAVES)).set(20, 10, lightOf(LEAVES));
  face(s);
  return finish(s);
}

export const PUMPKIN_FORMS: readonly SpriteSource[] = FACES.map(pumpkin);

export const PUMPKIN_PALETTE: Palette = {
  ...buildingPalette({
    wall: C.cream,
    roof: C.plum,
    trim: C.moss,
    door: C.berry,
    accent: C.pumpkin,
    leaves: C.leaf,
  }),
  [FIRE]: C.pumpkinDark,
  [FIRE_LIGHT]: ramp(C.pumpkinDark)[1]!,
};

/** A lantern's carved face after dark: candlelit, brightest in the middle. */
export const PUMPKIN_LIT: Palette = { [FIRE]: C.candle, [FIRE_LIGHT]: C.candleBright };

// ---- Lamps ------------------------------------------------------------------------------------

/**
 * A street lamp: an iron post on a stepped foot, a curl of iron under a lantern of four panes with
 * a little peaked cap and a finial, the panes candlelit after dark.
 */
function drawLamp(): SpriteSource {
  const s = new Sketch(32, 64);
  // The foot and the post.
  slab(s, 10, 58, 12, 5, TRIM);
  slab(s, 12, 54, 8, 5, TRIM);
  s.rect(14, 22, 4, 33, fillOf(TRIM)).rect(14, 22, 1, 33, lightOf(TRIM));
  s.rect(17, 22, 1, 33, shadeOf(TRIM));
  s.rect(13, 40, 6, 2, fillOf(TRIM)).rect(13, 40, 6, 1, lightOf(TRIM));
  // Scrolls under the lantern.
  s.line(13, 25, 10, 22, fillOf(TRIM)).set(9, 21, fillOf(TRIM)).set(9, 20, lightOf(TRIM));
  s.line(18, 25, 21, 22, fillOf(TRIM)).set(22, 21, fillOf(TRIM)).set(22, 20, lightOf(TRIM));
  // The lantern: a cage of iron round glass panes, a cap and a finial.
  s.rect(10, 9, 12, 12, fillOf(TRIM));
  s.rect(11, 10, 4, 10, GLASS).rect(17, 10, 4, 10, GLASS);
  s.set(11, 10, GLINT).set(17, 10, GLINT);
  s.rect(9, 20, 14, 2, fillOf(TRIM)).rect(9, 20, 14, 1, lightOf(TRIM));
  for (let j = 0; j < 4; j++)
    s.rect(9 + j, 8 - j, 14 - 2 * j, 1, j === 0 ? shadeOf(TRIM) : fillOf(TRIM));
  s.rect(10, 5, 1, 1, lightOf(TRIM)).rect(15, 2, 2, 3, fillOf(TRIM)).set(15, 2, lightOf(TRIM));
  s.set(15, 1, lightOf(TRIM)).set(16, 1, fillOf(TRIM));
  return finish(s);
}

export const LAMP_POST: SpriteSource = drawLamp();

export const LAMP_PALETTE: Palette = buildingPalette({
  wall: C.cream,
  roof: C.plum,
  trim: C.iron,
  door: C.berry,
  glass: C.dusk,
});

// ---- Gravestones ------------------------------------------------------------------------------

/**
 * A gravestone, rounded, with moss at its foot. The graveyard garden is a gentle place: the stones
 * are carved with a heart, a little ghost or RIP, and a flower grows by some.
 */
function gravestone(form: number): SpriteSource {
  const s = new Sketch(32, 32);
  const top = form === 1 ? 7 : 5;
  if (form === 1) {
    // A cross, short and rounded.
    slab(s, 13, 3, 6, 25, STONE);
    slab(s, 7, 9, 18, 6, STONE);
    s.rect(14, 4, 4, 1, lightOf(STONE));
  } else {
    s.ellipse(16, top + 7, 9, 7, fillOf(STONE)).rect(7, top + 7, 18, 28 - top - 7, fillOf(STONE));
    s.bevel(fillOf(STONE), lightOf(STONE), shadeOf(STONE));
  }
  // The plinth it stands in.
  slab(s, 5, 26, 22, 4, STONE);
  s.rect(6, 26, 20, 1, darkOf(STONE));
  const carve = darkOf(STONE);
  if (form === 0) {
    letters(s, 'RIP', 11, 12, carve);
  } else if (form === 2) {
    // A heart.
    s.rect(12, 13, 3, 2, carve).rect(17, 13, 3, 2, carve).rect(12, 15, 8, 2, carve);
    s.rect(13, 17, 6, 1, carve).rect(14, 18, 4, 1, carve).rect(15, 19, 2, 1, carve);
  } else if (form === 3) {
    // A little ghost, waving.
    s.ellipse(16, 15, 3.5, 3.5, carve).rect(13, 15, 7, 5, carve);
    s.set(13, 20, carve).set(15, 20, carve).set(17, 20, carve).set(19, 20, carve);
    s.set(15, 14, fillOf(STONE)).set(17, 14, fillOf(STONE)).set(20, 16, carve);
  }
  // Moss creeping up its foot, and on some a flower.
  s.rect(6, 25, 4, 1, fillOf(LEAVES)).rect(7, 24, 2, 1, lightOf(LEAVES));
  s.rect(22, 25, 3, 1, fillOf(LEAVES));
  if (form !== 1)
    s.set(25, 22, fillOf(ACCENT_TWO)).set(25, 23, fillOf(LEAVES)).set(26, 24, fillOf(LEAVES));
  return finish(s);
}

export const GRAVESTONE_FORMS: readonly SpriteSource[] = [0, 1, 2, 3].map(gravestone);

export const GRAVESTONE_PALETTE: Palette = buildingPalette({
  wall: C.cream,
  roof: C.plum,
  trim: C.bark,
  door: C.berry,
  stone: C.stone,
  accentTwo: C.lavender,
  leaves: C.moss,
});

/** Some stones are older, and darker. */
export const GRAVESTONE_VARIANTS: readonly Palette[] = [
  GRAVESTONE_PALETTE,
  {
    ...GRAVESTONE_PALETTE,
    ...buildingPalette({
      wall: C.cream,
      roof: C.plum,
      trim: C.bark,
      door: C.berry,
      stone: C.stoneDark,
      accentTwo: C.roseLight,
      leaves: C.moss,
    }),
  },
];

// ---- The iron fence ---------------------------------------------------------------------------

/** An iron picket two pixels wide from `top` to `bottom`, with a spear tip above it. */
function picket(s: Sketch, x: number, top: number, bottom: number): void {
  s.rect(x, top, 2, bottom - top, fillOf(TRIM)).rect(x, top, 1, bottom - top, lightOf(TRIM));
  s.rect(x - 1, top - 1, 4, 1, fillOf(TRIM)).rect(x, top - 2, 2, 1, fillOf(TRIM));
  s.set(x, top - 3, lightOf(TRIM));
}

/** A rail across, from `x0` to `x1`, lit along its top. */
function rail(s: Sketch, x0: number, x1: number, y: number): void {
  s.rect(x0, y, x1 - x0, 2, fillOf(TRIM)).rect(x0, y, x1 - x0, 1, lightOf(TRIM));
}

/**
 * A stretch of iron fence, joined to the fence on whichever sides `joins` says (1 up, 2 right,
 * 4 down, 8 left), as the ground is (0.2's K1). Across the screen it is pickets with spear tips
 * on two rails; up the screen it is seen end on, a rail along the ground with a picket on each
 * tile. Where a run ends or turns a corner it stands on a stout post with a ball on top.
 */
function fence(joins: number): SpriteSource {
  const s = new Sketch(32, 32);
  const up = (joins & 1) !== 0;
  const right = (joins & 2) !== 0;
  const down = (joins & 4) !== 0;
  const left = (joins & 8) !== 0;
  const across = joins === 10;
  const along = joins === 5;
  // The run up the screen, end on.
  if (up || down) {
    const top = up ? 0 : 16;
    const bottom = down ? 32 : 17;
    s.rect(15, top, 2, bottom - top, shadeOf(TRIM)).rect(15, top, 1, bottom - top, fillOf(TRIM));
  }
  if (along) {
    picket(s, 15, 8, 32);
    s.rect(13, 14, 6, 2, fillOf(TRIM)).rect(13, 14, 6, 1, lightOf(TRIM));
    s.rect(13, 25, 6, 2, fillOf(TRIM)).rect(13, 25, 6, 1, lightOf(TRIM));
    return finish(s);
  }
  // The run across.
  const x0 = left ? 0 : 16;
  const x1 = right ? 32 : 16;
  if (x1 > x0) {
    rail(s, x0, x1, 12);
    rail(s, x0, x1, 24);
  }
  const pickets = across ? [3, 11, 19, 27] : [...(left ? [3, 9] : []), ...(right ? [21, 27] : [])];
  for (const x of pickets) picket(s, x, 7, 30);
  if (across) return finish(s);
  // The post at an end or a corner.
  slab(s, 13, 7, 6, 24, TRIM);
  s.rect(12, 7, 8, 2, fillOf(TRIM)).rect(12, 7, 8, 1, lightOf(TRIM));
  s.ellipse(16, 4, 2.5, 2.5, fillOf(TRIM)).set(15, 3, lightOf(TRIM)).set(15, 2, lightOf(TRIM));
  return finish(s);
}

/** Every way a fence can join its neighbours, by `joins`. */
export const FENCE_JOINS: readonly SpriteSource[] = Array.from({ length: 16 }, (_, j) => fence(j));
export const FENCE: SpriteSource = FENCE_JOINS[10]!;
export const FENCE_POST: SpriteSource = FENCE_JOINS[5]!;
export const FENCE_PALETTE: Palette = LAMP_PALETTE;

// ---- The well ---------------------------------------------------------------------------------

/**
 * The wishing well in the square, two tiles across: a round wall of stone blocks with dark water
 * inside, two posts holding a little shingled roof, and a bucket on a rope from the winch.
 */
function drawWell(): SpriteSource {
  const s = new Sketch(64, 72);
  // The posts, behind the rim.
  for (const x of [10, 50]) slab(s, x, 16, 5, 34, TRIM);
  // The winch across them, the rope and the bucket.
  s.rect(14, 24, 37, 3, fillOf(TRIM)).rect(14, 24, 37, 1, lightOf(TRIM));
  s.rect(51, 23, 3, 5, darkOf(TRIM)).rect(54, 26, 4, 2, fillOf(TRIM));
  s.rect(31, 27, 2, 12, fillOf(ACCENT_TWO))
    .set(31, 30, lightOf(ACCENT_TWO))
    .set(32, 34, lightOf(ACCENT_TWO));
  slab(s, 27, 38, 10, 7, ACCENT);
  s.rect(27, 40, 10, 1, darkOf(ACCENT)).rect(28, 37, 8, 1, darkOf(TRIM));
  // The roof.
  for (let j = 0; j < 14; j++) {
    const inset = Math.floor((13 - j) * 1.4);
    s.rect(2 + inset, 4 + j, 60 - 2 * inset, 1, fillOf(ROOF));
  }
  for (let y = 7; y < 18; y += 3) {
    for (let x = 0; x < 64; x++) if (s.get(x, y) === fillOf(ROOF)) s.set(x, y, shadeOf(ROOF));
  }
  s.bevel(fillOf(ROOF) + shadeOf(ROOF), lightOf(ROOF), darkOf(ROOF));
  s.rect(1, 17, 62, 2, darkOf(ROOF));
  // The rim: water in an ellipse, then the stone wall in front of it.
  s.ellipse(32, 48, 26, 7, fillOf(STONE));
  s.ellipse(32, 48, 22, 5, GLASS);
  s.ellipse(32, 49, 20, 3.5, GLASS_DARK);
  s.rect(40, 47, 6, 1, GLINT).rect(20, 49, 4, 1, GLINT);
  s.rect(6, 48, 52, 1, lightOf(STONE));
  s.rect(6, 49, 52, 20, fillOf(STONE));
  for (let row = 0; row < 4; row++) {
    const y = 49 + row * 5;
    s.rect(6, y + 4, 52, 1, darkOf(STONE));
    for (let x = 12 + (row % 2) * 6; x < 58; x += 12) s.rect(x, y, 1, 4, darkOf(STONE));
  }
  s.rect(6, 49, 1, 20, lightOf(STONE)).rect(57, 49, 1, 20, shadeOf(STONE));
  for (let x = 6; x < 58; x++) s.set(x, 69, shadeOf(STONE)).set(x, 70, shadeOf(STONE));
  return finish(s);
}

export const WELL: SpriteSource = drawWell();

export const WELL_PALETTE: Palette = {
  ...buildingPalette({
    wall: C.cream,
    roof: C.berry,
    trim: C.bark,
    door: C.berry,
    stone: C.stone,
    accent: C.wood,
    accentTwo: C.rope,
    glass: C.water,
  }),
};

// ---- Her mailbox ------------------------------------------------------------------------------

/**
 * Her mailbox by her door: a round-topped blue box on a wooden post, a little heart on its side, and
 * a red flag on its side that goes up when a letter is waiting.
 */
function drawMailbox(full: boolean): SpriteSource {
  const s = new Sketch(32, 40);
  slab(s, 14, 22, 5, 17, TRIM);
  s.rect(12, 37, 9, 2, darkOf(TRIM));
  // The box: a rounded top on a rectangle, its door on the front.
  s.ellipse(16, 12, 11, 6, fillOf(ACCENT)).rect(5, 12, 22, 10, fillOf(ACCENT));
  s.bevel(fillOf(ACCENT), lightOf(ACCENT), shadeOf(ACCENT));
  s.rect(7, 11, 10, 9, shadeOf(ACCENT)).rect(8, 12, 8, 7, fillOf(ACCENT));
  s.rect(11, 15, 3, 1, WHITE);
  // A little heart on its side.
  s.rect(19, 13, 2, 1, fillOf(ACCENT_TWO)).rect(22, 13, 2, 1, fillOf(ACCENT_TWO));
  s.rect(19, 14, 5, 1, fillOf(ACCENT_TWO)).rect(20, 15, 3, 1, fillOf(ACCENT_TWO));
  s.set(21, 16, fillOf(ACCENT_TWO));
  if (full) {
    s.rect(27, 4, 2, 14, darkOf(TRIM));
    s.rect(28, 4, 3, 5, fillOf(ACCENT_TWO)).set(28, 4, lightOf(ACCENT_TWO));
  } else {
    s.rect(27, 15, 4, 2, darkOf(TRIM)).rect(28, 13, 3, 2, fillOf(ACCENT_TWO));
  }
  return finish(s);
}

export const MAILBOX: SpriteSource = drawMailbox(false);
export const MAILBOX_FULL: SpriteSource = drawMailbox(true);

export const MAILBOX_PALETTE: Palette = buildingPalette({
  wall: C.cream,
  roof: C.plum,
  trim: C.wood,
  door: C.berry,
  accent: C.blueFabric,
  accentTwo: C.scarlet,
});
