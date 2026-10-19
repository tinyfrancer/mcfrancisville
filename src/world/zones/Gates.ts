import type { PlacedProp, TileMap } from '../../systems/grid';
import { gateOf } from '../../systems/zones';
import type { ZoneId } from '../../types/ids';
import type { Overlay } from './Overlay';
import { covers } from './Zone';

/**
 * The gates across a place's ways out (phase I, decision 104): one shut while the place beyond
 * isn't open stands like a prop she walks up to, and the way through it opens with the place.
 */
export class Gates implements Overlay {
  /** Every gate across a way out, and the place it opens to. */
  private readonly gates: readonly { to: ZoneId; prop: PlacedProp }[];
  private readonly isOpen: (zone: ZoneId) => boolean;

  constructor(map: TileMap, isOpen: (zone: ZoneId) => boolean) {
    this.isOpen = isOpen;
    this.gates = map.exits
      .filter((e) => e.gate)
      .map((e) => ({ to: e.to, prop: { id: 'gate' as const, ...gateOf(e, map) } }));
  }

  /** Whether the place has any gates at all. */
  get any(): boolean {
    return this.gates.length > 0;
  }

  /** The gates shut across ways out to places not yet open. */
  shut(): PlacedProp[] {
    return this.gates.filter((g) => !this.isOpen(g.to)).map((g) => g.prop);
  }

  /** The shut gate on a tile, if there is one: checked on every step of a path, so it's cheap. */
  propAt(tx: number, ty: number): PlacedProp | undefined {
    for (const g of this.gates) if (covers(g.prop, tx, ty) && !this.isOpen(g.to)) return g.prop;
    return undefined;
  }

  blocks(tx: number, ty: number): boolean {
    return this.propAt(tx, ty) !== undefined;
  }

  /** Where a gate she has walked up to goes, open or not. */
  to(prop: PlacedProp): ZoneId | undefined {
    return this.gates.find((g) => g.prop.tx === prop.tx && g.prop.ty === prop.ty)?.to;
  }
}
