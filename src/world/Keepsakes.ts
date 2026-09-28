import { keepsakes } from '../systems/interiors';
import type { FurnitureId } from '../types/ids';

/** What of her neighbours' keepsakes is saved: the ones she has been given. */
export interface KeepsakesSnapshot {
  keepsakes: FurnitureId[];
}

/** The keepsakes from her neighbours' houses she has been given one of, each only once. */
export class Keepsakes {
  private readonly given: Set<FurnitureId>;

  /** A piece this build doesn't know as a keepsake is left out. */
  constructor(saved: readonly FurnitureId[] = []) {
    const known = keepsakes();
    this.given = new Set(saved.filter((id) => known.has(id)));
  }

  has(id: FurnitureId): boolean {
    return this.given.has(id);
  }

  give(id: FurnitureId): void {
    this.given.add(id);
  }

  snapshot(): KeepsakesSnapshot {
    return { keepsakes: [...this.given] };
  }
}
