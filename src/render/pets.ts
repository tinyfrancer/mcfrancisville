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
  type PetFrame,
} from '../sprites/pets';
import { dayKey } from '../systems/clock';
import { stinky } from '../systems/pets';
import type { AccessoryId, PetId } from '../types/ids';
import type { Pet } from '../world/Pet';
import type { Town } from '../world/Town';
import type { Point } from './camera';
import { glowOf, type Drawable } from './scene';

/** How long each of a pet's trotting frames shows: quicker little steps than hers. */
const TROT_FRAME_MS = 110;
/** How see-through a ghost pet is. */
const GHOST_ALPHA = 0.72;

/** Which grid a pet is drawn from, for what it's doing now. */
function frameOf(pet: Pet): PetFrame {
  if (pet.pose === 'walk' && pet.moving) {
    return Math.floor(pet.walkMs / TROT_FRAME_MS) % 2 === 0 ? 'side1' : 'side0';
  }
  if (pet.pose === 'sit') return 'sit';
  if (pet.pose === 'sleep' || pet.pose === 'curl') return 'rest';
  return 'side0';
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

/**
 * A pet where it stands, with its shadow. A ghost pet floats a little, bobbing, is see-through,
 * and glows softly after dark (decisions.md 17).
 */
export function petDrawable(pet: Pet, town: Town, nowMs: number): Drawable {
  const frame = frameOf(pet);
  // Sitting and curled up, they face her; walking, they face the way they're going.
  const flip = frame !== 'sit' && pet.facing === 'left';
  const accessory = town.pets.wearing(pet.id);
  const sprite = bakePet(pet.id, frame, accessory, flip);
  const ghost = PETS[pet.id].ghost;
  const footY = Math.round(pet.y) + 6;
  const x = Math.round(pet.x);
  const lift = ghost ? 2 + Math.round(Math.sin(nowMs / 500 + x)) : 0;
  const d: Drawable = {
    footY,
    sprite,
    x: x - Math.floor(sprite.width / 2),
    y: footY - sprite.height - lift,
    shadow: { cx: x, cy: footY - 1, w: Math.min(sprite.width, 14), h: 3 },
  };
  const glow = PET_ART[pet.id].glow;
  if (ghost && glow) {
    d.alpha = GHOST_ALPHA;
    const key = `glow:pet:${pet.id}:${frame}:${flip ? 'l' : 'r'}`;
    d.glow = glowOf(key, petSource(pet.id, frame), petPalette(pet.id, accessory), glow, {
      flipX: flip,
    });
  }
  return d;
}

/** Fibi's bone, where she left it today, lying on the ground. */
export function boneDrawable(tx: number, ty: number): Drawable {
  const sprite = bake('item:fibisBone', DOG_BONE, ITEM_ART.fibisBone.palette);
  const x = tx * TILE_SIZE;
  const y = ty * TILE_SIZE + 3;
  return { footY: ty * TILE_SIZE + 2, sprite, x, y };
}

/**
 * What the pets are saying, over everything: a bark, a whine, a "…", a heart or a nap's Zs; and
 * the little green wiggles of a smelly one.
 */
export function drawPetBubbles(
  ctx: CanvasRenderingContext2D,
  pets: readonly Pet[],
  town: Town,
  cam: Point,
  nowMs: number,
): void {
  const now = town.clock.now();
  const happy = town.pets.fibiHappy(dayKey(now));
  for (const pet of pets) {
    const x = Math.round(pet.x) - cam.x;
    const top = Math.round(pet.y) + 6 - cam.y - bakePet(pet.id, frameOf(pet), null).height;
    if (stinky(pet.id, now)) drawStink(ctx, x - 8, top + 2, nowMs);
    const bubble = pet.bubble(now, pet.id === 'fibi' && happy);
    if (!bubble) continue;
    const art = BUBBLE_ART[bubble];
    const sprite = bake(`bubble:${bubble}`, art.source, art.palette);
    const rise = bubble === 'zzz' ? Math.floor(nowMs / 400) % 3 : 0;
    ctx.drawImage(sprite, x + 2, top - sprite.height - rise);
  }
}

/** Three little wavy lines, rising. Never gross: just a pet being a pet. */
function drawStink(ctx: CanvasRenderingContext2D, x: number, y: number, nowMs: number): void {
  const step = Math.floor(nowMs / 250) % 2;
  ctx.globalAlpha = 0.8;
  ctx.fillStyle = PALETTE.guac;
  for (let i = 0; i < 3; i++) {
    const cx = x + i * 3;
    for (let j = 0; j < 5; j++) {
      const wiggle = (j + step + i) % 2;
      ctx.fillRect(cx + wiggle, y - j, 1, 1);
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
  const sprite = bakePet(id, 'sit', accessory);
  canvas.width = 16;
  canvas.height = 16;
  const ctx = canvas.getContext('2d');
  if (!ctx) return;
  ctx.imageSmoothingEnabled = false;
  ctx.clearRect(0, 0, 16, 16);
  if (PETS[id].ghost) ctx.globalAlpha = 0.8;
  ctx.drawImage(sprite, Math.floor((16 - sprite.width) / 2), 16 - sprite.height);
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
