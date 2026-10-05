import { PET_IDS } from '../../data/pets';
import type { Habitats } from '../../systems/critters';
import { dayKey } from '../../systems/clock';
import { hashString } from '../../systems/random';
import type { Tile } from '../../systems/pathfinding';
import { BONE_KEY, boneLine, lostBone, patLine, type LostBone } from '../../systems/pets';
import type { AccessoryId, Facing, PetId, ZoneId } from '../../types/ids';
import type { Bag } from '../Bag';
import type { WorldContext } from '../context';
import type { Movement } from '../Movement';
import type { Ground } from '../Neighbour';
import { nearestOpen, Pet } from '../Pet';
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
}

/**
 * Their six pets (decisions.md 17, 67–71): the one walking with her, those pottering at home,
 * patting, names and accessories, and Fibi's lost bones.
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

  /** Pets one: what it does about it. */
  patPet(id: PetId): string {
    const count = this.pats.get(id) ?? 0;
    this.pats.set(id, count + 1);
    this.pet(id).say('heart', this.ctx.clock.now(), 1600);
    return patLine(id, this.pets.nameOf(id), count);
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

  /**
   * Her pets, where she is, each up to whatever it's up to: the one walking with her follows her,
   * and those at home potter about. One she's walking up to (`heading`), or whose sheet is open,
   * waits. `villagers` are the tiles her neighbours stand on, where she is.
   */
  step(deltaMs: number, heading: PetId | null, villagers: readonly Tile[]): void {
    const p = this.reads.movement.player;
    if (p.moving) this.stillMs = 0;
    else this.stillMs += deltaMs;
    const here = this.here();
    if (here.length === 0) return;
    const now = this.ctx.clock.now();
    const where = this.reads.where();
    const her = { x: p.x, y: p.y, facing: p.facing, moving: p.moving, stillMs: this.stillMs };
    const surroundings = {
      now,
      ground: this.ground(),
      her,
      villagers: where === 'home' ? [] : [...villagers],
      roam: where === 'home' ? this.reads.homeZone.roamTiles() : [],
      happy: this.pets.fibiHappy(dayKey(now)),
    };
    for (const pet of here) {
      pet.update(deltaMs, {
        ...surroundings,
        following: pet.id === this.pets.walking,
        held: pet.id === this.petting || pet.id === heading,
      });
    }
  }
}
