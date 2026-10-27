import { windowKey, type Clock } from '../../systems/clock';
import type { PlacedProp, TileMap } from '../../systems/grid';
import { pilesFallOn, pileSpots, pilesOn } from '../../systems/leafPiles';
import type { Tile } from '../../systems/pathfinding';
import type { MapZoneId } from '../../types/ids';
import { MinuteDay } from './MinuteDay';
import type { Overlay } from './Overlay';
import { covers } from './Zone';

/**
 * A place's leaf piles today (1.7's Y2, decision 389): in autumn, at the feet of a few of its
 * trees, dealt from the day key. Walkable, so walked through like the grass; one tapped is walked
 * into and jumped in, and lies flat till the window turns (kept here, never saved), when it's
 * only grass to a tap again.
 */
export class Piles implements Overlay {
  private readonly zone: MapZoneId;
  private readonly map: TileMap;
  private readonly clock: Clock;
  private readonly day: MinuteDay;
  private open: (tx: number, ty: number) => boolean = () => true;
  private cache: { day: string; piles: PlacedProp[] } | null = null;
  /** The piles jumped in this window, by tile. */
  private flat: { window: string; tiles: Set<string> } = { window: '', tiles: new Set() };

  constructor(zone: MapZoneId, map: TileMap, clock: Clock) {
    this.zone = zone;
    this.map = map;
    this.clock = clock;
    this.day = new MinuteDay(() => clock.now());
  }

  /** What's open ground in the place, which the piles keep to; told by the place it stands in. */
  ground(open: (tx: number, ty: number) => boolean): void {
    this.open = open;
  }

  /** Today's piles, heaped or flat. */
  today(): PlacedProp[] {
    const day = this.day.get();
    if (this.cache?.day !== day) {
      // Against the ground as it stands today (`MapZone.canWalk`): a project built, a stall out.
      const spots = pilesFallOn(day) ? pileSpots(this.zone, this.map, this.open) : [];
      this.cache = { day, piles: pilesOn(this.zone, spots, day) };
    }
    return this.cache.piles;
  }

  private flattened(): Set<string> {
    const window = windowKey(this.clock.now());
    if (this.flat.window !== window) this.flat = { window, tiles: new Set() };
    return this.flat.tiles;
  }

  /** Whether a pile lies flat, jumped in this window. */
  isFlat(pile: Tile): boolean {
    return this.flattened().has(`${pile.tx},${pile.ty}`);
  }

  /** She has jumped in it: flat till the window turns. */
  flatten(pile: Tile): void {
    this.flattened().add(`${pile.tx},${pile.ty}`);
  }

  /** A heaped pile on the tile, to be jumped in; a flat one is only grass. */
  propAt(tx: number, ty: number): PlacedProp | undefined {
    const pile = this.today().find((p) => covers(p, tx, ty));
    return pile && !this.isFlat(pile) ? pile : undefined;
  }

  blocks(): boolean {
    return false;
  }
}
