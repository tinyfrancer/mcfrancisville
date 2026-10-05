import { doorStep } from '../../data/maps';
import { tileAt, walkable, type PlacedProp, type TileMap } from '../../systems/grid';
import type { Tile } from '../../systems/pathfinding';
import { alongExit, exitAt, gateOf, landingOf } from '../../systems/zones';
import type { MapZoneId, TileId, ZoneId } from '../../types/ids';
import type { Decorations } from './Decorations';
import type { Lots } from './Lots';
import type { Mounds } from './Mounds';
import type { Stalls } from './Stalls';
import type { Yard } from '../Yard';
import { footprint } from '../../systems/decor';
import { covers, ringOf, type Crossing, type Entry, type Zone } from './Zone';

/**
 * A place outdoors, drawn from a map: the town, Whisperwood, Lantern Shore. The town also has the
 * stalls that stand in it on their days and what stands in its square for a holiday (phase U), and
 * a place may have newcomers' lots (phase T).
 */
export class MapZone implements Zone {
  readonly id: MapZoneId;
  readonly map: TileMap;
  readonly stalls: Stalls | null;
  readonly lots: Lots | null;
  readonly decorations: Decorations | null;
  /** Whether a place is open yet, for a way out with a gate across it. */
  private readonly isOpen: (zone: ZoneId) => boolean;
  /** Every gate across a way out, and the place it opens to. */
  private readonly gates: readonly { to: ZoneId; prop: PlacedProp }[];
  /** Its open water, with nothing standing in it: what freezes over in winter (phase U). */
  private readonly water: ReadonlySet<number>;
  /** The farm's extension rows (0.2's N1): each kept tile's row, and how many are built. */
  private readonly plots: ReadonlyMap<number, number>;
  private readonly rowsBuilt: () => number;
  /** Her yard, in the town (0.3's H5): what of hers stands there is solid too. */
  readonly yard: Yard | null;
  /** The day's mound (0.3's C1), solid like any. */
  readonly mounds: Mounds | null;

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
  ) {
    this.id = id;
    this.mounds = mounds;
    this.yard = yard?.exists ? yard : null;
    this.rowsBuilt = rowsBuilt;
    this.plots = new Map(
      map.plots.flatMap((row, i) => row.map((t) => [t.ty * map.width + t.tx, i + 1] as const)),
    );
    this.map = map;
    this.stalls = stalls;
    this.lots = lots?.any ? lots : null;
    this.decorations = decorations;
    this.isOpen = isOpen;
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
    this.gates = map.exits
      .filter((e) => e.gate)
      .map((e) => ({ to: e.to, prop: { id: 'gate' as const, ...gateOf(e, map) } }));
  }

  /**
   * The gates shut across ways out to places not yet open (the castle hill's, phase I). A shut
   * gate stands like a prop she walks up to, and the way through it opens with the place.
   */
  shutGates(): PlacedProp[] {
    return this.gates.filter((g) => !this.isOpen(g.to)).map((g) => g.prop);
  }

  /** The shut gate on a tile, if there is one: checked on every step of a path, so it's cheap. */
  private shutGateAt(tx: number, ty: number): PlacedProp | undefined {
    for (const g of this.gates) if (covers(g.prop, tx, ty) && !this.isOpen(g.to)) return g.prop;
    return undefined;
  }

  get width(): number {
    return this.map.width;
  }

  get height(): number {
    return this.map.height;
  }

  /**
   * Open ground (or the pond, frozen over in winter), and not where the pop-up shop or the Moon Pie
   * Man's cart stands today, nor anything on a newcomer's lot, nor a holiday's piece in the square,
   * nor a piece of hers in her yard (0.3's H5).
   */
  canWalk = (tx: number, ty: number): boolean =>
    (walkable(this.map, tx, ty) || this.isIce(tx, ty)) &&
    !covers(this.stalls?.popUp(), tx, ty) &&
    !covers(this.stalls?.moonPieCart(), tx, ty) &&
    this.shutGateAt(tx, ty) === undefined &&
    this.lots?.propAt(tx, ty) === undefined &&
    this.decorations?.propAt(tx, ty) === undefined &&
    !this.isBuiltPlot(tx, ty) &&
    !this.yard?.blocks(tx, ty) &&
    !covers(this.mounds?.today(), tx, ty);

  /** Whether a tile kept for the farm is a bed now, its row built (0.2's N1). */
  isBuiltPlot(tx: number, ty: number): boolean {
    if (this.plots.size === 0 || tx < 0 || tx >= this.map.width) return false;
    const row = this.plots.get(ty * this.map.width + tx);
    return row !== undefined && row <= this.rowsBuilt();
  }

  /** The ground's tiles as they are now: the farm's built rows are beds, the pond frozen in winter. */
  groundTiles(): TileId[] {
    const { map } = this;
    return map.tiles.map((t, i) => {
      const tx = i % map.width;
      const ty = Math.floor(i / map.width);
      if (this.isBuiltPlot(tx, ty)) return 'bed';
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
    tileAt(this.map, tx, ty) === 'ice' || this.isIce(tx, ty);

  propAt(tx: number, ty: number): PlacedProp | undefined {
    const onLot = this.lots?.propAt(tx, ty);
    if (onLot) return onLot;
    const decoration = this.decorations?.propAt(tx, ty);
    if (decoration) return decoration;
    const popUp = this.stalls?.popUp();
    if (covers(popUp, tx, ty)) return popUp!;
    const cart = this.stalls?.moonPieCart();
    if (covers(cart, tx, ty)) return cart!;
    const gate = this.shutGateAt(tx, ty);
    if (gate) return gate;
    const mound = this.mounds?.today();
    if (covers(mound, tx, ty)) return mound!;
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

  doorAt(here: Tile, prop: PlacedProp | undefined): Crossing | null {
    if (prop?.id === 'gate') {
      const gate = this.gates.find((g) => g.prop.tx === prop.tx && g.prop.ty === prop.ty);
      return gate ? { to: gate.to, along: 0 } : null;
    }
    if (prop) {
      const door = this.map.doors.find((d) => d.prop === prop.id);
      return door ? { to: door.to, along: 0 } : null;
    }
    const exit = exitAt(this.map.exits, here);
    return exit ? { to: exit.to, along: alongExit(exit, here) } : null;
  }
}
