import { ZONES } from '../data/zones';
import type { ZoneId } from '../types/ids';

/** What of her travels is saved: the places she has found, and those opened to her. */
export interface AtlasSnapshot {
  /** Every place she has been, in the order she found them. */
  found: ZoneId[];
  /** The places that were shut and have opened; one open from the first day isn't listed. */
  opened: ZoneId[];
}

function isZone(id: unknown): id is ZoneId {
  return typeof id === 'string' && id in ZONES;
}

/** The places she has found, and opened. Once found or opened, a place stays so. */
export class Atlas {
  private readonly foundSet: Set<ZoneId>;
  private readonly openedSet: Set<ZoneId>;

  /** A place a later build added, that this one doesn't know, is left out. */
  constructor(saved: Partial<AtlasSnapshot> = {}) {
    this.foundSet = new Set(['town', 'home', ...(saved.found ?? []).filter(isZone)]);
    this.openedSet = new Set((saved.opened ?? []).filter(isZone));
  }

  hasFound(zone: ZoneId): boolean {
    return this.foundSet.has(zone);
  }

  /** She has been somewhere. True the first time. */
  find(zone: ZoneId): boolean {
    if (this.foundSet.has(zone)) return false;
    this.foundSet.add(zone);
    return true;
  }

  isOpened(zone: ZoneId): boolean {
    return this.openedSet.has(zone);
  }

  /** A shut place opens. True the first time. */
  open(zone: ZoneId): boolean {
    if (this.openedSet.has(zone)) return false;
    this.openedSet.add(zone);
    return true;
  }

  snapshot(): AtlasSnapshot {
    return { found: [...this.foundSet], opened: [...this.openedSet] };
  }
}
