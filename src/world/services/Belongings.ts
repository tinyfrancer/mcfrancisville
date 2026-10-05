import type { Ware } from '../../data/shop';
import { everOf, keyOf, wareOf } from '../../systems/catalogue';
import type { Bag } from '../Bag';
import type { EventBus } from '../eventBus';
import type { WorldState } from '../events';
import type { Home } from '../Home';
import type { Pets } from '../Pets';
import type { Wardrobe } from '../Wardrobe';
import type { Yard } from '../Yard';
import type { Workbench } from './Workbench';

/** What of her belongings is saved: all she has ever had that the catalogue lists (save v41). */
export interface EverSnapshot {
  ever: string[];
}

/** What she keeps, and where. */
export interface Kept {
  bag: Bag;
  wardrobe: Wardrobe;
  home: Home;
  workbench: Workbench;
  pets: Pets;
  yard: Yard;
}

/**
 * Where something she's sold or given belongs: her bag, her storage chest, or her closet, walls
 * and floors, recipes or pets' accessories for good. One place, so a shop and a letter can't
 * disagree about it. It also remembers everything she has ever had of what Ollie's catalogue
 * lists (0.3's S1), whatever became of it: what came through here, and whatever else it finds
 * she has, in her bag, chest, rooms, yard, closet or on her pets.
 */
export class Belongings {
  private readonly events: EventBus<WorldState>;
  private readonly bag: Bag;
  private readonly wardrobe: Wardrobe;
  private readonly home: Home;
  private readonly workbench: Workbench;
  private readonly pets: Pets;
  private readonly yard: Yard;
  /** Her catalogue's keys, in the order she first had each. */
  private readonly had = new Set<string>();

  constructor(events: EventBus<WorldState>, kept: Kept, saved: readonly string[] = []) {
    this.events = events;
    ({
      bag: this.bag,
      wardrobe: this.wardrobe,
      home: this.home,
      workbench: this.workbench,
      pets: this.pets,
      yard: this.yard,
    } = kept);
    for (const key of saved) if (wareOf(key)) this.had.add(key);
    this.notice();
    // A squishy sold or given away the moment it came is had all the same.
    events.on('bag', () => this.noticeBag());
  }

  /** Everything she has ever had that the catalogue lists, in the order she first had it. */
  ever(): Ware[] {
    this.notice();
    return [...this.had].map(wareOf).filter((w) => w !== null);
  }

  /** Whether she has ever had one. */
  hasHad(ware: Ware): boolean {
    this.notice();
    return this.had.has(keyOf(ware));
  }

  /** Whether she already has something kept once (clothes, walls, floors, recipes, accessories). */
  owns(ware: Ware): boolean {
    if ('outfit' in ware) return this.wardrobe.owned.includes(ware.outfit);
    if ('wallpaper' in ware) return this.home.wallpapers.includes(ware.wallpaper);
    if ('flooring' in ware) return this.home.floorings.includes(ware.flooring);
    if ('recipe' in ware) return this.workbench.knows(ware.recipe);
    if ('accessory' in ware) return this.pets.owns(ware.accessory);
    return false;
  }

  /** Puts it where it belongs. False for something kept once that she has already. */
  receive(ware: Ware): boolean {
    for (const key of everOf(ownedOf([ware]))) this.had.add(key);
    if ('outfit' in ware) {
      if (!this.wardrobe.give(ware.outfit)) return false;
      this.events.emit('closet', this.wardrobe.owned);
      return true;
    }
    if ('wallpaper' in ware) return this.home.giveWallpaper(ware.wallpaper);
    if ('flooring' in ware) return this.home.giveFlooring(ware.flooring);
    if ('recipe' in ware) return this.workbench.learn(ware.recipe);
    if ('accessory' in ware) {
      if (!this.pets.give(ware.accessory)) return false;
      this.events.emit('pets', this.pets);
      return true;
    }
    if ('furniture' in ware) {
      this.home.store(ware.furniture);
      this.events.emit('home', this.home);
    } else {
      this.bag.add(ware.item, 1);
      this.events.emit('bag', this.bag.contents);
    }
    return true;
  }

  /** Counts what she has now, wherever it is. */
  private notice(): void {
    const pieces = [...this.home.everyPiece, ...this.yard.placed];
    const owned = {
      items: [
        ...this.bag.contents.map((s) => s.id),
        ...this.home.items.map((s) => s.id),
        ...pieces.flatMap((p) => (p.shows ? [p.shows] : [])),
      ],
      furniture: [...pieces.map((p) => p.id), ...this.home.stored.map((s) => s.id)],
      outfits: this.wardrobe.owned,
      wallpapers: this.home.wallpapers,
      floorings: this.home.floorings,
      accessories: this.pets.accessories,
    };
    for (const key of everOf(owned)) this.had.add(key);
  }

  private noticeBag(): void {
    const owned = ownedOf(this.bag.contents.map((s) => ({ item: s.id })));
    for (const key of everOf(owned)) this.had.add(key);
  }

  snapshot(): EverSnapshot {
    this.notice();
    return { ever: [...this.had] };
  }
}

/** Wares as the plain lists `everOf` reads. */
function ownedOf(wares: readonly Ware[]) {
  const ids = (kind: string) =>
    wares.flatMap((w) =>
      Object.entries(w)
        .filter(([k]) => k === kind)
        .map(([, id]) => id),
    );
  return {
    items: ids('item'),
    furniture: ids('furniture'),
    outfits: ids('outfit'),
    wallpapers: ids('wallpaper'),
    floorings: ids('flooring'),
    accessories: ids('accessory'),
  };
}
