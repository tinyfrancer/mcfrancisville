import { BURIED_IDS } from '../data/buried';
import type { BuriedId } from '../types/ids';

/** What of the buried things is saved: those she has dug up. */
export interface DugSnapshot {
  dug: BuriedId[];
}

/** The buried things she has dug up, each only ever once. */
export class Dug {
  private readonly dug: Set<BuriedId>;

  /** Something this build doesn't know as buried is left out. */
  constructor(saved: readonly string[] = []) {
    this.dug = new Set(BURIED_IDS.filter((id) => saved.includes(id)));
  }

  has(id: BuriedId): boolean {
    return this.dug.has(id);
  }

  add(id: BuriedId): void {
    this.dug.add(id);
  }

  snapshot(): DugSnapshot {
    return { dug: [...this.dug] };
  }
}
