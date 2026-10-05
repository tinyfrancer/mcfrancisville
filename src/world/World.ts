import { FURNITURE } from '../data/furniture';
import { FIXTURES } from '../data/interiors';
import type { Placed } from '../data/home';
import { isFish } from '../data/critters';
import { dayKey } from '../systems/clock';
import { BONE_KEY } from '../systems/pets';
import type { PlacedProp } from '../systems/grid';
import { findPath, type Tile } from '../systems/pathfinding';
import { sayTo } from '../systems/friendship';
import type { BedJob } from '../systems/beds';
import { banksOf, iceBeside } from '../systems/ice';
import type { FurnitureId, PetId, VillagerId } from '../types/ids';
import { bedKey, placeOf, type Plot } from './Farm';
import type { Pet } from './Pet';
import { facingFor, type Neighbour } from './Neighbour';
import { reach, tileCentre, type Player } from './Movement';
import { worthVisiting, type RoomThing } from './zones/RoomZone';
import { WorldParts } from './build';
import type { Arrived, Critter, WorldEvent } from './events';
import { GOOSE_OUTFITS } from '../data/geese';
import { PROP_SEATS, type SeatRow } from '../data/seats';
import { footprint } from '../systems/decor';
import { boxOf } from './zones/RoomZone';
import { seatOn, type SeatBox, type SeatFacing } from './services/Sitting';

export { fromSave, type FindsSnapshot, type WorldOptions, type WorldSave } from './options';

export { tileCentre, tileOf, WALK_SPEED, type Player } from './Movement';

export { DANCE_MS, DANCE_RECORD } from './services/RecordPlayer';

export { NET_MS } from './services/Collecting';

export type {
  Chat,
  Critter,
  Decorating,
  GatherSource,
  GiftResult,
  MailView,
  WorldEvent,
  WorldState,
} from './events';

/**
 * Where she is walking to: a prop to use, a garden bed to tend, a piece of furniture at home, or a
 * neighbour to talk to (who may have wandered off by the time she gets there, so she tries again).
 */
type Visit =
  | { kind: 'prop'; prop: PlacedProp }
  | { kind: 'bed'; bed: Plot; job: BedJob }
  | { kind: 'piece'; piece: Placed }
  | { kind: 'villager'; villager: VillagerId; tries: number }
  | { kind: 'critter'; critter: string }
  | { kind: 'fish'; fish: string }
  | { kind: 'pet'; pet: PetId }
  | { kind: 'thing'; thing: RoomThing }
  | { kind: 'ice'; toward: Tile };

/** What arriving does, for each kind of visit: a new kind doesn't compile until it has one. */
type Arrivals = {
  [K in Visit['kind']]: (
    visit: Extract<Visit, { kind: K }>,
    here: Tile,
    arrived: Arrived,
  ) => WorldEvent[];
};

/** A chair turned to the wall seats her with her back to us; any other way, facing us. */
function seatFacing(id: FurnitureId, turn: number): SeatFacing {
  return FURNITURE[id].turns === 'four' && turn === 2 ? 'up' : 'down';
}

/** How many times she follows a neighbour who has moved on before she gives up. */
const FOLLOW_TRIES = 4;

/**
 * The town and everyone in it, with no idea it is being drawn (decisions.md 9). The view reads it
 * once a frame and calls `tapTile`; nothing else reaches in.
 */
export class World extends WorldParts {
  /** The prop or bed she is walking to, used on arrival. */
  private visiting: Visit | undefined;
  /** An arrival with no walk, made by the next `update` so every arrival comes from one place. */
  private arrivedInPlace: Tile | null = null;

  protected forget(): void {
    this.visiting = undefined;
    this.arrivedInPlace = null;
    this.sitting.stand();
  }

  /** Sits her down on a seat she has walked up to, facing the way it does. */
  private sitOn(box: SeatBox, row: SeatRow | undefined, facing: SeatFacing, here: Tile): void {
    if (!row) return;
    this.sitting.sit(seatOn(box, row, facing, here));
    this.player.facing = facing;
  }

  /** The size of where she is, in tiles. */
  get size(): { width: number; height: number } {
    return { width: this.zone.width, height: this.zone.height };
  }

  /** Walks up beside a pet, to see to it. */
  private approach(pet: Pet): boolean {
    const here = this.movement.tile;
    if (reach(here, pet.tile) === 1) return this.walkTo([here], { kind: 'pet', pet: pet.id });
    return this.walkTo(this.around(pet.tile), { kind: 'pet', pet: pet.id });
  }

  /** The open tiles around `at`, where she can stand to reach something there. */
  private around(at: Tile): Tile[] {
    const tiles: Tile[] = [];
    for (let ty = at.ty - 1; ty <= at.ty + 1; ty++) {
      for (let tx = at.tx - 1; tx <= at.tx + 1; tx++) {
        if ((tx !== at.tx || ty !== at.ty) && this.canWalk(tx, ty)) tiles.push({ tx, ty });
      }
    }
    return tiles;
  }

  /** Creeps up within reach of a critter, to catch it: a swing of her net, or a cast for a fish. */
  private stalk(critter: Critter): boolean {
    const here = this.movement.tile;
    const visit: Visit = isFish(critter.critter)
      ? { kind: 'fish', fish: critter.key }
      : { kind: 'critter', critter: critter.key };
    if (reach(here, critter) <= 1) return this.walkTo([here], visit);
    return this.walkTo(this.around(critter), visit);
  }

  /** Where she is, and which way she faces, for the view to draw. */
  get player(): Player {
    return this.movement.player;
  }

  /** Where she is headed, for the view's sparkle. Null once she arrives. */
  get target(): Tile | null {
    return this.movement.target;
  }

  /** Whether she has her skates, which the ice needs (phase B1). */
  get skating(): boolean {
    return this.bag.count('iceSkates') > 0;
  }

  /** Whether a tile is ice she can't walk on yet: she has no skates. */
  private slipsOn = (tx: number, ty: number): boolean =>
    !this.skating && (this.zones.outdoor(this.scene)?.slippery(tx, ty) ?? false);

  /** The ground as she can walk it: anywhere open, but ice only on her skates. */
  canWalk = (tx: number, ty: number): boolean => this.zone.canWalk(tx, ty) && !this.slipsOn(tx, ty);

  /**
   * Walk to a tapped tile. A tap on something solid (a tree, a house, a garden bed) walks to the
   * open tile beside it that is quickest to reach, and she uses it when she gets there. Returns
   * false when there is nowhere to go.
   */
  tapTile(tx: number, ty: number): boolean {
    this.poses.stir();
    // Sitting, a tap only stands her up (decision 136).
    if (this.sitting.stand()) return true;
    // With her line in, a tap anywhere reels in, the fish if it's biting.
    const reeled = this.fishing.reel();
    if (reeled) {
      this.ctx.moments.push(reeled);
      return true;
    }
    if (this.decorating.state) return this.decorating.tap(tx, ty);
    const looking = this.garden.looking;
    this.garden.lookAt(null);
    this.recordPlayer.stop();
    this.neighbourhood.endTalk();
    this.petCare.endPet();
    const neighbour = this.neighbourhood.villagerAt(tx, ty);
    if (neighbour) return this.follow(neighbour, 0);
    // She sets off after Wes; he'll be gone by the time she's near.
    const wes = this.mystery.wesAt(tx, ty);
    if (wes) return this.walkTo([wes], undefined);
    const critter = this.collecting.critterAt(tx, ty);
    if (critter) return this.stalk(critter);
    const pet = this.petCare.petAt(tx, ty);
    if (pet) return this.approach(pet);
    const prop = this.zone.propAt(tx, ty);
    const piece =
      this.scene === 'home'
        ? this.home.pieceAt(tx, ty)
        : this.scene === 'town'
          ? this.yard.pieceAt(tx, ty)
          : undefined;
    const thing = this.zones.inside(this.scene)?.thingAt(tx, ty);
    // Ice with no skates: to the edge of it, where she tries it and slides back.
    if (!prop && this.slipsOn(tx, ty)) {
      const banks = banksOf({ tx, ty }, this.slipsOn, this.canWalk);
      return this.walkTo(banks, { kind: 'ice', toward: { tx, ty } });
    }
    const goals = this.canWalk(tx, ty) ? [{ tx, ty }] : this.zone.standBeside(tx, ty);
    const bed = { zone: this.scene, tx, ty };
    let visit: Visit | undefined;
    if (prop) visit = { kind: 'prop', prop };
    else if (this.farm.isBed(bed)) {
      // A bed says what a tap will do before it does it (phase P): the first tap looks at it.
      if (!looking || bedKey(looking) !== bedKey(bed)) {
        this.garden.lookAt(bed);
        return true;
      }
      visit = { kind: 'bed', bed, job: 'tend' };
    } else if (piece && FURNITURE[piece.id].layer !== 'rug') visit = { kind: 'piece', piece };
    else if (thing && worthVisiting(thing)) visit = { kind: 'thing', thing };
    return this.walkTo(goals, visit) || this.toTheIce(goals);
  }

  /**
   * Somewhere she could reach only across the ice, with no skates: she walks to the edge of the
   * ice on the way and tries it, as a tap on the ice itself does, so the tap is never just ignored.
   */
  private toTheIce(goals: readonly Tile[]): boolean {
    if (this.skating) return false;
    const onSkates = (tx: number, ty: number) => this.zone.canWalk(tx, ty);
    const { width, height } = this.zone;
    for (const goal of goals) {
      const path = findPath(this.movement.tile, goal, onSkates, width, height);
      const ice = path?.find((t) => this.slipsOn(t.tx, t.ty));
      if (!ice) continue;
      return this.walkTo(banksOf(ice, this.slipsOn, this.canWalk), { kind: 'ice', toward: ice });
    }
    return false;
  }

  /** Walks up to a bed to do `job` there, as its pop-up offers. */
  tendBed(bed: Plot, job: BedJob): boolean {
    if (placeOf(bed) !== this.scene || !this.farm.isBed(bed) || this.decorating.state) return false;
    this.garden.lookAt(null);
    this.poses.stir();
    this.recordPlayer.stop();
    this.neighbourhood.endTalk();
    this.petCare.endPet();
    return this.walkTo(this.zone.standBeside(bed.tx, bed.ty), { kind: 'bed', bed, job });
  }

  /**
   * Walks up to a neighbour from the neighbours sheet (0.2's U3), as a tap on them would; false if
   * they aren't where she is. Never a hop to wherever they are.
   */
  seek(id: VillagerId): boolean {
    if (this.decorating.state) return false;
    const neighbour = this.neighbourhood.neighboursIn(this.scene).find((n) => n.id === id);
    if (!neighbour) return false;
    this.poses.stir();
    const reeled = this.fishing.reel();
    if (reeled) this.ctx.moments.push(reeled);
    this.garden.lookAt(null);
    this.recordPlayer.stop();
    this.neighbourhood.endTalk();
    this.petCare.endPet();
    return this.follow(neighbour, 0);
  }

  /** Walks up beside a neighbour, to talk. */
  private follow(neighbour: Neighbour, tries: number): boolean {
    // Gone on somewhere else altogether: she lets them go.
    if (neighbour.zone !== this.scene) return false;
    const here = this.movement.tile;
    // Already beside them: no walk, just a hello.
    const goals = reach(here, neighbour.tile) === 1 ? [here] : this.around(neighbour.tile);
    return this.walkTo(goals, { kind: 'villager', villager: neighbour.id, tries });
  }

  /** Sets off by the quickest way to whichever of `goals` is nearest, to do `visit` there. */
  private walkTo(goals: readonly Tile[], visit: Visit | undefined): boolean {
    this.sitting.stand();
    const ground = { canWalk: this.canWalk, width: this.zone.width, height: this.zone.height };
    if (!this.movement.walkTo(goals, ground)) return false;
    this.visiting = visit;
    this.arrivedInPlace = this.movement.walking ? null : this.movement.tile;
    return true;
  }

  update(deltaMs: number): WorldEvent[] {
    this.travel.check();
    this.mystery.check();
    this.mailbox.checkSpecialDay();
    this.deliveries.check();
    this.weather.check();
    this.holidays.check();
    this.calendar.check();
    this.visits.check();
    this.broom.check();
    this.milestones.check();
    this.stall.check();
    this.decorating.check();
    this.mystery.step(
      this.movement.tile,
      this.neighbourhood.neighboursIn('town').map((n) => n.tile),
    );
    const heading = this.visiting?.kind === 'villager' ? this.visiting.villager : null;
    this.neighbourhood.step(deltaMs, this.player, heading);
    this.petCare.step(
      deltaMs,
      this.visiting?.kind === 'pet' ? this.visiting.pet : null,
      this.neighbourhood.neighboursIn(this.scene).map((n) => n.tile),
    );
    const events = this.ctx.moments.drain();
    events.push(...this.fishing.step());
    if (this.arrivedInPlace) {
      events.push(...this.arrival(this.arrivedInPlace));
      this.arrivedInPlace = null;
    }
    const arrivedAt = this.movement.step(deltaMs, this.kitchen.pace());
    if (arrivedAt) events.push(...this.arrival(arrivedAt));
    this.poses.step(deltaMs);
    for (const e of events) {
      // Walking in on one of their happenings is said as she comes in.
      const happening = e.kind === 'entered' ? this.neighbourhood.happeningIn(e.scene) : null;
      if (e.kind === 'entered' && happening) e.happening = happening;
    }
    return events;
  }

  /**
   * She has arrived, and anything there that gives something is gathered: the tree or rock she
   * walked up to, the flowers she walked onto, or the night's snack where it waits.
   */
  private arrival(here: Tile): WorldEvent[] {
    const events = this.arriveAt(here);
    const bone = this.petCare.lostBone();
    if (
      events.length > 0 &&
      bone?.scene === this.scene &&
      bone.tx === here.tx &&
      bone.ty === here.ty
    ) {
      events.push(this.gathering.gather(BONE_KEY, 'bone', { item: 'fibisBone', count: 1 }));
    }
    return events;
  }

  private arriveAt(here: Tile): WorldEvent[] {
    const arrived: Arrived = { kind: 'arrived', tx: here.tx, ty: here.ty };
    const visit = this.visiting;
    this.visiting = undefined;
    if (!visit) return this.arriveOn(here, undefined, arrived);
    const arrive = this.arrivals[visit.kind] as (v: Visit, h: Tile, a: Arrived) => WorldEvent[];
    return arrive(visit, here, arrived);
  }

  private readonly arrivals: Arrivals = {
    prop: ({ prop }, here, arrived) => this.arriveOn(here, prop, arrived),
    bed: ({ bed, job }, _here, arrived) => {
      const done = this.garden.visit(bed, this.hands.held, job);
      if (done.kind === 'watered') this.hands.use('can');
      return [arrived, done];
    },
    thing: ({ thing }, here, arrived) => {
      const room = this.zones.inside(this.scene);
      if (!room) return [arrived];
      if ('piece' in thing) {
        const { id, turn } = thing.piece;
        this.sitOn(boxOf(thing), FURNITURE[id].seat, seatFacing(id, turn), here);
      }
      const plays =
        'fixture' in thing ? FIXTURES[thing.fixture.id].plays : FURNITURE[thing.piece.id].plays;
      const used = this.interiors.use(room.id, thing, arrived);
      return plays ? [...used, this.instruments.play(plays, room.id)] : used;
    },
    pet: (visit, here, arrived) => {
      const pet = this.petCare.pet(visit.pet);
      if (pet.scene !== this.scene || reach(here, pet.tile) > 1) return [arrived];
      arrived.pet = pet.id;
      this.petCare.startPet(pet.id);
      if (reach(here, pet.tile) > 0) {
        this.player.facing = facingFor(pet.x - this.player.x, pet.y - this.player.y);
      }
      pet.face(this.player.x);
      return [arrived];
    },
    critter: (visit, here, arrived) => {
      // Gone by the time she got there, if the hour turned on the way.
      const critter = this.collecting.find(visit.critter);
      if (!critter || reach(here, critter) > 1) return [arrived];
      const at = tileCentre(critter);
      if (reach(here, critter) > 0) {
        this.player.facing = facingFor(at.x - this.player.x, at.y - this.player.y);
      }
      this.hands.use('net');
      return [arrived, this.collecting.swing(critter)];
    },
    fish: (visit, here, arrived) => {
      const fish = this.collecting.find(visit.fish);
      if (!fish || reach(here, fish) > 1) return [arrived];
      const at = tileCentre(fish);
      if (reach(here, fish) > 0) {
        this.player.facing = facingFor(at.x - this.player.x, at.y - this.player.y);
      }
      this.hands.use('rod');
      return [arrived, this.fishing.castTo(fish)];
    },
    villager: (visit, here, arrived) => {
      const n = this.neighbourhood.neighbour(visit.villager);
      if (n.zone === this.scene && reach(n.tile, here) <= 1) {
        arrived.villager = n.id;
        this.neighbourhood.startTalk(n.id);
        this.player.facing = facingFor(n.x - this.player.x, n.y - this.player.y);
        n.face(this.player.x, this.player.y);
        return [arrived];
      }
      // They'd moved on by the time she got there: after them, a few times, then let them go.
      if (visit.tries + 1 < FOLLOW_TRIES && this.follow(n, visit.tries + 1)) return [];
      return [arrived];
    },
    ice: ({ toward }, here, arrived) => {
      const ice = iceBeside(here, toward, this.slipsOn);
      if (!ice) return [arrived];
      this.movement.slip(ice);
      return [arrived, { kind: 'slipped' }];
    },
    piece: ({ piece }, here, arrived) => {
      arrived.piece = piece.id;
      // A display piece's sheet shows the one she walked up to (0.3's H2).
      this.display.visit(piece);
      const box = { tx: piece.tx, ty: piece.ty, ...footprint(piece.id, piece.turn) };
      this.sitOn(box, FURNITURE[piece.id].seat, seatFacing(piece.id, piece.turn), here);
      const says = FURNITURE[piece.id].says;
      if (says) arrived.says = sayTo(says, this.name, dayKey(this.clock.now()));
      const plays = FURNITURE[piece.id].plays;
      if (plays) return [arrived, this.instruments.play(plays)];
      if (piece.id !== 'recordPlayer') return [arrived];
      return [arrived, this.recordPlayer.play(here, this.canWalk)];
    },
  };

  /**
   * Arriving at a prop, or on open ground: the porch pots, a mound to dig, a way out, or whatever
   * there is to gather.
   */
  private arriveOn(here: Tile, prop: PlacedProp | undefined, arrived: Arrived): WorldEvent[] {
    if (prop) arrived.at = prop.id;
    if (prop) this.sitOn(prop, PROP_SEATS[prop.id], 'down', here);
    if (prop?.sign) arrived.sign = prop.sign.to;
    if (prop?.id === 'pottedPlant') return [arrived, { kind: 'potted', plant: this.porch.swap() }];
    if (prop?.id === 'candyTree') return [arrived, this.candyTree.shake()];
    if (prop?.id === 'saplingPlot') return [arrived, this.candyTree.tend(prop)];
    if (prop?.id === 'pumpkinPatch') return [arrived, this.pumpkinPatch.visit()];
    if (prop?.id === 'honestyStall') {
      const sold = this.stall.collect();
      return sold ? [arrived, sold] : [arrived];
    }
    const outdoors = this.zones.outdoor(this.scene);
    if (prop?.id === 'goose' && outdoors) {
      // The first goose in the map is hers, by her path; the other is Barty's.
      const whose = outdoors.map.props.find((p) => p.id === 'goose') === prop ? 0 : 1;
      arrived.says = GOOSE_OUTFITS[this.holidays.goose(whose)][whose];
      return [arrived];
    }
    if (prop?.id === 'mound' && outdoors) {
      const dug = this.digging.dig(outdoors.id, prop);
      return dug ? [arrived, dug] : [arrived];
    }
    const crossing = this.zone.doorAt(here, prop);
    if (crossing)
      return [arrived, this.trickOrTreat.knock(crossing.to) ?? this.travel.cross(crossing)];
    if (!outdoors) return [arrived];
    const found =
      outdoors.id === 'town' && !prop
        ? [...this.smallEvents.pickUp(here), ...this.holidays.pickUp(here)]
        : [];
    return [arrived, ...found, ...this.gathering.arriveAt(outdoors, here, prop)];
  }
}
