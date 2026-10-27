import { PILE_FAMILIES } from '../../data/leafPiles';
import { dayKey } from '../../systems/clock';
import type { PlacedProp } from '../../systems/grid';
import { pileCandyOn, pileFindOn, pileKey } from '../../systems/leafPiles';
import type { ItemId, MapZoneId } from '../../types/ids';
import type { Bag } from '../Bag';
import type { WorldContext } from '../context';
import type { WorldEvent } from '../events';
import type { Home } from '../Home';
import type { MapZone } from '../zones/MapZone';
import type { Zones } from '../zones/Zones';
import type { Collecting } from './Collecting';
import type { SmallEvents } from './SmallEvents';
import type { Takings } from './Takings';
import type { Wallet } from './Wallet';

/** The keepsake of her very first jump. */
const GOLDEN_LEAF: ItemId = 'goldenLeaf';

export interface LeafPileKeeps {
  bag: Bag;
  wallet: Wallet;
  takings: Takings;
  home: Home;
}

export interface LeafPileParts {
  zones: Zones;
  collecting: Collecting;
  smallEvents: SmallEvents;
}

/**
 * Autumn's leaf piles (1.7's Y2, decision 389): which stand where today is the places' (`Piles`
 * in `world/zones/`); this is jumping in one. She lands in it with a crunch and it lies flat till
 * the window turns; the first jump of the day in each place always finds something: the golden
 * leaf the very first time, a lost thing lying in town, a critter rustling out for her net, or a
 * little Candy. Nothing about it is saved but the day's find, in her takings.
 */
export class LeafPiles {
  private readonly ctx: WorldContext;
  private readonly keeps: LeafPileKeeps;
  private readonly parts: LeafPileParts;

  constructor(ctx: WorldContext, keeps: LeafPileKeeps, parts: LeafPileParts) {
    this.ctx = ctx;
    this.keeps = keeps;
    this.parts = parts;
  }

  /** A place's piles today, each heaped or flat, for drawing. */
  piles(zone: MapZoneId): { pile: PlacedProp; flat: boolean }[] {
    const piles = this.parts.zones.outdoor(zone)?.piles;
    return piles ? piles.today().map((pile) => ({ pile, flat: piles.isFlat(pile) })) : [];
  }

  /** Whether she has the golden leaf anywhere: her bag, her chest or on show. */
  private hasGoldenLeaf(): boolean {
    const { bag, home } = this.keeps;
    const kept = home.items.find((s) => s.id === GOLDEN_LEAF)?.count ?? 0;
    return bag.count(GOLDEN_LEAF) + kept + home.rooms.onShow(GOLDEN_LEAF) > 0;
  }

  /** She has walked into a heaped pile in `place`: she jumps, and it's flat till the window turns. */
  jump(place: MapZone, pile: PlacedProp): WorldEvent[] {
    const piles = place.piles;
    if (!piles || piles.isFlat(pile)) return [];
    piles.flatten(pile);
    const tile = { tx: pile.tx, ty: pile.ty };
    const { takings, bag, wallet } = this.keeps;
    const key = pileKey(place.id);
    if (!takings.isReady(key)) return [{ kind: 'leapt', tile }];
    takings.take(key);
    if (!this.hasGoldenLeaf()) {
      bag.add(GOLDEN_LEAF, 1);
      this.ctx.events.emit('bag', bag.contents);
      return [{ kind: 'leapt', tile, item: GOLDEN_LEAF }];
    }
    const lost = place.id === 'town' ? this.parts.smallEvents.turnUp() : [];
    if (lost.length > 0) return [{ kind: 'leapt', tile }, ...lost];
    const day = dayKey(this.ctx.clock.now());
    const find = pileFindOn(place.id, day);
    if ('critter' in find) {
      const critter = this.parts.collecting.rustle(place.id, PILE_FAMILIES, tile);
      if (critter) return [{ kind: 'leapt', tile, critter }];
    }
    const candy = 'candy' in find ? find.candy : pileCandyOn(place.id, day);
    wallet.earn(candy);
    return [{ kind: 'leapt', tile, candy }];
  }
}
