import type { SnowKeepsakeId, SnowmanId } from '../types/ids';
import {
  ACCENT,
  ACCENT_TWO,
  darkOf,
  DOOR,
  fillOf,
  finish,
  INK,
  lightOf,
  ROOF,
  shadeOf,
  STONE,
  TRIM,
  WALL,
  WHITE,
} from './buildings';
import type { FurnitureArt } from './furniture';
import { ball, palette } from './furnish';
import type { ItemArt } from './items';
import { PALETTE as C, ramp } from './palette';
import { Sketch } from './sketch';
import type { Palette, SpriteSource } from './sprite';

/*
 * Snow days (1.6's X4, decision 383): her snowman in three hats, at 32, standing as a yard piece
 * does on the front edge of his tile and rising over the grass behind; the snowball she rolls
 * first, small and bigger; and the two keepsakes' icons at 16. The snow is the ground's own
 * (`C.snow` and its shade), so a snowman stands in the drift he was rolled from.
 */

/** Three balls of snow, coal eyes and buttons, a carrot, twig arms and a scarf; the hat on after. */
function snowmanBody(): Sketch {
  const s = new Sketch(32, 54);
  ball(s, 16, 44, 11, 9, WALL);
  ball(s, 16, 31, 8, 7, WALL);
  ball(s, 16, 19, 6.5, 6, WALL);
  // Twig arms, out and up from his middle, each with a little fork.
  const twig = fillOf(STONE);
  s.line(8, 30, 2, 25, twig).set(1, 24, twig).set(3, 23, twig);
  s.line(24, 30, 30, 26, twig).set(31, 25, twig).set(29, 24, twig);
  // Coal buttons down his middle.
  for (const y of [29, 33, 36]) s.rect(15, y, 2, 2, INK);
  // A scarf round his neck, its end hanging down one side.
  s.rect(10, 24, 12, 3, fillOf(DOOR)).rect(10, 24, 12, 1, lightOf(DOOR));
  for (const x of [12, 16, 20]) s.set(x, 25, shadeOf(DOOR));
  s.rect(18, 27, 3, 6, fillOf(DOOR)).rect(18, 32, 3, 1, shadeOf(DOOR));
  s.set(18, 33, fillOf(DOOR)).set(20, 33, fillOf(DOOR));
  // His face: coal eyes, a carrot nose poking out, a smile of coal.
  s.rect(13, 17, 2, 2, INK).rect(18, 17, 2, 2, INK);
  s.set(13, 17, WHITE).set(18, 17, WHITE);
  s.rect(16, 19, 4, 2, fillOf(ACCENT))
    .rect(20, 20, 2, 1, fillOf(ACCENT))
    .set(16, 20, shadeOf(ACCENT));
  for (const [x, y] of [
    [13, 21],
    [14, 22],
    [16, 23],
    [18, 22],
    [19, 21],
  ] as const) {
    s.set(x, y, INK);
  }
  return s;
}

/** A tall black top hat with a red band. */
function topHat(s: Sketch): void {
  s.rect(9, 12, 14, 2, fillOf(ROOF)).rect(9, 12, 14, 1, lightOf(ROOF));
  s.rect(11, 1, 10, 11, fillOf(ROOF))
    .rect(11, 1, 10, 1, lightOf(ROOF))
    .rect(11, 1, 1, 11, lightOf(ROOF));
  s.rect(20, 2, 1, 10, shadeOf(ROOF));
  s.rect(11, 9, 10, 2, fillOf(ACCENT_TWO)).rect(11, 9, 10, 1, lightOf(ACCENT_TWO));
}

/** A stripy bobble hat pulled down over his ears, a bobble on top. */
function bobbleHat(s: Sketch): void {
  const dome = new Sketch(32, 54);
  ball(dome, 16, 12, 7, 7, ROOF);
  dome.rect(0, 12, 32, 42, '.');
  for (const y of [7, 10]) dome.rect(10, y, 13, 1, fillOf(ACCENT_TWO));
  s.stamp(dome, 0, 0);
  s.rect(9, 12, 15, 3, fillOf(TRIM)).rect(9, 12, 15, 1, lightOf(TRIM));
  for (let x = 10; x < 23; x += 2) s.set(x, 14, shadeOf(TRIM));
  s.ellipse(16, 4, 2.5, 2.5, WHITE).set(15, 3, WHITE);
}

/** A pointy witch hat with a bent tip and a gold buckle. */
function witchHat(s: Sketch): void {
  s.rect(7, 12, 18, 2, fillOf(ROOF)).rect(7, 12, 18, 1, lightOf(ROOF));
  for (let y = 0; y < 12; y++) {
    const half = Math.round(1 + y * 0.45);
    const lean = Math.round((12 - y) * 0.25);
    s.rect(16 - half + lean, y, half * 2, 1, fillOf(ROOF));
    s.set(16 - half + lean, y, lightOf(ROOF));
  }
  s.rect(12, 9, 9, 2, darkOf(ROOF));
  s.rect(15, 9, 3, 2, fillOf(ACCENT_TWO));
}

const HATS: Record<SnowmanId, (s: Sketch) => void> = {
  snowmanTopHat: topHat,
  snowmanBobble: bobbleHat,
  snowmanWitch: witchHat,
};

/** Each hat's colours, over the snow, the carrot and the twigs they share. */
const HAT_COLOURS: Record<
  SnowmanId,
  { roof: string; trim: string; accentTwo: string; door: string }
> = {
  snowmanTopHat: { roof: C.furBlack, trim: C.bark, accentTwo: C.scarlet, door: C.scarlet },
  snowmanBobble: { roof: C.teal, trim: C.cream, accentTwo: C.cream, door: C.teal },
  snowmanWitch: { roof: C.plum, trim: C.bark, accentTwo: C.gold, door: C.berry },
};

/** The snow's own tones: the ramp's light and fill the drift's, its shade the drift's blue. */
const SNOW: Palette = (() => {
  const keys = [...WALL];
  const tones = [ramp(C.snowDeep)[0]!, C.snowDeep, C.snowShade, C.snow, C.snowLight];
  return Object.fromEntries(keys.map((k, i) => [k, tones[i]!]));
})();

function snowPalette(colours: { roof: string; trim: string; accentTwo: string; door: string }) {
  return {
    ...palette({ wall: C.snow, accent: C.pumpkin, stone: C.bark, ...colours }),
    ...SNOW,
  };
}

function snowmanSource(id: SnowmanId): SpriteSource {
  const s = snowmanBody();
  HATS[id](s);
  return finish(s);
}

export const SNOWMAN_ART: Record<SnowmanId, FurnitureArt> = {
  snowmanTopHat: {
    source: snowmanSource('snowmanTopHat'),
    palette: snowPalette(HAT_COLOURS.snowmanTopHat),
  },
  snowmanBobble: {
    source: snowmanSource('snowmanBobble'),
    palette: snowPalette(HAT_COLOURS.snowmanBobble),
  },
  snowmanWitch: {
    source: snowmanSource('snowmanWitch'),
    palette: snowPalette(HAT_COLOURS.snowmanWitch),
  },
};

/** The snowball she's rolling, at 32 on its tile: small, then bigger, on the tile's front edge. */
export const SNOWBALL_ART: readonly SpriteSource[] = [
  (() => {
    const s = new Sketch(32, 32);
    ball(s, 16, 25, 6, 5, WALL);
    s.set(13, 23, WHITE).set(19, 27, shadeOf(WALL));
    return finish(s);
  })(),
  (() => {
    const s = new Sketch(32, 32);
    ball(s, 16, 21, 10, 9, WALL);
    s.set(11, 17, WHITE).set(12, 17, WHITE).set(21, 26, shadeOf(WALL)).set(9, 24, shadeOf(WALL));
    return finish(s);
  })(),
];
export const SNOWBALL_PALETTE: Palette = snowPalette(HAT_COLOURS.snowmanTopHat);

/** The keepsakes' icons, at 16. */
export const SNOW_KEEPSAKE_ART: Record<SnowKeepsakeId, ItemArt> = {
  meltlessSnowman: (() => {
    const s = new Sketch(16, 16);
    s.sphere(8, 12, 4.5, 3.5, 'bcdw');
    s.sphere(8, 7, 3, 2.6, 'bcdw');
    s.rect(5, 2, 6, 1, 'h').rect(6, 0, 4, 2, 'h').rect(6, 1, 4, 1, 'r');
    s.set(7, 6, 'o').set(9, 6, 'o').set(9, 7, 'a').set(10, 7, 'a');
    s.rect(5, 9, 6, 1, 'r');
    s.set(8, 11, 'o').set(8, 13, 'o');
    s.outline({ b: 'O', c: 'O', d: 'O', w: 'O', h: 'o', r: 'R', a: 'R' });
    return {
      source: s.toSource(),
      palette: {
        '.': null,
        o: C.ink,
        O: C.snowDeep,
        b: C.snowDeep,
        c: C.snowShade,
        d: C.snow,
        w: C.snowLight,
        h: C.furBlack,
        r: C.scarlet,
        R: C.maroon,
        a: C.pumpkin,
      },
    };
  })(),
  rainbowJar: (() => {
    const s = new Sketch(16, 16);
    // A jam jar, its lid and the rainbow's bands curving across inside.
    s.rect(4, 4, 8, 11, 'g');
    s.rect(4, 2, 8, 2, 'l').rect(4, 2, 8, 1, 'L');
    const bands = ['1', '2', '3', '4', '5', '6'];
    bands.forEach((key, i) => {
      for (let x = 5; x < 11; x++) {
        const lift = Math.round(Math.abs(x - 7.5) * 0.6);
        s.set(x, 7 + i + lift - 1, key);
      }
    });
    s.rect(5, 5, 1, 3, 'G');
    s.outline({ g: 'o', l: 'o', L: 'o', '1': 'o', '6': 'o', G: 'o' });
    return {
      source: s.toSource(),
      palette: {
        '.': null,
        o: C.ink,
        g: C.sky,
        G: C.white,
        l: C.gold,
        L: C.candleBright,
        '1': C.scarlet,
        '2': C.pumpkin,
        '3': C.candle,
        '4': C.leaf,
        '5': C.teal,
        '6': C.lavender,
      },
    };
  })(),
};
