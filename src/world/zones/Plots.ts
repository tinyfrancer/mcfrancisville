import type { TileMap } from '../../systems/grid';
import type { Overlay } from './Overlay';

/**
 * The farm's extension rows (0.2's N1): grass kept in a map until a `{ beds }` recipe builds
 * them, and beds from then, solid like every bed.
 */
export class Plots implements Overlay {
  private readonly width: number;
  /** Each kept tile's row, by its index in the map. */
  private readonly rows: ReadonlyMap<number, number>;
  private readonly built: () => number;

  constructor(map: TileMap, built: () => number) {
    this.width = map.width;
    this.built = built;
    this.rows = new Map(
      map.plots.flatMap((row, i) => row.map((t) => [t.ty * map.width + t.tx, i + 1] as const)),
    );
  }

  /** Whether the map keeps any tiles for the farm. */
  get any(): boolean {
    return this.rows.size > 0;
  }

  /** Whether a tile kept for the farm is a bed now, its row built. */
  blocks(tx: number, ty: number): boolean {
    if (this.rows.size === 0 || tx < 0 || tx >= this.width) return false;
    const row = this.rows.get(ty * this.width + tx);
    return row !== undefined && row <= this.built();
  }
}
