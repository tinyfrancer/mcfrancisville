import { doorStep } from '../../data/maps';
import { tileAt, walkable, type PlacedProp, type TileMap } from '../../systems/grid';
import type { Tile } from '../../systems/pathfinding';
import { alongExit, exitAt, landingOf } from '../../systems/zones';
import type { MapZoneId, TileId, ZoneId } from '../../types/ids';
import type { Decorations } from './Decorations';
import { Gates } from './Gates';
import type { Lots } from './Lots';
import type { Mounds } from './Mounds';
import type { Overlay } from './Overlay';
import { Plots } from './Plots';
import type { Sites } from './Sites';
import type { Stalls } from './Stalls';
import type { Yard } from '../Yard';
import { footprint } from '../../systems/decor';
import { covers, ringOf, type Crossing, type Entry, type Zone } from './Zone';

/**
 * A place outdoors, drawn from a map: the town, Whisperwood, Lantern Shore. Over the map stand its
 * overlays (1.1's W1, decision 340): the newcomers' lots (phase T), the day's decorations (phase
 * U), the project sites (V1's R4), the town's stalls on their days, a shut gate, today's mound
 * (0.3's C1), the farm's built rows (0.2's N1) and her yard (0.3's H5).
 */
export class MapZone implements Zone {
  readonly id: MapZoneId;
  readonly map: TileMap;
  readonly stalls: Stalls | null;
  readonly lots: Lots | null;
  readonly decorations: Decorations | null;
  /** The gates across its ways out, standing while the place beyond is shut. */
  private readonly gates: Gates;
  /** Its open water, with nothing standing in it: what freezes over in winter (phase U). */
  private readonly water: ReadonlySet<number>;
  /** The farm's extension rows (0.2's N1), beds once built. */
  private readonly plots: Plots;
  /**
   * What stands over the map, asked in this order what stands on a tile (the first to answer is
   * the prop there) and whether it's in the way; a new thing standing in a place is a line here.
   */
  private readonly overlays: readonly Overlay[];
  /** Her yard, in the town (0.3's H5): what of hers stands there is solid too. */
  readonly yard: Yard | null;
  /** The day's mound (0.3's C1), solid like any. */
  readonly mounds: Mounds | null;
  /** The town's projects going up here (V1's R4). */
  readonly sites: Sites | null;

  constructor(
    id: MapZoneId,
    map: TileMap,
    stalls: Stalls | null = null,
    isOpen: (zone: ZoneId) => boolean = () => true,
    lots: Lots | null = null,
    decorations: Decorations | null = null,
    rowsBuilt: () => number = () => 0,
    yard: Yard | null = null,
    mounds: Mounds | null = null,
    sites: Sites | null = null,
  ) {
    this.id = id;
    this.sites = sites?.any ? sites : null;
    this.mounds = mounds;
    this.yard = yard?.exists ? yard : null;
    this.plots = new Plots(map, rowsBuilt);
    this.map = map;
    this.stalls = stalls;
    this.lots = lots?.any ? lots : null;
    this.decorations = decorations;
    this.gates = new Gates(map, isOpen);
    const over: (Overlay | null)[] = [
      this.lots,
      this.decorations,
      this.sites,
      this.stalls,
      this.gates.any ? this.gates : null,
      this.mounds,
      this.plots.any ? this.plots : null,
      this.yard,
    ];
    this.overlays = over.filter((o) => o !== null);
    const standing = new Set(
      map.props.flatMap((p) =>
        Array.from(
          { length: p.w * p.h },
          (_, i) => (p.ty + Math.floor(i / p.w)) * map.width + p.tx + (i % p.w),
        ),
      ),
    );
    this.water = new Set(
      map.tiles.flatMap((t, i) => (t === 'water' && decorations && !standing.has(i) ? [i] : [])),
    );
  }

  /**
   * The gates shut across ways out to places not yet open (the castle hill's, phase I). A shut
   * gate stands like a prop she walks up to, and the way through it opens with the place.
   */
  shutGates(): PlacedProp[] {
    return this.gates.shut();
  }

  get width(): number {
    return this.map.width;
  }

  get height(): number {
    return this.map.height;
  }

  /** Open ground (or the pond, frozen over in winter), with nothing standing over it. */
  canWalk = (tx: number, ty: number): boolean => {
    if (!walkable(this.map, tx, ty) && !this.isIce(tx, ty)) return false;
    for (const overlay of this.overlays) if (overlay.blocks(tx, ty)) return false;
    return true;
  };

  /** Whether a tile kept for the farm is a bed now, its row built (0.2's N1). */
  isBuiltPlot(tx: number, ty: number): boolean {
    return this.plots.blocks(tx, ty);
  }

  /** The ground's tiles as they are now: the farm's built rows are beds, the pond frozen in winter. */
  groundTiles(): TileId[] {
    const { map } = this;
    return map.tiles.map((t, i) => {
      const tx = i % map.width;
      const ty = Math.floor(i / map.width);
      if (this.isBuiltPlot(tx, ty)) return 'bed';
      // A built project's planters are beds (V1's R4); the footbridge is drawn over the ice.
      if (this.sites?.isBed(tx, ty)) return 'bed';
      return this.isIce(tx, ty) ? 'ice' : t;
    });
  }

  /** Whether a tile is the pond's water, frozen over today (phase U): walked on, not fished. */
  isIce(tx: number, ty: number): boolean {
    if (this.water.size === 0 || tx < 0 || tx >= this.map.width) return false;
    return this.water.has(ty * this.map.width + tx) && this.decorations!.frozen;
  }

  /**
   * Ice: the frozen creek, or the pond frozen over today. Anyone may walk on it, but she needs her
   * skates (phase B1), so the way on to Lantern Shore reads the same as the way it opens.
   */
  slippery = (tx: number, ty: number): boolean =>
    (tileAt(this.map, tx, ty) === 'ice' || this.isIce(tx, ty)) && !this.sites?.isDeck(tx, ty);

  propAt(tx: number, ty: number): PlacedProp | undefined {
    for (const overlay of this.overlays) {
      const prop = overlay.propAt?.(tx, ty);
      if (prop) return prop;
    }
    return this.map.props.find((p) => covers(p, tx, ty));
  }

  standBeside(tx: number, ty: number): Tile[] {
    const piece = this.propAt(tx, ty) ? undefined : this.yard?.pieceAt(tx, ty);
    const box = piece && { tx: piece.tx, ty: piece.ty, ...footprint(piece.id, piece.turn) };
    return ringOf(this.propAt(tx, ty) ?? box ?? { tx, ty, w: 1, h: 1 }, this.canWalk);
  }

  /**
   * In from `from`: through the exit that leads back there, or out of a building's door onto the
   * step in front of it. From the world map, or from somewhere with no way here, at the spawn.
   */
  entry(from: ZoneId | null, along = 0): Entry {
    const exit = from === null ? undefined : this.map.exits.find((e) => e.to === from);
    if (exit) return landingOf(exit, this, along);
    const door = from === null ? undefined : this.map.doors.find((d) => d.to === from);
    const building =
      door && (this.map.props.find((p) => p.id === door.prop) ?? this.lots?.house(door.prop));
    if (building) return { tile: doorStep(building), facing: 'down' };
    return { tile: this.map.spawn, facing: 'down' };
  }

  /** The building here whose door goes into `inside`, if one does (V1's R2). */
  buildingOf(inside: ZoneId): PlacedProp | undefined {
    const door = this.map.doors.find((d) => d.to === inside);
    return door && (this.map.props.find((p) => p.id === door.prop) ?? this.lots?.house(door.prop));
  }

  doorAt(here: Tile, prop: PlacedProp | undefined): Crossing | null {
    if (prop?.id === 'gate') {
      const to = this.gates.to(prop);
      return to ? { to, along: 0 } : null;
    }
    if (prop) {
      const door = this.map.doors.find((d) => d.prop === prop.id);
      return door ? { to: door.to, along: 0 } : null;
    }
    const exit = exitAt(this.map.exits, here);
    return exit ? { to: exit.to, along: alongExit(exit, here) } : null;
  }
}
