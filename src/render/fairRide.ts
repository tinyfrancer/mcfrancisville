import { PETS } from '../data/pets';
import type { Weather } from '../data/weather';
import { bake } from '../sprites/bake';
import { DOLL_HEIGHT, SIT_DROP, SIT_FROM } from '../sprites/doll';
import {
  BAND_W,
  FAIR_GROUND,
  FAR_HORIZON,
  HANGER,
  RIDE_BULBS,
  RIDE_FAIR,
  RIDE_FAR,
  RIDE_GLOW,
  RIDE_H,
  RIDE_PALETTE,
  RIDE_TOWN,
  RIDE_TUB,
  RIDE_W,
  RIDE_YOKE,
  TUB,
} from '../sprites/fairRide';
import { NIGHT } from '../sprites/stars';
import { PALETTE as C } from '../sprites/palette';
import type { Palette, SpriteSource } from '../sprites/sprite';
import type { Costume } from '../sprites/villagers';
import { moonAge } from '../systems/calendar';
import { daylight, type Sky } from '../systems/clock';
import type { RideAt } from '../systems/fairRide';
import { hashString, seeded } from '../systems/random';
import { seasonOf } from '../systems/seasons';
import type { AccessoryId, BraceletId, Facing, PetId, VillagerId } from '../types/ids';
import type { Look } from '../types/look';
import { bakeDoll } from './doll';
import { gradeOf, SEASON_LIGHT } from './grade';
import { bakePet } from './pets';
import { drawMoon } from './title';
import { bakeFigure } from './villagers';

/*
 * A ride on the big wheel, drawn (1.6's X2, decision 381) on its sheet's stage, as the fair games
 * are: her car from behind with whoever rides along, the wheel's rim and spokes turning round it,
 * and the view sliding past in three bands as she rises (the fair dropping away below, the town's
 * roofs coming up behind it, the hills and the castle on the horizon), lit by the hour as the world
 * is, its windows and bulbs glowing after dark, and the sky's moon and stars or drifting clouds.
 * Only drawing: how far round she is and who's with her are the world's (`world.activities`).
 */

/** What the stage shows now. */
export interface RideView {
  day: string;
  /** The hour by the clock, for the light and the sky. */
  hour: number;
  nowMs: number;
  weather: Weather;
  look: Look;
  /** How far round she is, or null with her not in the car (it waits at the bottom). */
  at: RideAt | null;
  /** Who's with her, dressed as they are about the fair. */
  with: { id: VillagerId; costume: Costume | null; wears: BraceletId | null } | null;
  /** The pet walking with her, waiting at the wheel's foot. */
  pet: { id: PetId; accessory: AccessoryId | null } | null;
}

/** The wheel's radius on the stage: big, so only the arc round her car is in view. */
const RIM_R = 150;

/** How far each band slides sideways as her car swings out round the wheel, near to far. */
const SWAY = { fair: 14, town: 6, far: 2 } as const;

/** Where the horizon is, from the ground to the top: she looks down over the town as she rises. */
const horizonAt = (lift: number) => Math.round(58 - 28 * lift);
/** Where the fair's band begins: right behind her on the ground, dropping out of view below. */
const fairAt = (lift: number) => Math.round(30 + 62 * lift);

/** The sky's bands from the top down, at each of the day's skies. */
const SKY_BANDS: Record<Sky, readonly string[]> = {
  night: NIGHT.bands,
  moonlit: [C.night, C.dusk, C.plum],
  dawn: [C.dusk, C.plumLight, C.roseLight],
  day: [C.skyShade, C.sky, C.ghost],
  golden: [C.sky, C.roseLight, C.candle],
  dusk: [C.ink, C.plum, C.rose],
};

const NIGHTS: readonly Sky[] = ['night', 'moonlit', 'dusk'];

const plot = (ctx: CanvasRenderingContext2D, x: number, y: number, colour: string) => {
  ctx.fillStyle = colour;
  ctx.fillRect(x, y, 1, 1);
};

/** A sky's bands dithered into each other, cached a sky (and a night's moon) at a time. */
const skies = new Map<string, HTMLCanvasElement>();
function skyOf(sky: Sky, day: string): HTMLCanvasElement {
  const night = NIGHTS.includes(sky) && sky !== 'dusk';
  const key = night ? `${sky}:${day}` : sky;
  const known = skies.get(key);
  if (known) return known;
  const canvas = document.createElement('canvas');
  canvas.width = RIDE_W;
  canvas.height = RIDE_H;
  const ctx = canvas.getContext('2d')!;
  const bands = SKY_BANDS[sky];
  // The bands go down to where the horizon is at its lowest, and the last carries on below.
  const step = 64 / bands.length;
  for (let y = 0; y < RIDE_H; y++) {
    const at = y / step;
    const band = Math.min(bands.length - 1, Math.floor(at));
    const near = at - band > 0.75 && band < bands.length - 1;
    for (let x = 0; x < RIDE_W; x++) {
      plot(ctx, x, y, bands[near && (x + y) % 2 === 0 ? band + 1 : band]!);
    }
  }
  if (night) drawMoon(ctx, moonAge(day), { x: 80, y: 13, r: 6 });
  if (skies.size > 8) skies.clear();
  skies.set(key, canvas);
  return canvas;
}

/** The night's field of stars, the same every night, each twinkling in its own time. */
const STARS = (() => {
  const random = seeded(hashString('ride-stars'));
  return Array.from({ length: 34 }, () => ({
    x: Math.floor(random() * RIDE_W),
    y: Math.floor(random() * 50),
    tone: random() < 0.2 ? C.candle : random() < 0.5 ? C.ghost : C.lavender,
    phase: Math.floor(random() * 5000),
  }));
})();

/** Two clouds drifting by in the day, a pixel at a time. */
function drawClouds(ctx: CanvasRenderingContext2D, nowMs: number): void {
  for (const [y, w, speed, from] of [
    [10, 14, 260, 0],
    [24, 10, 380, 60],
  ] as const) {
    const x = Math.floor((nowMs / speed + from) % (RIDE_W + w * 2)) - w;
    ctx.fillStyle = C.white;
    ctx.fillRect(x + 2, y, w - 4, 1);
    ctx.fillRect(x, y + 1, w, 2);
    ctx.fillRect(x + 3, y - 1, w / 2, 1);
    ctx.fillStyle = C.ghost;
    ctx.fillRect(x + 1, y + 3, w - 2, 1);
  }
}

/** A palette with its bulbs moved round one, so the strings chase after dark. */
function chased(palette: Palette, by: number): Palette {
  const moved = RIDE_BULBS.map((key, i) => [
    key,
    palette[RIDE_BULBS[(i + by) % RIDE_BULBS.length]!] ?? null,
  ]);
  return { ...palette, ...Object.fromEntries(moved) };
}

/** Scratch canvases for lighting what's drawn, as the world's light map does, a pass at a time. */
let scratch: { art: HTMLCanvasElement; mask: HTMLCanvasElement } | null = null;
function scratchOf(): { art: HTMLCanvasElement; mask: HTMLCanvasElement } {
  if (!scratch) {
    const make = () => {
      const c = document.createElement('canvas');
      c.width = RIDE_W;
      c.height = RIDE_H;
      return c;
    };
    scratch = { art: make(), mask: make() };
  }
  return scratch;
}

/**
 * Draws `paint` onto the stage lit by `light` (multiplied over it, as the world's light is), and
 * nothing where it painted nothing.
 */
function lit(
  ctx: CanvasRenderingContext2D,
  light: string,
  paint: (c: CanvasRenderingContext2D) => void,
): void {
  const { art, mask } = scratchOf();
  const a = art.getContext('2d')!;
  const m = mask.getContext('2d')!;
  a.imageSmoothingEnabled = false;
  a.globalCompositeOperation = 'source-over';
  a.clearRect(0, 0, RIDE_W, RIDE_H);
  paint(a);
  m.globalCompositeOperation = 'source-over';
  m.clearRect(0, 0, RIDE_W, RIDE_H);
  m.fillStyle = light;
  m.fillRect(0, 0, RIDE_W, RIDE_H);
  m.globalCompositeOperation = 'destination-in';
  m.drawImage(art, 0, 0);
  a.globalCompositeOperation = 'multiply';
  a.drawImage(mask, 0, 0);
  a.globalCompositeOperation = 'source-over';
  ctx.drawImage(art, 0, 0);
}

const hex = (rgb: readonly number[]) =>
  `#${rgb.map((n) => Math.round(n).toString(16).padStart(2, '0')).join('')}`;

/** The wheel's rim, its inner ring, its spokes and its bulbs, round a hub somewhere off the stage. */
function drawRim(
  ctx: CanvasRenderingContext2D,
  hub: { x: number; y: number },
  turned: number,
  bulbs: ((x: number, y: number, k: number) => void) | null,
): void {
  const inside = (x: number, y: number) => x >= 0 && y >= 0 && x < RIDE_W && y < RIDE_H;
  ctx.fillStyle = C.silver;
  for (let k = 0; k < 16; k++) {
    const a = turned + (k / 16) * Math.PI * 2;
    for (let d = 8; d < RIM_R - 4; d++) {
      const x = Math.round(hub.x + Math.cos(a) * d);
      const y = Math.round(hub.y + Math.sin(a) * d);
      if (inside(x, y)) ctx.fillRect(x, y, 1, 1);
    }
  }
  const steps = Math.ceil(RIM_R * Math.PI * 2);
  for (let t = 0; t < steps; t++) {
    const a = (t / steps) * Math.PI * 2;
    for (const [r, colour] of [
      [RIM_R, C.cream],
      [RIM_R - 1, C.creamShade],
      [RIM_R - 5, C.cream],
    ] as const) {
      const x = Math.round(hub.x + Math.cos(a) * r);
      const y = Math.round(hub.y + Math.sin(a) * r);
      if (inside(x, y)) plot(ctx, x, y, colour);
    }
  }
  const count = 64;
  for (let k = 0; k < count; k++) {
    const a = turned + (k / count) * Math.PI * 2 + Math.PI / count;
    const x = Math.round(hub.x + Math.cos(a) * (RIM_R - 3) - 0.5);
    const y = Math.round(hub.y + Math.sin(a) * (RIM_R - 3) - 0.5);
    if (x < -2 || y < -2 || x > RIDE_W || y > RIDE_H) continue;
    if (bulbs) bulbs(x, y, k);
    else {
      ctx.fillStyle = RIDE_PALETTE[RIDE_BULBS[k % RIDE_BULBS.length]!]!;
      ctx.fillRect(x, y, 2, 2);
    }
  }
}

/** Her, or whoever rides with her, sat in the car facing `facing`, their hips at the tub's lip. */
function seated(sprite: HTMLCanvasElement, cx: number): { x: number; y: number } {
  const hips = sprite.height - DOLL_HEIGHT + SIT_FROM + SIT_DROP;
  return { x: Math.round(cx - sprite.width / 2), y: TUB.y + 6 - hips };
}

/** Draws the ride as it is now into a canvas of the sheet's, at the art's own pixels. */
export function drawRide(canvas: HTMLCanvasElement, view: RideView): void {
  if (canvas.width !== RIDE_W) canvas.width = RIDE_W;
  if (canvas.height !== RIDE_H) canvas.height = RIDE_H;
  const ctx = canvas.getContext('2d');
  if (!ctx) return;
  ctx.imageSmoothingEnabled = false;
  const at = view.at;
  const turn = at?.turn ?? 0;
  const lift = at?.lift ?? 0;
  const { nowMs } = view;
  const light = daylight(view.hour);
  const sky = light.t < 0.5 ? light.from : light.to;
  const tint = view.weather === 'rain' ? C.skyRain : view.weather === 'fog' ? C.skyFog : null;
  const grade = gradeOf(light, tint, 0, false, SEASON_LIGHT[seasonOf(view.day)]);
  const shade = hex(grade.light);
  const lamps = light.lamps;

  // The sky, its stars at night or clouds by day.
  ctx.drawImage(skyOf(sky, view.day), 0, 0);
  if (NIGHTS.includes(sky) && view.weather === 'clear') {
    for (const s of STARS) {
      if (Math.hypot(s.x - 80, s.y - 13) < 9) continue;
      plot(ctx, s.x, s.y, (nowMs + s.phase) % 5000 < 350 ? C.white : s.tone);
    }
  } else if (!NIGHTS.includes(sky)) drawClouds(ctx, nowMs);

  // The view: three bands sliding past each other as the car swings round and up.
  const swing = Math.sin(turn * Math.PI * 2);
  const left = (RIDE_W - BAND_W) / 2;
  const horizon = horizonAt(lift);
  const bands: { key: string; source: SpriteSource; x: number; y: number }[] = [
    {
      key: 'far',
      source: RIDE_FAR,
      x: Math.round(left + SWAY.far * swing),
      y: horizon - FAR_HORIZON,
    },
    { key: 'town', source: RIDE_TOWN, x: Math.round(left + SWAY.town * swing), y: horizon - 6 },
    { key: 'fair', source: RIDE_FAIR, x: Math.round(left + SWAY.fair * swing), y: fairAt(lift) },
  ];
  const fair = bands[2]!;
  lit(ctx, shade, (c) => {
    for (const b of bands) c.drawImage(bake(`ride:${b.key}`, b.source, RIDE_PALETTE), b.x, b.y);
    // Her pet waits at the wheel's foot, hopping as she comes down to it.
    if (view.pet) {
      const sprite = bakePet(view.pet.id, 'sitFront', view.pet.accessory);
      const hop = at && lift < 0.2 && Math.floor(nowMs / 260) % 3 === 0 ? 1 : 0;
      const foot = fair.y + FAIR_GROUND;
      c.globalAlpha = PETS[view.pet.id].ghost ? 0.75 : 1;
      c.drawImage(sprite, Math.round(fair.x + 108 - sprite.width / 2), foot - sprite.height - hop);
      c.globalAlpha = 1;
    }
  });
  // What's lit after dark: the town's windows, the lanterns, and the fair's bulbs chasing.
  if (lamps > 0) {
    ctx.globalAlpha = lamps;
    const by = Math.floor(nowMs / 450) % RIDE_BULBS.length;
    for (const b of bands) {
      ctx.drawImage(bake(`ride:${b.key}:glow:${by}`, b.source, chased(RIDE_GLOW, by)), b.x, b.y);
    }
    ctx.globalAlpha = 1;
  }

  // The wheel round her car: the car hangs at its rim, the hub off the stage.
  const point = Math.PI / 2 + turn * Math.PI * 2;
  const hub = {
    x: HANGER.x - Math.cos(point) * RIM_R,
    y: HANGER.y - Math.sin(point) * RIM_R,
  };
  const turned = point;
  lit(ctx, shade, (c) => drawRim(c, hub, turned, null));
  if (lamps > 0) {
    ctx.globalAlpha = lamps;
    const twinkle = Math.floor(nowMs / 300);
    drawRim(ctx, hub, turned, (x, y, k) => {
      const key = RIDE_BULBS[k % RIDE_BULBS.length]!;
      ctx.fillStyle = (k + twinkle) % 5 === 0 ? RIDE_PALETTE[key]! : RIDE_GLOW[key]!;
      ctx.fillRect(x, y, 2, 2);
    });
    ctx.globalAlpha = 1;
  }

  // Her car, from behind: the yoke, who's in it, and the tub, rocking a pixel as it goes.
  const rock = at && at.part !== 'done' ? Math.round(Math.sin(nowMs / 700) * 0.6) : 0;
  lit(ctx, shade, (c) => {
    c.drawImage(bake('ride:yoke', RIDE_YOKE, RIDE_PALETTE), 0, 0);
    if (at && at.part !== 'done') {
      // At the top they turn to each other; alone, she looks out over it all.
      const top = at.part === 'top';
      const together = view.with !== null;
      const herFacing: Facing = top && together ? 'right' : 'up';
      const her = bakeDoll(view.look, herFacing, 0, 'sit');
      const herAt = seated(her, together ? 33 : 48);
      c.drawImage(her, herAt.x + rock, herAt.y);
      if (view.with) {
        const { id, costume, wears } = view.with;
        const theirs = bakeFigure(id, top ? 'left' : 'up', 0, costume, wears, {
          sit: true,
          ...(top ? { feel: 'happy' as const } : {}),
        });
        const theirAt = seated(theirs, 64);
        c.drawImage(theirs, theirAt.x + rock, theirAt.y);
      }
    }
    c.drawImage(bake('ride:tub', RIDE_TUB, RIDE_PALETTE), TUB.x + rock, TUB.y);
  });
}
