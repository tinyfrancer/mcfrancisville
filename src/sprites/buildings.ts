import { mix, PALETTE as C, ramp } from './palette';
import { CLEAR, Sketch } from './sketch';
import type { Palette, SpriteSource } from './sprite';

/*
 * The town's buildings at 32 pixels a tile (phase G), each with an exterior of its own. They're
 * built from one kit of parts (walls, roofs, windows, doors, awnings, signs) painted in keys that
 * mean the same thing in every building, so a building is its shape and a palette, and its lit
 * windows are the same keys everywhere.
 */

/**
 * A material's five keys, darkest first: its outline, a dark line (mortar, a board's edge), its
 * shade, its fill and its light. Each is painted from its own ramp (`docs/art_style.md`).
 */
export type Material = string;

export const WALL: Material = 'qvwWV';
export const ROOF: Material = 'nmrRL';
export const TRIM: Material = 'uxfFh';
export const DOOR: Material = 'zZdDe';
export const STONE: Material = 'jJsSc';
/** Two accents a building can spend on a sign, an awning or its flowers. */
export const ACCENT: Material = 'kKaAl';
export const ACCENT_TWO: Material = 'tTpPy';
export const LEAVES: Material = 'QIbBH';

const outlineOf = (m: Material) => m[0]!;
const darkOf = (m: Material) => m[1]!;
const shadeOf = (m: Material) => m[2]!;
const fillOf = (m: Material) => m[3]!;
const lightOf = (m: Material) => m[4]!;

/** Window glass by day, the dark just under its frame, and the glint in its top corner. */
const GLASS = 'g';
const GLASS_DARK = 'i';
const GLINT = 'G';
/** Lamps and door knobs: brass by day, lit after dark. */
const LAMP = 'Y';
/** Ink, for the few things drawn in it (a bat, an eye). Never outlined. */
const INK = 'o';
/** Something white that stays white: a ghost, a sparkle, lettering. */
const WHITE = 'E';

/** Every material a building is painted in, by the colour each ramp is made from. */
export interface Colours {
  wall: string;
  roof: string;
  trim: string;
  door: string;
  stone?: string;
  accent?: string;
  accentTwo?: string;
  leaves?: string;
  /** The glass by day; a dusky plum unless the building wants another. */
  glass?: string;
}

/**
 * A material's five tones from its base colour: the ramp's outline and dark, a shade between the
 * dark and the base, the base itself as the fill, and the ramp's light.
 */
export function tonesOf(base: string): readonly string[] {
  const r = ramp(base);
  return [r[0], r[1], mix(r[1], r[2], 0.5), r[2], r[3]];
}

/** A building's palette: each material's ramp on its keys, and its glass, lamps and ink. */
export function buildingPalette(colours: Colours): Palette {
  const palette: Record<string, string | null> = { [CLEAR]: null };
  const paint = (m: Material, base: string) =>
    [...m].forEach((key, i) => (palette[key] = tonesOf(base)[i]!));
  paint(WALL, colours.wall);
  paint(ROOF, colours.roof);
  paint(TRIM, colours.trim);
  paint(DOOR, colours.door);
  paint(STONE, colours.stone ?? C.stone);
  paint(ACCENT, colours.accent ?? C.pumpkin);
  paint(ACCENT_TWO, colours.accentTwo ?? C.candle);
  paint(LEAVES, colours.leaves ?? C.leaf);
  const glass = colours.glass ?? C.dusk;
  palette[GLASS] = glass;
  palette[GLASS_DARK] = ramp(glass)[1]!;
  palette[GLINT] = ramp(glass)[4]!;
  palette[LAMP] = C.gold;
  palette[INK] = C.ink;
  palette[WHITE] = C.white;
  return palette;
}

/** After dark the windows are candlelit, brightest at the glint, and every lamp is lit. */
export const WINDOWS_LIT: Palette = {
  [GLASS]: C.candle,
  [GLASS_DARK]: ramp(C.candle)[1]!,
  [GLINT]: C.candleBright,
  [LAMP]: C.candleBright,
};

/** A small seeded random, so a drawing comes out the same every time. */
export function seeded(seed: number): () => number {
  let t = seed >>> 0;
  return () => {
    t = (t + 0x6d2b79f5) >>> 0;
    let r = Math.imul(t ^ (t >>> 15), 1 | t);
    r ^= r + Math.imul(r ^ (r >>> 7), 61 | r);
    return ((r ^ (r >>> 14)) >>> 0) / 4294967296;
  };
}

// ---- Walls ------------------------------------------------------------------------------------

export type WallStyle = 'boards' | 'plaster' | 'stone' | 'brick' | 'shingles' | 'logs';

/**
 * A stretch of wall, textured by its style: clapboard, rough plaster, stone blocks, brick,
 * scalloped shingles or logs. The texture is quiet (lines in the wall's own shade), so windows and
 * doors read over it. `inside` shapes it, for a wall that isn't a rectangle.
 */
export function wall(
  s: Sketch,
  x: number,
  y: number,
  w: number,
  h: number,
  style: WallStyle,
  m: Material = WALL,
  seed = 1,
  inside: (i: number, j: number) => boolean = () => true,
): void {
  const fill = fillOf(m);
  const shade = shadeOf(m);
  const dark = darkOf(m);
  const light = lightOf(m);
  const random = seeded(seed);
  const set = (i: number, j: number, key: string) => {
    if (i >= x && i < x + w && j >= y && j < y + h && inside(i, j)) s.set(i, j, key);
  };
  for (let j = y; j < y + h; j++) for (let i = x; i < x + w; i++) set(i, j, fill);
  if (style === 'boards') {
    for (let j = y + 5; j < y + h; j += 6) {
      for (let i = x; i < x + w; i++) set(i, j, shade);
    }
  } else if (style === 'plaster') {
    for (let n = 0; n < (w * h) / 90; n++) {
      const i = x + Math.floor(random() * w);
      const j = y + Math.floor(random() * h);
      set(i, j, shade);
      if (random() < 0.4) set(i + 1, j, shade);
    }
  } else if (style === 'stone' || style === 'brick') {
    const bw = style === 'stone' ? 12 : 8;
    const bh = style === 'stone' ? 7 : 4;
    for (let row = 0, j = y; j < y + h; row++, j += bh) {
      const offset = row % 2 === 0 ? 0 : Math.floor(bw / 2);
      for (let i = x; i < x + w; i++) set(i, j + bh - 1, dark);
      for (let i = x - offset; i < x + w; i += bw) {
        for (let k = 0; k < bh - 1; k++) set(i, j + k, dark);
        // Here and there a block a shade lighter or darker, so the wall isn't a pattern.
        const tint = random();
        if (tint < 0.2 || tint > 0.85) {
          for (let a = 1; a < bw; a++) {
            for (let b = 0; b < bh - 1; b++) set(i + a, j + b, tint < 0.2 ? shade : light);
          }
        } else if (style === 'stone') {
          for (let a = 1; a < bw - 1; a++) set(i + a, j, light);
        }
      }
    }
  } else if (style === 'shingles') {
    for (let row = 0, j = y; j < y + h; row++, j += 5) {
      const offset = row % 2 === 0 ? 0 : 3;
      for (let i = x - offset; i < x + w; i += 6) {
        set(i, j + 3, shade);
        set(i + 1, j + 4, shade);
        set(i + 2, j + 4, shade);
        set(i + 3, j + 4, shade);
        set(i + 4, j + 4, shade);
        set(i + 5, j + 3, shade);
      }
    }
  } else {
    for (let j = y; j < y + h; j += 7) {
      for (let i = x; i < x + w; i++) {
        set(i, j, light);
        set(i, j + 5, shade);
        set(i, j + 6, dark);
      }
    }
  }
}

/**
 * The light on a stretch of wall: its left edge catches the sun, its right edge falls into shade,
 * and under the eaves a band of shadow says the roof stands out over it.
 */
export function lightWall(
  s: Sketch,
  x: number,
  y: number,
  w: number,
  h: number,
  eaves = 4,
  m: Material = WALL,
): void {
  const inWall = (i: number, j: number) => m.includes(s.get(i, j) ?? CLEAR);
  for (let j = y; j < y + h; j++) {
    for (let i = x; i < x + w; i++) {
      if (!inWall(i, j)) continue;
      if (j < y + eaves) s.set(i, j, j === y ? darkOf(m) : shadeOf(m));
      else if (i >= x + w - 3) s.set(i, j, shadeOf(m));
      else if (i < x + 2) s.set(i, j, lightOf(m));
    }
  }
}

/** A band of stone along the foot of a wall. */
export function footing(s: Sketch, x: number, y: number, w: number, h: number): void {
  wall(s, x, y, w, h, 'stone', STONE, 7);
  for (let i = x; i < x + w; i++) s.set(i, y, lightOf(STONE));
}

// ---- Roofs ------------------------------------------------------------------------------------

export type RoofStyle = 'tiles' | 'shingles' | 'slate' | 'thatch';

/** The texture on a roof's face, row by row across whatever of it is painted in the roof's fill. */
function roofTexture(s: Sketch, x0: number, y0: number, x1: number, y1: number, style: RoofStyle) {
  const fill = fillOf(ROOF);
  const shade = shadeOf(ROOF);
  const dark = darkOf(ROOF);
  const light = lightOf(ROOF);
  const at = (i: number, j: number, key: string) => {
    if (s.get(i, j) === fill) s.set(i, j, key);
  };
  const course = style === 'slate' ? 6 : style === 'thatch' ? 5 : 8;
  for (let j = y0 + course - 2; j < y1; j += course) {
    const row = Math.floor((j - y0) / course);
    for (let i = x0; i < x1; i++) {
      if (style === 'thatch') {
        at(i, j, (i + row * 3) % 4 === 0 ? dark : shade);
        if ((i * 7 + row) % 5 === 0) at(i, j - 2, light);
        continue;
      }
      at(i, j, shade);
      if (style === 'tiles' && (i * 3 + row) % 4 !== 0) at(i, j + 1, light);
      if (style === 'shingles' || style === 'slate') {
        const step = style === 'slate' ? 7 : 5;
        if ((i + row * 3) % step === 0) {
          for (let k = 1; k < course - 1; k++) at(i, j - k, shade);
        }
      } else if ((i + row * 5) % 10 === 0) {
        at(i, j + 1, shade);
      }
    }
  }
}

/**
 * The front slope of a roof seen from the street: a trapezoid from its ridge (`top`, `ridge` wide)
 * down to its eaves (`eave`, `span` wide), centred on `cx`, with a fascia board along the eaves.
 * A bigger `span` than the walls makes the roof overhang them, which is most of what makes a
 * house look cosy.
 */
export function slopedRoof(
  s: Sketch,
  cx: number,
  top: number,
  eave: number,
  ridge: number,
  span: number,
  style: RoofStyle = 'tiles',
): void {
  const fill = fillOf(ROOF);
  for (let y = top; y < eave; y++) {
    const t = (y - top) / Math.max(1, eave - top - 1);
    const half = Math.round(ridge / 2 + ((span - ridge) / 2) * t);
    s.rect(cx - half, y, half * 2, 1, fill);
  }
  roofTexture(s, cx - span / 2, top, cx + span / 2, eave, style);
  s.bevel(fillOf(ROOF) + shadeOf(ROOF), lightOf(ROOF), null);
  s.rect(cx - span / 2, eave, span, 3, darkOf(ROOF));
}

/**
 * A roof whose gable end faces the street: a triangle of roof edge, `thick` pixels deep, over a
 * triangle of wall. `apex` is the peak, and it meets the eaves `span` wide.
 */
export function gableRoof(
  s: Sketch,
  cx: number,
  apex: number,
  eave: number,
  span: number,
  thick: number,
  style: RoofStyle = 'tiles',
  gableWall: WallStyle = 'boards',
): void {
  const height = eave - apex;
  const halfAt = (y: number) => Math.round(((y - apex) / height) * (span / 2));
  // The gable's wall first, so the roof's edges lie over it.
  for (let y = apex + thick; y < eave; y++) {
    const half = halfAt(y) - thick;
    if (half > 0) s.rect(cx - half, y, half * 2, 1, 'W');
  }
  const gable = new Sketch(s.width, s.height);
  wall(gable, 0, 0, s.width, s.height, gableWall);
  for (let y = apex; y < eave; y++) {
    for (let x = 0; x < s.width; x++) if (s.get(x, y) === 'W') s.set(x, y, gable.get(x, y)!);
  }
  for (let y = apex; y < eave + 2; y++) {
    const half = halfAt(y);
    // Each edge stops at the middle, so near the peak they meet rather than cross.
    for (let k = 0; k < Math.min(thick, half); k++) {
      s.set(cx - half + k, y, fillOf(ROOF));
      s.set(cx + half - 1 - k, y, fillOf(ROOF));
    }
  }
  roofTexture(s, cx - span / 2, apex, cx + span / 2, eave + 2, style);
  // The left slope faces the light, the right one falls away from it.
  for (let y = apex; y < eave + 2; y++) {
    const half = halfAt(y);
    s.set(cx - half, y, lightOf(ROOF));
    for (let k = 0; k < Math.min(thick, half); k++) {
      if (s.get(cx + half - 1 - k, y) === fillOf(ROOF)) s.set(cx + half - 1 - k, y, shadeOf(ROOF));
    }
  }
  // Shadow under the barge boards, on the gable's wall.
  for (let y = apex + thick; y < eave; y++) {
    const half = halfAt(y) - thick;
    if (half > 0) {
      s.set(cx - half, y, shadeOf(WALL));
      s.set(cx - half + 1, y, shadeOf(WALL));
      s.set(cx + half - 1, y, shadeOf(WALL));
    }
  }
}

/** A chimney of stone with a cap, standing from `bottom` up to `top`. */
export function chimney(s: Sketch, x: number, top: number, w: number, bottom: number): void {
  wall(s, x, top + 3, w, bottom - top - 3, 'brick', STONE, 3);
  s.rect(x - 2, top, w + 4, 3, fillOf(STONE)).rect(x - 2, top, w + 4, 1, lightOf(STONE));
  for (let j = top + 3; j < bottom; j++) s.set(x + w - 1, j, shadeOf(STONE));
}

// ---- Windows and doors ------------------------------------------------------------------------

export interface WindowOptions {
  /** Panes across and down, divided by mullions. */
  panes?: [number, number];
  /** An arched top, a round window, or a plain rectangle. */
  shape?: WindowShape;
  /** A sill under it, a box of flowers, or shutters either side. */
  sill?: boolean;
  box?: boolean;
  shutters?: boolean;
  /** Curtains drawn back at its top corners, in the building's second accent. */
  curtains?: boolean;
}

/** A window's shape: square, a round arch, a pointed gothic arch, or round. */
export type WindowShape = 'square' | 'arch' | 'pointed' | 'round';

/** Inside the shape of a window (without its frame), `inset` pixels in. */
function inWindow(shape: WindowShape, x: number, y: number, w: number, h: number, inset: number) {
  return (i: number, j: number) => {
    if (i < x + inset || i >= x + w - inset || j < y + inset || j >= y + h - inset) return false;
    if (shape === 'square') return true;
    const rx = w / 2 - inset;
    const cx = x + w / 2;
    if (shape === 'round') {
      const ry = h / 2 - inset;
      const cy = y + h / 2;
      const nx = (i + 0.5 - cx) / rx;
      const ny = (j + 0.5 - cy) / ry;
      return nx * nx + ny * ny <= 1;
    }
    if (shape === 'pointed') {
      // Two arcs as wide as the window, each struck from the other side's springing point.
      const span = rx * 2;
      const spring = y + inset + Math.round(span * 0.87);
      if (j >= spring) return true;
      const dy = j + 0.5 - spring;
      const left = i + 0.5 - (cx - rx);
      const right = i + 0.5 - (cx + rx);
      return left * left + dy * dy <= span * span && right * right + dy * dy <= span * span;
    }
    const cy = y + w / 2;
    if (j >= cy) return true;
    const nx = (i + 0.5 - cx) / rx;
    const ny = (j + 0.5 - cy) / (w / 2 - inset);
    return nx * nx + ny * ny <= 1;
  };
}

/** A window: a trim frame, dark glass with a glint, mullions, and whatever it's dressed with. */
export function window(
  s: Sketch,
  x: number,
  y: number,
  w: number,
  h: number,
  options: WindowOptions = {},
): void {
  const shape = options.shape ?? 'square';
  const [across, down] = options.panes ?? [2, 2];
  const frame = inWindow(shape, x, y, w, h, 0);
  const glass = inWindow(shape, x, y, w, h, 2);
  if (options.shutters) {
    for (const sx of [x - 9, x + w + 1]) {
      s.rect(sx, y, 8, h, fillOf(DOOR));
      for (let j = y + 2; j < y + h - 1; j += 3) s.rect(sx + 1, j, 6, 1, shadeOf(DOOR));
      s.rect(sx, y, 8, 1, lightOf(DOOR));
    }
  }
  for (let j = y; j < y + h; j++) {
    for (let i = x; i < x + w; i++) {
      if (!frame(i, j)) continue;
      s.set(i, j, glass(i, j) ? GLASS : fillOf(TRIM));
    }
  }
  // Mullions, then the dark under the top of the frame and the glint in the top-left pane.
  for (let a = 1; a < across; a++) {
    const i = x + Math.round((w * a) / across) - 1;
    for (let j = y; j < y + h; j++) if (s.get(i, j) === GLASS) s.set(i, j, fillOf(TRIM));
  }
  for (let d = 1; d < down; d++) {
    const j = y + Math.round((h * d) / down) - 1;
    for (let i = x; i < x + w; i++) if (s.get(i, j) === GLASS) s.set(i, j, fillOf(TRIM));
  }
  for (let i = x; i < x + w; i++) {
    for (let j = y; j < y + h; j++) {
      if (s.get(i, j) !== GLASS) continue;
      if (s.get(i, j - 1) !== GLASS) s.set(i, j, GLASS_DARK);
      break;
    }
  }
  let glint = 0;
  for (let j = y; j < y + h && glint < 5; j++) {
    for (let i = x; i < x + w && glint < 5; i++) {
      if (s.get(i, j) === GLASS && s.get(i - 1, j) !== GLASS && s.get(i, j - 1) !== GLASS) {
        s.set(i + 1, j + 1, GLINT)
          .set(i + 2, j + 1, GLINT)
          .set(i + 1, j + 2, GLINT);
        glint = 5;
      }
    }
  }
  if (options.curtains) {
    for (let k = 0; k < Math.min(h - 4, 10); k++) {
      const reach = Math.max(1, 4 - Math.floor(k / 3));
      for (let r = 0; r < reach; r++) {
        if (glass(x + 2 + r, y + 2 + k)) s.set(x + 2 + r, y + 2 + k, fillOf(ACCENT_TWO));
        if (glass(x + w - 3 - r, y + 2 + k)) s.set(x + w - 3 - r, y + 2 + k, fillOf(ACCENT_TWO));
      }
    }
  }
  if (options.sill || options.box) {
    s.rect(x - 2, y + h, w + 4, 3, fillOf(TRIM)).rect(x - 2, y + h, w + 4, 1, lightOf(TRIM));
  }
  if (options.box) flowerBox(s, x - 1, y + h - 5, w + 2, seededFrom(x, y));
}

function seededFrom(x: number, y: number): number {
  return x * 31 + y * 17;
}

/** A box of flowers on a sill: leaves spilling over its lip, and blooms in both accents. */
export function flowerBox(s: Sketch, x: number, y: number, w: number, seed = 3): void {
  const random = seeded(seed);
  s.rect(x, y + 5, w, 6, fillOf(DOOR)).rect(x, y + 5, w, 1, lightOf(DOOR));
  for (let i = x; i < x + w; i++) s.set(i, y + 10, shadeOf(DOOR));
  for (let i = x + 1; i < x + w - 1; i += 1) {
    const top = y + 2 + Math.floor(random() * 3);
    for (let j = top; j < y + 6; j++) s.set(i, j, j === top ? fillOf(LEAVES) : shadeOf(LEAVES));
  }
  for (let i = x + 2; i < x + w - 2; i += 4) {
    const bloom = random() < 0.5 ? ACCENT : ACCENT_TWO;
    const j = y + 1 + Math.floor(random() * 3);
    s.set(i, j, fillOf(bloom))
      .set(i + 1, j, fillOf(bloom))
      .set(i, j + 1, shadeOf(bloom));
    s.set(i + 1, j + 1, fillOf(bloom)).set(i, j, lightOf(bloom));
  }
}

export interface DoorOptions {
  shape?: 'square' | 'arch' | 'pointed';
  /** A little window high in the door. */
  light?: boolean;
  /** Which side the knob is on. */
  knob?: 'left' | 'right';
}

/**
 * A door `w` wide and `h` tall standing on `bottom`, centred on `cx`, in a trim frame: planks, a
 * brass knob, and an optional window. At least 28 by 52, so she fits (`docs/art_style.md`).
 */
export function door(
  s: Sketch,
  cx: number,
  bottom: number,
  w: number,
  h: number,
  options: DoorOptions = {},
): DoorRect {
  const shape = options.shape ?? 'square';
  const x = Math.round(cx - w / 2);
  const y = bottom - h;
  const inside = (inset: number) => (i: number, j: number) => {
    if (i < x + inset || i >= x + w - inset || j < y + inset || j >= bottom) return false;
    if (shape === 'square') return true;
    const r = w / 2 - inset;
    const top = y + inset;
    if (shape === 'pointed') {
      const rise = w * 0.75;
      if (j >= y + rise) return true;
      return Math.abs(i + 0.5 - cx) <= ((j - top) / (rise - inset)) * r;
    }
    const cy = y + w / 2;
    if (j >= cy) return true;
    const nx = (i + 0.5 - cx) / r;
    const ny = (j + 0.5 - cy) / r;
    return nx * nx + ny * ny <= 1;
  };
  const frame = inside(0);
  const leaf = inside(3);
  for (let j = y; j < bottom; j++) {
    for (let i = x; i < x + w; i++) {
      if (frame(i, j)) s.set(i, j, leaf(i, j) ? fillOf(DOOR) : fillOf(TRIM));
    }
  }
  for (let i = x + 3; i < x + w - 3; i++) {
    for (let j = y; j < bottom; j++) {
      if (!leaf(i, j)) continue;
      if ((i - x - 3) % 7 === 6) s.set(i, j, shadeOf(DOOR));
    }
  }
  // Light down its left, shade down its right and under the frame's head.
  for (let j = y; j < bottom; j++) {
    for (let i = x; i < x + w; i++) {
      if (!leaf(i, j)) continue;
      if (!leaf(i, j - 1) || !leaf(i + 1, j)) s.set(i, j, darkOf(DOOR));
      else if (!leaf(i - 1, j)) s.set(i, j, lightOf(DOOR));
    }
  }
  if (options.light) {
    const lw = Math.max(8, Math.round(w / 2) - 2);
    const ly = y + Math.round(h * 0.18) + (shape === 'square' ? 0 : 4);
    window(s, Math.round(cx - lw / 2), ly, lw, 10, { panes: [2, 1] });
  }
  const kx = options.knob === 'left' ? x + 6 : x + w - 8;
  const ky = bottom - Math.round(h * 0.45);
  s.rect(kx, ky, 3, 3, LAMP).set(kx + 2, ky + 2, darkOf(TRIM));
  return { x, y, w, h };
}

/** Where a building's front door is in its grid, frame and all. */
export interface DoorRect {
  x: number;
  y: number;
  w: number;
  h: number;
}

/** A building drawn: its grid, and where its door is. */
export interface Drawn {
  source: SpriteSource;
  door: DoorRect;
}

/** A step of stone before a door, `w` wide, standing on `bottom`. */
export function step(s: Sketch, cx: number, bottom: number, w: number, h = 5): void {
  const x = Math.round(cx - w / 2);
  s.rect(x, bottom - h, w, h, fillOf(STONE));
  s.rect(x, bottom - h, w, 1, lightOf(STONE));
  s.rect(x + w - 2, bottom - h, 2, h, shadeOf(STONE));
}

// ---- Shop fronts ------------------------------------------------------------------------------

/**
 * A striped awning over a shop window, `w` wide: stripes of the two accents running down it, a
 * scalloped hem, and the shade under it.
 */
export function awning(
  s: Sketch,
  x: number,
  y: number,
  w: number,
  h: number,
  stripes: [Material, Material] = [ACCENT, ACCENT_TWO],
  stripe = 8,
): void {
  for (let j = y; j < y + h; j++) {
    // It slopes out toward her, so it widens a little as it comes down.
    const out = Math.round(((j - y) / h) * 3);
    for (let i = x - out; i < x + w + out; i++) {
      const which = stripes[Math.floor((i - x + 64) / stripe) % 2]!;
      const key = j === y ? lightOf(which) : j > y + h - 3 ? shadeOf(which) : fillOf(which);
      s.set(i, j, key);
    }
  }
  const out = 3;
  for (let i = x - out; i < x + w + out; i++) {
    const which = stripes[Math.floor((i - x + 64) / stripe) % 2]!;
    const phase = (i - x + out) % stripe;
    const drop = phase > 0 && phase < stripe - 1 ? (phase > 1 && phase < stripe - 2 ? 3 : 2) : 0;
    for (let k = 0; k < drop; k++)
      s.set(i, y + h + k, k === drop - 1 ? shadeOf(which) : fillOf(which));
  }
}

/** A board for a sign, in trim, with a border; what it says is stamped on by the caller. */
export function signBoard(s: Sketch, x: number, y: number, w: number, h: number, m = TRIM): void {
  s.rect(x, y, w, h, darkOf(m)).rect(x + 1, y + 1, w - 2, h - 2, fillOf(m));
  s.rect(x + 1, y + 1, w - 2, 1, lightOf(m));
}

/** A little wall lamp by a door, lit after dark. */
export function wallLamp(s: Sketch, x: number, y: number): void {
  s.rect(x + 1, y, 3, 1, darkOf(TRIM));
  s.rect(x, y + 1, 5, 6, darkOf(TRIM)).rect(x + 1, y + 2, 3, 4, LAMP);
  s.rect(x + 1, y + 7, 3, 1, darkOf(TRIM)).rect(x + 2, y + 8, 1, 2, darkOf(TRIM));
}

/**
 * Tiny pixel lettering for signs, three pixels wide and five tall, capitals only. Anything longer
 * than a word or two won't fit a sign at this scale, and doesn't need to.
 */
const FONT: Record<string, readonly string[]> = {
  A: ['.#.', '#.#', '###', '#.#', '#.#'],
  B: ['##.', '#.#', '##.', '#.#', '##.'],
  C: ['.##', '#..', '#..', '#..', '.##'],
  D: ['##.', '#.#', '#.#', '#.#', '##.'],
  E: ['###', '#..', '##.', '#..', '###'],
  F: ['###', '#..', '##.', '#..', '#..'],
  G: ['.##', '#..', '#.#', '#.#', '.##'],
  H: ['#.#', '#.#', '###', '#.#', '#.#'],
  I: ['###', '.#.', '.#.', '.#.', '###'],
  K: ['#.#', '#.#', '##.', '#.#', '#.#'],
  L: ['#..', '#..', '#..', '#..', '###'],
  M: ['#.#', '###', '###', '#.#', '#.#'],
  N: ['##.', '#.#', '#.#', '#.#', '#.#'],
  O: ['.#.', '#.#', '#.#', '#.#', '.#.'],
  P: ['##.', '#.#', '##.', '#..', '#..'],
  R: ['##.', '#.#', '##.', '#.#', '#.#'],
  S: ['.##', '#..', '.#.', '..#', '##.'],
  T: ['###', '.#.', '.#.', '.#.', '.#.'],
  U: ['#.#', '#.#', '#.#', '#.#', '.#.'],
  V: ['#.#', '#.#', '#.#', '.#.', '.#.'],
  W: ['#.#', '#.#', '###', '###', '#.#'],
  Y: ['#.#', '#.#', '.#.', '.#.', '.#.'],
  '&': ['.#.', '#.#', '.#.', '#.#', '.##'],
  "'": ['#', '#', '.', '.', '.'],
  '!': ['#', '#', '#', '.', '#'],
  ' ': ['.', '.', '.', '.', '.'],
};

/** How wide a word is in the sign lettering. */
export function lettersWidth(text: string): number {
  return [...text].reduce((w, ch) => w + (FONT[ch]?.[0]?.length ?? 3) + 1, -1);
}

/** Writes a word in the sign lettering with its top left at (x, y), in `key`. */
export function letters(s: Sketch, text: string, x: number, y: number, key: string): void {
  let at = x;
  for (const ch of text) {
    const glyph = FONT[ch];
    if (!glyph) throw new Error(`no letter for '${ch}'`);
    glyph.forEach((row, j) => [...row].forEach((c, i) => c === '#' && s.set(at + i, y + j, key)));
    at += glyph[0]!.length + 1;
  }
}

// ---- Finishing --------------------------------------------------------------------------------

/** Each key to the outline it takes: its own material's darkest tone (`docs/art_style.md`). */
function outlines(): Record<string, string | null> {
  const map: Record<string, string | null> = {};
  for (const m of [WALL, ROOF, TRIM, DOOR, STONE, ACCENT, ACCENT_TWO, LEAVES]) {
    for (const key of m.slice(1)) map[key] = outlineOf(m);
    map[outlineOf(m)] = null;
  }
  map[GLASS] = outlineOf(TRIM);
  map[GLASS_DARK] = outlineOf(TRIM);
  map[GLINT] = outlineOf(TRIM);
  map[LAMP] = outlineOf(TRIM);
  map[WHITE] = outlineOf(TRIM);
  map[INK] = null;
  return map;
}

/** The finished grid: everything painted gets its soft outline. */
export function finish(s: Sketch): SpriteSource {
  s.outline(outlines());
  return s.toSource();
}

export { GLASS, GLASS_DARK, GLINT, LAMP, INK, WHITE, fillOf, shadeOf, lightOf, darkOf, outlineOf };
