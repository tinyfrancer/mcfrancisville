import type { PetApi } from '../../hud/PetSheet';
import { CUES } from '../../audio/cues';
import { drawAccessoryIcon, drawPetPortrait } from '../../render/pets';
import { progressOf } from '../../systems/affection';
import type { ApiWiring, SheetApis } from './shared';

/** Her pets. */
export function petsApis({ world, sound, changed }: ApiWiring): Pick<SheetApis, 'pets'> {
  const pets: PetApi = {
    pet: (id) => ({
      name: world.pets.nameOf(id),
      wearing: world.pets.wearing(id),
      walking: world.pets.walking === id,
      level: world.pets.level(id),
      progress: progressOf(world.pets.points(id)),
      canTreat: world.petCare.canTreat(id),
    }),
    pat(id) {
      sound.cue(CUES.heart);
      changed();
      return world.petCare.patPet(id);
    },
    treat(id) {
      changed();
      return world.petCare.treat(id);
    },
    trick: (id) => world.petCare.trick(id),
    rename(id, name) {
      changed();
      return world.petCare.rename(id, name);
    },
    walk(id, on) {
      changed();
      world.petCare.walkWith(on ? id : null);
    },
    indoors: () => world.scene === 'home',
    accessories: () => world.pets.accessories,
    dress(id, accessory) {
      changed();
      world.petCare.dress(id, accessory);
    },
    hasBone: () => world.bag.count('fibisBone') > 0,
    returnBone() {
      changed();
      return world.petCare.returnBone();
    },
    endPet: () => world.petCare.endPet(),
    portrait: drawPetPortrait,
    accessoryIcon: drawAccessoryIcon,
  };
  return {
    pets,
  };
}
