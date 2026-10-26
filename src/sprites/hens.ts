import type { HenItemId, HenLook } from '../data/hens';
import { mix, PALETTE as C, ramp } from './palette';
import { Sketch } from './sketch';
import type { Palette, SpriteSource } from './sprite';

/*
 * The hens at Boo Acres (1.6's X3, decision 382), side on and facing right (the view flips them to
 * face left), small beside her as a pet is: a hen comes up to her knee, the rooster a little
 * higher. Each has a pair of walking frames, a pair of pecking frames, a sit, and the rooster his
 * crow. Their plumage is `f` lit to `l` and shaded to `s`, a wing `m`, tail `t`/`T`, speckles
 * `x`, the rooster's gold hackles `h`; a red comb and wattle `c`, a beak `b`, legs `k`, an eye `e`.
 * And the eggs and what's made from them, 16-pixel icons like every item's (decision 105).
 */

export type HenFrame = 'walk0' | 'walk1' | 'peck0' | 'peck1' | 'sit' | 'crow';

export const HEN_FRAMES: readonly HenFrame[] = ['walk0', 'walk1', 'peck0', 'peck1', 'sit', 'crow'];

/** The keys that are plumage, lit and outlined as one. */
const PLUMAGE = 'flsmtTxh';

/** Where the head goes for a frame: up, halfway down, at the ground, or thrown back to crow. */
interface Pose {
  head: [number, number];
  legs: readonly number[] | null;
  /** How far the body sits down. */
  drop: number;
}

function poseOf(frame: HenFrame, rooster: boolean): Pose {
  const r = rooster ? 1 : 0;
  switch (frame) {
    case 'walk0':
      return { head: [16 + r, 6 - r], legs: [9, 12 + r], drop: 0 };
    case 'walk1':
      return { head: [16.5 + r, 6.5 - r], legs: [8, 13 + r], drop: 0 };
    case 'peck0':
      return { head: [17 + r, 10.5], legs: [9, 12 + r], drop: 0 };
    case 'peck1':
      return { head: [17.5 + r, 13.5], legs: [9, 12 + r], drop: 0 };
    case 'sit':
      return { head: [15.5 + r, 9 - r], legs: null, drop: 4 };
    case 'crow':
      return { head: [15 + r, 4 - r], legs: [9, 12 + r], drop: 0 };
  }
}

/** A leg down to the ground, with its toes spread forward and back. */
function leg(s: Sketch, x: number, top: number, ground: number): void {
  s.rect(x, top, 1, ground - top, 'k');
  s.rect(x - 1, ground, 3, 1, 'k');
}

/** The head at (cx, cy): its comb, an eye, the beak pointing on and the wattle under it. */
function head(s: Sketch, cx: number, cy: number, rooster: boolean, frame: HenFrame): void {
  s.ellipse(cx, cy, rooster ? 3.2 : 2.8, rooster ? 3.2 : 2.8, rooster ? 'h' : 'f');
  const x = Math.floor(cx);
  const y = Math.floor(cy);
  // The comb: three soft points on the rooster, a little crinkle on a hen.
  if (rooster) {
    s.rect(x - 2, y - 4, 5, 2, 'c')
      .set(x - 2, y - 5, 'c')
      .set(x, y - 6, 'c')
      .set(x, y - 5, 'c');
    s.set(x + 2, y - 5, 'c');
  } else {
    s.rect(x - 1, y - 3, 3, 1, 'c').set(x, y - 4, 'c');
  }
  // The rooster's bare red face round his eye, under the gold of his hackles.
  if (rooster) s.rect(x, y - 1, 3, 3, 'c');
  s.set(x + 1, y - 1, 'e');
  if (frame === 'crow') {
    // Beak open to the sky.
    s.set(x + 3, y - 2, 'b')
      .set(x + 4, y - 3, 'b')
      .set(x + 3, y, 'b')
      .set(x + 4, y, 'b');
  } else if (frame === 'peck0' || frame === 'peck1') {
    s.set(x + 3, y, 'b')
      .set(x + 3, y + 1, 'b')
      .set(x + 4, y + 1, 'b');
  } else {
    s.set(x + 3, y - 1, 'b')
      .set(x + 4, y, 'b')
      .set(x + 3, y, 'b');
  }
  s.set(x + 2, y + 2, 'c').set(x + 2, y + 3, 'c');
  if (rooster) s.set(x + 1, y + 3, 'c').set(x + 1, y + 4, 'c');
}

/**
 * A hen or the rooster in one frame: a round body, its tail up behind, the wing folded on its
 * side, the head on a neck that stoops to peck, and two thin legs.
 */
function drawHen(frame: HenFrame, look: HenLook): SpriteSource {
  const rooster = look === 'rooster';
  const s = new Sketch(rooster ? 24 : 22, rooster ? 24 : 20);
  const ground = s.height - 2;
  const pose = poseOf(frame, rooster);
  const bodyY = ground - (rooster ? 9 : 7.5) + pose.drop;
  if (pose.legs) for (const x of pose.legs) leg(s, x, Math.floor(bodyY) + 3, ground);
  // The tail: a hen's short tuft, the rooster's tall sickle feathers arching over.
  if (rooster) {
    for (let i = 0; i < 9; i++) {
      s.rect(2 + Math.round(i * 0.4), Math.floor(bodyY) - 9 + i, 3, 1, i % 3 === 0 ? 'T' : 't');
    }
    s.rect(1, Math.floor(bodyY) - 8, 2, 4, 't').rect(0, Math.floor(bodyY) - 6, 1, 3, 't');
    s.rect(5, Math.floor(bodyY) - 6, 2, 5, 'T');
  } else {
    s.rect(3, Math.floor(bodyY) - 4, 3, 5, 't').rect(2, Math.floor(bodyY) - 3, 1, 3, 't');
  }
  s.ellipse(10, bodyY, rooster ? 7.5 : 7, rooster ? 5 : 4.5, 'f');
  // The neck up to the head, then the head over it.
  const [hx, hy] = pose.head;
  const nx = Math.floor(hx) - 1;
  for (let y = Math.floor(hy); y <= Math.floor(bodyY); y++)
    s.rect(nx - 1, y, 3, 1, rooster ? 'h' : 'f');
  head(s, hx, hy, rooster, frame);
  // The folded wing, darker, with its tip toward the tail.
  s.ellipse(9, bodyY + 0.5, 4, 2.5, 'm');
  s.rect(6, Math.floor(bodyY) + 2, 3, 1, 's');
  if (look === 'speckled') {
    for (let y = 0; y < s.height; y++) {
      for (let x = 0; x < s.width; x++) {
        const key = s.get(x, y);
        if ((key === 'f' || key === 'm') && ((x * 7 + y * 13) ^ (x * y)) % 9 === 0) {
          s.set(x, y, 'x');
        }
      }
    }
  }
  s.bevel('f', 'l', 's');
  // Thin legs, left unoutlined so they stay thin; the beak and comb in their own darks.
  s.outline((key) => (PLUMAGE.includes(key) ? 'o' : key === 'c' ? 'C' : key === 'b' ? 'K' : null));
  return s.toSource();
}

/** A hen's colours: her plumage's ramp, her wing a step down, and the comb, beak and legs. */
function henPalette(base: string, extra: Partial<Record<string, string>> = {}): Palette {
  const r = ramp(base);
  return {
    '.': null,
    o: r[0],
    s: r[1],
    m: r[1],
    f: r[2],
    l: r[3],
    t: r[1],
    T: r[2],
    x: C.cream,
    h: r[3],
    c: C.scarlet,
    C: C.scarletShade,
    b: C.gold,
    k: C.goldShade,
    K: mix(C.goldShade, C.bark, 0.5),
    e: C.ink,
    ...extra,
  };
}

/** Each look's colours: Henrietta's speckled brown, Peck's green-glossed black, Omelette's buff. */
export const HEN_PALETTES: Record<HenLook, Palette> = {
  speckled: henPalette(mix(C.wood, C.pumpkinDark, 0.4)),
  black: henPalette(C.hairBlack, { l: C.tealShade, T: C.tealShade, m: C.inkFabric }),
  buff: henPalette(mix(C.gold, C.cream, 0.3)),
  rooster: henPalette(mix(C.hairAuburn, C.scarletShade, 0.3), {
    h: C.gold,
    t: C.canopyDark,
    T: C.tealShade,
    m: ramp(C.hairAuburn)[1]!,
  }),
};

/** Every look's frames, drawn once. */
export const HEN_ART: Record<HenLook, Record<HenFrame, SpriteSource>> = Object.fromEntries(
  (['speckled', 'black', 'buff', 'rooster'] as const).map((look) => [
    look,
    Object.fromEntries(HEN_FRAMES.map((frame) => [frame, drawHen(frame, look)])),
  ]),
) as Record<HenLook, Record<HenFrame, SpriteSource>>;

// ---- In her bag -------------------------------------------------------------------------------

/** An egg, brown and lit from the top left. */
function egg(): SpriteSource {
  const s = new Sketch(16, 16);
  s.sphere(8, 8.5, 4.5, 5.5, 'drRW');
  s.outline(() => 'o');
  return s.toSource();
}

/** The custard tart: a fluted crust round a wobbly golden top, a ghost of nutmeg on it. */
function custardTart(): SpriteSource {
  const s = new Sketch(16, 16);
  s.ellipse(8, 10, 7, 4, 'c');
  for (let x = 1; x < 15; x += 2) s.set(x, 12, 'C').set(x + 1, 13, 'C');
  s.ellipse(8, 8.5, 5.5, 2.8, 'y');
  s.rect(5, 7, 3, 1, 'Y').set(4, 8, 'Y');
  s.set(8, 8, 'n').set(9, 8, 'n').set(8, 9, 'n').set(9, 9, 'n').set(10, 9, 'n');
  s.outline(() => 'o');
  return s.toSource();
}

/** The frittata in its skillet: golden egg flecked with green and red, the handle off to the right. */
function frittata(): SpriteSource {
  const s = new Sketch(16, 16);
  s.rect(12, 9, 3, 2, 'i');
  s.ellipse(7, 10, 6, 4, 'i');
  s.ellipse(7, 9.5, 4.5, 2.6, 'y');
  s.rect(4, 8, 2, 1, 'Y');
  s.set(5, 10, 'g').set(8, 9, 'r').set(9, 11, 'g').set(6, 11, 'r').set(10, 9, 'g');
  s.rect(2, 13, 10, 1, 'I');
  s.outline(() => 'o');
  return s.toSource();
}

/** A meringue ghost: piped white to a curl on top, two chocolate-chip eyes. */
function meringueGhost(): SpriteSource {
  const s = new Sketch(16, 16);
  s.sphere(8, 10, 5, 4.5, 'sSwW');
  s.rect(7, 4, 3, 2, 'w').set(8, 3, 'W').set(9, 3, 'w').set(6, 5, 'w');
  for (const x of [4, 7, 10]) s.set(x, 14, 'S').set(x + 1, 14, 'S');
  s.set(6, 9, 'e').set(10, 9, 'e');
  s.outline((key) => (key === 'e' ? null : 'o'));
  return s.toSource();
}

const EGG_BROWN = ramp(mix(C.creamShade, C.pumpkinDark, 0.25));
const CUSTARD = ramp(C.gold);
const CRUST = ramp(mix(C.gold, C.wood, 0.45));

export const HEN_ITEM_ART: Record<HenItemId, { source: SpriteSource; palette: Palette }> = {
  egg: {
    source: egg(),
    palette: {
      '.': null,
      o: EGG_BROWN[0]!,
      d: EGG_BROWN[1]!,
      r: EGG_BROWN[2]!,
      R: EGG_BROWN[3]!,
      W: EGG_BROWN[4]!,
    },
  },
  custardTart: {
    source: custardTart(),
    palette: {
      '.': null,
      o: C.ink,
      c: CRUST[2]!,
      C: CRUST[1]!,
      y: CUSTARD[3]!,
      Y: CUSTARD[4]!,
      n: C.wood,
    },
  },
  frittata: {
    source: frittata(),
    palette: {
      '.': null,
      o: C.ink,
      i: C.iron,
      I: ramp(C.iron)[2]!,
      y: CUSTARD[3]!,
      Y: CUSTARD[4]!,
      g: C.leafLight,
      r: C.scarlet,
    },
  },
  meringueGhost: {
    source: meringueGhost(),
    palette: {
      '.': null,
      o: C.stoneDark,
      s: C.silverShade,
      S: C.silver,
      w: C.ghost,
      W: C.white,
      e: C.barkDark,
    },
  },
};
