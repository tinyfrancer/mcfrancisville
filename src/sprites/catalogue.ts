import { GATE_OPEN, GATE_PALETTE, GATE_SHUT } from './wilds';
import { idsOf, HAIR_COLOURS, HAIR_STYLES, SKINS } from '../data/looks';
import { DEFAULT_LOOK, OUTFITS } from '../data/outfits';
import { ACCESSORY_IDS, PET_IDS } from '../data/pets';
import { VILLAGER_IDS, VILLAGERS } from '../data/villagers';
import { WORKS } from '../data/work';
import { takeOff, wear } from '../systems/wardrobe';
import { CANDY_SAPLING, CANDY_TREE, CANDY_TREE_PALETTE, SAPLING_PALETTE } from './nature';
import { PUMPKIN_PATCH_ART, PUMPKIN_PATCH_PALETTE } from './pumpkinPatch';
import { FILM_PALETTE, FILM_SHOWING } from './filmNight';
import { HONESTY_STALL, HONESTY_STALL_PALETTE, signpostTo } from './clutter';
import { SIGNPOSTS } from '../data/signposts';
import { RED_ONE, RED_ONE_PALETTE } from './greetings';
import type {
  AccessoryId,
  CritterId,
  FossilId,
  DisplayPiece,
  Facing,
  FurnitureId,
  ItemId,
  MapZoneId,
  OutfitId,
  PetId,
  Pose,
  PropId,
  SetPiece,
  WindowPaperId,
} from '../types/ids';
import type { Look } from '../types/look';
import { CRITTER_ART, silhouetteOf } from './critters';
import { FOSSIL_ART, fossilSilhouette, type FossilArt } from './fossils';
import {
  ACTION_FRAMES,
  ACTION_POSES,
  BACKS,
  DOLL_FRAMES,
  dollLayers,
  hangsOver,
  POSES,
  SIT_DROP,
  SIT_FROM,
} from './doll';
import { PROP_SEATS } from '../data/seats';
import { FURNITURE } from '../data/furniture';
import { FURNITURE_ART } from './furniture';
import { surfaceTop } from '../data/tabletop';
import { setOf, SETS } from '../data/display';
import { showcaseLayers } from './display';
import { DOOR_MAT_ART, FLOORING_ART, WALLPAPER_ART } from './surfaces';
import { WINDOW_PAPER_ART, windowArt } from './wallsAndFloors';
import { WINDOW_SKIES } from '../data/wallsAndFloors';
import { DOORWAY_ART } from './doorway';
import { SURROUND_PANEL, surroundFooting, surroundPost, surroundRoof } from './roomSurround';
import { PUDDLE_ART, PUDDLE_PALETTE } from './puddles';
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
import { CALENDAR_MARKS, CALENDAR_PAGE, NEIGHBOUR_CAKE } from './calendarMarks';
import { ITEM_ART } from './items';
import { HELD_ART, HELD_PACKET, TOOL_ART } from './tools';
import { TIPPED_CAN } from './actions';
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
import { GOOSE_ART } from './geese';
import { DECAL_ART, DECAL_PALETTE } from './clutter';
import { SCALE_SHEET } from './scaleSheet';
import {
  rasterize,
  rasterizeLayers,
  type Layer,
  type Palette,
  type Raster,
  type RasterOptions,
  type SpriteSource,
} from './sprite';
import { frameCount, sourcesOf, type Frames } from './frames';
import { OPEN_DOOR_PALETTE, openDoor } from './doorsOpen';
import { Sketch } from './sketch';
import { BAT_FLYING, BAT_PALETTE, CROW_FLYING, CROW_PALETTE, CROW_PERCHED } from './sky';
import { LEAF_FRAMES, LEAF_PALETTES } from './leaves';
import {
  GRASS_VARIANTS,
  grassPiece,
  groundSample,
  TERRAIN_ART,
  terrainPiece,
  TERRAINS,
} from './terrain';
import { figureLayers, NEIGHBOUR_BUBBLES } from './villagers';
import { CANDY_POP, countArt, EMOTE_BUBBLES, PARCEL_POP, PARTICLE_ART } from './effects';

/** One picture the game can draw, by name, drawn at its grid's own size. */
export interface Entry {
  name: string;
  draw: () => Raster;
}

/** Her sat on a seat's art, the bottom of her hips `height` up from its bottom, on its left end. */
function satOn(seat: Raster, her: readonly Layer[], height: number): Raster {
  const doll = rasterizeLayers(her);
  const hips = SIT_FROM + SIT_DROP;
  const lift = Math.max(0, hips + height - seat.height);
  const width = seat.width;
  const tall = seat.height + lift;
  const data = new Uint8ClampedArray(width * tall * 4);
  const blit = (r: Raster, left: number, top: number) => {
    for (let y = 0; y < r.height; y++) {
      for (let x = 0; x < r.width; x++) {
        const from = (y * r.width + x) * 4;
        const tx = left + x;
        const ty = top + y;
        if (r.data[from + 3] === 0 || tx < 0 || tx >= width || ty < 0 || ty >= tall) continue;
        data.set(r.data.subarray(from, from + 4), (ty * width + tx) * 4);
      }
    }
  };
  blit(seat, 0, lift);
  blit(doll, 16 - doll.width / 2, tall - height - hips);
  return { width, height: tall, data };
}

/** Something on each surface, a small piece on each of its tiles, for the gallery (0.3's H3). */
const TABLETOP_SAMPLES: readonly (readonly [FurnitureId, readonly FurnitureId[]])[] = [
  ['sideTable', ['toadstoolLamp']],
  ['teaTable', ['cupcakeTower', 'skullMug']],
  ['dresser', ['spellbooks', 'budVase']],
  ['kitchenCounter', ['tealMixer']],
  ['lowShelf', ['snowGlobe', 'luckyCat']],
  ['curiosityCabinet', ['bellJar', 'hourglass']],
  ['teaTable', ['dripCandles', 'potionBottles']],
  ['dresser', ['candyPail', 'ghostVase']],
  ['lowShelf', ['amethyst', 'fireflyJar']],
  // Gourdon's figurines (0.3's C3): a critter and a squishy, a doll and a fossil.
  ['teaTable', ['lunaMothFigurine', 'ghostGooBallFigurine']],
  ['dresser', ['witchDollFigurine', 'ammoniteFigurine']],
];

/** A surface with small pieces stood on its tiles, raised to its top, as `HomeView` draws them. */
function onTable(surface: FurnitureId, smalls: readonly FurnitureId[]): Raster {
  const art = FURNITURE_ART[surface];
  const table = rasterize(art.source, art.palette);
  const things = smalls.map((id) => rasterize(FURNITURE_ART[id].source, FURNITURE_ART[id].palette));
  const top = surfaceTop(surface);
  const tall = Math.max(table.height, ...things.map((t) => top + t.height));
  const width = table.width;
  const data = new Uint8ClampedArray(width * tall * 4);
  const blit = (r: Raster, left: number, top: number) => {
    for (let y = 0; y < r.height; y++) {
      for (let x = 0; x < r.width; x++) {
        const from = (y * r.width + x) * 4;
        const tx = left + x;
        const ty = top + y;
        if (r.data[from + 3] === 0 || tx < 0 || tx >= width || ty < 0 || ty >= tall) continue;
        data.set(r.data.subarray(from, from + 4), (ty * width + tx) * 4);
      }
    }
  };
  blit(table, 0, tall - table.height);
  things.forEach((t, k) => blit(t, k * 32 + (32 - t.width) / 2, tall - top - t.height));
  return { width, height: tall, data };
}

const FACINGS: readonly Facing[] = ['down', 'up', 'right', 'left'];

/** Something in each display piece, and something big, for the gallery (0.3's H2). */
const DISPLAY_SAMPLES: readonly (readonly [DisplayPiece, ItemId])[] = [
  ['bellJar', 'lunaMoth'],
  ['bellJar', 'booBao'],
  ['displayFrame', 'recordBoneJovi'],
  ['displayFrame', 'lunaMoth'],
  ['plinth', 'vampDoll'],
  ['plinth', 'friendshipBracelet'],
  ['terrarium', 'lilyFrog'],
  ['terrarium', 'lunaMoth'],
  ['budVase', 'rose'],
  ['budVase', 'spiderLily'],
];

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
  // What moves on its own (V1's E5): each frame by day, and each lit as it is after dark.
  const frameRows = (
    name: string,
    art: { source: SpriteSource; palette: Palette; glow?: Palette; frames?: Frames },
  ) => {
    const frames = art.frames!;
    const sources = sourcesOf(frames);
    for (let i = 0; i < frameCount(frames); i++) {
      const source = sources[i] ?? art.source;
      if (sources[i]) grid(`${name}:f${i}`, source, art.palette);
      const glow = frames.glows?.[i] ?? art.glow;
      if (glow) grid(`${name}:lit:f${i}`, source, lit(art.palette, glow));
    }
  };

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
    if (id === 'goose')
      for (const [outfit, look] of Object.entries(GOOSE_ART))
        grid(`prop:goose:${outfit}`, look.source, look.palette);
    if (id === 'fence')
      art.joined?.forEach((form, j) => grid(`prop:fence:joins${j}`, form, art.palette));
    if (art.frames) frameRows(`prop:${id}`, art);
    // Its front door ajar and wide open as she walks up (V1's E5).
    const door = art.door;
    if (door) {
      for (const opening of [1, 2] as const) {
        const open = Sketch.from(art.source).stamp(
          openDoor(art.source, door, opening),
          door.x,
          door.y,
        );
        grid(`prop:${id}:door:${opening}`, open.toSource(), {
          ...art.palette,
          ...OPEN_DOOR_PALETTE,
        });
      }
    }
  }
  for (const to of Object.keys(SIGNPOSTS) as MapZoneId[]) {
    grid(`prop:signpost:${to}`, signpostTo(to, 'right'), PROP_ART.signpost.palette);
  }
  grid('prop:mailbox:full', MAILBOX_FULL, PROP_ART.mailbox.palette);
  grid('prop:candyTree:few', CANDY_TREE.few, CANDY_TREE_PALETTE);
  grid('prop:candyTree:bare', CANDY_TREE.bare, CANDY_TREE_PALETTE);
  grid('prop:saplingPlot:sapling', CANDY_SAPLING, SAPLING_PALETTE);
  FILM_SHOWING.forEach((frame, i) => grid(`prop:filmScreen:showing:${i}`, frame, FILM_PALETTE));
  for (const stage of ['sprouting', 'flowering', 'ripe'] as const) {
    grid(`prop:pumpkinPatch:${stage}`, PUMPKIN_PATCH_ART[stage], PUMPKIN_PATCH_PALETTE);
  }
  grid('prop:honestyStall:empty', HONESTY_STALL.empty, HONESTY_STALL_PALETTE);
  grid('greeting:redOne', RED_ONE, RED_ONE_PALETTE);
  grid('gate:shut', GATE_SHUT, GATE_PALETTE);
  grid('gate:open', GATE_OPEN, GATE_PALETTE);
  TUFT_FRAMES.forEach((frame, i) => grid(`life:tuft:${i}`, frame, TUFT_PALETTE));
  // What crosses the sky (V1's E5): a crow's wingbeats, a crow sat, a bat's wingbeats.
  CROW_FLYING.forEach((frame, i) => grid(`sky:crow:${i}`, frame, CROW_PALETTE));
  CROW_PERCHED.forEach((frame, i) => grid(`sky:crow:perched:${i}`, frame, CROW_PALETTE));
  BAT_FLYING.forEach((frame, i) => grid(`sky:bat:${i}`, frame, BAT_PALETTE));
  // A leaf falling under the trees in autumn (V1's E5), tipped each way, in each colour.
  LEAF_FRAMES.forEach((frame, i) =>
    LEAF_PALETTES.forEach((palette, c) => grid(`life:leaf:${i}:${c}`, frame, palette)),
  );
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
          rasterizeLayers(figureLayers(id, facing, 0, 'own'), { flipX: facing === 'left' }),
      });
    }
  }
  // Cody at the finale in the other half of her costume (0.2's J4).
  for (const half of ['butterfly', 'bugCatcher', 'ringmaster', 'scaredy', 'clueFinder'] as const) {
    entries.push({
      name: `figure:cody:${half}`,
      draw: () => rasterizeLayers(figureLayers('cody', 'down', 0, half)),
    });
  }
  // Her neighbours wearing a bracelet she gave them (0.2's W1).
  for (const id of VILLAGER_IDS) {
    entries.push({
      name: `figure:${id}:bracelet`,
      draw: () => rasterizeLayers(figureLayers(id, 'down', 0, null, 'friendshipBracelet')),
    });
  }
  // Her neighbours alive (V1's E3): waving both ways, blinking, sat down, and at every job a
  // stop of theirs names, both frames, facing the way it's done.
  for (const id of VILLAGER_IDS) {
    for (const frame of [0, 1]) {
      entries.push({
        name: `figure:${id}:wave:${frame}`,
        draw: () =>
          rasterizeLayers(figureLayers(id, 'down', 0, null, null, { act: 'wave', frame })),
      });
    }
    entries.push({
      name: `figure:${id}:blink`,
      draw: () => rasterizeLayers(figureLayers(id, 'down', 0, null, null, { blink: true })),
    });
    entries.push({
      name: `figure:${id}:sit`,
      draw: () => rasterizeLayers(figureLayers(id, 'down', 0, null, null, { sit: true })),
    });
    const { weekday, weekend } = VILLAGERS[id].schedule;
    const works = new Set([...weekday, ...weekend].flatMap((s) => (s.doing ? [s.doing] : [])));
    for (const work of works) {
      const facing = WORKS[work].faces;
      for (const frame of [0, 1]) {
        entries.push({
          name: `figure:${id}:work:${work}:${frame}`,
          draw: () =>
            rasterizeLayers(figureLayers(id, facing, 0, null, null, { act: work, frame }), {
              flipX: facing === 'left',
            }),
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
  // What her neighbours have to tell her: news, or something lost (phase S2).
  grid('bubble:news', NEIGHBOUR_BUBBLES['!'].source, NEIGHBOUR_BUBBLES['!'].palette);
  grid('bubble:lost', NEIGHBOUR_BUBBLES['?'].source, NEIGHBOUR_BUBBLES['?'].palette);
  // The effects layer (V1's E1): the emotes, each kind of particle in each colour, and a pop's
  // pictures for Candy, a parcel and its count.
  for (const [emote, art] of Object.entries(EMOTE_BUBBLES)) {
    grid(`bubble:emote:${emote}`, art.source, art.palette);
  }
  for (const [kind, art] of Object.entries(PARTICLE_ART)) {
    art.frames.forEach((frame, f) =>
      art.palettes.forEach((palette, p) => grid(`effect:${kind}:${f}:${p}`, frame, palette)),
    );
  }
  grid('effect:candy', CANDY_POP.source, CANDY_POP.palette);
  grid('effect:parcel', PARCEL_POP.source, PARCEL_POP.palette);
  grid('effect:count:1234567890', countArt(1234567890).source, countArt(1234567890).palette);
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
  for (const [id, art] of Object.entries(CALENDAR_MARKS))
    grid(`mark:${id}`, art.source, art.palette);
  grid('mark:neighbourBirthday', NEIGHBOUR_CAKE.source, NEIGHBOUR_CAKE.palette);
  grid('mark:page', CALENDAR_PAGE.source, CALENDAR_PAGE.palette);
  for (const [id, art] of Object.entries(TOOL_ART)) grid(`tool:${id}`, art.source, art.palette);
  // What she holds, at the world's size (phase V).
  for (const [id, art] of Object.entries(HELD_ART)) grid(`held:${id}`, art.source, art.palette);
  grid('held:seed', HELD_PACKET, ITEM_ART.pumpkinSeed.palette);
  grid('held:canTipped', TIPPED_CAN.source, TIPPED_CAN.palette);
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
  // The fossils (0.3's C1), lit after dark, and as the Curiosity Cabinet shows one still to dig.
  for (const [id, art] of Object.entries(FOSSIL_ART) as [FossilId, FossilArt][]) {
    if (art.glow) grid(`fossil:${id}:lit`, art.source, lit(art.palette, art.glow));
    grid(`fossil:${id}:missing`, art.source, fossilSilhouette(id));
  }
  // Her home: every piece every way it turns and lit, then the walls and floors.
  for (const [id, art] of Object.entries(FURNITURE_ART)) {
    grid(`furniture:${id}`, art.source, art.palette);
    if (art.side) grid(`furniture:${id}:side`, art.side, art.palette);
    if (art.back) grid(`furniture:${id}:back`, art.back, art.palette);
    if (art.glow) grid(`furniture:${id}:lit`, art.source, lit(art.palette, art.glow));
    if (art.frames) frameRows(`furniture:${id}`, art);
  }
  // What shows off what she has (0.3's H2): each set whole and half, each display piece in use.
  for (const id of Object.keys(SETS) as SetPiece[]) {
    const set = setOf(id);
    const half = set.filter((_, i) => i % 2 === 0);
    entries.push({
      name: `display:${id}:full`,
      draw: () => rasterizeLayers(showcaseLayers(id, set)),
    });
    entries.push({
      name: `display:${id}:half`,
      draw: () => rasterizeLayers(showcaseLayers(id, half)),
    });
  }
  for (const [id, shown] of DISPLAY_SAMPLES) {
    entries.push({
      name: `display:${id}:${shown}`,
      draw: () => rasterizeLayers(showcaseLayers(id, [shown])),
    });
  }
  // Things on tables (0.3's H3): each surface with small pieces stood on it.
  for (const [surface, smalls] of TABLETOP_SAMPLES) {
    entries.push({
      name: `tabletop:${surface}:${smalls.join('+')}`,
      draw: () => onTable(surface, smalls),
    });
  }
  for (const [id, art] of [...Object.entries(WALLPAPER_ART), ...Object.entries(FLOORING_ART)]) {
    grid(`surface:${id}`, art.source, art.palette);
  }
  // The windows in 0.3's S4's wallpapers, under every sky.
  for (const id of Object.keys(WINDOW_PAPER_ART) as WindowPaperId[]) {
    for (const sky of WINDOW_SKIES) {
      const art = windowArt(id, sky);
      grid(`window:${id}:${sky}`, art.source, art.palette);
    }
  }
  grid('surface:doorMat', DOOR_MAT_ART.source, DOOR_MAT_ART.palette);
  grid('surface:doorway', DOORWAY_ART.source, DOORWAY_ART.palette);
  // What a room stands in (decision 290), round a nine-tile shop.
  grid('surround:panel', SURROUND_PANEL.source, SURROUND_PANEL.palette);
  for (const [name, art] of [
    ['roof', surroundRoof(9 * 32)],
    ['post', surroundPost(11 * 32)],
    ['footing', surroundFooting(9 * 32, 4 * 32)],
  ] as const) {
    grid(`surround:${name}`, art.source, art.palette);
  }
  // The puddles on a rainy day's paths (V1's L3).
  PUDDLE_ART.forEach((art, i) => grid(`puddle:${i}`, art, PUDDLE_PALETTE));
  // Inside the town's buildings: what stands there for good, and lit.
  for (const [id, art] of Object.entries(FIXTURE_ART)) {
    grid(`fixture:${id}`, art.source, art.palette);
    if (art.glow) grid(`fixture:${id}:lit`, art.source, lit(art.palette, art.glow));
    if (art.frames) frameRows(`fixture:${id}`, art);
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
  // What she does as she does something (V1's E2): every action, frame and facing, and breathing
  // out and blinking as she stands.
  for (const pose of ACTION_POSES) {
    for (const facing of FACINGS) {
      for (let frame = 0; frame < ACTION_FRAMES[pose]; frame++) {
        doll(`act:${pose}:${facing}:${frame}`, DEFAULT_LOOK, facing, frame, pose);
      }
    }
  }
  for (const facing of FACINGS) {
    entries.push({
      name: `doll:rest:${facing}`,
      draw: () =>
        rasterizeLayers(
          dollLayers(DEFAULT_LOOK, facing, 0, undefined, { out: true, blink: true }),
          {
            flipX: facing === 'left',
          },
        ),
    });
  }
  // Sitting (0.2's G1), facing us and facing away.
  doll('pose:sit', DEFAULT_LOOK, 'down', 0, 'sit');
  doll('pose:sit:up', DEFAULT_LOOK, 'up', 0, 'sit');
  // And sat on every seat, to judge its height by: on its left end, as from a walk up beside it.
  const seats: (readonly [string, SpriteSource, Palette, number])[] = [
    ...Object.entries(PROP_SEATS).map(([id, row]) => {
      const art = PROP_ART[id as PropId];
      return [`prop:${id}`, art.source, art.palette, row.height] as const;
    }),
    ...Object.entries(FURNITURE)
      .filter(([, row]) => row.seat)
      .map(([id, row]) => {
        const art = FURNITURE_ART[id as FurnitureId];
        return [`furniture:${id}`, art.source, art.palette, row.seat!.height] as const;
      }),
  ];
  for (const [name, source, palette, height] of seats) {
    entries.push({
      name: `sit:${name}`,
      draw: () =>
        satOn(rasterize(source, palette), dollLayers(DEFAULT_LOOK, 'down', 0, 'sit'), height),
    });
  }
  const turn = (name: string, look: Look) =>
    FACINGS.forEach((facing) => doll(`${name}:${facing}`, look, facing));
  for (const hairStyle of idsOf(HAIR_STYLES)) {
    turn(`hair:${hairStyle}`, { ...DEFAULT_LOOK, hairStyle });
  }
  for (const hairColour of idsOf(HAIR_COLOURS)) {
    doll(`colour:${hairColour}`, { ...DEFAULT_LOOK, hairColour, splitColour: null }, 'down');
  }
  doll(
    'colour:blonde+coral',
    { ...DEFAULT_LOOK, hairColour: 'coral', splitColour: 'blonde' },
    'down',
  );
  // Her sleeves bare, in the sundress: the stripes on her right arm, and on her left.
  const bare = {
    ...DEFAULT_LOOK,
    outfit: { top: { id: 'sundressFloral', fabric: 'blue' } },
  } as Look;
  turn('sleeves:right', bare);
  turn('sleeves:left', { ...bare, stripesArm: 'left' });
  // Her stack of bracelets on her left wrist (0.2's W1), every way and in every pose.
  const stacked: Look = {
    ...bare,
    wrist: ['friendshipBracelet', 'tigersBracelet', 'loveBracelet'],
  };
  turn('wrist', stacked);
  for (const pose of POSES) doll(`wrist:pose:${pose}`, stacked, 'down', 0, pose);
  turn('wrist:sleeved', { ...DEFAULT_LOOK, wrist: ['spookyBracelet', 'scarletBracelet'] });
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
  // Tights are shown under a skirt with bare feet, since her jeans and boots would hide them.
  const skirted = takeOff(wear(DEFAULT_LOOK, 'skaterSkirt', everything, 'ink'), 'shoes');
  for (const id of everything) {
    const base = OUTFITS[id].slot === 'tights' ? skirted : DEFAULT_LOOK;
    for (const fabric of OUTFITS[id].fabrics) {
      doll(`outfit:${id}:${fabric}`, wear(base, id, everything, fabric), 'down');
    }
    turn(`outfit:${id}`, wear(base, id, everything));
  }
  // Every hem over every shoe (0.3's A1): a picture a hem, a column a shoe, and a row each for
  // standing, both steps, from behind and from the side mid-stride.
  const firstOfCut = (slot: string) => [
    ...new Map(
      everything.filter((id) => OUTFITS[id].slot === slot).map((id) => [OUTFITS[id].cut, id]),
    ).values(),
  ];
  const shoes = everything.filter((id) => OUTFITS[id].slot === 'shoes');
  const hems = [...firstOfCut('top'), ...firstOfCut('bottom'), ...firstOfCut('outer')].filter(
    (id) => hangsOver(OUTFITS[id].cut, 'back'),
  );
  const steps = [
    ['down', 0],
    ['down', 1],
    ['down', 2],
    ['up', 0],
    ['right', 1],
  ] as const;
  for (const hem of hems) {
    entries.push({
      name: `doll:hem:${hem}`,
      draw: () =>
        tile(
          steps.map(([facing, frame]) =>
            shoes.map((shoe) =>
              rasterizeLayers(
                dollLayers(
                  wear(wear(DEFAULT_LOOK, hem, everything), shoe, everything),
                  facing,
                  frame,
                ),
              ),
            ),
          ),
        ),
    });
  }
  // Everything worn on her back over every hair style (0.3's A2): a picture a piece, a column a
  // style, and rows from the front, from behind (standing and a step) and from the side
  // mid-stride; then again with her gloves and bracelets on, and a flared skirt under a cape.
  const views = [
    ['down', 0],
    ['up', 0],
    ['up', 1],
    ['right', 1],
  ] as const;
  for (const piece of everything.filter((id) => BACKS.includes(OUTFITS[id].cut))) {
    const plain = wear(DEFAULT_LOOK, piece, everything);
    const skirted = wear(plain, 'skaterSkirt', everything, 'rose');
    const gloved = wear(
      OUTFITS[piece].slot === 'outer' ? skirted : plain,
      'gardenGloves',
      everything,
    );
    const looks: Look[] = [
      plain,
      { ...gloved, wrist: ['friendshipBracelet', 'tigersBracelet', 'loveBracelet'] },
    ];
    entries.push({
      name: `doll:back:${piece}`,
      draw: () =>
        tile(
          looks.flatMap((look) =>
            views.map(([facing, frame]) =>
              idsOf(HAIR_STYLES).map((hairStyle) =>
                rasterizeLayers(dollLayers({ ...look, hairStyle }, facing, frame)),
              ),
            ),
          ),
        ),
    });
  }
  // Her actions dressed (V1's E2): a row a look, a column each action, facing and frame.
  const dressed = (ids: OutfitId[], look: Partial<Look> = {}): Look =>
    ids.reduce((on, id) => wear(on, id, everything), { ...DEFAULT_LOOK, ...look });
  const actors: Look[] = [
    dressed(['witchHat', 'vampireCape', 'skaterSkirt', 'kneeHighBoots', 'gardenGloves'], {
      wrist: ['friendshipBracelet', 'tigersBracelet', 'loveBracelet'],
    }),
    dressed(['overalls', 'cozyHoodie', 'sneakers'], { hairStyle: 'long' }),
    dressed(['ballGown', 'tiara'], { hairStyle: 'bunches' }),
    dressed(['motoJacket', 'batWings', 'spaceHelmet']),
  ];
  entries.push({
    name: 'doll:acts:dressed',
    draw: () =>
      tile(
        actors.map((look) =>
          ACTION_POSES.flatMap((pose) =>
            FACINGS.flatMap((facing) =>
              Array.from({ length: ACTION_FRAMES[pose] }, (_, frame) =>
                rasterizeLayers(dollLayers(look, facing, frame, pose), {
                  flipX: facing === 'left',
                }),
              ),
            ),
          ),
        ),
      ),
  });
  return entries;
}

/** Pictures of one size laid out in rows, edge to edge. */
function tile(rows: readonly (readonly Raster[])[]): Raster {
  const { width: w, height: h } = rows[0]![0]!;
  const width = w * Math.max(...rows.map((r) => r.length));
  const height = h * rows.length;
  const data = new Uint8ClampedArray(width * height * 4);
  rows.forEach((row, j) =>
    row.forEach((r, i) => {
      for (let y = 0; y < r.height; y++) {
        const from = y * r.width * 4;
        data.set(r.data.subarray(from, from + r.width * 4), ((j * h + y) * width + i * w) * 4);
      }
    }),
  );
  return { width, height, data };
}
