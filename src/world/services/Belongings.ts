import type { Ware } from '../../data/shop';
import type { Bag } from '../Bag';
import type { EventBus } from '../eventBus';
import type { WorldState } from '../events';
import type { Home } from '../Home';
import type { Pets } from '../Pets';
import type { Wardrobe } from '../Wardrobe';
import type { Workbench } from './Workbench';

/**
 * Where something she's sold or given belongs: her bag, her storage chest, or her closet, walls
 * and floors, recipes or pets' accessories for good. One place, so a shop and a letter can't
 * disagree about it.
 */
export class Belongings {
  private readonly events: EventBus<WorldState>;
  private readonly bag: Bag;
  private readonly wardrobe: Wardrobe;
  private readonly home: Home;
  private readonly workbench: Workbench;
  private readonly pets: Pets;

  constructor(
    events: EventBus<WorldState>,
    kept: { bag: Bag; wardrobe: Wardrobe; home: Home; workbench: Workbench; pets: Pets },
  ) {
    this.events = events;
    ({
      bag: this.bag,
      wardrobe: this.wardrobe,
      home: this.home,
      workbench: this.workbench,
      pets: this.pets,
    } = kept);
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
}
