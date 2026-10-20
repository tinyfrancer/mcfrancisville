import { TILE_SIZE } from '../../config/world';
import type { SeasonId } from '../../data/seasons';
import { bake } from '../../sprites/bake';
import { PROP_ART } from '../../sprites/props';
import { seasonLook } from '../../sprites/seasons';
import type { Palette, SpriteSource } from '../../sprites/sprite';
import type { PlacedProp } from '../../systems/grid';
import type { PropId } from '../../types/ids';
import { framed, phaseAt, type Moving } from '../frames';
import { glowOf, type Drawable, type WorldLight } from '../scene';

/** A prop that moves on its own, as it's looked up where it stands (V1's E5). */
export function movingOf(
  prop: { id: PropId; tx: number; ty: number },
  source: SpriteSource,
  palette: Palette,
  key: string,
): Moving {
  const art = PROP_ART[prop.id];
  const frames = art.frames!;
  const m: Moving = {
    frames,
    source,
    palette,
    key,
    phase: phaseAt(prop.tx, prop.ty, frames.period),
  };
  if (art.glow) m.glow = art.glow;
  return m;
}

/** A drawable in the frame its thing is at now: its picture, and what of it glows. */
export function moved(d: Drawable, m: Moving, nowMs: number): Drawable {
  const { sprite, glow } = framed(m, nowMs);
  const at: Drawable = { ...d, sprite };
  if (glow) at.glow = glow;
  return at;
}

/** The shadow a stall casts where it stands today, from its art's shadow. */
export function shadowOf(cx: number, footY: number, shadow: { w: number; h: number; dy?: number }) {
  return { cx, cy: footY - 2 - (shadow.dy ?? 0), w: shadow.w, h: shadow.h };
}

/**
 * Something that comes and goes, baked once in the season's look; like the pop-up, its shadow is
 * drawn with it. With the clock, in the frame it's at if it moves (V1's E5).
 */
export function standing(p: PlacedProp, season: SeasonId, nowMs?: number): Drawable {
  const art = PROP_ART[p.id];
  const { source, palette, form, key } = seasonLook(p, season);
  const sprite = bake(key, source, palette);
  const footY = (p.ty + p.h) * TILE_SIZE;
  const x = p.tx * TILE_SIZE + (p.w * TILE_SIZE - sprite.width) / 2;
  const d: Drawable = {
    footY,
    sprite,
    x,
    y: footY - sprite.height,
    shadow: shadowOf(x + sprite.width / 2, footY, art.shadow),
  };
  if (art.glow) d.glow = glowOf(`glow:${p.id}:${form}`, source, art.palette, art.glow);
  if (!art.frames || nowMs === undefined) return d;
  return moved(d, movingOf(p, source, palette, key), nowMs);
}

/** A stall's lamplight where it stands today, from its art's lights. */
export function stallLights(
  at: { tx: number; ty: number; w: number; h: number },
  sprite: HTMLCanvasElement,
  id: PropId,
): WorldLight[] {
  const top = (at.ty + at.h) * TILE_SIZE - sprite.height;
  const left = (at.tx + at.w / 2) * TILE_SIZE - sprite.width / 2;
  return (PROP_ART[id].lights ?? []).map((l) => ({
    x: left + l.x,
    y: top + l.y,
    radius: l.radius,
  }));
}
