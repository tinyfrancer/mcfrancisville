import type { FurnitureId } from '../types/ids';
import type { FurnitureArt } from './furniture';
import { PALETTE as C } from './palette';
import { CLEAR, Sketch } from './sketch';
import type { SpriteSource } from './sprite';

/*
 * The keepsakes in her neighbours' houses (phase H), drawn at 16 like the rest of her furniture
 * until phase J redraws it all. Sketched rather than typed, and outlined in ink as the other
 * pieces are; what glows gets no outline (`docs/art_style.md`).
 */

type Keepsake = Extract<
  FurnitureId,
  | 'floatingCandles'
  | 'wingbackChair'
  | 'roseBucket'
  | 'pawPrintRug'
  | 'potionShelf'
  | 'witchHatLamp'
  | 'seedlingTray'
  | 'skullPlanter'
  | 'velvetSettee'
  | 'stainedGlass'
  | 'cupcakeTower'
  | 'mummyTeapot'
>;

/** Keys that glow, or are light themselves, and so are never outlined. */
const UNOUTLINED = 'yYgGbB';

function inked(s: Sketch, bare = UNOUTLINED): SpriteSource {
  s.outline((key) => (bare.includes(key) ? null : 'o'));
  return s.toSource();
}

/** A candle: a stick of wax with a flame on top, its top at `top`. */
function candle(s: Sketch, x: number, top: number, height: number): void {
  s.rect(x, top + 3, 3, height, 'w');
  s.set(x, top + 3, 'W').set(x, top + 4, 'W');
  s.set(x + 2, top + 5, 'W');
  s.set(x + 1, top + 2, 'k');
  s.set(x + 1, top, 'y')
    .set(x, top + 1, 'y')
    .set(x + 1, top + 1, 'Y')
    .set(x + 2, top + 1, 'y');
}

const FLOATING_CANDLES = (() => {
  const s = new Sketch(16, 16);
  candle(s, 2, 1, 7);
  candle(s, 7, 4, 7);
  candle(s, 12, 2, 6);
  return inked(s);
})();

const WINGBACK_CHAIR = (() => {
  const s = new Sketch(16, 20);
  // The tall back, with its wings, then the seat and arms, on little feet.
  s.rect(3, 1, 10, 12, 'q').ellipse(8, 3, 5, 3, 'q');
  s.rect(1, 6, 3, 9, 'q').rect(12, 6, 3, 9, 'q');
  s.rect(4, 12, 8, 3, 'Q');
  s.rect(2, 15, 12, 2, 'q');
  s.bevel('q', 'h', 'Q');
  s.rect(6, 4, 4, 1, 'Q').rect(7, 6, 2, 1, 'Q');
  s.rect(2, 17, 2, 2, 'd').rect(12, 17, 2, 2, 'd');
  return inked(s);
})();

const ROSE_BUCKET = (() => {
  const s = new Sketch(16, 18);
  s.rect(3, 10, 10, 7, 'm').rect(2, 9, 12, 2, 'M');
  s.bevel('m', 'M', 'n');
  s.line(4, 12, 11, 12, 'n');
  for (const [x, y] of [
    [4, 5],
    [8, 3],
    [11, 6],
    [6, 7],
    [10, 8],
  ] as const) {
    s.line(x, y + 2, x, 9, 'l');
  }
  s.ellipse(4.5, 5.5, 2, 2, 'r').ellipse(8.5, 3.5, 2, 2, 'p').ellipse(11.5, 6.5, 2, 2, 'r');
  s.ellipse(6.5, 7.5, 2, 1.5, 'p').ellipse(10.5, 8.5, 1.5, 1, 'r');
  s.set(4, 5, 'R').set(8, 3, 'P').set(11, 6, 'R').set(6, 7, 'P');
  s.set(2, 8, 'l').set(3, 8, 'l').set(13, 8, 'l').set(12, 7, 'l');
  return inked(s);
})();

const PAW_PRINT_RUG = (() => {
  const s = new Sketch(32, 16);
  s.ellipse(16, 8, 15, 7, 'r');
  s.ellipse(16, 8, 12, 5, 'R');
  const paw = (cx: number, cy: number) => {
    s.ellipse(cx, cy + 1, 2, 1.5, 'p');
    s.set(cx - 2, cy - 2, 'p')
      .set(cx - 1, cy - 3, 'p')
      .set(cx + 1, cy - 3, 'p');
    s.set(cx + 2, cy - 2, 'p');
  };
  paw(9, 8);
  paw(16, 7);
  paw(23, 9);
  return inked(s);
})();

const POTION_SHELF = (() => {
  const s = new Sketch(16, 16);
  s.rect(1, 12, 14, 2, 'd').line(1, 12, 14, 12, 'D');
  s.rect(3, 14, 1, 2, 'd').rect(12, 14, 1, 2, 'd');
  // Three bottles: round, tall and squat, each glowing its own colour.
  s.ellipse(4.5, 9.5, 2.5, 2.5, 'g').rect(4, 5, 1, 3, 'c').set(4, 4, 'k');
  s.rect(7, 4, 3, 8, 'b').rect(8, 2, 1, 2, 'c').set(8, 1, 'k');
  s.ellipse(12.5, 10, 2, 2, 'G').rect(12, 7, 1, 1, 'c').set(12, 6, 'k');
  s.set(4, 8, 'W').set(7, 5, 'W').set(12, 9, 'W');
  return inked(s, 'W');
})();

const WITCH_HAT_LAMP = (() => {
  const s = new Sketch(16, 24);
  // A crooked pointy shade, a warm glow under its brim, on a twisty stand.
  s.line(9, 1, 10, 2, 'h').rect(8, 3, 2, 2, 'h').rect(7, 5, 4, 2, 'h').rect(6, 7, 5, 2, 'h');
  s.rect(5, 9, 7, 2, 'h').rect(2, 11, 13, 2, 'H');
  s.bevel('h', null, 'H');
  s.rect(5, 10, 7, 1, 'a');
  s.rect(4, 13, 9, 1, 'y');
  s.rect(7, 14, 2, 7, 'd');
  s.set(7, 16, 'D').set(8, 18, 'D');
  s.rect(4, 21, 8, 2, 'd').line(4, 21, 11, 21, 'D');
  return inked(s);
})();

const SEEDLING_TRAY = (() => {
  const s = new Sketch(16, 12);
  s.rect(1, 7, 14, 4, 'd').line(1, 7, 14, 7, 'D');
  s.rect(2, 8, 12, 2, 's');
  for (const x of [3, 6, 9, 12]) {
    s.set(x, 7, 'l')
      .set(x, 6, 'l')
      .set(x - 1, 5, 'L')
      .set(x + 1, 4, 'L')
      .set(x, 5, 'l');
  }
  s.set(12, 3, 'L').set(6, 4, 'L');
  s.rect(11, 9, 3, 2, 'W');
  return inked(s);
})();

const SKULL_PLANTER = (() => {
  const s = new Sketch(16, 18);
  s.ellipse(8, 11, 6, 5, 'w').rect(5, 14, 6, 3, 'w');
  s.bevel('w', null, 'W');
  s.ellipse(5.5, 11.5, 1.5, 1.5, 'k').ellipse(10.5, 11.5, 1.5, 1.5, 'k');
  s.set(8, 13, 'k');
  s.line(6, 16, 10, 16, 'W').set(7, 15, 'W').set(9, 15, 'W');
  // Its succulent, growing out of the top like a hat.
  s.ellipse(8, 5, 4, 2.5, 'l').ellipse(8, 4, 2, 2, 'L');
  s.set(4, 3, 'l').set(12, 3, 'l').set(8, 1, 'L').set(8, 7, 'l');
  return inked(s);
})();

const VELVET_SETTEE = (() => {
  const s = new Sketch(32, 18);
  // A deep curved back, bat-wing arms, the seat, and turned feet.
  s.ellipse(16, 6, 13, 5, 'r').rect(4, 6, 24, 7, 'r');
  s.rect(0, 5, 5, 9, 'r').rect(27, 5, 5, 9, 'r');
  s.set(0, 4, 'r').set(2, 4, 'r').set(29, 4, 'r').set(31, 4, 'r');
  s.rect(4, 10, 24, 4, 'R');
  s.bevel('r', 'p', 'R');
  for (const x of [9, 16, 23]) s.set(x, 5, 'R').set(x, 7, 'R');
  s.rect(1, 14, 30, 1, 'R');
  s.rect(2, 15, 2, 2, 'd').rect(28, 15, 2, 2, 'd');
  return inked(s);
})();

const STAINED_GLASS = (() => {
  const s = new Sketch(16, 16);
  s.ellipse(8, 8, 7, 7, 'k');
  s.ellipse(8, 8, 6, 6, 'g');
  s.dither('g', 'G', 2, 2, 12, 12);
  // The bat across it, in plum, with lead lines through the glass.
  s.ellipse(8, 8.5, 2, 2.5, 'b');
  s.rect(3, 7, 4, 2, 'b').rect(9, 7, 4, 2, 'b');
  s.set(3, 9, 'b').set(5, 9, 'b').set(10, 9, 'b').set(12, 9, 'b');
  s.set(7, 5, 'b').set(9, 5, 'b');
  s.line(8, 2, 8, 5, 'k').line(8, 11, 8, 14, 'k').line(2, 8, 2, 8, 'k').line(13, 8, 14, 8, 'k');
  return inked(s, 'bgG');
})();

const CUPCAKE_TOWER = (() => {
  const s = new Sketch(16, 22);
  // Three tiers of plate on a gold stem, a cupcake on each, and a bat on top.
  for (const [y, w] of [
    [19, 14],
    [13, 10],
    [7, 6],
  ] as const) {
    s.rect(8 - w / 2, y, w, 1, 'W');
  }
  s.rect(7, 7, 2, 13, 'a').rect(5, 20, 6, 1, 'a');
  const cake = (x: number, y: number, icing: string) => {
    s.rect(x, y + 2, 4, 2, 'c').ellipse(x + 2, y + 1.5, 2.5, 1.5, icing);
    s.set(x + 2, y, 'r');
  };
  cake(1, 15, 'p');
  cake(11, 15, 'q');
  cake(3, 9, 'q');
  cake(9, 9, 'p');
  s.ellipse(8, 4, 2, 1.5, 'k').set(5, 3, 'k').set(6, 3, 'k').set(10, 3, 'k').set(11, 3, 'k');
  s.set(4, 2, 'k').set(12, 2, 'k');
  return inked(s);
})();

const MUMMY_TEAPOT = (() => {
  const s = new Sketch(16, 14);
  s.ellipse(7.5, 8.5, 5.5, 4.5, 'w');
  s.rect(12, 7, 3, 2, 'w').set(14, 6, 'w').set(15, 5, 'w');
  s.rect(0, 7, 2, 4, 'w').set(1, 6, 'w');
  s.rect(5, 3, 5, 2, 'w').rect(7, 2, 1, 1, 'W');
  s.bevel('w', null, 'W');
  // Its bandages, crossing, and one little eye peeping out.
  s.line(3, 6, 12, 9, 'W').line(3, 10, 11, 6, 'W').line(4, 12, 11, 12, 'W');
  s.set(6, 8, 'k').set(9, 8, 'k');
  s.set(15, 3, 'B').set(14, 1, 'B');
  return inked(s);
})();

export const KEEPSAKE_ART: Record<Keepsake, FurnitureArt> = {
  floatingCandles: {
    source: FLOATING_CANDLES,
    palette: {
      [CLEAR]: null,
      o: C.stoneDark,
      w: C.cream,
      W: C.creamShade,
      k: C.ink,
      y: C.candle,
      Y: C.candleBright,
    },
    glow: { y: C.candle, Y: C.candleBright },
    lights: [
      { x: 3, y: 2, radius: 10 },
      { x: 13, y: 3, radius: 10 },
    ],
  },
  wingbackChair: {
    source: WINGBACK_CHAIR,
    palette: {
      [CLEAR]: null,
      o: C.ink,
      q: C.blueFabric,
      Q: C.blueFabricShade,
      h: C.sky,
      d: C.bark,
    },
  },
  roseBucket: {
    source: ROSE_BUCKET,
    palette: {
      [CLEAR]: null,
      o: C.ink,
      m: C.silver,
      M: C.stoneLight,
      n: C.silverShade,
      l: C.leaf,
      r: C.scarlet,
      R: C.berryLight,
      p: C.rose,
      P: C.roseLight,
    },
  },
  pawPrintRug: {
    source: PAW_PRINT_RUG,
    palette: { [CLEAR]: null, o: C.barkDark, r: C.wood, R: C.cream, p: C.bark },
  },
  potionShelf: {
    source: POTION_SHELF,
    palette: {
      [CLEAR]: null,
      o: C.ink,
      d: C.wood,
      D: C.bark,
      c: C.cream,
      k: C.barkDark,
      g: C.rose,
      b: C.orbGreen,
      G: C.orbBlue,
      W: C.white,
    },
    glow: { g: C.roseLight, b: C.orbGreenLight, G: C.orbBlueLight },
    lights: [{ x: 8, y: 8, radius: 14 }],
  },
  witchHatLamp: {
    source: WITCH_HAT_LAMP,
    palette: {
      [CLEAR]: null,
      o: C.ink,
      h: C.plum,
      H: C.inkFabric,
      a: C.gold,
      y: C.candle,
      d: C.bark,
      D: C.barkDark,
    },
    glow: { y: C.candleBright, a: C.candle },
    lights: [{ x: 8, y: 13, radius: 18 }],
  },
  seedlingTray: {
    source: SEEDLING_TRAY,
    palette: {
      [CLEAR]: null,
      o: C.ink,
      d: C.wood,
      D: C.bark,
      s: C.soil,
      l: C.leaf,
      L: C.leafLight,
      W: C.cream,
    },
  },
  skullPlanter: {
    source: SKULL_PLANTER,
    palette: {
      [CLEAR]: null,
      o: C.ink,
      w: C.bone,
      W: C.boneShade,
      k: C.ink,
      l: C.hostaBlue,
      L: C.hostaBlueLight,
    },
  },
  velvetSettee: {
    source: VELVET_SETTEE,
    palette: {
      [CLEAR]: null,
      o: C.ink,
      r: C.maroon,
      R: C.maroonShade,
      p: C.berry,
      d: C.gold,
    },
  },
  stainedGlass: {
    source: STAINED_GLASS,
    palette: { [CLEAR]: null, o: C.ink, k: C.stoneDark, g: C.gold, G: C.pumpkin, b: C.plum },
    glow: { g: C.candleBright, G: C.candle, b: C.plumLight },
    lights: [{ x: 8, y: 8, radius: 16 }],
  },
  cupcakeTower: {
    source: CUPCAKE_TOWER,
    palette: {
      [CLEAR]: null,
      o: C.ink,
      W: C.white,
      a: C.gold,
      c: C.wood,
      p: C.rose,
      q: C.lavender,
      r: C.scarlet,
      k: C.inkFabric,
    },
  },
  mummyTeapot: {
    source: MUMMY_TEAPOT,
    palette: {
      [CLEAR]: null,
      o: C.stoneDark,
      w: C.bandage,
      W: C.bandageShade,
      k: C.ink,
      B: C.ghost,
    },
  },
};
