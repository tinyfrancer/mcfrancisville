import { TILE_SIZE } from '../../config/world';
import type { SeasonId } from '../../data/seasons';
import { bake } from '../../sprites/bake';
import { MAILBOX_FULL, PROP_ART } from '../../sprites/props';
import { seasonLook, turnsWithSeasons } from '../../sprites/seasons';
import { propKey } from '../../systems/gathering';
import type { PlacedProp } from '../../systems/grid';
import type { PropId } from '../../types/ids';
import type { MapZone } from '../../world/zones/MapZone';
import type { Point } from '../camera';
import type { Entrance } from '../doors';
import type { Moving } from '../frames';
import type { DrawnDoor } from '../holidays';
import { shedsLeaves } from '../leaves';
import { glowOf, type Drawable, type WorldLight } from '../scene';
import { CROWNS, crownOf } from './crowns';
import { patchGivers, type Giver } from './givers';
import type { Pass } from './pass';
import { movingOf } from './standing';

/** A prop the season changes, and whatever else holds its picture, to bake again as it turns. */
interface Seasonal {
  prop: PlacedProp;
  drawable: Drawable;
  giver?: Giver;
  entrance?: Entrance;
  m?: Moving;
}

/** The place's props, baked once as the view is made, and handed to the passes that draw them. */
export interface BakedProps {
  /** What stands still and never changes. */
  props: Drawable[];
  /** What moves on its own where it stands: the fountain, the wheel, a lamp (V1's E5). */
  moving: { id: PropId; drawable: Drawable; m: Moving }[];
  /** Trees, rocks and patches that give something once a window. */
  givers: Giver[];
  lights: WorldLight[];
  /** Each fountain's lamps, which pulse while it plays, and the top of its jet (0.2's H2). */
  fountains: { lights: WorldLight[]; top: Point }[];
  /** Her mailbox, and how it looks with its flag up for a letter. */
  mailbox: { drawable: Drawable; full: HTMLCanvasElement } | null;
  /** The porch geese, hers first, drawn in today's outfits (0.2's K1). */
  geese: Drawable[];
  /** The pots by her door, drawn with whatever she has planted in them. */
  pots: Drawable[];
  /** The candy tree, drawn as full as it is, and the honesty stall, stocked or not (phase O). */
  candyTrees: Drawable[];
  /** The rings of earth in her yard, each waiting, a sapling or a candy tree (0.2's E1). */
  saplingPlots: { prop: PlacedProp; drawable: Drawable }[];
  stalls: Drawable[];
  /** The noticeboards, wearing what's pinned on them (1.0.1). */
  boards: Drawable[];
  patches: Drawable[];
  /** The floating lanterns, bobbing on the water. */
  bobbing: { drawable: Drawable; m: Moving | null }[];
  /** Mounds where something is buried, and how each looks once it's dug up. */
  mounds: { prop: PlacedProp; drawable: Drawable; dug: HTMLCanvasElement }[];
  /** Every building's front door, for what hangs on it for a holiday (phase U). */
  doors: DrawnDoor[];
  /** The same doors, to open as she walks up to one (V1's E5). */
  entrances: Entrance[];
  /** The scarecrows, for a crow to sit on now and then (V1's E5). */
  scarecrows: Drawable[];
  /** The trees that let their leaves go in autumn (V1's E5). */
  shedding: Drawable[];
  /** Skelly, drawn in a holiday's get-up while its decorations are up. */
  skellies: Drawable[];
  /** Those the season changes, to bake again as it turns (V1's L4). */
  seasonal: Seasonal[];
}

/** Bakes each of the place's props in the season's look, and sorts them by what draws them. */
export function bakeProps(zone: MapZone, season: SeasonId): BakedProps {
  const b: BakedProps = {
    props: [],
    moving: [],
    givers: [],
    lights: [],
    fountains: [],
    mailbox: null,
    geese: [],
    pots: [],
    candyTrees: [],
    saplingPlots: [],
    stalls: [],
    boards: [],
    patches: [],
    bobbing: [],
    mounds: [],
    doors: [],
    entrances: [],
    scarecrows: [],
    shedding: [],
    skellies: [],
    seasonal: [],
  };
  for (const prop of zone.map.props) {
    const art = PROP_ART[prop.id];
    const { source, palette, form: f, key } = seasonLook(prop, season);
    const turns = turnsWithSeasons(prop.id) ? { prop, drawable: {} as Drawable } : null;
    const sprite = bake(key, source, palette);
    const footY = (prop.ty + prop.h) * TILE_SIZE;
    const x = prop.tx * TILE_SIZE + (prop.w * TILE_SIZE - sprite.width) / 2;
    const y = footY - sprite.height;
    const drawable: Drawable = { footY, sprite, x, y };
    if (turns) {
      turns.drawable = drawable;
      b.seasonal.push(turns);
    }
    if (CROWNS.has(prop.id)) drawable.crown = crownOf(prop).crown;
    if (art.glow) {
      drawable.glow = glowOf(`glow:${prop.id}:${f}`, source, art.palette, art.glow);
    }
    if (art.door) {
      const building = art.noEaves ? {} : { building: { key: `${prop.id}:${f}`, source } };
      b.doors.push({ x, y, footY, door: art.door, ...building });
      const box = { tx: prop.tx, ty: prop.ty, w: prop.w, h: prop.h };
      const entrance = { box, x, y, footY, door: art.door, key, source, palette };
      b.entrances.push(entrance);
      if (turns) Object.assign(turns, { entrance });
    }
    if (prop.id === 'scarecrow') b.scarecrows.push(drawable);
    if (shedsLeaves(prop.id)) b.shedding.push(drawable);
    if (prop.id === 'pottedPlant') {
      b.pots.push(drawable);
    } else if (prop.id === 'goose') {
      b.geese.push(drawable);
    } else if (prop.id === 'skelly') {
      b.skellies.push(drawable);
    } else if (prop.id === 'candyTree') {
      b.candyTrees.push(drawable);
    } else if (prop.id === 'saplingPlot') {
      b.saplingPlots.push({ prop, drawable });
    } else if (prop.id === 'noticeboard') {
      b.boards.push(drawable);
    } else if (prop.id === 'honestyStall') {
      b.stalls.push(drawable);
    } else if (prop.id === 'pumpkinPatch') {
      b.patches.push(drawable);
    } else if (prop.id === 'mailbox') {
      const full = bake('prop:mailbox:full', MAILBOX_FULL, palette);
      b.mailbox = { drawable, full };
    } else if (prop.id === 'floatLantern') {
      b.bobbing.push({
        drawable,
        m: art.frames ? movingOf(prop, source, palette, key) : null,
      });
    } else if (prop.id === 'mound') {
      const dug = bake(`prop:mound:dug`, art.spent!, palette);
      b.mounds.push({ prop, drawable, dug });
    } else if (art.spent) {
      const spent = bake(`${key}:spent`, art.spent, palette);
      const giver = { key: propKey(prop, zone.id), drawable, ready: sprite, spent };
      b.givers.push(giver);
      if (turns) Object.assign(turns, { giver });
    } else if (art.frames) {
      const m = movingOf(prop, source, palette, key);
      b.moving.push({ id: prop.id, drawable, m });
      if (turns) Object.assign(turns, { m });
    } else {
      b.props.push(drawable);
    }
    const lights = (art.lights ?? []).map((l) => ({ x: x + l.x, y: y + l.y, radius: l.radius }));
    if (prop.id === 'fountain') {
      b.fountains.push({ lights, top: { x: x + sprite.width / 2, y } });
    } else b.lights.push(...lights);
  }
  b.givers.push(...patchGivers(zone));
  return b;
}

/**
 * Bakes the trees, bushes and roofs again in the season's colours, and whatever else holds their
 * pictures, the first frame after it turns (V1's L4).
 */
export function turnProps(seasonal: readonly Seasonal[], season: SeasonId): void {
  for (const e of seasonal) {
    const { source, palette, key } = seasonLook(e.prop, season);
    const sprite = bake(key, source, palette);
    e.drawable.sprite = sprite;
    if (e.giver) {
      e.giver.ready = sprite;
      e.giver.spent = bake(`${key}:spent`, PROP_ART[e.prop.id].spent!, palette);
    }
    if (e.entrance) Object.assign(e.entrance, { key, palette });
    if (e.m) Object.assign(e.m, { key, palette, source });
  }
}

/** The place's props that stand still, and the lamps on every prop but a fountain. */
export function propsPass(b: BakedProps): Pass {
  return {
    name: 'props',
    stand: () => b.props,
    lights: () => b.lights,
  };
}
