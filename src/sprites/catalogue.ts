import { GATE_OPEN, GATE_PALETTE, GATE_SHUT } from './wilds';
import { idsOf, HAIR_COLOURS, HAIR_STYLES, SKINS } from '../data/looks';
import { DEFAULT_LOOK, OUTFITS } from '../data/outfits';
import { ACCESSORY_IDS, PET_IDS } from '../data/pets';
import { VILLAGER_IDS } from '../data/villagers';
import { wear } from '../systems/wardrobe';
import { CANDY_TREE, CANDY_TREE_PALETTE } from './nature';
import { HONESTY_STALL, HONESTY_STALL_PALETTE, signpostTo } from './clutter';
import { SIGNPOSTS } from '../data/signposts';
import { RED_ONE, RED_ONE_PALETTE } from './greetings';
import type {
  AccessoryId,
  CritterId,
  Facing,
  MapZoneId,
  OutfitId,
  PetId,
  Pose,
} from '../types/ids';
import type { Look } from '../types/look';
import { CRITTER_ART, silhouetteOf } from './critters';
import { DOLL_FRAMES, dollLayers, POSES } from './doll';
import { FURNITURE_ART } from './furniture';
import { DOOR_MAT_ART, FLOORING_ART, WALLPAPER_ART } from './surfaces';
import {
  CROP_ART,
  SEEDED,
  SOIL,
  SPRINKLER,
  SPRINKLER_PALETTE,
  SPROUT,
  TILLED_PALETTE,
  WATERED_PALETTE,
} from './garden';
import { FIXTURE_ART } from './interiors';
import { ITEM_ART } from './items';
import { HELD_ART, HELD_PACKET, TOOL_ART } from './tools';
import { accessoryIcon, BUBBLE_ART, petPalette, petSource, type PetFrame } from './pets';
import { POT_ART } from './houses';
import {
  DOOR_DRESSINGS,
  EAVE_LIGHTS,
  eaveLights,
  eaveLightsPalettes,
  HIDDEN_EGG,
  HIDDEN_EGG_PALETTES,
  SKELLY_CHRISTMAS,
  SKELLY_CHRISTMAS_GLOW,
  SKELLY_CHRISTMAS_PALETTE,
  festivalBanner,
  FESTIVAL_BANNER_PALETTE,
} from './holidays';
import { CALENDAR, CALENDAR_IDS } from '../data/calendar';
import { MAILBOX_FULL, PROP_ART } from './props';
import { PATCH_ART, SHOOTS, SHOOTS_PALETTE } from './nature';
import { TUFT_FRAMES, TUFT_PALETTE } from './life';
import { DECAL_ART, DECAL_PALETTE } from './clutter';
import { SCALE_SHEET } from './scaleSheet';
import {
  rasterize,
  rasterizeLayers,
  type Palette,
  type Raster,
  type RasterOptions,
  type SpriteSource,
} from './sprite';
import {
  GRASS_VARIANTS,
  grassPiece,
  groundSample,
  TERRAIN_ART,
  terrainPiece,
  TERRAINS,
} from './terrain';
import { figureLayers, NEIGHBOUR_BUBBLES } from './villagers';

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
  // The ground: a patch of every kind together, then each kind alone, whole and at its ends.
  entries.push({ name: 'ground:sample', draw: groundSample });
  for (let v = 0; v < GRASS_VARIANTS; v++) {
    const { source, palette } = grassPiece(v);
    grid(`ground:grass:${v}`, source, palette);
  }
  for (const terrain of TERRAINS) {
    for (let v = 0; v < TERRAIN_ART[terrain].variants; v++) {
      for (const [shape, mask] of [
        ['whole', 255],
        ['alone', 0],
      ] as const) {
        const { source, palette } = terrainPiece(terrain, mask, v);
        grid(`ground:${terrain}:${shape}:${v}`, source, palette);
      }
    }
  }
  for (const [id, art] of Object.entries(PROP_ART)) {
    grid(`prop:${id}`, art.source, art.palette);
    if (art.glow) grid(`prop:${id}:lit`, art.source, lit(art.palette, art.glow));
    if (art.spent) grid(`prop:${id}:spent`, art.spent, art.palette);
    art.variants?.forEach((palette, v) => v > 0 && grid(`prop:${id}:${v}`, art.source, palette));
    art.forms?.forEach((form, f) => f > 0 && grid(`prop:${id}:form${f}`, form, art.palette));
  }
  for (const to of Object.keys(SIGNPOSTS) as MapZoneId[]) {
    grid(`prop:signpost:${to}`, signpostTo(to, 'right'), PROP_ART.signpost.palette);
  }
  grid('prop:mailbox:full', MAILBOX_FULL, PROP_ART.mailbox.palette);
  grid('prop:candyTree:few', CANDY_TREE.few, CANDY_TREE_PALETTE);
  grid('prop:candyTree:bare', CANDY_TREE.bare, CANDY_TREE_PALETTE);
  grid('prop:honestyStall:empty', HONESTY_STALL.empty, HONESTY_STALL_PALETTE);
  grid('greeting:redOne', RED_ONE, RED_ONE_PALETTE);
  grid('gate:shut', GATE_SHUT, GATE_PALETTE);
  grid('gate:open', GATE_OPEN, GATE_PALETTE);
  TUFT_FRAMES.forEach((frame, i) => grid(`life:tuft:${i}`, frame, TUFT_PALETTE));
  for (const [id, forms] of Object.entries(DECAL_ART)) {
    forms.forEach((form, i) => grid(`decal:${id}:${i}`, form, DECAL_PALETTE));
  }
  for (const [id, art] of Object.entries(POT_ART)) grid(`pot:${id}`, art.source, art.palette);
  // The holidays (phase U): Skelly at Christmas and lit, what hangs on the doors, the eggs.
  grid('holiday:skelly:christmas', SKELLY_CHRISTMAS, SKELLY_CHRISTMAS_PALETTE);
  grid(
    'holiday:skelly:christmas:lit',
    SKELLY_CHRISTMAS,
    lit(SKELLY_CHRISTMAS_PALETTE, SKELLY_CHRISTMAS_GLOW),
  );
  for (const [id, art] of Object.entries(DOOR_DRESSINGS)) {
    grid(`holiday:door:${id}`, art.source, art.palette);
  }
  HIDDEN_EGG_PALETTES.forEach((palette, i) => grid(`holiday:egg:${i}`, HIDDEN_EGG, palette));
  // Every building with lights along its eaves while a set that has them is up (0.2's J2).
  for (const [decor, colours] of Object.entries(EAVE_LIGHTS)) {
    const { palette, glow } = eaveLightsPalettes(colours);
    for (const [id, art] of Object.entries(PROP_ART)) {
      if (!art.door || art.noEaves) continue;
      const lights = eaveLights(art.source, colours.length, art.door.y);
      if (!lights.rows.some((row) => /\d/.test(row))) continue;
      entries.push({
        name: `holiday:eaves:${decor}:${id}`,
        draw: () =>
          rasterizeLayers([
            { source: art.source, palette: art.palette },
            { source: lights, palette },
          ]),
      });
      grid(`holiday:eaves:${decor}:${id}:lit`, lights, lit(palette, glow));
    }
  }
  // Each festival's banner across the square (0.2's J1).
  for (const id of CALENDAR_IDS) {
    const lines = CALENDAR[id].banner;
    if (lines) grid(`festival:banner:${id}`, festivalBanner(lines), FESTIVAL_BANNER_PALETTE);
  }
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
  // Her neighbours in costume for the Halloween Festival (0.2's J2), turning.
  for (const id of VILLAGER_IDS) {
    for (const facing of FACINGS) {
      entries.push({
        name: `figure:${id}:costume:${facing}`,
        draw: () =>
          rasterizeLayers(figureLayers(id, facing, 0, true), { flipX: facing === 'left' }),
      });
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
  // What her neighbours have to tell her: news, or something lost (phase S2).
  grid('bubble:news', NEIGHBOUR_BUBBLES['!'].source, NEIGHBOUR_BUBBLES['!'].palette);
  grid('bubble:lost', NEIGHBOUR_BUBBLES['?'].source, NEIGHBOUR_BUBBLES['?'].palette);
  // The garden: soil dry and watered, then each crop from seed to ripe.
  grid('soil:tilled', SOIL, TILLED_PALETTE);
  grid('soil:watered', SOIL, WATERED_PALETTE);
  grid('sprinkler', SPRINKLER, SPRINKLER_PALETTE);
  grid('crop:seeded', SEEDED, CROP_ART.pumpkin.greens);
  grid('crop:sprout', SPROUT, CROP_ART.pumpkin.greens);
  for (const [id, art] of Object.entries(CROP_ART)) {
    grid(`crop:${id}:growing`, art.growing, art.greens);
    grid(`crop:${id}:ripe`, art.ripe, art.ripePalette);
    if (art.rarePalette) grid(`crop:${id}:rare`, art.ripe, art.rarePalette);
  }
  for (const [id, art] of Object.entries(PATCH_ART)) grid(`patch:${id}`, art.source, art.palette);
  grid('patch:shoots', SHOOTS, SHOOTS_PALETTE);
  for (const [id, art] of Object.entries(ITEM_ART)) grid(`item:${id}`, art.source, art.palette);
  for (const [id, art] of Object.entries(TOOL_ART)) grid(`tool:${id}`, art.source, art.palette);
  // What she holds, at the world's size (phase V).
  for (const [id, art] of Object.entries(HELD_ART)) grid(`held:${id}`, art.source, art.palette);
  grid('held:seed', HELD_PACKET, ITEM_ART.pumpkinSeed.palette);
  // The critters' second icon frames, in town, lit, and as the Curiosity Cabinet shows one missing.
  for (const [id, art] of Object.entries(CRITTER_ART) as [
    CritterId,
    (typeof CRITTER_ART)[CritterId],
  ][]) {
    grid(`critter:${id}:1`, art.frames[1]!, art.palette);
    art.world.forEach((frame, i) => grid(`critter:${id}:world:${i}`, frame, art.palette));
    if (art.glow) grid(`critter:${id}:lit`, art.frames[0]!, lit(art.palette, art.glow));
    grid(`critter:${id}:missing`, art.world[0], silhouetteOf(id));
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
  grid('surface:doorMat', DOOR_MAT_ART.source, DOOR_MAT_ART.palette);
  // Inside the town's buildings: what stands there for good, and lit.
  for (const [id, art] of Object.entries(FIXTURE_ART)) {
    grid(`fixture:${id}`, art.source, art.palette);
    if (art.glow) grid(`fixture:${id}:lit`, art.source, lit(art.palette, art.glow));
  }
  // Her, in the look the creator opens on, walking every way, then every choice in the creator.
  const doll = (name: string, look: Look, facing: Facing, frame = 0, pose?: Pose) =>
    entries.push({
      name: `doll:${name}`,
      draw: () =>
        rasterizeLayers(dollLayers(look, facing, frame, pose), { flipX: facing === 'left' }),
    });
  for (const facing of FACINGS) {
    for (let frame = 0; frame < DOLL_FRAMES; frame++) {
      doll(`${facing}:${frame}`, DEFAULT_LOOK, facing, frame);
    }
  }
  // Her poses: her phone and her arms crossed while she waits, and rocking out.
  for (const pose of POSES) doll(`pose:${pose}`, DEFAULT_LOOK, 'down', 0, pose);
  const turn = (name: string, look: Look) =>
    FACINGS.forEach((facing) => doll(`${name}:${facing}`, look, facing));
  for (const hairStyle of idsOf(HAIR_STYLES)) {
    turn(`hair:${hairStyle}`, { ...DEFAULT_LOOK, hairStyle });
  }
  for (const hairColour of idsOf(HAIR_COLOURS)) {
    doll(`colour:${hairColour}`, { ...DEFAULT_LOOK, hairColour }, 'down');
  }
  for (const skin of idsOf(SKINS)) doll(`skin:${skin}`, { ...DEFAULT_LOOK, skin }, 'down');
  turn('no-extras', {
    ...DEFAULT_LOOK,
    gauges: false,
    tattoos: null,
    freckles: false,
    nosePiercing: false,
  });
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
