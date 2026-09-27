import { walkable, type PlacedProp, type TileMap } from '../../systems/grid';
import type { Tile } from '../../systems/pathfinding';
import type { ZoneId } from '../../types/ids';
import type { Stalls } from './Stalls';
import { covers, ringOf, type Entry, type Zone } from './Zone';

/** The town: its map, and the stalls that stand in it on their days. */
export class TownZone implements Zone {
  readonly id = 'town';
  readonly map: TileMap;
  readonly stalls: Stalls;

  constructor(map: TileMap, stalls: Stalls) {
    this.map = map;
    this.stalls = stalls;
  }

  get width(): number {
    return this.map.width;
  }

  get height(): number {
    return this.map.height;
  }

  /** Open ground, and not where the pop-up shop or the Moon Pie Man's cart stands today. */
  canWalk = (tx: number, ty: number): boolean =>
    walkable(this.map, tx, ty) &&
    !covers(this.stalls.popUp(), tx, ty) &&
    !covers(this.stalls.moonPieCart(), tx, ty);

  propAt(tx: number, ty: number): PlacedProp | undefined {
    const popUp = this.stalls.popUp();
    if (covers(popUp, tx, ty)) return popUp!;
    const cart = this.stalls.moonPieCart();
    if (covers(cart, tx, ty)) return cart!;
    return this.map.props.find((p) => covers(p, tx, ty));
  }

  standBeside(tx: number, ty: number): Tile[] {
    return ringOf(this.propAt(tx, ty) ?? { tx, ty, w: 1, h: 1 }, this.canWalk);
  }

  /** Back out of her front door, onto the step in front of it. */
  entry(): Entry {
    return { tile: this.map.spawn, facing: 'down' };
  }

  doorAt(_here: Tile, prop: PlacedProp | undefined): ZoneId | null {
    return prop?.id === 'homeHouse' ? 'home' : null;
  }
}
