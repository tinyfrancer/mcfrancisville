import { PALETTE as C, ramp } from './palette';
import { CLEAR, Sketch } from './sketch';
import type { PotPlantId } from '../types/ids';
import type { Palette, SpriteSource } from './sprite';
import {
  ACCENT,
  ACCENT_TWO,
  LEAVES,
  buildingPalette,
  chimney,
  darkOf,
  door,
  type Drawn,
  fillOf,
  finish,
  footing,
  lightOf,
  lightWall,
  shadeOf,
  slopedRoof,
  step,
  wall,
  wallLamp,
  window,
} from './buildings';

/*
 * Her house and her yard at 32 pixels a tile (phase G): the plum house from the scale sheet the
 * user locked in, with the bat on its door, Skelly the twelve-foot skeleton standing in the yard,
 * and her potted mums by the door (personal_touches.md, "At the scale sheet", "After phase F").
 */

/** Her house: five tiles across, its roof overhanging the footprint and rising above it. */
export const HOUSE_W = 176;
export const HOUSE_H = 184;

/** The bat on her front door, wings spread across it like a wreath, eyes lit like the knob. */
const BAT = [
  'o..........o',
  'oo..o..o..oo',
  'ooo.oooo.ooo',
  'oooooYoYoooo',
  '.oooooooooo.',
  '..o..oo..o..',
];

function drawHerHouse(): Drawn {
  const s = new Sketch(HOUSE_W, HOUSE_H);
  const cx = HOUSE_W / 2;
  const floor = HOUSE_H - 6;
  // The chimney first, so the roof comes down over its foot.
  chimney(s, 124, 6, 14, 60);
  wall(s, 16, 92, HOUSE_W - 32, floor - 92, 'boards');
  lightWall(s, 16, 92, HOUSE_W - 32, floor - 92, 5);
  footing(s, 14, floor - 10, HOUSE_W - 28, 10);
  slopedRoof(s, cx, 16, 94, 88, HOUSE_W - 4, 'tiles');
  // A round attic window up in the roof, and two windows with flower boxes either side of the door.
  window(s, cx - 11, 42, 22, 22, { shape: 'round', panes: [2, 2] });
  window(s, 30, 110, 32, 30, { panes: [2, 2], box: true, curtains: true });
  window(s, HOUSE_W - 62, 110, 32, 30, { panes: [2, 2], box: true, curtains: true });
  const front = door(s, cx, floor, 36, 66, { shape: 'arch' });
  s.stamp({ rows: BAT }, cx - 6, floor - 50);
  wallLamp(s, cx + 24, floor - 50);
  step(s, cx, HOUSE_H, 46, 6);
  return { source: finish(s), door: front };
}

export const HER_HOUSE: Drawn = drawHerHouse();

export const HER_HOUSE_PALETTE: Palette = buildingPalette({
  wall: C.cream,
  roof: C.plum,
  trim: C.berry,
  door: C.berryLight,
  accent: C.roseLight,
  accentTwo: C.lavender,
  leaves: C.leaf,
});

// ---- Skelly --------------------------------------------------------------------------------

/**
 * Skelly, the twelve-foot skeleton in her yard (personal_touches.md): three of her tall, standing
 * with his arms out in front of him like a zombie, and grinning. Seen from the front, arms out
 * toward her means his hands come forward and down, so they're drawn foreshortened, reaching
 * out either side of his ribs at chest height.
 */
function drawSkelly(): SpriteSource {
  const s = new Sketch(96, 150);
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
  const cx = 58;
  // Legs, a little apart, and big friendly feet.
  bone(cx - 6, 92, cx - 7, 116, 5);
  bone(cx - 7, 116, cx - 8, 140, 5);
  bone(cx + 6, 92, cx + 7, 116, 5);
  bone(cx + 7, 116, cx + 8, 140, 5);
  s.ellipse(cx - 11, 144, 7, 3.5, 'b').ellipse(cx + 11, 144, 7, 3.5, 'b');
  // Hips, spine and ribs.
  s.ellipse(cx, 89, 12, 7, 'b')
    .ellipse(cx - 4, 89, 3, 3, 'h')
    .ellipse(cx + 4, 89, 3, 3, 'h');
  s.rect(cx - 2, 46, 4, 40, 'b');
  for (let i = 0; i < 4; i++) {
    const y = 52 + i * 7;
    const half = 13 - i;
    s.ellipse(cx, y + 3, half, 3.5, 'b').ellipse(cx, y + 4, half - 2, 2, 'h');
    s.rect(cx - 2, y, 4, 7, 'b');
  }
  s.rect(cx - 16, 45, 32, 4, 'b');
  // Arms out in front of him, like a zombie: both reach out to her door's side at shoulder
  // height, the near one straight out and the far one across his chest, hands dangling.
  bone(cx - 16, 48, cx - 46, 50, 4);
  bone(cx + 16, 48, cx - 4, 55, 4);
  bone(cx - 4, 55, cx - 40, 58, 4);
  for (const [hx, hy] of [
    [cx - 49, 51],
    [cx - 43, 59],
  ] as const) {
    s.ellipse(hx + 0.5, hy + 0.5, 3.5, 3, 'b');
    for (const f of [-2, 0, 2]) s.rect(hx + f, hy + 2, 1, f === 0 ? 5 : 4, 'b');
  }
  // The skull: big and round, with a jaw and a wide grin.
  s.ellipse(cx, 22, 15, 16, 'b').rect(cx - 8, 30, 16, 11, 'b');
  s.ellipse(cx - 6, 22, 4.5, 5, 'h').ellipse(cx + 6, 22, 4.5, 5, 'h');
  s.set(cx - 7, 20, 'g')
    .set(cx + 5, 20, 'g')
    .set(cx - 6, 20, 'g')
    .set(cx + 6, 20, 'g');
  s.ellipse(cx, 30, 1.5, 2, 'h');
  s.rect(cx - 7, 35, 14, 1, 'B');
  for (let x = cx - 6; x < cx + 7; x += 3) s.rect(x, 35, 1, 4, 'B');
  s.rect(cx - 7, 38, 14, 1, 'B');
  s.bevel('b', 'l', 'B');
  s.replace('h', CLEAR);
  s.replace('g', 'w');
  s.outline({ b: 'o', B: 'o', l: 'o' });
  return s.toSource();
}

export const SKELLY: SpriteSource = drawSkelly();

export const SKELLY_PALETTE: Palette = {
  [CLEAR]: null,
  o: ramp(C.bone)[0],
  B: ramp(C.bone)[1],
  b: C.bone,
  l: ramp(C.bone)[3],
  w: C.white,
};

// ---- Her potted plants -----------------------------------------------------------------------

/** How what's in a pot grows: a dome of blooms, a cluster of rosettes, or a mound of leaves. */
type PotShape = 'mums' | 'succulents' | 'hostas';

/**
 * A terracotta pot by her door, with what she has planted in it (personal_touches.md, "After
 * phase F"): mums to start. It sits up off the bottom of its tile, against the house, so the
 * sprite leaves the tile's lower rows clear.
 */
function drawPot(shape: PotShape): SpriteSource {
  const s = new Sketch(32, 40);
  // The pot: a rolled rim and a body narrowing to its foot.
  for (let y = 22; y < 34; y++) {
    const half = Math.round(9 - ((y - 22) / 12) * 3);
    s.rect(16 - half, y, half * 2, 1, fillOf(ACCENT));
  }
  s.rect(5, 19, 22, 4, lightOf(ACCENT)).rect(5, 22, 22, 1, shadeOf(ACCENT));
  s.bevel(fillOf(ACCENT), lightOf(ACCENT), shadeOf(ACCENT));
  if (shape === 'mums') mums(s);
  else if (shape === 'succulents') succulents(s);
  else hostas(s);
  s.outline((key) => {
    if (LEAVES.includes(key)) return darkOf(LEAVES);
    if (ACCENT.includes(key)) return darkOf(ACCENT);
    if (ACCENT_TWO.includes(key)) return darkOf(ACCENT_TWO);
    return null;
  });
  return s.toSource();
}

/** A dome of little florets, each a lit bloom round a darker heart, packed close. */
function mums(s: Sketch): void {
  s.ellipse(16, 15, 12, 9, shadeOf(ACCENT_TWO));
  for (let row = 0, y = 8; y < 24; row++, y += 3) {
    for (let x = 5 + (row % 2) * 2; x < 28; x += 4) {
      if (s.get(x, y) !== shadeOf(ACCENT_TWO)) continue;
      const lit = x + y < 30;
      s.set(x, y - 1, lit ? lightOf(ACCENT_TWO) : fillOf(ACCENT_TWO));
      s.set(x - 1, y, fillOf(ACCENT_TWO)).set(x + 1, y, fillOf(ACCENT_TWO));
      s.set(x, y + 1, fillOf(ACCENT_TWO)).set(x, y, darkOf(ACCENT_TWO));
    }
  }
  for (const x of [6, 11, 20, 25]) s.rect(x, 19, 2, 2, fillOf(LEAVES));
}

/** Three plump rosettes, leaves fanning out from a pale heart. */
function succulents(s: Sketch): void {
  for (const [cx, cy, r] of [
    [10, 17, 5],
    [22, 17, 5],
    [16, 12, 6],
  ] as const) {
    s.ellipse(cx + 0.5, cy + 0.5, r + 0.5, r - 0.5, shadeOf(LEAVES));
    for (let k = 0; k < 8; k++) {
      const a = (k / 8) * Math.PI * 2;
      const x = Math.round(cx + Math.cos(a) * (r - 1));
      const y = Math.round(cy + Math.sin(a) * (r - 2));
      s.set(x, y, fillOf(LEAVES)).set(
        Math.round(cx + Math.cos(a) * r),
        Math.round(cy + Math.sin(a) * (r - 1)),
        lightOf(LEAVES),
      );
    }
    s.ellipse(cx + 0.5, cy + 0.5, 2, 1.5, lightOf(LEAVES)).set(cx, cy, fillOf(ACCENT_TWO));
  }
}

/** A fan of broad hosta leaves from the pot's middle, each with a pale edge, like the farm's. */
function hostas(s: Sketch): void {
  const base = { x: 16, y: 21 };
  for (const degrees of [-75, 75, -40, 40, 0]) {
    const a = (degrees * Math.PI) / 180;
    const along = { x: Math.sin(a), y: -Math.cos(a) };
    const across = { x: -along.y, y: along.x };
    const length = degrees === 0 ? 13 : 12;
    for (let t = 0; t <= 1; t += 0.03) {
      const half = Math.sin(Math.PI * Math.min(1, t * 1.15)) * 4;
      for (let k = -Math.ceil(half); k <= Math.ceil(half); k++) {
        const x = Math.round(base.x + along.x * length * t + across.x * k);
        const y = Math.round(base.y + along.y * length * t + across.y * k);
        const edge = half > 2.5 && Math.abs(k) >= Math.ceil(half);
        s.set(x, y, edge ? fillOf(ACCENT_TWO) : k > 0 ? shadeOf(LEAVES) : fillOf(LEAVES));
      }
      if (t > 0.15 && t < 0.85) {
        s.set(
          Math.round(base.x + along.x * length * t),
          Math.round(base.y + along.y * length * t),
          lightOf(LEAVES),
        );
      }
    }
  }
}

/** Each plant she can put in her pots: its shape, and the terracotta and colours it's drawn in. */
export const POT_ART: Record<PotPlantId, { source: SpriteSource; palette: Palette }> = {
  mums: { source: drawPot('mums'), palette: potPalette(C.pumpkin, C.leaf) },
  plumMums: { source: drawPot('mums'), palette: potPalette(C.lavenderShade, C.leaf) },
  succulents: { source: drawPot('succulents'), palette: potPalette(C.roseLight, C.hostaBlueLight) },
  hostas: { source: drawPot('hostas'), palette: potPalette(C.hostaCream, C.hostaBlue) },
};

function potPalette(bloom: string, leaves: string): Palette {
  return buildingPalette({
    wall: C.cream,
    roof: C.plum,
    trim: C.wood,
    door: C.wood,
    accent: C.pumpkinDark,
    accentTwo: bloom,
    leaves,
  });
}
