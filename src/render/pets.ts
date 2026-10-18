import { TILE_SIZE } from '../config/world';
import { PETS } from '../data/pets';
import { bake } from '../sprites/bake';
import { DOG_BONE, ITEM_ART } from '../sprites/items';
import { PALETTE } from '../sprites/palette';
import {
  accessoryIcon,
  BUBBLE_ART,
  PET_ART,
  petPalette,
  petSource,
  trickStep,
  type PetFrame,
} from '../sprites/pets';
import { dayKey } from '../systems/clock';
import { stinky } from '../systems/pets';
import type { AccessoryId, PetId } from '../types/ids';
import type { Pet } from '../world/Pet';
import type { World } from '../world/World';
import type { Point } from './camera';
import { bakeIcon } from './items';
import { glowOf, type Drawable } from './scene';

/** How long each of a pet's trotting frames shows: quicker little steps than hers. */
const TROT_FRAME_MS = 110;
/** How see-through a ghost pet is. */
const GHOST_ALPHA = 0.72;

/** How a pet is drawn this frame: its grid, turned round or not, lifted, moved along, and how solid. */
interface Look {
  frame: PetFrame;
  flip: boolean;
  /** Pixels up off the ground: a perch on the bed, a leap in its trick. */
  lift: number;
  dx: number;
  alpha: number;
}

/** Which grid a pet is drawn from, for what it's doing now, and how (V1's R6c's tricks too). */
function lookOf(pet: Pet, now: number): Look {
  const lift = pet.perch?.lift ?? 0;
  const facingLeft = pet.facing === 'left';
  const done = pet.pose === 'trick' ? pet.trickDone(now) : null;
  if (done !== null) {
    const step = trickStep(pet.id, done);
    const sits = step.frame === 'sitFront' || step.frame === 'sitBack';
    return {
      frame: step.frame,
      flip: !sits && (step.flip ? !facingLeft : facingLeft),
      lift: lift + (step.lift ?? 0),
      dx: (step.dx ?? 0) * (facingLeft ? -1 : 1),
      alpha: step.alpha ?? 1,
    };
  }
  let frame: PetFrame = 'side0';
  if (pet.pose === 'walk' && pet.moving) {
    frame = Math.floor(pet.walkMs / TROT_FRAME_MS) % 2 === 0 ? 'side1' : 'side0';
  } else if (pet.pose === 'sit') frame = pet.looking === 'back' ? 'sitBack' : 'sitFront';
  else if (pet.pose === 'sleep' || pet.pose === 'curl') frame = 'rest';
  // Sitting, they face her or the room; walking or curled, the way they're facing.
  const sits = frame === 'sitFront' || frame === 'sitBack';
  return { frame, flip: !sits && facingLeft, lift, dx: 0, alpha: 1 };
}

/** A pet in its accessory, baked once for each frame, way and accessory. */
export function bakePet(
  id: PetId,
  frame: PetFrame,
  accessory: AccessoryId | null,
  flip = false,
): HTMLCanvasElement {
  const key = `pet:${id}:${frame}:${accessory ?? 'none'}:${flip ? 'l' : 'r'}`;
  return bake(key, petSource(id, frame), petPalette(id, accessory), { flipX: flip });
}

/** A pet's feet sit this far below the middle of its tile. */
const PAWS_BELOW_CENTRE = 12;
/** How far in front of a bed's or a sofa's front edge a pet up on it is drawn, by depth. */
const PERCHED_IN_FRONT = 6;

/**
 * A pet where it stands, with its shadow. A ghost pet floats a little, bobbing, is see-through,
 * and glows softly after dark (decisions.md 17).
 */
export function petDrawable(pet: Pet, world: World, nowMs: number): Drawable {
  const look = lookOf(pet, world.clock.now());
  const { frame, flip } = look;
  const accessory = world.pets.wearing(pet.id);
  const sprite = bakePet(pet.id, frame, accessory, flip);
  const ghost = PETS[pet.id].ghost;
  // Up on the bed or a sofa, it's drawn in front of what it's sitting on.
  const footY = Math.round(pet.y) + PAWS_BELOW_CENTRE + (pet.perch ? PERCHED_IN_FRONT : 0);
  const x = Math.round(pet.x) + look.dx;
  const lift = (ghost ? 4 + Math.round(Math.sin(nowMs / 500 + x) * 2) : 0) + look.lift;
  const ground = Math.round(pet.y) + PAWS_BELOW_CENTRE;
  const d: Drawable = {
    footY,
    sprite,
    x: x - Math.floor(sprite.width / 2),
    y: ground - sprite.height - lift,
    shadow: { cx: x, cy: ground - 2 - (pet.perch?.lift ?? 0), w: Math.min(sprite.width, 28), h: 6 },
  };
  if (look.alpha < 1) d.alpha = look.alpha;
  const glow = PET_ART[pet.id].glow;
  if (ghost && glow) {
    d.alpha = GHOST_ALPHA * look.alpha;
    const key = `glow:pet:${pet.id}:${frame}:${flip ? 'l' : 'r'}`;
    d.glow = glowOf(key, petSource(pet.id, frame), petPalette(pet.id, accessory), glow, {
      flipX: flip,
    });
  }
  return d;
}

/** Fibi's bone, where she left it today, lying on the ground. */
export function boneDrawable(tx: number, ty: number): Drawable {
  const sprite = bakeIcon('item:fibisBone', DOG_BONE, ITEM_ART.fibisBone.palette);
  const x = tx * TILE_SIZE;
  const y = ty * TILE_SIZE + 6;
  return { footY: ty * TILE_SIZE + 4, sprite, x, y };
}

/**
 * What the pets are saying, over everything: a bark, a whine, a "…", a heart or a nap's Zs; and
 * the little green wiggles of a smelly one.
 */
export function drawPetBubbles(
  ctx: CanvasRenderingContext2D,
  pets: readonly Pet[],
  world: World,
  cam: Point,
  nowMs: number,
): void {
  const now = world.clock.now();
  const happy = world.pets.fibiHappy(dayKey(now));
  for (const pet of pets) {
    const look = lookOf(pet, now);
    const x = Math.round(pet.x) + look.dx - cam.x;
    const tall = bakePet(pet.id, look.frame, null).height;
    const top = Math.round(pet.y) + PAWS_BELOW_CENTRE - cam.y - tall - look.lift;
    if (stinky(pet.id, now)) drawStink(ctx, x - 16, top + 4, nowMs);
    const bubble = pet.bubble(now, pet.id === 'fibi' && happy);
    if (!bubble) continue;
    const art = BUBBLE_ART[bubble];
    const sprite = bakeIcon(`bubble:${bubble}`, art.source, art.palette);
    const rise = bubble === 'zzz' ? 2 * (Math.floor(nowMs / 400) % 3) : 0;
    ctx.drawImage(sprite, x + 4, top - sprite.height - rise);
  }
}

/** Three little wavy lines, rising. Never gross: just a pet being a pet. */
function drawStink(ctx: CanvasRenderingContext2D, x: number, y: number, nowMs: number): void {
  const step = Math.floor(nowMs / 250) % 2;
  ctx.globalAlpha = 0.8;
  ctx.fillStyle = PALETTE.guac;
  const px = 2;
  for (let i = 0; i < 3; i++) {
    const cx = x + i * 6;
    for (let j = 0; j < 5; j++) {
      const wiggle = (j + step + i) % 2;
      ctx.fillRect(cx + wiggle * 2, y - j * 2, px, px);
    }
  }
  ctx.globalAlpha = 1;
}

/** A pet sitting, dressed as it is, into a canvas of the HUD's at 1×: the pet sheet's portrait. */
export function drawPetPortrait(
  canvas: HTMLCanvasElement,
  id: PetId,
  accessory: AccessoryId | null,
): void {
  const sprite = bakePet(id, 'sitFront', accessory);
  const size = 32;
  canvas.width = size;
  canvas.height = size;
  const ctx = canvas.getContext('2d');
  if (!ctx) return;
  ctx.imageSmoothingEnabled = false;
  ctx.clearRect(0, 0, size, size);
  if (PETS[id].ghost) ctx.globalAlpha = 0.8;
  ctx.drawImage(sprite, Math.floor((size - sprite.width) / 2), size - sprite.height);
  ctx.globalAlpha = 1;
}

/** An accessory on its own, for the shop and the pet sheet, at 1×. */
export function drawAccessoryIcon(canvas: HTMLCanvasElement, id: AccessoryId): void {
  const { source, palette } = accessoryIcon(id);
  const sprite = bake(`accessory:${id}`, source, palette);
  canvas.width = sprite.width;
  canvas.height = sprite.height;
  const ctx = canvas.getContext('2d');
  if (!ctx) return;
  ctx.clearRect(0, 0, canvas.width, canvas.height);
  ctx.drawImage(sprite, 0, 0);
}
