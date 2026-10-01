import { OUTFITS, DEFAULT_LOOK, STARTER_WARDROBE } from '../data/outfits';
import { onWrist, putOn, repairLook, slipOff, type BraceletCount } from '../systems/wardrobe';
import type { BraceletId, ItemId, OutfitId } from '../types/ids';
import type { Look } from '../types/look';

/** What of her closet is saved: how she looks (null until the creator has run) and what she owns. */
export interface ClosetSnapshot {
  look: Look | null;
  wardrobe: OutfitId[];
}

/**
 * How she looks and what she owns. Every look that comes in, from a save or a sheet, is repaired
 * first, so what is drawn is always something the art can draw.
 */
export class Wardrobe {
  private current: Look;
  private chosen: boolean;
  readonly owned: OutfitId[];
  /** First-day pieces a save from before them didn't have, put in her closet as it loaded. */
  readonly added: readonly OutfitId[];
  /** How many of each bracelet are in her bag, to wear. */
  private readonly have: BraceletCount;

  /** `have` is her bag's count of each bracelet; without it, none can be worn. */
  constructor(saved?: Partial<ClosetSnapshot>, have: BraceletCount = () => 0) {
    this.have = have;
    const known = (saved?.wardrobe ?? STARTER_WARDROBE).filter((id) => id in OUTFITS);
    this.owned = [...new Set(known)];
    this.added = STARTER_WARDROBE.filter((id) => !this.owned.includes(id));
    this.owned.push(...this.added);
    this.chosen = saved?.look != null;
    this.current = repairLook(saved?.look ?? DEFAULT_LOOK, this.owned, have);
  }

  get look(): Look {
    return this.current;
  }

  /** False until she has been through the creator; the game opens it until then. */
  get created(): boolean {
    return this.chosen;
  }

  /** Puts a piece in her closet for good. False if it was already there. */
  give(id: OutfitId): boolean {
    if (this.owned.includes(id)) return false;
    this.owned.push(id);
    return true;
  }

  setLook(look: Look): void {
    this.current = repairLook(look, this.owned, this.have);
    this.chosen = true;
  }

  /** How many of something she has on her wrist. */
  wearing(id: ItemId): number {
    return onWrist(this.current, id);
  }

  /** Puts a bracelet from her bag on her wrist. False if none is spare or the stack is full. */
  wearBracelet(id: BraceletId): boolean {
    const next = putOn(this.current, id, this.have);
    if (next === this.current) return false;
    this.current = next;
    return true;
  }

  /** Slips a bracelet off her wrist; it stays in her bag. False if she wasn't wearing one. */
  takeOffBracelet(id: BraceletId): boolean {
    const next = slipOff(this.current, id);
    if (next === this.current) return false;
    this.current = next;
    return true;
  }

  snapshot(): ClosetSnapshot {
    return { look: this.chosen ? this.current : null, wardrobe: [...this.owned] };
  }
}
