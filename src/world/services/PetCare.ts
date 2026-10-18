import { TILE_SIZE } from '../../config/world';
import { TRICKS, TREAT_LINES, WALK_TILES, type FondKind } from '../../data/affection';
import { isKept, ITEMS } from '../../data/items';
import { PET_IDS } from '../../data/pets';
import { ITEM_VALUE } from '../../data/shop';
import { patLineAt } from '../../systems/affection';
import type { Habitats } from '../../systems/critters';
import { dayKey } from '../../systems/clock';
import { hashString } from '../../systems/random';
import type { Tile } from '../../systems/pathfinding';
import { restSpots, type RestSpot } from '../../systems/petRest';
import {
  BONE_KEY,
  boneLine,
  lostBone,
  NO_FINDS,
  type LostBone,
  type PetFinds,
} from '../../systems/pets';
import type { AccessoryId, Facing, ItemId, PetId, ZoneId } from '../../types/ids';
import type { Bag } from '../Bag';
import type { WorldContext } from '../context';
import type { WorldEvent } from '../events';
import type { Home } from '../Home';
import type { Movement } from '../Movement';
import type { Ground } from '../Neighbour';
import { nearestOpen, Pet, type PetDeed } from '../Pet';
import type { Pets } from '../Pets';
import type { HomeZone } from '../zones/HomeZone';
import type { MapZone } from '../zones/MapZone';
import type { Zone } from '../zones/Zone';
import type { Takings } from './Takings';

/** A step back from the way she faces, which is where a pet sits beside her. */
const FACING_STEP: Record<Facing, readonly [number, number]> = {
  up: [0, -1],
  down: [0, 1],
  left: [-1, 0],
  right: [1, 0],
};

/** What seeing to her pets reads of the rest of the world. */
export interface PetCareReads {
  pets: Pets;
  bag: Bag;
  takings: Takings;
  movement: Movement;
  homeZone: HomeZone;
  townZone: MapZone;
  /** Where Fibi hides her bones in town: beside the trees, pumpkins and graves. */
  habitats: Habitats;
  /** Where she is now. */
  where: () => ZoneId;
  zone: () => Zone;
  /** Her home, for where the pets rest in it (V1's R6c). */
  home?: Home;
  /** What a walk turns up where she is, for a pet's job (V1's R6c); nothing indoors. */
  finds?: () => PetFinds;
  /** Wybie has brought her a dropped thing: as though she'd walked onto it herself. */
  fetched?: (at: Tile) => WorldEvent[];
}

/** Where a moment about a pet is, in world pixels: over its back. */
function over(pet: Pet): { x: number; y: number } {
  return { x: Math.round(pet.x), y: Math.round(pet.y) - 14 - (pet.perch?.lift ?? 0) };
}

/** The middle of a tile, in world pixels. */
function middleOf(t: Tile): { x: number; y: number } {
  return { x: t.tx * TILE_SIZE + TILE_SIZE / 2, y: t.ty * TILE_SIZE + TILE_SIZE / 2 };
}

/**
 * Their six pets (decisions.md 17, 67–71): the one walking with her, those pottering at home,
 * patting, names and accessories, and Fibi's lost bones; and since V1's R6c, how fond each is of
 * her, the treats she gives them, their jobs on walks, their tricks and where they rest at home.
 */
export class PetCare {
  private readonly ctx: WorldContext;
  private readonly reads: PetCareReads;
  /** Her pets themselves, wherever each one is: at home, or out with her. */
  readonly all: readonly Pet[];
  /** Whose sheet is open, if anyone's: they wait for her. */
  private petting: PetId | null = null;
  /** How many times she has patted each this visit, for what they do about it. */
  private pats = new Map<PetId, number>();
  /** How long she has been standing still, which the pets notice. */
  private stillMs = 0;
  /** Tiles she has walked outdoors with the pet beside her, towards a walk's point. */
  private walked = 0;
  private lastTile: Tile | null = null;
  /** The jobs done today, by place: a critter barked at, an orb drawn, a mound found. */
  private done = { day: '', keys: new Set<string>() };
  /** The critters Dolly has barked out today, which settle, and where Elvira drew the orbs. */
  private readonly settled = new Set<string>();
  private readonly drawn = new Map<string, Tile>();
  /** Where each rests in the room she's in, worked out again when the room changes. */
  private rests: { layout: string; spots: Map<PetId, RestSpot> } | null = null;

  constructor(ctx: WorldContext, reads: PetCareReads) {
    this.ctx = ctx;
    this.reads = reads;
    const roam = reads.homeZone.roamTiles();
    const mat = reads.homeZone.entry().tile;
    this.all = PET_IDS.map((id) => new Pet(id, roam[hashString(`pet:${id}`) % roam.length] ?? mat));
    this.bringWalker();
    ctx.signals.on('crossed', ({ from, to }) => {
      if (from === 'home' && to === 'home') this.potterIn();
      this.bringWalker();
      this.lastTile = null;
    });
  }

  get pets(): Pets {
    return this.reads.pets;
  }

  pet(id: PetId): Pet {
    return this.all.find((p) => p.id === id)!;
  }

  /** The pets where she is now: all those at home when she's in, and the one out walking with her. */
  here(): Pet[] {
    const where = this.reads.where();
    return this.all.filter((p) => p.scene === where);
  }

  /** The pet on a tile where she is, if any. */
  petAt(tx: number, ty: number): Pet | undefined {
    return this.here().find((p) => {
      const t = p.tile;
      return t.tx === tx && t.ty === ty;
    });
  }

  /** Whose sheet is open, if anyone's. */
  get pettingNow(): PetId | null {
    return this.petting;
  }

  /** She has walked up to a pet, and its sheet opens. */
  startPet(id: PetId): void {
    this.petting = id;
  }

  /** She's done with a pet's sheet, and it can go back to what it was doing. */
  endPet(): void {
    this.petting = null;
  }

  /** Pets one: what it does about it, from the lines its fondness has reached. */
  patPet(id: PetId): string {
    const count = this.pats.get(id) ?? 0;
    this.pats.set(id, count + 1);
    const pet = this.pet(id);
    pet.say('heart', this.ctx.clock.now(), 1600);
    this.fonder(id, 'pat');
    this.ctx.moments.push({ kind: 'petted', pet: id, at: over(pet) });
    return patLineAt(id, this.pets.nameOf(id), count, this.pets.level(id));
  }

  /**
   * A pat, a walk's steps or a treat makes a pet fonder of her (V1's R6c), up to the day's count
   * for each; reaching a level is a moment, with the new things it does.
   */
  private fonder(id: PetId, kind: FondKind): void {
    const was = this.pets.level(id);
    if (this.pets.fonder(id, kind, dayKey(this.ctx.clock.now())) === 0) return;
    const level = this.pets.level(id);
    if (level > was) {
      const name = this.pets.nameOf(id);
      this.ctx.moments.push({ kind: 'petGrew', pet: id, name, level, at: over(this.pet(id)) });
    }
    this.ctx.events.emit('pets', this.pets);
  }

  /** The plainest snack or sweet in her bag, for a treat; never one she keeps. */
  treatFor(): ItemId | null {
    const { bag } = this.reads;
    const treats = bag.contents
      .map((s) => s.id)
      .filter((id) => (ITEMS[id].kind === 'snack' || ITEMS[id].kind === 'treat') && !isKept(id));
    return treats.sort((a, b) => ITEM_VALUE[a] - ITEM_VALUE[b])[0] ?? null;
  }

  /** Whether a treat would count today: one a day each, and she has something to give. */
  canTreat(id: PetId): boolean {
    const day = dayKey(this.ctx.clock.now());
    const fond = this.pets.fondness(id);
    return this.treatFor() !== null && !(fond.day === day && fond.treat > 0);
  }

  /** Gives a pet a treat from her bag: what it does with it, or null if it couldn't be. */
  treat(id: PetId): string | null {
    const { bag } = this.reads;
    const item = this.treatFor();
    if (!this.canTreat(id) || !item || !bag.remove(item)) return null;
    this.ctx.events.emit('bag', bag.contents);
    const pet = this.pet(id);
    pet.say('heart', this.ctx.clock.now(), 2000);
    this.fonder(id, 'treat');
    this.ctx.moments.push({ kind: 'petted', pet: id, at: over(pet), treat: item });
    return TREAT_LINES[id]
      .replaceAll('{name}', this.pets.nameOf(id))
      .replaceAll('{treat}', ITEMS[item].name.toLowerCase());
  }

  /** Its trick, once it knows one (level two): what it does, or null if it doesn't yet. */
  trick(id: PetId): string | null {
    if (this.pets.level(id) < 2) return null;
    const pet = this.pet(id);
    pet.perform(this.ctx.clock.now());
    this.ctx.moments.push({ kind: 'petTrick', pet: id, at: over(pet) });
    return TRICKS[id].line.replaceAll('{name}', this.pets.nameOf(id));
  }

  /** Whether Dolly barked a critter out today, so it's settled and stays put for her net. */
  calmed(key: string): boolean {
    return this.settled.has(key);
  }

  /** Where Elvira drew an orb to today, if she drew it. */
  drawnTo(key: string): Tile | null {
    return this.drawn.get(key) ?? null;
  }

  /**
   * Takes a pet out walking with her, or with null, sends whoever was home. Only one walks with
   * her at a time (decisions.md 67); the one who was goes home, and the new one comes to her side.
   */
  walkWith(id: PetId | null): void {
    const was = this.pets.walking;
    if (was === id) return;
    if (was) {
      const pet = this.pet(was);
      if (pet.scene !== 'home') {
        pet.scene = 'home';
        const roam = this.reads.homeZone.roamTiles();
        pet.place(roam[hashString(`pet:${was}`) % roam.length] ?? this.reads.homeZone.entry().tile);
      }
    }
    this.pets.walking = id;
    this.walked = 0;
    if (id && this.pet(id).scene !== this.reads.where()) this.bringWalker();
    this.ctx.events.emit('pets', this.pets);
  }

  /** Gives a pet a name; an empty one gives them back their own. The name they have now. */
  rename(id: PetId, name: string): string {
    const named = this.pets.rename(id, name);
    this.ctx.events.emit('pets', this.pets);
    return named;
  }

  /** Dresses a pet in an accessory she owns, or with null, takes it off. */
  dress(id: PetId, what: AccessoryId | null): boolean {
    if (!this.pets.dress(id, what)) return false;
    this.ctx.events.emit('pets', this.pets);
    return true;
  }

  /** Gives Fibi back one of her bones, which makes her day. What she does, or null without one. */
  returnBone(): string | null {
    const { bag } = this.reads;
    if (!bag.remove('fibisBone')) return null;
    const now = this.ctx.clock.now();
    this.pets.boneBack(dayKey(now));
    this.pet('fibi').say('heart', now, 2400);
    this.ctx.events.emit('bag', bag.contents);
    this.ctx.events.emit('pets', this.pets);
    return boneLine(this.pets.nameOf('fibi'), this.pets.bones);
  }

  /** Where Fibi's bone is waiting today, until she finds it; null on a day Fibi kept hold of it. */
  lostBone(): LostBone | null {
    if (!this.reads.takings.isReady(BONE_KEY)) return null;
    const { trees, pumpkins, graves } = this.reads.habitats;
    const town = [...trees, ...pumpkins, ...graves].filter((t) =>
      this.reads.townZone.canWalk(t.tx, t.ty),
    );
    const bone = lostBone(dayKey(this.ctx.clock.now()), town, this.reads.homeZone.underFurniture());
    // It's under something in the front room, and so not in any other (0.3's H4).
    return bone?.scene === 'home' && !this.reads.homeZone.inFrontRoom ? null : bone;
  }

  /** Where she is, as a pet walks it. */
  private ground(): Ground {
    const zone = this.reads.zone();
    return { canWalk: zone.canWalk, width: zone.width, height: zone.height };
  }

  /**
   * Her pets at home follow her through into whichever of her rooms she goes (0.3's H4), each to
   * its own spot about the floor.
   */
  private potterIn(): void {
    const roam = this.reads.homeZone.roamTiles();
    const mat = this.reads.homeZone.entry().tile;
    for (const pet of this.all) {
      if (pet.scene === 'home') pet.place(roam[hashString(`pet:${pet.id}`) % roam.length] ?? mat);
    }
  }

  /** The pet walking with her comes to wherever she is, and sits beside her. */
  bringWalker(): void {
    const id = this.pets.walking;
    if (!id) return;
    const pet = this.pet(id);
    pet.scene = this.reads.where();
    const { movement } = this.reads;
    const here = movement.tile;
    const [dx, dy] = FACING_STEP[movement.player.facing];
    const back = { tx: here.tx - dx, ty: here.ty - dy };
    const spot = this.reads.zone().canWalk(back.tx, back.ty)
      ? back
      : (nearestOpen(here, this.ground()) ?? here);
    pet.place(spot);
    pet.pose = 'sit';
  }

  /** Where each pet rests in the room she's in at home (V1's R6c). */
  restOf(id: PetId): RestSpot | null {
    const home = this.reads.home;
    if (!home) return null;
    const layout = `${home.here}:${home.layout}`;
    if (this.rests?.layout !== layout) {
      this.rests = { layout, spots: restSpots(home.placed, (tx, ty) => home.canWalk(tx, ty)) };
    }
    return this.rests.spots.get(id) ?? null;
  }

  /** The day's jobs, by place, forgotten when the day turns. */
  private jobsToday(): Set<string> {
    const day = dayKey(this.ctx.clock.now());
    if (this.done.day !== day) {
      this.done = { day, keys: new Set() };
      this.settled.clear();
      this.drawn.clear();
    }
    return this.done.keys;
  }

  /** What a pet did that the world should know of: its job on a walk, or its trick. */
  private deed(pet: Pet, deed: PetDeed, where: ZoneId): void {
    const done = this.jobsToday();
    if ('trick' in deed) {
      this.ctx.moments.push({ kind: 'petTrick', pet: pet.id, at: over(pet), own: true });
      return;
    }
    const name = this.pets.nameOf(pet.id);
    if (deed.job === 'sniff') {
      done.add(`${where}:sniff`);
      this.ctx.moments.push({
        kind: 'petHelped',
        pet: pet.id,
        name,
        job: 'sniff',
        at: middleOf(deed.at),
      });
    } else if (deed.job === 'bark') {
      done.add(`${where}:bark:${deed.key}`);
      this.settled.add(deed.key);
      this.ctx.moments.push({
        kind: 'petHelped',
        pet: pet.id,
        name,
        job: 'bark',
        at: middleOf(deed.at),
      });
    } else if (deed.job === 'draw') {
      done.add(`${where}:draw:${deed.key}`);
      this.drawn.set(deed.key, deed.to);
      this.ctx.moments.push({
        kind: 'petHelped',
        pet: pet.id,
        name,
        job: 'draw',
        at: middleOf(deed.to),
      });
    } else {
      this.ctx.moments.push({
        kind: 'petHelped',
        pet: pet.id,
        name,
        job: 'fetch',
        at: middleOf(deed.at),
      });
      for (const e of this.reads.fetched?.(deed.at) ?? []) this.ctx.moments.push(e);
    }
  }

  /** Steps walked outdoors with the pet beside her: a walk's point every so many tiles. */
  private countSteps(where: ZoneId): void {
    const walker = this.pets.walking;
    const tile = this.reads.movement.tile;
    const last = this.lastTile;
    this.lastTile = tile;
    if (!walker || where === 'home' || !last || this.pet(walker).scene !== where) return;
    if (last.tx === tile.tx && last.ty === tile.ty) return;
    this.walked += 1;
    if (this.walked < WALK_TILES) return;
    this.walked = 0;
    this.fonder(walker, 'walk');
  }

  /**
   * Her pets, where she is, each up to whatever it's up to: the one walking with her follows her,
   * and those at home potter about. One she's walking up to (`heading`), or whose sheet is open,
   * waits. `villagers` are the tiles her neighbours stand on, where she is.
   */
  step(deltaMs: number, heading: PetId | null, villagers: readonly Tile[]): void {
    const p = this.reads.movement.player;
    if (p.moving) this.stillMs = 0;
    else this.stillMs += deltaMs;
    const where = this.reads.where();
    this.countSteps(where);
    const here = this.here();
    if (here.length === 0) return;
    const now = this.ctx.clock.now();
    const her = { x: p.x, y: p.y, facing: p.facing, moving: p.moving, stillMs: this.stillMs };
    const done = this.jobsToday();
    const surroundings = {
      now,
      ground: this.ground(),
      her,
      villagers: where === 'home' ? [] : [...villagers],
      roam: where === 'home' ? this.reads.homeZone.roamTiles() : [],
      happy: this.pets.fibiHappy(dayKey(now)),
      done: (key: string) => done.has(`${where}:${key}`),
    };
    for (const pet of here) {
      const following = pet.id === this.pets.walking;
      const level = this.pets.level(pet.id);
      const finds = following && where !== 'home' && level >= 1 ? this.findsNow() : NO_FINDS;
      const deed = pet.update(deltaMs, {
        ...surroundings,
        following,
        held: pet.id === this.petting || pet.id === heading,
        level,
        rest: where === 'home' && !following ? this.restOf(pet.id) : null,
        finds,
      });
      if (deed) this.deed(pet, deed, where);
    }
  }

  /** What's round her for a pet's job just now, read off the world's own services. */
  private findsNow(): PetFinds {
    return this.reads.finds?.() ?? NO_FINDS;
  }
}
