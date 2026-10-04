import { stowable } from '../../systems/chest';
import type { ItemId } from '../../types/ids';
import type { Bag, Stack } from '../Bag';
import type { WorldContext } from '../context';
import type { Home } from '../Home';

/** What the chest reaches into: her bag, her home, and whether she's in it. */
export interface ChestKeeps {
  bag: Bag;
  home: Home;
  atHome: () => boolean;
}

/**
 * Her storage chest's other half (0.3's H1): things from her bag put away at home, and taken out
 * again. Both move whole counts from one to the other, so nothing is lost on the way; her bag never
 * fills (decisions.md 32), so whatever is in the chest can always come back out.
 */
export class Chest {
  private readonly ctx: WorldContext;
  private readonly keeps: ChestKeeps;

  constructor(ctx: WorldContext, keeps: ChestKeeps) {
    this.ctx = ctx;
    this.keeps = keeps;
  }

  /** What's waiting in the chest from her bag. */
  get items(): readonly Stack[] {
    return this.keeps.home.items;
  }

  /** How many of something she could put away now: none unless she's home, where the chest is. */
  canPutAway(id: ItemId): number {
    return this.keeps.atHome() ? stowable(id, this.keeps.bag.spare(id)) : 0;
  }

  /** Puts `count` of something from her bag in the chest; false, and nothing moved, if she can't. */
  putAway(id: ItemId, count: number): boolean {
    if (!Number.isInteger(count) || count <= 0 || count > this.canPutAway(id)) return false;
    if (!this.keeps.bag.remove(id, count)) return false;
    this.keeps.home.keep(id, count);
    this.changed();
    return true;
  }

  /** Takes `count` of something out of the chest into her bag; false if there aren't that many. */
  takeOut(id: ItemId, count: number): boolean {
    if (!this.keeps.home.release(id, count)) return false;
    this.keeps.bag.add(id, count);
    this.changed();
    return true;
  }

  private changed(): void {
    this.ctx.events.emit('bag', this.keeps.bag.contents);
    this.ctx.events.emit('home', this.keeps.home);
  }
}
