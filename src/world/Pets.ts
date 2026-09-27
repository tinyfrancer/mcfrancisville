import {
  ACCESSORY_IDS,
  isAccessory,
  isPet,
  PET_IDS,
  PET_NAME_MAX,
  PETS,
  STARTER_PETS,
  type PetsSnapshot,
} from '../data/pets';
import type { AccessoryId, PetId } from '../types/ids';

/**
 * What she has of her pets that's worth keeping: their names, what they wear, the accessories she
 * owns, which one is out walking with her, and Fibi's bones. Where each one is standing isn't
 * kept: they're wherever they wander to (decisions.md 68).
 */
export class Pets {
  private walker: PetId | null;
  private readonly named = new Map<PetId, string>();
  private readonly worn = new Map<PetId, AccessoryId>();
  private readonly owned = new Set<AccessoryId>();
  private returned: number;
  private madeDay: string | null;

  /** An id a later build added, that this one doesn't know, is left out. */
  constructor(saved: Partial<PetsSnapshot> = STARTER_PETS) {
    const walking = saved.walking;
    this.walker = typeof walking === 'string' && isPet(walking) ? walking : null;
    for (const id of saved.accessories ?? []) if (isAccessory(id)) this.owned.add(id);
    for (const [id, name] of Object.entries(saved.names ?? {})) {
      if (isPet(id) && typeof name === 'string') this.rename(id, name);
    }
    for (const [id, what] of Object.entries(saved.wearing ?? {})) {
      if (isPet(id) && typeof what === 'string' && isAccessory(what) && this.owned.has(what)) {
        this.worn.set(id, what);
      }
    }
    const bones = saved.bones ?? 0;
    this.returned = Number.isInteger(bones) && bones >= 0 ? bones : 0;
    this.madeDay = typeof saved.happy === 'string' ? saved.happy : null;
  }

  /** The pet out walking with her, if any. */
  get walking(): PetId | null {
    return this.walker;
  }

  set walking(id: PetId | null) {
    this.walker = id;
  }

  nameOf(id: PetId): string {
    return this.named.get(id) ?? PETS[id].name;
  }

  /**
   * Gives a pet a name, trimmed and kept short. An empty one gives them back their own. Returns
   * the name they have now.
   */
  rename(id: PetId, name: string): string {
    const trimmed = name.replace(/\s+/g, ' ').trim().slice(0, PET_NAME_MAX).trim();
    if (trimmed === '' || trimmed === PETS[id].name) this.named.delete(id);
    else this.named.set(id, trimmed);
    return this.nameOf(id);
  }

  wearing(id: PetId): AccessoryId | null {
    return this.worn.get(id) ?? null;
  }

  /** Puts something she owns on a pet, or takes off what they're wearing. False if she hasn't it. */
  dress(id: PetId, what: AccessoryId | null): boolean {
    if (what === null) {
      this.worn.delete(id);
      return true;
    }
    if (!this.owned.has(what)) return false;
    this.worn.set(id, what);
    return true;
  }

  /** The accessories she owns, in the order the shop lists them. */
  get accessories(): AccessoryId[] {
    return ACCESSORY_IDS.filter((id) => this.owned.has(id));
  }

  owns(id: AccessoryId): boolean {
    return this.owned.has(id);
  }

  /** Gives her an accessory. False if she has it already. */
  give(id: AccessoryId): boolean {
    if (this.owned.has(id)) return false;
    this.owned.add(id);
    return true;
  }

  /** How many of Fibi's bones she has brought back. */
  get bones(): number {
    return this.returned;
  }

  /** Notes a bone brought back to Fibi on `day`. */
  boneBack(day: string): void {
    this.returned += 1;
    this.madeDay = day;
  }

  /** Whether she brought Fibi a bone on `day`, which makes her whole day. */
  fibiHappy(day: string): boolean {
    return this.madeDay === day;
  }

  snapshot(): PetsSnapshot {
    const names: PetsSnapshot['names'] = {};
    const wearing: PetsSnapshot['wearing'] = {};
    for (const id of PET_IDS) {
      const name = this.named.get(id);
      if (name !== undefined) names[id] = name;
      const worn = this.worn.get(id);
      if (worn !== undefined) wearing[id] = worn;
    }
    return {
      walking: this.walker,
      names,
      wearing,
      accessories: this.accessories,
      bones: this.returned,
      happy: this.madeDay,
    };
  }
}
