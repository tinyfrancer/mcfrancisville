import { idsOf, HAIR_COLOURS, HAIR_STYLES, SKINS } from '../data/looks';
import { DEFAULT_LOOK, OUTFITS } from '../data/outfits';
import { ACCESSORY_IDS, PET_IDS } from '../data/pets';
import { VILLAGER_IDS } from '../data/villagers';
import { wear } from '../systems/wardrobe';
import type { AccessoryId, CritterId, Facing, OutfitId, PetId } from '../types/ids';
import type { Look } from '../types/look';
import { CRITTER_ART, silhouetteOf } from './critters';
import { DOLL_FRAMES, dollLayers } from './doll';
import { FLOORING_ART, FURNITURE_ART, WALLPAPER_ART } from './furniture';
import { CROP_ART, SEEDED, SOIL, SPROUT, TILLED_PALETTE, WATERED_PALETTE } from './garden';
import { ITEM_ART, PATCH_ART, SPROUTS, SPROUTS_PALETTE } from './items';
import { accessoryIcon, BUBBLE_ART, petPalette, petSource, type PetFrame } from './pets';
import { MAILBOX_FULL, PROP_ART } from './props';
import { SCALE_SHEET } from './scaleSheet';
import {
  rasterize,
  rasterizeLayers,
  type Palette,
  type Raster,
  type RasterOptions,
  type SpriteSource,
} from './sprite';
import { TILE_ART, tileSources } from './tiles';
import { figureLayers } from './villagers';

/** One picture the game can draw, by name, drawn at its grid's own size. */
export interface Entry {
  name: string;
  draw: () => Raster;
}

const FACINGS: readonly Facing[] = ['down', 'up', 'right', 'left'];

/**
 * Every sprite in the game, named: what `?gallery` shows and `npm run sprite` renders to a PNG.
 * Pure, so it runs in Node as well as the browser. The scale sheet comes first, since it's the
 * page that's being judged while the art is redrawn.
 */
export function catalogue(): Entry[] {
  const entries: Entry[] = [];
  const grid = (name: string, source: SpriteSource, palette: Palette, options?: RasterOptions) =>
    entries.push({ name, draw: () => rasterize(source, palette, options) });
  const lit = (palette: Palette, glow: Palette | undefined) => ({ ...palette, ...glow });

  for (const piece of SCALE_SHEET) {
    entries.push({ name: `scale:${piece.name}`, draw: piece.draw });
  }
  for (const [id, art] of Object.entries(TILE_ART)) {
    tileSources(art).forEach((source, i) => grid(`tile:${id}:${i}`, source, art.palette));
  }
  for (const [id, art] of Object.entries(PROP_ART)) {
    grid(`prop:${id}`, art.source, art.palette);
    if (art.glow) grid(`prop:${id}:lit`, art.source, lit(art.palette, art.glow));
    if (art.spent) grid(`prop:${id}:spent`, art.spent, art.palette);
    art.variants?.forEach((palette, v) => v > 0 && grid(`prop:${id}:${v}`, art.source, palette));
  }
  grid('prop:mailbox:full', MAILBOX_FULL, PROP_ART.mailbox.palette);
  // Her neighbours, the Moon Pie Man and Wes, turning and walking.
  for (const id of [...VILLAGER_IDS, 'moonPieMan', 'wes'] as const) {
    for (const facing of FACINGS) {
      for (let frame = 0; frame < DOLL_FRAMES; frame++) {
        entries.push({
          name: `figure:${id}:${facing}:${frame}`,
          draw: () =>
            rasterizeLayers(figureLayers(id, facing, frame), { flipX: facing === 'left' }),
        });
      }
    }
  }
  // The pets, every frame, then dressed in every accessory, and the bubbles they say things in.
  const pet = (name: string, id: PetId, accessory: AccessoryId | null, frame: PetFrame) =>
    grid(`pet:${name}:${frame}`, petSource(id, frame), petPalette(id, accessory));
  for (const id of PET_IDS) {
    for (const frame of ['side0', 'side1', 'sit', 'rest'] as const) pet(id, id, null, frame);
  }
  for (const accessory of ACCESSORY_IDS) {
    pet(`fibi:${accessory}`, 'fibi', accessory, 'sit');
    pet(`dolly:${accessory}`, 'dolly', accessory, 'side0');
    pet(`florence:${accessory}`, 'florence', accessory, 'sit');
    const icon = accessoryIcon(accessory);
    grid(`accessory:${accessory}`, icon.source, icon.palette);
  }
  for (const [id, art] of Object.entries(BUBBLE_ART)) {
    grid(`bubble:${id}`, art.source, art.palette);
  }
  // The garden: soil dry and watered, then each crop from seed to ripe.
  grid('soil:tilled', SOIL, TILLED_PALETTE);
  grid('soil:watered', SOIL, WATERED_PALETTE);
  grid('crop:seeded', SEEDED, CROP_ART.pumpkin.greens);
  grid('crop:sprout', SPROUT, CROP_ART.pumpkin.greens);
  for (const [id, art] of Object.entries(CROP_ART)) {
    grid(`crop:${id}:growing`, art.growing, art.greens);
    grid(`crop:${id}:ripe`, art.ripe, art.ripePalette);
    if (art.rarePalette) grid(`crop:${id}:rare`, art.ripe, art.rarePalette);
  }
  for (const [id, art] of Object.entries(PATCH_ART)) grid(`patch:${id}`, art.source, art.palette);
  grid('patch:sprouts', SPROUTS, SPROUTS_PALETTE);
  for (const [id, art] of Object.entries(ITEM_ART)) grid(`item:${id}`, art.source, art.palette);
  // The critters' second frames, lit, and as the Curiosity Cabinet shows one still missing.
  for (const [id, art] of Object.entries(CRITTER_ART) as [
    CritterId,
    (typeof CRITTER_ART)[CritterId],
  ][]) {
    grid(`critter:${id}:1`, art.frames[1]!, art.palette);
    if (art.glow) grid(`critter:${id}:lit`, art.frames[0]!, lit(art.palette, art.glow));
    grid(`critter:${id}:missing`, art.frames[0]!, silhouetteOf(id));
  }
  // Her home: every piece every way it turns and lit, then the walls and floors.
  for (const [id, art] of Object.entries(FURNITURE_ART)) {
    grid(`furniture:${id}`, art.source, art.palette);
    if (art.side) grid(`furniture:${id}:side`, art.side, art.palette);
    if (art.back) grid(`furniture:${id}:back`, art.back, art.palette);
    if (art.glow) grid(`furniture:${id}:lit`, art.source, lit(art.palette, art.glow));
  }
  for (const [id, art] of [...Object.entries(WALLPAPER_ART), ...Object.entries(FLOORING_ART)]) {
    grid(`surface:${id}`, art.source, art.palette);
  }
  // Her, in the look the creator opens on, walking every way, then every choice in the creator.
  const doll = (name: string, look: Look, facing: Facing, frame = 0) =>
    entries.push({
      name: `doll:${name}`,
      draw: () => rasterizeLayers(dollLayers(look, facing, frame), { flipX: facing === 'left' }),
    });
  for (const facing of FACINGS) {
    for (let frame = 0; frame < DOLL_FRAMES; frame++) {
      doll(`${facing}:${frame}`, DEFAULT_LOOK, facing, frame);
    }
  }
  const turn = (name: string, look: Look) =>
    FACINGS.forEach((facing) => doll(`${name}:${facing}`, look, facing));
  for (const hairStyle of idsOf(HAIR_STYLES)) {
    turn(`hair:${hairStyle}`, { ...DEFAULT_LOOK, hairStyle });
  }
  for (const hairColour of idsOf(HAIR_COLOURS)) {
    doll(`colour:${hairColour}`, { ...DEFAULT_LOOK, hairColour }, 'down');
  }
  for (const skin of idsOf(SKINS)) doll(`skin:${skin}`, { ...DEFAULT_LOOK, skin }, 'down');
  turn('no-extras', { ...DEFAULT_LOOK, gauges: false, tattoos: null });
  // Every piece of clothing, the shops' too, in every colour it comes in, from the front.
  const everything = Object.keys(OUTFITS) as OutfitId[];
  for (const id of everything) {
    for (const fabric of OUTFITS[id].fabrics) {
      doll(`outfit:${id}:${fabric}`, wear(DEFAULT_LOOK, id, everything, fabric), 'down');
    }
    turn(`outfit:${id}`, wear(DEFAULT_LOOK, id, everything));
  }
  return entries;
}
