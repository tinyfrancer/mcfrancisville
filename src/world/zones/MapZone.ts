import { doorStep } from '../../data/maps';
import { walkable, type PlacedProp, type TileMap } from '../../systems/grid';
import type { Tile } from '../../systems/pathfinding';
import { alongExit, exitAt, gateOf, landingOf } from '../../systems/zones';
import type { MapZoneId, ZoneId } from '../../types/ids';
import type { Stalls } from './Stalls';
import { covers, ringOf, type Crossing, type Entry, type Zone } from './Zone';

/**
 * A place outdoors, drawn from a map: the town, Whisperwood, Lantern Shore. The town also has the
 * stalls that stand in it on their days.
 */
export class MapZone implements Zone {
  readonly id: MapZoneId;
  readonly map: TileMap;
  readonly stalls: Stalls | null;
  /** Whether a place is open yet, for a way out with a gate across it. */
  private readonly isOpen: (zone: ZoneId) => boolean;

  constructor(
    id: MapZoneId,
    map: TileMap,
    stalls: Stalls | null = null,
    isOpen: (zone: ZoneId) => boolean = () => true,
  ) {
    this.id = id;
    this.map = map;
    this.stalls = stalls;
    this.isOpen = isOpen;
  }

  /**
   * The gates shut across ways out to places not yet open (the castle hill's, phase I). A shut
   * gate stands like a prop she walks up to, and the way through it opens with the place.
   */
  shutGates(): PlacedProp[] {
    return this.map.exits
      .filter((e) => e.gate && !this.isOpen(e.to))
      .map((e) => ({ id: 'gate' as const, ...gateOf(e, this) }));
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
    !covers(this.stalls?.popUp(), tx, ty) &&
    !covers(this.stalls?.moonPieCart(), tx, ty) &&
    !this.shutGates().some((g) => covers(g, tx, ty));

  propAt(tx: number, ty: number): PlacedProp | undefined {
    const popUp = this.stalls?.popUp();
    if (covers(popUp, tx, ty)) return popUp!;
    const cart = this.stalls?.moonPieCart();
    if (covers(cart, tx, ty)) return cart!;
    const gate = this.shutGates().find((g) => covers(g, tx, ty));
    if (gate) return gate;
    return this.map.props.find((p) => covers(p, tx, ty));
  }

  standBeside(tx: number, ty: number): Tile[] {
    return ringOf(this.propAt(tx, ty) ?? { tx, ty, w: 1, h: 1 }, this.canWalk);
  }

  /**
   * In from `from`: through the exit that leads back there, or out of a building's door onto the
   * step in front of it. From the world map, or from somewhere with no way here, at the spawn.
   */
  entry(from: ZoneId | null, along = 0): Entry {
    const exit = from === null ? undefined : this.map.exits.find((e) => e.to === from);
    if (exit) return landingOf(exit, this, along);
    const door = from === null ? undefined : this.map.doors.find((d) => d.to === from);
    const building = door && this.map.props.find((p) => p.id === door.prop);
    if (building) return { tile: doorStep(building), facing: 'down' };
    return { tile: this.map.spawn, facing: 'down' };
  }

  doorAt(here: Tile, prop: PlacedProp | undefined): Crossing | null {
    if (prop?.id === 'gate') {
      const exit = this.map.exits.find((e) =>
        covers({ ...gateOf(e, this), id: 'gate' }, prop.tx, prop.ty),
      );
      return exit ? { to: exit.to, along: 0 } : null;
    }
    if (prop) {
      const door = this.map.doors.find((d) => d.prop === prop.id);
      return door ? { to: door.to, along: 0 } : null;
    }
    const exit = exitAt(this.map.exits, here);
    return exit ? { to: exit.to, along: alongExit(exit, here) } : null;
  }
}
