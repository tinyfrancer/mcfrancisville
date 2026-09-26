import { PROP_FOOTPRINT, TOWN, type MapSource } from '../data/maps';
import type { SavedPlayer } from '../persistence/SaveState';
import { TILE_SIZE } from '../config/world';
import { cropFromSeed, CROPS } from '../data/crops';
import { PATCHES, PROP_YIELDS, type Yield } from '../data/gathering';
import { STARTING_CANDY, type Ware } from '../data/shop';
import { dayKey, systemClock, type Clock } from '../systems/clock';
import { canWater, daysToRipe, plantingSeed, stageOf, water, yieldOf } from '../systems/farming';
import {
  isReady,
  patchKey,
  propKey,
  pruneTaken,
  SNACK_KEY,
  snackTonight,
  type Snack,
} from '../systems/gathering';
import { parseMap, walkable, type PlacedProp, type TileMap } from '../systems/grid';
import { findPath, type Tile } from '../systems/pathfinding';
import { canSell, popUpLot, sameWare, sellValue, stockOf, type Shelf } from '../systems/shop';
import type { CropId, Facing, ItemId, PropId, ShopId } from '../types/ids';
import { Bag, type Stack } from './Bag';
import { EventBus } from './eventBus';
import { bedKey, Farm, type SavedBed } from './Farm';
import { Wardrobe, type ClosetSnapshot } from './Wardrobe';

/** Four tiles a second: brisk enough to cross town in under ten, slow enough to feel like a stroll. */
export const WALK_SPEED = 4 * TILE_SIZE;

/** Where something she gathered came from: a tree or rock, a flower patch, or the night's snack. */
export type GatherSource = PropId | 'flowers' | 'snack';

/**
 * Moments the view draws and the sound plays; state the view reads off the town instead. `at` is
 * the prop she was tapped over to, when she walked to one rather than to open ground. `resting` is
 * something that has already given what it gives today, and will again tomorrow.
 *
 * In the garden, `tilled` and `bare` are a bed waiting for a seed, which the HUD asks her to pick;
 * `days` is how many mornings until a crop is ripe. In a shop, `candy` is what a sale brought in.
 */
export type WorldEvent =
  | { kind: 'arrived'; tx: number; ty: number; at?: PropId }
  | { kind: 'gathered'; from: GatherSource; item: ItemId; count: number }
  | { kind: 'resting'; from: GatherSource; item: ItemId }
  | { kind: 'tilled'; tx: number; ty: number }
  | { kind: 'bare'; tx: number; ty: number }
  | { kind: 'planted'; crop: CropId; tx: number; ty: number }
  | { kind: 'watered'; crop: CropId; days: number }
  | { kind: 'growing'; crop: CropId; days: number }
  | { kind: 'harvested'; crop: CropId; item: ItemId; count: number; seed: ItemId }
  | { kind: 'bought'; shop: ShopId; ware: Ware; price: number }
  | { kind: 'sold'; item: ItemId; count: number; candy: number };

/** The state the HUD follows (decisions.md 9). */
export interface TownState extends Record<string, unknown> {
  bag: readonly Stack[];
  candy: number;
}

/** What of her finds is saved: the bag, and what she has taken today. */
export interface FindsSnapshot {
  bag: Stack[];
  taken: Record<string, string>;
}

export interface Player {
  /** World pixels, at the centre of her feet's tile when she stands still. */
  x: number;
  y: number;
  facing: Facing;
  moving: boolean;
  /** Time spent walking since she last stood still; the walk cycle is read off it. */
  walkMs: number;
}

export function tileCentre(t: Tile): { x: number; y: number } {
  return { x: t.tx * TILE_SIZE + TILE_SIZE / 2, y: t.ty * TILE_SIZE + TILE_SIZE / 2 };
}

export function tileOf(x: number, y: number): Tile {
  return { tx: Math.floor(x / TILE_SIZE), ty: Math.floor(y / TILE_SIZE) };
}

export interface TownOptions {
  map?: MapSource;
  /** Where she was when the game was last saved. */
  player?: SavedPlayer;
  closet?: Partial<ClosetSnapshot>;
  finds?: Partial<FindsSnapshot>;
  /** Her garden beds as they were saved. */
  beds?: readonly SavedBed[];
  /** The Candy she had saved; a new game starts with a little. */
  candy?: number;
  clock?: Clock;
}

/** Where she is walking to: a prop to use, or a garden bed to tend. */
type Visit = { prop: PlacedProp } | { bed: Tile };

/**
 * The town and everyone in it, with no idea it is being drawn (decisions.md 9). The view reads it
 * once a frame and calls `tapTile`; nothing else reaches in.
 */
export class Town {
  readonly map: TileMap;
  readonly player: Player;
  readonly wardrobe: Wardrobe;
  /** The phone's clock, or a test's (decisions.md 4). */
  readonly clock: Clock;
  readonly bag: Bag;
  readonly farm: Farm;
  readonly events = new EventBus<TownState>();
  /** What she has taken, and on which day; see `systems/gathering.ts`. */
  private taken: Record<string, string>;
  private purse: number;
  /** Today's pop-up, worked out at most once a minute: pathfinding asks for it on every step. */
  private popUpCache: { minute: number; prop: PlacedProp | null } | null = null;
  /** Where she is headed, for the view's sparkle. Null once she arrives. */
  target: Tile | null = null;
  private path: Tile[] = [];
  /** The prop or bed she is walking to, used on arrival. */
  private visiting: Visit | undefined;
  /** An arrival with no walk, made by the next `update` so every arrival comes from one place. */
  private arrivedInPlace: Tile | null = null;

  /**
   * `saved` puts her back where she was. If that tile has stopped being somewhere she can stand (a
   * later map put a tree on it), she starts at her door instead of inside the tree.
   */
  constructor(options: TownOptions = {}) {
    const saved = options.player;
    this.map = parseMap(options.map ?? TOWN);
    this.clock = options.clock ?? systemClock;
    this.wardrobe = new Wardrobe(options.closet);
    this.bag = new Bag(options.finds?.bag);
    this.taken = { ...options.finds?.taken };
    this.farm = new Farm(this.map.beds, options.beds);
    const candy = options.candy ?? STARTING_CANDY;
    this.purse = Number.isInteger(candy) && candy >= 0 ? candy : STARTING_CANDY;
    const startTile = saved && this.canWalk(saved.tx, saved.ty) ? saved : this.map.spawn;
    const facing = saved?.facing ?? 'down';
    this.player = { ...tileCentre(startTile), facing, moving: false, walkMs: 0 };
  }

  /** What of her is worth saving: the tile she is on and the way she faces. */
  snapshot(): SavedPlayer {
    const { tx, ty } = tileOf(this.player.x, this.player.y);
    return { tx, ty, facing: this.player.facing };
  }

  /** Her bag, and today's takings; yesterday's are dropped, since they no longer mean anything. */
  finds(): FindsSnapshot {
    return { bag: this.bag.snapshot(), taken: pruneTaken(this.taken, this.clock.now()) };
  }

  /** Her garden, for saving. */
  garden(): { beds: SavedBed[] } {
    return { beds: this.farm.snapshot() };
  }

  /** Her Candy, for saving. */
  wallet(): { candy: number } {
    return { candy: this.purse };
  }

  get candy(): number {
    return this.purse;
  }

  /** Where the pop-up shop stands today, solid over its footprint, or null if it isn't in town. */
  popUp(): PlacedProp | null {
    const now = this.clock.now();
    const minute = Math.floor(now / 60_000);
    if (this.popUpCache?.minute !== minute) {
      const lot = popUpLot(this.map.popUpLots, now);
      const prop: PlacedProp | null = lot
        ? { id: 'popUpShop', ...lot, ...PROP_FOOTPRINT.popUpShop }
        : null;
      this.popUpCache = { minute, prop };
    }
    return this.popUpCache.prop;
  }

  /** Whether a shop is open to her today. Cobweb Corner always is; the pop-up only when in town. */
  isOpen(shop: ShopId): boolean {
    return shop === 'corner' || this.popUp() !== null;
  }

  /** What a shop has on its shelves today. */
  stock(shop: ShopId): Shelf[] {
    return stockOf(shop, dayKey(this.clock.now()));
  }

  /**
   * Buys one of something on a shop's shelves today: into her bag, or into her closet for good.
   * Null, and nothing spent, if the shop is shut, it isn't on the shelves today, she can't afford
   * it, or it's a piece of clothing she already has.
   */
  buy(shop: ShopId, ware: Ware): WorldEvent | null {
    if (!this.isOpen(shop)) return null;
    const offer = this.stock(shop)
      .flatMap((shelf) => shelf.offers)
      .find((o) => sameWare(o.ware, ware));
    if (!offer || offer.price > this.purse) return null;
    if ('outfit' in ware) {
      if (!this.wardrobe.give(ware.outfit)) return null;
    } else {
      this.bag.add(ware.item, 1);
      this.events.emit('bag', this.bag.contents);
    }
    this.purse -= offer.price;
    this.events.emit('candy', this.purse);
    return { kind: 'bought', shop, ware, price: offer.price };
  }

  /** Sells `count` of something in her bag, if she has that many and a shop will take it. */
  sell(item: ItemId, count = 1): WorldEvent | null {
    if (!canSell(item) || !this.bag.remove(item, count)) return null;
    const candy = sellValue(item) * count;
    this.purse += candy;
    this.events.emit('bag', this.bag.contents);
    this.events.emit('candy', this.purse);
    return { kind: 'sold', item, count, candy };
  }

  /** Whether a tree, rock or patch (by its key in `systems/gathering.ts`) has anything to give today. */
  isReady(key: string): boolean {
    return isReady(this.taken, key, this.clock.now());
  }

  /** Tonight's snack, where it waits, until she finds it. Null by day. */
  snack(): Snack | null {
    return snackTonight(this.map.snackSpots, this.taken, this.clock.now());
  }

  /** Open ground, and not where the pop-up shop happens to be standing today. */
  canWalk = (tx: number, ty: number): boolean =>
    walkable(this.map, tx, ty) && !covers(this.popUp(), tx, ty);

  /**
   * Walk to a tapped tile. A tap on something solid (a tree, a house, a garden bed) walks to the
   * open tile beside it that is quickest to reach, and she uses it when she gets there. Returns
   * false when there is nowhere to go.
   */
  tapTile(tx: number, ty: number): boolean {
    const here = tileOf(this.player.x, this.player.y);
    const prop = this.propAt(tx, ty);
    const goals = this.canWalk(tx, ty) ? [{ tx, ty }] : this.openTilesBeside(tx, ty);
    let best: Tile[] | null = null;
    for (const goal of goals) {
      const path = findPath(here, goal, this.canWalk, this.map.width, this.map.height);
      if (path && (!best || path.length < best.length)) best = path;
    }
    if (!best) return false;
    const bed = { tx, ty };
    this.visiting = prop ? { prop } : this.farm.isBed(bed) ? { bed } : undefined;
    this.arrivedInPlace = null;

    // Back to the middle of her own tile first: heading straight for the next one from part way
    // along a step could shave the corner of whatever she is walking past.
    const centre = tileCentre(here);
    const offCentre = centre.x !== this.player.x || centre.y !== this.player.y;
    this.path = offCentre ? [here, ...best] : best;
    this.target = best.at(-1) ?? here;
    if (this.path.length === 0) {
      this.stop();
      this.arrivedInPlace = here;
    } else {
      this.player.moving = true;
    }
    return true;
  }

  update(deltaMs: number): WorldEvent[] {
    const events: WorldEvent[] = [];
    if (this.arrivedInPlace) {
      events.push(...this.arrival(this.arrivedInPlace));
      this.arrivedInPlace = null;
    }
    if (this.path.length === 0) return events;
    const p = this.player;
    let budget = (WALK_SPEED * deltaMs) / 1000;
    p.moving = true;
    p.walkMs += deltaMs;

    // Spend the frame's whole travel, across as many tiles as it covers, so a long frame on a slow
    // phone lands exactly where a smooth one would.
    while (budget > 0 && this.path.length > 0) {
      const next = tileCentre(this.path[0]!);
      const dx = next.x - p.x;
      const dy = next.y - p.y;
      const dist = Math.hypot(dx, dy);
      if (dist > 0) p.facing = facingFor(dx, dy);
      if (dist <= budget) {
        p.x = next.x;
        p.y = next.y;
        budget -= dist;
        this.path.shift();
      } else {
        p.x += (dx / dist) * budget;
        p.y += (dy / dist) * budget;
        budget = 0;
      }
    }

    if (this.path.length === 0) {
      events.push(...this.arrival(tileOf(p.x, p.y)));
      this.stop();
    }
    return events;
  }

  /**
   * She has arrived, and anything there that gives something is gathered: the tree or rock she
   * walked up to, the flowers she walked onto, or the night's snack where it waits.
   */
  private arrival(here: Tile): WorldEvent[] {
    const arrived: WorldEvent = { kind: 'arrived', tx: here.tx, ty: here.ty };
    const events: WorldEvent[] = [arrived];
    const visit = this.visiting;
    this.visiting = undefined;
    if (visit && 'bed' in visit) return [arrived, this.tend(visit.bed)];

    const prop = visit?.prop;
    if (prop) {
      arrived.at = prop.id;
      const give = PROP_YIELDS[prop.id];
      if (give) events.push(this.gather(propKey(prop), prop.id, give));
    }
    const patch = this.map.patches.find((p) => p.tx === here.tx && p.ty === here.ty);
    if (patch && !prop) {
      events.push(this.gather(patchKey(patch), 'flowers', PATCHES[patch.id]));
    }
    const snack = this.snack();
    if (snack && snack.tx === here.tx && snack.ty === here.ty && !prop) {
      events.push(this.gather(SNACK_KEY, 'snack', { item: snack.item, count: 1 }));
    }
    return events;
  }

  /** Something rare (a blue rose) is read from where and which day, so it's fixed all day. */
  private gather(key: string, from: GatherSource, give: Yield): WorldEvent {
    if (!this.isReady(key)) return { kind: 'resting', from, item: give.item };
    const today = dayKey(this.clock.now());
    const { item, count } = yieldOf(give, `${key}@${today}`);
    this.taken[key] = today;
    this.bag.add(item, count);
    this.events.emit('bag', this.bag.contents);
    return { kind: 'gathered', from, item, count };
  }

  /**
   * She has walked up to a garden bed: she tills it if it's wild, picks what's ripe (and keeps a
   * seed back to plant again), or waters what's growing, once a day. An empty bed waits for her to
   * choose a seed, which the HUD asks her and hands to `plant`.
   */
  private tend(bed: Tile): WorldEvent {
    const now = this.clock.now();
    const { tx, ty } = bed;
    if (!this.farm.isTilled(bed)) {
      this.farm.till(bed);
      return { kind: 'tilled', tx, ty };
    }
    const planting = this.farm.planting(bed);
    if (!planting) return { kind: 'bare', tx, ty };
    const { crop } = planting;
    const row = CROPS[crop];
    if (stageOf(planting, now) === 'ripe') {
      const { item, count } = yieldOf(row.harvest, plantingSeed(bedKey(bed), planting));
      this.bag.add(item, count);
      this.bag.add(row.seed, 1);
      this.farm.set(bed, null);
      this.events.emit('bag', this.bag.contents);
      return { kind: 'harvested', crop, item, count, seed: row.seed };
    }
    if (canWater(planting, now)) {
      const watered = water(planting, now);
      this.farm.set(bed, watered);
      return { kind: 'watered', crop, days: daysToRipe(watered, now) };
    }
    return { kind: 'growing', crop, days: daysToRipe(planting, now) };
  }

  /**
   * Plants a seed from her bag in a tilled, empty bed. Null, and nothing taken, if the bed isn't
   * ready for one or she has none of that seed.
   */
  plant(tx: number, ty: number, seed: ItemId): WorldEvent | null {
    const bed = { tx, ty };
    const crop = cropFromSeed(seed);
    if (!crop || !this.farm.isTilled(bed) || this.farm.planting(bed)) return null;
    if (!this.bag.remove(seed)) return null;
    this.farm.set(bed, { crop, plantedAt: this.clock.now(), waterings: 0, lastWatered: null });
    this.events.emit('bag', this.bag.contents);
    return { kind: 'planted', crop, tx, ty };
  }

  private propAt(tx: number, ty: number): PlacedProp | undefined {
    const popUp = this.popUp();
    if (covers(popUp, tx, ty)) return popUp!;
    return this.map.props.find((p) => covers(p, tx, ty));
  }

  private stop(): void {
    this.player.moving = false;
    this.player.walkMs = 0;
    this.target = null;
  }

  private openTilesBeside(tx: number, ty: number): Tile[] {
    const box = this.propAt(tx, ty) ?? { tx, ty, w: 1, h: 1 };
    const open: Tile[] = [];
    for (let y = box.ty - 1; y <= box.ty + box.h; y++) {
      for (let x = box.tx - 1; x <= box.tx + box.w; x++) {
        const inside = x >= box.tx && x < box.tx + box.w && y >= box.ty && y < box.ty + box.h;
        if (!inside && this.canWalk(x, y)) open.push({ tx: x, ty: y });
      }
    }
    return open;
  }
}

function covers(p: PlacedProp | null, tx: number, ty: number): boolean {
  return p !== null && tx >= p.tx && tx < p.tx + p.w && ty >= p.ty && ty < p.ty + p.h;
}

function facingFor(dx: number, dy: number): Facing {
  if (Math.abs(dx) > Math.abs(dy)) return dx > 0 ? 'right' : 'left';
  return dy > 0 ? 'down' : 'up';
}
