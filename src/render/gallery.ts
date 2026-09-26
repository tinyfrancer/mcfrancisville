import { idsOf, HAIR_COLOURS, HAIR_STYLES, SKINS } from '../data/looks';
import { DEFAULT_LOOK, OUTFITS } from '../data/outfits';
import { PROP_ART } from '../sprites/props';
import { DOLL_FRAMES } from '../sprites/doll';
import { wear } from '../systems/wardrobe';
import type { Facing, OutfitId } from '../types/ids';
import type { Look } from '../types/look';
import { bakeDoll } from './doll';
import { bake } from '../sprites/bake';
import type { Palette, SpriteSource } from '../sprites/sprite';
import { ITEM_ART, PATCH_ART, SPROUTS, SPROUTS_PALETTE } from '../sprites/items';
import { CROP_ART, SEEDED, SOIL, SPROUT, TILLED_PALETTE, WATERED_PALETTE } from '../sprites/garden';
import { TILE_ART, tileSources } from '../sprites/tiles';
import { PALETTE } from '../sprites/palette';

const SCALE = 4;

/**
 * Every sprite on one scrolling page, at a readable scale (`?gallery`). It ships in production on
 * purpose (decisions.md 21): the Vercel preview on a real phone is where the art gets judged.
 */
export function showGallery(root: HTMLElement): void {
  // The game pins the page to the screen; the gallery is a page that scrolls.
  for (const el of [document.documentElement, document.body]) {
    el.style.overflow = 'auto';
    el.style.height = 'auto';
  }
  root.style.height = 'auto';
  root.style.overflow = 'visible';
  root.replaceChildren();

  const page = document.createElement('div');
  page.id = 'gallery';
  Object.assign(page.style, {
    display: 'flex',
    flexWrap: 'wrap',
    gap: '16px',
    padding: 'calc(env(safe-area-inset-top) + 16px) 16px 32px',
    alignItems: 'flex-end',
  });

  const add = (label: string, key: string, source: SpriteSource, palette: Palette) =>
    show(label, bake(key, source, palette));

  const show = (label: string, sprite: HTMLCanvasElement) => {
    const canvas = document.createElement('canvas');
    canvas.width = sprite.width;
    canvas.height = sprite.height;
    canvas.getContext('2d')?.drawImage(sprite, 0, 0);
    Object.assign(canvas.style, {
      width: `${sprite.width * SCALE}px`,
      height: `${sprite.height * SCALE}px`,
      imageRendering: 'pixelated',
      background: PALETTE.dusk,
    });
    const figure = document.createElement('figure');
    Object.assign(figure.style, { margin: '0', textAlign: 'center', fontSize: '12px' });
    const caption = document.createElement('figcaption');
    caption.textContent = label;
    figure.append(canvas, caption);
    page.append(figure);
  };

  for (const [id, art] of Object.entries(TILE_ART)) {
    tileSources(art).forEach((source, i) =>
      add(`${id} ${i}`, `tile:${id}:${i}`, source, art.palette),
    );
  }
  for (const [id, art] of Object.entries(PROP_ART)) {
    add(id, `prop:${id}`, art.source, art.palette);
    if (art.glow) add(`${id} lit`, `prop:${id}:lit`, art.source, { ...art.palette, ...art.glow });
    if (art.spent) add(`${id} spent`, `prop:${id}:spent`, art.spent, art.palette);
    art.variants?.forEach(
      (palette, v) => v > 0 && add(`${id} ${v}`, `prop:${id}:${v}`, art.source, palette),
    );
  }
  // The garden: soil dry and watered, then each crop from seed to ripe.
  add('tilled', 'soil:tilled', SOIL, TILLED_PALETTE);
  add('watered', 'soil:watered', SOIL, WATERED_PALETTE);
  add('seeded', 'crop:seed', SEEDED, CROP_ART.pumpkin.greens);
  add('sprout', 'crop:sprout:0', SPROUT, CROP_ART.pumpkin.greens);
  for (const [id, art] of Object.entries(CROP_ART)) {
    add(`${id} growing`, `crop:${id}:growing:0`, art.growing, art.greens);
    add(`${id} ripe`, `crop:${id}:ripe:0`, art.ripe, art.ripePalette);
    if (art.rarePalette) add(`${id} rare`, `crop:${id}:ripe:0:rare`, art.ripe, art.rarePalette);
  }
  for (const [id, art] of Object.entries(PATCH_ART))
    add(id, `patch:${id}`, art.source, art.palette);
  add('sprouts', 'patch:sprouts', SPROUTS, SPROUTS_PALETTE);
  for (const [id, art] of Object.entries(ITEM_ART)) add(id, `item:${id}`, art.source, art.palette);
  // Her, in the look the creator opens on, walking every way.
  const facings: Facing[] = ['down', 'up', 'right', 'left'];
  for (const facing of facings) {
    for (let frame = 0; frame < DOLL_FRAMES; frame++) {
      show(`${facing} ${frame}`, bakeDoll(DEFAULT_LOOK, facing, frame));
    }
  }
  const turn = (label: string, look: Look) =>
    facings.forEach((facing) => show(`${label} ${facing}`, bakeDoll(look, facing, 0)));
  for (const hairStyle of idsOf(HAIR_STYLES)) turn(hairStyle, { ...DEFAULT_LOOK, hairStyle });
  for (const hairColour of idsOf(HAIR_COLOURS)) {
    show(hairColour, bakeDoll({ ...DEFAULT_LOOK, hairColour }, 'down', 0));
  }
  for (const skin of idsOf(SKINS)) show(skin, bakeDoll({ ...DEFAULT_LOOK, skin }, 'down', 0));
  turn('no extras', { ...DEFAULT_LOOK, gauges: false, tattoos: null });
  // Every piece of clothing, the shops' too, in every colour it comes in, from the front.
  const everything = Object.keys(OUTFITS) as OutfitId[];
  for (const id of everything) {
    for (const fabric of OUTFITS[id].fabrics) {
      const look = wear(DEFAULT_LOOK, id, everything, fabric);
      show(`${id} ${fabric}`, bakeDoll(look, 'down', 0));
    }
    turn(id, wear(DEFAULT_LOOK, id, everything));
  }

  root.append(page);
}
