import { FURNITURE } from '../../data/furniture';
import { bedsInRoom, INTERIOR_IDS } from '../../data/interiors';
import type { TileMap } from '../../systems/grid';
import type { MapZoneId, VillagerId, ZoneId } from '../../types/ids';
import { Atlas } from '../Atlas';
import { Bag } from '../Bag';
import { Cabinet } from '../Cabinet';
import { Casebook } from '../Casebook';
import type { WorldContext } from '../context';
import { Dug } from '../Dug';
import { Farm, type Plot } from '../Farm';
import { Friends } from '../Friends';
import { Home } from '../Home';
import { Keepsakes } from '../Keepsakes';
import { Lately } from '../Lately';
import { Letters } from '../Letters';
import type { Movement } from '../Movement';
import type { WorldOptions } from '../options';
import { Pets } from '../Pets';
import { Porch } from '../Porch';
import { Wardrobe } from '../Wardrobe';
import { Takings } from '../services/Takings';
import { Wallet } from '../services/Wallet';
import { Yard } from '../Yard';
import { yardOf } from '../../systems/yard';

/** What a service reads of her and her neighbours, the same for each that asks. */
export interface TownReads {
  name: () => string;
  scene: () => ZoneId;
  zoneOf: (villager: VillagerId) => ZoneId;
  hearts: (villager: VillagerId) => number;
  thank: (villager: VillagerId, points: number) => void;
}

/** What she has and what's hers: the parts that keep something and need no service to be made. */
export interface Keepers {
  bag: Bag;
  wardrobe: Wardrobe;
  takings: Takings;
  home: Home;
  farm: Farm;
  friends: Friends;
  letters: Letters;
  cabinet: Cabinet;
  pets: Pets;
  casebook: Casebook;
  wallet: Wallet;
  atlas: Atlas;
  porch: Porch;
  keepsakes: Keepsakes;
  dug: Dug;
  /** What stands out in her yard (0.3's H5), the chest being her home's. */
  yard: Yard;
  /** What she has done lately, which her neighbours remember (V1's P1). */
  lately: Lately;
}

/** A place beyond the town with a map of its own, parsed once. */
export interface Beyond {
  id: MapZoneId;
  map: TileMap;
}

/**
 * What every area's services are made from (decisions.md 210, 218): the context, the keepers, the
 * town's reads, and the world's options, with what each service keeps from the save.
 */
export interface Shared extends Keepers {
  ctx: WorldContext;
  town: TownReads;
  options: WorldOptions;
  /** The town's map. */
  map: TileMap;
  /** The places beyond the town. */
  beyond: readonly Beyond[];
  /** Whether her neighbours live in the town's map (a test's small one has none). */
  peopled: boolean;
  /** Her walking, read when asked: she's stood somewhere only once the places are made. */
  movement: () => Movement;
}

/** Every keeper, each from what the save kept of it. */
export function keepersOf(
  ctx: WorldContext,
  options: WorldOptions,
  map: TileMap,
  beyond: readonly Beyond[],
): Keepers {
  const bag = new Bag(options.finds?.bag);
  // Her skates are hers from the first day (decision 211), in a bag from before then too.
  if (bag.count('iceSkates') === 0) bag.add('iceSkates', 1);
  const wardrobe = new Wardrobe(options.closet, (id) => bag.count(id));
  bag.keepWorn((id) => wardrobe.wearing(id));
  const takings = new Takings(ctx.clock, options.finds?.taken);
  const home = new Home(options.home);
  const farm = new Farm(
    {
      beds: Object.fromEntries([
        ['town', map.beds],
        ...beyond.map(({ id, map }) => [id, map.beds]),
        // The greenhouse's raised beds (0.3's F2).
        ...INTERIOR_IDS.map((id) => [id, bedsInRoom(id)]).filter(([, beds]) => beds!.length > 0),
      ]),
      rows: rowsOf(map, beyond),
      planters: () => home.placedIn('main').filter((p) => FURNITURE[p.id].planter),
    },
    {
      beds: options.beds,
      harvested: options.harvested,
      sprinklers: options.sprinklers,
      rows: options.farmRows,
    },
  );
  return {
    bag,
    wardrobe,
    takings,
    home,
    farm,
    friends: new Friends(options.friends),
    letters: new Letters(options.friends?.mail),
    cabinet: new Cabinet(options.cabinet),
    pets: new Pets(options.pets),
    casebook: new Casebook(options.mystery),
    wallet: new Wallet(ctx.events, options.candy),
    atlas: new Atlas(options.atlas),
    porch: new Porch(options.porch),
    keepsakes: new Keepsakes(options.keepsakes),
    dug: new Dug(options.dug),
    yard: new Yard(yardOf(map), home, options.yard),
    lately: new Lately(options.lately),
  };
}

/**
 * The farm's extension rows, by number, wherever each is kept: the town's two, then Boo Acres'
 * (0.3's F1), a row's tiles from whichever place's map keeps that number.
 */
function rowsOf(map: TileMap, beyond: readonly Beyond[]): Plot[][] {
  const places: readonly Beyond[] = [{ id: 'town', map }, ...beyond];
  const count = Math.max(...places.map((p) => p.map.plots.length));
  return Array.from({ length: count }, (_, i) =>
    places.flatMap(({ id, map }) => (map.plots[i] ?? []).map((t) => ({ zone: id, ...t }))),
  );
}
