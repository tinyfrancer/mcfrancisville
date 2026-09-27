import { PALETTE as C, ramp, SHADOW_ALPHA } from './palette';
import { CLEAR, Sketch } from './sketch';
import { rasterize, type Palette, type Raster, type SpriteSource } from './sprite';

/*
 * The scale sheet (phase C): the first art drawn at 32 pixels a tile, to be judged on her phone
 * before the rest is redrawn (`docs/art_style.md`). Her and Cody at 32×48, her house with the
 * yard skeleton, a tree, and the ground they stand on, each on its own and then all together.
 * These are drafts to judge the size and the style by; phases D, F and G draw the real ones.
 */

/** A piece of the scale sheet: art at the new density, to be judged before the redraw goes on. */
export interface SheetPiece {
  name: string;
  draw: () => Raster;
}

interface Art {
  source: SpriteSource;
  palette: Palette;
}

const TILE = 32;

/**
 * Keys for a ramp's five tones, darkest first; `_` skips a tone. `tones('qPph_', pink)` makes
 * `q` the outline, `P` the shade, `p` the fill and `h` the highlight.
 */
function tones(keys: string, base: string): Palette {
  const colours = ramp(base);
  const palette: Record<string, string> = {};
  [...keys].forEach((key, i) => {
    if (key !== '_') palette[key] = colours[i]!;
  });
  return palette;
}

/** Fills to the outline each takes: the darkest tone of its own ramp. */
function outlines(ramps: readonly string[]): Record<string, string> {
  const map: Record<string, string> = {};
  for (const keys of ramps) for (const key of keys.slice(1)) if (key !== '_') map[key] = keys[0]!;
  return map;
}

// ---- Characters at 32×48 --------------------------------------------------------------------

/** The ramps every chibi figure is drawn in, by key: skin, hair, top, bottoms, shoes. */
const SKIN = 'oSsL_';
const HAIR = 'qPph_';
const HAIR_TWO = 'nBbj_';
const TOP = 'uTty_';
const BOTTOM = 'vDdg_';
const SHOES = 'zKki_';

interface Colours {
  skin: string;
  hair: string;
  /** The other side of a split dye; the same as `hair` for one colour. */
  hairTwo: string;
  eyes: string;
  top: string;
  bottom: string;
  shoes: string;
}

function figurePalette(c: Colours, extra: Palette = {}): Palette {
  return {
    [CLEAR]: null,
    ...tones(SKIN, c.skin),
    ...tones(HAIR, c.hair),
    ...tones(HAIR_TWO, c.hairTwo),
    ...tones(TOP, c.top),
    ...tones(BOTTOM, c.bottom),
    ...tones(SHOES, c.shoes),
    c: C.cheek,
    e: c.eyes,
    E: C.ink,
    w: C.white,
    m: C.berryLight,
    ...extra,
  };
}

/**
 * The chibi body, front on (`docs/art_style.md`, Sizes): boots, jeans, a tee, bare arms with mitten
 * hands, a neck, and a big round face with its chin at row 23. Hair goes on after.
 */
function body(): Sketch {
  const s = new Sketch(32, 48);
  s.rect(9, 43, 6, 4, 'k').rect(17, 43, 6, 4, 'k');
  s.rect(10, 34, 12, 3, 'd').rect(10, 37, 5, 6, 'd').rect(17, 37, 5, 6, 'd');
  s.rect(11, 25, 10, 1, 't').rect(10, 26, 12, 8, 't');
  s.rect(7, 26, 3, 3, 't').rect(22, 26, 3, 3, 't');
  s.rect(7, 29, 3, 8, 's').rect(22, 29, 3, 8, 's');
  s.rect(14, 23, 4, 2, 'S');
  s.ellipse(16, 15.5, 8.5, 8, 's');
  return s;
}

/**
 * Where the face shows under the hair: an arch from the parting down to the sides at `sides`,
 * as wide as `across` either side of the middle. Anything else in the head is hair.
 */
function showFace(s: Sketch, top: number, sides: number, across = 7): void {
  for (let y = top; y <= 22; y++) {
    for (let x = 9; x <= 22; x++) {
      const off = Math.abs(x + 0.5 - 16);
      if (off > across) continue;
      const hairline = top + off * ((sides - top) / across);
      if (y >= hairline) s.set(x, y, 's');
    }
  }
}

/** Big shiny eyes low on the face, with lashes if she has them, cheeks and a small mouth. */
function face(s: Sketch, lashes: boolean): void {
  const eye = (x: number) => s.stamp({ rows: ['.E.', 'wEE', 'wEE', 'EEe', '.e.'] }, x, 14);
  eye(11);
  eye(18);
  if (lashes) s.set(10, 14, 'E').set(21, 14, 'E');
  s.rect(9, 19, 2, 1, 'c').rect(21, 19, 2, 1, 'c');
  s.set(15, 20, 'm').set(16, 20, 'm');
}

/** Light from the top left on every part, then the soft outline round the whole figure. */
function finishFigure(s: Sketch, more: Record<string, string> = {}): SpriteSource {
  s.bevel('p', 'h', 'P').bevel('b', 'j', 'B').bevel('s', null, 'S');
  s.bevel('t', 'y', 'T').bevel('d', 'g', 'D').bevel('k', 'i', 'K');
  s.outline({ ...outlines([SKIN, HAIR, HAIR_TWO, TOP, BOTTOM, SHOES]), a: 'o', ...more });
  return s.toSource();
}

/** Her, in her new split bob: pink on her right, very dark brown on her left, parted down the middle. */
function her(): Art {
  const s = body();
  // Her tattoo sleeves, Scream Dion's ghost on her tee, and her bat pendant.
  for (const [x, y] of [
    [8, 29],
    [7, 31],
    [9, 32],
    [8, 34],
    [23, 30],
    [22, 32],
    [24, 33],
  ] as const) {
    s.set(x, y, 'a');
  }
  s.stamp({ rows: ['.xx.', 'xExE', 'xxxx', 'x.x.'] }, 14, 29);
  s.set(15, 26, 'r').set(16, 26, 'r').set(14, 27, 'r').set(17, 27, 'r');
  // A blunt bob either side of a crown, the chin below its ends.
  s.ellipse(16, 11.5, 12, 10.5, 'p').rect(4, 11, 24, 12, 'p');
  s.replace('p', 'b', (x) => x >= 16);
  showFace(s, 7, 12, 6);
  s.rect(4, 23, 6, 1, CLEAR).rect(22, 23, 6, 1, CLEAR).rect(12, 23, 8, 1, 's');
  // A shine on each side, the pink catching more of the light.
  for (const [x, y] of [
    [7, 5],
    [8, 4],
    [9, 4],
    [10, 3],
    [11, 3],
    [20, 3],
    [21, 3],
    [22, 4],
  ] as const) {
    s.set(x, y, x < 16 ? 'h' : 'j');
  }
  face(s, true);
  return {
    source: finishFigure(s),
    palette: figurePalette(
      {
        skin: C.skin,
        hair: C.hairPink,
        hairTwo: C.hairDarkBrown,
        eyes: C.eyeBrown,
        top: C.blueFabric,
        bottom: C.denim,
        shoes: C.inkFabric,
      },
      { a: C.tattooInk, x: C.cream, r: C.silver },
    ),
  };
}

/**
 * Cody, the vampire: long curly brown hair, round glasses, two little fangs, and the high collar
 * of a cape, black outside and red within, over his maroon tee.
 */
function cody(): Art {
  const s = body();
  // The cape: a high collar standing up behind his shoulders, and falling behind his arms.
  s.rect(5, 22, 4, 16, 'f').rect(23, 22, 4, 16, 'f');
  s.rect(6, 22, 2, 5, 'R').rect(24, 22, 2, 5, 'R');
  s.rect(7, 26, 3, 3, 't').rect(22, 26, 3, 3, 't');
  s.rect(7, 29, 3, 8, 's').rect(22, 29, 3, 8, 's');
  // Long hair past his shoulders, curling at the ends, with a side-swept fringe.
  s.ellipse(16, 11.5, 12, 10.5, 'p').rect(4, 11, 24, 14, 'p');
  for (let x = 4; x < 28; x += 3) s.set(x + 1, 25, 'p').set(x, 24, CLEAR);
  showFace(s, 8, 11, 7);
  s.rect(10, 8, 6, 2, 'p').set(9, 10, 'p').set(15, 10, 's');
  s.rect(12, 23, 8, 1, 's');
  s.set(8, 5, 'h').set(9, 4, 'h').set(10, 4, 'h').set(11, 3, 'h');
  face(s, false);
  // Two little fangs in his smile, and round glasses over his eyes.
  s.set(14, 20, 'm').set(17, 20, 'm').set(15, 21, 'w').set(16, 21, 'w');
  for (const x of [10, 17]) {
    s.rect(x, 13, 5, 1, 'G').rect(x, 19, 5, 1, 'G').rect(x, 14, 1, 5, 'G');
    s.rect(x + 4, 14, 1, 5, 'G');
  }
  s.rect(15, 15, 2, 1, 'G');
  return {
    source: finishFigure(s, { f: 'F', R: 'F', G: 'F' }),
    palette: figurePalette(
      {
        skin: C.skin,
        hair: C.hairBrown,
        hairTwo: C.hairBrown,
        eyes: C.eyeHazel,
        top: C.maroon,
        bottom: C.denim,
        shoes: C.inkFabric,
      },
      { f: C.inkFabric, F: C.ink, R: C.scarlet, G: C.barkDark },
    ),
  };
}

// ---- A tree, 3 tiles by 4 --------------------------------------------------------------------

function tree(): Art {
  const s = new Sketch(96, 124);
  // A twisty trunk and its roots, then a soft round canopy of three puffs, dithered between tones.
  for (let y = 66; y < 116; y++) {
    const lean = Math.round(Math.sin((y - 66) / 11) * 3);
    s.rect(42 + lean, y, 12, 1, 'w');
  }
  s.ellipse(48, 118, 16, 4, 'w').rect(32, 114, 32, 4, 'w');
  s.bevel('w', 'W', 'v');
  s.ellipse(38, 60, 3, 4, 'v').set(38, 60, 'x');
  s.sphere(27, 52, 24, 20, '12345', { dither: true });
  s.sphere(69, 52, 24, 20, '12345', { dither: true });
  s.sphere(48, 34, 32, 29, '12345', { dither: true });
  s.outline({ 1: '0', 2: '0', 3: '0', 4: '0', 5: '0', w: 'u', W: 'u', v: 'u', x: 'u' });
  return {
    source: s.toSource(),
    palette: {
      [CLEAR]: null,
      0: ramp(C.canopyDark)[0],
      1: ramp(C.canopyDark)[1],
      2: C.canopyDark,
      3: C.canopy,
      4: C.canopyLight,
      5: ramp(C.canopyLight)[3],
      ...tones('uvwW_', C.bark),
      x: C.ink,
    },
  };
}

// ---- Her house, 5 tiles wide --------------------------------------------------------------

function house(): Art {
  const W = 160;
  const H = 176;
  const s = new Sketch(W, H);
  // Walls, with a stone footing.
  s.rect(14, 84, W - 28, 84, 'c');
  s.rect(14, 158, W - 28, 10, 's');
  for (let x = 16; x < W - 16; x += 12) s.rect(x, 162, 1, 6, 'S');
  s.rect(14, 162, W - 28, 1, 'S');
  // The roof: a big soft trapezoid of plum tiles, overhanging the walls, and a chimney.
  s.rect(110, 10, 14, 40, 'b').bevel('b', 'B', 'n');
  for (let y = 18; y < 92; y++) {
    const inset = Math.round(((92 - y) / 74) * 44);
    s.rect(4 + inset, y, W - 8 - inset * 2, 1, 'r');
  }
  for (let y = 24; y < 92; y += 8) {
    for (let x = 0; x < W; x++) {
      if (s.get(x, y) === 'r') s.set(x, y, 'R');
      if (s.get(x, y + 1) === 'r' && (x + (y / 8) * 5) % 10 === 0) s.set(x, y + 1, 'R');
    }
  }
  s.bevel('r', 'l', 'R');
  s.rect(4, 88, W - 8, 4, 'e');
  // A round attic window up in the roof.
  s.ellipse(80, 54, 10, 10, 'f').ellipse(80, 54, 7, 7, 'g');
  s.rect(79, 47, 2, 14, 'f').rect(73, 53, 14, 2, 'f');
  // Two windows with flower boxes, and the door with a bat on it, under a little arch.
  for (const x of [26, 106]) {
    s.rect(x, 104, 30, 30, 'f').rect(x + 3, 107, 24, 24, 'g');
    s.rect(x + 14, 107, 2, 24, 'f').rect(x + 3, 118, 24, 2, 'f');
    s.rect(x + 4, 108, 5, 3, 'G');
    s.rect(x - 2, 134, 34, 6, 'k');
    for (let i = 0; i < 6; i++) s.set(x + 2 + i * 5, 133, i % 2 ? 'p' : 'y');
  }
  s.ellipse(80, 118, 19, 14, 'f').rect(61, 118, 38, 50, 'f');
  s.ellipse(80, 120, 16, 12, 'd').rect(64, 120, 32, 48, 'd');
  s.bevel('d', 'D', 'q');
  s.rect(89, 146, 3, 3, 'y');
  // The bat, wings out.
  s.stamp(
    {
      rows: [
        'x..........x',
        'xx..x..x..xx',
        'xxx.xxxx.xxx',
        'xxxxxyxyxxxx',
        '.xxxxxxxxxx.',
        '..x..xx..x..',
      ],
    },
    74,
    124,
  );
  s.rect(66, 168, 28, 4, 's').rect(64, 172, 32, 4, 's');
  s.bevel('c', null, 'C').bevel('s', 'L', 'S');
  s.outline({ c: 'C', C: 'o', r: 'o', R: 'o', l: 'o', e: 'o', b: 'n', n: 'o', f: 'o', s: 'o' });
  return {
    source: s.toSource(),
    palette: {
      [CLEAR]: null,
      ...tones('_Cc__', C.cream),
      o: C.ink,
      ...tones('_RrlL', C.plum),
      e: ramp(C.plum)[0],
      ...tones('nBb__', C.stone),
      ...tones('_Ss_L', C.stone),
      f: C.berry,
      g: C.dusk,
      G: C.plumLight,
      ...tones('qDd__', C.berryLight),
      k: C.wood,
      p: C.roseLight,
      y: C.candle,
      x: C.ink,
    },
  };
}

// ---- The twelve-foot skeleton in her yard ---------------------------------------------------

/** Friendly and enormous: about three of her tall, waving, with a big grin. */
function skeleton(): Art {
  const s = new Sketch(64, 148);
  const bone = (x0: number, y0: number, x1: number, y1: number, width: number) => {
    const steps = Math.max(Math.abs(x1 - x0), Math.abs(y1 - y0));
    for (let i = 0; i <= steps; i++) {
      const x = Math.round(x0 + ((x1 - x0) * i) / steps);
      const y = Math.round(y0 + ((y1 - y0) * i) / steps);
      s.rect(x - Math.floor(width / 2), y - Math.floor(width / 2), width, width, 'b');
    }
    s.ellipse(x0 + 0.5, y0 + 0.5, width * 0.75, width * 0.75, 'b');
    s.ellipse(x1 + 0.5, y1 + 0.5, width * 0.75, width * 0.75, 'b');
  };
  // Legs, then hips, spine and ribs, then arms: one down, one up and waving.
  bone(26, 88, 25, 112, 5);
  bone(25, 112, 24, 138, 5);
  bone(38, 88, 39, 112, 5);
  bone(39, 112, 40, 138, 5);
  s.ellipse(22, 142, 7, 3.5, 'b').ellipse(42, 142, 7, 3.5, 'b');
  s.ellipse(32, 86, 12, 7, 'b').ellipse(28, 86, 3, 3, 'h').ellipse(36, 86, 3, 3, 'h');
  s.rect(30, 44, 4, 38, 'b');
  for (let i = 0; i < 4; i++) {
    const y = 50 + i * 7;
    const half = 13 - i;
    s.ellipse(32, y + 3, half, 3.5, 'b').ellipse(32, y + 4, half - 2, 2, 'h');
    s.rect(30, y, 4, 7, 'b');
  }
  bone(18, 46, 12, 66, 4);
  bone(12, 66, 12, 86, 4);
  s.ellipse(12, 90, 4, 4, 'b');
  bone(46, 46, 54, 30, 4);
  bone(54, 30, 55, 12, 4);
  s.ellipse(56, 9, 4, 5, 'b');
  s.rect(16, 43, 32, 4, 'b');
  // The skull: big and round, with a jaw and a wide grin.
  s.ellipse(32, 22, 15, 16, 'b').rect(24, 30, 16, 10, 'b');
  s.ellipse(26, 22, 4.5, 5, 'h').ellipse(38, 22, 4.5, 5, 'h');
  s.set(25, 20, 'g').set(37, 20, 'g').set(26, 20, 'g').set(38, 20, 'g');
  s.ellipse(32, 30, 1.5, 2, 'h');
  s.rect(25, 34, 14, 1, 'B');
  for (let x = 26; x < 39; x += 3) s.rect(x, 34, 1, 4, 'B');
  s.rect(25, 37, 14, 1, 'B');
  s.bevel('b', 'l', 'B');
  s.replace('h', CLEAR);
  s.replace('g', 'w');
  s.outline({ b: 'o', B: 'o', l: 'o' });
  return {
    source: s.toSource(),
    palette: { [CLEAR]: null, ...tones('oBbl_', C.bone), w: C.white },
  };
}

// ---- The ground: grass and a cobbled path ---------------------------------------------------

function grass(variant: number): Art {
  const s = new Sketch(TILE, TILE, 'g');
  const tufts: readonly (readonly [number, number])[] =
    variant === 0
      ? [
          [5, 7],
          [21, 4],
          [12, 18],
          [26, 23],
          [4, 27],
        ]
      : [
          [9, 10],
          [24, 14],
          [16, 27],
        ];
  for (const [x, y] of tufts) {
    s.set(x, y, 'G')
      .set(x + 2, y, 'G')
      .set(x + 1, y - 1, 'L')
      .set(x, y - 1, 'G');
    s.set(x + 1, y + 1, 'd');
  }
  if (variant === 1) s.set(6, 22, 'f').set(5, 22, 'y').set(7, 22, 'y').set(6, 21, 'y');
  return {
    source: s.toSource(),
    palette: {
      [CLEAR]: null,
      g: C.moss,
      G: C.mossLight,
      L: ramp(C.mossLight)[3],
      d: C.mossDark,
      f: C.candle,
      y: C.roseLight,
    },
  };
}

function path(): Art {
  const s = new Sketch(TILE, TILE, 'm');
  const stones: readonly (readonly [number, number, number, number])[] = [
    [7, 6, 6, 5],
    [21, 5, 8, 5],
    [4, 18, 5, 6],
    [15, 16, 6, 5],
    [27, 17, 5, 5],
    [9, 27, 7, 4.5],
    [24, 28, 6, 4.5],
  ];
  for (const [cx, cy, rx, ry] of stones) s.ellipse(cx, cy, rx, ry, 's');
  s.bevel('s', 'L', 'S');
  return {
    source: s.toSource(),
    palette: {
      [CLEAR]: null,
      m: C.stoneDark,
      ...tones('_Ss_L', C.stone),
    },
  };
}

// ---- All of it together ---------------------------------------------------------------------

/** A picture built from rasters, for the sheet that shows everything standing together. */
class Plate {
  readonly raster: Raster;

  constructor(width: number, height: number) {
    this.raster = { width, height, data: new Uint8ClampedArray(width * height * 4) };
  }

  /** Draws a raster with its top left at (x, y), each opaque pixel covering what's there. */
  blit(r: Raster, left: number, top: number): this {
    const x = Math.round(left);
    const y = Math.round(top);
    const { width, height, data } = this.raster;
    for (let j = 0; j < r.height; j++) {
      for (let i = 0; i < r.width; i++) {
        const from = (j * r.width + i) * 4;
        const tx = x + i;
        const ty = y + j;
        if (r.data[from + 3] === 0 || tx < 0 || ty < 0 || tx >= width || ty >= height) continue;
        data.set(r.data.subarray(from, from + 4), (ty * width + tx) * 4);
      }
    }
    return this;
  }

  /** A soft flat shadow on the ground, as the renderer draws one under anything standing. */
  shadow(cx: number, cy: number, w: number, h: number): this {
    const shade = new Sketch(Math.ceil(w), Math.ceil(h)).ellipse(w / 2, h / 2, w / 2, h / 2, 'x');
    const ink = [0x14, 0x0e, 0x1f];
    const { width, data } = this.raster;
    shade.rows.forEach((row, j) => {
      [...row].forEach((key, i) => {
        if (key === CLEAR) return;
        const at = ((Math.round(cy - h / 2) + j) * width + Math.round(cx - w / 2) + i) * 4;
        for (let c = 0; c < 3; c++) {
          data[at + c] = Math.round(data[at + c]! + (ink[c]! - data[at + c]!) * SHADOW_ALPHA);
        }
      });
    });
    return this;
  }
}

/**
 * Everything standing together on a patch of her street, 12 tiles by 8: the house with the
 * skeleton in its yard, the tree, and her and Cody on the path by her door.
 */
function sheet(): Raster {
  const cols = 12;
  const rows = 8;
  const plate = new Plate(cols * TILE, rows * TILE);
  const lawn = [draw(grass(0)), draw(grass(1))];
  const cobbles = draw(path());
  for (let ty = 0; ty < rows; ty++) {
    for (let tx = 0; tx < cols; tx++) {
      const onPath = ty === 6 || (tx === 5 && ty === 5);
      plate.blit(
        onPath ? cobbles : lawn[(tx * 7 + ty * 3) % 5 === 0 ? 1 : 0]!,
        tx * TILE,
        ty * TILE,
      );
    }
  }
  const stand = (r: Raster, cx: number, footY: number, shadowW: number) => {
    plate.shadow(cx, footY - 2, shadowW, shadowW / 3);
    plate.blit(r, Math.round(cx - r.width / 2), footY - r.height);
  };
  // The house sits on tiles 3–7, its front on row 5; the skeleton stands in the yard to its left.
  stand(draw(skeleton()), 1.5 * TILE, 5.6 * TILE, 40);
  stand(draw(house()), 5.5 * TILE, 6 * TILE, 150);
  stand(draw(tree()), 10 * TILE, 5.8 * TILE, 60);
  stand(draw(her()), 5.5 * TILE, 7 * TILE - 6, 20);
  stand(draw(cody()), 7 * TILE, 7 * TILE - 4, 20);
  return plate.raster;
}

function draw(art: Art): Raster {
  return rasterize(art.source, art.palette);
}

export const SCALE_SHEET: readonly SheetPiece[] = [
  { name: 'sheet', draw: sheet },
  { name: 'her', draw: () => draw(her()) },
  { name: 'cody', draw: () => draw(cody()) },
  { name: 'house', draw: () => draw(house()) },
  { name: 'skeleton', draw: () => draw(skeleton()) },
  { name: 'tree', draw: () => draw(tree()) },
  { name: 'grass:0', draw: () => draw(grass(0)) },
  { name: 'grass:1', draw: () => draw(grass(1)) },
  { name: 'path', draw: () => draw(path()) },
];
